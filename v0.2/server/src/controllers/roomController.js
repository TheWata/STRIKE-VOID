const { rooms, createRoom } = require('../models/RoomModel');
const { BOT_NAMES, createPlayer } = require('../models/PlayerModel');
const { uuid, generateRoomCode } = require('../helpers/idHelper');
const {
  MIN_MAX_HP,
  MAX_MAX_HP,
  MIN_HAND_CARDS,
  MAX_HAND_CARDS,
  clampNumber,
  clampInitialHandCards,
  clampDiscardLimit,
} = require('../helpers/validators');
const { toast } = require('../helpers/logger');
const {
  getPlayer,
  getPublicRoomsList,
  applyMaxHp,
  applyMaxHandCards,
  sanitizeStateForClients,
  emitRoomState,
  resetToLobby,
  handlePlayerLeave,
} = require('../services/roomService');
const { startGame } = require('../services/gameEngineService');

function registerRoomHandlers(io, socket) {
  socket.emit('public_rooms_updated', getPublicRoomsList());

  socket.on('get_public_rooms', () => {
    socket.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('create_room', ({ playerName, roomName, isPublic, initialHandCards } = {}) => {
    if (socket.data?.roomCode) {
      handlePlayerLeave(io, socket);
    }

    const cleanPlayer = String(playerName || '').trim().slice(0, 16) || 'JOGADOR_1';
    const cleanRoom =
      String(roomName || '').trim().slice(0, 24) || `SALA DE ${cleanPlayer.toUpperCase()}`;
    const code = generateRoomCode(rooms);

    const room = createRoom({
      code,
      name: cleanRoom,
      hostId: socket.id,
      isPublic: isPublic !== false,
      initialHandCards,
    });

    const hostPlayer = createPlayer(socket.id, cleanPlayer, false, room.gameState.settings.maxHp);
    room.players.push(hostPlayer);
    rooms.set(code, room);

    socket.join(code);
    socket.data = socket.data || {};
    socket.data.roomCode = code;

    const sanitized = sanitizeStateForClients(room, socket.id);
    socket.emit('room_joined', { roomState: sanitized });
    emitRoomState(io, room);

    if (room.isPublic) {
      io.emit('public_rooms_updated', getPublicRoomsList());
    }
  });

  socket.on('join_room', ({ playerName, roomCode } = {}) => {
    if (!roomCode) {
      return socket.emit('room_error', { message: 'Código de sala é obrigatório.' });
    }

    const normalizedCode = String(roomCode).toUpperCase().trim();
    const room = rooms.get(normalizedCode);

    if (!room) {
      return socket.emit('room_error', {
        message: 'Sala não encontrada. Verifique o código.',
      });
    }

    if (room.status !== 'LOBBY') {
      return socket.emit('room_error', {
        message: 'A partida nesta sala já está em andamento.',
      });
    }

    if (room.players.length >= room.maxPlayers) {
      return socket.emit('room_error', {
        message: 'Esta sala já atingiu a capacidade máxima (8 jogadores).',
      });
    }

    if (socket.data?.roomCode && socket.data.roomCode !== normalizedCode) {
      handlePlayerLeave(io, socket);
    }

    const cleanPlayer =
      String(playerName || '').trim().slice(0, 16) || `JOGADOR_${room.players.length + 1}`;

    let player = getPlayer(room, socket.id);
    if (!player) {
      player = createPlayer(socket.id, cleanPlayer, false, room.gameState.settings.maxHp);
      room.players.push(player);
    } else {
      player.name = cleanPlayer;
    }

    socket.join(normalizedCode);
    socket.data = socket.data || {};
    socket.data.roomCode = normalizedCode;

    const sanitized = sanitizeStateForClients(room, socket.id);
    socket.emit('room_joined', { roomState: sanitized });
    emitRoomState(io, room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('leave_room', () => {
    handlePlayerLeave(io, socket);
    socket.emit('left_room');
  });

  socket.on('toggle_room_privacy', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.isPublic = !room.isPublic;
    emitRoomState(io, room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('add_bot', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;
    if (room.players.length >= room.maxPlayers) {
      return toast(io, socket.id, 'Sala cheia (8 jogadores).');
    }
    const used = room.players.filter((p) => p.isBot).map((p) => p.name);
    const name = BOT_NAMES.find((n) => !used.includes(n)) || 'BOT_' + uuid().slice(0, 4);
    room.players.push(
      createPlayer('bot-' + uuid(), name, true, room.gameState.settings.maxHp)
    );
    emitRoomState(io, room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('remove_bot', (botId) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;
    const bot = getPlayer(room, botId);
    if (!bot || !bot.isBot) return;
    room.players = room.players.filter((p) => p.id !== botId);
    emitRoomState(io, room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('kick_player', ({ targetId } = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;
    if (targetId === socket.id) return;

    const targetPlayer = getPlayer(room, targetId);
    if (!targetPlayer) return;

    if (targetPlayer.isBot) {
      room.players = room.players.filter((p) => p.id !== targetId);
    } else {
      const targetSocket = io.sockets.sockets.get(targetId);
      if (targetSocket) {
        targetSocket.leave(room.code);
        targetSocket.data.roomCode = null;
        targetSocket.emit('kicked_from_room', {
          message: 'Você foi expulso da sala pelo líder.',
        });
      }
      room.players = room.players.filter((p) => p.id !== targetId);
    }

    emitRoomState(io, room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('update_settings', (newSettings = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    const s = room.gameState.settings;
    if (typeof newSettings.useFixedTime === 'boolean') s.useFixedTime = newSettings.useFixedTime;
    s.baseTestTime = clampNumber(newSettings.baseTestTime, 5, 40, s.baseTestTime);
    s.secondsPerPlayer = clampNumber(newSettings.secondsPerPlayer, 1, 5, s.secondsPerPlayer);
    s.damagePenalty = clampNumber(newSettings.damagePenalty, 0, 0.5, s.damagePenalty);
    s.analysisDuration = clampNumber(newSettings.analysisDuration, 3, 20, s.analysisDuration);

    if (room.status === 'LOBBY') {
      if (newSettings.maxHp !== undefined) applyMaxHp(room, newSettings.maxHp);
      if (newSettings.initialHandCards !== undefined) {
        s.initialHandCards = clampInitialHandCards(newSettings.initialHandCards);
      }
      if (newSettings.maxHandCards !== undefined) {
        applyMaxHandCards(room, newSettings.maxHandCards);
      }
      if (s.maxHandCards < s.initialHandCards) {
        s.maxHandCards = s.initialHandCards;
      }
      if (newSettings.discardLimit !== undefined) {
        s.discardLimit = clampDiscardLimit(newSettings.discardLimit);
      }
    }
    emitRoomState(io, room);
  });

  socket.on('set_max_hp', ({ maxHp } = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.status !== 'LOBBY') {
      return toast(io, socket.id, 'A vida inicial só pode ser alterada no Lobby.');
    }
    const n = Math.round(Number(maxHp));
    if (!Number.isFinite(n) || n < MIN_MAX_HP || n > MAX_MAX_HP) {
      return toast(
        io,
        socket.id,
        `A vida inicial deve estar entre ${MIN_MAX_HP} e ${MAX_MAX_HP}.`
      );
    }
    applyMaxHp(room, n);
    emitRoomState(io, room);
  });

  socket.on('set_max_hand_cards', ({ maxHandCards } = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.status !== 'LOBBY') {
      return toast(io, socket.id, 'O limite de cartas só pode ser alterado no Lobby.');
    }
    const n = Math.round(Number(maxHandCards));
    if (!Number.isFinite(n) || n < MIN_HAND_CARDS || n > MAX_HAND_CARDS) {
      return toast(
        io,
        socket.id,
        `O limite de cartas deve estar entre ${MIN_HAND_CARDS} e ${MAX_HAND_CARDS}.`
      );
    }
    applyMaxHandCards(room, n);
    emitRoomState(io, room);
  });

  socket.on('start_game', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;
    if (room.players.length < room.minPlayers) {
      return toast(
        io,
        socket.id,
        `Mínimo de ${room.minPlayers} jogadores para iniciar. Adicione bots ou convide amigos.`
      );
    }
    startGame(io, room);
  });

  socket.on('restart_game', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'GAME_OVER') return;
    resetToLobby(io, room);
  });

  socket.on('disconnect', () => {
    handlePlayerLeave(io, socket);
  });
}

module.exports = {
  registerRoomHandlers,
};

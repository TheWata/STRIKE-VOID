const { rooms } = require('../models/RoomModel');
const { resetPlayerForMatch } = require('../models/PlayerModel');
const { REVEAL_ORDER } = require('../models/CardModel');
const {
  DEFAULT_HAND_CARDS,
  clampMaxHp,
  clampHandCards,
} = require('../helpers/validators');
const { addLog } = require('../helpers/logger');

const getPlayer = (room, id) => room.players.find((p) => p.id === id);
const alivePlayers = (room) => room.players.filter((p) => p.isAlive);
const connectedHumans = (io, room) =>
  room.players.filter((p) => !p.isBot && io.sockets.sockets.has(p.id));

function getPublicRoomsList() {
  const list = [];
  for (const [, room] of rooms.entries()) {
    if (room.isPublic && room.status === 'LOBBY') {
      list.push({
        code: room.code,
        name: room.name,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
      });
    }
  }
  return list;
}

function applyMaxHp(room, value) {
  const hp = clampMaxHp(value, room.gameState.settings.maxHp);
  room.gameState.settings.maxHp = hp;
  room.players.forEach((p) => {
    p.lives = hp;
    p.maxLives = hp;
  });
  return hp;
}

function applyMaxHandCards(room, value) {
  const cards = clampHandCards(value, room.gameState.settings.maxHandCards);
  room.gameState.settings.maxHandCards = cards;
  return cards;
}

function sanitizeStateForClients(room, viewerId) {
  const revealed = REVEAL_ORDER[room.gameState.phase] || [];
  const currentRound = room.gameState.round;

  return {
    you: viewerId,
    roomCode: room.code,
    roomName: room.name,
    hostId: room.hostId,
    isPublic: room.isPublic,
    roomStatus: room.status,
    minPlayers: room.minPlayers,
    maxPlayers: room.maxPlayers,
    phase: room.gameState.phase,
    round: room.gameState.round,
    isPaused: room.gameState.isPaused,
    settings: room.gameState.settings,
    maxHp: room.gameState.settings.maxHp,
    maxHandCards: room.gameState.settings.maxHandCards || DEFAULT_HAND_CARDS,
    logs: room.gameState.logs.slice(-120),
    winner: room.gameState.winner,
    deckCount: room.gameState.deck ? room.gameState.deck.length : 0,
    players: room.players.map((p) => {
      const isMe = p.id === viewerId;
      const isHandRevealed = Boolean(
        p.handRevealedUntilRound && p.handRevealedUntilRound >= currentRound
      );
      let action = null;
      if (p.selectedAction) {
        const a = p.selectedAction;
        if (isMe && room.gameState.phase === 'PLANNING') {
          action = { ...a };
        } else if (
          revealed.includes(a.cardType) ||
          (a.status === 'REFLECTED' && room.gameState.phase !== 'PLANNING')
        ) {
          action = { ...a };
        } else {
          action = { hidden: true, cardType: null, targetId: null, status: 'PENDING' };
        }
      }
      return {
        id: p.id,
        name: p.name,
        isBot: p.isBot,
        lives: p.lives,
        maxLives: p.maxLives,
        hp: p.lives,
        maxHp: p.maxLives,
        isAlive: p.isAlive,
        isWalled: p.isWalled,
        isReflecting: p.isReflecting,
        knifeDamage: p.knifeDamage || 1,
        bloodPactWith: p.bloodPactWith || [],
        deathMarkTurns: p.deathMarkTurns ?? null,
        isHandRevealed,
        revealedHand: isHandRevealed ? p.hand : null,
        hand: isMe ? p.hand : isHandRevealed ? p.hand : [],
        handCount: p.hand ? p.hand.length : 0,
        selectedAction: action,
        lockedIn: p.lockedIn,
        allowedTime: p.allowedTime,
        visualEffect: p.visualEffect,
      };
    }),
  };
}

function emitRoomState(io, room) {
  for (const p of room.players) {
    if (!p.isBot) {
      const sanitized = sanitizeStateForClients(room, p.id);
      io.to(p.id).emit('game_state', sanitized);
      io.to(p.id).emit('room_updated', { roomState: sanitized });
    }
  }
}

function resetToLobby(io, room) {
  room.gameState.gameToken++;
  if (room.gameState.planningInterval) {
    clearInterval(room.gameState.planningInterval);
    room.gameState.planningInterval = null;
  }
  room.status = 'LOBBY';
  room.gameState.phase = 'LOBBY';
  room.gameState.round = 0;
  room.gameState.isPaused = false;
  room.gameState.deck = [];
  room.gameState.discardPile = [];
  room.gameState.logs = [];
  room.gameState.winner = null;

  room.players = room.players.filter((p) => p.isBot || io.sockets.sockets.has(p.id));
  room.players.forEach((p) => {
    resetPlayerForMatch(p, room.gameState.settings.maxHp);
  });
  emitRoomState(io, room);
  io.emit('public_rooms_updated', getPublicRoomsList());
}

function cleanUpRoom(io, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.gameState.gameToken++;
  if (room.gameState.planningInterval) {
    clearInterval(room.gameState.planningInterval);
    room.gameState.planningInterval = null;
  }
  rooms.delete(roomCode);
  io.emit('public_rooms_updated', getPublicRoomsList());
}

function handlePlayerLeave(io, socket) {
  const roomCode = socket.data?.roomCode;
  if (!roomCode) return;
  const room = rooms.get(roomCode);
  if (!room) {
    socket.data.roomCode = null;
    return;
  }

  socket.leave(roomCode);
  socket.data.roomCode = null;

  const player = getPlayer(room, socket.id);
  if (!player) return;

  if (room.status === 'LOBBY') {
    room.players = room.players.filter((p) => p.id !== socket.id);
  } else {
    player.isAlive = false;
    player.lives = 0;
    player.isWalled = false;
    player.bloodPactWith = [];
    player.deathMarkTurns = null;
    room.players.forEach((other) => {
      if (other.bloodPactWith) {
        other.bloodPactWith = other.bloodPactWith.filter((id) => id !== player.id);
      }
    });
    if (!player.lockedIn) {
      player.lockedIn = true;
      player.selectedAction = {
        cardType: 'NONE',
        targetId: null,
        originalTargetId: null,
        status: 'PENDING',
      };
    }
    addLog(room, 'DEATH', '💀 ' + player.name + ' abandonou a mesa.');
  }

  const humans = connectedHumans(io, room);
  if (humans.length === 0) {
    cleanUpRoom(io, roomCode);
    return;
  }

  if (room.hostId === socket.id) {
    const nextHost = humans[0];
    if (nextHost) {
      room.hostId = nextHost.id;
      io.to(room.code).emit('host_migrated', { newHostId: room.hostId });
    }
  }

  emitRoomState(io, room);
  io.emit('public_rooms_updated', getPublicRoomsList());
}

module.exports = {
  getPlayer,
  alivePlayers,
  connectedHumans,
  getPublicRoomsList,
  applyMaxHp,
  applyMaxHandCards,
  sanitizeStateForClients,
  emitRoomState,
  resetToLobby,
  cleanUpRoom,
  handlePlayerLeave,
};

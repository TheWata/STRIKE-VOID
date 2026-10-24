const { rooms } = require('../models/RoomModel');
const { DEFAULT_DISCARD_LIMIT } = require('../helpers/validators');
const { toast } = require('../helpers/logger');
const { getPlayer, emitRoomState } = require('../services/roomService');
const { applyAction, passAction } = require('../services/gameEngineService');

function registerGameHandlers(io, socket) {
  socket.on('select_action', ({ cardId, targetId } = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'PLANNING') return;
    const player = getPlayer(room, socket.id);
    if (!player || !player.isAlive || player.lockedIn) return;

    const result = applyAction(room, player, cardId, targetId);
    if (!result.ok) return toast(io, socket.id, result.error);
    emitRoomState(io, room);
  });

  socket.on('pass_turn', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'PLANNING') return;
    const player = getPlayer(room, socket.id);
    if (!player || !player.isAlive || player.lockedIn) return;

    passAction(player);
    emitRoomState(io, room);
  });

  socket.on('discard_cards', ({ cardIds = [] } = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'PLANNING') return;
    const player = getPlayer(room, socket.id);
    if (!player || !player.isAlive || player.lockedIn) return;

    const limit = room.gameState.settings.discardLimit ?? DEFAULT_DISCARD_LIMIT;
    const ids = Array.isArray(cardIds) ? cardIds : [];

    if (limit === 0 && ids.length > 0) {
      return toast(io, socket.id, 'O descarte de cartas está desativado nesta sala.');
    }

    if (ids.length > limit) {
      return toast(
        io,
        socket.id,
        `Você só pode descartar até ${limit} carta(s) por rodada.`
      );
    }

    const removedCards = [];
    for (const cid of ids) {
      const idx = player.hand.findIndex((c) => c.id === cid);
      if (idx !== -1) {
        const [card] = player.hand.splice(idx, 1);
        room.gameState.discardPile.push(card);
        removedCards.push(card);
      }
    }

    player.selectedAction = {
      cardType: removedCards.length > 0 ? 'DISCARD' : 'NONE',
      discardedCount: removedCards.length,
      targetId: null,
      originalTargetId: null,
      status: 'PENDING',
    };
    player.lockedIn = true;
    emitRoomState(io, room);
  });

  socket.on('toggle_pause', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'ANALYSIS' || !getPlayer(room, socket.id)) return;
    room.gameState.isPaused = !room.gameState.isPaused;
    emitRoomState(io, room);
  });

  socket.on('skip_analysis', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'ANALYSIS' || !getPlayer(room, socket.id)) return;
    room.gameState.skipAnalysisFlag = true;
    room.gameState.isPaused = false;
  });
}

module.exports = {
  registerGameHandlers,
};

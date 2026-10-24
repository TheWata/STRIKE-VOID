const { rooms } = require('../models/RoomModel');
const { addLog } = require('../helpers/logger');
const { getPlayer, emitRoomState } = require('../services/roomService');

function registerChatHandlers(io, socket) {
  socket.on('send_chat', ({ text } = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = getPlayer(room, socket.id);
    if (!player) return;

    const clean = String(text || '').trim().slice(0, 140);
    if (!clean) return;

    const isDead = !player.isAlive && room.gameState.phase !== 'LOBBY';
    const logType = isDead ? 'CHAT_DEAD' : 'CHAT';
    const prefix = isDead ? `💀 [ALÉM] ${player.name}: ` : `💬 ${player.name}: `;

    addLog(room, logType, `${prefix}${clean}`, {
      senderId: player.id,
      senderName: player.name,
      isDead,
      chatMessage: clean,
    });

    emitRoomState(io, room);
  });
}

module.exports = {
  registerChatHandlers,
};

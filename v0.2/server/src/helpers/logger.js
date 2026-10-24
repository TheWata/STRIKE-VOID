function addLog(room, type, text, meta = {}) {
  room.gameState.logs.push({
    id: ++room.gameState.logCounter,
    round: room.gameState.round,
    type,
    text,
    timestamp: Date.now(),
    ...meta,
  });
  if (room.gameState.logs.length > 300) room.gameState.logs.shift();
}

function toast(io, socketId, message) {
  io.to(socketId).emit('error_message', message);
}

module.exports = {
  addLog,
  toast,
};

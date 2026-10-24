const crypto = require('crypto');

let uuid;
try {
  uuid = require('uuid').v4;
  if (typeof uuid !== 'function') throw new Error('no v4');
} catch (_e) {
  uuid = () => crypto.randomUUID();
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem 0, O, 1, I

function generateRoomCode(roomsMap) {
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
    }
  } while (roomsMap && roomsMap.has(code));
  return code;
}

module.exports = {
  uuid,
  generateRoomCode,
};

import { socket } from '../lib/socket';
import { audio } from '../lib/audio';

export const socketService = {
  socket,
  joinRoom(playerName, roomCode) {
    socket.emit('join_room', { playerName, roomCode });
  },
  createRoom({ playerName, roomName, isPublic, initialHandCards }) {
    socket.emit('create_room', { playerName, roomName, isPublic, initialHandCards });
  },
  leaveRoom() {
    socket.emit('leave_room');
  },
  refreshPublicRooms() {
    socket.emit('get_public_rooms');
  },
  togglePrivacy() {
    socket.emit('toggle_room_privacy');
  },
  addBot() {
    socket.emit('add_bot');
  },
  removeBot(botId) {
    socket.emit('remove_bot', botId);
  },
  kickPlayer(targetId) {
    socket.emit('kick_player', { targetId });
  },
  updateSettings(settings) {
    socket.emit('update_settings', settings);
  },
  setMaxHp(maxHp) {
    socket.emit('set_max_hp', { maxHp });
  },
  setMaxHandCards(maxHandCards) {
    socket.emit('set_max_hand_cards', { maxHandCards });
  },
  startGame() {
    socket.emit('start_game');
  },
  restartGame() {
    socket.emit('restart_game');
  },
  selectAction(cardId, targetId) {
    socket.emit('select_action', { cardId, targetId });
  },
  passTurn() {
    socket.emit('pass_turn');
  },
  discardCards(cardIds) {
    socket.emit('discard_cards', { cardIds });
  },
  togglePause() {
    socket.emit('toggle_pause');
  },
  skipAnalysis() {
    socket.emit('skip_analysis');
  },
  sendChat(text) {
    socket.emit('send_chat', { text });
  },
};

export const audioService = audio;

export const storageService = {
  getNickname() {
    try {
      return localStorage.getItem('strike_void_nickname') || '';
    } catch (_e) {
      return '';
    }
  },
  setNickname(name) {
    try {
      if (name) localStorage.setItem('strike_void_nickname', name);
    } catch (_e) {
      // ignore storage errors
    }
  },
};

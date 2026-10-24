const {
  DEFAULT_MAX_HP,
  DEFAULT_HAND_CARDS,
  DEFAULT_INITIAL_HAND_CARDS,
  DEFAULT_DISCARD_LIMIT,
  clampInitialHandCards,
} = require('../helpers/validators');

const rooms = new Map();

function createRoom({ code, name, hostId, isPublic, initialHandCards }) {
  const initCards = clampInitialHandCards(initialHandCards, DEFAULT_INITIAL_HAND_CARDS);
  const maxCards = Math.max(initCards, DEFAULT_HAND_CARDS);
  return {
    code,
    name: name || `Sala ${code}`,
    hostId,
    isPublic: Boolean(isPublic),
    maxPlayers: 8,
    minPlayers: 2,
    status: 'LOBBY', // 'LOBBY' | 'IN_GAME' | 'FINISHED'
    players: [],
    gameState: {
      phase: 'LOBBY',
      round: 0,
      isPaused: false,
      settings: {
        useFixedTime: false,
        baseTestTime: 10,
        secondsPerPlayer: 2.0,
        damagePenalty: 0.33,
        analysisDuration: 8.0,
        maxHp: DEFAULT_MAX_HP,
        maxHandCards: maxCards,
        initialHandCards: initCards,
        discardLimit: DEFAULT_DISCARD_LIMIT,
      },
      deck: [],
      discardPile: [],
      logs: [],
      winner: null,
      gameToken: 0,
      skipAnalysisFlag: false,
      planningElapsed: 0,
      logCounter: 0,
      planningInterval: null,
    },
  };
}

module.exports = {
  rooms,
  createRoom,
};

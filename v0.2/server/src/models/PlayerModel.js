const { DEFAULT_MAX_HP } = require('../helpers/validators');

const BOT_NAMES = [
  'LESHY_BOT',
  'DEALER_X',
  'GRIMORA',
  'MAGNIFICUS',
  'PO3_UNIT',
  'BONE_LORD',
  'HOUND_7',
  'TRAPPER_BOT',
];

function createPlayer(id, name, isBot, maxHp = DEFAULT_MAX_HP) {
  return {
    id,
    name,
    isBot,
    lives: maxHp,
    maxLives: maxHp,
    isAlive: true,
    isWalled: false,
    isReflecting: false,
    knifeDamage: 1,
    bloodPactWith: [],
    deathMarkTurns: null,
    deathMarkAppliedRound: null,
    tookDamageThisRound: false,
    handRevealedUntilRound: 0,
    hand: [],
    selectedAction: null,
    lockedIn: false,
    allowedTime: 20,
    visualEffect: null,
  };
}

function resetPlayerForMatch(player, maxHp = DEFAULT_MAX_HP) {
  player.lives = maxHp;
  player.maxLives = maxHp;
  player.isAlive = true;
  player.isWalled = false;
  player.isReflecting = false;
  player.knifeDamage = 1;
  player.bloodPactWith = [];
  player.deathMarkTurns = null;
  player.deathMarkAppliedRound = null;
  player.tookDamageThisRound = false;
  player.handRevealedUntilRound = 0;
  player.hand = [];
  player.selectedAction = null;
  player.lockedIn = false;
  player.visualEffect = null;
}

module.exports = {
  BOT_NAMES,
  createPlayer,
  resetPlayerForMatch,
};

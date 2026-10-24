const { BASELINE_HP } = require('./validators');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function calculatePlayerTime(player, aliveCount, settings) {
  if (!player.isAlive) return 0;
  if (settings.useFixedTime === true) return settings.baseTestTime;
  const damageTaken = Math.max(0, player.maxLives - player.lives);
  const scaledDamage = damageTaken * (BASELINE_HP / (player.maxLives || BASELINE_HP));
  const factor = Math.pow(1 - settings.damagePenalty, scaledDamage);
  const dynamicTime = aliveCount * settings.secondsPerPlayer * factor;
  return Number((settings.baseTestTime + dynamicTime).toFixed(1));
}

module.exports = {
  wait,
  calculatePlayerTime,
};

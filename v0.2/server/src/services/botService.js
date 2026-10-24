const { CARD_TYPES } = require('../models/CardModel');
const { alivePlayers, emitRoomState } = require('./roomService');

function scheduleBot(io, room, bot, token, round, applyAction, passAction) {
  const delay = 1400 + Math.random() * 1900;
  setTimeout(() => {
    if (
      token !== room.gameState.gameToken ||
      room.gameState.phase !== 'PLANNING' ||
      room.gameState.round !== round
    ) {
      return;
    }
    if (!bot.isAlive || bot.lockedIn) return;

    const others = alivePlayers(room).filter((p) => p.id !== bot.id);
    const randomOther = () =>
      others.length > 0 ? others[Math.floor(Math.random() * others.length)] : null;

    if (bot.isWalled) {
      // Se emparedado: Pacto de Sangue ignora parede, Faca quebra a própria parede, Manip. Alma buffa faca
      const pactCard = bot.hand.find((c) => c.type === CARD_TYPES.PACTO_SANGUE);
      const knife = bot.hand.find((c) => c.type === CARD_TYPES.FACA);
      const soul = bot.hand.find((c) => c.type === CARD_TYPES.MANIPULAMENTO_ALMA);

      if (knife) {
        applyAction(room, bot, knife.id, bot.id);
      } else if (pactCard && others.length > 0) {
        applyAction(room, bot, pactCard.id, randomOther().id);
      } else if (soul) {
        applyAction(room, bot, soul.id, bot.id);
      } else if (room.gameState.settings.discardLimit > 0 && bot.hand.length > 0) {
        const toDiscard = bot.hand.slice(0, room.gameState.settings.discardLimit);
        for (const c of toDiscard) {
          const idx = bot.hand.findIndex((h) => h.id === c.id);
          if (idx !== -1) room.gameState.discardPile.push(bot.hand.splice(idx, 1)[0]);
        }
        bot.selectedAction = {
          cardType: 'DISCARD',
          discardedCount: toDiscard.length,
          targetId: null,
          originalTargetId: null,
          status: 'PENDING',
        };
        bot.lockedIn = true;
      } else {
        passAction(bot);
      }
    } else {
      const card = bot.hand[Math.floor(Math.random() * bot.hand.length)];
      if (!card) {
        passAction(bot);
      } else if (card.type === CARD_TYPES.REVERSO) {
        if (others.length > 0 && Math.random() < 0.4) {
          applyAction(room, bot, card.id, randomOther().id);
        } else {
          applyAction(room, bot, card.id, bot.id);
        }
      } else if (card.type === CARD_TYPES.MANIPULAMENTO_ALMA) {
        // Se estiver com pouca vida e houver outro jogador com mais vida, troca a vida; senão buffa a própria faca!
        const richerTarget = others.find((p) => p.lives > bot.lives);
        if (richerTarget) {
          applyAction(room, bot, card.id, richerTarget.id);
        } else {
          applyAction(room, bot, card.id, bot.id);
        }
      } else if (
        card.type === CARD_TYPES.DESARMAR ||
        card.type === CARD_TYPES.PACTO_SANGUE ||
        card.type === CARD_TYPES.REVELAR
      ) {
        const target = randomOther();
        if (!target) passAction(bot);
        else applyAction(room, bot, card.id, target.id);
      } else {
        const target = randomOther();
        if (!target) passAction(bot);
        else applyAction(room, bot, card.id, target.id);
      }
    }
    emitRoomState(io, room);
  }, delay);
}

module.exports = {
  scheduleBot,
};

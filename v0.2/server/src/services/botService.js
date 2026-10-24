const { CARD_TYPES } = require('../models/CardModel');
const { alivePlayers, emitRoomState } = require('./roomService');
const { normalizeCard } = require('./deckService');

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

    const missingHp = bot.maxLives - bot.lives;
    // Procura seringa que cure exatamente o que falta sem causar overdose
    const exactSyringe = bot.hand.find(
      (c) => c.type === CARD_TYPES.SERINGA && (c.charges || 0) > 0 && (c.charges || 0) <= missingHp
    );
    if (exactSyringe) {
      applyAction(room, bot, exactSyringe.id, bot.id);
      emitRoomState(io, room);
      return;
    }

    if (bot.isWalled) {
      const pactCard = bot.hand.find((c) => c.type === CARD_TYPES.PACTO_SANGUE);
      const knife = bot.hand.find((c) => c.type === CARD_TYPES.FACA);
      const soul = bot.hand.find((c) => c.type === CARD_TYPES.MANIPULAMENTO_ALMA);

      if (knife) {
        applyAction(room, bot, knife.id, bot.id);
      } else if (pactCard) {
        if ((bot.bloodPactWith || []).length > 0) {
          applyAction(room, bot, pactCard.id, bot.id); // Quebra o próprio pacto
        } else if (others.length > 0) {
          applyAction(room, bot, pactCard.id, randomOther().id);
        } else {
          passAction(bot);
        }
      } else if (soul) {
        applyAction(room, bot, soul.id, bot.id);
      } else if (room.gameState.settings.discardLimit > 0 && bot.hand.length > 0) {
        // Não descarta seringas que estão carregando se houver outras cartas
        const discardable = bot.hand.filter((c) => c.type !== CARD_TYPES.SERINGA);
        const pool = discardable.length > 0 ? discardable : bot.hand;
        const toDiscard = pool.slice(0, room.gameState.settings.discardLimit);
        for (const c of toDiscard) {
          const idx = bot.hand.findIndex((h) => h.id === c.id);
          if (idx !== -1) {
            room.gameState.discardPile.push(normalizeCard(bot.hand.splice(idx, 1)[0]));
          }
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
      // Filtra seringas vazias para o bot não desperdiçar à toa
      const playableCards = bot.hand.filter(
        (c) => !(c.type === CARD_TYPES.SERINGA && (c.charges || 0) === 0)
      );
      const card =
        playableCards[Math.floor(Math.random() * playableCards.length)] || null;

      if (!card) {
        passAction(bot);
      } else if (card.type === CARD_TYPES.SERINGA) {
        const charges = card.charges || 0;
        if (missingHp > 0 && charges <= missingHp) {
          applyAction(room, bot, card.id, bot.id);
        } else if (others.length > 0 && charges >= 2) {
          // Injeta no inimigo para forçar Overdose!
          applyAction(room, bot, card.id, randomOther().id);
        } else {
          passAction(bot);
        }
      } else if (card.type === CARD_TYPES.PACTO_SANGUE) {
        if ((bot.bloodPactWith || []).length > 0 && Math.random() < 0.5) {
          applyAction(room, bot, card.id, bot.id); // Quebra o pacto existente
        } else if (others.length > 0) {
          applyAction(room, bot, card.id, randomOther().id);
        } else {
          passAction(bot);
        }
      } else if (card.type === CARD_TYPES.REVERSO) {
        if (others.length > 0 && Math.random() < 0.4) {
          applyAction(room, bot, card.id, randomOther().id);
        } else {
          applyAction(room, bot, card.id, bot.id);
        }
      } else if (card.type === CARD_TYPES.MANIPULAMENTO_ALMA) {
        const richerTarget = others.find((p) => p.lives > bot.lives);
        if (richerTarget) {
          applyAction(room, bot, card.id, richerTarget.id);
        } else {
          applyAction(room, bot, card.id, bot.id);
        }
      } else if (
        card.type === CARD_TYPES.DESARMAR ||
        card.type === CARD_TYPES.REVELAR ||
        card.type === CARD_TYPES.MARCA_MORTE
      ) {
        const target = randomOther();
        if (!target) passAction(bot);
        else applyAction(room, bot, card.id, target.id);
      } else {
        // FACA ou PAREDE: se o bot estiver com Marca da Morte prestes a matar (1 turno) e tiver mais de 1 vida, se corta para purgar a marca!
        if (
          card.type === CARD_TYPES.FACA &&
          bot.deathMarkTurns === 1 &&
          bot.lives > (bot.knifeDamage || 1)
        ) {
          applyAction(room, bot, card.id, bot.id);
        } else {
          const target = randomOther();
          if (!target) passAction(bot);
          else applyAction(room, bot, card.id, target.id);
        }
      }
    }
    emitRoomState(io, room);
  }, delay);
}

module.exports = {
  scheduleBot,
};

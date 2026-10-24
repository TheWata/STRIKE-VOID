const { uuid } = require('../helpers/idHelper');
const { CARD_TYPES, ALL_CARD_TYPES, DECK_COMPOSITION } = require('../models/CardModel');

function createCardInstance(type) {
  if (type === CARD_TYPES.SERINGA) {
    return { id: uuid(), type, charges: 0 };
  }
  return { id: uuid(), type };
}

function normalizeCard(card) {
  if (!card) return card;
  if (card.type === CARD_TYPES.SERINGA) {
    card.charges = 0;
  }
  return card;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck() {
  const deck = [];
  for (const [type, count] of Object.entries(DECK_COMPOSITION)) {
    for (let i = 0; i < count; i++) {
      deck.push(createCardInstance(type));
    }
  }
  return shuffle(deck);
}

function recycleDiscardIntoDeck(room) {
  if (room.gameState.discardPile.length > 0) {
    for (const c of room.gameState.discardPile) {
      normalizeCard(c);
      room.gameState.deck.push(c);
    }
    room.gameState.discardPile = [];
    shuffle(room.gameState.deck);
  }
}

function drawCard(room) {
  if (room.gameState.deck.length === 0) {
    recycleDiscardIntoDeck(room);
  }
  return normalizeCard(room.gameState.deck.pop());
}

/**
 * Compra uma carta para o jogador garantindo que ele NUNCA tenha 3 cartas iguais na mão
 * (no máximo 2 cópias de cada tipo de carta na mão).
 */
function drawCardForPlayer(room, player) {
  const counts = {};
  for (const type of ALL_CARD_TYPES) counts[type] = 0;
  for (const c of player.hand) {
    if (counts[c.type] !== undefined) counts[c.type]++;
  }

  const forbidden = new Set();
  for (const type of ALL_CARD_TYPES) {
    if (counts[type] >= 2) forbidden.add(type);
  }

  if (room.gameState.deck.length === 0) {
    recycleDiscardIntoDeck(room);
  }

  let cardIndex = -1;
  for (let i = room.gameState.deck.length - 1; i >= 0; i--) {
    if (!forbidden.has(room.gameState.deck[i].type)) {
      cardIndex = i;
      break;
    }
  }

  if (cardIndex !== -1) {
    return normalizeCard(room.gameState.deck.splice(cardIndex, 1)[0]);
  }

  if (room.gameState.discardPile.length > 0) {
    recycleDiscardIntoDeck(room);

    for (let i = room.gameState.deck.length - 1; i >= 0; i--) {
      if (!forbidden.has(room.gameState.deck[i].type)) {
        return normalizeCard(room.gameState.deck.splice(i, 1)[0]);
      }
    }
  }

  const allowed = ALL_CARD_TYPES.filter((t) => !forbidden.has(t));
  if (allowed.length === 0) return null;
  const pickedType = allowed[Math.floor(Math.random() * allowed.length)];
  return createCardInstance(pickedType);
}

module.exports = {
  createCardInstance,
  normalizeCard,
  shuffle,
  buildDeck,
  drawCard,
  drawCardForPlayer,
};

const MIN_MAX_HP = 2;
const MAX_MAX_HP = 5;
const DEFAULT_MAX_HP = 3;
const BASELINE_HP = 3;

const MIN_HAND_CARDS = 1;
const MAX_HAND_CARDS = 5;
const DEFAULT_HAND_CARDS = 3;

const MIN_INITIAL_HAND_CARDS = 1;
const MAX_INITIAL_HAND_CARDS = 5;
const DEFAULT_INITIAL_HAND_CARDS = 3;

const MIN_DISCARD_LIMIT = 0;
const MAX_DISCARD_LIMIT = 2;
const DEFAULT_DISCARD_LIMIT = 2;

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function clampMaxHp(value, fallback = DEFAULT_MAX_HP) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_MAX_HP, Math.max(MIN_MAX_HP, n));
}

function clampHandCards(value, fallback = DEFAULT_HAND_CARDS) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_HAND_CARDS, Math.max(MIN_HAND_CARDS, n));
}

function clampInitialHandCards(value, fallback = DEFAULT_INITIAL_HAND_CARDS) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_INITIAL_HAND_CARDS, Math.max(MIN_INITIAL_HAND_CARDS, n));
}

function clampDiscardLimit(value, fallback = DEFAULT_DISCARD_LIMIT) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_DISCARD_LIMIT, Math.max(MIN_DISCARD_LIMIT, n));
}

module.exports = {
  MIN_MAX_HP,
  MAX_MAX_HP,
  DEFAULT_MAX_HP,
  BASELINE_HP,
  MIN_HAND_CARDS,
  MAX_HAND_CARDS,
  DEFAULT_HAND_CARDS,
  MIN_INITIAL_HAND_CARDS,
  MAX_INITIAL_HAND_CARDS,
  DEFAULT_INITIAL_HAND_CARDS,
  MIN_DISCARD_LIMIT,
  MAX_DISCARD_LIMIT,
  DEFAULT_DISCARD_LIMIT,
  clampNumber,
  clampMaxHp,
  clampHandCards,
  clampInitialHandCards,
  clampDiscardLimit,
};

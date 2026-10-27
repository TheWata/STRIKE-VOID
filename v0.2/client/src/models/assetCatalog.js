import { CARD_TYPES } from './cardModel';

/**
 * Catálogo centralizado do pipeline de assets artísticos do STRIKE / VOID.
 * Todos os caminhos apontam para `public/assets/...` servidos estaticamente
 * em desenvolvimento e em produção.
 */

export const CARD_ART_ASSETS = {
  [CARD_TYPES.FACA]: '/assets/cards/faca.webp',
  [CARD_TYPES.PAREDE]: '/assets/cards/parede.webp',
  [CARD_TYPES.REVERSO]: '/assets/cards/espelho-amaldicoado.webp',
  [CARD_TYPES.REVELAR]: '/assets/cards/revelar.webp',
  [CARD_TYPES.DESARMAR]: '/assets/cards/desarmar.webp',
  [CARD_TYPES.MANIPULAMENTO_ALMA]: '/assets/cards/manipulamento-alma.webp',
  [CARD_TYPES.PACTO_SANGUE]: '/assets/cards/pacto-sangue.webp',
  [CARD_TYPES.MARCA_MORTE]: '/assets/cards/marca-morte.webp',
  [CARD_TYPES.SERINGA]: '/assets/cards/seringa.webp',
  CARD_BACK: '/assets/cards/card-back.webp',
};

export const CHARACTER_EXPRESSION_SPRITESHEET =
  '/assets/characters/expressions-spritesheet.jpg';

/**
 * Silhuetas/presenças sombrias com transparência real (PNG/WebP RGBA)
 * e coordenadas calibradas dos olhos dinâmicos no viewBox 160x210.
 */
export const CHARACTER_PRESENCE_ASSETS = [
  {
    id: 'presence-1',
    png: '/assets/characters/presence-1.png',
    webp: '/assets/characters/presence-1.webp',
    eyes: { lx: 71, rx: 89, y: 64 },
  },
  {
    id: 'presence-2',
    png: '/assets/characters/presence-2.png',
    webp: '/assets/characters/presence-2.webp',
    eyes: { lx: 72, rx: 88, y: 54 },
  },
  {
    id: 'presence-3',
    png: '/assets/characters/presence-3.png',
    webp: '/assets/characters/presence-3.webp',
    eyes: { lx: 70, rx: 90, y: 58 },
  },
  {
    id: 'presence-4',
    png: '/assets/characters/presence-4.png',
    webp: '/assets/characters/presence-4.webp',
    eyes: { lx: 71, rx: 88, y: 66 },
  },
  {
    id: 'presence-5',
    png: '/assets/characters/presence-5.png',
    webp: '/assets/characters/presence-5.webp',
    eyes: { lx: 72, rx: 88, y: 58 },
  },
  {
    id: 'presence-6',
    png: '/assets/characters/presence-6.png',
    webp: '/assets/characters/presence-6.webp',
    eyes: { lx: 72, rx: 89, y: 66 },
  },
];

export const TEXTURE_ASSETS = {
  TABLE_WOOD: '/assets/textures/table-wood.webp',
  TABLE_FELT: '/assets/textures/table-felt.webp',
  PARCHMENT_GRAIN: '/assets/textures/parchment-grain.webp',
};

export const BACKGROUND_ASSETS = {
  ROOM_CANDLELIGHT: '/assets/backgrounds/room-candlelight.webp',
};

export const EFFECT_ASSETS = {
  SLASH_IMPACT: '/assets/effects/slash-impact.svg',
  MIRROR_SHATTER: '/assets/effects/mirror-shatter.svg',
  IRON_CAGE: '/assets/effects/iron-cage.svg',
  BLOOD_PACT_RING: '/assets/effects/blood-pact-ring.svg',
  SOUL_SPIRAL: '/assets/effects/soul-spiral.svg',
};

export const UI_ASSETS = {
  CLOCK_DIAL: '/assets/ui/clock-dial.svg',
  CARD_CORNER_ORNAMENT: '/assets/ui/card-corner-ornament.svg',
  TABLE_RITUAL_MANDALA: '/assets/ui/table-ritual-mandala.svg',
};

export const ICON_ASSETS = {
  'blood-drop': '/assets/icons/blood-drop.svg',
  'death-mark': '/assets/icons/death-mark.svg',
  'dagger-buff': '/assets/icons/dagger-buff.svg',
  'dagger-strike': '/assets/icons/dagger-strike.svg',
  'iron-lock': '/assets/icons/iron-lock.svg',
  'iron-wall': '/assets/icons/iron-wall.svg',
  'wall-shatter': '/assets/icons/wall-shatter.svg',
  'syringe-vial': '/assets/icons/syringe-vial.svg',
  'broken-chain': '/assets/icons/broken-chain.svg',
  'cursed-mirror': '/assets/icons/cursed-mirror.svg',
  'abyssal-eye': '/assets/icons/abyssal-eye.svg',
  'disarm-slash': '/assets/icons/disarm-slash.svg',
  'soul-wisp': '/assets/icons/soul-wisp.svg',
  'soul-flame': '/assets/icons/soul-flame.svg',
  'overdose-bio': '/assets/icons/overdose-bio.svg',
  'skull-kill': '/assets/icons/skull-kill.svg',
  'grimoire-book': '/assets/icons/grimoire-book.svg',
  'notebook-quill': '/assets/icons/notebook-quill.svg',
  'scroll-log': '/assets/icons/scroll-log.svg',
};

export function getCharacterPresenceAsset(variantIndex = 0) {
  const safeIdx = Math.abs(Number(variantIndex) || 0) % CHARACTER_PRESENCE_ASSETS.length;
  return CHARACTER_PRESENCE_ASSETS[safeIdx];
}

export function getCardArtAsset(cardType) {
  return CARD_ART_ASSETS[cardType] || null;
}

export function getIconAsset(iconName) {
  return ICON_ASSETS[iconName] || null;
}

let preloaded = false;
/**
 * Faz preload seletivo e assíncrono dos recursos críticos da mesa principal
 * sem bloquear a thread principal nem carregar tudo de forma indiscriminada.
 */
export function preloadCriticalTableAssets() {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;

  const criticalUrls = [
    CHARACTER_EXPRESSION_SPRITESHEET,
    TEXTURE_ASSETS.TABLE_WOOD,
    TEXTURE_ASSETS.TABLE_FELT,
    TEXTURE_ASSETS.PARCHMENT_GRAIN,
    CARD_ART_ASSETS.CARD_BACK,
    ...CHARACTER_PRESENCE_ASSETS.slice(0, 4).map((c) => c.webp),
  ];

  const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 120));
  schedule(() => {
    criticalUrls.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    });
  });
}

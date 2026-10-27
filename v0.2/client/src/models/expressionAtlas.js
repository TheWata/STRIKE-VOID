/**
 * Configuração centralizada do Atlas / Tilemap de Expressões dos Personagens.
 *
 * Imagem em alta resolução `/assets/characters/expressions-spritesheet.jpg` (1024x682):
 *   - GRADE DE CIMA (Linhas 0 e 1): Personagem Feminina (16 expressões)
 *   - GRADE DE BAIXO (Linhas 2 e 3): Personagem Masculino (16 expressões)
 *
 * O recorte calibrado (110x110 px) enquadra o personagem de forma proporcional
 * (cabeça, cabelo completo, pescoço/colar e ombros), sem zoom excessivo no rosto
 * e sem vazar títulos, rótulos de texto inferiores ou molduras externas.
 */

export const EXPRESSION_SPRITESHEET = {
  src: '/assets/characters/expressions-spritesheet.jpg',
  width: 1024,
  height: 682,
  cropSize: 110,
};

export const CHARACTER_ARCHETYPES = {
  FEMALE: 'female',
  MALE: 'male',
};

/**
 * Chaves canônicas das 16 expressões do spritesheet.
 */
export const EXPRESSION_KEYS = {
  // Linha superior de cada gênero (colunas 0..7)
  NORMAL: 'NORMAL',
  ATENCAO: 'ATENCAO',
  ANSIEDADE: 'ANSIEDADE',
  ASSUSTADO: 'ASSUSTADO',
  MEDO: 'MEDO',
  LOUCURA: 'LOUCURA',
  CHORANDO: 'CHORANDO',
  MORRENDO: 'MORRENDO',

  // Linha inferior de cada gênero (colunas 0..7)
  FERIDO: 'FERIDO',
  POUCA_VIDA: 'POUCA_VIDA',
  PRESO: 'PRESO',
  TRISTE: 'TRISTE',
  PARALISADO: 'PARALISADO',
  ENVENENADO: 'ENVENENADO',
  QUEIMANDO: 'QUEIMANDO',
  DETERMINADO: 'DETERMINADO',

  // Aliases semânticos de combate:
  DOR: 'DOR',
  ALIVIO: 'ALIVIO',
  CONGELADO: 'CONGELADO',
};

/**
 * Aliases semânticos mapeados para a célula canônica correspondente no spritesheet:
 * - DOR: usa o tile QUEIMANDO (expressão de dor aguda com dentes cerrados e ferimentos)
 * - ALIVIO: usa o tile NORMAL (olhar sereno com iluminação restauradora)
 * - CONGELADO: usa o tile PARALISADO
 */
export const EXPRESSION_TILE_ALIASES = {
  DOR: 'QUEIMANDO',
  ALIVIO: 'NORMAL',
  CONGELADO: 'PARALISADO',
};

/**
 * Centros X calibrados das 8 colunas (em pixels na imagem 1024x682).
 */
const COL_CENTERS_X = [67, 194, 321, 448, 575.5, 705, 834, 957.5];

/**
 * Centros Y calibrados das 4 linhas de retratos:
 * - Grade de Cima (Feminina): Linha 0 (Y=84) e Linha 1 (Y=236)
 * - Grade de Baixo (Masculino): Linha 2 (Y=422) e Linha 3 (Y=575)
 */
const ROW_CENTERS_Y = {
  female: [84, 236],
  male: [422, 575],
};

const ROW_0_KEYS = [
  'NORMAL',
  'ATENCAO',
  'ANSIEDADE',
  'ASSUSTADO',
  'MEDO',
  'LOUCURA',
  'CHORANDO',
  'MORRENDO',
];

const ROW_1_KEYS = [
  'FERIDO',
  'POUCA_VIDA',
  'PRESO',
  'TRISTE',
  'PARALISADO',
  'ENVENENADO',
  'QUEIMANDO',
  'DETERMINADO',
];

export const EXPRESSION_LABELS = {
  NORMAL: 'Normal',
  ATENCAO: 'Atenção',
  ANSIEDADE: 'Ansiedade',
  ASSUSTADO: 'Assustado(a)',
  MEDO: 'Medo',
  LOUCURA: 'Loucura',
  CHORANDO: 'Chorando',
  MORRENDO: 'Morrendo',
  FERIDO: 'Ferido(a)',
  POUCA_VIDA: 'Pouca Vida',
  PRESO: 'Preso(a)',
  TRISTE: 'Triste',
  PARALISADO: 'Paralisado(a)',
  ENVENENADO: 'Envenenado(a)',
  QUEIMANDO: 'Dor / Queimando',
  DETERMINADO: 'Determinado(a)',
  DOR: 'Dor Aguda',
  ALIVIO: 'Alívio',
  CONGELADO: 'Paralisado(a)',
};

function buildCharacterTileMap(characterKey) {
  const [yRow0, yRow1] = ROW_CENTERS_Y[characterKey] || ROW_CENTERS_Y.female;
  const size = EXPRESSION_SPRITESHEET.cropSize;
  const half = size / 2;
  const map = {};

  ROW_0_KEYS.forEach((key, colIdx) => {
    const cx = COL_CENTERS_X[colIdx];
    map[key] = {
      key,
      col: colIdx,
      row: characterKey === 'male' ? 2 : 0,
      x: Number((cx - half).toFixed(2)),
      y: Number((yRow0 - half).toFixed(2)),
      w: size,
      h: size,
    };
  });

  ROW_1_KEYS.forEach((key, colIdx) => {
    const cx = COL_CENTERS_X[colIdx];
    map[key] = {
      key,
      col: colIdx,
      row: characterKey === 'male' ? 3 : 1,
      x: Number((cx - half).toFixed(2)),
      y: Number((yRow1 - half).toFixed(2)),
      w: size,
      h: size,
    };
  });

  return map;
}

export const EXPRESSION_ATLAS = {
  female: buildCharacterTileMap('female'),
  male: buildCharacterTileMap('male'),
};

/**
 * Resolve uma chave de expressão e gênero para estilo CSS de tilemap.
 */
export function getExpressionTileData(
  character = CHARACTER_ARCHETYPES.FEMALE,
  expressionKey = EXPRESSION_KEYS.NORMAL
) {
  const normChar =
    character === CHARACTER_ARCHETYPES.MALE
      ? CHARACTER_ARCHETYPES.MALE
      : CHARACTER_ARCHETYPES.FEMALE;
  const requestedKey = String(expressionKey || 'NORMAL').toUpperCase();
  const canonicalKey = EXPRESSION_TILE_ALIASES[requestedKey] || requestedKey;

  const charMap = EXPRESSION_ATLAS[normChar] || EXPRESSION_ATLAS.female;
  const tile = charMap[canonicalKey] || charMap.NORMAL;

  const { width: W, height: H, src } = EXPRESSION_SPRITESHEET;
  const { x, y, w, h } = tile;

  const bgSizeX = ((W / w) * 100).toFixed(3);
  const bgSizeY = ((H / h) * 100).toFixed(3);
  const bgPosX = ((x / (W - w)) * 100).toFixed(3);
  const bgPosY = ((y / (H - h)) * 100).toFixed(3);

  return {
    character: normChar,
    requestedKey,
    canonicalKey,
    label: EXPRESSION_LABELS[requestedKey] || EXPRESSION_LABELS[canonicalKey] || 'Normal',
    col: tile.col,
    row: tile.row,
    rect: { x, y, w, h },
    style: {
      backgroundImage: `url("${src}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
      backgroundPosition: `${bgPosX}% ${bgPosY}%`,
    },
  };
}

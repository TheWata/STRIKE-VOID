/**
 * Helpers matemáticos 3D para posicionamento polar ao redor da mesa octogonal
 * e cálculo de perspectiva da câmera 3D estilo Inscryption.
 * Suporta perfeitamente de 2 a 8 jogadores simultâneos na mesa.
 */

/**
 * Coordenadas polares dos assentos:
 * - Jogador local sempre na base inferior da tela (90deg / PI/2).
 * - Oponentes distribuídos uniformemente pelo arco frontal da mesa (175deg -> 270deg -> 5deg),
 *   garantindo que todos fiquem sempre à frente do jogador, visíveis e clicáveis,
 *   sem nunca sobrepor o rodapé, mãos de cartas ou controles do herói.
 */
export function seatAngle(index, localIndex, totalPlayers) {
  const safeTotal = Math.max(1, totalPlayers);
  if (safeTotal <= 1) return Math.PI / 2;

  const offset = (index - localIndex + safeTotal) % safeTotal;
  // Jogador local sempre na base (90 graus)
  if (offset === 0) return Math.PI / 2;

  const numOpponents = safeTotal - 1;
  // Partida 1v1: oponente único sentado na cabeceira oposta (270 graus)
  if (numOpponents === 1) return (3 * Math.PI) / 2;

  // Arco frontal simétrico em torno de 270 graus (cabeceira)
  // Expande de acordo com a quantidade de oponentes:
  // 2 oponentes: arco de 105 graus (217.5° a 322.5°)
  // 3 oponentes: arco de 145 graus (197.5° a 342.5°)
  // 5 oponentes: arco de 176 graus (182° a 358°)
  // 7 oponentes: arco de 194 graus (173° a 367°)
  const spanDeg = Math.min(194, 95 + numOpponents * 14.5);
  const spanRad = (spanDeg * Math.PI) / 180;
  const centerRad = (3 * Math.PI) / 2; // 270 graus
  const startRad = centerRad - spanRad / 2;
  const t = (offset - 1) / (numOpponents - 1);

  return startRad + t * spanRad;
}

/**
 * Posição 2D/3D percentual sobre o feltro da mesa (0..100%).
 * Usada para slots de cartas e setas táticas entre jogadores.
 */
export function seatPosition(index, localIndex, totalPlayers, rx = 37, ry = 31) {
  const angle = seatAngle(index, localIndex, totalPlayers);
  return {
    x: 50 + rx * Math.cos(angle),
    y: 50 + ry * Math.sin(angle),
    angle,
  };
}

/**
 * Posição precisa das silhuetas 3D dos oponentes ao redor da mesa.
 * - Compensa a perspectiva para que oponentes distantes (no topo da mesa)
 *   mantenham escala visual perceptiva similar aos oponentes das laterais.
 * - Ajusta escala e raio de acordo com o total de jogadores (2 a 8).
 */
export function silhouettePosition(index, localIndex, totalPlayers) {
  const angle = seatAngle(index, localIndex, totalPlayers);
  const sinA = Math.sin(angle);
  const cosA = Math.cos(angle);

  // Raio da elipse de ancoragem das presenças sombrias
  const rx = 52.5;
  const ry = sinA < -0.35 ? 44.5 : 41.5;
  const x = 50 + rx * cosA;
  const y = 50 + ry * sinA;

  // Fator de profundidade na perspectiva (0 = topo/fundo, 1 = frente/laterais)
  const distFromTop = (sinA + 1) / 2;
  // Compensação óptica de perspectiva: amplia ligeiramente quem está no fundo
  // para que o olho humano veja todos com presença e altura equivalentes.
  const perspectiveCompensation = 1.15 - distFromTop * 0.15;

  // Escala base adaptativa ao total de jogadores para evitar sobreposição
  let countScale = 1.0;
  if (totalPlayers >= 7) {
    countScale = 0.78; // 7 oponentes: layout ultra-compacto com espaçamento perfeito
  } else if (totalPlayers >= 5) {
    countScale = 0.88; // 4-5 oponentes
  } else if (totalPlayers === 2) {
    countScale = 1.18; // Duelo 1v1: chefe imponente na cabeceira
  }

  const finalScale = Number((countScale * perspectiveCompensation).toFixed(2));
  const isLeftFlank = x < 23;
  const isRightFlank = x > 77;

  return {
    x: Number(x.toFixed(1)),
    y: Number(y.toFixed(1)),
    angle,
    sinA,
    cosA,
    scale: finalScale,
    anchorY: -73,
    isLeftFlank,
    isRightFlank,
  };
}

/** Dimensões CSS adaptativas das silhuetas de acordo com a lotação da mesa */
export function getSilhouetteDimensions(totalPlayers, isCompact = false) {
  if (totalPlayers >= 7) {
    return isCompact
      ? { widthCls: 'w-[94px] h-[126px]', badgeScale: 'scale-[0.85]' }
      : { widthCls: 'w-[124px] h-[162px]', badgeScale: 'scale-[0.92]' };
  }
  if (totalPlayers >= 5) {
    return isCompact
      ? { widthCls: 'w-[110px] h-[146px]', badgeScale: 'scale-[0.90]' }
      : { widthCls: 'w-[146px] h-[190px]', badgeScale: 'scale-[0.96]' };
  }
  if (totalPlayers === 2) {
    return isCompact
      ? { widthCls: 'w-[148px] h-[194px]', badgeScale: 'scale-[1.05]' }
      : { widthCls: 'w-[196px] h-[252px]', badgeScale: 'scale-[1.08]' };
  }
  return isCompact
    ? { widthCls: 'w-[126px] h-[166px]', badgeScale: 'scale-[0.95]' }
    : { widthCls: 'w-[168px] h-[218px]', badgeScale: 'scale-100' };
}

/** Pregos decorativos nos 8 vértices da mesa octogonal */
export const TABLE_NAILS = [
  'left-[29%] top-[1.6%]',
  'left-[71%] top-[1.6%]',
  'left-[98.4%] top-[29%]',
  'left-[98.4%] top-[71%]',
  'left-[71%] top-[98.4%]',
  'left-[29%] top-[98.4%]',
  'left-[1.6%] top-[71%]',
  'left-[1.6%] top-[29%]',
];

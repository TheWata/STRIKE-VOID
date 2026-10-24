/**
 * Helpers matemáticos 3D para posicionamento polar ao redor da mesa octogonal
 * e cálculo de perspectiva da câmera 3D estilo Inscryption.
 */

/** Coordenadas polares: jogador local sempre na base inferior (90deg / PI/2). */
export function seatAngle(index, localIndex, totalPlayers) {
  const safeTotal = Math.max(1, totalPlayers);
  return (
    ((index - localIndex + safeTotal) % safeTotal) * ((2 * Math.PI) / safeTotal) +
    Math.PI / 2
  );
}

/** Posição 2D/3D percentual sobre o tampo da mesa (0..100%). */
export function seatPosition(index, localIndex, totalPlayers, rx = 38, ry = 36) {
  const angle = seatAngle(index, localIndex, totalPlayers);
  return {
    x: 50 + rx * Math.cos(angle),
    y: 50 + ry * Math.sin(angle),
    angle,
  };
}

/**
 * Posição das silhuetas 3D ao redor do perímetro externo da mesa.
 * Empurra as silhuetas ligeiramente além da borda de madeira para que fiquem sentadas à mesa.
 */
export function silhouettePosition(index, localIndex, totalPlayers) {
  const angle = seatAngle(index, localIndex, totalPlayers);
  const rx = 47;
  const ry = 44;
  const x = 50 + rx * Math.cos(angle);
  const y = 50 + ry * Math.sin(angle);
  // Profundidade relativa (quem está no topo da mesa fica mais ao fundo, quem está nas laterais fica mais próximo)
  const depthFactor = (Math.sin(angle) + 1) / 2; // 0 no topo (270deg), 1 na base (90deg)
  const scale = 0.86 + depthFactor * 0.22;
  return { x, y, angle, depthFactor, scale };
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

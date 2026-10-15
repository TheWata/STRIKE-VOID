import React from 'react';
import { seatPosition } from './PlayerSeat';

function shorten(a, b, startFrac, endFrac) {
  return {
    sx: a.x + (b.x - a.x) * startFrac,
    sy: a.y + (b.y - a.y) * startFrac,
    ex: a.x + (b.x - a.x) * endFrac,
    ey: a.y + (b.y - a.y) * endFrac,
  };
}

function TargetArrowsSVGBase({ players, localIndex }) {
  const total = players.length;
  const pos = {};
  players.forEach((p, i) => {
    pos[p.id] = seatPosition(i, localIndex, total);
  });

  const arrows = [];
  players.forEach((p) => {
    const a = p.selectedAction;
    if (!a || a.hidden || !p.isAlive) return;
    if (a.cardType !== 'FACA' && a.cardType !== 'PAREDE' && a.cardType !== 'REVERSO') return;
    if (!a.targetId || !pos[a.targetId]) return;

    const reflected = a.status === 'REFLECTED';
    const fromId = p.id;
    if (!pos[fromId]) return;

    const allTargets = [a.targetId, ...(a.additionalTargets || [])].filter((tid) => Boolean(tid && pos[tid]));

    allTargets.forEach((toId, idx) => {
      arrows.push({
        key: `${p.id}-${toId}-${idx}`,
        from: pos[fromId],
        to: pos[toId],
        reflected,
        self: fromId === toId,
        type: a.cardType,
      });
    });
  });

  return (
    <svg className="pointer-events-none absolute inset-0 w-full h-full z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <marker id="arrowhead-red" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
          <polygon points="0,0 5,2.5 0,5" fill="#dc2626" />
        </marker>
        <marker id="arrowhead-gold" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
          <polygon points="0,0 5,2.5 0,5" fill="#d4af37" />
        </marker>
        <marker id="arrowhead-purple" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
          <polygon points="0,0 5,2.5 0,5" fill="#c084fc" />
        </marker>
        <marker id="arrowhead-blue" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
          <polygon points="0,0 5,2.5 0,5" fill="#7fa3c0" />
        </marker>
      </defs>
      {arrows.map((ar) => {
        const color = ar.reflected
          ? '#d4af37'
          : ar.type === 'REVERSO'
          ? '#c084fc'
          : ar.type === 'PAREDE'
          ? '#7fa3c0'
          : '#dc2626';

        const marker = ar.reflected
          ? 'url(#arrowhead-gold)'
          : ar.type === 'REVERSO'
          ? 'url(#arrowhead-purple)'
          : ar.type === 'PAREDE'
          ? 'url(#arrowhead-blue)'
          : 'url(#arrowhead-red)';

        let d;
        if (ar.self) {
          const { x, y } = ar.to;
          d = `M ${x - 3} ${y - 7} C ${x - 12} ${y - 18}, ${x + 12} ${y - 18}, ${x + 3} ${y - 7}`;
        } else {
          const { sx, sy, ex, ey } = shorten(ar.from, ar.to, 0.22, 0.78);
          const mx = (sx + ex) / 2;
          const my = (sy + ey) / 2;
          // Controle puxado para o centro da mesa para curvar sobre o feltro
          const cx = mx + (50 - mx) * 0.55;
          const cy = my + (50 - my) * 0.55;
          d = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
        }
        return (
          <path
            key={ar.key + (ar.reflected ? '-r' : '')}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="0.75"
            strokeLinecap="round"
            markerEnd={marker}
            className={ar.reflected ? 'arrow-flow-reverse' : 'arrow-flow'}
            style={{ filter: `drop-shadow(0 0 1px ${color})` }}
          />
        );
      })}
    </svg>
  );
}

export const TargetArrowsSVG = React.memo(TargetArrowsSVGBase);
export default TargetArrowsSVG;

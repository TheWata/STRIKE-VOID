import React from 'react';
import { seatPosition } from '../helpers/math3d';
import { CARD_TYPES } from '../models/cardModel';

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

  // 1. Linhas de vínculo de Pacto de Sangue ativas na mesa
  const pactLines = [];
  const seenPairs = new Set();
  players.forEach((p) => {
    if (!p.isAlive || !p.bloodPactWith) return;
    p.bloodPactWith.forEach((partnerId) => {
      const pairKey = [p.id, partnerId].sort().join('--');
      if (seenPairs.has(pairKey)) return;
      seenPairs.add(pairKey);
      if (pos[p.id] && pos[partnerId]) {
        pactLines.push({
          key: `pact-${pairKey}`,
          from: pos[p.id],
          to: pos[partnerId],
        });
      }
    });
  });

  // 2. Setas de ação da rodada
  const arrows = [];
  const validActionTypes = Object.values(CARD_TYPES);

  players.forEach((p) => {
    const a = p.selectedAction;
    if (!a || a.hidden || !p.isAlive) return;
    if (!validActionTypes.includes(a.cardType)) return;
    if (!a.targetId || !pos[a.targetId]) return;

    const reflected = a.status === 'REFLECTED';
    const fromId = p.id;
    if (!pos[fromId]) return;

    const allTargets = [a.targetId, ...(a.additionalTargets || [])].filter((tid) =>
      Boolean(tid && pos[tid])
    );

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
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full z-20"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="arrowhead-red"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0,0 5,2.5 0,5" fill="#dc2626" />
        </marker>
        <marker
          id="arrowhead-gold"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0,0 5,2.5 0,5" fill="#d4af37" />
        </marker>
        <marker
          id="arrowhead-purple"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0,0 5,2.5 0,5" fill="#c084fc" />
        </marker>
        <marker
          id="arrowhead-blue"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0,0 5,2.5 0,5" fill="#7fa3c0" />
        </marker>
        <marker
          id="arrowhead-teal"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0,0 5,2.5 0,5" fill="#2dd4bf" />
        </marker>
        <marker
          id="arrowhead-orange"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0,0 5,2.5 0,5" fill="#fb923c" />
        </marker>
        <marker
          id="arrowhead-rose"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0,0 5,2.5 0,5" fill="#f43f5e" />
        </marker>
        <marker
          id="arrowhead-lime"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0,0 5,2.5 0,5" fill="#a3e635" />
        </marker>
        <marker
          id="arrowhead-emerald"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0,0 5,2.5 0,5" fill="#4ade80" />
        </marker>
      </defs>

      {/* Fios carmesim de Pacto de Sangue */}
      {pactLines.map((pl) => {
        const { sx, sy, ex, ey } = shorten(pl.from, pl.to, 0.16, 0.84);
        return (
          <g key={pl.key}>
            <line
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke="#9f1239"
              strokeWidth="1.2"
              opacity="0.65"
            />
            <line
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke="#fb7185"
              strokeWidth="0.55"
              strokeDasharray="1.5 1.5"
              className="arrow-flow"
            />
          </g>
        );
      })}

      {/* Setas de ações */}
      {arrows.map((ar) => {
        const color = ar.reflected
          ? '#d4af37'
          : ar.type === CARD_TYPES.REVERSO
            ? '#c084fc'
            : ar.type === CARD_TYPES.PAREDE
              ? '#7fa3c0'
              : ar.type === CARD_TYPES.MANIPULAMENTO_ALMA
                ? '#2dd4bf'
                : ar.type === CARD_TYPES.SERINGA
                  ? '#4ade80'
                  : ar.type === CARD_TYPES.MARCA_MORTE
                    ? '#a3e635'
                    : ar.type === CARD_TYPES.DESARMAR
                      ? '#fb923c'
                      : ar.type === CARD_TYPES.REVELAR
                        ? '#f59e0b'
                        : ar.type === CARD_TYPES.PACTO_SANGUE
                          ? '#f43f5e'
                          : '#dc2626';

        const marker = ar.reflected
          ? 'url(#arrowhead-gold)'
          : ar.type === CARD_TYPES.REVERSO
            ? 'url(#arrowhead-purple)'
            : ar.type === CARD_TYPES.PAREDE
              ? 'url(#arrowhead-blue)'
              : ar.type === CARD_TYPES.MANIPULAMENTO_ALMA
                ? 'url(#arrowhead-teal)'
                : ar.type === CARD_TYPES.SERINGA
                  ? 'url(#arrowhead-emerald)'
                  : ar.type === CARD_TYPES.MARCA_MORTE
                    ? 'url(#arrowhead-lime)'
                    : ar.type === CARD_TYPES.DESARMAR
                      ? 'url(#arrowhead-orange)'
                      : ar.type === CARD_TYPES.REVELAR
                        ? 'url(#arrowhead-gold)'
                        : ar.type === CARD_TYPES.PACTO_SANGUE
                          ? 'url(#arrowhead-rose)'
                          : 'url(#arrowhead-red)';

        let d;
        if (ar.self) {
          const { x, y } = ar.to;
          d = `M ${x - 3} ${y - 7} C ${x - 12} ${y - 18}, ${x + 12} ${y - 18}, ${x + 3} ${y - 7}`;
        } else {
          const { sx, sy, ex, ey } = shorten(ar.from, ar.to, 0.22, 0.78);
          const mx = (sx + ex) / 2;
          const my = (sy + ey) / 2;
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
            strokeWidth="0.8"
            strokeLinecap="round"
            markerEnd={marker}
            className={ar.reflected ? 'arrow-flow-reverse' : 'arrow-flow'}
          />
        );
      })}
    </svg>
  );
}

export const TargetArrowsSVG = React.memo(TargetArrowsSVGBase);
export default TargetArrowsSVG;

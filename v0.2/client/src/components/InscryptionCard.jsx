import React from 'react';
import { cn } from '../lib/cn';

/* Espiral hipnótica gerada uma única vez */
const SPIRAL_PATH = (() => {
  let d = '';
  for (let t = 0; t <= Math.PI * 7; t += 0.2) {
    const r = 3 + t * 1.9;
    const x = 50 + r * Math.cos(t);
    const y = 50 + r * Math.sin(t);
    d += (d ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d;
})();

const BARB_XS = [14, 30, 46, 62, 78, 92];
const barb = (x, y) => `M${x - 2.5} ${y - 2.5} L${x + 2.5} ${y + 2.5} M${x + 2.5} ${y - 2.5} L${x - 2.5} ${y + 2.5}`;

function KnifeArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <g transform="rotate(-35 50 50)">
        <circle cx="50" cy="8" r="4.5" fill="#1a110b" stroke="#d4af37" strokeWidth="1" />
        <rect x="46.5" y="12" width="7" height="17" rx="1.5" fill="#2c1d12" stroke="#1a110b" strokeWidth="1" />
        {[15, 19, 23, 27].map((y) => (
          <line key={y} x1="46.5" x2="53.5" y1={y} y2={y - 2} stroke="#cbb892" strokeWidth="0.8" opacity="0.7" />
        ))}
        <rect x="35" y="29" width="30" height="5" rx="2" fill="#1a110b" stroke="#4a5568" strokeWidth="1" />
        <polygon points="43,34 57,34 57,62 50,87 43,62" fill="#4a5568" stroke="#1a110b" strokeWidth="1.6" />
        <polygon points="50,34 57,34 57,62 50,87" fill="#1a110b" opacity="0.4" />
        <line x1="50" y1="37" x2="50" y2="76" stroke="#1a110b" strokeWidth="1.4" />
      </g>
      {/* 3 gotas de sangue caindo da ponta */}
      <path d="M71 83 q-3.2 5 0 7.5 q3.2 -2.5 0 -7.5z" fill="#8b0000" />
      <path d="M68.5 91.5 q-2.4 4 0 6 q2.4 -2 0 -6z" fill="#8b0000" />
      <path d="M73 94 q-1.8 3 0 4.6 q1.8 -1.6 0 -4.6z" fill="#8b0000" />
    </svg>
  );
}

function WallArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {[18, 36, 54, 72].map((x) => (
        <g key={x}>
          <rect x={x} y="6" width="9" height="88" fill="#1a110b" />
          <rect x={x + 1.5} y="6" width="1.8" height="88" fill="#4a5568" opacity="0.7" />
          <polygon points={`${x},6 ${x + 4.5},0 ${x + 9},6`} fill="#1a110b" />
        </g>
      ))}
      {[34, 62].map((y) => (
        <g key={y}>
          <path
            d={`M3 ${y} Q 12 ${y - 4} 21 ${y} T 39 ${y} T 57 ${y} T 75 ${y} T 97 ${y}`}
            fill="none"
            stroke="#4a5568"
            strokeWidth="1.6"
          />
          {BARB_XS.map((x) => (
            <path key={x} d={barb(x, y)} stroke="#1a110b" strokeWidth="1.3" />
          ))}
        </g>
      ))}
      {/* Mãos agarrando as grades */}
      {[22.5, 76.5].map((cx) => (
        <g key={cx} fill="#0a0705" stroke="#4a5568" strokeWidth="0.8">
          <ellipse cx={cx} cy="84" rx="8" ry="6" />
          {[70, 75, 80].map((y) => (
            <rect key={y} x={cx - 8.5} y={y} width="17" height="4" rx="2" />
          ))}
          <rect x={cx - 2} y="86" width="4" height="12" rx="2" />
        </g>
      ))}
    </svg>
  );
}

function ReverseArt() {
  const arrow = (
    <g>
      <path d="M13 66 A 42 42 0 0 1 28 16" fill="none" stroke="#8b0000" strokeWidth="3" strokeLinecap="round" />
      <polygon points="21,19 36,13 30,27" fill="#8b0000" />
    </g>
  );
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d={SPIRAL_PATH} fill="none" stroke="#1a110b" strokeWidth="2.2" opacity="0.85" />
      {arrow}
      <g transform="translate(100 0) scale(-1 1)">{arrow}</g>
      <path d="M24 50 Q50 28 76 50 Q50 72 24 50Z" fill="#cbb892" stroke="#1a110b" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="10" fill="#1a110b" />
      <circle cx="50" cy="50" r="5" fill="#8b0000" />
      <circle cx="47.5" cy="47.5" r="1.6" fill="#cbb892" opacity="0.8" />
    </svg>
  );
}

function CardBack() {
  return (
    <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 opacity-90">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#d4af37" strokeWidth="2" opacity="0.8" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#d4af37" strokeWidth="1.2" opacity="0.8" />
      <polygon points="50,18 74,50 50,82 26,50" fill="none" stroke="#d4af37" strokeWidth="2" />
      <polygon points="50,30 62,50 50,70 38,50" fill="#8b0000" opacity="0.7" />
      <circle cx="50" cy="50" r="4" fill="#d4af37" />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1="50" y1="4" x2="50" y2="14" stroke="#d4af37" strokeWidth="2" transform={`rotate(${a} 50 50)`} />
      ))}
    </svg>
  );
}

const META = {
  FACA: { name: 'FACA', foot: '1 DANO / QUEBRA PAREDE', Art: KnifeArt },
  PAREDE: { name: 'PAREDE', foot: 'ISOLA ALVO / AUTO-MIRA', Art: WallArt },
  REVERSO: { name: 'REVERSO', foot: 'REVERTE / ROUBA PAREDE', Art: ReverseArt },
};

function InscryptionCardBase({ card, isSelected, onClick, onDragStart, onDragEnd, disabled, faceDown, small }) {
  const size = small ? 'w-[64px] h-[92px]' : 'w-[118px] h-[168px]';

  if (faceDown) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center rounded-md bg-[#1a110b] border-2 border-[#d4af37]/60 shadow-[0_6px_14px_rgba(0,0,0,0.8)]',
          size
        )}
      >
        <svg viewBox="0 0 20 12" className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-4 h-3 drop-shadow-[0_0_4px_#dc2626]">
          <polygon points="10,0 20,12 0,12" fill="#dc2626" />
        </svg>
        <CardBack />
      </div>
    );
  }

  const meta = META[card?.type];
  if (!meta) return null;
  const { Art } = meta;

  return (
    <div
      draggable={!disabled && !!onDragStart}
      onDragStart={(e) => onDragStart && onDragStart(e, card)}
      onDragEnd={onDragEnd}
      onClick={() => !disabled && onClick && onClick(card)}
      className={cn(
        'relative flex flex-col rounded-md bg-[#cbb892] border-4 border-stone-900',
        'shadow-[inset_0_0_20px_rgba(44,29,18,0.6)] transition-transform duration-200',
        size,
        !disabled && onClick && 'cursor-pointer hover:-translate-y-3 hover:shadow-[0_0_18px_rgba(212,175,55,0.5)]',
        disabled && 'opacity-60 saturate-50',
        isSelected && '-translate-y-6 ring-2 ring-gold-aged shadow-[0_0_24px_rgba(212,175,55,0.8)]'
      )}
    >
      <div
        className={cn(
          'font-grimoire font-extrabold tracking-widest text-stone-900 border-b-2 border-stone-900 text-center leading-tight',
          small ? 'text-[8px] py-[1px]' : 'text-[13px] py-[2px]'
        )}
      >
        {meta.name}
      </div>
      <div className="flex-1 m-[3px] border-2 border-stone-900 bg-[#b9a47a] overflow-hidden p-[2px]">
        <Art />
      </div>
      <div
        className={cn(
          'font-typewriter text-stone-900 text-center border-t-2 border-stone-900 leading-tight',
          small ? 'text-[5px] py-[1px]' : 'text-[8.5px] py-[2px]'
        )}
      >
        {meta.foot}
      </div>
    </div>
  );
}

export const InscryptionCard = React.memo(InscryptionCardBase);
export default InscryptionCard;

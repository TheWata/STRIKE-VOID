import React from 'react';
import { cn } from '../lib/cn';
import { CARD_TYPES, CARD_META } from '../models/cardModel';

/* Espiral hipnótica gerada uma única vez (Usada na carta REVELAR - antigo Reverso do Olho) */
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
const barb = (x, y) =>
  `M${x - 2.5} ${y - 2.5} L${x + 2.5} ${y + 2.5} M${x + 2.5} ${y - 2.5} L${x - 2.5} ${y + 2.5}`;

/* 1. FACA */
function KnifeArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <g transform="rotate(-35 50 50)">
        <circle cx="50" cy="8" r="4.5" fill="#1a110b" stroke="#d4af37" strokeWidth="1" />
        <rect
          x="46.5"
          y="12"
          width="7"
          height="17"
          rx="1.5"
          fill="#2c1d12"
          stroke="#1a110b"
          strokeWidth="1"
        />
        {[15, 19, 23, 27].map((y) => (
          <line
            key={y}
            x1="46.5"
            x2="53.5"
            y1={y}
            y2={y - 2}
            stroke="#cbb892"
            strokeWidth="0.8"
            opacity="0.7"
          />
        ))}
        <rect
          x="35"
          y="29"
          width="30"
          height="5"
          rx="2"
          fill="#1a110b"
          stroke="#4a5568"
          strokeWidth="1"
        />
        <polygon
          points="43,34 57,34 57,62 50,87 43,62"
          fill="#4a5568"
          stroke="#1a110b"
          strokeWidth="1.6"
        />
        <polygon points="50,34 57,34 57,62 50,87" fill="#1a110b" opacity="0.4" />
        <line x1="50" y1="37" x2="50" y2="76" stroke="#1a110b" strokeWidth="1.4" />
      </g>
      <path d="M71 83 q-3.2 5 0 7.5 q3.2 -2.5 0 -7.5z" fill="#8b0000" />
      <path d="M68.5 91.5 q-2.4 4 0 6 q2.4 -2 0 -6z" fill="#8b0000" />
      <path d="M73 94 q-1.8 3 0 4.6 q1.8 -1.6 0 -4.6z" fill="#8b0000" />
    </svg>
  );
}

/* 2. PAREDE */
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

/* 3. ESPELHO AMALDIÇOADO (Antigo Reverso -> Agora um Espelho Quebrado Sombrio) */
function CursedMirrorArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Moldura oval gótica entalhada */}
      <ellipse
        cx="50"
        cy="50"
        rx="34"
        ry="43"
        fill="#1a110b"
        stroke="#2c1d12"
        strokeWidth="3"
      />
      {/* Ornamentos de ferro/ouro velho nos polos da moldura */}
      <polygon points="50,2 44,10 56,10" fill="#8b0000" stroke="#1a110b" strokeWidth="1" />
      <polygon points="50,98 44,90 56,90" fill="#8b0000" stroke="#1a110b" strokeWidth="1" />
      <polygon points="12,50 18,45 18,55" fill="#d4af37" opacity="0.75" />
      <polygon points="88,50 82,45 82,55" fill="#d4af37" opacity="0.75" />

      {/* Superfície de vidro escuro do espelho */}
      <ellipse
        cx="50"
        cy="50"
        rx="27"
        ry="35"
        fill="#271c29"
        stroke="#d4af37"
        strokeWidth="1.6"
      />

      {/* Cacos estilhaçados refletindo tons sombrios e carmesim */}
      <polygon
        points="50,48 28,29 45,16 54,32"
        fill="#4a354f"
        opacity="0.7"
      />
      <polygon
        points="50,48 73,31 66,54"
        fill="#8b0000"
        opacity="0.55"
      />
      <polygon
        points="50,48 31,72 52,84 62,67"
        fill="#cbb892"
        opacity="0.35"
      />
      <polygon
        points="50,48 24,52 33,69"
        fill="#120a07"
        opacity="0.85"
      />

      {/* Rachaduras profundas irradiando do impacto central */}
      <g stroke="#cbb892" strokeLinecap="round" fill="none">
        <path d="M50 48 L30 24" strokeWidth="1.8" />
        <path d="M50 48 L66 21" strokeWidth="1.5" />
        <path d="M50 48 L76 44" strokeWidth="1.8" />
        <path d="M50 48 L70 72" strokeWidth="1.6" />
        <path d="M50 48 L47 84" strokeWidth="1.9" />
        <path d="M50 48 L26 66" strokeWidth="1.6" />
        <path d="M50 48 L23 43" strokeWidth="1.4" />
        {/* Ramificações secundárias do vidro trincado */}
        <path d="M39 35 L48 25" strokeWidth="1" opacity="0.8" />
        <path d="M62 38 L71 31" strokeWidth="1" opacity="0.8" />
        <path d="M59 61 L69 57" strokeWidth="1" opacity="0.8" />
        <path d="M38 57 L29 53" strokeWidth="1" opacity="0.8" />
      </g>

      {/* Ponto de impacto amaldiçoado no centro + setas de inversão */}
      <circle cx="50" cy="48" r="4" fill="#8b0000" stroke="#1a110b" strokeWidth="1.2" />
      <path
        d="M11 32 A 42 42 0 0 1 24 12"
        fill="none"
        stroke="#8b0000"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <polygon points="18,13 28,9 25,20" fill="#8b0000" />
      <path
        d="M89 68 A 42 42 0 0 1 76 88"
        fill="none"
        stroke="#8b0000"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <polygon points="82,87 72,91 75,80" fill="#8b0000" />
    </svg>
  );
}

/* 4. REVELAR (Utiliza a arte do olho hipnótico que pertencia ao antigo Reverso) */
function RevealEyeArt() {
  const arrow = (
    <g>
      <path
        d="M13 66 A 42 42 0 0 1 28 16"
        fill="none"
        stroke="#8b0000"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polygon points="21,19 36,13 30,27" fill="#8b0000" />
    </g>
  );
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d={SPIRAL_PATH} fill="none" stroke="#1a110b" strokeWidth="2.2" opacity="0.85" />
      {arrow}
      <g transform="translate(100 0) scale(-1 1)">{arrow}</g>
      <path
        d="M24 50 Q50 28 76 50 Q50 72 24 50Z"
        fill="#cbb892"
        stroke="#1a110b"
        strokeWidth="2.4"
      />
      <circle cx="50" cy="50" r="10" fill="#1a110b" />
      <circle cx="50" cy="50" r="5" fill="#8b0000" />
      <circle cx="47.5" cy="47.5" r="1.6" fill="#cbb892" opacity="0.8" />
    </svg>
  );
}

/* 5. DESARMAR (Duas cartas sendo arrancadas/cortadas da mão do oponente) */
function DisarmArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Carta 1 caindo inclinada à esquerda */}
      <g transform="translate(26 36) rotate(-22)">
        <rect
          x="-14"
          y="-20"
          width="28"
          height="40"
          rx="2.5"
          fill="#cbb892"
          stroke="#1a110b"
          strokeWidth="2.2"
        />
        <rect
          x="-10"
          y="-15"
          width="20"
          height="30"
          fill="#2c1d12"
          opacity="0.35"
        />
        <line x1="-12" y1="-4" x2="12" y2="8" stroke="#8b0000" strokeWidth="2.5" />
      </g>

      {/* Carta 2 caindo inclinada à direita */}
      <g transform="translate(68 42) rotate(24)">
        <rect
          x="-14"
          y="-20"
          width="28"
          height="40"
          rx="2.5"
          fill="#cbb892"
          stroke="#1a110b"
          strokeWidth="2.2"
        />
        <rect
          x="-10"
          y="-15"
          width="20"
          height="30"
          fill="#2c1d12"
          opacity="0.35"
        />
        <line x1="-12" y1="6" x2="12" y2="-6" stroke="#8b0000" strokeWidth="2.5" />
      </g>

      {/* Golpe transversal estilhaçando a posse das duas cartas */}
      <path
        d="M8 72 Q 50 42 92 22"
        fill="none"
        stroke="#8b0000"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M12 75 Q 52 45 94 25"
        fill="none"
        stroke="#1a110b"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Silhueta de mão sombria na base soltando as cartas */}
      <path
        d="M34 94 L36 74 L41 74 L41 84 L45 68 L50 68 L49 83 L55 70 L60 71 L56 85 L63 76 L67 79 L59 94 Z"
        fill="#1a110b"
        stroke="#2c1d12"
        strokeWidth="1"
      />
    </svg>
  );
}

/* 6. MANIPULAMENTO DE ALMA (Duas almas em espiral trocando vitalidade + lâmina espiritual) */
function SoulManipArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Anel de transmutação de almas */}
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="#1a110b"
        strokeWidth="2"
        strokeDasharray="5 3"
      />
      <path
        d="M20 44 A 30 30 0 0 1 78 38"
        fill="none"
        stroke="#1a110b"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <polygon points="78,31 85,43 72,42" fill="#1a110b" />

      <path
        d="M80 56 A 30 30 0 0 1 22 62"
        fill="none"
        stroke="#8b0000"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <polygon points="22,69 15,57 28,58" fill="#8b0000" />

      {/* Alma Esquerda (Clara) */}
      <g transform="translate(31 38)">
        <path
          d="M0 -12 C -9 -12 -12 -4 -10 4 C -8 10 -4 14 0 18 C 4 14 8 10 10 4 C 12 -4 9 -12 0 -12 Z"
          fill="#cbb892"
          stroke="#1a110b"
          strokeWidth="2"
        />
        <circle cx="-3.5" cy="-2" r="2.2" fill="#1a110b" />
        <circle cx="3.5" cy="-2" r="2.2" fill="#1a110b" />
      </g>

      {/* Alma Direita (Sombria/Sangue) */}
      <g transform="translate(69 62)">
        <path
          d="M0 -12 C -9 -12 -12 -4 -10 4 C -8 10 -4 14 0 18 C 4 14 8 10 10 4 C 12 -4 9 -12 0 -12 Z"
          fill="#1a110b"
          stroke="#8b0000"
          strokeWidth="2"
        />
        <circle cx="-3.5" cy="-2" r="2.2" fill="#8b0000" />
        <circle cx="3.5" cy="-2" r="2.2" fill="#8b0000" />
      </g>

      {/* Faca ritualística central (auto-alvo aumenta dano da faca) */}
      <polygon
        points="50,20 55,48 50,78 45,48"
        fill="#8b0000"
        stroke="#1a110b"
        strokeWidth="1.8"
      />
      <circle cx="50" cy="48" r="4" fill="#d4af37" stroke="#1a110b" strokeWidth="1.2" />
    </svg>
  );
}

/* 7. PACTO DE SANGUE (Coração/Vidas acorrentadas em sangue atravessando parede) */
function BloodPactArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Grades quebradas ao fundo simbolizando que ignora Parede */}
      {[26, 50, 74].map((x) => (
        <g key={x} opacity="0.45">
          <rect x={x - 3} y="8" width="6" height="30" fill="#1a110b" />
          <rect x={x - 3} y="62" width="6" height="30" fill="#1a110b" />
        </g>
      ))}

      {/* Dois corações/vidas vinculados por corrente de sangue */}
      <path
        d="M18 50 C 35 32, 65 68, 82 50"
        fill="none"
        stroke="#8b0000"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M18 50 C 35 68, 65 32, 82 50"
        fill="none"
        stroke="#1a110b"
        strokeWidth="2.5"
        strokeDasharray="4 3"
      />

      {/* Símbolo de vida esquerdo */}
      <circle cx="24" cy="50" r="13" fill="#8b0000" stroke="#1a110b" strokeWidth="2.4" />
      <circle cx="24" cy="50" r="5" fill="#cbb892" />

      {/* Símbolo de vida direito */}
      <circle cx="76" cy="50" r="13" fill="#8b0000" stroke="#1a110b" strokeWidth="2.4" />
      <circle cx="76" cy="50" r="5" fill="#cbb892" />

      {/* Nó central de pacto de sangue */}
      <polygon
        points="50,33 61,50 50,67 39,50"
        fill="#1a110b"
        stroke="#d4af37"
        strokeWidth="2"
      />
      <circle cx="50" cy="50" r="4.5" fill="#dc2626" />
      {/* Gotas de sangue */}
      <path d="M50 71 q-3.5 6 0 9 q3.5 -3 0 -9z" fill="#8b0000" />
      <path d="M50 83 q-2.5 4.5 0 6.5 q2.5 -2 0 -6.5z" fill="#8b0000" />
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
        <line
          key={a}
          x1="50"
          y1="4"
          x2="50"
          y2="14"
          stroke="#d4af37"
          strokeWidth="2"
          transform={`rotate(${a} 50 50)`}
        />
      ))}
    </svg>
  );
}

const ART_BY_TYPE = {
  [CARD_TYPES.FACA]: KnifeArt,
  [CARD_TYPES.PAREDE]: WallArt,
  [CARD_TYPES.REVERSO]: CursedMirrorArt,
  [CARD_TYPES.REVELAR]: RevealEyeArt,
  [CARD_TYPES.DESARMAR]: DisarmArt,
  [CARD_TYPES.MANIPULAMENTO_ALMA]: SoulManipArt,
  [CARD_TYPES.PACTO_SANGUE]: BloodPactArt,
};

function InscryptionCardBase({
  card,
  isSelected,
  onClick,
  onDragStart,
  onDragEnd,
  disabled,
  faceDown,
  small,
  mini,
  compact,
}) {
  const cardRef = React.useRef(null);
  const glareRef = React.useRef(null);
  const isHoveringRef = React.useRef(false);

  const size = mini
    ? 'w-[44px] h-[64px]'
    : small
      ? 'w-[64px] h-[92px]'
      : compact
        ? 'w-[clamp(58px,min(17vw,21dvh),106px)] aspect-[118/168]'
        : 'w-[118px] h-[168px]';

  const baseElevate = isSelected
    ? compact
      ? 'translateY(-14px) scale(1.05)'
      : 'translateY(-24px) scale(1.06)'
    : 'translateY(0px) scale(1)';

  React.useEffect(() => {
    if (!cardRef.current || small || mini) return;
    if (!isHoveringRef.current) {
      cardRef.current.style.transition =
        'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.4s ease';
      cardRef.current.style.transform = `perspective(800px) ${baseElevate} rotateX(0deg) rotateY(0deg)`;
      cardRef.current.style.boxShadow = '';
      if (glareRef.current) glareRef.current.style.opacity = '0';
    }
  }, [baseElevate, small, mini]);

  const updateTilt = (clientX, clientY) => {
    if (disabled || small || mini || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const dx = Math.max(-1, Math.min(1, (x - cx) / cx));
    const dy = Math.max(-1, Math.min(1, (y - cy) / cy));

    const rotX = -dy * 17;
    const rotY = dx * 17;

    const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

    const shadowX = (-dx * 14).toFixed(1);
    const shadowY = (-dy * 10 + 16).toFixed(1);
    const goldGlow = isSelected
      ? ', 0 0 28px rgba(212,175,55,0.85)'
      : ', 0 0 16px rgba(212,175,55,0.35)';

    cardRef.current.style.transition = 'transform 0.05s ease-out, box-shadow 0.05s ease-out';
    cardRef.current.style.transform = `perspective(800px) ${baseElevate} rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    cardRef.current.style.boxShadow = `inset 0 0 20px rgba(44,29,18,0.6), ${shadowX}px ${shadowY}px 24px rgba(0,0,0,0.85)${goldGlow}`;

    if (glareRef.current) {
      glareRef.current.style.opacity = '1';
      glareRef.current.style.background = `radial-gradient(circle at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgba(255, 240, 190, 0.35) 0%, rgba(212, 175, 55, 0.12) 40%, transparent 75%)`;
    }
  };

  const handleMouseMove = (e) => {
    isHoveringRef.current = true;
    updateTilt(e.clientX, e.clientY);
  };

  const handleMouseEnter = (e) => {
    if (disabled || small || mini) return;
    isHoveringRef.current = true;
    updateTilt(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    if (small || mini || !cardRef.current) return;
    cardRef.current.style.transition =
      'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.4s ease';
    cardRef.current.style.transform = `perspective(800px) ${baseElevate} rotateX(0deg) rotateY(0deg)`;
    cardRef.current.style.boxShadow = '';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  };

  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    updateTilt(t.clientX, t.clientY);
  };

  const handleTouchEnd = () => {
    handleMouseLeave();
  };

  if (faceDown) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center rounded-md bg-[#1a110b] border-2 border-[#d4af37]/60 shadow-[0_6px_14px_rgba(0,0,0,0.8)]',
          size
        )}
      >
        {!mini && (
          <svg
            viewBox="0 0 20 12"
            className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-4 h-3 drop-shadow-[0_0_4px_#dc2626]"
          >
            <polygon points="10,0 20,12 0,12" fill="#dc2626" />
          </svg>
        )}
        <CardBack />
      </div>
    );
  }

  const meta = CARD_META[card?.type];
  const Art = ART_BY_TYPE[card?.type];
  if (!meta || !Art) return null;
  const interactive = !disabled && !!onClick;
  const displayName = small || mini || compact ? meta.shortName : meta.name;

  return (
    <div
      ref={cardRef}
      role={onClick ? 'button' : undefined}
      aria-pressed={onClick ? !!isSelected : undefined}
      aria-disabled={onClick ? !!disabled : undefined}
      draggable={!disabled && !!onDragStart}
      onDragStart={(e) => {
        handleMouseLeave();
        onDragStart && onDragStart(e, card);
      }}
      onDragEnd={(e) => {
        handleMouseLeave();
        onDragEnd && onDragEnd(e);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={() => !disabled && onClick && onClick(card)}
      title={`${meta.name}: ${meta.description}`}
      style={{
        transformStyle: 'preserve-3d',
        transform: !small && !mini ? `perspective(800px) ${baseElevate}` : undefined,
      }}
      className={cn(
        'relative flex flex-col rounded-md bg-[#cbb892] border-stone-900 select-none will-change-transform',
        mini ? 'border-2' : compact ? 'border-[3px] touch-manipulation' : 'border-4',
        'shadow-[inset_0_0_20px_rgba(44,29,18,0.6)]',
        size,
        interactive && 'cursor-pointer',
        interactive && compact && 'active:scale-95',
        disabled && 'opacity-60 saturate-50',
        isSelected &&
          (compact
            ? 'ring-4 ring-gold-aged shadow-[0_0_26px_rgba(212,175,55,0.9)]'
            : 'ring-2 ring-gold-aged shadow-[0_0_24px_rgba(212,175,55,0.8)]')
      )}
    >
      {!small && !mini && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 rounded-md transition-opacity duration-200 opacity-0 z-30 mix-blend-overlay"
        />
      )}

      {/* Título da carta */}
      <div
        style={{ transform: !small && !mini ? 'translateZ(12px)' : undefined }}
        className={cn(
          'font-grimoire font-extrabold tracking-wider text-stone-900 border-b-2 border-stone-900 text-center leading-tight shrink-0 px-0.5 truncate',
          mini
            ? 'text-[6px] py-[1px]'
            : small
              ? 'text-[7px] py-[1px]'
              : compact
                ? 'text-[9.5px] py-[1px]'
                : 'text-[10.5px] py-[2px]'
        )}
      >
        {displayName}
      </div>

      {/* Caixa de Ilustração */}
      <div
        style={{ transform: !small && !mini ? 'translateZ(6px)' : undefined }}
        className={cn(
          'flex-1 border-stone-900 bg-[#b9a47a] overflow-hidden shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]',
          mini ? 'm-[1.5px] border p-[1px]' : 'm-[3px] border-2 p-[2px]'
        )}
      >
        <Art />
      </div>

      {/* Rodapé descritivo */}
      {!mini && (
        <div
          style={{ transform: !small ? 'translateZ(10px)' : undefined }}
          className={cn(
            'font-typewriter text-stone-900 text-center border-t-2 border-stone-900 leading-tight shrink-0 px-0.5 truncate',
            small ? 'text-[5px] py-[1px]' : compact ? 'text-[6px] py-[1px]' : 'text-[8px] py-[2px]'
          )}
        >
          {meta.foot}
        </div>
      )}
    </div>
  );
}

export const InscryptionCard = React.memo(InscryptionCardBase);
export default InscryptionCard;

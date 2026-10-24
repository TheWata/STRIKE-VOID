import React, { useState } from 'react';
import { cn } from '../lib/cn';
import { CARD_TYPES, CARD_META, CARD_CATEGORIES } from '../models/cardModel';
import {
  CARD_ART_ASSETS,
  TEXTURE_ASSETS,
  UI_ASSETS,
  getCardArtAsset,
} from '../models/assetCatalog';
import GameIcon from './GameIcon';

/**
 * Fallback vetorial leve caso uma ilustração externa falhe ao carregar.
 */
function CardArtFallback({ type }) {
  const meta = CARD_META[type];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#b9a47a] text-[#1a110b] p-2 text-center select-none pointer-events-none">
      <div
        className="w-8 h-8 rounded-full border-2 border-[#1a110b] flex items-center justify-center font-grimoire font-black text-xs"
        style={{ backgroundColor: meta?.accentColor || '#8b0000', color: '#f5ebd6' }}
      >
        P{meta?.priority || '?'}
      </div>
      <span className="mt-1 font-grimoire font-bold text-[8px] uppercase tracking-wider line-clamp-2">
        {meta?.shortName || type}
      </span>
    </div>
  );
}

/**
 * Camada de Ilustração da Carta:
 * Carrega o asset artístico dedicado (`public/assets/cards/*.webp`),
 * aplica moldura de canto reutilizável e, no caso da Seringa,
 * adiciona o indicador dinâmico de fluido proporcional às cargas (0..4).
 */
function CardIllustrationLayer({ card, mini }) {
  const [imgError, setImgError] = useState(false);
  const artSrc = getCardArtAsset(card?.type);
  const isSyringe = card?.type === CARD_TYPES.SERINGA;
  const charges = isSyringe ? Math.max(0, Math.min(4, Number(card?.charges) || 0)) : 0;

  return (
    <div className="relative w-full h-full overflow-hidden pointer-events-none select-none bg-[#b9a47a]">
      {artSrc && !imgError ? (
        <img
          src={artSrc}
          alt={CARD_META[card?.type]?.name || card?.type || ''}
          loading="eager"
          decoding="async"
          draggable={false}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-300"
        />
      ) : (
        <CardArtFallback type={card?.type} />
      )}

      {/* Camada de ornamento de cantos reutilizável */}
      {!mini && (
        <img
          src={UI_ASSETS.CARD_CORNER_ORNAMENT}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-fill opacity-70 mix-blend-multiply"
        />
      )}

      {/* Barra lateral dinâmica de nível de fluido para a carta SERINGA (0/4 a 4/4) */}
      {isSyringe && (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-1 top-1.5 bottom-1.5 flex flex-col justify-end rounded-full bg-black/75 border border-[#1a110b] overflow-hidden shadow-inner',
            mini ? 'w-1' : 'w-1.5'
          )}
        >
          <div
            className="w-full transition-all duration-500"
            style={{
              height: `${(charges / 4) * 100}%`,
              background:
                charges === 0
                  ? 'transparent'
                  : charges === 4
                    ? 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)'
                    : 'linear-gradient(180deg, #4ade80 0%, #15803d 100%)',
              boxShadow:
                charges === 4
                  ? '0 0 6px rgba(239,68,68,0.9)'
                  : charges > 0
                    ? '0 0 6px rgba(74,222,128,0.8)'
                    : 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Verso da carta usando o asset dedicado `card-back.webp` com fallback seguro.
 */
function CardBackLayer() {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-3/4 h-3/4 rounded border border-gold-aged/70 bg-[#140c07] flex items-center justify-center">
        <div className="w-3 h-3 rotate-45 bg-blood border border-gold-aged" />
      </div>
    );
  }

  return (
    <img
      src={CARD_ART_ASSETS.CARD_BACK}
      alt="Verso da carta"
      loading="eager"
      decoding="async"
      draggable={false}
      onError={() => setImgError(true)}
      className="w-full h-full object-cover rounded-[4px] pointer-events-none select-none"
    />
  );
}

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
          'relative flex items-center justify-center rounded-md bg-[#1a110b] border-2 border-[#d4af37]/65 shadow-[0_6px_14px_rgba(0,0,0,0.85)] overflow-hidden',
          size
        )}
      >
        {!mini && (
          <svg
            viewBox="0 0 20 12"
            className="pointer-events-none absolute -top-[7px] left-1/2 -translate-x-1/2 w-4 h-3 drop-shadow-[0_0_4px_#dc2626] z-10"
          >
            <polygon points="10,0 20,12 0,12" fill="#dc2626" />
          </svg>
        )}
        <CardBackLayer />
      </div>
    );
  }

  const meta = CARD_META[card?.type];
  if (!meta) return null;

  const interactive = !disabled && !!onClick;
  const displayName = small || mini || compact ? meta.shortName : meta.name;
  const categoryInfo = CARD_CATEGORIES[meta.category];
  const isSyringe = card?.type === CARD_TYPES.SERINGA;
  const syringeCharges = isSyringe ? Math.max(0, Math.min(4, Number(card?.charges) || 0)) : 0;
  const footerText = isSyringe
    ? syringeCharges === 0
      ? 'VAZIA (0/4) · +1/TURNO'
      : `CURA ${syringeCharges} (${syringeCharges}/4) · OVERDOSE`
    : meta.foot;

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
      title={`${meta.name} [${meta.badge}]: ${meta.description}`}
      style={{
        transformStyle: 'preserve-3d',
        transform: !small && !mini ? `perspective(800px) ${baseElevate}` : undefined,
        backgroundImage: `url(${TEXTURE_ASSETS.PARCHMENT_GRAIN})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className={cn(
        'relative flex flex-col rounded-md bg-[#cbb892] border-stone-900 select-none will-change-transform',
        mini ? 'border-2' : compact ? 'border-[3px] touch-manipulation' : 'border-4',
        'shadow-[inset_0_0_20px_rgba(44,29,18,0.65)]',
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

      {/* Título dinâmico renderizado pelo React */}
      <div
        style={{ transform: !small && !mini ? 'translateZ(12px)' : undefined }}
        className={cn(
          'pointer-events-none font-grimoire font-extrabold tracking-wider text-stone-950 border-b-2 border-stone-900 bg-[#d5c39f]/45 text-center leading-tight shrink-0 px-0.5 truncate',
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

      {/* Caixa de Ilustração Artística */}
      <div
        style={{ transform: !small && !mini ? 'translateZ(6px)' : undefined }}
        className={cn(
          'pointer-events-none relative flex-1 border-stone-900 bg-[#b9a47a] overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]',
          mini ? 'm-[1.5px] border' : 'm-[3px] border-2'
        )}
      >
        {/* Selo de Prioridade e Categoria */}
        {!mini && categoryInfo && (
          <div
            className={cn(
              'pointer-events-none absolute top-0.5 left-0.5 z-10 rounded border px-1 font-typewriter font-extrabold uppercase tracking-tighter leading-none shadow-sm',
              small ? 'text-[5px] py-[1px]' : 'text-[6.5px] py-[1.5px]',
              categoryInfo.badgeCls
            )}
          >
            {small ? `P${meta.priority}` : `P${meta.priority}·${meta.categoryLabel}`}
          </div>
        )}

        {/* Medidor de Cargas da Seringa com Ícone SVG Dedicado */}
        {isSyringe && !mini && (
          <div
            className={cn(
              'pointer-events-none absolute bottom-0.5 right-0.5 z-10 flex items-center gap-0.5 rounded border px-1 py-[1px] font-typewriter font-extrabold leading-none shadow-sm',
              syringeCharges === 0
                ? 'border-stone-600 bg-stone-950/90 text-stone-300'
                : syringeCharges === 4
                  ? 'border-red-400 bg-red-950/95 text-red-200 animate-pulse'
                  : 'border-emerald-400 bg-emerald-950/95 text-emerald-200',
              small ? 'text-[5.5px]' : 'text-[7px]'
            )}
          >
            <GameIcon name="syringe-vial" size={small ? 7 : 9} />
            <span>{syringeCharges}/4</span>
          </div>
        )}

        <CardIllustrationLayer card={card} mini={mini} />
      </div>

      {/* Rodapé descritivo dinâmico renderizado pelo React */}
      {!mini && (
        <div
          style={{ transform: !small ? 'translateZ(10px)' : undefined }}
          className={cn(
            'pointer-events-none font-typewriter text-stone-950 bg-[#d5c39f]/45 text-center border-t-2 border-stone-900 leading-tight shrink-0 px-0.5 truncate',
            small ? 'text-[5px] py-[1px]' : compact ? 'text-[6px] py-[1px]' : 'text-[7.5px] py-[2px]'
          )}
        >
          {footerText}
        </div>
      )}
    </div>
  );
}

export const InscryptionCard = React.memo(InscryptionCardBase);
export default InscryptionCard;

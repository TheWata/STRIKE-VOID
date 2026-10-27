import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';
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
        className="w-9 h-9 rounded-full border-2 border-[#1a110b] flex items-center justify-center font-grimoire font-black text-xs"
        style={{ backgroundColor: meta?.accentColor || '#8b0000', color: '#f5ebd6' }}
      >
        P{meta?.priority || '?'}
      </div>
      <span className="mt-1 font-grimoire font-bold text-[10px] uppercase tracking-wider line-clamp-2">
        {meta?.name || type}
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
            'pointer-events-none absolute left-1.5 top-2 bottom-2 flex flex-col justify-end rounded-full bg-black/80 border border-[#1a110b] overflow-hidden shadow-inner',
            mini ? 'w-1' : 'w-2'
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
                  ? '0 0 8px rgba(239,68,68,0.95)'
                  : charges > 0
                    ? '0 0 8px rgba(74,222,128,0.85)'
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
  onInspect,
  onDragStart,
  onDragEnd,
  disabled,
  faceDown,
  small,
  mini,
  compact,
  large,
  xlarge,
  inspect,
}) {
  const cardRef = React.useRef(null);
  const glareRef = React.useRef(null);
  const isHoveringRef = React.useRef(false);

  const isToken = Boolean(small || mini);

  // Escalas proporcionais (~1 : 1.45), garantindo legibilidade integral na gameplay e no guia
  const size = mini
    ? 'w-[52px] h-[76px]'
    : small
      ? 'w-[70px] h-[102px]'
      : inspect
        ? 'w-[288px] h-[420px] sm:w-[332px] sm:h-[484px]'
        : xlarge
          ? 'w-[216px] h-[314px]'
          : large
            ? 'w-[196px] h-[284px]'
            : compact
              ? 'w-[168px] h-[244px]'
              : 'w-[194px] h-[282px]';

  const baseElevate = isSelected
    ? compact
      ? 'translateY(-14px) scale(1.04)'
      : 'translateY(-22px) scale(1.05)'
    : 'translateY(0px) scale(1)';

  React.useEffect(() => {
    if (!cardRef.current || isToken) return;
    if (!isHoveringRef.current) {
      cardRef.current.style.transition =
        'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.4s ease';
      cardRef.current.style.transform = `perspective(900px) ${baseElevate} rotateX(0deg) rotateY(0deg)`;
      cardRef.current.style.boxShadow = '';
      if (glareRef.current) glareRef.current.style.opacity = '0';
    }
  }, [baseElevate, isToken]);

  const updateTilt = (clientX, clientY) => {
    if (disabled || isToken || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const dx = Math.max(-1, Math.min(1, (x - cx) / cx));
    const dy = Math.max(-1, Math.min(1, (y - cy) / cy));

    const maxTilt = inspect ? 10 : 14;
    const rotX = -dy * maxTilt;
    const rotY = dx * maxTilt;

    const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

    const shadowX = (-dx * 14).toFixed(1);
    const shadowY = (-dy * 10 + 16).toFixed(1);
    const goldGlow = isSelected
      ? ', 0 0 28px rgba(212,175,55,0.88)'
      : ', 0 0 18px rgba(212,175,55,0.38)';

    cardRef.current.style.transition = 'transform 0.05s ease-out, box-shadow 0.05s ease-out';
    cardRef.current.style.transform = `perspective(900px) ${baseElevate} rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    cardRef.current.style.boxShadow = `inset 0 0 20px rgba(44,29,18,0.6), ${shadowX}px ${shadowY}px 24px rgba(0,0,0,0.88)${goldGlow}`;

    if (glareRef.current) {
      glareRef.current.style.opacity = '1';
      glareRef.current.style.background = `radial-gradient(circle at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgba(255, 240, 190, 0.32) 0%, rgba(212, 175, 55, 0.1) 42%, transparent 75%)`;
    }
  };

  const handleMouseMove = (e) => {
    isHoveringRef.current = true;
    updateTilt(e.clientX, e.clientY);
  };

  const handleMouseEnter = (e) => {
    if (disabled || isToken) return;
    isHoveringRef.current = true;
    updateTilt(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    if (isToken || !cardRef.current) return;
    cardRef.current.style.transition =
      'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.4s ease';
    cardRef.current.style.transform = `perspective(900px) ${baseElevate} rotateX(0deg) rotateY(0deg)`;
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

  const interactive = (!disabled && !!onClick) || !!onInspect;
  const displayName = isToken ? meta.shortName : meta.name;
  const categoryInfo = CARD_CATEGORIES[meta.category];
  const isSyringe = card?.type === CARD_TYPES.SERINGA;
  const syringeCharges = isSyringe ? Math.max(0, Math.min(4, Number(card?.charges) || 0)) : 0;
  const footerText = isSyringe
    ? syringeCharges === 0
      ? 'VAZIA (0/4) · +1 CARGA/TURNO'
      : `CURA ${syringeCharges} HP (${syringeCharges}/4) · OVERDOSE`
    : meta.foot;

  return (
    <div
      ref={cardRef}
      role={onClick || onInspect ? 'button' : undefined}
      aria-pressed={onClick ? !!isSelected : undefined}
      aria-disabled={onClick ? !!disabled : undefined}
      draggable={!disabled && !!onDragStart}
      onDragStart={(e) => {
        handleMouseLeave();
        if (onDragStart) onDragStart(e, card);
      }}
      onDragEnd={(e) => {
        handleMouseLeave();
        if (onDragEnd) onDragEnd(e);
      }}
      onContextMenu={(e) => {
        if (onInspect) {
          e.preventDefault();
          e.stopPropagation();
          onInspect(card);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={() => {
        if (!disabled && onClick) {
          onClick(card);
        } else if (onInspect) {
          onInspect(card);
        }
      }}
      title={`${meta.name} [${meta.badge}] — ${meta.cardText}`}
      style={{
        transformStyle: 'preserve-3d',
        transform: !isToken ? `perspective(900px) ${baseElevate}` : undefined,
        backgroundImage: `url(${TEXTURE_ASSETS.PARCHMENT_GRAIN})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className={cn(
        'relative flex flex-col rounded-lg bg-[#d3c09a] border-stone-950 select-none will-change-transform overflow-hidden',
        mini ? 'border-2' : small ? 'border-[2.5px]' : inspect ? 'border-[5px]' : 'border-4',
        'shadow-[inset_0_0_22px_rgba(44,29,18,0.6),0_10px_24px_rgba(0,0,0,0.85)]',
        size,
        interactive && 'cursor-pointer',
        interactive && compact && 'active:scale-95',
        disabled && !inspect && 'opacity-75 saturate-[0.7]',
        isSelected &&
          (compact
            ? 'ring-4 ring-gold-aged shadow-[0_0_28px_rgba(212,175,55,0.95)]'
            : 'ring-[3px] ring-gold-aged shadow-[0_0_28px_rgba(212,175,55,0.9)]')
      )}
    >
      {!isToken && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 rounded-md transition-opacity duration-200 opacity-0 z-30 mix-blend-overlay"
        />
      )}

      {/* 1. CABEÇALHO DA CARTA: PRIORIDADE + TÍTULO LEGÍVEL + BOTÃO DE INSPEÇÃO */}
      <div
        style={{ transform: !isToken ? 'translateZ(12px)' : undefined }}
        className={cn(
          'relative flex items-center justify-between gap-1 border-b-2 border-stone-950 bg-[#e2d1ae]/90 text-stone-950 shrink-0',
          mini
            ? 'px-0.5 py-[1px]'
            : small
              ? 'px-1 py-[1.5px]'
              : inspect
                ? 'px-2.5 py-1.5'
                : 'px-1.5 py-1'
        )}
      >
        {!isToken && (
          <span
            className={cn(
              'pointer-events-none shrink-0 rounded font-mono font-black uppercase leading-none border border-stone-900 px-1 py-0.5 shadow-sm',
              inspect ? 'text-xs' : 'text-[10px]',
              categoryInfo?.badgeCls
            )}
          >
            P{meta.priority}
          </span>
        )}

        <span
          className={cn(
            'pointer-events-none flex-1 font-grimoire font-black tracking-wide text-stone-950 text-center leading-tight truncate',
            mini
              ? 'text-[6.5px]'
              : small
                ? 'text-[8px]'
                : inspect
                  ? 'text-[17px] sm:text-[19px]'
                  : xlarge
                    ? 'text-[13.5px]'
                    : compact
                      ? 'text-[11.5px]'
                      : 'text-[12.5px]'
          )}
        >
          {displayName}
        </span>

        {!isToken && onInspect && !inspect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect(card);
            }}
            title={`Inspecionar ${meta.name} em tamanho ampliado`}
            aria-label={`Inspecionar ${meta.name}`}
            className="pointer-events-auto shrink-0 w-5 h-5 rounded bg-stone-900/90 hover:bg-blood text-amber-200 hover:text-white border border-gold-aged/70 flex items-center justify-center transition-colors shadow-sm"
          >
            <ZoomIn size={11} />
          </button>
        )}
      </div>

      {/* 2. JANELA DE ILUSTRAÇÃO ARTÍSTICA + SELOS DE CATEGORIA E CARGAS */}
      <div
        style={{ transform: !isToken ? 'translateZ(6px)' : undefined }}
        className={cn(
          'pointer-events-none relative border-stone-950 bg-[#b9a47a] overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.65)]',
          mini
            ? 'flex-1 m-[1.5px] border'
            : small
              ? 'flex-1 m-[2px] border'
              : inspect
                ? 'h-[45%] m-1.5 border-2 rounded-sm shrink-0'
                : 'h-[43%] m-1 border-2 rounded-sm shrink-0'
        )}
      >
        {/* Selo de Categoria / Tipo */}
        {!mini && categoryInfo && (
          <div
            className={cn(
              'pointer-events-none absolute top-1 left-1 z-10 rounded border px-1.5 font-mono font-extrabold uppercase tracking-tight leading-none shadow-md',
              small
                ? 'text-[6px] py-[1px]'
                : inspect
                  ? 'text-xs py-1 px-2'
                  : 'text-[9.5px] py-[2px]',
              categoryInfo.badgeCls
            )}
          >
            {small ? `P${meta.priority}` : `P${meta.priority} · ${meta.categoryLabel}`}
          </div>
        )}

        {/* Selo de Alvo no canto inferior esquerdo da arte */}
        {!isToken && meta.targetShort && (
          <div
            className={cn(
              'pointer-events-none absolute bottom-1 left-1 z-10 rounded bg-black/85 border border-stone-600/90 text-amber-100 font-mono font-bold leading-none px-1.5 py-[2px] shadow-md',
              inspect ? 'text-[11px] py-1 px-2' : 'text-[8.5px]'
            )}
          >
            {meta.targetShort}
          </div>
        )}

        {/* Medidor de Cargas da Seringa com Ícone SVG Dedicado */}
        {isSyringe && !mini && (
          <div
            className={cn(
              'pointer-events-none absolute bottom-1 right-1 z-10 flex items-center gap-1 rounded border px-1.5 py-[2px] font-mono font-extrabold leading-none shadow-md',
              syringeCharges === 0
                ? 'border-stone-500 bg-stone-950/95 text-stone-200'
                : syringeCharges === 4
                  ? 'border-red-400 bg-red-950/95 text-red-100 animate-pulse'
                  : 'border-emerald-400 bg-emerald-950/95 text-emerald-100',
              small ? 'text-[6px]' : inspect ? 'text-xs py-1 px-2' : 'text-[9.5px]'
            )}
          >
            <GameIcon name="syringe-vial" size={small ? 8 : inspect ? 13 : 10} />
            <span>{syringeCharges}/4</span>
          </div>
        )}

        <CardIllustrationLayer card={card} mini={mini} />
      </div>

      {/* 3. CAIXA DE DESCRIÇÃO E EFEITOS INTEGRALMENTE LEGÍVEL NA PRÓPRIA CARTA */}
      {!isToken && (
        <div
          style={{ transform: 'translateZ(9px)' }}
          className={cn(
            'pointer-events-none flex-1 flex flex-col justify-center bg-[#ead9b9]/90 border-t border-stone-900/80 text-[#140b05] px-2 py-1 overflow-hidden',
            inspect && 'px-3.5 py-2'
          )}
        >
          <p
            className={cn(
              'font-typewriter font-bold text-[#140b05] text-left',
              inspect
                ? 'text-[14.5px] sm:text-[16px] leading-[1.36]'
                : xlarge
                  ? 'text-[11.5px] leading-[1.28]'
                  : compact
                    ? 'text-[10px] leading-[1.22]'
                    : 'text-[11px] leading-[1.25]'
            )}
          >
            {meta.cardText}
          </p>
        </div>
      )}

      {/* 4. RODAPÉ DE ATRIBUTO / CUSTO / REGRA-CHAVE */}
      {!mini && (
        <div
          style={{ transform: !small ? 'translateZ(10px)' : undefined }}
          className={cn(
            'pointer-events-none font-mono font-extrabold text-stone-950 bg-[#d8c49e]/95 text-center border-t-2 border-stone-950 leading-tight shrink-0 px-1.5 uppercase tracking-tight',
            small
              ? 'text-[6px] py-[1.5px] truncate'
              : inspect
                ? 'text-xs sm:text-[13px] py-1.5'
                : xlarge
                  ? 'text-[10.5px] py-1'
                  : compact
                    ? 'text-[9px] py-1'
                    : 'text-[9.5px] py-1'
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

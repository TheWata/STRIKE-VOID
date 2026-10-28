import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair } from 'lucide-react';
import InscryptionCard from './InscryptionCard';
import GameIcon from './GameIcon';
import {
  EFFECT_ASSETS,
  getCharacterPresenceAsset,
} from '../models/assetCatalog';
import { resolveTargetOpponentPreview } from '../models/cardModel';
import { getSilhouetteDimensions } from '../helpers/math3d';
import { cn } from '../lib/cn';

/**
 * Barra de vida estilizada, sem bordas ou caixas de interface administrativa.
 * Usa preenchimento arterial, contraste, transparência, geometria sutil e
 * ícones SVG dedicados para comunicar vida e estados.
 */
export function StylizedLifeBar({
  name,
  lives = 0,
  maxLives = 3,
  isAlive = true,
  isMe = false,
  targetable = false,
  lockedIn = false,
  handCount = null,
  knifeDmg = 1,
  pactPartners = [],
  isWalled = false,
  deathMarkTurns = null,
  compact = false,
}) {
  const safeMax = Math.max(1, Number(maxLives) || 3);
  const safeLives = Math.max(0, Math.min(safeMax, Number(lives) || 0));
  const hasDeathMark = deathMarkTurns != null && isAlive;

  return (
    <div
      className={cn(
        'flex flex-col items-center pointer-events-none select-none transition-transform duration-300',
        targetable && 'scale-105'
      )}
    >
      {/* Linha 1: Nome do personagem integrado à atmosfera (sem caixa ou moldura) */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={cn(
            'font-grimoire tracking-[0.14em] uppercase transition-colors',
            compact ? 'text-[11px]' : 'text-xs sm:text-[13px]',
            !isAlive
              ? 'text-stone-500/70 line-through'
              : targetable
                ? 'text-red-200 font-extrabold'
                : isMe
                  ? 'text-[#f6e7c8] font-extrabold'
                  : 'text-[#e5d4b3]/95 font-bold'
          )}
          style={{
            textShadow: targetable
              ? '0 0 12px rgba(220,38,38,0.9), 0 2px 6px rgba(0,0,0,0.98)'
              : '0 2px 8px rgba(0,0,0,0.98), 0 0 18px rgba(0,0,0,0.9)',
          }}
        >
          {name}
        </span>

        {/* Indicador discreto de cartas na mão ou jogada pronta */}
        {isAlive && !isMe && handCount != null && (
          <span
            className="font-mono text-[9.5px] text-amber-200/60 tracking-tight"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}
          >
            · {handCount}
          </span>
        )}
        {isAlive && lockedIn && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-300/90 shadow-[0_0_8px_rgba(251,191,36,0.95)]"
            title="Jogada escolhida"
          />
        )}
      </div>

      {/* Linha 2: Barra de vida estilizada em fragmentos de sangue (sem contornos pesados) */}
      {isAlive ? (
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 px-1.5 py-1 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(12, 6, 4, 0.72) 0%, rgba(6, 3, 2, 0.25) 85%, transparent 100%)',
            }}
          >
            {Array.from({ length: safeMax }).map((_, i) => {
              const filled = i < safeLives;
              return (
                <div
                  key={i}
                  className={cn(
                    'relative transition-all duration-500',
                    compact
                      ? 'w-5 h-[7px] sm:w-6 sm:h-[8px]'
                      : 'w-6 h-[8px] sm:w-7 sm:h-[9px]'
                  )}
                  style={{
                    clipPath:
                      'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
                    background: filled
                      ? 'linear-gradient(90deg, #991b1b 0%, #ef4444 48%, #b91c1c 100%)'
                      : 'rgba(28, 16, 12, 0.68)',
                    boxShadow: filled
                      ? 'inset 0 1px 1px rgba(255, 220, 220, 0.38), 0 0 10px rgba(220, 38, 38, 0.55)'
                      : 'inset 0 1px 3px rgba(0, 0, 0, 0.92)',
                    opacity: filled ? 1 : 0.45,
                  }}
                >
                  {filled && (
                    <div
                      className="absolute inset-x-[18%] top-[15%] h-[28%] rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,240,240,0.45), transparent)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <span
            className="font-mono text-[10px] tracking-tighter text-[#e5d4b3]/75"
            style={{ textShadow: '0 2px 5px rgba(0,0,0,0.98)' }}
          >
            {safeLives}/{safeMax}
          </span>
        </div>
      ) : (
        <span
          className="font-grimoire text-[10px] tracking-[0.2em] text-red-500/70 uppercase"
          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.98)' }}
        >
          Eliminado
        </span>
      )}

      {/* Linha 3: Sinais contextuais orgânicos com ícones SVG dedicados */}
      {isAlive && (hasDeathMark || knifeDmg > 1 || pactPartners.length > 0 || isWalled) && (
        <div
          className="flex flex-wrap items-center justify-center gap-2 mt-0.5 text-[10px] font-mono font-bold"
          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.98)' }}
        >
          {hasDeathMark && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 tracking-tight',
                deathMarkTurns <= 2 ? 'text-red-400 animate-pulse' : 'text-lime-300/95'
              )}
            >
              <GameIcon name="death-mark" size={11} />
              <span>{deathMarkTurns}t</span>
            </span>
          )}
          {knifeDmg > 1 && (
            <span className="inline-flex items-center gap-0.5 text-teal-300/95">
              <GameIcon name="dagger-buff" size={11} />
              <span>{knifeDmg}x</span>
            </span>
          )}
          {pactPartners.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-rose-400/95 truncate max-w-[125px]">
              <GameIcon name="blood-drop" size={11} />
              <span>{pactPartners.join(', ')}</span>
            </span>
          )}
          {isWalled && (
            <span className="inline-flex items-center text-sky-300/90">
              <GameIcon name="iron-lock" size={11} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Overlay de efeito visual de combate reutilizável baseado nos assets em `public/assets/effects/*.svg`.
 */
function CharacterCombatVfx({ visualEffect }) {
  if (!visualEffect) return null;

  let vfxSrc = null;
  if (visualEffect === 'DAMAGE' || visualEffect === 'DEATH_MARK_KILL') {
    vfxSrc = EFFECT_ASSETS.SLASH_IMPACT;
  } else if (visualEffect === 'REFLECT' || visualEffect === 'VACUUM') {
    vfxSrc = EFFECT_ASSETS.MIRROR_SHATTER;
  } else if (visualEffect === 'BLOOD_PACT' || visualEffect === 'PACT_BROKEN') {
    vfxSrc = EFFECT_ASSETS.BLOOD_PACT_RING;
  } else if (
    visualEffect === 'SOUL_SWAP' ||
    visualEffect === 'SOUL_BUFF' ||
    visualEffect === 'HEAL'
  ) {
    vfxSrc = EFFECT_ASSETS.SOUL_SPIRAL;
  }

  if (!vfxSrc) return null;

  return (
    <motion.img
      key={visualEffect}
      src={vfxSrc}
      alt=""
      aria-hidden="true"
      draggable={false}
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{ opacity: [0, 1, 0.85, 0], scale: [0.75, 1.08, 1.02, 1.12] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.15, ease: 'easeOut' }}
      className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain z-30"
    />
  );
}

/**
 * Renderiza o asset artístico real de silhueta com transparência (PNG/WebP RGBA),
 * contra-luz atmosférica e olhos dinâmicos controlados pelo estado do jogo.
 */
function SilhouetteFigure({
  variant = 0,
  isAlive,
  isWalled,
  isReflecting,
  targetable,
  visualEffect,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const presence = getCharacterPresenceAsset(variant);

  const eyeColor = !isAlive
    ? 'transparent'
    : targetable
      ? '#f87171'
      : isReflecting
        ? '#d8b4fe'
        : isWalled
          ? '#7dd3fc'
          : '#fbbf24';

  const backlightCore = targetable
    ? 'rgba(220, 38, 38, 0.45)'
    : isReflecting
      ? 'rgba(192, 132, 252, 0.38)'
      : isWalled
        ? 'rgba(56, 189, 248, 0.32)'
        : 'rgba(215, 135, 55, 0.28)';

  const backlightMid = targetable
    ? 'rgba(139, 0, 0, 0.22)'
    : 'rgba(110, 52, 20, 0.15)';

  return (
    <div
      className="relative w-full h-full flex items-center justify-center pointer-events-none select-none"
    >
      {/* 1. Contra-luz atmosférica quente de vela atrás da presença */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[4%] top-[8%] bottom-[6%] rounded-full"
        style={{
          background: `radial-gradient(ellipse at 50% 42%, ${backlightCore} 0%, ${backlightMid} 48%, transparent 76%)`,
        }}
      />

      {/* 2. Asset artístico real da presença sombria com canal alpha transparente */}
      {!imgFailed ? (
        <picture className="w-full h-full flex items-center justify-center pointer-events-none select-none">
          <source srcSet={presence.webp} type="image/webp" />
          <img
            src={presence.png}
            alt=""
            aria-hidden="true"
            decoding="async"
            draggable={false}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain object-bottom pointer-events-none select-none"
          />
        </picture>
      ) : (
        /* Fallback limpo caso o arquivo de imagem não seja encontrado */
        <svg viewBox="0 0 160 210" className="w-full h-full overflow-visible">
          <path
            d="M 12 210 C 14 148, 30 110, 54 98 C 65 92, 65 80, 62 66 C 58 48, 66 26, 80 26 C 94 26, 102 46, 98 66 C 95 80, 95 93, 106 100 C 130 114, 144 150, 148 210 Z"
            fill="#0d0705"
          />
        </svg>
      )}

      {/* 3. Olhos dinâmicos sutis na escuridão do capuz */}
      {isAlive && (
        <svg
          viewBox="0 0 160 210"
          className="pointer-events-none absolute inset-0 w-full h-full overflow-visible z-10"
        >
          <g opacity={targetable ? '1' : '0.9'}>
            <ellipse
              cx={presence.eyes.lx}
              cy={presence.eyes.y}
              rx="3.2"
              ry="1.65"
              fill={eyeColor}
              opacity="0.95"
            />
            <ellipse
              cx={presence.eyes.rx}
              cy={presence.eyes.y}
              rx="3.2"
              ry="1.65"
              fill={eyeColor}
              opacity="0.95"
            />
            <circle cx={presence.eyes.lx} cy={presence.eyes.y} r="0.8" fill="#fff" opacity="0.85" />
            <circle cx={presence.eyes.rx} cy={presence.eyes.y} r="0.8" fill="#fff" opacity="0.85" />
          </g>
        </svg>
      )}

      {/* 4. Asset de grades de ferro quando Emparedado */}
      {isWalled && isAlive && (
        <img
          src={EFFECT_ASSETS.IRON_CAGE}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain z-20 opacity-80"
        />
      )}

      {/* 5. Efeitos visuais de combate sobre a presença */}
      <AnimatePresence>
        {visualEffect && <CharacterCombatVfx visualEffect={visualEffect} />}
      </AnimatePresence>
    </div>
  );
}

/**
 * Silhueta 3D de um oponente sentado ao redor da mesa.
 * A barra de vida estilizada posiciona-se ACIMA da silhueta, garantindo
 * que nunca fique escondida atrás da mesa em nenhum ângulo ou resolução.
 */
export default function PlayerSilhouette3D({
  player,
  index,
  totalPlayers = 4,
  isMe,
  targetable,
  dimmed,
  isFocused = false,
  isDimmedByOtherTarget = false,
  isLeftFlank = false,
  isRightFlank = false,
  selectedCard,
  me,
  onHoverChange,
  onSeatClick,
  onDropCard,
  onInspectCard,
  allPlayers = [],
}) {
  const [over, setOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isTargetHovered = targetable && (over || isHovered || isFocused);

  const preview =
    targetable && selectedCard && me
      ? resolveTargetOpponentPreview({ selectedCard, me, targetPlayer: player })
      : null;

  const fx = player.visualEffect;
  const shake = fx === 'DAMAGE' || fx === 'VACUUM' || fx === 'DEATH_MARK_KILL';
  const knifeDmg = player.knifeDamage || 1;
  const pactPartners = (player.bloodPactWith || [])
    .map((pid) => allPlayers.find((p) => p.id === pid)?.name)
    .filter(Boolean);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHoverChange) onHoverChange(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onHoverChange) onHoverChange(false);
  };

  const dims = getSilhouetteDimensions(totalPlayers);
  const isCompactLayout = totalPlayers >= 6;

  // Alinhamento dinâmico do painel de informações para nunca estourar o viewport
  const panelAlignCls = isLeftFlank
    ? 'left-0 sm:left-2 -translate-x-0'
    : isRightFlank
      ? 'right-0 sm:right-2 translate-x-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -10, 10, -6, 6, 0], scale: [1, 1.05, 0.97, 1] }
          : {
              scale: isTargetHovered ? 1.06 : 1,
              y: isTargetHovered ? -4 : 0,
            }
      }
      transition={
        shake
          ? { duration: 0.5 }
          : { type: 'spring', stiffness: 260, damping: 22 }
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragOver={(e) => {
        if (!player.isAlive) return;
        e.preventDefault();
        if (!over) {
          setOver(true);
          onHoverChange?.(true);
        }
      }}
      onDragLeave={() => {
        setOver(false);
        onHoverChange?.(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onHoverChange?.(false);
        if (player.isAlive && onDropCard) onDropCard(player, e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onSeatClick) onSeatClick(player);
      }}
      style={{ transformStyle: 'preserve-3d' }}
      className={cn(
        'relative flex flex-col items-center select-none group transition-all duration-200',
        targetable ? 'cursor-crosshair' : 'cursor-pointer',
        !player.isAlive && 'opacity-35 grayscale',
        isDimmedByOtherTarget && player.isAlive && 'opacity-80 transition-opacity',
        dimmed && !isDimmedByOtherTarget && player.isAlive && 'opacity-50 grayscale-[40%]'
      )}
    >
      {/* 1. CARTAS REVELADAS (Carta REVELAR) flutuando no topo */}
      <AnimatePresence>
        {player.isHandRevealed && player.revealedHand && player.isAlive && (
          <motion.div
            key="revealed-hand"
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.85 }}
            style={{ transform: 'translateZ(36px)' }}
            className="mb-1.5 flex items-center justify-center -space-x-1.5 z-50 pointer-events-auto"
          >
            {player.revealedHand.length > 0 ? (
              player.revealedHand.map((c, idx) => (
                <div
                  key={c.id || idx}
                  onClick={(e) => {
                    if (onInspectCard) {
                      e.stopPropagation();
                      onInspectCard(c);
                    }
                  }}
                  title="Clique para inspecionar carta revelada"
                  style={{
                    transform: `rotate(${(idx - (player.revealedHand.length - 1) / 2) * 6}deg)`,
                  }}
                >
                  <InscryptionCard card={c} mini onInspect={onInspectCard} />
                </div>
              ))
            ) : (
              <span className="text-[9px] font-mono text-stone-400/80">Mão vazia</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BARRA DE VIDA ESTILIZADA & BADGE DE COMBATE ACIMA DA SILHUETA E DA MESA */}
      <div
        className="relative z-40 -mb-2.5 flex flex-col items-center"
        style={{
          transform: 'translateZ(34px)',
        }}
      >
        {/* Pílula Compacta de Prévia de Combate (visível quando carta está selecionada) */}
        {targetable && preview && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: isTargetHovered ? 1.08 : 1, opacity: 1 }}
            className={cn(
              'mb-1 px-2.5 py-0.5 rounded-full font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-lg flex items-center gap-1 animate-pulse pointer-events-none select-none transition-all duration-200',
              isTargetHovered
                ? 'bg-gradient-to-r from-[#3e2413] via-[#482814] to-[#2a1409] border-gold-aged text-amber-100 shadow-[0_0_18px_rgba(212,175,55,0.85)]'
                : preview.tone === 'lethal'
                  ? 'bg-[#3b0808]/95 border-red-400 text-red-100 shadow-[0_0_14px_rgba(239,68,68,0.75)]'
                  : preview.tone === 'danger'
                    ? 'bg-[#3b1a06]/95 border-amber-400 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.65)]'
                    : preview.tone === 'beneficial'
                      ? 'bg-[#083620]/95 border-emerald-400 text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.65)]'
                      : 'bg-[#22130a]/95 border-gold-aged text-amber-200 shadow-[0_0_12px_rgba(212,175,55,0.55)]'
            )}
          >
            <Crosshair
              size={10}
              className={cn(
                'shrink-0',
                isTargetHovered ? 'text-amber-200 animate-spin' : 'text-gold-aged'
              )}
            />
            <span>{preview.badgeText}</span>
          </motion.div>
        )}

        <StylizedLifeBar
          name={player.name}
          lives={player.lives}
          maxLives={player.maxLives}
          isAlive={player.isAlive}
          isMe={isMe}
          targetable={targetable}
          lockedIn={player.lockedIn}
          handCount={player.handCount}
          knifeDmg={knifeDmg}
          pactPartners={pactPartners}
          isWalled={player.isWalled}
          deathMarkTurns={player.deathMarkTurns}
          compact={isCompactLayout}
        />
      </div>

      {/* 2B. PAINEL DE INFORMAÇÕES TÁTICAS DO ALVO (Restrito em dourado antigo / púrpura, contido na tela) */}
      <AnimatePresence>
        {isTargetHovered && preview && (
          <motion.div
            key="target-action-preview-card"
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{ transform: 'translateZ(58px)' }}
            className={cn(
              'pointer-events-auto absolute -top-24 sm:-top-28 z-50 min-w-[210px] sm:min-w-[260px] max-w-[310px] px-3.5 py-2 rounded-xl border-2 backdrop-blur-md shadow-[0_16px_38px_rgba(0,0,0,0.98)] flex flex-col items-center text-center gap-1 select-none transition-all',
              panelAlignCls,
              'bg-gradient-to-b from-[#21130b]/98 via-[#180e08]/98 to-[#0e0704]/98 border-gold-aged shadow-[0_0_24px_rgba(212,175,55,0.55),0_0_12px_rgba(168,85,247,0.35)]'
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (onSeatClick) onSeatClick(player);
            }}
          >
            {/* Cabeçalho do alvo: Nome + Vida atual */}
            <div className="flex items-center justify-between w-full border-b border-gold-aged/30 pb-1 mb-0.5">
              <span className="font-grimoire font-black text-xs sm:text-[13px] tracking-wider uppercase text-amber-100 truncate max-w-[170px]">
                {player.name}
              </span>
              <span className="font-mono text-[10px] font-bold text-amber-200/90 shrink-0">
                {player.lives}/{player.maxLives} HP
              </span>
            </div>

            {/* Badges de estados ativos do alvo */}
            {(player.isWalled || player.isReflecting || player.deathMarkTurns != null || knifeDmg > 1 || pactPartners.length > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-1 my-0.5">
                {player.isWalled && (
                  <span className="px-1.5 py-0.2 rounded bg-sky-950/80 border border-sky-400/60 text-sky-200 text-[9px] font-mono font-bold">
                    ⛓️ Emparedado
                  </span>
                )}
                {player.isReflecting && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-400/70 text-purple-200 text-[9px] font-mono font-bold">
                    🪞 Espelho Ativo
                  </span>
                )}
                {player.deathMarkTurns != null && (
                  <span className="px-1.5 py-0.2 rounded bg-red-950/80 border border-red-500/70 text-red-200 text-[9px] font-mono font-bold">
                    ☠️ Marca {player.deathMarkTurns}t
                  </span>
                )}
                {knifeDmg > 1 && (
                  <span className="px-1.5 py-0.2 rounded bg-teal-950/80 border border-teal-400/60 text-teal-200 text-[9px] font-mono font-bold">
                    🗡️ Faca {knifeDmg}x
                  </span>
                )}
                {pactPartners.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-400/60 text-rose-200 text-[9px] font-mono font-bold truncate max-w-[180px]">
                    🩸 Pacto ({pactPartners.join(', ')})
                  </span>
                )}
              </div>
            )}

            {/* Resultado Previsto da Ação */}
            <div className="flex items-center gap-1.5 font-grimoire font-black text-xs sm:text-[13px] tracking-wider uppercase text-amber-100">
              <Crosshair size={13} className="text-gold-aged shrink-0 animate-spin" />
              <span>{preview.title}</span>
            </div>
            <p className="font-mono text-[9.5px] sm:text-[10px] leading-snug text-stone-300">
              {preview.subtitle}
            </p>

            {/* Dica de interação e cancelamento */}
            <div className="flex items-center justify-between gap-2 text-[8.5px] sm:text-[9px] font-mono font-bold uppercase tracking-wider mt-0.5 pt-1 border-t border-white/10 w-full text-stone-400">
              <span className="text-amber-300/95 font-extrabold">Clique p/ Confirmar</span>
              <span className="text-stone-400/80">[Botão Dir. / ESC]</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. PRESENÇA SOMBRIA COM DIMENSÕES ADAPTATIVAS (Asset Transparente RGBA) */}
      <div
        className={cn(
          'relative flex items-center justify-center -mt-2 transition-all duration-200',
          dims.widthCls
        )}
      >
        {/* OUTLINE E RETÍCULO GÓTICO RESTRITO EM DOURADO ANTIGO / PÚRPURA */}
        {targetable && (
          <>
            {/* Halo de fundo com destaque sofisticado */}
            <div
              className={cn(
                'pointer-events-none absolute -inset-2.5 sm:-inset-3 rounded-2xl border-2 transition-all duration-300 animate-pulse z-30',
                isTargetHovered
                  ? 'border-gold-aged bg-gradient-to-b from-amber-500/10 via-purple-950/25 to-[#160d08]/70 shadow-[0_0_28px_rgba(212,175,55,0.75),0_0_16px_rgba(168,85,247,0.45),inset_0_0_16px_rgba(212,175,55,0.2)]'
                  : 'border-gold-aged/75 bg-red-950/20 shadow-[0_0_18px_rgba(212,175,55,0.5),inset_0_0_12px_rgba(220,38,38,0.25)]'
              )}
            />

            {/* Cantoneiras góticas de mira nos 4 cantos em Dourado Antigo */}
            <svg
              viewBox="0 0 100 100"
              className="pointer-events-none absolute -inset-2.5 sm:-inset-3.5 w-[calc(100%+20px)] sm:w-[calc(100%+28px)] h-[calc(100%+20px)] sm:h-[calc(100%+28px)] overflow-visible z-35 animate-pulse"
            >
              <path
                d="M 5 24 L 5 5 L 24 5"
                fill="none"
                stroke={isTargetHovered ? '#fef08a' : '#d4af37'}
                strokeWidth="3.2"
                style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.85))' }}
              />
              <path
                d="M 76 5 L 95 5 L 95 24"
                fill="none"
                stroke={isTargetHovered ? '#fef08a' : '#d4af37'}
                strokeWidth="3.2"
                style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.85))' }}
              />
              <path
                d="M 5 76 L 5 95 L 24 95"
                fill="none"
                stroke={isTargetHovered ? '#fef08a' : '#d4af37'}
                strokeWidth="3.2"
                style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.85))' }}
              />
              <path
                d="M 76 95 L 95 95 L 95 76"
                fill="none"
                stroke={isTargetHovered ? '#fef08a' : '#d4af37'}
                strokeWidth="3.2"
                style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.85))' }}
              />
            </svg>
          </>
        )}

        <SilhouetteFigure
          variant={index}
          isAlive={player.isAlive}
          isWalled={player.isWalled}
          isReflecting={player.isReflecting}
          targetable={targetable}
          visualEffect={fx}
        />

        {/* Foco de mira no peito da sombra em Dourado/Púrpura */}
        {targetable && (
          <div
            className={cn(
              'absolute inset-0 m-auto rounded-full pointer-events-none transition-all duration-300 z-30 animate-pulse',
              isTargetHovered
                ? 'w-16 h-16 bg-amber-400/25 shadow-[0_0_25px_rgba(212,175,55,0.85)]'
                : 'w-12 h-12 bg-amber-500/15 shadow-[0_0_16px_rgba(212,175,55,0.5)]'
            )}
            style={{
              background:
                'radial-gradient(circle, rgba(212,175,55,0.4) 0%, rgba(168,85,247,0.2) 55%, transparent 75%)',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InscryptionCard from './InscryptionCard';
import GameIcon from './GameIcon';
import {
  EFFECT_ASSETS,
  getCharacterPresenceAsset,
} from '../models/assetCatalog';
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
      style={{
        filter: 'drop-shadow(0 20px 26px rgba(0, 0, 0, 0.96))',
      }}
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
              style={{ filter: `drop-shadow(0 0 6px ${eyeColor})` }}
            />
            <ellipse
              cx={presence.eyes.rx}
              cy={presence.eyes.y}
              rx="3.2"
              ry="1.65"
              fill={eyeColor}
              style={{ filter: `drop-shadow(0 0 6px ${eyeColor})` }}
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
  isMe,
  targetable,
  dimmed,
  onSeatClick,
  onDropCard,
  allPlayers = [],
}) {
  const [over, setOver] = useState(false);

  const fx = player.visualEffect;
  const shake = fx === 'DAMAGE' || fx === 'VACUUM' || fx === 'DEATH_MARK_KILL';
  const knifeDmg = player.knifeDamage || 1;
  const pactPartners = (player.bloodPactWith || [])
    .map((pid) => allPlayers.find((p) => p.id === pid)?.name)
    .filter(Boolean);

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -10, 10, -6, 6, 0], scale: [1, 1.05, 0.97, 1] }
          : { y: [0, -2.5, 0] }
      }
      transition={
        shake
          ? { duration: 0.5 }
          : { duration: 3.6 + (index % 3) * 0.5, repeat: Infinity, ease: 'easeInOut' }
      }
      onDragOver={(e) => {
        if (!player.isAlive) return;
        e.preventDefault();
        if (!over) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (player.isAlive && onDropCard) onDropCard(player, e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onSeatClick) onSeatClick(player);
      }}
      style={{ transformStyle: 'preserve-3d' }}
      className={cn(
        'relative flex flex-col items-center select-none group transition-all',
        targetable ? 'cursor-crosshair scale-[1.04]' : 'cursor-pointer',
        over && 'scale-110',
        !player.isAlive && 'opacity-35 grayscale',
        dimmed && player.isAlive && 'opacity-60'
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
            className="mb-1.5 flex items-center justify-center -space-x-1.5 z-50 pointer-events-none"
          >
            {player.revealedHand.length > 0 ? (
              player.revealedHand.map((c, idx) => (
                <div
                  key={c.id || idx}
                  style={{
                    transform: `rotate(${(idx - (player.revealedHand.length - 1) / 2) * 6}deg)`,
                  }}
                >
                  <InscryptionCard card={c} mini />
                </div>
              ))
            ) : (
              <span className="text-[9px] font-mono text-stone-400/80">Mão vazia</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BARRA DE VIDA ESTILIZADA SEMPRE VISÍVEL ACIMA DA SILHUETA E DA MESA */}
      <div
        className="relative z-40 -mb-3"
        style={{
          transform: 'translateZ(32px)',
        }}
      >
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
        />
      </div>

      {/* 3. PRESENÇA SOMBRIA GRANDE E ATMOSFÉRICA (Asset Transparente RGBA) */}
      <div className="relative w-[136px] h-[176px] sm:w-[184px] sm:h-[232px] flex items-center justify-center -mt-2">
        <SilhouetteFigure
          variant={index}
          isAlive={player.isAlive}
          isWalled={player.isWalled}
          isReflecting={player.isReflecting}
          targetable={targetable}
          visualEffect={fx}
        />

        {/* Foco de mira sutil e orgânico no peito da sombra quando é alvo válido */}
        {targetable && (
          <div
            className="absolute inset-0 m-auto w-14 h-14 rounded-full pointer-events-none animate-pulse"
            style={{
              background:
                'radial-gradient(circle, rgba(220,38,38,0.35) 0%, rgba(220,38,38,0.08) 55%, transparent 75%)',
              boxShadow: '0 0 24px rgba(220,38,38,0.45)',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

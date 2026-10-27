import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair } from 'lucide-react';
import { cn } from '../lib/cn';
import GameIcon from './GameIcon';
import CharacterPortrait from './CharacterPortrait';
import { EFFECT_ASSETS } from '../models/assetCatalog';
import { CHARACTER_ARCHETYPES } from '../models/expressionAtlas';
import { computePlayerPortraitState } from '../models/playerTensionModel';

/**
 * Efeitos visuais transitórios de impacto/resolução sobre o retrato.
 */
function PortraitCombatVfx({ visualEffect }) {
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
      animate={{ opacity: [0, 1, 0.85, 0], scale: [0.76, 1.08, 1.02, 1.14] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.1, ease: 'easeOut' }}
      className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain z-30"
    />
  );
}

/**
 * Retrato Dinâmico do Jogador (Círculo Central da HUD):
 * - Renderiza o spritesheet de expressões (`CharacterPortrait`) em máscara circular calibrada
 * - Grade de Cima: Personagem Feminina | Grade de Baixo: Personagem Masculino
 * - Contém seletor de gênero explícito (♀ / ♂) e outline circular vermelho para auto-uso de cartas
 * - Dimensões balanceadas para não obstruir a visão da mesa nem ampliar o rosto em excesso
 */
export default function DynamicPlayerPortrait({
  me,
  players = [],
  phase = 'PLANNING',
  selectedCard = null,
  socket = null,
  hitKey = 0,
  canSelfTarget = false,
  characterGender = 'female',
  onSelectGender,
  onSelfTargetClick,
  onDropCardOnSelf,
}) {
  const [secsLeft, setSecsLeft] = useState(null);
  const [isDamagedEvent, setIsDamagedEvent] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const prevStateRef = useRef({
    lives: me?.lives ?? null,
    isWalled: Boolean(me?.isWalled),
    deathMarkTurns: me?.deathMarkTurns ?? null,
    hitKey: hitKey || 0,
  });

  // Escuta o timer de planejamento isoladamente para reagir apenas aos segundos finais (<= 6s)
  useEffect(() => {
    if (!socket || phase !== 'PLANNING' || me?.lockedIn || !me?.isAlive) {
      return undefined;
    }
    const allowed = Number(me?.allowedTime) || 20;
    const onTick = ({ elapsedSec }) => {
      const rem = Math.max(0, Math.ceil(allowed - elapsedSec));
      const quantized = rem <= 6 ? rem : null;
      setSecsLeft((prev) => (prev === quantized ? prev : quantized));
    };
    socket.on('timer_tick', onTick);
    return () => socket.off('timer_tick', onTick);
  }, [socket, phase, me?.lockedIn, me?.isAlive, me?.allowedTime]);

  const effectiveSecsLeft =
    phase === 'PLANNING' && !me?.lockedIn && me?.isAlive ? secsLeft : null;

  // Detecta eventos reais de Dano (DOR) e Recuperação (ALIVIO) com tempo controlado
  const hasMe = Boolean(me);
  const myLives = me?.lives ?? 0;
  const myMark = me?.deathMarkTurns ?? null;
  const myWalled = Boolean(me?.isWalled);
  const myFx = me?.visualEffect ?? null;
  const myAlive = Boolean(me?.isAlive);

  useEffect(() => {
    if (!hasMe) return undefined;
    const prev = prevStateRef.current;

    const lostHp =
      (prev.lives != null && myLives < prev.lives) ||
      (hitKey != null && hitKey > (prev.hitKey || 0));
    const damagedByFx =
      myFx === 'DAMAGE' || myFx === 'VACUUM' || myFx === 'DEATH_MARK_KILL';

    const healedHp = prev.lives != null && myLives > prev.lives && myAlive;
    const clearedMark = prev.deathMarkTurns != null && myMark == null && myAlive;
    const brokeWall = prev.isWalled && !myWalled && myAlive;
    const healedByFx = myFx === 'HEAL';

    prevStateRef.current = {
      lives: myLives,
      isWalled: myWalled,
      deathMarkTurns: myMark,
      hitKey: hitKey || 0,
    };

    if (lostHp || damagedByFx) {
      const startDmg = setTimeout(() => {
        setIsDamagedEvent(true);
        setIsRecovering(false);
      }, 0);
      const endDmg = setTimeout(() => {
        setIsDamagedEvent(false);
      }, 1850);
      return () => {
        clearTimeout(startDmg);
        clearTimeout(endDmg);
      };
    }

    if (healedHp || clearedMark || brokeWall || healedByFx) {
      const startHeal = setTimeout(() => setIsRecovering(true), 0);
      const endHeal = setTimeout(() => setIsRecovering(false), 2200);
      return () => {
        clearTimeout(startHeal);
        clearTimeout(endHeal);
      };
    }

    return undefined;
  }, [hasMe, myLives, myMark, myWalled, myFx, myAlive, hitKey]);

  const isHoveringValidSelfTarget = Boolean(
    canSelfTarget && selectedCard && (isHovered || dragOver)
  );

  const portraitState = computePlayerPortraitState({
    me,
    players,
    phase,
    selectedCard,
    canSelfTarget,
    isHoveringValidSelfTarget,
    secsLeft: effectiveSecsLeft,
    isDamagedEvent,
    isRecovering,
  });

  const {
    tensionScore,
    tensionLevel,
    statusLabel,
    statusSummary,
    expressionKey,
    expressionLabel,
    expressionPriority,
    selfCardPreview,
    factors,
    visualParams,
  } = portraitState;

  const maxLives = factors.maxLives || 3;
  const lives = factors.lives ?? maxLives;

  const postureAnimate =
    visualParams.postureState === 'spectral'
      ? { y: [0, -2, 0], scale: [0.98, 1.01, 0.98] }
      : visualParams.postureState === 'recoil'
        ? { x: [0, -5, 5, -3, 3, 0], y: [0, 2, 0], scale: [1, 0.96, 1.02, 1] }
        : visualParams.postureState === 'agonized'
          ? { x: [0, -1, 1, -0.6, 0.6, 0], scale: [1, 1.02, 1] }
          : { scale: [1, 1.01, 1] };

  const postureTransition =
    visualParams.postureState === 'recoil'
      ? { duration: 0.45, ease: 'easeOut' }
      : {
          duration: visualParams.heartbeatDuration || 3.4,
          repeat: Infinity,
          ease: 'easeInOut',
        };

  // Moldura circular e outline de auto-alvo
  const ringBorderClass = canSelfTarget
    ? isHoveringValidSelfTarget
      ? 'border-red-400 ring-[3.5px] ring-red-500 shadow-[0_0_36px_rgba(239,68,68,0.95),inset_0_0_20px_rgba(220,38,38,0.6)]'
      : 'border-red-500 ring-[2.5px] ring-red-600/85 shadow-[0_0_26px_rgba(220,38,38,0.8),inset_0_0_16px_rgba(153,27,27,0.5)]'
    : tensionLevel === 'CRITICAL'
      ? 'border-red-500/90 shadow-[0_0_28px_rgba(220,38,38,0.7),inset_0_0_22px_rgba(153,27,27,0.7)]'
      : tensionLevel === 'CORNERED'
        ? factors.isWalled
          ? 'border-sky-400/90 shadow-[0_0_22px_rgba(56,189,248,0.5),inset_0_0_18px_rgba(12,74,110,0.65)]'
          : 'border-orange-400/90 shadow-[0_0_22px_rgba(251,146,60,0.5),inset_0_0_18px_rgba(124,45,18,0.65)]'
        : tensionLevel === 'PRESSURED'
          ? 'border-amber-500/85 shadow-[0_0_20px_rgba(217,119,6,0.45),inset_0_0_16px_rgba(127,29,29,0.5)]'
          : tensionLevel === 'RELIEF'
            ? 'border-emerald-400/85 shadow-[0_0_22px_rgba(52,211,153,0.5),inset_0_0_18px_rgba(6,78,59,0.5)]'
            : tensionLevel === 'DEAD'
              ? 'border-purple-500/60 shadow-[0_0_20px_rgba(147,51,234,0.4)]'
              : 'border-gold-aged/90 shadow-[0_0_20px_rgba(212,175,55,0.35),inset_0_0_18px_rgba(0,0,0,0.85)]';

  const portraitFilterStyle =
    tensionLevel === 'CRITICAL'
      ? 'contrast(1.12) saturate(1.1)'
      : tensionLevel === 'RELIEF'
        ? 'brightness(1.06) saturate(1.08)'
        : '';

  const activeGender =
    characterGender === CHARACTER_ARCHETYPES.MALE
      ? CHARACTER_ARCHETYPES.MALE
      : CHARACTER_ARCHETYPES.FEMALE;

  return (
    <div
      id="dynamic-player-portrait"
      data-tension-level={tensionLevel}
      data-tension-score={tensionScore}
      data-expression={expressionKey}
      data-expression-priority={expressionPriority}
      data-character-gender={activeGender}
      data-self-target-valid={canSelfTarget ? 'true' : 'false'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => {
        if (!factors.isAlive) return;
        e.preventDefault();
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (factors.isAlive && onDropCardOnSelf) {
          onDropCardOnSelf(me, e);
        }
      }}
      onClick={(e) => {
        if (!canSelfTarget) return;
        e.stopPropagation();
        onSelfTargetClick?.();
      }}
      title={
        canSelfTarget && selfCardPreview
          ? `${selfCardPreview.actionTitle} — ${selfCardPreview.actionSubtitle}`
          : `${me?.name || 'Você'} (${activeGender === 'female' ? 'Feminina' : 'Masculino'}, ${expressionLabel}) — ${statusLabel}: ${statusSummary}`
      }
      className={cn(
        'relative flex flex-col items-center justify-center select-none shrink-0 z-30 transition-transform duration-200',
        canSelfTarget ? 'cursor-pointer hover:scale-[1.03]' : 'cursor-default'
      )}
    >
      {/* SELO FLUTUANTE DE ALVO VÁLIDO EM SI MESMO */}
      <AnimatePresence>
        {canSelfTarget && selfCardPreview && (
          <motion.div
            key="self-target-callout"
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{
              opacity: 1,
              y: isHoveringValidSelfTarget ? -3 : 0,
              scale: isHoveringValidSelfTarget ? 1.04 : 1,
            }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-grimoire font-extrabold text-[9.5px] sm:text-[10.5px] tracking-[0.12em] uppercase shadow-[0_4px_16px_rgba(0,0,0,0.95)]',
              isHoveringValidSelfTarget
                ? 'bg-red-900/95 border-red-300 text-white shadow-[0_0_20px_rgba(239,68,68,0.9)]'
                : 'bg-[#2a0808]/95 border-red-500/90 text-red-100 shadow-[0_0_12px_rgba(220,38,38,0.6)]'
            )}
          >
            <Crosshair
              size={11}
              className={cn('text-red-300 shrink-0', isHoveringValidSelfTarget && 'animate-spin')}
            />
            <span>
              {isHoveringValidSelfTarget
                ? `Confirmar: ${selfCardPreview.actionTitle}`
                : `Clique p/ ${selfCardPreview.actionTitle}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. MOLDURA CIRCULAR CENTRAL DO RETRATO DINÂMICO (Dimensões compactas e equilibradas) */}
      <div className="relative w-[98px] h-[98px] sm:w-[114px] sm:h-[114px] flex items-center justify-center shrink-0">
        {/* Halo circular vermelho de Alvo Válido */}
        <AnimatePresence>
          {canSelfTarget && (
            <motion.svg
              key="self-target-red-outline"
              viewBox="0 0 160 160"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{
                opacity: isHoveringValidSelfTarget ? 1 : [0.75, 0.95, 0.75],
                scale: isHoveringValidSelfTarget ? 1.04 : [1, 1.02, 1],
                rotate: isHoveringValidSelfTarget ? 14 : 0,
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={
                isHoveringValidSelfTarget
                  ? { duration: 0.2, ease: 'easeOut' }
                  : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
              }
              className="pointer-events-none absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] rounded-full z-35"
            >
              <circle
                cx="80"
                cy="80"
                r="75"
                fill="none"
                stroke={isHoveringValidSelfTarget ? '#f87171' : '#ef4444'}
                strokeWidth={isHoveringValidSelfTarget ? '3.5' : '2.6'}
                style={{
                  filter: `drop-shadow(0 0 ${isHoveringValidSelfTarget ? 10 : 7}px #ef4444)`,
                }}
              />
              <circle
                cx="80"
                cy="80"
                r="77.5"
                fill="none"
                stroke="#fca5a5"
                strokeWidth="1.4"
                strokeDasharray="16 20"
                opacity={isHoveringValidSelfTarget ? '0.9' : '0.6'}
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* SELETOR DE GÊNERO VISÍVEL E ACESSÍVEL: FEMININA (Grade de Cima) / MASCULINO (Grade de Baixo) */}
        <div
          id="character-gender-selector"
          className="pointer-events-auto absolute -top-2.5 right-0 z-45 flex items-center bg-[#140b07]/95 border border-gold-aged/75 rounded-full p-0.5 shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectGender?.('female');
            }}
            title="Personagem Feminina (Grade de Cima do Spritesheet)"
            aria-label="Selecionar Personagem Feminina"
            className={cn(
              'h-5 px-1.5 rounded-full text-[9px] font-mono font-extrabold flex items-center gap-0.5 transition-all cursor-pointer',
              activeGender === 'female'
                ? 'bg-gradient-to-r from-blood-bright to-blood text-white shadow-sm'
                : 'text-stone-400 hover:text-amber-200'
            )}
          >
            <span>♀</span>
            <span className="hidden sm:inline">FEM</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectGender?.('male');
            }}
            title="Personagem Masculino (Grade de Baixo do Spritesheet)"
            aria-label="Selecionar Personagem Masculino"
            className={cn(
              'h-5 px-1.5 rounded-full text-[9px] font-mono font-extrabold flex items-center gap-0.5 transition-all cursor-pointer',
              activeGender === 'male'
                ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 border border-gold-aged/50 shadow-sm'
                : 'text-stone-400 hover:text-amber-200'
            )}
          >
            <span>♂</span>
            <span className="hidden sm:inline">MASC</span>
          </button>
        </div>

        {/* Corpo Circular do Medalhão */}
        <motion.div
          animate={
            canSelfTarget && isHoveringValidSelfTarget
              ? { scale: 1.03 }
              : tensionLevel === 'CRITICAL'
                ? { scale: [1, 1.025, 1, 1.015, 1] }
                : tensionLevel === 'PRESSURED' || tensionLevel === 'CORNERED'
                  ? { scale: [1, 1.012, 1] }
                  : { scale: 1 }
          }
          transition={
            canSelfTarget && isHoveringValidSelfTarget
              ? { duration: 0.18, ease: 'easeOut' }
              : tensionLevel === 'CRITICAL'
                ? { duration: 0.78, repeat: Infinity, ease: 'easeOut' }
                : tensionLevel === 'PRESSURED' || tensionLevel === 'CORNERED'
                  ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
          }
          className={cn(
            'relative w-full h-full rounded-full border-[3.5px] bg-[#0b0604] overflow-hidden flex items-center justify-center transition-all duration-300',
            ringBorderClass
          )}
        >
          {/* Retrato de Expressões via Tilemap do Spritesheet */}
          <motion.div
            animate={postureAnimate}
            transition={postureTransition}
            className="relative w-full h-full rounded-full overflow-hidden z-10"
          >
            <CharacterPortrait
              character={activeGender}
              expression={expressionKey}
              isAlive={factors.isAlive}
              filterStyle={portraitFilterStyle}
              ariaLabel={`${me?.name || 'Jogador'} — ${activeGender === 'female' ? 'Feminina' : 'Masculino'}, ${expressionLabel}`}
            />
          </motion.div>

          {/* Anel sutil de segmentos radiais de tensão */}
          <svg
            viewBox="0 0 120 120"
            className="pointer-events-none absolute inset-0 w-full h-full z-20"
          >
            {Array.from({ length: 8 }).map((_, idx) => {
              const active = idx < visualParams.activeSegments && factors.isAlive;
              const segAngle = 360 / 8;
              const startDeg = -135 + idx * segAngle + 4;
              const endDeg = startDeg + segAngle - 8;
              const r = 56.5;
              const rad = (d) => (d * Math.PI) / 180;
              const x1 = 60 + r * Math.cos(rad(startDeg));
              const y1 = 60 + r * Math.sin(rad(startDeg));
              const x2 = 60 + r * Math.cos(rad(endDeg));
              const y2 = 60 + r * Math.sin(rad(endDeg));
              const strokeColor = canSelfTarget
                ? '#ef4444'
                : tensionLevel === 'CRITICAL'
                  ? '#ef4444'
                  : tensionLevel === 'CORNERED'
                    ? factors.isWalled
                      ? '#38bdf8'
                      : '#fb923c'
                    : tensionLevel === 'PRESSURED'
                      ? '#f87171'
                      : tensionLevel === 'RELIEF'
                        ? '#34d399'
                        : '#d4af37';

              return (
                <path
                  key={idx}
                  d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
                  fill="none"
                  stroke={active ? strokeColor : 'rgba(68, 45, 28, 0.28)'}
                  strokeWidth={active ? '2.4' : '1.4'}
                  strokeLinecap="round"
                  style={{
                    filter: active ? `drop-shadow(0 0 3px ${strokeColor})` : 'none',
                    transition: 'stroke 0.35s ease, stroke-width 0.35s ease',
                  }}
                />
              );
            })}

            {/* Setas de ameaça iminente quando alvejado */}
            {factors.incomingAttackCount > 0 && (
              <g className="animate-pulse">
                <polygon points="60,3 55,10 65,10" fill="#ef4444" />
                {factors.incomingAttackCount >= 2 && (
                  <>
                    <polygon points="10,45 17,41 15,49" fill="#ef4444" />
                    <polygon points="110,45 103,41 105,49" fill="#ef4444" />
                  </>
                )}
              </g>
            )}
          </svg>

          {/* Anel sutil de Pacto de Sangue */}
          {factors.hasBloodPact && (
            <img
              src={EFFECT_ASSETS.BLOOD_PACT_RING}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={cn(
                'pointer-events-none select-none absolute inset-0 w-full h-full object-contain z-22',
                factors.pactPartnerInDanger ? 'opacity-80 animate-pulse' : 'opacity-40'
              )}
            />
          )}

          {/* Selo Mão Exposta */}
          {factors.isHandRevealed && factors.isAlive && (
            <div
              className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 px-1.5 py-[1px] rounded-full bg-amber-950/90 border border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"
              title="Sua mão está revelada para toda a mesa!"
            >
              <GameIcon name="abyssal-eye" size={10} />
              <span className="font-mono text-[7.5px] font-extrabold text-amber-200 uppercase">
                Exposto
              </span>
            </div>
          )}

          {/* Brilho interno de auto-mira */}
          {canSelfTarget && isHoveringValidSelfTarget && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full z-25 transition-opacity duration-200"
              style={{
                boxShadow:
                  selfCardPreview?.tone === 'beneficial'
                    ? 'inset 0 0 24px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(251, 191, 36, 0.4)'
                    : 'inset 0 0 28px rgba(220, 38, 38, 0.75)',
              }}
            />
          )}

          {/* Aura de Alívio */}
          {expressionKey === 'ALIVIO' && factors.isAlive && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full z-20 animate-pulse"
              style={{
                boxShadow: 'inset 0 0 22px rgba(52, 211, 153, 0.5)',
              }}
            />
          )}

          {/* Vinheta de tensão crítica */}
          {factors.isAlive && visualParams.crimsonGlow > 0.35 && !canSelfTarget && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full z-20 transition-opacity duration-500"
              style={{
                boxShadow: `inset 0 0 ${Math.round(16 + visualParams.crimsonGlow * 20)}px rgba(220, 38, 38, ${(visualParams.crimsonGlow * 0.6).toFixed(2)})`,
              }}
            />
          )}

          {/* Efeitos visuais de combate */}
          <AnimatePresence>
            {me?.visualEffect && <PortraitCombatVfx visualEffect={me.visualEffect} />}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 2. BARRAS DE VIDA (Tamanho proporcional ao novo diâmetro do retrato) */}
      <div
        className="relative z-40 -mt-3 flex items-center justify-center gap-1 px-2 pointer-events-none"
        aria-label={`Vida: ${lives} de ${maxLives}`}
      >
        {Array.from({ length: maxLives }).map((_, idx) => {
          const filled = idx < lives && factors.isAlive;
          const midIndex = (maxLives - 1) / 2;
          const isCenterSegment = Math.abs(idx - midIndex) < 0.6;

          return (
            <motion.div
              key={idx}
              animate={
                filled && factors.isCriticalHp
                  ? { scale: [1, 1.1, 1], opacity: [0.88, 1, 0.88] }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                filled && factors.isCriticalHp
                  ? { duration: 0.65, repeat: Infinity }
                  : { duration: 0.3 }
              }
              className={cn(
                'relative h-[10px] sm:h-[11px] rounded-[2px] border-2 border-[#080403] transition-all duration-300',
                maxLives <= 3
                  ? 'w-[26px] sm:w-[32px]'
                  : maxLives === 4
                    ? 'w-[22px] sm:w-[26px]'
                    : 'w-[18px] sm:w-[22px]',
                isCenterSegment && '-translate-y-0.5',
                filled
                  ? 'bg-gradient-to-r from-[#991b1b] via-[#ef4444] to-[#b91c1c] shadow-[0_0_10px_rgba(220,38,38,0.8),0_2px_4px_rgba(0,0,0,0.95)]'
                  : 'bg-[#1a0c09]/95 border-stone-800/90 opacity-75 shadow-inner'
              )}
            >
              {filled ? (
                <div className="absolute inset-x-1 top-[1.5px] h-[2px] rounded-full bg-white/35" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-3/4 h-[1px] -rotate-12 bg-red-950/80" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 3. RÓTULO DE ESTADO */}
      <div className="mt-0.5 flex flex-col items-center text-center pointer-events-none">
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'font-grimoire font-black text-[10px] sm:text-[11px] tracking-[0.12em] uppercase',
              canSelfTarget && isHoveringValidSelfTarget
                ? 'text-red-300'
                : tensionLevel === 'CRITICAL'
                  ? 'text-red-300 animate-pulse'
                  : tensionLevel === 'CORNERED'
                    ? 'text-amber-300'
                    : tensionLevel === 'PRESSURED'
                      ? 'text-red-200'
                      : tensionLevel === 'RELIEF'
                        ? 'text-emerald-300'
                        : tensionLevel === 'DEAD'
                          ? 'text-purple-300'
                          : 'text-[#f5e6c8]'
            )}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.98)' }}
          >
            {statusLabel}
          </span>
          <span className="font-mono text-[9.5px] font-bold text-amber-200/85">
            ({lives}/{maxLives})
          </span>
        </div>

        {/* Pílulas de condições ativas */}
        {(factors.hasDeathMark ||
          factors.hasBloodPact ||
          factors.isWalled ||
          factors.hasSoulBuff ||
          factors.incomingAttackCount > 0) && (
          <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1 max-w-[210px]">
            {factors.incomingAttackCount > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1 py-[1px] rounded bg-red-950/95 border border-red-400 text-[8.5px] font-mono font-extrabold text-red-200 animate-pulse">
                <GameIcon name="dagger-strike" size={9} />
                <span>Alvejado ({factors.incomingAttackCount})</span>
              </span>
            )}
            {factors.hasDeathMark && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 px-1 py-[1px] rounded border text-[8.5px] font-mono font-extrabold',
                  factors.isDeathMarkUrgent
                    ? 'bg-red-950/95 border-red-400 text-red-200 animate-pulse'
                    : 'bg-lime-950/95 border-lime-400 text-lime-200'
                )}
              >
                <GameIcon name="death-mark" size={9} />
                <span>Marca {factors.deathMarkTurns}t</span>
              </span>
            )}
            {factors.isWalled && (
              <span className="inline-flex items-center gap-0.5 px-1 py-[1px] rounded bg-sky-950/95 border border-sky-400 text-[8.5px] font-mono font-extrabold text-sky-200">
                <GameIcon name="iron-lock" size={9} />
                <span>Emparedado</span>
              </span>
            )}
            {factors.hasBloodPact && (
              <span className="inline-flex items-center gap-0.5 px-1 py-[1px] rounded bg-rose-950/95 border border-rose-400 text-[8.5px] font-mono font-extrabold text-rose-200 max-w-[120px] truncate">
                <GameIcon name="blood-drop" size={9} />
                <span>Pacto: {factors.pactPartners.map((p) => p.name).join(', ')}</span>
              </span>
            )}
            {factors.hasSoulBuff && (
              <span className="inline-flex items-center gap-0.5 px-1 py-[1px] rounded bg-teal-950/95 border border-teal-400 text-[8.5px] font-mono font-extrabold text-teal-200">
                <GameIcon name="dagger-buff" size={9} />
                <span>Faca {factors.knifeDamage}x</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

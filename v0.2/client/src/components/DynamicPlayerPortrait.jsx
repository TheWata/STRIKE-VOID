import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/cn';
import GameIcon from './GameIcon';
import {
  EFFECT_ASSETS,
  getCharacterPresenceAsset,
} from '../models/assetCatalog';
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
 * Rig SVG expressivo de rosto, olhos, sobrancelhas, fissuras de tensão e claro-escuro
 * posicionado sob o capuz do personagem.
 */
function PortraitExpressionOverlay({
  eyes,
  eyeState,
  shadowIntensity,
  hasDeathMark,
  isDeathMarkUrgent,
  hasSoulBuff,
  isCriticalHp,
  isLowHp,
}) {
  const lx = eyes?.lx ?? 71;
  const rx = eyes?.rx ?? 89;
  const ey = eyes?.y ?? 62;
  const cx = (lx + rx) / 2;

  const eyeColor =
    eyeState === 'dead'
      ? '#a855f7'
      : eyeState === 'desperate'
        ? '#ef4444'
        : eyeState === 'cornered'
          ? '#fb923c'
          : eyeState === 'vigilant'
            ? '#f59e0b'
            : eyeState === 'empowered'
              ? '#2dd4bf'
              : eyeState === 'relieved'
                ? '#34d399'
                : '#fbbf24';

  const eyeRy =
    eyeState === 'desperate'
      ? 2.85
      : eyeState === 'cornered'
        ? 1.55
        : eyeState === 'vigilant'
          ? 2.0
          : eyeState === 'relieved'
            ? 1.65
            : 1.85;

  const eyeRx =
    eyeState === 'desperate'
      ? 3.8
      : eyeState === 'cornered'
        ? 3.4
        : 3.3;

  // Inclinação das sobrancelhas conforme estado emocional
  const browTilt =
    eyeState === 'desperate'
      ? -2.8
      : eyeState === 'cornered' || eyeState === 'vigilant'
        ? 2.4
        : eyeState === 'relieved'
          ? -1.4
          : 0.6;

  return (
    <svg
      viewBox="0 0 160 210"
      className="pointer-events-none absolute inset-0 w-full h-full overflow-visible z-20"
    >
      <defs>
        <radialGradient id="hood-inner-shadow" cx="50%" cy="38%" r="48%">
          <stop offset="0%" stopColor="#050202" stopOpacity={shadowIntensity} />
          <stop
            offset="70%"
            stopColor={isCriticalHp ? '#2c0404' : '#0b0503'}
            stopOpacity={Math.min(0.95, shadowIntensity * 0.85)}
          />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sombra interna profunda do capuz e contornos faciais em claro-escuro */}
      <ellipse cx={cx} cy={ey + 8} rx="24" ry="30" fill="url(#hood-inner-shadow)" />

      {/* Linhas de expressão facial, maçãs do rosto e mandíbula contraída sob tensão */}
      {eyeState !== 'dead' && (
        <g opacity={0.35 + shadowIntensity * 0.55}>
          {/* Sombra do dorso nasal */}
          <path
            d={`M ${cx} ${ey - 2} L ${cx - 2.2} ${ey + 11} L ${cx + 2.2} ${ey + 11} Z`}
            fill="#040201"
          />
          {/* Sulcos faciais de desgaste quando ferido ou pressionado */}
          {(isLowHp || eyeState === 'cornered' || eyeState === 'desperate') && (
            <>
              <path
                d={`M ${lx - 5} ${ey + 6} Q ${lx - 2} ${ey + 15} ${lx + 2} ${ey + 21}`}
                stroke={isCriticalHp ? '#7f1d1d' : '#1c0d06'}
                strokeWidth="1.3"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M ${rx + 5} ${ey + 6} Q ${rx + 2} ${ey + 15} ${rx - 2} ${ey + 21}`}
                stroke={isCriticalHp ? '#7f1d1d' : '#1c0d06'}
                strokeWidth="1.3"
                fill="none"
                strokeLinecap="round"
              />
            </>
          )}
          {/* Boca / mandíbula: serena no estado normal, contraída em tensão, crispada em estado crítico */}
          {eyeState === 'desperate' ? (
            <path
              d={`M ${cx - 7} ${ey + 21} Q ${cx} ${ey + 17.5} ${cx + 7} ${ey + 21} Q ${cx} ${ey + 23.5} ${cx - 7} ${ey + 21}`}
              fill="#2a0404"
              stroke="#7f1d1d"
              strokeWidth="0.9"
            />
          ) : eyeState === 'cornered' || eyeState === 'vigilant' ? (
            <path
              d={`M ${cx - 6} ${ey + 20.5} Q ${cx} ${ey + 19} ${cx + 6} ${ey + 20.5}`}
              stroke="#29140b"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <line
              x1={cx - 4.5}
              y1={ey + 20}
              x2={cx + 4.5}
              y2={ey + 20}
              stroke="#1f1109"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          )}
        </g>
      )}

      {/* Fissuras de sangue / desgaste extremo em estado crítico */}
      {isCriticalHp && eyeState !== 'dead' && (
        <g opacity="0.85">
          <path
            d={`M ${lx - 2} ${ey + 3} L ${lx - 3.5} ${ey + 12} L ${lx - 1.5} ${ey + 18}`}
            stroke="#dc2626"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${rx + 2} ${ey + 3} L ${rx + 3} ${ey + 10} L ${rx + 1.5} ${ey + 16}`}
            stroke="#dc2626"
            strokeWidth="0.9"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Símbolo arcano da Marca da Morte cravado na testa quando amaldiçoado */}
      {hasDeathMark && eyeState !== 'dead' && (
        <g
          opacity={isDeathMarkUrgent ? '1' : '0.88'}
          style={{
            filter: `drop-shadow(0 0 6px ${isDeathMarkUrgent ? '#ef4444' : '#a3e635'})`,
          }}
        >
          <circle
            cx={cx}
            cy={ey - 12}
            r="4.5"
            fill="none"
            stroke={isDeathMarkUrgent ? '#f87171' : '#a3e635'}
            strokeWidth="1.2"
          />
          <path
            d={`M ${cx} ${ey - 17} L ${cx} ${ey - 7} M ${cx - 4.5} ${ey - 12} L ${cx + 4.5} ${ey - 12}`}
            stroke={isDeathMarkUrgent ? '#ef4444' : '#bef264'}
            strokeWidth="1"
          />
        </g>
      )}

      {/* Olhos e sobrancelhas reativos */}
      {eyeState === 'dead' ? (
        <g opacity="0.55">
          <circle cx={lx} cy={ey} r="2.6" fill="#3b0764" />
          <circle cx={rx} cy={ey} r="2.6" fill="#3b0764" />
          <path
            d={`M ${lx - 2} ${ey} L ${lx + 2} ${ey} M ${rx - 2} ${ey} L ${rx + 2} ${ey}`}
            stroke="#c084fc"
            strokeWidth="0.9"
          />
        </g>
      ) : (
        <motion.g
          animate={
            eyeState === 'cornered'
              ? { x: [0, -1.8, 1.8, -1.2, 0] }
              : eyeState === 'desperate'
                ? { x: [0, -0.8, 0.8, -0.5, 0], y: [0, -0.4, 0.4, 0] }
                : { x: 0, y: 0 }
          }
          transition={
            eyeState === 'cornered'
              ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
              : eyeState === 'desperate'
                ? { duration: 0.55, repeat: Infinity }
                : { duration: 0.4 }
          }
        >
          {/* Sobrancelhas expressivas */}
          <line
            x1={lx - 4.5}
            y1={ey - 3.6 - browTilt}
            x2={lx + 4.2}
            y2={ey - 3.6 + browTilt}
            stroke="#090402"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1={rx - 4.2}
            y1={ey - 3.6 + browTilt}
            x2={rx + 4.5}
            y2={ey - 3.6 - browTilt}
            stroke="#090402"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Esclera / Brilho ocular */}
          <ellipse
            cx={lx}
            cy={ey}
            rx={eyeRx}
            ry={eyeRy}
            fill={eyeColor}
            style={{ filter: `drop-shadow(0 0 ${eyeState === 'desperate' ? 9 : 6}px ${eyeColor})` }}
          />
          <ellipse
            cx={rx}
            cy={ey}
            rx={eyeRx}
            ry={eyeRy}
            fill={eyeColor}
            style={{ filter: `drop-shadow(0 0 ${eyeState === 'desperate' ? 9 : 6}px ${eyeColor})` }}
          />

          {/* Pupilas contraídas em pânico/ameaça ou serenas no estado normal */}
          <circle
            cx={lx}
            cy={ey}
            r={eyeState === 'desperate' ? 0.75 : 1.05}
            fill={eyeState === 'desperate' ? '#450a0a' : '#fffbeb'}
            opacity="0.95"
          />
          <circle
            cx={rx}
            cy={ey}
            r={eyeState === 'desperate' ? 0.75 : 1.05}
            fill={eyeState === 'desperate' ? '#450a0a' : '#fffbeb'}
            opacity="0.95"
          />

          {/* Chamas etéreas nos olhos quando com Faca fortalecida (Manipulamento de Alma) */}
          {hasSoulBuff && (
            <>
              <path
                d={`M ${lx} ${ey - 2} Q ${lx - 3} ${ey - 9} ${lx + 1} ${ey - 13}`}
                stroke="#2dd4bf"
                strokeWidth="1.2"
                fill="none"
                opacity="0.8"
              />
              <path
                d={`M ${rx} ${ey - 2} Q ${rx + 3} ${ey - 9} ${rx - 1} ${ey - 13}`}
                stroke="#2dd4bf"
                strokeWidth="1.2"
                fill="none"
                opacity="0.8"
              />
            </>
          )}
        </motion.g>
      )}
    </svg>
  );
}

/**
 * Retrato Dinâmico do Jogador (Círculo Central da HUD):
 * Representa visualmente o estado físico, emocional e tático do jogador em tempo real.
 * Inclui também os segmentos vermelhos horizontais na base do retrato conforme a referência visual.
 */
export default function DynamicPlayerPortrait({
  me,
  players = [],
  localIndex = 0,
  phase = 'PLANNING',
  selectedCard = null,
  socket = null,
  canSelfTarget = false,
  onSelfTargetClick,
  onDropCardOnSelf,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [secsLeft, setSecsLeft] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const prevStateRef = useRef({
    lives: me?.lives ?? null,
    isWalled: Boolean(me?.isWalled),
    deathMarkTurns: me?.deathMarkTurns ?? null,
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

  // Detecta recuperação real (cura de vida, remoção de Marca da Morte ou quebra de parede)
  const hasMe = Boolean(me);
  const myLives = me?.lives ?? 0;
  const myMark = me?.deathMarkTurns ?? null;
  const myWalled = Boolean(me?.isWalled);
  const myFx = me?.visualEffect ?? null;
  const myAlive = Boolean(me?.isAlive);

  useEffect(() => {
    if (!hasMe) return undefined;
    const prev = prevStateRef.current;

    const healedHp = prev.lives != null && myLives > prev.lives && myAlive;
    const clearedMark = prev.deathMarkTurns != null && myMark == null && myAlive;
    const brokeWall = prev.isWalled && !myWalled && myAlive;

    prevStateRef.current = {
      lives: myLives,
      isWalled: myWalled,
      deathMarkTurns: myMark,
    };

    if (healedHp || clearedMark || brokeWall || myFx === 'HEAL') {
      const startTimer = setTimeout(() => setIsRecovering(true), 0);
      const endTimer = setTimeout(() => setIsRecovering(false), 2600);
      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    }
    return undefined;
  }, [hasMe, myLives, myMark, myWalled, myFx, myAlive]);

  const portraitState = computePlayerPortraitState({
    me,
    players,
    phase,
    selectedCard,
    secsLeft: effectiveSecsLeft,
    isRecovering,
  });

  const {
    tensionScore,
    tensionLevel,
    statusLabel,
    statusSummary,
    factors,
    visualParams,
  } = portraitState;

  const presence = getCharacterPresenceAsset(localIndex);
  const maxLives = factors.maxLives || 3;
  const lives = factors.lives ?? maxLives;

  // Animação postural contínua da figura dentro do retrato
  const postureAnimate =
    visualParams.postureState === 'spectral'
      ? { y: [0, -5, 0], scale: [0.96, 1, 0.96], rotate: [0, -1.5, 1.5, 0] }
      : visualParams.postureState === 'recoil'
        ? { x: [0, -9, 9, -6, 6, 0], y: [0, 5, 2], scale: [1, 0.94, 1.03, 1] }
        : visualParams.postureState === 'agonized'
          ? {
              x: [0, -1.6, 1.6, -1, 1, 0],
              y: [4, 7, 4],
              scaleY: [0.96, 1.01, 0.96],
              rotate: [-2, -0.5, -2],
            }
          : visualParams.postureState === 'caged'
            ? { y: [3, 5.5, 3], scaleX: [0.95, 0.93, 0.95], scaleY: [0.97, 0.99, 0.97] }
            : visualParams.postureState === 'guarded'
              ? { y: [2, 4.5, 2], scaleY: [0.98, 1.015, 0.98] }
              : visualParams.postureState === 'relieved'
                ? { y: [3, -2, 0], scale: [0.98, 1.03, 1] }
                : visualParams.postureState === 'empowered'
                  ? { y: [0, -3.5, 0], scale: [1, 1.035, 1] }
                  : { y: [0, -2.2, 0], scaleY: [1, 1.012, 1] };

  const postureTransition =
    visualParams.postureState === 'recoil'
      ? { duration: 0.48, ease: 'easeOut' }
      : {
          duration: visualParams.heartbeatDuration || 3.4,
          repeat: Infinity,
          ease: 'easeInOut',
        };

  // Cores do aro e iluminação interna conforme o estado consolidado
  const ringBorderClass =
    tensionLevel === 'CRITICAL'
      ? 'border-red-500 shadow-[0_0_36px_rgba(220,38,38,0.85),inset_0_0_28px_rgba(153,27,27,0.8)]'
      : tensionLevel === 'CORNERED'
        ? factors.isWalled
          ? 'border-sky-400/90 shadow-[0_0_28px_rgba(56,189,248,0.55),inset_0_0_24px_rgba(12,74,110,0.75)]'
          : 'border-orange-400/90 shadow-[0_0_28px_rgba(251,146,60,0.6),inset_0_0_22px_rgba(124,45,18,0.75)]'
        : tensionLevel === 'PRESSURED'
          ? 'border-red-400/85 shadow-[0_0_26px_rgba(220,38,38,0.55),inset_0_0_20px_rgba(127,29,29,0.65)]'
          : tensionLevel === 'RELIEF'
            ? 'border-emerald-400/85 shadow-[0_0_26px_rgba(52,211,153,0.55),inset_0_0_20px_rgba(6,78,59,0.55)]'
            : tensionLevel === 'DEAD'
              ? 'border-purple-500/60 shadow-[0_0_24px_rgba(147,51,234,0.45)]'
              : 'border-gold-aged/90 shadow-[0_0_26px_rgba(212,175,55,0.4),inset_0_0_22px_rgba(0,0,0,0.85)]';

  const innerLightingStyle =
    tensionLevel === 'CRITICAL'
      ? {
          background:
            'radial-gradient(circle at 50% 62%, rgba(220,38,38,0.55) 0%, rgba(127,29,29,0.42) 45%, rgba(10,4,4,0.96) 82%)',
        }
      : tensionLevel === 'CORNERED'
        ? {
            background: factors.isWalled
              ? 'radial-gradient(circle at 50% 48%, rgba(56,189,248,0.32) 0%, rgba(15,23,42,0.82) 55%, rgba(6,4,4,0.96) 88%)'
              : 'radial-gradient(circle at 50% 55%, rgba(234,88,12,0.38) 0%, rgba(127,29,29,0.32) 52%, rgba(8,4,3,0.95) 86%)',
          }
        : tensionLevel === 'PRESSURED' || tensionLevel === 'WATCHFUL'
          ? {
              background:
                'radial-gradient(circle at 50% 52%, rgba(217,119,6,0.34) 0%, rgba(153,27,27,0.28) 52%, rgba(10,5,4,0.95) 85%)',
            }
          : tensionLevel === 'RELIEF'
            ? {
                background:
                  'radial-gradient(circle at 50% 45%, rgba(52,211,153,0.36) 0%, rgba(212,175,55,0.22) 52%, rgba(10,7,5,0.94) 85%)',
              }
            : tensionLevel === 'DEAD'
              ? {
                  background:
                    'radial-gradient(circle at 50% 45%, rgba(147,51,234,0.3) 0%, rgba(30,10,45,0.75) 58%, rgba(6,3,10,0.97) 90%)',
                }
              : {
                  background:
                    'radial-gradient(circle at 50% 42%, rgba(245,158,11,0.3) 0%, rgba(120,53,15,0.22) 50%, rgba(12,7,5,0.95) 85%)',
                };

  const totalArcSegments = 8;

  return (
    <div
      id="dynamic-player-portrait"
      data-tension-level={tensionLevel}
      data-tension-score={tensionScore}
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
        if (canSelfTarget && onSelfTargetClick) {
          e.stopPropagation();
          onSelfTargetClick();
        }
      }}
      title={`${me?.name || 'Você'} — ${statusLabel}: ${statusSummary}`}
      className={cn(
        'relative flex flex-col items-center justify-center select-none shrink-0 z-30 transition-transform duration-200',
        canSelfTarget && 'cursor-pointer hover:scale-[1.04]',
        dragOver && 'scale-105'
      )}
    >
      {/* 1. MOLDURA CIRCULAR CENTRAL DO RETRATO DINÂMICO */}
      <motion.div
        animate={
          tensionLevel === 'CRITICAL'
            ? { scale: [1, 1.035, 1, 1.025, 1] }
            : tensionLevel === 'PRESSURED' || tensionLevel === 'CORNERED'
              ? { scale: [1, 1.018, 1] }
              : { scale: 1 }
        }
        transition={
          tensionLevel === 'CRITICAL'
            ? { duration: 0.78, repeat: Infinity, ease: 'easeOut' }
            : tensionLevel === 'PRESSURED' || tensionLevel === 'CORNERED'
              ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.4 }
        }
        className={cn(
          'relative w-[124px] h-[124px] sm:w-[148px] sm:h-[148px] rounded-full border-[4px] bg-[#0b0604] overflow-hidden flex items-center justify-center transition-colors duration-500',
          ringBorderClass,
          canSelfTarget && 'ring-4 ring-amber-300/80'
        )}
      >
        {/* Fundo de iluminação reativa (vela / sangue / ferro / alívio) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-all duration-500"
          style={innerLightingStyle}
        />

        {/* Anel de segmentos radiais de tensão no perímetro interno do círculo */}
        <svg
          viewBox="0 0 120 120"
          className="pointer-events-none absolute inset-0 w-full h-full z-10"
        >
          {Array.from({ length: totalArcSegments }).map((_, idx) => {
            const active = idx < visualParams.activeSegments && factors.isAlive;
            const segAngle = 360 / totalArcSegments;
            const startDeg = -135 + idx * segAngle + 4;
            const endDeg = startDeg + segAngle - 8;
            const r = 55;
            const rad = (d) => (d * Math.PI) / 180;
            const x1 = 60 + r * Math.cos(rad(startDeg));
            const y1 = 60 + r * Math.sin(rad(startDeg));
            const x2 = 60 + r * Math.cos(rad(endDeg));
            const y2 = 60 + r * Math.sin(rad(endDeg));
            const strokeColor =
              tensionLevel === 'CRITICAL'
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
                stroke={active ? strokeColor : 'rgba(68, 45, 28, 0.32)'}
                strokeWidth={active ? '3.2' : '2'}
                strokeLinecap="round"
                style={{
                  filter: active ? `drop-shadow(0 0 4px ${strokeColor})` : 'none',
                  transition: 'stroke 0.35s ease, stroke-width 0.35s ease',
                }}
              />
            );
          })}

          {/* Setas vermelhas de ameaça iminente quando alvejado na mesa */}
          {factors.incomingAttackCount > 0 && (
            <g className="animate-pulse">
              <polygon points="60,3 55,12 65,12" fill="#ef4444" />
              {factors.incomingAttackCount >= 2 && (
                <>
                  <polygon points="10,45 19,41 17,51" fill="#ef4444" />
                  <polygon points="110,45 101,41 103,51" fill="#ef4444" />
                </>
              )}
            </g>
          )}
        </svg>

        {/* Anel de Pacto de Sangue quando vinculado a outro jogador */}
        {factors.hasBloodPact && (
          <img
            src={EFFECT_ASSETS.BLOOD_PACT_RING}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={cn(
              'pointer-events-none select-none absolute inset-0 w-full h-full object-contain z-15',
              factors.pactPartnerInDanger ? 'opacity-90 animate-pulse' : 'opacity-65'
            )}
          />
        )}

        {/* Figura e Expressão Dinâmica do Jogador */}
        <motion.div
          animate={postureAnimate}
          transition={postureTransition}
          className={cn(
            'relative w-[118%] h-[118%] -bottom-[8%] flex items-center justify-center pointer-events-none select-none z-15',
            !factors.isAlive && 'grayscale opacity-55'
          )}
        >
          {!imgFailed ? (
            <picture className="w-full h-full flex items-center justify-center">
              <source srcSet={presence.webp} type="image/webp" />
              <img
                src={presence.png}
                alt={me?.name || 'Retrato do Jogador'}
                decoding="async"
                draggable={false}
                onError={() => setImgFailed(true)}
                className="w-full h-full object-contain object-bottom"
                style={{
                  filter:
                    tensionLevel === 'CRITICAL'
                      ? 'contrast(1.25) brightness(0.92) drop-shadow(0 0 14px rgba(220,38,38,0.65))'
                      : tensionLevel === 'CORNERED'
                        ? 'contrast(1.18) brightness(0.9)'
                        : 'contrast(1.05)',
                }}
              />
            </picture>
          ) : (
            <svg viewBox="0 0 160 210" className="w-full h-full">
              <path
                d="M 12 210 C 14 148, 30 110, 54 98 C 65 92, 65 80, 62 66 C 58 48, 66 26, 80 26 C 94 26, 102 46, 98 66 C 95 80, 95 93, 106 100 C 130 114, 144 150, 148 210 Z"
                fill="#0d0705"
              />
            </svg>
          )}

          {/* Expressão facial, olhos, sobrancelhas e fissuras sob o capuz */}
          <PortraitExpressionOverlay
            eyes={presence.eyes}
            eyeState={visualParams.eyeState}
            shadowIntensity={visualParams.shadowIntensity}
            hasDeathMark={factors.hasDeathMark}
            isDeathMarkUrgent={factors.isDeathMarkUrgent}
            hasSoulBuff={factors.hasSoulBuff}
            isCriticalHp={factors.isCriticalHp}
            isLowHp={factors.isLowHp}
          />
        </motion.div>

        {/* Grades de Ferro sobre o retrato quando EMPAREDADO */}
        {factors.isWalled && factors.isAlive && (
          <img
            src={EFFECT_ASSETS.IRON_CAGE}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover z-25 opacity-85 mix-blend-lighten"
          />
        )}

        {/* Olho Abissal no topo do retrato quando a mão está REVELADA para a mesa */}
        {factors.isHandRevealed && factors.isAlive && (
          <div
            className="pointer-events-none absolute top-1.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse"
            title="Sua mão está revelada para toda a mesa!"
          >
            <GameIcon name="abyssal-eye" size={12} />
            <span className="font-mono text-[8.5px] font-extrabold text-amber-200 uppercase">
              Exposto
            </span>
          </div>
        )}

        {/* Vinheta interna de tensão crítica / batimento arterial */}
        {factors.isAlive && visualParams.crimsonGlow > 0.35 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full z-20 transition-opacity duration-500"
            style={{
              boxShadow: `inset 0 0 ${Math.round(22 + visualParams.crimsonGlow * 28)}px rgba(220, 38, 38, ${(visualParams.crimsonGlow * 0.75).toFixed(2)})`,
            }}
          />
        )}

        {/* Efeitos visuais de combate da rodada */}
        <AnimatePresence>
          {me?.visualEffect && <PortraitCombatVfx visualEffect={me.visualEffect} />}
        </AnimatePresence>
      </motion.div>

      {/* 2. BARRAS / SEGMENTOS VERMELHOS DE VIDA E TENSÃO (Fiel à referência visual anexada) */}
      <div
        className="relative z-40 -mt-5 flex items-center justify-center gap-1.5 px-2"
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
                  ? { scale: [1, 1.12, 1], opacity: [0.88, 1, 0.88] }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                filled && factors.isCriticalHp
                  ? { duration: 0.65, repeat: Infinity }
                  : { duration: 0.3 }
              }
              className={cn(
                'relative h-[12px] sm:h-[14px] rounded-[2px] border-2 border-[#080403] transition-all duration-300',
                maxLives <= 3
                  ? 'w-[34px] sm:w-[42px]'
                  : maxLives === 4
                    ? 'w-[28px] sm:w-[34px]'
                    : 'w-[24px] sm:w-[29px]',
                isCenterSegment && '-translate-y-1.5',
                filled
                  ? 'bg-gradient-to-r from-[#991b1b] via-[#ef4444] to-[#b91c1c] shadow-[0_0_12px_rgba(220,38,38,0.8),0_3px_6px_rgba(0,0,0,0.95)]'
                  : 'bg-[#1a0c09]/95 border-stone-800/90 opacity-75 shadow-inner'
              )}
            >
              {filled ? (
                <div className="absolute inset-x-1 top-[2px] h-[3px] rounded-full bg-white/35" />
              ) : (
                /* Fissura diagonal indicando segmento de vida drenado */
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-3/4 h-[1.5px] -rotate-12 bg-red-950/80" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 3. RÓTULO DE ESTADO E SINAIS ATIVOS DO PERSONAGEM */}
      <div className="mt-1 flex flex-col items-center text-center pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'font-grimoire font-black text-[11px] sm:text-xs tracking-[0.14em] uppercase',
              tensionLevel === 'CRITICAL'
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
          <span className="font-mono text-[10.5px] font-bold text-amber-200/85">
            ({lives}/{maxLives})
          </span>
        </div>

        {/* Pílulas de condições ativas de combate (Marca, Pacto, Parede, Faca+) */}
        {(factors.hasDeathMark ||
          factors.hasBloodPact ||
          factors.isWalled ||
          factors.hasSoulBuff ||
          factors.incomingAttackCount > 0) && (
          <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1.5 max-w-[230px]">
            {factors.incomingAttackCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded bg-red-950/95 border border-red-400 text-[9.5px] font-mono font-extrabold text-red-200 animate-pulse">
                <GameIcon name="dagger-strike" size={10} />
                <span>Alvejado ({factors.incomingAttackCount})</span>
              </span>
            )}
            {factors.hasDeathMark && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-[1px] rounded border text-[9.5px] font-mono font-extrabold',
                  factors.isDeathMarkUrgent
                    ? 'bg-red-950/95 border-red-400 text-red-200 animate-pulse'
                    : 'bg-lime-950/95 border-lime-400 text-lime-200'
                )}
              >
                <GameIcon name="death-mark" size={10} />
                <span>Marca {factors.deathMarkTurns}t</span>
              </span>
            )}
            {factors.isWalled && (
              <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded bg-sky-950/95 border border-sky-400 text-[9.5px] font-mono font-extrabold text-sky-200">
                <GameIcon name="iron-lock" size={10} />
                <span>Emparedado</span>
              </span>
            )}
            {factors.hasBloodPact && (
              <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded bg-rose-950/95 border border-rose-400 text-[9.5px] font-mono font-extrabold text-rose-200 max-w-[130px] truncate">
                <GameIcon name="blood-drop" size={10} />
                <span>Pacto: {factors.pactPartners.map((p) => p.name).join(', ')}</span>
              </span>
            )}
            {factors.hasSoulBuff && (
              <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded bg-teal-950/95 border border-teal-400 text-[9.5px] font-mono font-extrabold text-teal-200">
                <GameIcon name="dagger-buff" size={10} />
                <span>Faca {factors.knifeDamage}x</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pause,
  SkipForward,
  Crosshair,
  Hand,
  Trash2,
  ChevronDown,
  ChevronUp,
  Ghost,
  Eye,
  Layers,
  BookOpen,
  Lock,
  Unlock,
  Flame,
} from 'lucide-react';
import { cn } from '../lib/cn';
import {
  CAMERA_ZONES,
  RESOLUTION_STEPS,
  VISUAL_EFFECT_BADGES,
} from '../models/gameModel';
import { CARD_TYPES, CARD_META } from '../models/cardModel';
import { seatPosition, TABLE_NAILS } from '../helpers/math3d';
import { useCamera3DController } from '../controllers/useCamera3DController';
import InscryptionCard from '../components/InscryptionCard';
import PlayerSeat, { CardSlot } from '../components/PlayerSeat';
import PlayerSilhouette3D from '../components/PlayerSilhouette3D';
import TargetArrowsSVG from '../components/TargetArrowsSVG';
import CentralClock from '../components/CentralClock';
import UnderTableChat from '../components/UnderTableChat';
import { audio } from '../lib/audio';

export default function GameTable3DView({
  socket,
  gameState,
  players,
  me,
  phase,
  localIndex,
  compact,
  selectedCardIds,
  setSelectedCardIds,
  selectedCard,
  canAct,
  walled,
  discardLimit,
  isTargetable,
  sendAction,
  onSeatClick,
  onDropCard,
  onCardClick,
  onCardDragStart,
  dragCardRef,
  handleDiscard,
  handlePassTurn,
  logs,
  isDead,
  handleSendChat,
  onTogglePause,
  onSkipAnalysis,
}) {
  const {
    cameraZone,
    cameraLocked,
    toggleLock,
    selectZone,
    parallax,
    handleMouseMove,
    setTypingChat,
  } = useCamera3DController({ inGame: true });

  const isResolving = phase.startsWith('REVEAL_');
  const activeStep = RESOLUTION_STEPS.find((s) => s.key === phase) || null;
  const activeEffects = players.filter(
    (p) => p.visualEffect && VISUAL_EFFECT_BADGES[p.visualEffect]
  );

  // Parâmetros de inclinação 3D da câmera conforme a zona vertical do mouse
  const tablePitch =
    cameraZone === CAMERA_ZONES.PLAYERS
      ? 22
      : cameraZone === CAMERA_ZONES.NOTEBOOK
        ? 58
        : 42;

  const tableTranslateY =
    cameraZone === CAMERA_ZONES.PLAYERS
      ? compact
        ? 45
        : 78
      : cameraZone === CAMERA_ZONES.NOTEBOOK
        ? -240
        : compact
          ? -6
          : 12;

  const tableScale =
    cameraZone === CAMERA_ZONES.PLAYERS
      ? compact
        ? 0.92
        : 0.96
      : cameraZone === CAMERA_ZONES.NOTEBOOK
        ? 0.82
        : 1;

  // Verifica se a carta selecionada permite mirar em si mesmo
  const canSelfTarget =
    canAct &&
    selectedCard &&
    !CARD_META[selectedCard.type]?.requiresOtherPlayer;

  return (
    <div
      id="game-table-3d-viewport"
      onMouseMove={handleMouseMove}
      className="flex-1 min-h-0 flex flex-col relative overflow-hidden select-none inscryption-3d-stage"
    >
      {/* 1. FUNDO 3D DA SALA CERIMONIAL (Paredes de madeira escura, candelabro e névoa) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${-parallax.x * 3}px, ${
            cameraZone === CAMERA_ZONES.PLAYERS
              ? 35
              : cameraZone === CAMERA_ZONES.NOTEBOOK
                ? -60
                : 0
          }px, 0)`,
        }}
      >
        {/* Luz de candelabro oscilando no teto da cabana */}
        <div className="candle absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(255,165,60,0.18),rgba(139,0,0,0.08)_45%,transparent_75%)]" />
        {/* Vigas verticais de madeira da sala ao fundo quando se olha para cima (PLAYERS) */}
        <div
          className="absolute inset-x-0 top-0 h-[55%] opacity-35"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #140c07 0px, #140c07 48px, #090503 48px, #090503 52px)',
            maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
          }}
        />
      </div>

      {/* 2. HUD LATERAL DE CONTROLE DE OLHAR 3D (Cima: Jogadores | Meio: Cartas | Baixo: Caderno) */}
      <aside
        aria-label="Controle de Visão 3D"
        className="fixed left-2 sm:left-3 top-1/2 -translate-y-1/2 z-[65] flex flex-col gap-1.5 bg-black/85 border border-gold-aged/50 p-1.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.95)] backdrop-blur-md"
      >
        <div className="text-[8px] font-mono text-amber-300/80 text-center tracking-widest uppercase px-1 border-b border-stone-800 pb-1">
          VISÃO 3D
        </div>

        <button
          id="btn-cam-players"
          type="button"
          onClick={() => {
            audio.play('select');
            selectZone(CAMERA_ZONES.PLAYERS);
          }}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border',
            cameraZone === CAMERA_ZONES.PLAYERS
              ? 'bg-gold-aged/25 border-gold-aged text-amber-200 shadow-[0_0_12px_rgba(212,175,55,0.4)]'
              : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-parchment hover:border-stone-600'
          )}
          title="Olhar para Cima: Ver Silhuetas dos Jogadores [Mouse no Topo / Seta Cima]"
        >
          <Eye size={13} className="shrink-0 text-amber-300" />
          <span className="hidden md:inline">JOGADORES</span>
        </button>

        <button
          id="btn-cam-cards"
          type="button"
          onClick={() => {
            audio.play('select');
            selectZone(CAMERA_ZONES.CARDS);
          }}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border',
            cameraZone === CAMERA_ZONES.CARDS
              ? 'bg-blood/40 border-blood-bright text-red-200 shadow-[0_0_12px_rgba(220,38,38,0.4)]'
              : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-parchment hover:border-stone-600'
          )}
          title="Olhar para a Mesa e suas Cartas [Mouse no Meio]"
        >
          <Layers size={13} className="shrink-0 text-red-400" />
          <span className="hidden md:inline">CARTAS</span>
        </button>

        <button
          id="btn-cam-notebook"
          type="button"
          onClick={() => {
            audio.play('select');
            selectZone(CAMERA_ZONES.NOTEBOOK);
          }}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border',
            cameraZone === CAMERA_ZONES.NOTEBOOK
              ? 'bg-amber-900/50 border-amber-400 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-parchment hover:border-stone-600'
          )}
          title="Olhar embaixo da mesa: Caderno de Anotações e Chat [Mouse Embaixo / Seta Baixo]"
        >
          <BookOpen size={13} className="shrink-0 text-amber-400" />
          <span className="hidden md:inline">CADERNO</span>
        </button>

        <button
          id="btn-cam-lock"
          type="button"
          onClick={() => {
            audio.play('click');
            toggleLock();
          }}
          className={cn(
            'flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-mono border mt-0.5 transition-all',
            cameraLocked
              ? 'border-amber-500 bg-amber-950/80 text-amber-200'
              : 'border-stone-800 bg-black/60 text-stone-500 hover:text-stone-300'
          )}
          title={
            cameraLocked
              ? 'Câmera travada. Clique para ativar movimento livre pelo mouse.'
              : 'Câmera livre pelo mouse. Clique para travar o ângulo atual.'
          }
        >
          {cameraLocked ? <Lock size={10} /> : <Unlock size={10} />}
          <span className="hidden md:inline">{cameraLocked ? 'TRAVADA' : 'MOUSE'}</span>
        </button>
      </aside>

      {/* 3. BARRA TÁTICA SUPERIOR DE RESOLUÇÃO E EFEITOS */}
      <div className="relative z-40 flex flex-col items-center justify-center pt-1.5 sm:pt-2 px-2 pointer-events-none gap-1 shrink-0">
        <AnimatePresence mode="wait">
          {isResolving ? (
            <motion.div
              key="resolve-tracker"
              initial={{ y: -20, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -15, opacity: 0 }}
              className="flex flex-col items-center gap-1 bg-black/90 border border-gold-aged/60 px-3.5 py-1.5 rounded-xl shadow-[0_12px_35px_rgba(0,0,0,0.95)] backdrop-blur-md max-w-[95vw]"
            >
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                {RESOLUTION_STEPS.map((step) => {
                  const active = phase === step.key;
                  return (
                    <motion.div
                      key={step.key}
                      animate={
                        active
                          ? { scale: [1, 1.07, 1] }
                          : { scale: 0.94, opacity: 0.4 }
                      }
                      transition={{ duration: 0.85, repeat: active ? Infinity : 0 }}
                      className={cn(
                        'px-2 py-0.5 rounded-full border text-[9.5px] sm:text-xs font-grimoire font-bold tracking-wider transition-all',
                        active
                          ? step.color
                          : 'border-stone-800 text-stone-500 bg-stone-950/60'
                      )}
                    >
                      {step.label}
                    </motion.div>
                  );
                })}
              </div>
              {activeStep && (
                <span className="text-[10px] sm:text-[11px] font-mono text-amber-200/90 text-center">
                  {activeStep.subtitle}
                </span>
              )}
            </motion.div>
          ) : canAct && selectedCard ? (
            <motion.div
              key="aim-banner"
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              className="px-3.5 py-1 rounded-full border border-blood-bright bg-gradient-to-r from-red-950/90 via-black/95 to-red-950/90 text-amber-200 font-mono text-[10px] sm:text-xs font-bold tracking-wider shadow-[0_0_25px_rgba(220,38,38,0.5)] flex items-center gap-2"
            >
              <Crosshair size={14} className="text-blood-bright animate-spin shrink-0" />
              <span>
                {CARD_META[selectedCard.type]?.name}: PASSE O MOUSE PARA CIMA E CLIQUE NA SILHUETA DO ALVO
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="camera-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 py-0.5 rounded-full bg-black/65 border border-stone-800/90 text-[9.5px] sm:text-[10.5px] font-mono text-amber-200/80 flex items-center gap-2"
            >
              <span>
                {cameraZone === CAMERA_ZONES.PLAYERS
                  ? '👁️ OLHANDO OS JOGADORES — Desça o mouse para focar nas suas Cartas'
                  : cameraZone === CAMERA_ZONES.NOTEBOOK
                    ? '📓 CADERNO & CHAT SOB A MESA — Suba o mouse para voltar às Cartas'
                    : '🃏 OLHANDO A MESA & CARTAS — Suba o mouse p/ Jogadores · Desça p/ Caderno'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pílulas de feedback instantâneo dos efeitos da rodada */}
        <AnimatePresence>
          {activeEffects.length > 0 && (
            <motion.div
              key="active-fx-pills"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center justify-center gap-1.5 max-w-[94vw]"
            >
              {activeEffects.map((p) => {
                const badge = VISUAL_EFFECT_BADGES[p.visualEffect];
                return (
                  <span
                    key={`${p.id}-${p.visualEffect}`}
                    className={cn(
                      'px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold shadow-lg',
                      badge.cls
                    )}
                  >
                    {p.name}: {badge.label}
                  </span>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. PALCO 3D CENTRAL (MESA OCTOGONAL 3D + SILHUETAS EM PÉ + RELÓGIO) */}
      <main className="relative flex-1 min-h-0 flex items-center justify-center p-1 sm:p-2 inscryption-perspective">
        <motion.div
          animate={{
            rotateX: tablePitch - parallax.y * 0.6,
            rotateZ: -parallax.x * 0.45,
            y: tableTranslateY,
            scale: tableScale,
          }}
          transition={{ type: 'spring', stiffness: 130, damping: 22, mass: 0.9 }}
          style={{
            width: compact
              ? 'min(94vw, calc(100dvh - 235px))'
              : 'min(86vw, calc(100dvh - 205px))',
            maxHeight: compact ? 'calc(100dvh - 235px)' : 'calc(100dvh - 205px)',
            aspectRatio: '1 / 1',
            transformStyle: 'preserve-3d',
          }}
          className="relative"
        >
          {/* Sombra projetada no chão da sala 3D */}
          <div
            className="table-octagon absolute inset-0 bg-black/90 blur-2xl pointer-events-none"
            style={{ transform: 'translateZ(-42px) scale(1.06)' }}
          />

          {/* Espessura 3D de madeira maciça sob o tampo da mesa */}
          <div
            className="table-octagon absolute inset-0 bg-gradient-to-b from-[#2b190d] to-[#0f0804] border-4 border-[#1a0f08] pointer-events-none"
            style={{ transform: 'translateZ(-18px) translateY(14px)' }}
          />
          <div
            className="table-octagon absolute inset-0 bg-[#1e1108] pointer-events-none"
            style={{ transform: 'translateZ(-9px) translateY(7px)' }}
          />

          {/* Camada 1: Tampo de madeira escura entalhada */}
          <div className="table-octagon table-wood absolute inset-0 shadow-[0_0_80px_rgba(0,0,0,0.95)]" />
          {/* Camada 2: Aro chanfrado de ouro velho/ferro */}
          <div className="table-octagon table-rim absolute inset-[3.1%]" />
          {/* Camada 3: Feltro ritualístico com anéis arcanos */}
          <div className="table-octagon table-felt absolute inset-[4.1%]" />
          <div className="rounded-full table-ritual-ring absolute inset-[19%] pointer-events-none" />

          {/* Pregos decorativos nos 8 vértices da mesa octogonal */}
          {TABLE_NAILS.map((pos, idx) => (
            <div
              key={idx}
              className={`pointer-events-none absolute ${pos} -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-700 to-stone-950 shadow-[0_2px_4px_rgba(0,0,0,0.9)]`}
            />
          ))}

          {/* Setas 3D e Fios de Pacto de Sangue sobre o feltro */}
          <TargetArrowsSVG players={players} localIndex={localIndex} />

          {/* SILHUETAS 3D DOS OPONENTES E ASSENTO DO JOGADOR LOCAL */}
          {players.map((p, i) => {
            const isMe = p.id === me?.id;
            const { x, y, angle } = seatPosition(i, localIndex, players.length);
            const slotX = 50 + 20 * Math.cos(angle);
            const slotY = 50 + 19 * Math.sin(angle);
            const targetable = isTargetable(p);
            const dimmed = canAct && !!selectedCard && !targetable;

            if (isMe) {
              // O jogador local está em 1ª pessoa: mostra sua placa de vida na borda inferior da mesa
              return (
                <PlayerSeat
                  key={p.id}
                  player={p}
                  index={i}
                  localIndex={localIndex}
                  totalPlayers={players.length}
                  isMe={true}
                  phase={phase}
                  targetable={targetable}
                  dimmed={dimmed}
                  onSeatClick={onSeatClick}
                  onDropCard={onDropCard}
                />
              );
            }

            // Oponentes ao redor da mesa: Silhueta humana 3D erguida verticalmente na borda da mesa!
            const silX = 50 + 43 * Math.cos(angle);
            const silY = 50 + 41 * Math.sin(angle);

            return (
              <React.Fragment key={p.id}>
                <div
                  className="absolute z-30"
                  style={{
                    left: `${silX}%`,
                    top: `${silY}%`,
                    transformStyle: 'preserve-3d',
                    transform: `translate(-50%, -82%) translateZ(26px) rotateX(${-tablePitch}deg)`,
                  }}
                >
                  <PlayerSilhouette3D
                    player={p}
                    index={i}
                    isMe={false}
                    targetable={targetable}
                    dimmed={dimmed}
                    onSeatClick={onSeatClick}
                    onDropCard={onDropCard}
                    allPlayers={players}
                  />
                </div>

                {/* Slot da carta jogada pelo oponente sobre o feltro da mesa */}
                <CardSlot
                  player={p}
                  phase={phase}
                  slotStyle={{
                    left: `${slotX}%`,
                    top: `${slotY}%`,
                    transform: 'translate(-50%, -50%) translateZ(12px)',
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* Centro da mesa 3D: Relógio + Controles de Análise */}
          <div
            className="absolute left-1/2 top-1/2 z-30 flex flex-col items-center gap-1 sm:gap-1.5"
            style={{
              transform: 'translate(-50%, -50%) translateZ(18px)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="rounded-full p-1.5 bg-black/55 shadow-[0_10px_35px_rgba(0,0,0,0.95)] border border-gold-aged/30">
              <CentralClock
                socket={socket}
                myAllowedTime={me?.allowedTime}
                phase={phase}
                locked={!!me?.lockedIn || !me?.isAlive}
              />
            </div>

            {phase === 'ANALYSIS' && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col gap-1 sm:gap-1.5 mt-0.5"
              >
                <button
                  id="btn-pause"
                  onClick={onTogglePause}
                  className="artifact-btn flex items-center justify-center gap-1 px-2.5 py-1 rounded border border-gold-aged bg-black/90 text-gold-aged text-[10px] font-mono font-bold hover:bg-gold-aged/20 active:scale-95 transition-all"
                >
                  <Pause size={11} /> {gameState.isPaused ? '▶️ CONTINUAR' : '⏸️ PAUSAR'}
                </button>
                <button
                  id="btn-skip"
                  onClick={onSkipAnalysis}
                  className="artifact-btn flex items-center justify-center gap-1 px-2.5 py-1 rounded border border-blood-bright bg-black/90 text-blood-bright text-[10px] font-mono font-bold hover:bg-blood/30 active:scale-95 transition-all"
                >
                  <SkipForward size={11} /> ⏭️ PRÓXIMO
                </button>
              </motion.div>
            )}
          </div>

          {/* Aviso de parede */}
          {walled && canAct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ transform: 'translate(-50%, 0) translateZ(24px)' }}
              className="absolute left-1/2 bottom-[2.5%] z-50 px-3 py-1 rounded border-2 border-cyan-400 bg-black/95 text-cyan-200 text-[10px] sm:text-[11px] font-mono font-bold text-center max-w-[85%] shadow-[0_0_25px_rgba(34,211,238,0.4)]"
            >
              🧱 EMPAREDADO: USE CARTAS EM SI MESMO, PACTO DE SANGUE OU PASSE/DESCARTE
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* 5. MÃO DE CARTAS 3D EM PRIMEIRA PESSOA (Sobe quando o mouse olha para as cartas) */}
      <motion.footer
        animate={{
          y:
            cameraZone === CAMERA_ZONES.NOTEBOOK
              ? 220
              : cameraZone === CAMERA_ZONES.PLAYERS
                ? 42
                : 0,
          scale:
            cameraZone === CAMERA_ZONES.PLAYERS
              ? 0.91
              : cameraZone === CAMERA_ZONES.CARDS
                ? 1.03
                : 0.85,
          opacity: cameraZone === CAMERA_ZONES.NOTEBOOK ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 170, damping: 22 }}
        className={cn(
          'relative z-[45] h-[165px] sm:h-[205px] flex items-end justify-center pb-5 sm:pb-6 px-2 shrink-0',
          cameraZone === CAMERA_ZONES.NOTEBOOK && 'pointer-events-none'
        )}
      >
        {me && me.isAlive ? (
          <div className="relative flex items-end justify-center max-w-full pb-1">
            <AnimatePresence>
              {me.hand.map((card, i) => {
                const total = me.hand.length;
                const mid = (total - 1) / 2;
                const offset = i - mid;
                const isSel = selectedCardIds.includes(card.id);
                const fanRotate = offset * (compact ? 5.5 : 7.5);
                const fanY = Math.abs(offset) * (compact ? 6 : 10);

                return (
                  <motion.div
                    key={card.id}
                    initial={{ y: 180, opacity: 0, rotate: -16, scale: 0.75 }}
                    animate={{
                      y: isSel ? -28 : fanY,
                      rotate: isSel ? 0 : fanRotate,
                      scale: isSel ? 1.12 : 1,
                      opacity: 1,
                      zIndex: isSel ? 50 : 10 + i,
                    }}
                    whileHover={
                      canAct
                        ? {
                            y: -32,
                            rotate: 0,
                            scale: 1.14,
                            zIndex: 60,
                            transition: { type: 'spring', stiffness: 320, damping: 20 },
                          }
                        : undefined
                    }
                    exit={{ y: -80, opacity: 0, scale: 0.65 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                    className={cn(
                      'transition-shadow duration-200 card-fan-item',
                      i > 0 && (compact ? '-ml-2.5' : '-ml-3.5'),
                      isSel && 'drop-shadow-[0_0_25px_rgba(212,175,55,0.75)]'
                    )}
                    style={{ transformOrigin: 'bottom center' }}
                  >
                    <InscryptionCard
                      card={card}
                      isSelected={isSel}
                      onClick={onCardClick}
                      onDragStart={onCardDragStart}
                      onDragEnd={() => (dragCardRef.current = null)}
                      disabled={!canAct}
                      compact={compact}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 pb-4 sm:pb-6 text-center px-3 z-40 max-w-md mx-auto">
            <div className="flex items-center gap-2 font-grimoire text-purple-300 tracking-widest text-xs sm:text-sm drop-shadow-md">
              <Ghost size={16} className="text-purple-400 animate-pulse shrink-0" />
              <span>
                {me ? 'VOCÊ FOI ELIMINADO — MODO ESPECTADOR 3D' : 'MODO ESPECTADOR 3D'}
              </span>
              <Ghost size={16} className="text-purple-400 animate-pulse shrink-0" />
            </div>
            <p className="text-[11px] font-mono text-stone-400 leading-tight">
              Passe o mouse para cima para olhar as silhuetas ou para baixo para rabiscar no Caderno do Além!
            </p>
          </div>
        )}
      </motion.footer>

      {/* 6. PAINEL DE AÇÕES RÁPIDAS DO JOGADOR (Mirar em Mim / Fortalecer Faca / Descartar / Passar) */}
      {me && me.isAlive && cameraZone !== CAMERA_ZONES.NOTEBOOK && (
        <div className="absolute right-2 bottom-[172px] sm:bottom-8 sm:right-4 z-[50] flex flex-col gap-1.5 w-[156px] sm:w-[215px]">
          <AnimatePresence>
            {canSelfTarget && (
              <motion.button
                key="self-target"
                initial={{ x: 25, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 25, opacity: 0 }}
                id="btn-self-target"
                onClick={() => {
                  sendAction(selectedCard.id, me.id);
                  setSelectedCardIds([]);
                }}
                className={cn(
                  'artifact-btn flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 rounded border-2 font-grimoire font-bold text-[10px] sm:text-xs shadow-md active:scale-95 transition-all',
                  selectedCard.type === CARD_TYPES.MANIPULAMENTO_ALMA
                    ? 'border-teal-400 bg-teal-950/90 text-teal-200 hover:bg-teal-900 shadow-[0_0_18px_rgba(45,212,191,0.35)]'
                    : 'border-gold-aged bg-black/90 text-gold-aged hover:bg-gold-aged/20'
                )}
              >
                {selectedCard.type === CARD_TYPES.MANIPULAMENTO_ALMA ? (
                  <>
                    <Flame size={13} className="text-teal-300" /> +1 DANO NA MINHA FACA
                  </>
                ) : (
                  <>
                    <Crosshair size={13} /> USAR EM MIM MESMO
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {canAct &&
            (discardLimit > 0 ? (
              selectedCardIds.length > 0 ? (
                <button
                  id="btn-discard"
                  onClick={handleDiscard}
                  className="artifact-btn flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 rounded border-2 border-amber-500 bg-amber-950/90 text-amber-200 font-grimoire font-bold text-[10px] sm:text-xs hover:bg-amber-900 shadow-[0_0_18px_rgba(245,158,11,0.3)] active:scale-95 transition-all"
                >
                  <Trash2 size={13} className="text-amber-400" /> DESCARTAR ({selectedCardIds.length})
                </button>
              ) : (
                <button
                  id="btn-pass"
                  onClick={handlePassTurn}
                  className="artifact-btn flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 rounded border-2 border-iron bg-black/90 text-parchment-dark font-grimoire font-bold text-[10px] sm:text-xs hover:border-gold-aged hover:text-amber-200 shadow-md active:scale-95 transition-all"
                >
                  <Hand size={13} /> PASSAR A VEZ
                </button>
              )
            ) : (
              <button
                id="btn-pass"
                onClick={handlePassTurn}
                className="artifact-btn flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 rounded border-2 border-iron bg-black/90 text-parchment-dark font-grimoire font-bold text-[10px] sm:text-xs hover:border-gold-aged hover:text-amber-200 shadow-md active:scale-95 transition-all"
              >
                <Hand size={13} /> PASSAR A VEZ
              </button>
            ))}

          <div className="px-2 py-1 rounded bg-black/80 border border-stone-800/90 text-[9px] sm:text-[10px] font-mono text-parchment-dark text-center leading-tight shadow-inner">
            {canAct
              ? selectedCard
                ? CARD_META[selectedCard.type]?.requiresOtherPlayer
                  ? 'Olhe p/ cima e clique na silhueta de outro jogador'
                  : 'Clique numa silhueta ou use em si mesmo'
                : selectedCardIds.length > 0
                  ? `${selectedCardIds.length} selecionada(s) p/ descarte`
                  : 'Selecione uma carta para agir'
              : phase === 'PLANNING'
                ? '🔔 Jogada travada. Aguardando...'
                : '👁️ Observando o ritual...'}
          </div>
        </div>
      )}

      {/* 7. GATILHO INFERIOR DE SENSOR 3D PARA ABRIR O CADERNO SOB A MESA */}
      {cameraZone !== CAMERA_ZONES.NOTEBOOK && (
        <div
          onMouseEnter={() => {
            if (!cameraLocked) selectZone(CAMERA_ZONES.NOTEBOOK);
          }}
          className="fixed inset-x-0 bottom-0 z-[55] h-7 flex items-center justify-center bg-gradient-to-t from-black via-[#1a0f08]/95 to-transparent border-t border-gold-aged/30"
        >
          <button
            id="btn-scroll-under-table"
            type="button"
            onClick={() => {
              audio.play('select');
              selectZone(CAMERA_ZONES.NOTEBOOK);
            }}
            className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-amber-300 hover:text-white px-4 py-0.5 rounded-full transition-all"
          >
            <ChevronDown size={13} className="animate-bounce text-gold-aged" />
            <span className="font-bold tracking-wider">
              📓 PASSE O MOUSE AQUI EMBAIXO PARA OLHAR O CADERNO DE ANOTAÇÕES & CHAT ({logs.length})
            </span>
            <ChevronDown size={13} className="animate-bounce text-gold-aged" />
          </button>
        </div>
      )}

      {/* 8. GAVETA 3D DO CADERNO DE ANOTAÇÕES E CHAT SOB A MESA (Quando olha para baixo) */}
      <AnimatePresence>
        {cameraZone === CAMERA_ZONES.NOTEBOOK && (
          <motion.div
            key="notebook-3d-overlay"
            initial={{ y: '100%', rotateX: 25, opacity: 0 }}
            animate={{ y: 0, rotateX: 0, opacity: 1 }}
            exit={{ y: '100%', rotateX: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            className="fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center justify-end bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-6 pb-2 px-2 max-h-[88dvh] overflow-y-auto"
          >
            {/* Faixa superior para voltar o olhar para as cartas apenas subindo o mouse */}
            <div
              onMouseEnter={() => {
                if (!cameraLocked) selectZone(CAMERA_ZONES.CARDS);
              }}
              onClick={() => selectZone(CAMERA_ZONES.CARDS)}
              className="w-full max-w-2xl mb-1.5 py-1 rounded-full bg-black/80 border border-gold-aged/50 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-mono text-amber-200 cursor-pointer hover:bg-gold-aged/20 transition-all"
            >
              <ChevronUp size={14} className="animate-bounce text-gold-aged" />
              <span>SUBA O MOUSE OU CLIQUE AQUI PARA VOLTAR O OLHAR ÀS CARTAS E À MESA</span>
              <ChevronUp size={14} className="animate-bounce text-gold-aged" />
            </div>

            <UnderTableChat
              logs={logs}
              onSendChat={handleSendChat}
              isDead={isDead}
              canAct={canAct}
              phase={phase}
              onScrollToTable={() => selectZone(CAMERA_ZONES.CARDS)}
              onFocusChange={setTypingChat}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

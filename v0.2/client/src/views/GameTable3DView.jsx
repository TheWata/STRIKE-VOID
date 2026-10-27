import React from 'react';
import { createPortal } from 'react-dom';
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
  Flame,
} from 'lucide-react';
import { cn } from '../lib/cn';
import {
  CAMERA_ZONES,
  RESOLUTION_STEPS,
  VISUAL_EFFECT_BADGES,
} from '../models/gameModel';
import { CARD_TYPES, CARD_META, CARD_CATEGORIES } from '../models/cardModel';
import { seatPosition, TABLE_NAILS } from '../helpers/math3d';
import { useCamera3DController } from '../controllers/useCamera3DController';
import InscryptionCard from '../components/InscryptionCard';
import PlayerSeat, { CardSlot } from '../components/PlayerSeat';
import PlayerSilhouette3D from '../components/PlayerSilhouette3D';
import TargetArrowsSVG from '../components/TargetArrowsSVG';
import CentralClock from '../components/CentralClock';
import UnderTableChat from '../components/UnderTableChat';
import GameIcon from '../components/GameIcon';
import {
  BACKGROUND_ASSETS,
  UI_ASSETS,
  preloadCriticalTableAssets,
} from '../models/assetCatalog';
import { audio } from '../lib/audio';

const ACTION_BTN =
  'flex items-center justify-center gap-2 py-3 px-5 rounded-lg border-2 font-grimoire font-extrabold text-sm sm:text-base tracking-wider uppercase whitespace-nowrap shadow-[0_0_22px_rgba(212,175,55,0.5),0_8px_24px_rgba(0,0,0,0.95)] active:scale-95 transition-all cursor-pointer min-h-[48px] sm:min-h-[52px]';

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
    selectZone,
    parallax,
    handleMouseMove,
    handleBottomEdgeEnter,
    handleBottomEdgeLeave,
    setOverHandOrControls,
    setTypingChat,
  } = useCamera3DController({ inGame: true });

  React.useEffect(() => {
    preloadCriticalTableAssets();
  }, []);

  const isResolving = phase.startsWith('REVEAL_');
  const activeStep = RESOLUTION_STEPS.find((s) => s.key === phase) || null;
  const activeEffects = players.filter(
    (p) => p.visualEffect && VISUAL_EFFECT_BADGES[p.visualEffect]
  );

  // Inclinação 3D suave e orgânica da mesa, posicionada para que todos os oponentes do topo fiquem 100% visíveis
  const tablePitch =
    cameraZone === CAMERA_ZONES.PLAYERS
      ? 25
      : cameraZone === CAMERA_ZONES.NOTEBOOK
        ? 52
        : 30;

  // Mesa ~1cm (≈38px) mais alta que antes para dar espaço à mão ampliada
  const tableTranslateY =
    cameraZone === CAMERA_ZONES.PLAYERS
      ? compact
        ? 26
        : 54
      : cameraZone === CAMERA_ZONES.NOTEBOOK
        ? -210
        : compact
          ? 14
          : 40;

  const tableScale =
    cameraZone === CAMERA_ZONES.NOTEBOOK
      ? 0.84
      : compact
        ? 0.88
        : 0.92;

  const [hoveredCard, setHoveredCard] = React.useState(null);

  // Dock de ações: mede a mão em tela para ancorar botões e descrição colados ao deck
  const handRef = React.useRef(null);
  const [dock, setDock] = React.useState({
    side: false,
    left: 0,
    right: 0,
    bottom: 40,
    top: 262,
    leftRoom: 0,
  });
  React.useLayoutEffect(() => {
    const measure = () => {
      const el = handRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rightRoom = vw - r.right;
      const leftRoom = r.left;
      const next = {
        side: rightRoom >= 250 && leftRoom >= 290,
        left: Math.round(r.right + 20),
        right: Math.round(vw - r.left + 20),
        bottom: Math.round(vh - r.bottom + 6),
        top: Math.round(vh - r.top),
        leftRoom: Math.round(leftRoom),
      };
      setDock((prev) =>
        Object.keys(next).every((k) => prev[k] === next[k]) ? prev : next
      );
    };
    measure();
    const t = setTimeout(measure, 450);
    window.addEventListener('resize', measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && handRef.current) ro.observe(handRef.current);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      ro && ro.disconnect();
    };
  }, [cameraZone, compact, me?.hand?.length, me?.isAlive]);

  const infoCard = selectedCard || hoveredCard;
  const infoMeta = infoCard ? CARD_META[infoCard.type] : null;
  const infoCategory = infoMeta ? CARD_CATEGORIES[infoMeta.category] : null;

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
      {/* 1. AMBIÊNCIA PROFUNDA DA SALA CERIMONIAL (Asset de fundo atmosférico + luz de vela) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-transform duration-700 ease-out"
        style={{
          transform: `translate3d(${-parallax.x * 2.5}px, ${
            cameraZone === CAMERA_ZONES.PLAYERS
              ? 18
              : cameraZone === CAMERA_ZONES.NOTEBOOK
                ? -45
                : 0
          }px, 0)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-45 bg-cover bg-center"
          style={{
            backgroundImage: `url(${BACKGROUND_ASSETS.ROOM_CANDLELIGHT})`,
            maskImage: 'radial-gradient(ellipse at 50% 35%, black 35%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 35%, black 35%, transparent 90%)',
          }}
        />
        <div className="candle absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,165,60,0.16),rgba(139,0,0,0.07)_46%,transparent_76%)]" />
      </div>

      {/* 2. SUSSURRO CONTEXTUAL INTEGRADO AO CENÁRIO (Sem sobrepor os oponentes do topo) */}
      <div
        className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center justify-center px-4 gap-1"
        style={{ bottom: dock.side ? dock.top + 62 : dock.top + (canAct ? 130 : 66) }}
      >
        <AnimatePresence mode="wait">
          {isResolving && activeStep ? (
            <motion.div
              key={activeStep.key}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-col items-center text-center"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.98), 0 0 24px rgba(0,0,0,0.9)' }}
            >
              <span className="font-grimoire font-extrabold text-xs sm:text-sm tracking-[0.25em] text-amber-200/95 uppercase">
                {activeStep.label}
              </span>
              <span className="font-typewriter text-[10.5px] sm:text-xs text-parchment/75 max-w-md">
                {activeStep.subtitle}
              </span>
            </motion.div>
          ) : canAct && selectedCard ? (
            <motion.div
              key="aim-whisper"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 text-red-200/95 font-grimoire text-xs sm:text-sm tracking-[0.18em] uppercase"
              style={{
                textShadow: '0 0 16px rgba(220,38,38,0.85), 0 2px 8px rgba(0,0,0,0.98)',
              }}
            >
              <Crosshair size={13} className="text-red-400 animate-pulse shrink-0" />
              <span>
                {CARD_META[selectedCard.type]?.name} — Escolha uma presença na mesa
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Efeitos da rodada integrados como inscrições sutis no ar */}
        <AnimatePresence>
          {activeEffects.length > 0 && (
            <motion.div
              key="active-fx-whispers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center justify-center gap-3 max-w-[92vw]"
            >
              {activeEffects.map((p) => {
                const badge = VISUAL_EFFECT_BADGES[p.visualEffect];
                return (
                  <span
                    key={`${p.id}-${p.visualEffect}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-grimoire font-bold tracking-wider text-amber-100/95"
                    style={{
                      textShadow: '0 2px 8px rgba(0,0,0,0.98), 0 0 14px rgba(220,38,38,0.65)',
                    }}
                  >
                    <span>{p.name} ·</span>
                    {badge.icon && <GameIcon name={badge.icon} size={13} />}
                    <span>{badge.label}</span>
                  </span>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. PALCO 3D CENTRAL (MESA OCTOGONAL + PRESENÇAS SOMBRIAS GRANDES + BARRAS DE VIDA SEMPRE VISÍVEIS) */}
      <main className="relative flex-1 min-h-0 flex items-center justify-center p-1 sm:p-2 inscryption-perspective overflow-visible">
        <motion.div
          animate={{
            rotateX: tablePitch - parallax.y * 0.45,
            rotateZ: -parallax.x * 0.35,
            y: tableTranslateY,
            scale: tableScale,
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 24, mass: 0.95 }}
          style={{
            width: compact
              ? 'min(92vw, calc(100dvh - 250px))'
              : 'min(80vw, calc(100dvh - 270px))',
            maxHeight: compact ? 'calc(100dvh - 250px)' : 'calc(100dvh - 270px)',
            aspectRatio: '1 / 1',
            transformStyle: 'preserve-3d',
          }}
          className="relative"
        >
          {/* Sombra projetada no chão da sala 3D */}
          <div
            className="table-octagon absolute inset-0 bg-black/95 blur-2xl pointer-events-none"
            style={{ transform: 'translateZ(-42px) scale(1.08)' }}
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

          {/* CAMADA 0: SILHUETAS DOS OPONENTES SENTADOS ATRÁS DA MESA (Z negativo: o tampo de madeira da mesa oclui o corpo) */}
          {players.map((p, i) => {
            if (p.id === me?.id) return null;
            const { angle } = seatPosition(i, localIndex, players.length);
            const sinA = Math.sin(angle);
            const cosA = Math.cos(angle);
            // Raio polar ao redor do perímetro externo do octógono da mesa
            // Raios ampliados horizontalmente para espaçar melhor as presenças ao redor da mesa
            const radX = sinA < -0.3 ? 53 : 56;
            const radY = sinA < -0.3 ? 47 : 44;
            const silX = 50 + radX * cosA;
            const silY = 50 + radY * sinA;
            // Ancoragem precisa: cabeça, olhos e barra de vida erguem-se acima da mesa,
            // enquanto o tronco/manto fica atrás da borda de madeira da mesa
            const anchorY = sinA < -0.7 ? -70 : sinA < -0.3 ? -72 : -74;
            const targetable = isTargetable(p);
            const dimmed = canAct && !!selectedCard && !targetable;

            return (
              <div
                key={`silhouette-${p.id}`}
                className="absolute z-10"
                style={{
                  left: `${silX}%`,
                  top: `${silY}%`,
                  transformStyle: 'preserve-3d',
                  transformOrigin: '50% 85%',
                  transform: `translate(-50%, ${anchorY}%) translateZ(-24px) rotateX(${-tablePitch * 0.7}deg)`,
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
            );
          })}

          {/* Camada 1: Tampo de madeira escura entalhada (Z = 0) */}
          <div
            className="table-octagon table-wood absolute inset-0 z-20 shadow-[0_0_80px_rgba(0,0,0,0.95)] pointer-events-none"
            style={{ transform: 'translateZ(0px)' }}
          />
          {/* Camada 2: Aro chanfrado de ouro velho/ferro (Z = 1px) */}
          <div
            className="table-octagon table-rim absolute inset-[3.1%] z-20 pointer-events-none"
            style={{ transform: 'translateZ(1px)' }}
          />
          {/* Camada 3: Feltro ritualístico com anéis arcanos (Z = 2px) */}
          <div
            className="table-octagon table-felt absolute inset-[4.1%] z-20 pointer-events-none"
            style={{ transform: 'translateZ(2px)' }}
          />
          <div
            className="rounded-full table-ritual-ring absolute inset-[19%] z-20 pointer-events-none flex items-center justify-center"
            style={{ transform: 'translateZ(3px)' }}
          >
            <img
              src={UI_ASSETS.TABLE_RITUAL_MANDALA}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="pointer-events-none select-none w-full h-full object-contain opacity-65"
            />
          </div>

          {/* Pregos decorativos nos 8 vértices da mesa octogonal */}
          {TABLE_NAILS.map((pos, idx) => (
            <div
              key={idx}
              style={{ transform: 'translate(-50%, -50%) translateZ(4px)' }}
              className={`pointer-events-none absolute ${pos} z-20 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-700 to-stone-950 shadow-[0_2px_4px_rgba(0,0,0,0.9)]`}
            />
          ))}

          {/* Setas 3D e Fios de Pacto de Sangue sobre o feltro (Z = 6px) */}
          <div
            className="pointer-events-none absolute inset-0 z-[22]"
            style={{ transform: 'translateZ(6px)' }}
          >
            <TargetArrowsSVG players={players} localIndex={localIndex} />
          </div>

          {/* SLOTS DE CARTAS NA MESA E ASSENTO DO JOGADOR LOCAL */}
          {players.map((p, i) => {
            const isMe = p.id === me?.id;
            const { angle } = seatPosition(i, localIndex, players.length);
            const slotX = 50 + 22 * Math.cos(angle);
            const slotY = 50 + 20 * Math.sin(angle);
            const targetable = isTargetable(p);
            const dimmed = canAct && !!selectedCard && !targetable;

            if (isMe) {
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
                  allPlayers={players}
                />
              );
            }

            return (
              <CardSlot
                key={`slot-${p.id}`}
                player={p}
                phase={phase}
                slotStyle={{
                  left: `${slotX}%`,
                  top: `${slotY}%`,
                  transform: 'translate(-50%, -50%) translateZ(16px)',
                }}
              />
            );
          })}

          {/* Centro da mesa 3D: Relógio + Controles discretos de Análise */}
          <div
            className="absolute left-1/2 top-1/2 z-30 flex flex-col items-center gap-1.5"
            style={{
              transform: 'translate(-50%, -50%) translateZ(22px)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="rounded-full p-1 bg-black/45 shadow-[0_10px_35px_rgba(0,0,0,0.95)]">
              <CentralClock
                socket={socket}
                myAllowedTime={me?.allowedTime}
                phase={phase}
                locked={!!me?.lockedIn || !me?.isAlive}
              />
            </div>

            {phase === 'ANALYSIS' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 mt-1"
              >
                <button
                  id="btn-pause"
                  onClick={onTogglePause}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 border border-gold-aged/40 text-amber-200/90 text-[10px] font-mono hover:border-gold-aged hover:text-white active:scale-95 transition-all"
                >
                  <Pause size={10} /> {gameState.isPaused ? 'Continuar' : 'Pausar'}
                </button>
                <button
                  id="btn-skip"
                  onClick={onSkipAnalysis}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 border border-red-500/40 text-red-200/90 text-[10px] font-mono hover:border-red-400 hover:text-white active:scale-95 transition-all"
                >
                  <SkipForward size={10} /> Próximo
                </button>
              </motion.div>
            )}
          </div>

          {/* Sussurro de parede sutil */}
          {walled && canAct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.95, 0.55, 0.95] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{
                transform: 'translate(-50%, 0) translateZ(36px)',
                textShadow: '0 2px 10px rgba(0,0,0,0.98)',
              }}
              className="pointer-events-none absolute left-1/2 bottom-[7%] z-50 inline-flex items-center gap-1.5 text-sky-300/95 text-[10.5px] sm:text-xs font-grimoire font-bold tracking-widest uppercase text-center whitespace-nowrap"
            >
              <GameIcon name="iron-lock" size={13} />
              <span>Emparedado · Aja em si mesmo, use Pacto de Sangue ou Passe a vez</span>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* 4. MÃO DE CARTAS EM PRIMEIRA PESSOA (100% estável durante a inspeção e uso das cartas; separada do gatilho do chat) */}
      <motion.footer
        data-hand-zone="true"
        onMouseEnter={() => setOverHandOrControls(true)}
        onMouseLeave={() => setOverHandOrControls(false)}
        animate={{
          y: cameraZone === CAMERA_ZONES.NOTEBOOK ? 240 : 0,
          opacity: cameraZone === CAMERA_ZONES.NOTEBOOK ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        className={cn(
          'relative z-[45] h-[214px] sm:h-[262px] flex items-end justify-center pb-7 sm:pb-8 px-2 shrink-0',
          cameraZone === CAMERA_ZONES.NOTEBOOK && 'pointer-events-none'
        )}
      >
        {me && me.isAlive ? (
          <div
            ref={handRef}
            data-hand-zone="true"
            className="relative flex items-end justify-center max-w-full pb-1"
          >
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
                    data-hand-zone="true"
                    onMouseEnter={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    initial={{ y: 160, opacity: 0, rotate: -14, scale: 0.8 }}
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
                            y: -30,
                            rotate: 0,
                            scale: 1.14,
                            zIndex: 60,
                            transition: { type: 'spring', stiffness: 320, damping: 22 },
                          }
                        : undefined
                    }
                    exit={{ y: -70, opacity: 0, scale: 0.7 }}
                    transition={{ type: 'spring', stiffness: 190, damping: 20 }}
                    className={cn(
                      'transition-shadow duration-200 card-fan-item',
                      i > 0 && (compact ? '-ml-3' : '-ml-4'),
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
          <div className="flex flex-col items-center justify-center gap-1.5 pb-5 text-center px-3 z-40 max-w-md mx-auto">
            <div
              className="flex items-center gap-2 font-grimoire text-purple-300/90 tracking-[0.2em] text-xs sm:text-sm uppercase"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
            >
              <Ghost size={15} className="text-purple-400/80 animate-pulse shrink-0" />
              <span>Espírito Espectador</span>
            </div>
          </div>
        )}
      </motion.footer>

      {/* DOCK DA MÃO (portal no body → fica ACIMA da vinheta/grão que escurecia os botões).
          Descrição da carta à esquerda do deck e botões de ação à direita; em telas estreitas
          ambos empilham logo acima da mão. */}
      {me &&
        me.isAlive &&
        cameraZone !== CAMERA_ZONES.NOTEBOOK &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <AnimatePresence>
              {infoMeta && (
                <motion.div
                  key="card-info-panel"
                  id="card-info-panel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  style={
                    dock.side
                      ? {
                          right: dock.right,
                          bottom: dock.bottom,
                          width: Math.min(340, dock.leftRoom - 36),
                        }
                      : {
                          left: '50%',
                          x: '-50%',
                          bottom: dock.top + 64 + (canAct ? 62 : 0),
                          width: 'min(440px, 94vw)',
                        }
                  }
                  className="pointer-events-none fixed z-[200] rounded-lg border-2 border-gold-aged/80 bg-[#0d0704] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.95)]"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-grimoire font-extrabold text-sm sm:text-base tracking-wider text-amber-100 uppercase">
                      {infoMeta.name}
                    </span>
                    {infoCategory && (
                      <span
                        className={cn(
                          'shrink-0 rounded border px-1.5 py-0.5 font-typewriter font-extrabold text-[10px] sm:text-xs uppercase',
                          infoCategory.badgeCls
                        )}
                      >
                        P{infoMeta.priority} · {infoMeta.categoryLabel}
                      </span>
                    )}
                  </div>
                  <p className="font-typewriter text-[12.5px] sm:text-sm leading-snug text-parchment">
                    {infoMeta.description.replace(/^Prioridade \d \([^)]*\):\s*/, '')}
                  </p>
                  <p className="mt-1.5 font-typewriter font-bold text-[11px] sm:text-xs uppercase tracking-wide text-gold-aged">
                    {infoMeta.foot}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CONTROLES DE AÇÃO DO TURNO (Usar em Mim / Descartar / Passar a Vez) */}
            {canAct && (
              <div
                id="turn-actions-cluster"
                data-hand-zone="true"
                onMouseEnter={() => setOverHandOrControls(true)}
                onMouseLeave={() => setOverHandOrControls(false)}
                style={
                  dock.side
                    ? { left: dock.left, bottom: dock.bottom }
                    : { left: '50%', transform: 'translateX(-50%)', bottom: dock.top + 64 }
                }
                className={cn(
                  'fixed z-[200] flex gap-2.5 pointer-events-auto',
                  dock.side
                    ? 'flex-col items-stretch w-[220px]'
                    : 'flex-row flex-wrap items-center justify-center w-[96vw] max-w-[640px]'
                )}
              >
                <AnimatePresence>
                  {canSelfTarget && (
                    <motion.button
                      key="self-target"
                      type="button"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      id="btn-self-target"
                      onClick={(e) => {
                        e.stopPropagation();
                        sendAction(selectedCard.id, me.id);
                        setSelectedCardIds([]);
                      }}
                      className={cn(
                        ACTION_BTN,
                        selectedCard.type === CARD_TYPES.MANIPULAMENTO_ALMA
                          ? 'border-teal-300 bg-teal-900 text-teal-50 hover:bg-teal-800'
                          : selectedCard.type === CARD_TYPES.PACTO_SANGUE
                            ? (me.bloodPactWith || []).length > 0
                              ? 'border-amber-300 bg-amber-900 text-amber-50 hover:bg-amber-800'
                              : 'border-rose-400 bg-rose-900 text-rose-50 hover:bg-rose-800'
                            : selectedCard.type === CARD_TYPES.SERINGA
                              ? 'border-emerald-300 bg-emerald-900 text-emerald-50 hover:bg-emerald-800'
                              : 'border-gold-aged bg-[#3a2212] text-amber-50 hover:bg-[#4d2e18]'
                      )}
                    >
                      {selectedCard.type === CARD_TYPES.MANIPULAMENTO_ALMA ? (
                        <>
                          <Flame size={16} className="text-teal-200" /> +1 Dano na Faca
                        </>
                      ) : selectedCard.type === CARD_TYPES.PACTO_SANGUE ? (
                        (me.bloodPactWith || []).length > 0 ? (
                          <>
                            <GameIcon name="broken-chain" size={16} /> Quebrar Meu Pacto
                          </>
                        ) : (
                          <>
                            <GameIcon name="blood-drop" size={16} /> Pacto em Mim (-1 Vida)
                          </>
                        )
                      ) : selectedCard.type === CARD_TYPES.SERINGA ? (
                        <>
                          <GameIcon name="syringe-vial" size={16} /> Usar em Mim (
                          {selectedCard.charges || 0}/4
                          {(selectedCard.charges || 0) > me.maxLives - me.lives
                            ? ' · Overdose'
                            : ''}
                          )
                        </>
                      ) : (
                        <>
                          <Crosshair size={16} className="text-amber-300" /> Usar em Mim
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>

                {discardLimit > 0 && selectedCardIds.length > 0 && (
                  <button
                    id="btn-discard"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDiscard();
                    }}
                    className={cn(
                      ACTION_BTN,
                      'border-amber-300 bg-amber-900 text-amber-50 hover:bg-amber-800'
                    )}
                  >
                    <Trash2 size={16} className="text-amber-300" /> Descartar (
                    {selectedCardIds.length})
                  </button>
                )}

                <button
                  id="btn-pass"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePassTurn();
                  }}
                  title="Passar a vez sem jogar carta"
                  className={cn(
                    ACTION_BTN,
                    discardLimit > 0 && selectedCardIds.length > 0
                      ? 'border-stone-300 bg-stone-900 text-parchment hover:border-gold-aged hover:text-white'
                      : 'border-gold-aged bg-[#3a2212] text-amber-50 hover:bg-[#4d2e18]'
                  )}
                >
                  <Hand size={16} className="text-gold-aged" /> Passar a Vez
                </button>
              </div>
            )}
          </>,
          document.body
        )}

      {/* 6. ZONA INTENCIONAL NO EXTREMO INFERIOR DA TELA PARA ACESSAR O CHAT & GRIMÓRIO */}
      {cameraZone !== CAMERA_ZONES.NOTEBOOK && (
        <div
          id="under-table-trigger"
          onMouseEnter={handleBottomEdgeEnter}
          onMouseLeave={handleBottomEdgeLeave}
          className="fixed inset-x-0 bottom-0 z-[55] h-[16px] flex items-center justify-center bg-gradient-to-t from-black/90 to-transparent"
        >
          <button
            id="btn-scroll-under-table"
            type="button"
            onClick={() => {
              audio.play('select');
              selectZone(CAMERA_ZONES.NOTEBOOK);
            }}
            className="flex items-center gap-1.5 text-[9.5px] font-mono tracking-widest uppercase text-parchment/45 hover:text-amber-200 px-3 py-0.5 transition-colors cursor-pointer"
          >
            <ChevronDown size={11} className="text-gold-aged/70" />
            <span>Grimório & Caderno ({logs.length})</span>
            <ChevronDown size={11} className="text-gold-aged/70" />
          </button>
        </div>
      )}

      {/* 7. GAVETA SOB A MESA: LIVRO DE CARTAS & CADERNO DE CHAT */}
      <AnimatePresence>
        {cameraZone === CAMERA_ZONES.NOTEBOOK && (
          <motion.div
            key="notebook-3d-overlay"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 190, damping: 25 }}
            className="fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center justify-end bg-gradient-to-t from-black/95 via-black/85 to-transparent pt-6 pb-2 px-2 max-h-[86dvh] overflow-y-auto"
          >
            <button
              id="btn-return-to-table"
              type="button"
              onClick={() => selectZone(CAMERA_ZONES.CARDS)}
              className="mb-2 px-4 py-1 rounded-full bg-black/75 border border-gold-aged/40 flex items-center justify-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-amber-200/85 hover:text-white hover:border-gold-aged cursor-pointer transition-all"
            >
              <ChevronUp size={13} className="text-gold-aged" />
              <span>Voltar à Mesa</span>
            </button>

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

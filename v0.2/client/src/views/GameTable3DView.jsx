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
  ZoomIn,
  Lock,
  XCircle,
} from 'lucide-react';
import { cn } from '../lib/cn';
import {
  CAMERA_ZONES,
  RESOLUTION_STEPS,
  VISUAL_EFFECT_BADGES,
} from '../models/gameModel';
import { CARD_META } from '../models/cardModel';
import { seatPosition, TABLE_NAILS } from '../helpers/math3d';
import { useCamera3DController } from '../controllers/useCamera3DController';
import InscryptionCard from '../components/InscryptionCard';
import CardInspectModal from '../components/CardInspectModal';
import DynamicPlayerPortrait from '../components/DynamicPlayerPortrait';
import { CardSlot } from '../components/PlayerSeat';
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

const HERO_WING_BTN_BASE =
  'relative flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 font-grimoire font-extrabold tracking-wider uppercase transition-all duration-300 select-none shadow-[0_10px_28px_rgba(0,0,0,0.92)]';

export default function GameTable3DView({
  socket,
  gameState,
  players,
  me,
  phase,
  localIndex,
  compact,
  hitKey,
  characterGender,
  setCharacterGender,
  setShowGuide,
  selectedCardIds,
  setSelectedCardIds,
  selectedCard,
  canAct,
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
  showToast,
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

  const [inspectedCard, setInspectedCard] = React.useState(null);
  const [hoveredCardId, setHoveredCardId] = React.useState(null);

  React.useEffect(() => {
    preloadCriticalTableAssets();
  }, []);

  // Permite cancelar a seleção de cartas pressionando ESC (retornando ao modo normal da HUD)
  React.useEffect(() => {
    if (!selectedCardIds || selectedCardIds.length === 0 || inspectedCard) {
      return undefined;
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedCardIds([]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCardIds, setSelectedCardIds, inspectedCard]);

  const isResolving = phase.startsWith('REVEAL_');
  const activeStep = RESOLUTION_STEPS.find((s) => s.key === phase) || null;
  const activeEffects = players.filter(
    (p) => p.visualEffect && VISUAL_EFFECT_BADGES[p.visualEffect]
  );

  // Modo adaptativo da HUD: compacta elementos ao redor do retrato quando há carta(s) selecionada(s)
  const isSelectionMode = Boolean(canAct && selectedCardIds.length > 0);

  // Verifica se a carta selecionada permite mirar em si mesmo (clicando no retrato central)
  const canSelfTarget = Boolean(
    canAct &&
      selectedCard &&
      selectedCardIds.length === 1 &&
      !CARD_META[selectedCard.type]?.requiresOtherPlayer
  );

  const selectedMeta = selectedCard ? CARD_META[selectedCard.type] : null;

  // Inclinação e escala 3D adaptativas: libera mais área útil para a mesa e inimigos durante a seleção
  const tablePitch =
    cameraZone === CAMERA_ZONES.PLAYERS
      ? 24
      : cameraZone === CAMERA_ZONES.NOTEBOOK
        ? 52
        : isSelectionMode
          ? 25
          : 28;

  const tableTranslateY =
    cameraZone === CAMERA_ZONES.PLAYERS
      ? compact
        ? 18
        : 32
      : cameraZone === CAMERA_ZONES.NOTEBOOK
        ? -210
        : isSelectionMode
          ? compact
            ? 14
            : 26
          : compact
            ? 8
            : 18;

  const tableScale =
    cameraZone === CAMERA_ZONES.NOTEBOOK
      ? 0.82
      : isSelectionMode
        ? compact
          ? 0.91
          : 0.95
        : compact
          ? 0.86
          : 0.9;

  const handleSelfTargetTrigger = () => {
    if (!canAct || !canSelfTarget || !selectedCard || !me) return;
    sendAction(selectedCard.id, me.id);
    setSelectedCardIds([]);
  };

  const handleDiscardTrigger = (e) => {
    e?.stopPropagation();
    if (!canAct) return;
    if (discardLimit <= 0) {
      showToast?.('O descarte de cartas está desativado nas configurações desta sala.');
      return;
    }
    if (selectedCardIds.length === 0) {
      showToast?.(
        `Selecione até ${discardLimit} carta(s) na sua mão acima e clique em Descartar!`
      );
      return;
    }
    handleDiscard();
  };

  const myAction = me?.selectedAction;
  const lockedPassStatus =
    !canAct && phase === 'PLANNING' && me?.lockedIn
      ? myAction?.cardType === 'NONE'
        ? 'Vez Passada'
        : myAction?.cardType === 'DISCARD'
          ? 'Descarte Travado'
          : 'Jogada Travada'
      : null;

  return (
    <div
      id="game-table-3d-viewport"
      data-hud-mode={isSelectionMode ? 'selection' : 'normal'}
      onMouseMove={handleMouseMove}
      className="flex-1 min-h-0 flex flex-col justify-between relative overflow-hidden select-none inscryption-3d-stage"
    >
      {/* 1. AMBIÊNCIA PROFUNDA DA SALA CERIMONIAL */}
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

      {/* 2. FAIXA CONTEXTUAL DE RESOLUÇÃO / MIRA NO TOPO DA MESA */}
      <div className="pointer-events-none relative z-40 pt-9 sm:pt-10 px-4 flex flex-col items-center justify-center gap-1 shrink-0">
        <AnimatePresence mode="wait">
          {isResolving && activeStep ? (
            <motion.div
              key={activeStep.key}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-col items-center text-center bg-black/70 border border-gold-aged/45 px-4 py-1.5 rounded-full shadow-lg"
            >
              <span className="font-grimoire font-extrabold text-xs sm:text-sm tracking-[0.22em] text-amber-200 uppercase">
                {activeStep.label}
              </span>
              <span className="font-typewriter text-xs sm:text-sm text-parchment max-w-lg">
                {activeStep.subtitle}
              </span>
            </motion.div>
          ) : canAct && selectedCard ? (
            <motion.div
              key="aim-whisper"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 bg-black/85 border border-red-500/65 px-3.5 py-1.5 rounded-full text-red-100 font-grimoire text-xs sm:text-sm tracking-[0.12em] uppercase shadow-[0_0_22px_rgba(220,38,38,0.45)]"
            >
              <Crosshair size={15} className="text-red-400 animate-pulse shrink-0" />
              <span>
                <strong>{selectedMeta?.name}</strong> — Clique em um oponente na mesa
                {canSelfTarget ? ' ou clique no seu Retrato Central' : ''}
              </span>
              <button
                type="button"
                onClick={() => setInspectedCard(selectedCard)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-900 border border-gold-aged/70 text-amber-200 hover:text-white font-mono text-[11px] cursor-pointer"
              >
                <ZoomIn size={12} />
                <span>Ampliar</span>
              </button>
              {setShowGuide && (
                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blood/80 border border-blood-bright text-white hover:bg-blood font-mono text-[11px] font-bold cursor-pointer"
                  title="Consultar manual das 9 cartas [G]"
                >
                  <span>Guia [G]</span>
                </button>
              )}
              <button
                id="btn-cancel-selection"
                type="button"
                onClick={() => setSelectedCardIds([])}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-900/90 border border-stone-600 text-stone-300 hover:text-white hover:border-red-400 font-mono text-[11px] cursor-pointer"
                title="Cancelar seleção de carta [ESC]"
              >
                <XCircle size={12} />
                <span>Cancelar</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Efeitos ativos da rodada */}
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/75 border border-amber-500/40 text-xs font-grimoire font-bold tracking-wider text-amber-100"
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

      {/* 3. PALCO 3D CENTRAL (MESA OCTOGONAL + PRESENÇAS SOMBRIAS DOS OPONENTES)
           No modo de seleção (`isSelectionMode`), a área útil da mesa se expande suavemente */}
      <main className="relative flex-1 min-h-0 flex items-center justify-center p-1 inscryption-perspective overflow-visible">
        <motion.div
          animate={{
            rotateX: tablePitch - parallax.y * 0.45,
            rotateZ: -parallax.x * 0.35,
            y: tableTranslateY,
            scale: tableScale,
          }}
          transition={{ type: 'spring', stiffness: 135, damping: 24, mass: 0.95 }}
          style={{
            width: isSelectionMode
              ? compact
                ? 'min(92vw, calc(100dvh - 265px))'
                : 'min(80vw, calc(100dvh - 285px))'
              : compact
                ? 'min(88vw, calc(100dvh - 330px))'
                : 'min(74vw, calc(100dvh - 360px))',
            maxHeight: isSelectionMode
              ? compact
                ? 'calc(100dvh - 265px)'
                : 'calc(100dvh - 285px)'
              : compact
                ? 'calc(100dvh - 330px)'
                : 'calc(100dvh - 360px)',
            aspectRatio: '1 / 1',
            transformStyle: 'preserve-3d',
            transition: 'width 0.35s ease, max-height 0.35s ease',
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

          {/* CAMADA 0: SILHUETAS DOS OPONENTES SENTADOS ATRÁS DA MESA */}
          {players.map((p, i) => {
            if (p.id === me?.id) return null;
            const { angle } = seatPosition(i, localIndex, players.length);
            const sinA = Math.sin(angle);
            const cosA = Math.cos(angle);
            const radX = sinA < -0.3 ? 53 : 56;
            const radY = sinA < -0.3 ? 47 : 44;
            const silX = 50 + radX * cosA;
            const silY = 50 + radY * sinA;
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
                  onInspectCard={setInspectedCard}
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

          {/* SLOTS DE CARTAS NA MESA PARA TODOS OS JOGADORES */}
          {players.map((p, i) => {
            const { angle } = seatPosition(i, localIndex, players.length);
            const slotX = 50 + 22 * Math.cos(angle);
            const slotY = 50 + 20 * Math.sin(angle);

            return (
              <CardSlot
                key={`slot-${p.id}`}
                player={p}
                phase={phase}
                onInspectCard={setInspectedCard}
                slotStyle={{
                  left: `${slotX}%`,
                  top: `${slotY}%`,
                  transform: 'translate(-50%, -50%) translateZ(16px)',
                }}
              />
            );
          })}

          {/* Centro da mesa 3D: Relógio + Controles de Análise */}
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
                  type="button"
                  onClick={onTogglePause}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/80 border border-gold-aged/60 text-amber-200 text-xs font-mono hover:border-gold-aged hover:text-white active:scale-95 transition-all cursor-pointer"
                >
                  <Pause size={12} /> {gameState.isPaused ? 'Continuar' : 'Pausar'}
                </button>
                <button
                  id="btn-skip"
                  type="button"
                  onClick={onSkipAnalysis}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/80 border border-red-500/60 text-red-200 text-xs font-mono hover:border-red-400 hover:text-white active:scale-95 transition-all cursor-pointer"
                >
                  <SkipForward size={12} /> Próximo
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      {/* 4. CONJUNTO INTEGRADO E ADAPTATIVO DA HUD INFERIOR:
           - CAMADA SUPERIOR: CARTAS EM ARCO ACIMA DO RETRATO E DOS CONTROLES
           - CAMADA INFERIOR: [DESCARTAR] — (RETRATO DINÂMICO CENTRAL) — [PASSAR A VEZ] */}
      <motion.footer
        id="combat-hud-footer"
        data-hand-zone="true"
        data-hud-mode={isSelectionMode ? 'selection' : 'normal'}
        onMouseEnter={() => setOverHandOrControls(true)}
        onMouseLeave={() => setOverHandOrControls(false)}
        animate={{
          y: cameraZone === CAMERA_ZONES.NOTEBOOK ? 320 : 0,
          opacity: cameraZone === CAMERA_ZONES.NOTEBOOK ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        className={cn(
          'relative z-[50] w-full flex flex-col items-center justify-end px-2 shrink-0 transition-all duration-300',
          isSelectionMode ? 'pb-2 sm:pb-2.5' : 'pb-4 sm:pb-5',
          cameraZone === CAMERA_ZONES.NOTEBOOK && 'pointer-events-none'
        )}
      >
        {/* 4A. CAMADA SUPERIOR: CARTAS NA MÃO POSICIONADAS EM ARCO ACIMA DO RETRATO E DOS BOTÕES
             No modo de seleção, as cartas não selecionadas se recolhem suavemente ao redor do retrato,
             liberando espaço vertical para a mesa sem comprimir o texto nem distorcer a proporção das cartas. */}
        {me && me.isAlive ? (
          <div
            id="player-hand-arc"
            data-hand-zone="true"
            className={cn(
              'relative z-30 flex items-end justify-center max-w-full px-2 transition-all duration-300',
              isSelectionMode ? '-mb-9 sm:-mb-11' : '-mb-4 sm:-mb-6'
            )}
          >
            <AnimatePresence>
              {me.hand.map((card, i) => {
                const total = me.hand.length;
                const mid = (total - 1) / 2;
                const offset = i - mid;
                const isSel = selectedCardIds.includes(card.id);
                const isHovered = hoveredCardId === card.id;

                const fanRotate = offset * (compact ? 8 : isSelectionMode ? 9 : 12);
                const baseFanY = Math.abs(offset) * (compact ? 9 : 14);
                // Em modo de seleção, cartas não selecionadas descem suavemente para liberar visão da mesa
                const targetY = isSel
                  ? isSelectionMode
                    ? -10
                    : -22
                  : isHovered
                    ? -14
                    : isSelectionMode
                      ? baseFanY + 24
                      : baseFanY;

                return (
                  <motion.div
                    key={card.id}
                    data-hand-zone="true"
                    onMouseEnter={() => setHoveredCardId(card.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    initial={{ y: 140, opacity: 0, rotate: -12, scale: 0.85 }}
                    animate={{
                      y: targetY,
                      rotate: isSel || isHovered ? 0 : fanRotate,
                      scale: isSel ? 1.04 : isHovered ? 1.02 : 1,
                      opacity: isSelectionMode && !isSel && !isHovered ? 0.86 : 1,
                      zIndex: isSel ? 65 : isHovered ? 60 : 20 + i,
                    }}
                    exit={{ y: -60, opacity: 0, scale: 0.75 }}
                    transition={{ type: 'spring', stiffness: 215, damping: 22 }}
                    className={cn(
                      'transition-all duration-250 card-fan-item',
                      i > 0 &&
                        (isSelectionMode
                          ? compact
                            ? '-ml-6'
                            : '-ml-5'
                          : compact
                            ? '-ml-5'
                            : '-ml-3.5'),
                      isSel && 'drop-shadow-[0_0_26px_rgba(212,175,55,0.85)]'
                    )}
                    style={{ transformOrigin: 'bottom center' }}
                  >
                    <InscryptionCard
                      card={card}
                      isSelected={isSel}
                      onClick={onCardClick}
                      onInspect={setInspectedCard}
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
          <div className="mb-2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/75 border border-purple-500/50 font-grimoire text-purple-200 tracking-[0.18em] text-xs sm:text-sm uppercase shadow-lg">
            <Ghost size={16} className="text-purple-300 animate-pulse shrink-0" />
            <span>Espírito Espectador · Acompanhe o destino da mesa</span>
          </div>
        )}

        {/* 4B. CAMADA INFERIOR: [DESCARTAR] — (RETRATO DINÂMICO CENTRAL) — [PASSAR A VEZ]
             O retrato central permanece com exatamente o mesmo tamanho em ambos os modos! */}
        {me && (
          <div
            id="turn-actions-cluster"
            data-hand-zone="true"
            className={cn(
              'relative z-40 w-full flex items-center justify-center px-1 sm:px-4 transition-all duration-300',
              isSelectionMode ? 'max-w-[780px]' : 'max-w-[900px]'
            )}
          >
            {/* ASA ESQUERDA: BOTÃO DESCARTAR */}
            <div
              className={cn(
                'flex-1 flex items-center justify-end -mr-4 sm:-mr-6 pr-6 sm:pr-9 pl-1.5 rounded-l-2xl bg-gradient-to-r from-[#1c1009]/95 via-[#28170d]/95 to-[#160c07]/95 border-y-2 border-l-2 border-gold-aged/65 shadow-[0_14px_38px_rgba(0,0,0,0.95)] transition-all duration-300',
                isSelectionMode ? 'py-1' : 'py-1.5'
              )}
            >
              <button
                id="btn-discard"
                type="button"
                disabled={!canAct || discardLimit <= 0}
                onClick={handleDiscardTrigger}
                title={
                  discardLimit <= 0
                    ? 'Descarte desativado nesta sala'
                    : 'Descartar cartas selecionadas da mão'
                }
                className={cn(
                  HERO_WING_BTN_BASE,
                  'w-full cursor-pointer px-3 sm:px-5',
                  isSelectionMode
                    ? 'py-1.5 sm:py-2 min-h-[48px] sm:min-h-[54px]'
                    : 'py-2.5 sm:py-3 min-h-[56px] sm:min-h-[64px]',
                  !canAct || discardLimit <= 0
                    ? 'border-stone-700/80 bg-stone-950/90 text-stone-400 cursor-default opacity-80'
                    : selectedCardIds.length > 0
                      ? 'border-amber-300 bg-gradient-to-b from-amber-800 to-amber-950 text-amber-50 hover:from-amber-700 hover:to-amber-900 shadow-[0_0_24px_rgba(245,158,11,0.55)] active:scale-[0.98]'
                      : 'border-stone-600/90 bg-gradient-to-b from-[#2b190f] to-[#170d07] text-amber-100/90 hover:border-amber-400/80 hover:text-amber-50 active:scale-[0.98]'
                )}
              >
                <div className="flex items-center gap-1.5 text-xs sm:text-base">
                  <Trash2
                    size={17}
                    className={
                      selectedCardIds.length > 0 && canAct
                        ? 'text-amber-300 shrink-0'
                        : 'text-stone-400 shrink-0'
                    }
                  />
                  <span>
                    DESCARTAR
                    {selectedCardIds.length > 0 ? ` (${selectedCardIds.length})` : ''}
                  </span>
                </div>
                <span className="font-mono text-[10px] sm:text-[11px] font-normal text-amber-200/85 normal-case tracking-normal">
                  {discardLimit <= 0
                    ? 'Descarte desativado'
                    : selectedCardIds.length > 0
                      ? `Confirmar troca de ${selectedCardIds.length} carta(s)`
                      : `Selecione até ${discardLimit} carta(s)`}
                </span>
              </button>
            </div>

            {/* CÍRCULO CENTRAL: RETRATO DINÂMICO DO JOGADOR & ALVO INTERATIVO DE AUTO-USO */}
            <DynamicPlayerPortrait
              me={me}
              players={players}
              phase={phase}
              selectedCard={selectedCard}
              socket={socket}
              hitKey={hitKey}
              canSelfTarget={canSelfTarget}
              characterGender={characterGender}
              onSelectGender={setCharacterGender}
              onSelfTargetClick={handleSelfTargetTrigger}
              onDropCardOnSelf={onDropCard}
            />

            {/* ASA DIREITA: BOTÃO PASSAR A VEZ */}
            <div
              className={cn(
                'flex-1 flex items-center justify-start -ml-4 sm:-ml-6 pl-6 sm:pl-9 pr-1.5 rounded-r-2xl bg-gradient-to-l from-[#1c1009]/95 via-[#28170d]/95 to-[#160c07]/95 border-y-2 border-r-2 border-gold-aged/65 shadow-[0_14px_38px_rgba(0,0,0,0.95)] transition-all duration-300',
                isSelectionMode ? 'py-1' : 'py-1.5'
              )}
            >
              <button
                id="btn-pass"
                type="button"
                disabled={!canAct}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canAct) handlePassTurn();
                }}
                title="Passar a vez sem jogar carta"
                className={cn(
                  HERO_WING_BTN_BASE,
                  'w-full cursor-pointer px-3 sm:px-5',
                  isSelectionMode
                    ? 'py-1.5 sm:py-2 min-h-[48px] sm:min-h-[54px]'
                    : 'py-2.5 sm:py-3 min-h-[56px] sm:min-h-[64px]',
                  !canAct
                    ? 'border-stone-700/80 bg-stone-950/90 text-stone-400 cursor-default opacity-80'
                    : 'border-gold-aged bg-gradient-to-b from-[#462614] to-[#241309] text-amber-50 hover:from-[#5c321a] hover:to-[#331b0d] hover:border-amber-300 shadow-[0_0_20px_rgba(212,175,55,0.35)] active:scale-[0.98]'
                )}
              >
                {lockedPassStatus ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-300">
                      <Lock size={15} className="text-gold-aged/80 shrink-0" />
                      <span>{lockedPassStatus}</span>
                    </div>
                    <span className="font-mono text-[10px] sm:text-[11px] font-normal text-stone-400 normal-case tracking-normal">
                      Aguardando demais jogadores
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-xs sm:text-base">
                      <Hand size={17} className="text-gold-aged shrink-0" />
                      <span>PASSAR A VEZ</span>
                    </div>
                    <span className="font-mono text-[10px] sm:text-[11px] font-normal text-parchment/85 normal-case tracking-normal">
                      Manter mão atual sem agir
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.footer>

      {/* 5. ZONA INTENCIONAL NO EXTREMO INFERIOR DA TELA PARA ACESSAR O CHAT & GRIMÓRIO */}
      {cameraZone !== CAMERA_ZONES.NOTEBOOK && (
        <div
          id="under-table-trigger"
          onMouseEnter={handleBottomEdgeEnter}
          onMouseLeave={handleBottomEdgeLeave}
          className="fixed inset-x-0 bottom-0 z-[55] h-[22px] flex items-center justify-center gap-3 bg-gradient-to-t from-black/95 to-transparent"
        >
          {setShowGuide && (
            <button
              id="btn-quick-guide-trigger"
              type="button"
              onClick={() => {
                audio.play('select');
                setShowGuide(true);
              }}
              className="flex items-center gap-1 text-[10.5px] font-mono font-bold tracking-wider uppercase text-red-300 hover:text-white px-2 py-0.5 rounded bg-blood/40 hover:bg-blood/70 border border-blood-bright/60 transition-colors cursor-pointer"
              title="Abrir Tabela de Consulta Rápida das Cartas [Tecla G]"
            >
              <span>📖 GUIA RÁPIDO [G]</span>
            </button>
          )}

          <button
            id="btn-scroll-under-table"
            type="button"
            onClick={() => {
              audio.play('select');
              selectZone(CAMERA_ZONES.NOTEBOOK);
            }}
            className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold tracking-widest uppercase text-parchment/70 hover:text-amber-200 px-3 py-0.5 transition-colors cursor-pointer"
          >
            <ChevronDown size={12} className="text-gold-aged" />
            <span>Grimório & Caderno ({logs.length})</span>
            <ChevronDown size={12} className="text-gold-aged" />
          </button>
        </div>
      )}

      {/* 6. GAVETA SOB A MESA: LIVRO DE CARTAS & CADERNO DE CHAT */}
      <AnimatePresence>
        {cameraZone === CAMERA_ZONES.NOTEBOOK && (
          <motion.div
            key="notebook-3d-overlay"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 190, damping: 25 }}
            className="fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center justify-end bg-gradient-to-t from-black/95 via-black/90 to-transparent pt-6 pb-2 px-2 max-h-[90dvh] overflow-y-auto"
          >
            <button
              id="btn-return-to-table"
              type="button"
              onClick={() => selectZone(CAMERA_ZONES.CARDS)}
              className="mb-2 px-5 py-1.5 rounded-full bg-black/85 border-2 border-gold-aged/65 flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-amber-200 hover:text-white hover:border-gold-aged cursor-pointer transition-all shadow-lg"
            >
              <ChevronUp size={15} className="text-gold-aged" />
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

      {/* 7. MODAL DE INSPEÇÃO AMPLIADA DE CARTA DURANTE A GAMEPLAY */}
      <CardInspectModal
        card={inspectedCard}
        onClose={() => setInspectedCard(null)}
        allowBrowseAll={false}
      />
    </div>
  );
}

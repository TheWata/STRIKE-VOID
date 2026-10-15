import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'framer-motion';
import {
  Settings,
  Skull as SkullIcon,
  Pause,
  SkipForward,
  Crosshair,
  Hand,
  Trophy,
  Copy,
  Check,
  LogOut,
  ScrollText,
  HelpCircle,
  BookOpen,
  Trash2,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { socket } from './lib/socket';
import { cn } from './lib/cn';
import { PHASE_LABELS, DEFAULT_MAX_HP } from './lib/constants';
import { useCompactLayout } from './lib/useMediaQuery';
import InscryptionCard from './components/InscryptionCard';
import PlayerSeat from './components/PlayerSeat';
import TargetArrowsSVG from './components/TargetArrowsSVG';
import SettingsModal from './components/SettingsModal';
import AudioControls from './components/AudioControls';
import CentralClock from './components/CentralClock';
import LogPanel, { LogDrawer } from './components/LogPanel';
import DamageOverlay from './components/DamageOverlay';
import HomeHub from './components/HomeHub';
import RoomLobby from './components/RoomLobby';
import GameGuideModal from './components/GameGuideModal';
import MobileHeaderMenu from './components/MobileHeaderMenu';
import UnderTableChat from './components/UnderTableChat';
import { audio } from './lib/audio';

/* Botão quadrado de ícone do cabeçalho (alvo de toque de 40px no mobile) */
const HEADER_ICON_BTN =
  'flex items-center justify-center gap-1.5 h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-md border text-[11px] font-mono font-medium transition-all shadow-sm active:scale-95';

/* ------------------------------------------------------------------ */
/* App Principal                                                       */
/* ------------------------------------------------------------------ */
export default function App() {
  const [gameState, setGameState] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [, setConnected] = useState(socket.connected);
  const [hitKey, setHitKey] = useState(0);
  const dragCardRef = useRef(null);
  const toastTimer = useRef(null);
  const prevHpRef = useRef(null);
  const tableContainerRef = useRef(null);

  const scrollToUnderTable = useCallback(() => {
    const el = document.getElementById('under-table-chat');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollToTableTop = useCallback(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const compact = useCompactLayout();
  const reduceMotion = useReducedMotion();
  const shakeControls = useAnimationControls();

  // Nickname persistido no localStorage
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('strike_void_nickname') || '';
  });

  useEffect(() => {
    if (nickname) {
      localStorage.setItem('strike_void_nickname', nickname);
    }
  }, [nickname]);

  const showToast = useCallback((msg, type = 'error') => {
    if (type === 'error') audio.play('error');
    setToast({ text: msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const onState = (s) => setGameState(s);
    const onRoomUpdated = ({ roomState }) => setGameState(roomState);
    const onRoomJoined = ({ roomState }) => {
      setGameState(roomState);
      showToast(`Bem-vindo à sala ${roomState.roomCode}!`, 'success');
    };
    const onPublicRooms = (rooms) => setPublicRooms(rooms || []);
    const onRoomError = ({ message }) => showToast(message || 'Erro na sala.');
    const onErr = (m) => showToast(m);
    const onKicked = ({ message }) => {
      setGameState(null);
      showToast(message || 'Você foi expulso da sala.', 'error');
    };
    const onLeftRoom = () => {
      setGameState(null);
    };
    const onHostMigrated = ({ newHostId }) => {
      const isMe = socket.id === newHostId;
      showToast(isMe ? '👑 Você agora é o líder da sala!' : '👑 A liderança da sala foi transferida.', 'info');
    };
    const onConnect = () => {
      setConnected(true);
      socket.emit('get_public_rooms');
    };
    const onDisconnect = () => setConnected(false);

    socket.on('game_state', onState);
    socket.on('room_updated', onRoomUpdated);
    socket.on('room_joined', onRoomJoined);
    socket.on('public_rooms_updated', onPublicRooms);
    socket.on('room_error', onRoomError);
    socket.on('error_message', onErr);
    socket.on('kicked_from_room', onKicked);
    socket.on('left_room', onLeftRoom);
    socket.on('host_migrated', onHostMigrated);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Carrega lista inicial de salas públicas
    socket.emit('get_public_rooms');

    return () => {
      socket.off('game_state', onState);
      socket.off('room_updated', onRoomUpdated);
      socket.off('room_joined', onRoomJoined);
      socket.off('public_rooms_updated', onPublicRooms);
      socket.off('room_error', onRoomError);
      socket.off('error_message', onErr);
      socket.off('kicked_from_room', onKicked);
      socket.off('left_room', onLeftRoom);
      socket.off('host_migrated', onHostMigrated);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [showToast]);

  const players = gameState?.players || [];
  const me = players.find((p) => p.id === gameState?.you) || null;
  const isHost = gameState?.hostId && socket.id === gameState.hostId;
  const phase = gameState?.phase || 'LOBBY';
  const roomStatus = gameState?.roomStatus || 'LOBBY';
  const localIndex = Math.max(0, players.findIndex((p) => p.id === gameState?.you));
  const aliveCount = players.filter((p) => p.isAlive).length;

  // Vida do jogador local (hp/maxHp vindos do servidor; lives/maxLives mantidos por compatibilidade)
  const myHp = me ? (me.hp ?? me.lives) : null;
  const myMaxHp = me ? (me.maxHp ?? me.maxLives ?? gameState?.maxHp ?? DEFAULT_MAX_HP) : DEFAULT_MAX_HP;

  // Limpa seleção quando a jogada foi travada ou a fase mudou
  useEffect(() => {
    if (phase !== 'PLANNING' || me?.lockedIn) setSelectedCardIds([]);
  }, [phase, me?.lockedIn]);

  /* ---------------- FEEDBACK DE DANO (Hit Flash + Screen Shake) ---------------- */
  useEffect(() => {
    if (myHp == null) {
      prevHpRef.current = null;
      return;
    }
    const inMatch = phase !== 'LOBBY';
    if (inMatch && prevHpRef.current != null && myHp < prevHpRef.current) {
      setHitKey((k) => k + 1);
      if (!reduceMotion) {
        shakeControls.start({
          x: [0, -8, 8, -6, 6, 0],
          y: [0, 4, -4, 2, -2, 0],
          transition: { duration: 0.3, ease: 'easeInOut' },
        });
      }
    }
    prevHpRef.current = myHp;
  }, [myHp, phase, reduceMotion, shakeControls]);

  /* ---------------- ÁUDIO ---------------- */
  const stateRef = useRef(null);
  stateRef.current = gameState;
  const audioPrev = useRef({ alive: 0, lockedOthers: 0 });

  // SFX por fase (os efeitos visuais chegam no mesmo game_state da troca de fase)
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const ps = s.players;
    const you = s.you;
    const fxCount = (fx) => ps.filter((p) => p.visualEffect === fx).length;
    const revealed = (type) => ps.some((p) => p.selectedAction && !p.selectedAction.hidden && p.selectedAction.cardType === type);
    const aliveNow = ps.filter((p) => p.isAlive).length;

    switch (s.phase) {
      case 'DEALING':
        audio.play('shuffle');
        [0, 1, 2].forEach((i) => audio.play('deal', 0.3 + i * 0.18));
        break;
      case 'PLANNING':
        audio.play('bell');
        break;
      case 'REVEAL_REVERSO':
        if (revealed('REVERSO')) audio.play('flip');
        if (fxCount('REFLECT')) audio.play('reflect', 0.55);
        if (fxCount('VACUUM')) {
          audio.play('vacuum', 0.5);
          audio.play('damage', 1.45);
        }
        break;
      case 'REVEAL_PAREDE':
        if (revealed('PAREDE')) audio.play('flip');
        if (fxCount('WALLED')) audio.play('wall', 0.55);
        break;
      case 'REVEAL_FACA':
        if (revealed('FACA')) {
          audio.play('flip');
          audio.play('knife', 0.55);
        }
        if (fxCount('WALL_BROKEN')) audio.play('wallBreak', 0.75);
        if (fxCount('DAMAGE')) audio.play('damage', 0.8);
        if (aliveNow < audioPrev.current.alive) audio.play('death', 1.5);
        break;
      case 'ANALYSIS':
        audio.play('analysis');
        break;
      case 'GAME_OVER':
        if (aliveNow < audioPrev.current.alive) audio.play('death', 0.2);
        audio.play(s.winner && s.winner.id === you ? 'win' : 'lose', 1.2);
        break;
      default:
        break;
    }
    audioPrev.current.alive = aliveNow;
    audioPrev.current.lockedOthers = 0;
  }, [gameState?.phase, gameState?.round]);

  // Minha jogada travada
  useEffect(() => {
    if (phase === 'PLANNING' && me?.lockedIn) audio.play('lock');
  }, [me?.lockedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Outros jogadores travando a jogada
  const lockedOthers = players.filter((p) => p.id !== me?.id && p.isAlive && p.lockedIn).length;
  useEffect(() => {
    if (phase === 'PLANNING' && lockedOthers > audioPrev.current.lockedOthers) audio.play('lockOther');
    audioPrev.current.lockedOthers = lockedOthers;
  }, [lockedOthers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Música dinâmica por vidas e som ambiente exclusivo para espectadores
  useEffect(() => {
    const inMatch = roomStatus === 'IN_GAME' && phase !== 'LOBBY' && phase !== 'GAME_OVER';
    audio.setPlayerState({
      inGame: inMatch,
      isAlive: !!me?.isAlive,
      lives: me?.lives ?? 3,
      phase,
    });
  }, [roomStatus, phase, me?.lives, me?.isAlive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Som de clique em qualquer botão
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target.closest && e.target.closest('button');
      if (btn && !btn.disabled) audio.play('click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const discardLimit = gameState?.settings?.discardLimit ?? 2;
  const selectedCard = selectedCardIds.length === 1 ? me?.hand?.find((c) => c.id === selectedCardIds[0]) || null : null;
  const canAct = phase === 'PLANNING' && !!me?.isAlive && !me?.lockedIn;
  const walled = !!me?.isWalled;

  const isTargetable = (p) => {
    if (!canAct || !selectedCard || !p.isAlive) return false;
    if (walled) return p.id === me.id;
    return true;
  };

  const sendAction = useCallback(
    (cardId, targetId) => {
      if (!cardId) return;
      socket.emit('select_action', { cardId, targetId });
      setSelectedCardIds([]);
    },
    []
  );

  const onSeatClick = (p) => {
    if (selectedCard && isTargetable(p)) sendAction(selectedCard.id, p.id);
  };

  const onDropCard = (p, e) => {
    const cardId = e.dataTransfer.getData('text/plain') || dragCardRef.current;
    dragCardRef.current = null;
    if (!canAct || !cardId) return;
    if (walled && p.id !== me.id) {
      showToast('Você está EMPAREDADO! Só pode usar cartas em si mesmo ou passar/descartar.');
      return;
    }
    sendAction(cardId, p.id);
  };

  const onCardClick = useCallback((card) => {
    audio.play('select');
    const limit = gameState?.settings?.discardLimit ?? 2;
    setSelectedCardIds((cur) => {
      if (cur.includes(card.id)) {
        return cur.filter((id) => id !== card.id);
      }
      if (limit <= 0) {
        return [card.id];
      }
      if (cur.length >= limit) {
        return limit === 1 ? [card.id] : [cur[1], card.id];
      }
      return [...cur, card.id];
    });
  }, [gameState?.settings?.discardLimit]);

  const onCardDragStart = useCallback((e, card) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
    dragCardRef.current = card.id;
    setSelectedCardIds([card.id]);
  }, []);

  const handleDiscard = useCallback(() => {
    if (selectedCardIds.length === 0) {
      audio.play('lock');
      socket.emit('pass_turn');
    } else {
      audio.play('lock');
      socket.emit('discard_cards', { cardIds: selectedCardIds });
    }
    setSelectedCardIds([]);
  }, [selectedCardIds]);

  const handlePassTurn = useCallback(() => {
    audio.play('lock');
    socket.emit('pass_turn');
    setSelectedCardIds([]);
  }, []);

  const logs = useMemo(() => gameState?.logs || [], [gameState?.logs]);

  const nameOf = useCallback(
    (id) => {
      const p = players.find((x) => x.id === id);
      return p ? p.name : '?';
    },
    [players]
  );

  /* Handlers para o Hub e Lobby */
  const handleJoinRoom = (roomCode) => {
    const cleanPlayer = nickname.trim() || 'CONDENADO';
    socket.emit('join_room', { playerName: cleanPlayer, roomCode });
  };

  const handleCreateRoom = ({ roomName, isPublic, initialHandCards }) => {
    const cleanPlayer = nickname.trim() || 'CONDENADO';
    socket.emit('create_room', { playerName: cleanPlayer, roomName, isPublic, initialHandCards });
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    setGameState(null);
    setShowLogs(false);
  };

  const handleTogglePrivacy = () => socket.emit('toggle_room_privacy');
  const handleAddBot = () => socket.emit('add_bot');
  const handleRemoveBot = (botId) => socket.emit('remove_bot', botId);
  const handleKickPlayer = (targetId) => socket.emit('kick_player', { targetId });
  const handleSetMaxHp = (maxHp) => socket.emit('set_max_hp', { maxHp });
  const handleSetMaxHandCards = (maxHandCards) => socket.emit('set_max_hand_cards', { maxHandCards });
  const handleStartGame = () => socket.emit('start_game');
  const handleRestartGame = () => socket.emit('restart_game');

  const isDead = me ? !me.isAlive : false;
  const handleSendChat = useCallback((text) => {
    if (!text || !text.trim()) return;
    audio.play('click');
    socket.emit('send_chat', { text: text.trim() });
  }, []);

  const handleCopyHeaderCode = () => {
    if (gameState?.roomCode) {
      navigator.clipboard?.writeText(gameState.roomCode);
      setCopiedCode(true);
      showToast(`Código ${gameState.roomCode} copiado!`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Se não estiver em nenhuma sala: Mostra a Home / Hub (estilo jklm.fun)
  const inAnyRoom = Boolean(gameState?.roomCode);
  const inGame = inAnyRoom && (roomStatus === 'IN_GAME' || phase !== 'LOBBY');

  // Vinheta de sangramento só durante a partida e apenas para quem está sentado à mesa
  const overlayActive = inAnyRoom && !!me && phase !== 'LOBBY' && phase !== 'GAME_OVER';



  /* ---------------- MESA CERIMONIAL (Única e responsiva para Mobile, Tablet e Desktop) ---------------- */
  const gameTable = (
    <div
      ref={tableContainerRef}
      id="game-table-container"
      className="flex-1 min-h-0 flex flex-col overflow-y-auto sm:overflow-hidden overflow-x-hidden scroll-smooth relative"
    >
      {/* 1. MESA CERIMONIAL E MÃO DE CARTAS (Preenche a tela inicial no mobile) */}
      <div className="relative min-h-[calc(100dvh-54px)] sm:min-h-0 sm:flex-1 flex flex-col justify-between shrink-0 sm:shrink">
        <main className="relative flex-1 min-h-0 flex items-center justify-center p-1 sm:p-2">
          <div
            className="relative"
            style={{
              width: 'min(98vw, calc(100dvh - 215px))',
              maxHeight: 'calc(100dvh - 215px)',
              aspectRatio: '1 / 1',
            }}
          >
            <div className="table-octagon table-wood absolute inset-0 shadow-[0_0_80px_rgba(0,0,0,0.9)]" />
            <div className="table-octagon table-felt absolute inset-[3.5%]" />

            <TargetArrowsSVG players={players} localIndex={localIndex} />

            {players.map((p, i) => (
              <PlayerSeat
                key={p.id}
                player={p}
                index={i}
                localIndex={localIndex}
                totalPlayers={players.length}
                isMe={p.id === me?.id}
                phase={phase}
                targetable={isTargetable(p)}
                dimmed={canAct && !!selectedCard && !isTargetable(p)}
                onSeatClick={onSeatClick}
                onDropCard={onDropCard}
              />
            ))}

            {/* Centro da mesa: relógio + controles de análise */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1 sm:gap-1.5">
              <CentralClock socket={socket} myAllowedTime={me?.allowedTime} phase={phase} locked={!!me?.lockedIn || !me?.isAlive} />
              {phase === 'ANALYSIS' && (
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  <button
                    id="btn-pause"
                    onClick={() => socket.emit('toggle_pause')}
                    className="flex items-center justify-center gap-1 px-2.5 py-1 rounded border border-gold-aged bg-black/85 text-gold-aged text-[10px] font-mono font-bold hover:bg-gold-aged/20"
                  >
                    <Pause size={11} /> {gameState.isPaused ? '▶️ CONTINUAR' : '⏸️ PAUSAR'}
                  </button>
                  <button
                    id="btn-skip"
                    onClick={() => socket.emit('skip_analysis')}
                    className="flex items-center justify-center gap-1 px-2.5 py-1 rounded border border-blood-bright bg-black/85 text-blood-bright text-[10px] font-mono font-bold hover:bg-blood/30"
                  >
                    <SkipForward size={11} /> ⏭️ PRÓXIMO
                  </button>
                </div>
              )}
            </div>

            {/* Aviso de parede */}
            {walled && canAct && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute left-1/2 -translate-x-1/2 bottom-[2%] z-50 px-3 py-1 rounded border-2 border-blood-bright bg-black/95 text-blood-bright text-[10px] sm:text-[11px] font-mono font-bold text-center max-w-[85%]"
              >
                🔒 EMPAREDADO: USE CARTAS EM SI MESMO OU PASSE/DESCARTE
              </motion.div>
            )}
          </div>
        </main>

        {/* Mão de cartas (acima da vinheta de sangramento: z-[45]) */}
        <footer className="relative z-[45] h-[155px] sm:h-[195px] flex items-end justify-center pb-2 sm:pb-3 px-1">
          {me && me.isAlive ? (
            <div className="flex items-end justify-center gap-1.5 sm:gap-3 max-w-full overflow-x-auto pb-0.5">
              <AnimatePresence>
                {me.hand.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ y: -300, opacity: 0, rotate: -8 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 130, damping: 16 }}
                  >
                    <InscryptionCard
                      card={card}
                      isSelected={selectedCardIds.includes(card.id)}
                      onClick={onCardClick}
                      onDragStart={onCardDragStart}
                      onDragEnd={() => (dragCardRef.current = null)}
                      disabled={!canAct}
                      compact={compact}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="font-grimoire text-parchment-dark tracking-widest text-xs sm:text-sm pb-4 sm:pb-8 text-center space-y-1">
              <div>{me ? '💀 VOCÊ FOI ELIMINADO — ASSISTINDO DA ESCURIDÃO' : '👁 ESPECTADOR'}</div>
              <button
                onClick={scrollToUnderTable}
                className="sm:hidden font-mono text-xs text-purple-300 hover:text-purple-200 underline"
              >
                Abrir Caderno sob a Mesa (Chat & Anotações) ↓
              </button>
            </div>
          )}
        </footer>

        {/* Painel de ações do jogador: Mirar em mim mesmo e Passar a vez / Descarte */}
        {me && me.isAlive && (
          <div className="absolute right-2 bottom-[158px] sm:bottom-3 sm:right-3 z-[45] flex flex-col gap-1.5 w-[140px] sm:w-[190px]">
            {canAct && selectedCard && (
              <button
                id="btn-self-target"
                onClick={() => {
                  sendAction(selectedCard.id, me.id);
                  setSelectedCardIds([]);
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded border-2 border-gold-aged bg-black/85 text-gold-aged font-grimoire font-bold text-[10px] sm:text-xs hover:bg-gold-aged/20 shadow-md active:scale-95"
              >
                <Crosshair size={13} /> MIRAR EM MIM
              </button>
            )}

            {canAct && (discardLimit > 0 ? (
              selectedCardIds.length > 0 ? (
                <button
                  id="btn-discard"
                  onClick={handleDiscard}
                  className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded border-2 border-amber-500 bg-amber-950/85 text-amber-200 font-grimoire font-bold text-[10px] sm:text-xs hover:bg-amber-900 shadow-md active:scale-95"
                >
                  <Trash2 size={13} className="text-amber-400" /> DESCARTAR ({selectedCardIds.length})
                </button>
              ) : (
                <button
                  id="btn-pass"
                  onClick={handlePassTurn}
                  className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded border-2 border-iron bg-black/85 text-parchment-dark font-grimoire font-bold text-[10px] sm:text-xs hover:border-parchment shadow-md active:scale-95"
                >
                  <Hand size={13} /> PASSAR A VEZ
                </button>
              )
            ) : (
              <button
                id="btn-pass"
                onClick={handlePassTurn}
                className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded border-2 border-iron bg-black/85 text-parchment-dark font-grimoire font-bold text-[10px] sm:text-xs hover:border-parchment shadow-md active:scale-95"
              >
                <Hand size={13} /> PASSAR A VEZ
              </button>
            ))}

            <div className="text-[9px] sm:text-[10px] font-mono text-parchment-dark text-center leading-tight">
              {canAct
                ? selectedCard
                  ? 'Clique num assento para atacar'
                  : selectedCardIds.length > 0
                    ? `${selectedCardIds.length} selecionada(s) p/ descarte`
                    : discardLimit > 0
                      ? 'Selecione carta(s) ou passe a vez'
                      : 'Clique numa carta para agir'
                : phase === 'PLANNING'
                  ? 'Jogada travada. Aguardando...'
                  : ''}
            </div>
          </div>
        )}

        {/* Dica interativa para abrir o caderno embaixo da mesa (Exclusivo Celular) */}
        <div className="sm:hidden w-full bg-gradient-to-r from-transparent via-[#25170e] to-transparent border-t border-stone-800/80 py-1.5 flex items-center justify-center shrink-0">
          <button
            id="btn-scroll-under-table"
            onClick={scrollToUnderTable}
            className="flex items-center gap-2 text-[11px] font-mono text-amber-300 hover:text-white transition-all py-1 px-4 rounded-full bg-black/75 border border-gold-aged/50 hover:border-gold-aged active:scale-95 shadow-sm"
            title="Rolar para abrir o caderno de anotações sob a mesa"
          >
            <ChevronDown size={14} className="animate-bounce text-gold-aged" />
            <span className="font-bold tracking-wider">📓 ABRIR CADERNO SOB A MESA (CHAT & ANOTAÇÕES)</span>
            <ChevronDown size={14} className="animate-bounce text-gold-aged" />
          </button>
        </div>
      </div>

      {/* 2. EMBAIXO DA MESA (CHAT & CRÔNICA EM LARGURA TOTAL) */}
      <UnderTableChat
        logs={logs}
        onSendChat={handleSendChat}
        isDead={isDead}
        canAct={canAct}
        phase={phase}
        onScrollToTable={scrollToTableTop}
      />

      {/* Crônica e Chat Desktop Flutuante */}
      <LogPanel logs={logs} onSendChat={handleSendChat} isDead={isDead} />
    </div>
  );

  return (
    <>
      {/* Container do jogo: recebe o Screen Shake (os overlays ficam FORA dele para não tremerem junto) */}
      <motion.div
        animate={shakeControls}
        className="h-full flex flex-col relative overflow-hidden overflow-x-hidden bg-void-bg text-parchment"
      >
        {/* Brilho de velas */}
        <div className="candle pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.07),transparent_60%)]" />

        {/* Barra superior com iluminação suave e contraste enriquecido (z-[70] acima de qualquer overlay) */}
        <header className="relative z-[70] flex items-center justify-between gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 border-b-2 border-stone-700/80 bg-gradient-to-r from-[#2c1d12] via-[#241710] to-[#1e130c] shadow-[0_4px_25px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(212,175,55,0.22)]">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <div className="font-grimoire font-extrabold tracking-[0.18em] sm:tracking-[0.25em] text-amber-100 text-sm sm:text-base whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex items-center">
              STRIKE<span className="text-blood-bright font-black mx-0.5 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">/</span>VOID
            </div>

            {inAnyRoom && (
              <button
                onClick={handleCopyHeaderCode}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md border border-gold-aged/80 bg-[#160e08]/90 font-mono text-[11px] sm:text-xs text-amber-300 font-bold hover:bg-gold-aged/25 hover:border-gold-aged transition-all shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                title="Clique para copiar código da sala"
              >
                <strong className="tracking-wider">{gameState.roomCode}</strong>
                {copiedCode ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </button>
            )}
          </div>

          <div className="hidden sm:flex font-mono text-xs tracking-wider items-center gap-3">
            {inGame && (
              <span className="text-amber-100 bg-stone-900/90 border border-stone-700 px-2.5 py-0.5 rounded shadow-inner font-bold">
                ROUND {gameState.round}
              </span>
            )}
            {inAnyRoom && (
              <span className="text-amber-300 bg-gold-aged/20 border border-gold-aged/60 px-2.5 py-0.5 rounded shadow-sm font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-aged animate-pulse" />
                {PHASE_LABELS[phase]}
              </span>
            )}
          </div>

          {/* AÇÕES NO DESKTOP (telas >= sm) */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
            <AudioControls />
            <button
              id="btn-guide"
              onClick={() => {
                audio.play('click');
                setShowGuide(true);
              }}
              className={cn(
                HEADER_ICON_BTN,
                'border-blood-bright bg-blood/60 text-white hover:bg-blood hover:border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.45)]'
              )}
              aria-label="Como Jogar / Guia de Regras"
              title="Como Jogar / Guia de Regras"
            >
              <HelpCircle size={16} className="text-red-300 shrink-0" />
              <span className="hidden sm:inline font-bold">GUIA</span>
            </button>
            {inAnyRoom && (
              <button
                id="btn-settings"
                onClick={() => setShowSettings(true)}
                className={cn(HEADER_ICON_BTN, 'border-gold-aged/80 bg-gold-aged/20 text-amber-300 hover:bg-gold-aged/35 hover:text-white shadow-[0_0_12px_rgba(212,175,55,0.25)]')}
                aria-label="Ajustar tempos da partida"
                title="Ajustar tempos da partida"
              >
                <Settings size={16} /> <span className="hidden sm:inline">TEMPOS</span>
              </button>
            )}
            {inAnyRoom && (
              <button
                onClick={handleLeaveRoom}
                className={cn(HEADER_ICON_BTN, 'border-stone-600 bg-stone-900/90 text-stone-200 hover:text-white hover:bg-blood/70 hover:border-blood-bright')}
                title="Sair da sala"
                aria-label="Sair da sala"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">SAIR</span>
              </button>
            )}
          </div>

          {/* AÇÕES NO MOBILE (telas < sm): EXATAMENTE DOIS BOTÕES (SAIR + HAMBURGER) */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            {inAnyRoom && (
              <button
                id="btn-mobile-leave"
                onClick={handleLeaveRoom}
                className="flex items-center justify-center gap-1 h-9 px-2.5 rounded-md border border-blood-bright/70 bg-blood/30 hover:bg-blood/50 text-red-200 text-xs font-mono font-bold active:scale-95 shadow-sm"
                title="Sair da sala"
                aria-label="Sair da sala"
              >
                <LogOut size={14} />
                <span>SAIR</span>
              </button>
            )}

            <button
              id="btn-mobile-menu"
              onClick={() => {
                audio.play('click');
                setShowMobileMenu((v) => !v);
              }}
              className={cn(
                'flex items-center justify-center h-9 w-9 rounded-md border transition-all active:scale-95 shadow-sm',
                showMobileMenu
                  ? 'border-gold-aged bg-gold-aged/30 text-white shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                  : 'border-stone-600 bg-stone-900/90 text-amber-200 hover:border-gold-aged'
              )}
              title="Menu de Opções (Regras, Configurações, Volume)"
              aria-label="Menu de Opções"
            >
              {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {/* Faixa de fase/round no mobile (o cabeçalho já está cheio) */}
        {inGame && (
          <div className="sm:hidden relative z-30 flex items-center justify-center gap-3 px-2 py-1 border-b border-stone-700/80 bg-gradient-to-r from-[#22150e] via-[#2c1b12] to-[#22150e] font-mono text-[11px] tracking-wider text-amber-100 shadow-sm">
            <span className="font-bold text-amber-200">ROUND {gameState.round}</span>
            <span className="text-stone-500">·</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-aged animate-pulse" />
              {PHASE_LABELS[phase]}
            </span>
          </div>
        )}

        {/* Roteamento de Tela */}
        {!inAnyRoom ? (
          /* 1. Hub Inicial estilo jklm.fun */
          <HomeHub
            nickname={nickname}
            setNickname={setNickname}
            publicRooms={publicRooms}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
            onRefreshRooms={() => socket.emit('get_public_rooms')}
            onOpenGuide={() => setShowGuide(true)}
          />
        ) : !inGame ? (
          /* 2. Sala de Espera / Lobby da Sala */
          <RoomLobby
            roomState={gameState}
            me={me}
            isHost={isHost}
            onLeaveRoom={handleLeaveRoom}
            onTogglePrivacy={handleTogglePrivacy}
            onAddBot={handleAddBot}
            onRemoveBot={handleRemoveBot}
            onKickPlayer={handleKickPlayer}
            onStartGame={handleStartGame}
            onOpenSettings={() => setShowSettings(true)}
            onOpenGuide={() => setShowGuide(true)}
            onCopyCode={(code) => showToast(`Código ${code} copiado!`, 'success')}
            onSendChat={handleSendChat}
          />
        ) : (
          /* 3. Mesa Cerimonial única e responsiva (Mobile, Tablet e Desktop) */
          gameTable
        )}

        {/* Logs em gaveta (mobile) com chat e suporte para mortos */}
        {compact && (
          <LogDrawer
            open={showLogs}
            onClose={() => setShowLogs(false)}
            logs={logs}
            onSendChat={handleSendChat}
            isDead={isDead}
          />
        )}

        {/* Menu Hamburger no Mobile (Regras, Configurações, Volume, Sair) */}
        <MobileHeaderMenu
          open={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          gameState={gameState}
          isHost={isHost}
          inGame={inGame}
          inAnyRoom={inAnyRoom}
          onOpenGuide={() => setShowGuide(true)}
          onOpenSettings={() => setShowSettings(true)}
          onLeaveRoom={handleLeaveRoom}
          onScrollToUnderTable={scrollToUnderTable}
        />

        {/* Modal Interativo de Regras / Como Jogar */}
        <GameGuideModal open={showGuide} onClose={() => setShowGuide(false)} />

        {/* Modal de Configurações */}
        {gameState?.settings && (
          <SettingsModal
            open={showSettings}
            settings={gameState.settings}
            aliveCount={aliveCount || players.length}
            isHost={isHost}
            isLobby={roomStatus === 'LOBBY' || phase === 'LOBBY'}
            onClose={() => setShowSettings(false)}
            onSave={(s) => {
              socket.emit('update_settings', s);
              showToast('Configurações salvas e aplicadas à mesa!', 'success');
            }}
          />
        )}

        {/* Fim de jogo */}
        <AnimatePresence>
          {phase === 'GAME_OVER' && (
            <motion.div
              key="gameover"
              className="absolute inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="rounded-lg border-4 border-gold-aged bg-wood-dark px-5 sm:px-10 py-6 sm:py-8 text-center shadow-[0_0_80px_rgba(212,175,55,0.4)] max-w-md w-full"
              >
                {gameState?.winner ? (
                  <Trophy className="mx-auto text-gold-aged mb-2" size={48} />
                ) : (
                  <SkullIcon className="mx-auto text-blood-bright mb-2" size={48} />
                )}
                <div className="font-grimoire font-extrabold text-2xl sm:text-3xl tracking-widest text-parchment break-words">
                  {gameState?.winner ? gameState.winner.name : 'NINGUÉM'}
                </div>
                <div className="font-typewriter text-sm sm:text-base text-parchment-dark mt-1 mb-6">
                  {gameState?.winner ? 'sobreviveu ao Void.' : 'foi engolido pelo Void. Empate.'}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    id="btn-restart"
                    onClick={handleRestartGame}
                    className="w-full min-h-[48px] py-2.5 rounded border-2 border-gold-aged bg-blood/80 hover:bg-blood text-parchment font-grimoire font-bold tracking-wider text-sm transition-colors shadow-[0_0_15px_rgba(139,0,0,0.5)]"
                  >
                    VOLTAR AO LOBBY DA SALA
                  </button>
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full min-h-[44px] py-2 rounded border border-iron/80 bg-black/60 hover:bg-black text-parchment-dark hover:text-white font-mono text-xs transition-colors"
                  >
                    SAIR PARA O MENU PRINCIPAL
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast de notificações / erros */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              className={`absolute top-14 left-1/2 -translate-x-1/2 z-[300] max-w-[92vw] text-center px-4 py-2 rounded border-2 font-mono text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 ${
                toast.type === 'success'
                  ? 'border-emerald-500 bg-black/95 text-emerald-400'
                  : toast.type === 'info'
                    ? 'border-gold-aged bg-black/95 text-gold-aged'
                    : 'border-blood-bright bg-black/95 text-blood-bright'
              }`}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Feedback de dano estilo FPS: Hit Flash (z-50) + Vinheta de sangramento (z-40). Fora do container que treme. */}
      <DamageOverlay hp={myHp} maxHp={myMaxHp} active={overlayActive} hitKey={hitKey} />
    </>
  );
}

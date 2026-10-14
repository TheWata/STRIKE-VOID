import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { socket } from './lib/socket';
import { cn } from './lib/cn';
import InscryptionCard from './components/InscryptionCard';
import PlayerSeat from './components/PlayerSeat';
import TargetArrowsSVG from './components/TargetArrowsSVG';
import SettingsModal from './components/SettingsModal';
import AudioControls from './components/AudioControls';
import HomeHub from './components/HomeHub';
import RoomLobby from './components/RoomLobby';
import { audio } from './lib/audio';

const PHASE_LABELS = {
  LOBBY: 'LOBBY',
  DEALING: 'EMBARALHANDO...',
  PLANNING: 'PLANEJAMENTO',
  REVEAL_REVERSO: 'FASE 1 · REVERSOS',
  REVEAL_PAREDE: 'FASE 2 · PAREDES',
  REVEAL_FACA: 'FASE 3 · FACAS',
  ANALYSIS: 'ANÁLISE',
  GAME_OVER: 'FIM DE JOGO',
};

const LOG_STYLES = {
  VACUUM: 'text-fuchsia-400',
  REFLECT: 'text-gold-aged',
  STEAL: 'text-amber-300 font-bold',
  WALL: 'text-[#7fa3c0]',
  BREAK: 'text-orange-400',
  DAMAGE: 'text-red-500',
  DEATH: 'text-red-700 font-bold',
  SYSTEM: 'text-parchment-dark',
};

/* ------------------------------------------------------------------ */
/* Relógio isolado: só ele escuta timer_tick (não re-renderiza a mesa) */
/* ------------------------------------------------------------------ */
const CentralClock = React.memo(function CentralClock({ socket, myAllowedTime, phase, locked }) {
  const [elapsed, setElapsed] = useState(0);
  const [analysis, setAnalysis] = useState({ remainingSec: 0, paused: false });

  useEffect(() => {
    const onTick = ({ elapsedSec }) => setElapsed(elapsedSec);
    const onAnalysis = (data) => setAnalysis(data);
    socket.on('timer_tick', onTick);
    socket.on('analysis_tick', onAnalysis);
    return () => {
      socket.off('timer_tick', onTick);
      socket.off('analysis_tick', onAnalysis);
    };
  }, [socket]);

  useEffect(() => {
    setElapsed(0);
  }, [phase]);

  const allowed = myAllowedTime || 0;
  const remaining = Math.max(0, Number((allowed - elapsed).toFixed(1)));
  const secsLeft = Math.ceil(remaining);
  const ticking = phase === 'PLANNING' && !locked && allowed > 0 && secsLeft > 0 && secsLeft <= 5;

  // Tique-taque nos últimos 5s (mais grave e urgente nos últimos 3s) + tensão do ambiente
  useEffect(() => {
    if (!ticking) return;
    audio.play(secsLeft <= 3 ? 'tickUrgent' : 'tick');
  }, [ticking, secsLeft]);

  useEffect(() => {
    audio.setClockTension(ticking ? (secsLeft <= 3 ? 1 : 0.5) : 0);
  }, [ticking, secsLeft]);

  useEffect(() => () => audio.setClockTension(0), []);

  if (phase === 'ANALYSIS') {
    return (
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border-4 border-gold-aged/70 bg-wood-dark flex items-center justify-center font-mono font-bold text-gold-aged text-lg shadow-[0_0_14px_rgba(212,175,55,0.4)]">
          {analysis.remainingSec.toFixed(0)}
        </div>
        <span className="text-[9px] font-mono text-parchment-dark mt-1 tracking-widest">
          {analysis.paused ? 'PAUSADO' : 'LEITURA'}
        </span>
      </div>
    );
  }

  const frac = allowed > 0 ? Math.min(1, remaining / allowed) : 0;
  const urgent = phase === 'PLANNING' && !locked && remaining <= 3 && allowed > 0;
  const R = 44;

  return (
    <div id="central-clock" className="relative w-[clamp(96px,10vw,128px)] aspect-square">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#1a110b" stroke="#d4af37" strokeWidth="2" opacity="0.9" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="4"
            x2="50"
            y2={i % 3 === 0 ? 12 : 9}
            stroke="#9e8a63"
            strokeWidth="1.5"
            transform={`rotate(${i * 30} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r={R - 6} fill="#0d0906" stroke="#2c1d12" strokeWidth="2" />
        <circle
          cx="50"
          cy="50"
          r={R - 6}
          fill="none"
          stroke={urgent ? '#dc2626' : locked ? '#4a5568' : '#d4af37'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * (R - 6)}
          strokeDashoffset={2 * Math.PI * (R - 6) * (1 - (phase === 'PLANNING' ? frac : 0))}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className={cn('absolute inset-0 flex flex-col items-center justify-center', urgent && 'animate-pulse')}>
        {phase === 'PLANNING' ? (
          <>
            <span
              className={cn(
                'font-mono font-bold text-2xl leading-none',
                urgent ? 'text-blood-bright' : locked ? 'text-iron' : 'text-parchment'
              )}
            >
              {remaining.toFixed(1)}
            </span>
            <span className="text-[8px] font-mono text-parchment-dark mt-1 tracking-widest">
              {locked ? 'TRAVADO' : 'SEGUNDOS'}
            </span>
          </>
        ) : (
          <span className="text-[9px] font-grimoire font-bold text-center text-parchment-dark leading-tight px-3 tracking-wider">
            {PHASE_LABELS[phase] || phase}
          </span>
        )}
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Painel de logs                                                      */
/* ------------------------------------------------------------------ */
function LogPanel({ logs }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs.length]);

  return (
    <div className="absolute bottom-3 left-3 z-40 w-[min(22rem,26vw)] min-w-[220px] h-[190px] flex flex-col rounded border-2 border-iron/70 bg-black/70 backdrop-blur-sm">
      <div className="px-2 py-1 border-b border-iron/60 font-grimoire font-extrabold text-[11px] tracking-widest text-gold-aged">
        CRÔNICA DA MESA (LOGS)
      </div>
      <div ref={ref} id="log-panel" className="flex-1 overflow-y-auto px-2 py-1 font-mono text-[10.5px] leading-snug space-y-0.5">
        {logs.map((l) => (
          <div key={l.id} className={cn(LOG_STYLES[l.type] || 'text-parchment')}>
            <span className="opacity-50">R{l.round} </span>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App Principal                                                       */
/* ------------------------------------------------------------------ */
export default function App() {
  const [gameState, setGameState] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [, setConnected] = useState(socket.connected);
  const dragCardRef = useRef(null);
  const toastTimer = useRef(null);

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

  // Limpa seleção quando a jogada foi travada ou a fase mudou
  useEffect(() => {
    if (phase !== 'PLANNING' || me?.lockedIn) setSelectedCardId(null);
  }, [phase, me?.lockedIn]);

  /* ---------------- ÁUDIO ---------------- */
  const stateRef = useRef(null);
  stateRef.current = gameState;
  const audioPrev = useRef({ alive: 0, lockedOthers: 0 });

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

  useEffect(() => {
    if (phase === 'PLANNING' && me?.lockedIn) audio.play('lock');
  }, [me?.lockedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const lockedOthers = players.filter((p) => p.id !== me?.id && p.isAlive && p.lockedIn).length;
  useEffect(() => {
    if (phase === 'PLANNING' && lockedOthers > audioPrev.current.lockedOthers) audio.play('lockOther');
    audioPrev.current.lockedOthers = lockedOthers;
  }, [lockedOthers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const inMatch = roomStatus === 'IN_GAME' && phase !== 'LOBBY' && phase !== 'GAME_OVER';
    audio.setPlayerState({
      inGame: inMatch,
      isAlive: !!me?.isAlive,
      lives: me?.lives ?? 3,
      phase,
    });
  }, [roomStatus, phase, me?.lives, me?.isAlive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target.closest && e.target.closest('button');
      if (btn && !btn.disabled) audio.play('click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const selectedCard = me?.hand?.find((c) => c.id === selectedCardId) || null;
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
      setSelectedCardId(null);
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
      showToast('Você está EMPAREDADO! Só pode usar cartas em si mesmo ou passar a vez.');
      return;
    }
    sendAction(cardId, p.id);
  };

  const onCardClick = useCallback((card) => {
    audio.play('select');
    setSelectedCardId((cur) => (cur === card.id ? null : card.id));
  }, []);

  const onCardDragStart = useCallback((e, card) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
    dragCardRef.current = card.id;
  }, []);

  const logs = useMemo(() => gameState?.logs || [], [gameState?.logs]);

  /* Handlers para o Hub e Lobby */
  const handleJoinRoom = (roomCode) => {
    const cleanPlayer = nickname.trim() || 'CONDENADO';
    socket.emit('join_room', { playerName: cleanPlayer, roomCode });
  };

  const handleCreateRoom = ({ roomName, isPublic }) => {
    const cleanPlayer = nickname.trim() || 'CONDENADO';
    socket.emit('create_room', { playerName: cleanPlayer, roomName, isPublic });
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    setGameState(null);
  };

  const handleTogglePrivacy = () => {
    socket.emit('toggle_room_privacy');
  };

  const handleAddBot = () => {
    socket.emit('add_bot');
  };

  const handleRemoveBot = (botId) => {
    socket.emit('remove_bot', botId);
  };

  const handleKickPlayer = (targetId) => {
    socket.emit('kick_player', { targetId });
  };

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  const handleRestartGame = () => {
    socket.emit('restart_game');
  };

  const handleCopyHeaderCode = () => {
    if (gameState?.roomCode) {
      navigator.clipboard.writeText(gameState.roomCode);
      setCopiedCode(true);
      showToast(`Código ${gameState.roomCode} copiado!`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Se não estiver em nenhuma sala: Mostra a Home / Hub (estilo jklm.fun)
  const inAnyRoom = Boolean(gameState?.roomCode);
  const inGame = inAnyRoom && (roomStatus === 'IN_GAME' || phase !== 'LOBBY');

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-void-bg text-parchment">
      {/* Brilho de velas */}
      <div className="candle pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.07),transparent_60%)]" />

      {/* Barra superior */}
      <header className="relative z-40 flex items-center justify-between px-4 py-2 border-b border-iron/40 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="font-grimoire font-extrabold tracking-[0.25em] text-parchment text-sm">
            STRIKE<span className="text-blood-bright">/</span>VOID
          </div>

          {inAnyRoom && (
            <button
              onClick={handleCopyHeaderCode}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-gold-aged/50 bg-black/60 font-mono text-[11px] text-gold-aged hover:bg-gold-aged/20 transition-colors shadow-sm"
              title="Clique para copiar código da sala"
            >
              <span>SALA: <strong className="tracking-wider">{gameState.roomCode}</strong></span>
              {copiedCode ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            </button>
          )}
        </div>

        <div className="font-mono text-[11px] text-parchment-dark tracking-widest flex items-center gap-3">
          {inGame && <span className="text-parchment">ROUND {gameState.round}</span>}
          {inAnyRoom && <span className="text-gold-aged">{PHASE_LABELS[phase]}</span>}
        </div>

        <div className="flex items-center gap-2">
          <AudioControls />
          {inAnyRoom && (
            <button
              id="btn-settings"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded border border-gold-aged/70 text-[11px] font-mono text-gold-aged hover:bg-gold-aged/10 transition-colors"
            >
              <Settings size={13} /> <span className="hidden sm:inline">REGRAS</span>
            </button>
          )}
          {inAnyRoom && (
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-iron text-[11px] font-mono text-parchment-dark hover:text-white hover:bg-blood/40 hover:border-blood-bright transition-colors"
              title="Sair da sala"
            >
              <LogOut size={12} /> <span className="hidden sm:inline">SAIR</span>
            </button>
          )}
        </div>
      </header>

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
          onCopyCode={(code) => showToast(`Código ${code} copiado!`, 'success')}
        />
      ) : (
        /* 3. Mesa de Partida em Andamento */
        <>
          <main className="relative flex-1 min-h-0 flex items-center justify-center">
            <div className="relative" style={{ width: 'min(100%, calc(100vh - 300px))', aspectRatio: '1 / 1' }}>
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
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5">
                <CentralClock socket={socket} myAllowedTime={me?.allowedTime} phase={phase} locked={!!me?.lockedIn || !me?.isAlive} />
                {phase === 'ANALYSIS' && (
                  <div className="flex flex-col gap-1.5">
                    <button
                      id="btn-pause"
                      onClick={() => socket.emit('toggle_pause')}
                      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded border border-gold-aged bg-black/80 text-gold-aged text-[10px] font-mono font-bold hover:bg-gold-aged/20"
                    >
                      <Pause size={11} /> {gameState.isPaused ? '▶️ CONTINUAR LEITURA' : '⏸️ PAUSAR LOGS'}
                    </button>
                    <button
                      id="btn-skip"
                      onClick={() => socket.emit('skip_analysis')}
                      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded border border-blood-bright bg-black/80 text-blood-bright text-[10px] font-mono font-bold hover:bg-blood/30"
                    >
                      <SkipForward size={11} /> ⏭️ PRÓXIMO ROUND
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
                  className="absolute left-1/2 -translate-x-1/2 bottom-[2%] z-50 px-3 py-1 rounded border-2 border-blood-bright bg-black/90 text-blood-bright text-[10px] font-mono font-bold text-center max-w-[80%]"
                >
                  🔒 VOCÊ ESTÁ EMPAREDADO: SÓ PODE USAR CARTAS EM SI MESMO OU PASSAR A VEZ
                </motion.div>
              )}
            </div>
          </main>

          {/* Mão de cartas */}
          <footer className="relative z-40 h-[200px] flex items-end justify-center pb-3">
            {me && me.isAlive ? (
              <div className="flex items-end gap-4">
                <AnimatePresence>
                  {me.hand.map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ y: -420, opacity: 0, rotate: -12 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      exit={{ y: -60, opacity: 0 }}
                      transition={{ delay: i * 0.18, type: 'spring', stiffness: 120, damping: 16 }}
                    >
                      <InscryptionCard
                        card={card}
                        isSelected={card.id === selectedCardId}
                        onClick={onCardClick}
                        onDragStart={onCardDragStart}
                        onDragEnd={() => (dragCardRef.current = null)}
                        disabled={!canAct}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="font-grimoire text-parchment-dark tracking-widest text-sm pb-8">
                {me ? '💀 VOCÊ FOI ELIMINADO — ASSISTINDO DA ESCURIDÃO' : '👁 ESPECTADOR'}
              </div>
            )}
          </footer>

          {/* Controles à direita */}
          {me && me.isAlive && (
            <div className="absolute bottom-3 right-3 z-40 flex flex-col gap-2 w-[200px]">
              {canAct && selectedCard && (
                <button
                  id="btn-self-target"
                  onClick={() => sendAction(selectedCard.id, me.id)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded border-2 border-gold-aged bg-black/80 text-gold-aged font-grimoire font-bold text-xs hover:bg-gold-aged/20"
                >
                  <Crosshair size={14} /> MIRAR EM MIM MESMO
                </button>
              )}
              <button
                id="btn-pass"
                disabled={!canAct}
                onClick={() => socket.emit('pass_turn')}
                className="flex items-center justify-center gap-1.5 py-2 rounded border-2 border-iron bg-black/80 text-parchment-dark font-grimoire font-bold text-xs hover:border-parchment disabled:opacity-30"
              >
                <Hand size={14} /> PASSAR A VEZ
              </button>
              <div className="text-[10px] font-mono text-parchment-dark text-center leading-tight">
                {canAct
                  ? selectedCard
                    ? 'Clique num assento piscando ou arraste a carta'
                    : 'Clique OU arraste uma carta até um assento'
                  : phase === 'PLANNING'
                    ? 'Jogada travada. Aguardando mesa...'
                    : ''}
              </div>
            </div>
          )}

          <LogPanel logs={logs} />
        </>
      )}

      {/* Modal de Configurações */}
      {gameState?.settings && (
        <SettingsModal
          open={showSettings}
          settings={gameState.settings}
          aliveCount={aliveCount || players.length}
          onClose={() => setShowSettings(false)}
          onSave={(s) => socket.emit('update_settings', s)}
        />
      )}

      {/* Fim de jogo */}
      <AnimatePresence>
        {phase === 'GAME_OVER' && (
          <motion.div
            key="gameover"
            className="absolute inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="rounded-lg border-4 border-gold-aged bg-wood-dark px-10 py-8 text-center shadow-[0_0_80px_rgba(212,175,55,0.4)] max-w-md w-full mx-4"
            >
              {gameState?.winner ? (
                <Trophy className="mx-auto text-gold-aged mb-2" size={48} />
              ) : (
                <SkullIcon className="mx-auto text-blood-bright mb-2" size={48} />
              )}
              <div className="font-grimoire font-extrabold text-3xl tracking-widest text-parchment">
                {gameState?.winner ? gameState.winner.name : 'NINGUÉM'}
              </div>
              <div className="font-typewriter text-parchment-dark mt-1 mb-6">
                {gameState?.winner ? 'sobreviveu ao Void.' : 'foi engolido pelo Void. Empate.'}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  id="btn-restart"
                  onClick={handleRestartGame}
                  className="w-full py-2.5 rounded border-2 border-gold-aged bg-blood/80 hover:bg-blood text-parchment font-grimoire font-bold tracking-wider transition-colors shadow-[0_0_15px_rgba(139,0,0,0.5)]"
                >
                  VOLTAR AO LOBBY DA SALA
                </button>
                <button
                  onClick={handleLeaveRoom}
                  className="w-full py-2 rounded border border-iron/80 bg-black/60 hover:bg-black text-parchment-dark hover:text-white font-mono text-xs transition-colors"
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
            className={`absolute top-14 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 rounded border-2 font-mono text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 ${
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
    </div>
  );
}

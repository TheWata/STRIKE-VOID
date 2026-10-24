import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnimationControls, useReducedMotion } from 'framer-motion';
import { socketService, audioService, storageService } from '../services/socketService';
import { DEFAULT_MAX_HP } from '../models/gameModel';
import { canTargetPlayer } from '../models/cardModel';
import { useCompactLayout } from '../lib/useMediaQuery';

export function useGameController() {
  const [gameState, setGameState] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [, setConnected] = useState(socketService.socket.connected);
  const [hitKey, setHitKey] = useState(0);

  const dragCardRef = useRef(null);
  const toastTimer = useRef(null);
  const prevHpRef = useRef(null);

  const compact = useCompactLayout();
  const reduceMotion = useReducedMotion();
  const shakeControls = useAnimationControls();

  const [nickname, setNickname] = useState(() => storageService.getNickname());

  useEffect(() => {
    if (nickname) storageService.setNickname(nickname);
  }, [nickname]);

  const showToast = useCallback((msg, type = 'error') => {
    if (type === 'error') audioService.play('error');
    setToast({ text: msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const socket = socketService.socket;
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
    const onLeftRoom = () => setGameState(null);
    const onHostMigrated = ({ newHostId }) => {
      const isMe = socket.id === newHostId;
      showToast(
        isMe ? '👑 Você agora é o líder da sala!' : '👑 A liderança da sala foi transferida.',
        'info'
      );
    };
    const onConnect = () => {
      setConnected(true);
      socketService.refreshPublicRooms();
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

    socketService.refreshPublicRooms();

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
  const isHost = gameState?.hostId && socketService.socket.id === gameState.hostId;
  const phase = gameState?.phase || 'LOBBY';
  const roomStatus = gameState?.roomStatus || 'LOBBY';
  const localIndex = Math.max(0, players.findIndex((p) => p.id === gameState?.you));
  const aliveCount = players.filter((p) => p.isAlive).length;

  const myHp = me ? (me.hp ?? me.lives) : null;
  const myMaxHp = me
    ? (me.maxHp ?? me.maxLives ?? gameState?.maxHp ?? DEFAULT_MAX_HP)
    : DEFAULT_MAX_HP;

  useEffect(() => {
    if (phase !== 'PLANNING' || me?.lockedIn) setSelectedCardIds([]);
  }, [phase, me?.lockedIn]);

  /* ---------------- FEEDBACK DE DANO ---------------- */
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

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const ps = s.players;
    const you = s.you;
    const fxCount = (fx) => ps.filter((p) => p.visualEffect === fx).length;
    const revealed = (type) =>
      ps.some((p) => p.selectedAction && !p.selectedAction.hidden && p.selectedAction.cardType === type);
    const aliveNow = ps.filter((p) => p.isAlive).length;

    switch (s.phase) {
      case 'DEALING':
        audioService.play('shuffle');
        [0, 1, 2].forEach((i) => audioService.play('deal', 0.3 + i * 0.18));
        break;
      case 'PLANNING':
        audioService.play('bell');
        break;
      case 'REVEAL_REVERSO':
        if (revealed('REVERSO')) audioService.play('flip');
        if (fxCount('REFLECT')) audioService.play('reflect', 0.55);
        if (fxCount('VACUUM')) {
          audioService.play('vacuum', 0.5);
          audioService.play('damage', 1.45);
        }
        break;
      case 'REVEAL_PAREDE':
        if (revealed('PAREDE')) audioService.play('flip');
        if (fxCount('WALLED')) audioService.play('wall', 0.55);
        break;
      case 'REVEAL_SUPORTE':
        audioService.play('flip');
        if (fxCount('HEAL') || fxCount('SOUL_SWAP') || fxCount('SOUL_BUFF')) {
          audioService.play('reflect', 0.45);
        }
        if (fxCount('OVERDOSE')) {
          audioService.play('vacuum', 0.5);
        }
        if (fxCount('REVEALED') || fxCount('SYRINGE_EMPTY')) {
          audioService.play('deal', 0.4);
        }
        break;
      case 'REVEAL_ESPECIAIS':
        audioService.play('flip');
        if (fxCount('BLOOD_PACT') || fxCount('DAMAGE')) audioService.play('damage', 0.5);
        if (fxCount('PACT_BROKEN')) audioService.play('wallBreak', 0.45);
        if (fxCount('DEATH_MARKED')) audioService.play('vacuum', 0.5);
        if (fxCount('DISARMED')) audioService.play('deal', 0.4);
        break;
      case 'REVEAL_FACA':
        if (revealed('FACA')) {
          audioService.play('flip');
          audioService.play('knife', 0.55);
        }
        if (fxCount('WALL_BROKEN')) audioService.play('wallBreak', 0.75);
        if (fxCount('DAMAGE') || fxCount('DEATH_MARK_KILL')) audioService.play('damage', 0.8);
        if (aliveNow < audioPrev.current.alive) audioService.play('death', 1.5);
        break;
      case 'ANALYSIS':
        audioService.play('analysis');
        break;
      case 'GAME_OVER':
        if (aliveNow < audioPrev.current.alive) audioService.play('death', 0.2);
        audioService.play(s.winner && s.winner.id === you ? 'win' : 'lose', 1.2);
        break;
      default:
        break;
    }
    audioPrev.current.alive = aliveNow;
    audioPrev.current.lockedOthers = 0;
  }, [gameState?.phase, gameState?.round]);

  useEffect(() => {
    if (phase === 'PLANNING' && me?.lockedIn) audioService.play('lock');
  }, [me?.lockedIn, phase]);

  const lockedOthers = players.filter((p) => p.id !== me?.id && p.isAlive && p.lockedIn).length;
  useEffect(() => {
    if (phase === 'PLANNING' && lockedOthers > audioPrev.current.lockedOthers) {
      audioService.play('lockOther');
    }
    audioPrev.current.lockedOthers = lockedOthers;
  }, [lockedOthers, phase]);

  useEffect(() => {
    const inMatch = roomStatus === 'IN_GAME' && phase !== 'LOBBY' && phase !== 'GAME_OVER';
    audioService.setPlayerState({
      inGame: inMatch,
      isAlive: !!me?.isAlive,
      lives: me?.lives ?? 3,
      phase,
    });
  }, [roomStatus, phase, me?.lives, me?.isAlive]);

  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target.closest && e.target.closest('button');
      if (btn && !btn.disabled) audioService.play('click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const discardLimit = gameState?.settings?.discardLimit ?? 2;
  const selectedCard =
    selectedCardIds.length === 1
      ? me?.hand?.find((c) => c.id === selectedCardIds[0]) || null
      : null;
  const canAct = phase === 'PLANNING' && !!me?.isAlive && !me?.lockedIn;
  const walled = !!me?.isWalled;

  const isTargetable = useCallback(
    (targetPlayer) =>
      canTargetPlayer({
        canAct,
        selectedCard,
        targetPlayer,
        me,
      }),
    [canAct, selectedCard, me]
  );

  const sendAction = useCallback((cardId, targetId) => {
    if (!cardId) return;
    socketService.selectAction(cardId, targetId);
    setSelectedCardIds([]);
  }, []);

  const onSeatClick = useCallback(
    (p) => {
      if (selectedCard && isTargetable(p)) {
        sendAction(selectedCard.id, p.id);
      } else if (selectedCard && canAct) {
        if (p.id === me?.id) {
          showToast('Esta carta deve ser usada contra outro jogador na mesa!');
        } else if (walled && selectedCard.type !== 'PACTO_SANGUE') {
          showToast(
            'Você está EMPAREDADO! Só pode mirar em si mesmo, usar Pacto de Sangue ou descartar/passar.'
          );
        }
      }
    },
    [selectedCard, isTargetable, sendAction, canAct, me?.id, walled, showToast]
  );

  const onDropCard = useCallback(
    (p, e) => {
      const cardId = e.dataTransfer.getData('text/plain') || dragCardRef.current;
      dragCardRef.current = null;
      if (!canAct || !cardId) return;
      const card = me?.hand?.find((c) => c.id === cardId);
      if (!card) return;
      if (!canTargetPlayer({ canAct, selectedCard: card, targetPlayer: p, me })) {
        if (p.id === me?.id) {
          showToast('Esta carta só pode ser usada em outro jogador!');
        } else {
          showToast(
            'Você está EMPAREDADO! Só pode usar cartas em si mesmo, usar Pacto de Sangue ou passar/descartar.'
          );
        }
        return;
      }
      sendAction(cardId, p.id);
    },
    [canAct, me, sendAction, showToast]
  );

  const onCardClick = useCallback(
    (card) => {
      audioService.play('select');
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
    },
    [gameState?.settings?.discardLimit]
  );

  const onCardDragStart = useCallback((e, card) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
    dragCardRef.current = card.id;
    setSelectedCardIds([card.id]);
  }, []);

  const handleDiscard = useCallback(() => {
    if (selectedCardIds.length === 0) {
      audioService.play('lock');
      socketService.passTurn();
    } else {
      audioService.play('lock');
      socketService.discardCards(selectedCardIds);
    }
    setSelectedCardIds([]);
  }, [selectedCardIds]);

  const handlePassTurn = useCallback(() => {
    audioService.play('lock');
    socketService.passTurn();
    setSelectedCardIds([]);
  }, []);

  const logs = useMemo(() => gameState?.logs || [], [gameState?.logs]);

  const handleJoinRoom = useCallback(
    (roomCode) => {
      const cleanPlayer = nickname.trim() || 'CONDENADO';
      socketService.joinRoom(cleanPlayer, roomCode);
    },
    [nickname]
  );

  const handleCreateRoom = useCallback(
    ({ roomName, isPublic, initialHandCards }) => {
      const cleanPlayer = nickname.trim() || 'CONDENADO';
      socketService.createRoom({
        playerName: cleanPlayer,
        roomName,
        isPublic,
        initialHandCards,
      });
    },
    [nickname]
  );

  const handleLeaveRoom = useCallback(() => {
    socketService.leaveRoom();
    setGameState(null);
    setShowLogs(false);
  }, []);

  const handleSendChat = useCallback((text) => {
    if (!text || !text.trim()) return;
    audioService.play('scribble');
    socketService.sendChat(text.trim());
  }, []);

  const handleCopyHeaderCode = useCallback(() => {
    if (gameState?.roomCode) {
      navigator.clipboard?.writeText(gameState.roomCode);
      setCopiedCode(true);
      showToast(`Código ${gameState.roomCode} copiado!`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [gameState?.roomCode, showToast]);

  const inAnyRoom = Boolean(gameState?.roomCode);
  const inGame = inAnyRoom && (roomStatus === 'IN_GAME' || phase !== 'LOBBY');
  const isDead = me ? !me.isAlive : false;
  const overlayActive = inAnyRoom && !!me && phase !== 'LOBBY' && phase !== 'GAME_OVER';

  return {
    socket: socketService.socket,
    gameState,
    publicRooms,
    players,
    me,
    isHost,
    phase,
    roomStatus,
    localIndex,
    aliveCount,
    myHp,
    myMaxHp,
    inAnyRoom,
    inGame,
    isDead,
    overlayActive,
    compact,
    shakeControls,
    hitKey,
    nickname,
    setNickname,
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
    toast,
    showToast,
    copiedCode,
    handleCopyHeaderCode,
    showSettings,
    setShowSettings,
    showGuide,
    setShowGuide,
    showLogs,
    setShowLogs,
    showMobileMenu,
    setShowMobileMenu,
    handleJoinRoom,
    handleCreateRoom,
    handleLeaveRoom,
    handleSendChat,
    onTogglePrivacy: () => socketService.togglePrivacy(),
    onAddBot: () => socketService.addBot(),
    onRemoveBot: (id) => socketService.removeBot(id),
    onKickPlayer: (id) => socketService.kickPlayer(id),
    onStartGame: () => socketService.startGame(),
    onRestartGame: () => socketService.restartGame(),
    onRefreshRooms: () => socketService.refreshPublicRooms(),
    onUpdateSettings: (s) => {
      socketService.updateSettings(s);
      showToast('Configurações salvas e aplicadas à mesa!', 'success');
    },
    onTogglePause: () => socketService.togglePause(),
    onSkipAnalysis: () => socketService.skipAnalysis(),
  };
}

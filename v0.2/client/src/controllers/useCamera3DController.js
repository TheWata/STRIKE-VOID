import { useState, useCallback, useEffect, useRef } from 'react';
import { CAMERA_ZONES } from '../models/gameModel';

/**
 * Controller da Câmera 3D em Primeira Pessoa:
 * - Mantém a mão de cartas 100% estável durante a inspeção e seleção de cartas.
 * - Nunca aciona o chat/caderno apenas por passar o mouse sobre as cartas ou botões.
 * - O acesso embaixo da mesa (NOTEBOOK) só ocorre quando o cursor entra intencionalmente
 *   na faixa exclusiva no limite inferior da tela (ou via clique / tecla Seta Baixo).
 */
export function useCamera3DController({ inGame }) {
  const [cameraZone, setCameraZone] = useState(CAMERA_ZONES.CARDS);
  const [cameraLocked, setCameraLocked] = useState(false);
  // Parallax amortecido via requestAnimationFrame (damped easing / lerp)
  // atualizando variáveis CSS no elemento raiz sem re-render do React.
  const stageElRef = useRef(null);
  const rafRef = useRef(0);
  const targetParallaxRef = useRef({ x: 0, y: 0 });
  const currentParallaxRef = useRef({ x: 0, y: 0 });
  const rafRunningRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const isTypingChatRef = useRef(false);
  const isOverHandOrControlsRef = useRef(false);
  const bottomTriggerTimerRef = useRef(null);
  const zoneRef = useRef(CAMERA_ZONES.CARDS);

  useEffect(() => {
    zoneRef.current = cameraZone;
  }, [cameraZone]);

  // Monitora preferência de redução de movimento para desativar parallax
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mql.matches;
    const onChange = (e) => {
      reducedMotionRef.current = e.matches;
      if (e.matches && stageElRef.current) {
        stageElRef.current.style.setProperty('--px', '0');
        stageElRef.current.style.setProperty('--py', '0');
        stageElRef.current.style.setProperty('--bg-px', '0px');
        stageElRef.current.style.setProperty('--bg-py', '0px');
        stageElRef.current.style.setProperty('--table-rx', '0deg');
        stageElRef.current.style.setProperty('--table-rz', '0deg');
        stageElRef.current.style.setProperty('--sil-px', '0px');
      }
    };
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    return () => {
      if (bottomTriggerTimerRef.current) {
        clearTimeout(bottomTriggerTimerRef.current);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /** Ref callback do contêiner da cena: recebe as variáveis CSS de parallax. */
  const stageRef = useCallback((el) => {
    stageElRef.current = el;
  }, []);

  /** Loop rAF com interpolação suave (damped easing / lerp 0.09) */
  const updateParallaxFrame = useCallback(() => {
    const el = stageElRef.current;
    if (!el || reducedMotionRef.current) {
      rafRunningRef.current = false;
      return;
    }

    const cur = currentParallaxRef.current;
    const tgt = targetParallaxRef.current;

    // Fator lerp: 0.09 confere peso e inércia orgânica sem atraso perceptual
    cur.x += (tgt.x - cur.x) * 0.09;
    cur.y += (tgt.y - cur.y) * 0.09;

    const diffX = Math.abs(tgt.x - cur.x);
    const diffY = Math.abs(tgt.y - cur.y);

    // Amplitudes calibradas e contidas:
    // Background no sentido oposto para profundidade (-9px a +9px)
    // Inclinação sutil da mesa (-2.4deg a +2.4deg)
    // Rolagem horizontal da mesa (-1.6deg a +1.6deg)
    // Compensação leve nas silhuetas (+2.5px a -2.5px)
    el.style.setProperty('--px', cur.x.toFixed(3));
    el.style.setProperty('--py', cur.y.toFixed(3));
    el.style.setProperty('--bg-px', (cur.x * -9).toFixed(2) + 'px');
    el.style.setProperty('--bg-py', (cur.y * -6).toFixed(2) + 'px');
    el.style.setProperty('--table-rx', (cur.y * -2.4).toFixed(2) + 'deg');
    el.style.setProperty('--table-rz', (cur.x * -1.6).toFixed(2) + 'deg');
    el.style.setProperty('--sil-px', (cur.x * 2.5).toFixed(2) + 'px');

    if (diffX > 0.001 || diffY > 0.001) {
      rafRef.current = requestAnimationFrame(updateParallaxFrame);
    } else {
      rafRunningRef.current = false;
    }
  }, []);

  const scheduleParallax = useCallback(
    (targetX, targetY) => {
      if (reducedMotionRef.current) return;
      // Clamping estrito entre -1 e 1
      const clampedX = Math.max(-1, Math.min(1, targetX));
      const clampedY = Math.max(-1, Math.min(1, targetY));

      targetParallaxRef.current = { x: clampedX, y: clampedY };

      if (!rafRunningRef.current) {
        rafRunningRef.current = true;
        rafRef.current = requestAnimationFrame(updateParallaxFrame);
      }
    },
    [updateParallaxFrame]
  );

  const setTypingChat = useCallback((typing) => {
    isTypingChatRef.current = Boolean(typing);
  }, []);

  const setOverHandOrControls = useCallback((isOver) => {
    isOverHandOrControlsRef.current = Boolean(isOver);
    if (isOver && bottomTriggerTimerRef.current) {
      clearTimeout(bottomTriggerTimerRef.current);
      bottomTriggerTimerRef.current = null;
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!inGame) return;
      const vw = Math.max(1, window.innerWidth);
      const vh = Math.max(1, window.innerHeight);
      // Coordenadas normalizadas estritas [-1, 1]
      const relX = Math.max(-1, Math.min(1, (e.clientX / vw - 0.5) * 2));
      const relY = Math.max(-1, Math.min(1, (e.clientY / vh - 0.5) * 2));

      scheduleParallax(relX, relY);

      if (cameraLocked) return;

      // Verifica se o cursor está sobre cartas ou botões de ação da mão
      const inHandZone =
        isOverHandOrControlsRef.current ||
        Boolean(e.target?.closest?.('[data-hand-zone="true"]'));

      if (inHandZone && bottomTriggerTimerRef.current) {
        clearTimeout(bottomTriggerTimerRef.current);
        bottomTriggerTimerRef.current = null;
      }

      const current = zoneRef.current;

      // Quando o caderno/chat sob a mesa está aberto, mantém a visão estável sob a mesa
      // sem fechar involuntariamente ao mover o cursor para ler regras, cartas ou chat.
      if (current === CAMERA_ZONES.NOTEBOOK) {
        return;
      }

      // Se o cursor está interagindo com a mão de cartas ou controles de turno, mantém estável em CARDS
      if (inHandZone) {
        if (current !== CAMERA_ZONES.CARDS) {
          setCameraZone(CAMERA_ZONES.CARDS);
        }
        return;
      }

      // Transição suave apenas entre olhar mais para os oponentes (topo) e olhar para a mesa/cartas
      if (relY < 0.28) {
        if (current !== CAMERA_ZONES.PLAYERS) setCameraZone(CAMERA_ZONES.PLAYERS);
      } else if (relY >= 0.34) {
        if (current !== CAMERA_ZONES.CARDS) setCameraZone(CAMERA_ZONES.CARDS);
      }
    },
    [inGame, cameraLocked, scheduleParallax]
  );

  /**
   * Acionado exclusivamente quando o cursor entra na faixa intencional no extremo inferior da tela.
   */
  const handleBottomEdgeEnter = useCallback(() => {
    if (!inGame || cameraLocked || isOverHandOrControlsRef.current) return;
    if (bottomTriggerTimerRef.current) clearTimeout(bottomTriggerTimerRef.current);
    bottomTriggerTimerRef.current = setTimeout(() => {
      if (!isOverHandOrControlsRef.current && zoneRef.current !== CAMERA_ZONES.NOTEBOOK) {
        setCameraZone(CAMERA_ZONES.NOTEBOOK);
      }
    }, 110);
  }, [inGame, cameraLocked]);

  const handleBottomEdgeLeave = useCallback(() => {
    if (bottomTriggerTimerRef.current) {
      clearTimeout(bottomTriggerTimerRef.current);
      bottomTriggerTimerRef.current = null;
    }
  }, []);

  // Atalhos de teclado (Setas Cima/Baixo ou W/S quando não está digitando em input)
  useEffect(() => {
    if (!inGame) return;
    const onKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setCameraZone((prev) =>
          prev === CAMERA_ZONES.NOTEBOOK ? CAMERA_ZONES.CARDS : CAMERA_ZONES.PLAYERS
        );
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setCameraZone((prev) =>
          prev === CAMERA_ZONES.PLAYERS ? CAMERA_ZONES.CARDS : CAMERA_ZONES.NOTEBOOK
        );
      } else if (e.key === 'Escape' && zoneRef.current === CAMERA_ZONES.NOTEBOOK) {
        setCameraZone(CAMERA_ZONES.CARDS);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inGame]);

  const selectZone = useCallback((zone, lock = false) => {
    if (bottomTriggerTimerRef.current) {
      clearTimeout(bottomTriggerTimerRef.current);
      bottomTriggerTimerRef.current = null;
    }
    setCameraZone(zone);
    if (lock) setCameraLocked(true);
  }, []);

  const toggleLock = useCallback(() => {
    setCameraLocked((v) => !v);
  }, []);

  return {
    cameraZone,
    setCameraZone,
    cameraLocked,
    toggleLock,
    selectZone,
    stageRef,
    handleMouseMove,
    handleBottomEdgeEnter,
    handleBottomEdgeLeave,
    setOverHandOrControls,
    setTypingChat,
  };
}

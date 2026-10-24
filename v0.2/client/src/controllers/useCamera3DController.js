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
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const isTypingChatRef = useRef(false);
  const isOverHandOrControlsRef = useRef(false);
  const bottomTriggerTimerRef = useRef(null);
  const zoneRef = useRef(CAMERA_ZONES.CARDS);

  useEffect(() => {
    zoneRef.current = cameraZone;
  }, [cameraZone]);

  useEffect(() => {
    return () => {
      if (bottomTriggerTimerRef.current) {
        clearTimeout(bottomTriggerTimerRef.current);
      }
    };
  }, []);

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
      const relX = (e.clientX / vw - 0.5) * 2; // -1 a 1
      const relY = e.clientY / vh; // 0 (topo) a 1 (base)

      setParallax({
        x: Number((relX * 2.8).toFixed(2)),
        y: Number(((relY - 0.5) * 3.2).toFixed(2)),
      });

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

      // Quando o caderno/chat sob a mesa está aberto:
      if (current === CAMERA_ZONES.NOTEBOOK) {
        if (isTypingChatRef.current && relY > 0.2) {
          return;
        }
        // Só fecha automaticamente ao subir o cursor de volta para a região superior da mesa
        if (relY < 0.26) {
          setCameraZone(CAMERA_ZONES.PLAYERS);
        } else if (relY < 0.34 && !isTypingChatRef.current) {
          setCameraZone(CAMERA_ZONES.CARDS);
        }
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
    [inGame, cameraLocked]
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
    parallax,
    handleMouseMove,
    handleBottomEdgeEnter,
    handleBottomEdgeLeave,
    setOverHandOrControls,
    setTypingChat,
  };
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { CAMERA_ZONES } from '../models/gameModel';

/**
 * Controller da Câmera 3D em Primeira Pessoa (estilo Inscryption):
 * - Mouse para cima (topo da tela)     -> CAMERA_ZONES.PLAYERS (Olha para as silhuetas dos jogadores)
 * - Mouse no meio / baixo (cartas)     -> CAMERA_ZONES.CARDS   (Olha para a mesa e cartas na mão)
 * - Mouse mais embaixo (borda inferior)-> CAMERA_ZONES.NOTEBOOK(Acessa o caderno de anotações e chat)
 */
export function useCamera3DController({ inGame }) {
  const [cameraZone, setCameraZone] = useState(CAMERA_ZONES.CARDS);
  const [cameraLocked, setCameraLocked] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const isTypingChatRef = useRef(false);
  const zoneRef = useRef(CAMERA_ZONES.CARDS);
  zoneRef.current = cameraZone;

  const setTypingChat = useCallback((typing) => {
    isTypingChatRef.current = Boolean(typing);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!inGame) return;
      const vw = Math.max(1, window.innerWidth);
      const vh = Math.max(1, window.innerHeight);
      const relX = (e.clientX / vw - 0.5) * 2; // -1 a 1
      const relY = e.clientY / vh; // 0 (topo) a 1 (base)

      setParallax({
        x: Number((relX * 4.5).toFixed(2)),
        y: Number(((relY - 0.5) * 5).toFixed(2)),
      });

      if (cameraLocked) return;

      // Se o jogador estiver digitando no input do caderno, mantém no caderno até ele subir bem o mouse
      if (isTypingChatRef.current && relY > 0.25) {
        return;
      }

      const current = zoneRef.current;

      // Histerese suave para evitar oscilação nas bordas de transição:
      if (current === CAMERA_ZONES.NOTEBOOK) {
        // Quando o caderno já está aberto embaixo, só fecha ao subir o mouse acima de 36% da tela
        if (relY < 0.28) {
          setCameraZone(CAMERA_ZONES.PLAYERS);
        } else if (relY < 0.42 && !isTypingChatRef.current) {
          setCameraZone(CAMERA_ZONES.CARDS);
        }
        return;
      }

      if (relY < 0.36) {
        if (current !== CAMERA_ZONES.PLAYERS) setCameraZone(CAMERA_ZONES.PLAYERS);
      } else if (relY > 0.87) {
        if (current !== CAMERA_ZONES.NOTEBOOK) setCameraZone(CAMERA_ZONES.NOTEBOOK);
      } else if (relY >= 0.40 && relY <= 0.84) {
        if (current !== CAMERA_ZONES.CARDS) setCameraZone(CAMERA_ZONES.CARDS);
      }
    },
    [inGame, cameraLocked]
  );

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
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inGame]);

  const selectZone = useCallback((zone, lock = false) => {
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
    setTypingChat,
  };
}

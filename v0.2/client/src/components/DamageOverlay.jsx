import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Feedback visual de dano estilo FPS.
 *
 *  - Hit Flash: overlay vermelho (opacidade 0.65 -> 0 em ~400ms) disparado a cada perda de HP (hitKey muda).
 *  - Vinheta de sangramento: persistente nas bordas, proporcional a damageRatio = 1 - hp/maxHp.
 *      HP cheio ......... invisível
 *      Ferido (hp > 1) .. bordas avermelhadas, pulsação lenta
 *      Crítico (hp = 1) . vinheta intensa e fechada, batimento cardíaco acelerado
 *      Morto (hp = 0) ... filtro acinzentado/escuro de morte
 *
 * O Screen Shake fica no container principal (App.jsx), pois precisa mover o jogo e não o overlay.
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Calcula o estado e os parâmetros de intensidade da vinheta. Exportado para facilitar testes. */
export function computeBleed(hp, maxHp, active) {
  const safeMax = Math.max(1, Number(maxHp) || 1);
  const cur = clamp(Number.isFinite(Number(hp)) ? Number(hp) : safeMax, 0, safeMax);
  const damageRatio = 1 - cur / safeMax;

  if (!active) return { mode: 'idle', cur, damageRatio };
  if (cur === 0) return { mode: 'dead', cur, damageRatio };
  if (cur === 1) return { mode: 'critical', cur, damageRatio };
  if (cur < safeMax) return { mode: 'wounded', cur, damageRatio };
  return { mode: 'idle', cur, damageRatio };
}

function vignetteStyle(mode, damageRatio) {
  if (mode === 'critical') {
    // Escura e fechada nas bordas; elipse alta (85% de altura) preserva o centro e a base (cartas) mais limpos
    return {
      background:
        'radial-gradient(ellipse 62% 85% at 50% 50%, transparent 0%, transparent 52%, rgba(110,0,0,0.55) 76%, rgba(55,0,0,0.94) 100%)',
      boxShadow: 'inset 0 0 130px 24px rgba(120,0,0,0.85), inset 0 0 40px 6px rgba(0,0,0,0.6)',
    };
  }
  // Ferido: fechamento e opacidade escalam com a proporção de vida perdida
  const clearStop = Math.round(74 - damageRatio * 28); // 74% (leve) -> ~57% (muito ferido)
  const alpha = (0.28 + damageRatio * 0.55).toFixed(2);
  const edge = (0.5 + damageRatio * 0.4).toFixed(2);
  return {
    background: `radial-gradient(ellipse 62% 85% at 50% 50%, transparent 0%, transparent ${clearStop}%, rgba(139,0,0,${alpha}) 88%, rgba(90,0,0,${edge}) 100%)`,
    boxShadow: `inset 0 0 ${Math.round(60 + damageRatio * 90)}px ${Math.round(6 + damageRatio * 22)}px rgba(139,0,0,${(0.22 + damageRatio * 0.4).toFixed(2)})`,
  };
}

export default function DamageOverlay({ hp, maxHp, active, hitKey }) {
  const reduceMotion = useReducedMotion();
  const { mode, cur, damageRatio } = computeBleed(hp, maxHp, active);

  let bleed = null;

  if (mode === 'wounded') {
    bleed = (
      <motion.div
        key={`wounded-${cur}`}
        className="fixed inset-x-0 bottom-0 top-[48px] sm:top-[56px] pointer-events-none z-30 overflow-hidden"
        style={vignetteStyle('wounded', damageRatio)}
        initial={{ opacity: 0 }}
        animate={reduceMotion ? { opacity: 0.9 } : { opacity: [0.65, 1, 0.65] }}
        transition={reduceMotion ? { duration: 0.6 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  } else if (mode === 'critical') {
    // Batimento cardíaco "lub-dub" acelerado
    bleed = (
      <motion.div
        key="critical"
        className="fixed inset-x-0 bottom-0 top-[48px] sm:top-[56px] pointer-events-none z-30 overflow-hidden"
        style={{ ...vignetteStyle('critical', damageRatio), transformOrigin: '50% 50%' }}
        initial={{ opacity: 0 }}
        animate={
          reduceMotion
            ? { opacity: 1 }
            : { opacity: [0.62, 1, 0.74, 1, 0.62], scale: [1, 1.035, 1, 1.03, 1] }
        }
        transition={
          reduceMotion
            ? { duration: 0.4 }
            : { duration: 0.8, repeat: Infinity, ease: 'easeOut', times: [0, 0.14, 0.3, 0.44, 1] }
        }
      />
    );
  } else if (mode === 'dead') {
    bleed = (
      <motion.div
        key="dead"
        className="fixed inset-x-0 bottom-0 top-[48px] sm:top-[56px] pointer-events-none z-30 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 70% 85% at 50% 50%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.78) 100%)',
          backdropFilter: 'grayscale(1) brightness(0.62) contrast(1.1)',
          WebkitBackdropFilter: 'grayscale(1) brightness(0.62) contrast(1.1)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
    );
  }

  return (
    <>
      {bleed}
      {hitKey > 0 && (
        <motion.div
          key={`flash-${hitKey}`}
          aria-hidden
          className="fixed inset-x-0 bottom-0 top-[48px] sm:top-[56px] pointer-events-none z-30 bg-red-600"
          initial={{ opacity: 0.65 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}
    </>
  );
}

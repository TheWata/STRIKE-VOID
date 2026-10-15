import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';
import { Skull, skullSizeClass } from './PlayerSeat';
import { cn } from '../lib/cn';

const ICON = { FACA: '🔪', PAREDE: '🧱', REVERSO: '🔄' };

/** Resumo textual da jogada de um jogador (substitui as setas SVG da mesa no layout compacto). */
function describeAction(player, phase, nameOf) {
  if (!player.isAlive) return { text: 'ELIMINADO', tone: 'text-blood-bright' };
  const a = player.selectedAction;

  if (phase === 'PLANNING') {
    return player.lockedIn
      ? { text: '🔒 PRONTO', tone: 'text-gold-aged' }
      : { text: 'PENSANDO…', tone: 'text-parchment-dark' };
  }
  if (phase === 'DEALING' || phase === 'LOBBY' || !a) return null;
  if (a.hidden) return { text: '🎴 OCULTA', tone: 'text-parchment-dark' };
  if (a.cardType === 'NONE') return { text: 'PASSOU', tone: 'text-iron' };

  const reflected = a.status === 'REFLECTED';
  const targets = [a.targetId, ...(a.additionalTargets || [])].filter(Boolean);
  const targetText = targets
    .map((tid) => (tid === player.id ? 'SI' : nameOf(tid)))
    .join(' + ');
  return {
    text: `${reflected ? '↩ ' : ''}${ICON[a.cardType] || ''} → ${targetText}`,
    tone: reflected ? 'text-gold-aged font-bold' : a.cardType === 'FACA' ? 'text-red-400' : a.cardType === 'PAREDE' ? 'text-[#7fa3c0]' : 'text-fuchsia-300',
  };
}

function CompactSeatBase({ player, isMe, phase, targetable, dimmed, onSeatClick, nameOf }) {
  const fx = player.visualEffect;
  const chip = describeAction(player, phase, nameOf);
  const shake = fx === 'DAMAGE' || fx === 'VACUUM';
  const maxLives = player.maxLives || 3;

  return (
    <motion.button
      type="button"
      disabled={!targetable}
      onClick={() => targetable && onSeatClick && onSeatClick(player)}
      animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative w-full min-h-[56px] rounded-md border-2 px-1.5 py-1 flex flex-col gap-0.5 text-left touch-manipulation',
        'bg-gradient-to-b from-wood-mid to-wood-dark shadow-[0_4px_10px_rgba(0,0,0,0.7)] transition-opacity',
        isMe ? 'border-gold-aged' : 'border-iron/70',
        targetable && 'aim-blink border-blood-bright cursor-crosshair',
        !player.isAlive && 'opacity-40 grayscale',
        dimmed && player.isAlive && 'opacity-50',
        fx === 'REFLECT' && 'ring-2 ring-gold-aged shadow-[0_0_14px_rgba(212,175,55,0.8)]',
        fx === 'WALL_BROKEN' && 'ring-2 ring-orange-400'
      )}
      aria-label={`${player.name}: ${player.lives} de ${maxLives} vidas`}
    >
      {/* Flash de dano no tile */}
      {shake && (
        <motion.span
          className="absolute inset-0 rounded bg-blood-bright pointer-events-none"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
        />
      )}

      <div className="flex items-center justify-between gap-1 rounded-sm px-1 bg-gradient-to-r from-[#5a3b27] via-[#8a5a36] to-[#5a3b27] border border-[#2a1810]">
        <span className="font-typewriter text-[10px] sm:text-[11px] text-[#f1e2bd] truncate">{player.name}</span>
        <span
          className={cn(
            'shrink-0 text-[7px] font-mono font-bold px-1 rounded-sm',
            isMe ? 'bg-gold-aged text-black' : player.isBot ? 'bg-iron text-white' : 'bg-parchment-dark text-black'
          )}
        >
          {isMe ? 'VOCÊ' : player.isBot ? 'BOT' : 'HUM'}
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-px">
        {Array.from({ length: maxLives }).map((_, i) => (
          <Skull key={i} alive={i < player.lives} className={skullSizeClass(maxLives, true)} />
        ))}
      </div>

      <div className={cn('text-center text-[9px] font-mono leading-tight truncate min-h-[11px]', chip?.tone)}>
        {chip?.text || '\u00a0'}
      </div>

      {player.isWalled && player.isAlive && (
        <span className="absolute -top-1.5 -right-1 text-[9px] px-1 rounded bg-blue-950 border border-[#7fa3c0] text-[#7fa3c0] font-mono font-bold">
          🧱
        </span>
      )}
      {targetable && (
        <Crosshair size={14} className="absolute top-0.5 left-0.5 text-blood-bright animate-pulse pointer-events-none" />
      )}
    </motion.button>
  );
}

export const CompactSeat = React.memo(CompactSeatBase);
export default CompactSeat;

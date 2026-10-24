import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InscryptionCard from './InscryptionCard';
import { StylizedLifeBar } from './PlayerSilhouette3D';
import { cn } from '../lib/cn';
import { seatAngle, seatPosition } from '../helpers/math3d';

export { seatAngle, seatPosition };

export function skullSizeClass(maxLives, compact = false) {
  if (compact) return maxLives >= 5 ? 'w-3 h-3' : maxLives === 4 ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return maxLives >= 5 ? 'w-[15px] h-[15px]' : maxLives === 4 ? 'w-[17px] h-[17px]' : 'w-6 h-6';
}

export function Skull({ alive, className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2C7 2 4 5.5 4 10c0 2.6 1.2 4.4 3 5.5V20h10v-4.5c1.8-1.1 3-2.9 3-5.5 0-4.5-3-8-8-8z"
        fill={alive ? '#e2d5b5' : '#3a0a0a'}
        stroke="#0a0705"
        strokeWidth="1"
      />
      <circle cx="8.8" cy="10.5" r="2.2" fill="#0a0705" />
      <circle cx="15.2" cy="10.5" r="2.2" fill="#0a0705" />
      <path d="M12 13 l-1.3 2.4 h2.6z" fill="#0a0705" />
      <path d="M9 17.5v2.5M12 17.5v2.5M15 17.5v2.5" stroke="#0a0705" strokeWidth="0.9" />
    </svg>
  );
}

function DamageOverlay() {
  return (
    <motion.div
      className="absolute -inset-4 z-30 rounded-full bg-blood-bright/40 blur-md pointer-events-none"
      initial={{ opacity: 0.85 }}
      animate={{ opacity: [0.85, 0.15, 0.4, 0] }}
      transition={{ duration: 0.9 }}
    />
  );
}

function ReflectOverlay() {
  return (
    <motion.div
      className="absolute -inset-4 z-20 rounded-full pointer-events-none"
      animate={{
        boxShadow: [
          '0 0 10px rgba(212,175,55,0.4)',
          '0 0 28px rgba(253,230,138,0.75)',
          '0 0 10px rgba(212,175,55,0.4)',
        ],
      }}
      transition={{ duration: 0.9, repeat: Infinity }}
    />
  );
}

export function CardSlot({ player, phase, slotStyle }) {
  const action = player.selectedAction;
  let content = null;

  if (phase === 'PLANNING') {
    if (player.lockedIn) content = <InscryptionCard faceDown small />;
  } else if (phase !== 'DEALING' && phase !== 'LOBBY' && action) {
    if (action.hidden) {
      content = <InscryptionCard faceDown small />;
    } else if (action.cardType === 'NONE') {
      content = (
        <motion.div
          key="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          className="px-2 py-1 text-[9px] text-parchment/60 text-center font-mono tracking-widest uppercase"
          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
        >
          Passou
        </motion.div>
      );
    } else if (action.cardType === 'DISCARD') {
      content = (
        <motion.div
          key="discard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          className="px-2 py-1 text-[9px] text-amber-300/75 text-center font-mono tracking-wider uppercase"
          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
        >
          Descartou {action.discardedCount || 1}
        </motion.div>
      );
    } else if (action.cardType) {
      content = (
        <motion.div
          key={'face-' + action.cardType}
          initial={{ rotateY: 180 }}
          animate={{ rotateY: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
        >
          <InscryptionCard
            card={{ type: action.cardType, charges: action.cardCharges ?? 0 }}
            small
          />
        </motion.div>
      );
    }
  }

  return (
    <div className="absolute z-[20] pointer-events-none" style={slotStyle}>
      <div style={{ perspective: 600 }}>{content}</div>
    </div>
  );
}

function PlayerSeatBase({
  player,
  index,
  localIndex,
  totalPlayers,
  isMe,
  phase,
  targetable,
  dimmed,
  onSeatClick,
  onDropCard,
  allPlayers = [],
}) {
  const [over, setOver] = useState(false);
  const { x, y, angle } = seatPosition(index, localIndex, totalPlayers);
  const slotX = 50 + 20 * Math.cos(angle);
  const slotY = 50 + 19 * Math.sin(angle);
  const fx = player.visualEffect;
  const shake = fx === 'DAMAGE' || fx === 'VACUUM';
  const knifeDmg = player.knifeDamage || 1;
  const pactPartners = (player.bloodPactWith || [])
    .map((pid) => allPlayers.find((p) => p.id === pid)?.name)
    .filter(Boolean);

  return (
    <>
      <div
        className="absolute z-30"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%) translateZ(26px)',
        }}
        onDragOver={(e) => {
          if (!player.isAlive) return;
          e.preventDefault();
          if (!over) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (player.isAlive && onDropCard) onDropCard(player, e);
        }}
        onClick={() => onSeatClick && onSeatClick(player)}
      >
        <motion.div
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'relative px-3 py-1.5 rounded-full transition-all',
            targetable ? 'cursor-crosshair scale-105' : 'cursor-pointer',
            over && 'scale-110',
            !player.isAlive && 'opacity-40 grayscale',
            dimmed && player.isAlive && 'opacity-55'
          )}
        >
          <StylizedLifeBar
            name={player.name}
            lives={player.lives}
            maxLives={player.maxLives}
            isAlive={player.isAlive}
            isMe={isMe}
            targetable={targetable}
            lockedIn={player.lockedIn}
            knifeDmg={knifeDmg}
            pactPartners={pactPartners}
            isWalled={player.isWalled}
            deathMarkTurns={player.deathMarkTurns}
          />

          <AnimatePresence>
            {(fx === 'DAMAGE' || fx === 'VACUUM') && <DamageOverlay key={'dmg-' + fx} />}
            {fx === 'REFLECT' && <ReflectOverlay key="reflect" />}
          </AnimatePresence>
        </motion.div>
      </div>

      <CardSlot
        player={player}
        phase={phase}
        slotStyle={{
          left: `${slotX}%`,
          top: `${slotY}%`,
          transform: 'translate(-50%, -50%) translateZ(16px)',
        }}
      />
    </>
  );
}

export const PlayerSeat = React.memo(PlayerSeatBase);
export default PlayerSeat;

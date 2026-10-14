import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InscryptionCard from './InscryptionCard';
import { cn } from '../lib/cn';

/** Coordenadas polares: jogador local sempre na base inferior (90deg). */
export function seatAngle(index, localIndex, totalPlayers) {
  return ((index - localIndex + totalPlayers) % totalPlayers) * ((2 * Math.PI) / totalPlayers) + Math.PI / 2;
}

export function seatPosition(index, localIndex, totalPlayers, rx = 38, ry = 36) {
  const angle = seatAngle(index, localIndex, totalPlayers);
  return { x: 50 + rx * Math.cos(angle), y: 50 + ry * Math.sin(angle), angle };
}

function Skull({ alive }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden>
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
      {!alive && (
        <path d="M13.5 2.5 L11.5 7 L14 9 L11 13" fill="none" stroke="#0a0705" strokeWidth="1.2" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function WallOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-20 pointer-events-none"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {[10, 30, 50, 70, 90].map((x) => (
          <rect key={x} x={x - 2} y="0" width="4" height="100" fill="#1a110b" stroke="#4a5568" strokeWidth="0.6" />
        ))}
        {[30, 70].map((y) => (
          <g key={y}>
            <path d={`M0 ${y} Q 12 ${y - 6} 25 ${y} T 50 ${y} T 75 ${y} T 100 ${y}`} fill="none" stroke="#6b7685" strokeWidth="1.6" />
            {[12, 37, 62, 87].map((x) => (
              <path key={x} d={`M${x - 3} ${y - 3} L${x + 3} ${y + 3} M${x + 3} ${y - 3} L${x - 3} ${y + 3}`} stroke="#9aa5b4" strokeWidth="1" />
            ))}
          </g>
        ))}
      </svg>
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bottom-1 px-2 py-[2px] rounded text-[10px] font-bold font-mono text-white whitespace-nowrap border border-black"
        animate={{ backgroundColor: ['#8b0000', '#1e3a5f', '#8b0000'], opacity: [1, 0.55, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        🔒 EMPAREDADO
      </motion.div>
    </motion.div>
  );
}

function BrokenWallOverlay() {
  return (
    <motion.div className="absolute inset-0 z-30 pointer-events-none" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
      {[-1, 1].map((dir) => (
        <motion.div
          key={dir}
          className="absolute top-0 h-full w-1/2 overflow-hidden"
          style={{ left: dir === -1 ? 0 : '50%' }}
          initial={{ x: 0, rotate: 0, opacity: 1 }}
          animate={{ x: dir * 50, rotate: dir * 18, opacity: 0 }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-[200%] h-full" style={{ marginLeft: dir === -1 ? 0 : '-100%' }}>
            {[10, 30, 50, 70, 90].map((x) => (
              <rect key={x} x={x - 2} y="0" width="4" height="100" fill="#1a110b" stroke="#4a5568" strokeWidth="0.6" />
            ))}
          </svg>
        </motion.div>
      ))}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-grimoire font-extrabold text-orange-400 text-xs whitespace-nowrap drop-shadow-[0_0_6px_#000]"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: -34, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2 }}
      >
        PAREDE QUEBRADA!
      </motion.div>
    </motion.div>
  );
}

function DamageOverlay() {
  return (
    <>
      <motion.div
        className="absolute inset-0 z-30 rounded bg-blood-bright pointer-events-none"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: [0.85, 0.1, 0.35, 0.05] }}
        transition={{ duration: 1.1 }}
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 z-30 w-full h-full pointer-events-none">
        <motion.path
          d="M8 4 L94 96"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.25 }}
        />
        <motion.path
          d="M8 4 L94 96"
          stroke="#dc2626"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
        <motion.path
          d="M22 2 L100 76"
          stroke="#8b0000"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.12 }}
        />
      </svg>
    </>
  );
}

function ReflectOverlay() {
  return (
    <>
      <motion.div
        className="absolute -inset-1 z-20 rounded pointer-events-none"
        animate={{ boxShadow: ['0 0 10px #d4af37', '0 0 38px #fde68a', '0 0 10px #d4af37'] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
      <motion.svg
        viewBox="0 0 40 48"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-12 h-14 pointer-events-none"
        animate={{ scale: [1, 1.25, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      >
        <path d="M20 2 L37 9 V24 C37 35 29 43 20 46 C11 43 3 35 3 24 V9Z" fill="rgba(253,230,138,0.35)" stroke="#d4af37" strokeWidth="2.5" />
        <path d="M20 2 V46" stroke="#fde68a" strokeWidth="1.2" opacity="0.8" />
        <path d="M9 14 L16 30 M31 14 L24 30" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
      </motion.svg>
    </>
  );
}

function CardSlot({ player, phase, slotStyle }) {
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
          animate={{ opacity: 1 }}
          className="w-[64px] h-[92px] flex items-center justify-center border-2 border-dashed border-iron/60 rounded-md text-[9px] text-iron text-center font-mono"
        >
          PASSOU
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
          <InscryptionCard card={{ type: action.cardType }} small />
        </motion.div>
      );
    }
  }

  return (
    <div className="absolute z-[5] pointer-events-none" style={slotStyle}>
      <div style={{ perspective: 600 }}>{content}</div>
    </div>
  );
}

function PlayerSeatBase({ player, index, localIndex, totalPlayers, isMe, phase, targetable, dimmed, onSeatClick, onDropCard }) {
  const [over, setOver] = useState(false);
  const { x, y, angle } = seatPosition(index, localIndex, totalPlayers);
  const slotX = 50 + 20 * Math.cos(angle);
  const slotY = 50 + 19 * Math.sin(angle);
  const fx = player.visualEffect;
  const shake = fx === 'DAMAGE' || fx === 'VACUUM';

  return (
    <>
      <div
        className="absolute z-10"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
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
        onClick={() => targetable && onSeatClick && onSeatClick(player)}
      >
        <motion.div
          animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(
            'relative w-[clamp(100px,11.5vw,142px)] rounded-md border-2 px-2 pt-1.5 pb-2 bg-gradient-to-b from-wood-mid to-wood-dark shadow-[0_8px_18px_rgba(0,0,0,0.85)] transition-opacity',
            isMe ? 'border-gold-aged' : 'border-iron/70',
            targetable && 'aim-blink cursor-crosshair border-blood-bright',
            over && 'scale-110 border-blood-bright',
            !player.isAlive && 'opacity-40 grayscale',
            dimmed && player.isAlive && 'opacity-50'
          )}
        >
          {/* Placa de identificação enferrujada */}
          <div className="flex items-center justify-between gap-1 rounded-sm px-1.5 py-[2px] mb-1 bg-gradient-to-r from-[#5a3b27] via-[#8a5a36] to-[#5a3b27] border border-[#2a1810] shadow-inner">
            <span className="font-typewriter text-[11px] text-[#f1e2bd] truncate max-w-[75%]">{player.name}</span>
            <span
              className={cn(
                'text-[8px] font-mono font-bold px-1 rounded-sm',
                isMe ? 'bg-gold-aged text-black' : player.isBot ? 'bg-iron text-white' : 'bg-parchment-dark text-black'
              )}
            >
              {isMe ? 'VOCÊ' : player.isBot ? 'BOT' : 'HUMANO'}
            </span>
          </div>

          {/* Caveiras */}
          <div className="flex justify-center gap-1">
            {Array.from({ length: player.maxLives }).map((_, i) => (
              <Skull key={i} alive={i < player.lives} />
            ))}
          </div>

          {!player.isAlive && (
            <div className="text-center text-[9px] font-mono text-blood-bright font-bold mt-0.5">ELIMINADO</div>
          )}

          {/* Mira vermelha quando é alvo válido */}
          {targetable && (
            <svg viewBox="0 0 40 40" className="absolute inset-0 m-auto w-10 h-10 z-40 pointer-events-none animate-pulse">
              <circle cx="20" cy="20" r="12" fill="none" stroke="#dc2626" strokeWidth="1.6" />
              <path d="M20 2 V12 M20 28 V38 M2 20 H12 M28 20 H38" stroke="#dc2626" strokeWidth="1.8" />
            </svg>
          )}

          {player.isWalled && player.isAlive && <WallOverlay />}

          <AnimatePresence>
            {(fx === 'DAMAGE' || fx === 'VACUUM') && <DamageOverlay key={'dmg-' + fx} />}
            {fx === 'REFLECT' && <ReflectOverlay key="reflect" />}
            {fx === 'WALL_BROKEN' && <BrokenWallOverlay key="broken" />}
          </AnimatePresence>
          {fx === 'VACUUM' && (
            <motion.div
              className="absolute left-1/2 -top-5 -translate-x-1/2 z-40 text-[10px] font-mono font-bold text-fuchsia-400 whitespace-nowrap"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: -8, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2 }}
            >
              ☠ VÁCUO
            </motion.div>
          )}
        </motion.div>
      </div>

      <CardSlot
        player={player}
        phase={phase}
        slotStyle={{ left: `${slotX}%`, top: `${slotY}%`, transform: 'translate(-50%, -50%)' }}
      />
    </>
  );
}

export const PlayerSeat = React.memo(PlayerSeatBase);
export default PlayerSeat;

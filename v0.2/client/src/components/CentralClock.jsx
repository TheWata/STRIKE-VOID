import React, { useEffect, useState } from 'react';
import { audio } from '../lib/audio';
import { cn } from '../lib/cn';
import { PHASE_LABELS } from '../lib/constants';
import { UI_ASSETS } from '../models/assetCatalog';

/* ------------------------------------------------------------------ */
/* Relógio isolado: só ele escuta timer_tick (não re-renderiza a mesa) */
/* ------------------------------------------------------------------ */
const CentralClock = React.memo(function CentralClock({ socket, myAllowedTime, phase, locked, compact = false }) {
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
    <div
      id="central-clock"
      className={cn('relative aspect-square shrink-0', compact ? 'w-[84px]' : 'w-[clamp(96px,10vw,128px)]')}
    >
      <img
        src={UI_ASSETS.CLOCK_DIAL}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain"
      />
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 w-full h-full">
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
                'font-mono font-bold leading-none',
                compact ? 'text-xl' : 'text-2xl',
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

export default CentralClock;

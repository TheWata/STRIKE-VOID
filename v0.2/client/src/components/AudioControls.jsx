import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audio } from '../lib/audio';
import { cn } from '../lib/cn';

/** Painel reutilizável com controles e sliders de volume */
export function AudioSettingsPanel({ className }) {
  const [prefs, setPrefs] = useState(audio.getPrefs());

  const toggleMute = () => {
    audio.setMuted(!prefs.muted);
    setPrefs(audio.getPrefs());
  };

  return (
    <div className={cn('font-mono text-[11px] text-parchment space-y-3', className)}>
      <button
        id="btn-mute"
        type="button"
        onClick={toggleMute}
        className={cn(
          'w-full min-h-[42px] py-1.5 px-3 rounded border font-bold tracking-wider transition-all flex items-center justify-center gap-2',
          prefs.muted
            ? 'border-red-500/70 bg-red-950/40 text-red-300 hover:bg-red-900/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
            : 'border-gold-aged/70 bg-gold-aged/10 text-gold-aged hover:bg-gold-aged/20 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
        )}
      >
        {prefs.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        <span>{prefs.muted ? '🔇 SOM MUTADO — ATIVAR' : '🔊 SOM ATIVO — MUTAR'}</span>
      </button>

      {/* Volume da Música */}
      <label className="block">
        <div className="flex justify-between text-parchment-dark mb-1 text-xs">
          <span>🎵 Música (Em Jogo)</span>
          <span className="text-gold-aged font-bold">{Math.round((prefs.music ?? 0.7) * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={prefs.music ?? 0.7}
          onChange={(e) => {
            const val = Number(e.target.value);
            audio.setMusicVolume(val);
            setPrefs(audio.getPrefs());
          }}
          className="w-full accent-gold-aged cursor-pointer"
        />
        <span className="text-[9px] text-stone-500 block leading-tight mt-0.5">
          Intensidade dinâmica: 3 vidas (leve) → 1 vida (pânico)
        </span>
      </label>

      {/* Volume do Ambiente */}
      <label className="block">
        <div className="flex justify-between text-parchment-dark mb-1 text-xs">
          <span>🕯️ Ambiente (Espectador)</span>
          <span className="text-gold-aged font-bold">{Math.round((prefs.ambient ?? 0.6) * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={prefs.ambient ?? 0.6}
          onChange={(e) => {
            const val = Number(e.target.value);
            audio.setAmbientVolume(val);
            setPrefs(audio.getPrefs());
          }}
          className="w-full accent-gold-aged cursor-pointer"
        />
        <span className="text-[9px] text-stone-500 block leading-tight mt-0.5">
          Toca apenas ao assistir / eliminado
        </span>
      </label>

      {/* Volume dos Efeitos */}
      <label className="block">
        <div className="flex justify-between text-parchment-dark mb-1 text-xs">
          <span>⚔️ Efeitos (SFX)</span>
          <span className="text-gold-aged font-bold">{Math.round((prefs.sfx ?? 0.8) * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={prefs.sfx ?? 0.8}
          onChange={(e) => {
            const val = Number(e.target.value);
            audio.setSfxVolume(val);
            setPrefs(audio.getPrefs());
          }}
          onPointerUp={() => audio.play('select')}
          className="w-full accent-gold-aged cursor-pointer"
        />
      </label>
    </div>
  );
}

export default function AudioControls({ minimal = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const prefs = audio.getPrefs();

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        id="btn-audio"
        onClick={() => setOpen((o) => !o)}
        className={
          minimal
            ? 'flex items-center justify-center h-8 w-8 rounded-full bg-black/45 hover:bg-black/80 text-parchment/70 hover:text-amber-200 transition-all active:scale-95'
            : 'flex items-center justify-center gap-1.5 h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-md border border-stone-600 bg-stone-900/90 text-[11px] font-mono font-medium text-amber-100 hover:text-gold-aged hover:border-gold-aged hover:bg-stone-800 transition-all shadow-sm active:scale-95'
        }
        title="Configurações de Áudio"
        aria-label="Configurações de Áudio"
      >
        {prefs.muted ? (
          <VolumeX size={15} className="text-red-400" />
        ) : (
          <Volume2 size={15} className="text-amber-300/90" />
        )}
        {!minimal && <span className="hidden sm:inline">SOM</span>}
      </button>

      {open && (
        <div
          id="audio-panel"
          className="fixed left-2 right-2 top-12 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 z-[250] rounded border-2 border-stone-900 bg-stone-950/95 p-3.5 shadow-[0_10px_35px_#000]"
        >
          <AudioSettingsPanel />
        </div>
      )}
    </div>
  );
}

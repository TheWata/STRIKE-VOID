import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audio } from '../lib/audio';

export default function AudioControls() {
  const [prefs, setPrefs] = useState(audio.getPrefs());
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const toggleMute = () => {
    audio.setMuted(!prefs.muted);
    setPrefs(audio.getPrefs());
  };

  return (
    <div ref={ref} className="relative">
      <button
        id="btn-audio"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-iron/70 text-[11px] font-mono text-parchment-dark hover:text-gold-aged hover:border-gold-aged/70"
        title="Configurações de Áudio"
      >
        {prefs.muted ? <VolumeX size={14} /> : <Volume2 size={14} />} SOM
      </button>

      {open && (
        <div
          id="audio-panel"
          className="absolute right-0 top-full mt-2 w-64 z-[250] rounded border-2 border-stone-900 bg-stone-950/95 p-3.5 shadow-[0_10px_35px_#000] font-mono text-[11px] text-parchment"
        >
          <button
            id="btn-mute"
            onClick={toggleMute}
            className="w-full mb-3 py-1.5 rounded border border-gold-aged/70 text-gold-aged hover:bg-gold-aged/10 font-bold tracking-wider"
          >
            {prefs.muted ? '🔇 SOM MUTADO — ATIVAR' : '🔊 SOM ATIVO — MUTAR'}
          </button>

          {/* Volume da Música */}
          <label className="block mb-2.5">
            <div className="flex justify-between text-parchment-dark mb-0.5">
              <span>Música (Em Jogo)</span>
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
            <span className="text-[9px] text-stone-500 block leading-tight">
              Intensidade dinâmica: 3 vidas (leve) → 1 vida (pânico)
            </span>
          </label>

          {/* Volume do Ambiente */}
          <label className="block mb-2.5">
            <div className="flex justify-between text-parchment-dark mb-0.5">
              <span>Ambiente (Espectador)</span>
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
            <span className="text-[9px] text-stone-500 block leading-tight">
              Toca apenas ao assistir / eliminado
            </span>
          </label>

          {/* Volume dos Efeitos */}
          <label className="block">
            <div className="flex justify-between text-parchment-dark mb-0.5">
              <span>Efeitos (SFX)</span>
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
      )}
    </div>
  );
}

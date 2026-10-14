import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/cn';

function calcTime(lives, aliveCount, s) {
  if (s.useFixedTime) return s.baseTestTime;
  const factor = Math.pow(1 - s.damagePenalty, 3 - lives);
  return Number((s.baseTestTime + aliveCount * s.secondsPerPlayer * factor).toFixed(1));
}

function Slider({ label, value, min, max, step, onChange, display }) {
  return (
    <label className="block mb-3">
      <div className="flex justify-between text-xs font-typewriter mb-1">
        <span>{label}</span>
        <span className="text-gold-aged font-mono font-bold">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

export default function SettingsModal({ open, settings, aliveCount, onClose, onSave }) {
  const [local, setLocal] = useState(settings);

  useEffect(() => {
    if (open) setLocal(settings);
  }, [open, settings]);

  const set = (patch) => setLocal((s) => ({ ...s, ...patch }));
  const n = Math.max(2, aliveCount || 2);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            id="settings-modal"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-[min(460px,92vw)] rounded-md border-4 border-stone-900 bg-[#cbb892] text-stone-900 p-5 shadow-[inset_0_0_40px_rgba(44,29,18,0.7),0_20px_60px_#000]"
          >
            <h2 className="font-grimoire font-extrabold text-xl tracking-widest text-center border-b-2 border-stone-900 pb-2 mb-4">
              ⚙️ REGRAS DO TEMPO
            </h2>

            <label className="flex items-center gap-2 mb-4 font-typewriter text-sm cursor-pointer">
              <input
                id="chk-fixed-time"
                type="checkbox"
                checked={local.useFixedTime}
                onChange={(e) => set({ useFixedTime: e.target.checked })}
                className="w-4 h-4"
              />
              Usar Tempo Fixo de Teste
            </label>

            <Slider
              label="Tempo Base / Folga de Teste"
              min={5}
              max={40}
              step={1}
              value={local.baseTestTime}
              display={`${local.baseTestTime}s`}
              onChange={(v) => set({ baseTestTime: v })}
            />
            <Slider
              label="Segundos por Jogador Vivo (J)"
              min={1}
              max={5}
              step={0.5}
              value={local.secondsPerPlayer}
              display={`${local.secondsPerPlayer.toFixed(1)}s`}
              onChange={(v) => set({ secondsPerPlayer: v })}
            />
            <Slider
              label="Penalidade de Tempo por Dano (D)"
              min={0}
              max={50}
              step={1}
              value={Math.round(local.damagePenalty * 100)}
              display={`${Math.round(local.damagePenalty * 100)}%`}
              onChange={(v) => set({ damagePenalty: v / 100 })}
            />
            <Slider
              label="Tempo de Leitura entre Rounds (Análise)"
              min={3}
              max={20}
              step={1}
              value={local.analysisDuration}
              display={`${local.analysisDuration}s`}
              onChange={(v) => set({ analysisDuration: v })}
            />

            <div className="rounded border-2 border-stone-900 bg-stone-900/90 text-parchment font-mono text-[11px] text-center py-2 px-1 mb-4">
              <div className="text-parchment-dark mb-1">Prévia ({n} vivos)</div>
              <div>
                3 Vidas: <b className="text-gold-aged">{calcTime(3, n, local).toFixed(1)}s</b> | 2 Vidas:{' '}
                <b className="text-gold-aged">{calcTime(2, n, local).toFixed(1)}s</b> | 1 Vida:{' '}
                <b className="text-blood-bright">{calcTime(1, n, local).toFixed(1)}s</b>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="btn-settings-cancel"
                onClick={onClose}
                className={cn('flex-1 py-2 rounded border-2 border-stone-900 font-grimoire font-bold text-sm', 'hover:bg-stone-900/20')}
              >
                FECHAR
              </button>
              <button
                id="btn-settings-save"
                onClick={() => {
                  onSave(local);
                  onClose();
                }}
                className="flex-[2] py-2 rounded border-2 border-stone-900 bg-stone-900 text-gold-aged font-grimoire font-bold text-sm hover:bg-wood-mid"
              >
                Salvar e Aplicar na Mesa
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

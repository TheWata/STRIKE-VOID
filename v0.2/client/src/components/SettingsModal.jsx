import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, Layers, Trash2, Clock, Check, Skull, AlertCircle } from 'lucide-react';
import { cn } from '../lib/cn';

// Mesma normalização do servidor: o dano é ponderado pela proporção em relação ao maxHp (curva calibrada para 3 vidas)
function calcTime(lives, aliveCount, s, maxHp = 3) {
  if (s.useFixedTime) return s.baseTestTime;
  const scaledDamage = (maxHp - lives) * (3 / maxHp);
  const factor = Math.pow(1 - s.damagePenalty, scaledDamage);
  return Number((s.baseTestTime + aliveCount * s.secondsPerPlayer * factor).toFixed(1));
}

function Slider({ label, value, min, max, step, onChange, display, disabled = false }) {
  return (
    <label className={cn('block mb-2.5', disabled && 'opacity-60 cursor-not-allowed')}>
      <div className="flex justify-between text-xs font-typewriter mb-1">
        <span className="text-stone-800 font-bold">{label}</span>
        <span className="text-stone-900 font-mono font-extrabold">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-stone-900"
      />
    </label>
  );
}

export default function SettingsModal({
  open,
  settings,
  aliveCount = 2,
  isHost = true,
  isLobby = true,
  onClose,
  onSave,
}) {
  const [local, setLocal] = useState(settings || {});

  useEffect(() => {
    if (open && settings) {
      setLocal({
        ...settings,
        maxHp: settings.maxHp ?? 3,
        initialHandCards: settings.initialHandCards ?? 3,
        maxHandCards: settings.maxHandCards ?? 3,
        discardLimit: settings.discardLimit ?? 2,
      });
    }
  }, [open, settings]);

  const set = (patch) => setLocal((s) => ({ ...s, ...patch }));
  const n = Math.max(2, aliveCount || 2);
  const currentMaxHp = local.maxHp ?? 3;
  const hpLevels = Array.from({ length: currentMaxHp }, (_, i) => currentMaxHp - i);

  const handleInitialCardsChange = (val) => {
    if (!isHost || !isLobby) return;
    setLocal((prev) => {
      const nextMax = Math.max(val, prev.maxHandCards ?? 3);
      return {
        ...prev,
        initialHandCards: val,
        maxHandCards: nextMax,
      };
    });
  };

  const handleMaxCardsChange = (val) => {
    if (!isHost || !isLobby) return;
    setLocal((prev) => {
      const nextInit = Math.min(val, prev.initialHandCards ?? 3);
      return {
        ...prev,
        maxHandCards: val,
        initialHandCards: nextInit,
      };
    });
  };

  const handleSave = () => {
    if (!isHost) {
      onClose();
      return;
    }
    onSave?.(local);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            id="settings-modal"
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[520px] max-h-[92dvh] flex flex-col rounded-xl border-4 border-stone-900 bg-[#cbb892] text-stone-900 shadow-[inset_0_0_40px_rgba(44,29,18,0.7),0_20px_60px_#000] overflow-hidden"
          >
            {/* Header com visual de Grimoire */}
            <div className="border-b-2 border-stone-900 bg-[#bba780] px-4 py-3 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-stone-900" />
                <div>
                  <h2 className="font-grimoire font-extrabold text-base sm:text-lg tracking-widest text-stone-950">
                    REGRAS DA MESA
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-mono text-stone-700">
                    {isHost ? 'Ajuste vidas, cartas, descarte e cronômetro' : 'Visualizando regras da partida (somente leitura)'}
                  </p>
                </div>
              </div>
              {!isHost && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-900 text-gold-aged">
                  VISUALIZAÇÃO
                </span>
              )}
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
              {/* 1. SEÇÃO: REGRAS DE CARTAS & SOBREVIVÊNCIA */}
              <div className="rounded-lg border-2 border-stone-900 bg-stone-900/5 p-3 space-y-3">
                <div className="flex items-center gap-1.5 font-grimoire font-bold text-xs sm:text-sm text-stone-900 border-b border-stone-900/20 pb-1">
                  <Shield size={14} className="text-blood" />
                  <span>SOBREVIVÊNCIA & CARTAS</span>
                  {!isLobby && (
                    <span className="ml-auto text-[9.5px] font-mono text-stone-600 italic">
                      (Trava durante a partida)
                    </span>
                  )}
                </div>

                {/* Vida Inicial (2 a 5 Vidas) */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="font-bold flex items-center gap-1">
                      <Skull size={13} className="text-blood" /> VIDA INICIAL (HP):
                    </span>
                    <span className="font-extrabold text-stone-900">{currentMaxHp} Vidas</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 3, 4, 5].map((hp) => (
                      <button
                        key={hp}
                        type="button"
                        disabled={!isHost || !isLobby}
                        onClick={() => set({ maxHp: hp })}
                        className={cn(
                          'py-1.5 px-2 rounded text-xs font-mono font-bold transition-all border-2 flex flex-col items-center justify-center',
                          currentMaxHp === hp
                            ? 'border-stone-900 bg-stone-900 text-amber-200 shadow-md'
                            : 'border-stone-800/40 bg-stone-900/10 text-stone-800 hover:bg-stone-900/20',
                          (!isHost || !isLobby) && 'cursor-default opacity-80'
                        )}
                      >
                        <span>{hp} Vidas</span>
                        {hp === 3 && <span className="text-[9px] opacity-75 font-normal">Padrão</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cartas Iniciais & Máximo de Cartas na Mão */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Cartas Iniciais (1 a 5) */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <Layers size={12} /> CARTAS INICIAIS:
                      </span>
                      <span className="font-extrabold">{local.initialHandCards ?? 3}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!isHost || !isLobby}
                          onClick={() => handleInitialCardsChange(num)}
                          className={cn(
                            'py-1 rounded text-xs font-mono font-bold border transition-all text-center',
                            (local.initialHandCards ?? 3) === num
                              ? 'border-stone-900 bg-stone-900 text-amber-200 font-extrabold shadow-sm'
                              : 'border-stone-800/40 bg-stone-900/10 text-stone-800 hover:bg-stone-900/20',
                            (!isHost || !isLobby) && 'cursor-default opacity-80'
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Máximo de Cartas na Mão (1 a 5) */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <Layers size={12} /> MÁXIMO NA MÃO:
                      </span>
                      <span className="font-extrabold">{local.maxHandCards ?? 3}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={!isHost || !isLobby}
                          onClick={() => handleMaxCardsChange(num)}
                          className={cn(
                            'py-1 rounded text-xs font-mono font-bold border transition-all text-center',
                            (local.maxHandCards ?? 3) === num
                              ? 'border-stone-900 bg-stone-900 text-amber-200 font-extrabold shadow-sm'
                              : 'border-stone-800/40 bg-stone-900/10 text-stone-800 hover:bg-stone-900/20',
                            (!isHost || !isLobby) && 'cursor-default opacity-80'
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quantidade de Cartas por Descarte (0 a 2) */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="font-bold flex items-center gap-1">
                      <Trash2 size={13} className="text-stone-800" /> CARTAS POR DESCARTE:
                    </span>
                    <span className="font-extrabold text-stone-900">
                      {(local.discardLimit ?? 2) === 0 ? 'Desativado (0)' : `Até ${local.discardLimit ?? 2} ${local.discardLimit === 1 ? 'carta' : 'cartas'}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: 0, label: '0 (Desativado)', desc: 'Mantém Passar a Vez' },
                      { val: 1, label: '1 Carta', desc: 'Descarta até 1' },
                      { val: 2, label: '2 Cartas (Padrão)', desc: 'Descarta até 2' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        disabled={!isHost || !isLobby}
                        onClick={() => set({ discardLimit: opt.val })}
                        className={cn(
                          'py-1.5 px-2 rounded text-xs font-mono font-bold transition-all border-2 text-center flex flex-col items-center justify-center',
                          (local.discardLimit ?? 2) === opt.val
                            ? 'border-stone-900 bg-stone-900 text-amber-200 shadow-md'
                            : 'border-stone-800/40 bg-stone-900/10 text-stone-800 hover:bg-stone-900/20',
                          (!isHost || !isLobby) && 'cursor-default opacity-80'
                        )}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[9px] opacity-75 font-normal">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-stone-700 mt-1 italic">
                    {(local.discardLimit ?? 2) === 0
                      ? 'ℹ️ Com 0, a função clássica de PASSAR A VEZ é mantida sem descarte de cartas.'
                      : `ℹ️ Jogadores podem descartar até ${local.discardLimit ?? 2} cartas na rodada. A cada novo round compra-se APENAS 1 carta (mesmo descartando 2).`}
                  </p>
                </div>
              </div>

              {/* 2. SEÇÃO: TEMPOS DA PARTIDA */}
              <div className="rounded-lg border-2 border-stone-900 bg-stone-900/5 p-3 space-y-3">
                <div className="flex items-center gap-1.5 font-grimoire font-bold text-xs sm:text-sm text-stone-900 border-b border-stone-900/20 pb-1">
                  <Clock size={14} />
                  <span>CRONÔMETRO & TEMPO DE DECISÃO</span>
                </div>

                <label className={cn('flex items-center gap-2 font-typewriter text-xs sm:text-sm cursor-pointer', !isHost && 'cursor-default')}>
                  <input
                    id="chk-fixed-time"
                    type="checkbox"
                    disabled={!isHost}
                    checked={local.useFixedTime || false}
                    onChange={(e) => set({ useFixedTime: e.target.checked })}
                    className="w-4 h-4 accent-stone-900"
                  />
                  <span>Usar Tempo Fixo de Teste</span>
                </label>

                <Slider
                  label="Tempo Base / Folga de Decisão"
                  min={5}
                  max={40}
                  step={1}
                  disabled={!isHost}
                  value={local.baseTestTime ?? 10}
                  display={`${local.baseTestTime ?? 10}s`}
                  onChange={(v) => set({ baseTestTime: v })}
                />
                <Slider
                  label="Segundos por Jogador Vivo (J)"
                  min={1}
                  max={5}
                  step={0.5}
                  disabled={!isHost || local.useFixedTime}
                  value={local.secondsPerPlayer ?? 2.0}
                  display={`${(local.secondsPerPlayer ?? 2.0).toFixed(1)}s`}
                  onChange={(v) => set({ secondsPerPlayer: v })}
                />
                <Slider
                  label="Penalidade de Tempo por Dano (D)"
                  min={0}
                  max={50}
                  step={1}
                  disabled={!isHost || local.useFixedTime}
                  value={Math.round((local.damagePenalty ?? 0.33) * 100)}
                  display={`${Math.round((local.damagePenalty ?? 0.33) * 100)}%`}
                  onChange={(v) => set({ damagePenalty: v / 100 })}
                />
                <Slider
                  label="Tempo de Leitura entre Rounds (Análise)"
                  min={3}
                  max={20}
                  step={1}
                  disabled={!isHost}
                  value={local.analysisDuration ?? 8}
                  display={`${local.analysisDuration ?? 8}s`}
                  onChange={(v) => set({ analysisDuration: v })}
                />

                {/* Prévia do cálculo */}
                <div className="rounded border-2 border-stone-900 bg-stone-900 text-parchment font-mono text-[10px] sm:text-[11px] text-center py-2 px-2 shadow-inner">
                  <div className="text-parchment-dark mb-1 font-bold">
                    Prévia do Relógio ({n} vivos · {currentMaxHp} HP inicial)
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
                    {hpLevels.map((hp) => (
                      <span key={hp}>
                        {hp} {hp === 1 ? 'Vida' : 'Vidas'}:{' '}
                        <b className={hp === 1 ? 'text-blood-bright' : 'text-gold-aged'}>
                          {calcTime(hp, n, local, currentMaxHp).toFixed(1)}s
                        </b>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="border-t-2 border-stone-900 bg-[#bba780] p-3 shrink-0 flex gap-2">
              <button
                id="btn-settings-cancel"
                onClick={onClose}
                className="flex-1 min-h-[44px] py-2 px-3 rounded border-2 border-stone-900 bg-stone-900/10 font-grimoire font-bold text-xs sm:text-sm hover:bg-stone-900/20 transition-colors"
              >
                FECHAR
              </button>
              {isHost && (
                <button
                  id="btn-settings-save"
                  onClick={handleSave}
                  className="flex-[2] min-h-[44px] py-2 px-4 rounded border-2 border-stone-900 bg-stone-900 text-amber-200 font-grimoire font-bold text-xs sm:text-sm hover:bg-stone-800 transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check size={16} /> Salvar e Aplicar na Mesa
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

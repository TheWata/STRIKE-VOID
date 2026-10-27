import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Crosshair,
  Shield,
  Flame,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { audio } from '../lib/audio';
import InscryptionCard from './InscryptionCard';
import GameIcon from './GameIcon';
import { CARD_TYPES, CARD_META, CARD_CATEGORIES } from '../models/cardModel';
import { GRIMOIRE_CARDS } from './CardGrimoireBook';

/**
 * Modal de Inspeção Ampliada de Carta:
 * Permite inspecionar qualquer carta individualmente em grande escala,
 * preservando proporção original, arte e todos os textos, atributos e regras.
 * Funciona tanto durante a gameplay quanto dentro do Guia / Grimório.
 */
export default function CardInspectModal({
  card,
  onClose,
  onSelectCardType,
  allowBrowseAll = false,
}) {
  const [chargeOverride, setChargeOverride] = useState(null);
  const simulatedCharges =
    chargeOverride != null
      ? chargeOverride
      : card?.charges != null
        ? Number(card.charges)
        : 4;

  useEffect(() => {
    if (!card) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      } else if (allowBrowseAll && onSelectCardType) {
        const idx = GRIMOIRE_CARDS.findIndex((c) => c.type === card.type);
        if (idx !== -1 && e.key === 'ArrowRight') {
          const next = GRIMOIRE_CARDS[(idx + 1) % GRIMOIRE_CARDS.length];
          onSelectCardType(next.type);
        } else if (idx !== -1 && e.key === 'ArrowLeft') {
          const prev =
            GRIMOIRE_CARDS[(idx - 1 + GRIMOIRE_CARDS.length) % GRIMOIRE_CARDS.length];
          onSelectCardType(prev.type);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, onClose, allowBrowseAll, onSelectCardType]);

  if (!card || typeof document === 'undefined') return null;

  const meta = CARD_META[card.type];
  if (!meta) return null;

  const cat = CARD_CATEGORIES[meta.category];
  const grimoireEntry =
    GRIMOIRE_CARDS.find((c) => c.type === card.type) || GRIMOIRE_CARDS[0];
  const currentIdx = GRIMOIRE_CARDS.findIndex((c) => c.type === card.type);
  const isSyringe = card.type === CARD_TYPES.SERINGA;

  const handlePrev = () => {
    if (!onSelectCardType || currentIdx === -1) return;
    audio.play('select');
    const prev =
      GRIMOIRE_CARDS[(currentIdx - 1 + GRIMOIRE_CARDS.length) % GRIMOIRE_CARDS.length];
    onSelectCardType(prev.type);
  };

  const handleNext = () => {
    if (!onSelectCardType || currentIdx === -1) return;
    audio.play('select');
    const next = GRIMOIRE_CARDS[(currentIdx + 1) % GRIMOIRE_CARDS.length];
    onSelectCardType(next.type);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        id="card-inspect-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[360] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto select-text"
      >
        <motion.div
          id="card-inspect-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Inspeção ampliada: ${meta.name}`}
          initial={{ scale: 0.9, y: 18, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 18, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[92dvh] overflow-y-auto rounded-2xl border-4 border-gold-aged/85 bg-gradient-to-b from-[#26160d] via-[#190e08] to-[#0f0805] text-parchment shadow-[0_0_90px_rgba(0,0,0,0.98),0_0_40px_rgba(212,175,55,0.28)] p-4 sm:p-7"
        >
          {/* Cabeçalho da Inspeção */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b-2 border-stone-700/80">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={cn(
                  'px-3 py-1 rounded-md border font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider',
                  cat?.badgeCls
                )}
              >
                PRIORIDADE {meta.priority} · {meta.categoryLabel}
              </span>
              <span className="font-mono text-xs sm:text-sm text-amber-200/80">
                Inspeção Ampliada de Carta
              </span>
            </div>

            <button
              id="btn-close-card-inspect"
              type="button"
              onClick={() => {
                audio.play('click');
                onClose?.();
              }}
              className="h-11 w-11 rounded-lg border-2 border-stone-600 bg-stone-900 hover:bg-blood hover:border-red-400 text-amber-100 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label="Fechar inspeção"
            >
              <X size={22} />
            </button>
          </div>

          {/* Corpo: Carta Inteira Ampliada à Esquerda + Detalhamento Completo à Direita */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Coluna da Carta Ampliada (Preserva proporção original sem cortes) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="p-2 rounded-xl bg-black/55 border border-gold-aged/35 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
                <InscryptionCard
                  card={{
                    ...card,
                    type: card.type,
                    charges: isSyringe ? simulatedCharges : card.charges,
                  }}
                  inspect
                />
              </div>

              {/* Simulador de cargas para a Seringa */}
              {isSyringe && (
                <div className="mt-3 w-full max-w-[332px] p-2.5 rounded-lg bg-[#1d110a] border border-emerald-500/50 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-200">
                    <GameIcon name="syringe-vial" size={14} />
                    <span>Cargas na Seringa:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          audio.play('click');
                          setChargeOverride(c);
                        }}
                        className={cn(
                          'px-2 py-1 rounded font-mono text-xs font-extrabold border transition-all cursor-pointer',
                          simulatedCharges === c
                            ? 'bg-emerald-600 text-white border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                            : 'bg-black/70 text-amber-100 border-stone-700 hover:border-emerald-400'
                        )}
                      >
                        {c}/4
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna de Informações e Regras em Tipografia Grande */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <h2 className="font-grimoire font-black text-2xl sm:text-3xl text-amber-100 tracking-wider leading-tight">
                  {meta.name}
                </h2>
                <p className="mt-1.5 font-typewriter text-base sm:text-lg text-amber-200/95 font-bold leading-snug">
                  {grimoireEntry.shortEffect}
                </p>

                {/* Atributos Táticos Essenciais */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border-2 border-stone-700/90 bg-black/65 p-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-red-300 mb-1">
                      <Crosshair size={14} className="shrink-0" />
                      <span>Alvo Permitido</span>
                    </div>
                    <div className="font-typewriter text-sm sm:text-base font-bold text-parchment">
                      {grimoireEntry.targetLabel}
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-stone-700/90 bg-black/65 p-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-sky-300 mb-1">
                      <Shield size={14} className="shrink-0" />
                      <span>Regra de Parede</span>
                    </div>
                    <div className="font-typewriter text-sm sm:text-base font-bold text-parchment">
                      {grimoireEntry.wallRule}
                    </div>
                  </div>
                </div>

                {/* Explicação Completa e Efeitos */}
                <div className="mt-4 rounded-xl border-2 border-[#8c6d46] bg-gradient-to-b from-[#f3e5c8] via-[#ead7b3] to-[#dfc89e] text-[#1a0f06] p-4 shadow-inner">
                  <div className="font-grimoire font-black text-sm sm:text-base uppercase tracking-wider text-[#6b1d1d] mb-2.5 flex items-center gap-1.5">
                    <Flame size={16} className="text-[#8b0000] shrink-0" />
                    <span>Regras & Comportamento no Combate</span>
                  </div>
                  <ul className="space-y-2.5 font-typewriter text-sm sm:text-base leading-relaxed text-[#1a0f06]">
                    {grimoireEntry.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#8b0000] font-bold shrink-0 mt-0.5">❖</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Rodapé com Navegação entre Cartas (quando aplicável) */}
              <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
                {allowBrowseAll && onSelectCardType ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gold-aged/60 bg-black/75 hover:bg-gold-aged/20 text-amber-100 font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                      <span>Anterior</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gold-aged/60 bg-black/75 hover:bg-gold-aged/20 text-amber-100 font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    >
                      <span>Próxima</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 font-mono text-xs text-amber-200/75">
                    <Sparkles size={13} className="text-gold-aged" />
                    <span>Dica: Clique com o botão direito ou na lupa em qualquer carta para ampliar</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    audio.play('click');
                    onClose?.();
                  }}
                  className="px-4 py-2 rounded-lg border-2 border-gold-aged bg-blood/85 hover:bg-blood text-white font-grimoire font-bold text-xs sm:text-sm tracking-wider uppercase transition-all cursor-pointer"
                >
                  Fechar Inspeção [ESC]
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

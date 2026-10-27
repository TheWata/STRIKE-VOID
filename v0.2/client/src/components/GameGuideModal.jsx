import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Skull,
  Swords,
  Flame,
  Sparkles,
  BookOpen,
  Layers,
  Eye,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { audio } from '../lib/audio';
import CardGrimoireBook from './CardGrimoireBook';

export default function GameGuideModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('cards'); // 'game' | 'cards'

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleTabChange = (tab) => {
    audio.play('select');
    setActiveTab(tab);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="game-guide-backdrop"
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 touch-manipulation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            id="game-guide-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[88dvh] flex flex-col rounded-xl border-4 border-stone-900 bg-gradient-to-b from-[#241710] via-wood-dark to-[#0f0906] text-parchment shadow-[0_0_60px_rgba(0,0,0,0.95),inset_0_0_40px_rgba(44,29,18,0.7)] overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-3 sm:px-6 pt-3.5 sm:pt-4 pb-3.5 border-b-2 border-stone-700/80 bg-gradient-to-r from-[#332115] via-[#3d2719] to-[#2a1b11] shadow-[0_2px_15px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(212,175,55,0.25)] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-md bg-blood/40 border border-blood-bright text-white shadow-[0_0_14px_rgba(220,38,38,0.5)] shrink-0">
                  <BookOpen size={18} className="sm:w-5 sm:h-5 text-red-200" />
                </div>
                <div>
                  <h2
                    id="guide-title"
                    className="font-grimoire font-extrabold text-sm sm:text-lg tracking-wider text-amber-100 flex items-center gap-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                  >
                    MANUAL DO CONDENADO
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-gold-aged/20 border border-gold-aged/50 px-1.5 py-0.2 rounded hidden sm:inline-block shadow-sm">
                      3D · 9 CARTAS · 5 PRIORIDADES
                    </span>
                  </h2>
                  <p className="text-[10px] sm:text-xs font-mono text-amber-200/80 tracking-wide">
                    Grimório de cartas, tipos, prioridades (P1–P5) e sobrevivência no STRIKE / VOID
                  </p>
                </div>
              </div>

              <button
                id="btn-close-guide"
                onClick={() => {
                  audio.play('click');
                  onClose();
                }}
                className="h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md border border-stone-600 bg-stone-900/90 hover:bg-blood/60 hover:border-red-500 text-stone-200 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                aria-label="Fechar guia"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-3 sm:px-6 pt-2.5 pb-2.5 bg-black/40 border-b border-stone-800/80 flex gap-2 shrink-0">
              <button
                id="tab-guide-cards"
                onClick={() => handleTabChange('cards')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-md font-grimoire font-bold text-xs sm:text-sm tracking-wider transition-all min-h-[44px]',
                  activeTab === 'cards'
                    ? 'border-2 border-gold-aged bg-gold-aged/25 text-gold-aged shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                    : 'border border-iron/60 bg-black/40 text-parchment-dark hover:border-gold-aged hover:text-gold-aged'
                )}
              >
                <Layers size={15} className={activeTab === 'cards' ? 'text-gold-aged' : 'text-stone-400'} />
                <span>🃏 AS 9 CARTAS</span>
                <span className="hidden sm:inline text-[11px] font-mono opacity-80">(Grimório & Tipos)</span>
              </button>

              <button
                id="tab-guide-game"
                onClick={() => handleTabChange('game')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-md font-grimoire font-bold text-xs sm:text-sm tracking-wider transition-all min-h-[44px]',
                  activeTab === 'game'
                    ? 'border-2 border-blood-bright bg-blood/40 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                    : 'border border-iron/60 bg-black/40 text-parchment-dark hover:border-gold-aged hover:text-gold-aged'
                )}
              >
                <Flame size={15} className={activeTab === 'game' ? 'text-blood-bright' : 'text-stone-400'} />
                <span>🩸 VISÃO 3D & REGRAS</span>
                <span className="hidden sm:inline text-[11px] font-mono opacity-80">(Dinâmica da Mesa)</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 font-typewriter text-xs sm:text-sm leading-relaxed scrollbar-thin">
              {activeTab === 'game' ? <TabTheGame /> : <TabTheCards />}
            </div>

            {/* Footer */}
            <div className="px-3 sm:px-6 py-2.5 bg-black/70 border-t border-iron/40 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-parchment-dark shrink-0">
              <span className="flex items-center gap-1 text-gold-aged">
                <Sparkles size={12} /> Lembre-se: O Vazio nunca perdoa a hesitação.
              </span>
              <button
                onClick={() => {
                  audio.play('click');
                  onClose();
                }}
                className="hover:underline text-parchment"
              >
                Fechar [ESC]
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TabTheGame() {
  return (
    <div className="space-y-4 text-parchment">
      {/* Controle de Câmera 3D */}
      <div className="rounded-lg border-2 border-gold-aged/60 bg-black/65 p-3 sm:p-4 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
        <div className="flex items-center gap-2 text-amber-300 font-grimoire font-extrabold text-sm sm:text-base tracking-wider mb-1.5">
          <Eye size={18} /> CÂMERA 3D EM PRIMEIRA PESSOA (ESTILO INSCRYPTION)
        </div>
        <p className="text-parchment-light text-xs sm:text-sm mb-2">
          A mesa é totalmente tridimensional e reage ao movimento vertical do seu mouse:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs sm:text-[13px]">
          <div className="rounded bg-wood-dark/80 border border-gold-aged/40 p-2.5">
            <strong className="text-amber-300 block mb-0.5">1. MOUSE PARA CIMA ↑</strong>
            Olha para as <strong>Silhuetas 3D</strong> dos jogadores sentados ao redor da mesa, suas vidas, pactos e cartas reveladas.
          </div>
          <div className="rounded bg-wood-dark/80 border border-red-500/40 p-2.5">
            <strong className="text-red-300 block mb-0.5">2. MOUSE NO MEIO / BAIXO</strong>
            Olha para o feltro da mesa cerimonial, o relógio central e as <strong>Cartas na sua Mão</strong>.
          </div>
          <div className="rounded bg-wood-dark/80 border border-amber-500/40 p-2.5">
            <strong className="text-amber-200 block mb-0.5">3. MOUSE MAIS EMBAIXO ↓</strong>
            Olha embaixo da mesa e abre o <strong>Livro de Cartas (Grimório)</strong> junto com o <strong>Caderno de Anotações & Chat</strong>.
          </div>
        </div>
      </div>

      {/* Objetivo Central */}
      <div className="rounded-lg border-2 border-blood/60 bg-black/60 p-3 sm:p-4 shadow-[0_0_20px_rgba(139,0,0,0.25)]">
        <div className="flex items-center gap-2 text-blood-bright font-grimoire font-extrabold text-sm sm:text-base tracking-wider mb-1.5">
          <Skull size={18} /> O OBJETIVO DOS CONDENADOS
        </div>
        <p className="text-parchment-light">
          De <strong>2 a 8 jogadores</strong> sentam-se à mesa. Cada jogador inicia com <strong>2 a 5 Vidas</strong> (padrão 3).
          Todos escolhem suas cartas simultaneamente antes do relógio zerar. O último sobrevivente vence!
        </p>
      </div>

      {/* Ordem de Resolução */}
      <div className="rounded-lg border border-iron/70 bg-black/40 p-3 sm:p-4">
        <div className="font-grimoire font-bold text-xs sm:text-sm tracking-wider text-parchment mb-2 flex items-center gap-2">
          <Swords size={15} className="text-gold-aged" /> TIPOS DE CARTAS & ORDEM DE PRIORIDADE (P1 → P5)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs sm:text-[12.5px] font-mono">
          <div className="rounded border border-purple-700/70 bg-purple-950/30 p-2">
            <span className="text-purple-300 font-bold block mb-0.5">P1 · REAÇÃO</span>
            <strong>Espelho Amaldiçoado:</strong> Reflete ataques e maldições, rouba paredes e pune uso no vazio com -1 Vida.
          </div>
          <div className="rounded border border-cyan-700/70 bg-cyan-950/30 p-2">
            <span className="text-cyan-300 font-bold block mb-0.5">P2 · DEFENSIVO</span>
            <strong>Parede:</strong> Ergue grades de ferro que bloqueiam 1 facada e prendem a mira do alvo.
          </div>
          <div className="rounded border border-emerald-700/70 bg-emerald-950/30 p-2">
            <span className="text-emerald-300 font-bold block mb-0.5">P3 · SUPORTE</span>
            <strong>Seringa, Manip. de Alma e Revelar:</strong> Curas (ou Overdose!), trocas de vida, +1 Faca e visão.
          </div>
          <div className="rounded border border-amber-700/70 bg-amber-950/30 p-2">
            <span className="text-amber-300 font-bold block mb-0.5">P4 · CONTROLE</span>
            <strong>Pacto de Sangue, Marca da Morte e Desarmar:</strong> Vínculos, quebras de pacto, maldições e descartes.
          </div>
          <div className="rounded border border-red-700/70 bg-red-950/30 p-2">
            <span className="text-red-300 font-bold block mb-0.5">P5 · OFENSIVO</span>
            <strong>Faca:</strong> Golpes diretos, quebra de paredes e avanço da Marca da Morte em quem não sangrou!
          </div>
        </div>
      </div>
    </div>
  );
}

function TabTheCards() {
  return (
    <div className="space-y-3 text-parchment">
      <CardGrimoireBook />
    </div>
  );
}

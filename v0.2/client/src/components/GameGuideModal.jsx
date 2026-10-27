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
  ShieldAlert,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { audio } from '../lib/audio';
import CardGrimoireBook from './CardGrimoireBook';

export default function GameGuideModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'game'

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
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/88 backdrop-blur-md p-2 sm:p-4 touch-manipulation select-text"
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
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 16, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-[96vw] max-w-6xl max-h-[92dvh] flex flex-col rounded-2xl border-4 border-stone-900 bg-gradient-to-b from-[#241710] via-wood-dark to-[#0f0906] text-parchment shadow-[0_0_75px_rgba(0,0,0,0.98),inset_0_0_40px_rgba(44,29,18,0.7)] overflow-hidden"
          >
            {/* Header com tipografia ampliada */}
            <div className="relative px-4 sm:px-7 py-4 border-b-2 border-stone-700/80 bg-gradient-to-r from-[#332115] via-[#3d2719] to-[#2a1b11] shadow-[0_2px_15px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(212,175,55,0.25)] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="p-2.5 rounded-lg bg-blood/45 border-2 border-blood-bright text-white shadow-[0_0_16px_rgba(220,38,38,0.5)] shrink-0">
                  <BookOpen size={24} className="text-red-200" />
                </div>
                <div>
                  <h2
                    id="guide-title"
                    className="font-grimoire font-black text-lg sm:text-2xl tracking-wider text-amber-100 flex flex-wrap items-center gap-2.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                  >
                    <span>MANUAL DO CONDENADO</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-amber-200 bg-gold-aged/20 border border-gold-aged/60 px-2.5 py-0.5 rounded-md shadow-sm">
                      9 CARTAS EM TAMANHO REAL · 5 PRIORIDADES
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm font-typewriter text-amber-200/90 tracking-wide mt-0.5">
                    Guia completo de cartas, efeitos, controles táticos e sobrevivência na mesa do STRIKE / VOID
                  </p>
                </div>
              </div>

              <button
                id="btn-close-guide"
                type="button"
                onClick={() => {
                  audio.play('click');
                  onClose();
                }}
                className="h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border-2 border-stone-600 bg-stone-900/95 hover:bg-blood hover:border-red-400 text-stone-200 hover:text-white transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
                aria-label="Fechar guia"
              >
                <X size={22} />
              </button>
            </div>

            {/* Abas Principais */}
            <div className="px-4 sm:px-7 py-3 bg-black/50 border-b border-stone-800/90 flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
              <button
                id="tab-guide-cards"
                type="button"
                onClick={() => handleTabChange('cards')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-grimoire font-extrabold text-sm sm:text-base tracking-wider transition-all min-h-[48px] cursor-pointer',
                  activeTab === 'cards'
                    ? 'border-2 border-gold-aged bg-gold-aged/25 text-amber-100 shadow-[0_0_18px_rgba(212,175,55,0.45)]'
                    : 'border border-iron/70 bg-black/50 text-parchment-dark hover:border-gold-aged hover:text-amber-100'
                )}
              >
                <Layers
                  size={18}
                  className={activeTab === 'cards' ? 'text-gold-aged' : 'text-stone-400'}
                />
                <span>🃏 AS 9 CARTAS EM TAMANHO REAL</span>
              </button>

              <button
                id="tab-guide-game"
                type="button"
                onClick={() => handleTabChange('game')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-grimoire font-extrabold text-sm sm:text-base tracking-wider transition-all min-h-[48px] cursor-pointer',
                  activeTab === 'game'
                    ? 'border-2 border-blood-bright bg-blood/45 text-white shadow-[0_0_18px_rgba(220,38,38,0.5)]'
                    : 'border border-iron/70 bg-black/50 text-parchment-dark hover:border-gold-aged hover:text-amber-100'
                )}
              >
                <Flame
                  size={18}
                  className={activeTab === 'game' ? 'text-blood-bright' : 'text-stone-400'}
                />
                <span>🩸 REGRAS, CONTROLES & RETRATO DINÂMICO</span>
              </button>
            </div>

            {/* Conteúdo com rolagem fluida e espaçamento amplo */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-7 py-5 space-y-6 font-typewriter text-sm sm:text-base leading-relaxed scrollbar-thin">
              {activeTab === 'game' ? <TabTheGame /> : <TabTheCards />}
            </div>

            {/* Rodapé */}
            <div className="px-4 sm:px-7 py-3 bg-black/80 border-t border-iron/50 flex items-center justify-between text-xs sm:text-sm font-mono text-parchment shrink-0">
              <span className="flex items-center gap-1.5 text-gold-aged font-bold">
                <Sparkles size={15} /> Lembre-se: O Vazio nunca perdoa a hesitação.
              </span>
              <button
                type="button"
                onClick={() => {
                  audio.play('click');
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded border border-gold-aged/60 bg-stone-900 hover:bg-blood text-amber-100 font-bold transition-colors cursor-pointer"
              >
                Fechar Guia [ESC]
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
    <div className="space-y-6 text-parchment">
      {/* 1. Objetivo Central */}
      <section className="rounded-xl border-2 border-blood/70 bg-black/65 p-4 sm:p-6 shadow-[0_0_24px_rgba(139,0,0,0.28)]">
        <div className="flex items-center gap-2.5 text-red-300 font-grimoire font-black text-lg sm:text-xl tracking-wider mb-2">
          <Skull size={22} className="text-blood-bright shrink-0" />
          <span>O OBJETIVO DOS CONDENADOS</span>
        </div>
        <p className="text-parchment text-sm sm:text-base leading-relaxed">
          De <strong>2 a 8 jogadores</strong> sentam-se ao redor da mesa cerimonial. Cada jogador inicia com{' '}
          <strong>2 a 5 Vidas</strong> (padrão: 3 Vidas). Em cada rodada, todos escolhem simultaneamente sua ação
          antes do relógio central zerar. Quando todas as escolhas são travadas, as cartas são reveladas e resolvidas
          em ordem estrita de prioridade (<strong>P1 até P5</strong>). O último sobrevivente vence a partida!
        </p>
      </section>

      {/* 2. HUD de Combate e Retrato Dinâmico do Jogador */}
      <section className="rounded-xl border-2 border-gold-aged/70 bg-black/65 p-4 sm:p-6 shadow-[0_0_24px_rgba(212,175,55,0.2)]">
        <div className="flex items-center gap-2.5 text-amber-200 font-grimoire font-black text-lg sm:text-xl tracking-wider mb-2">
          <ShieldAlert size={22} className="text-gold-aged shrink-0" />
          <span>HUD DE COMBATE & RETRATO DINÂMICO DE TENSÃO</span>
        </div>
        <p className="text-parchment text-sm sm:text-base mb-4">
          A área inferior da tela organiza suas cartas na camada superior e seus controles de combate ao redor do seu{' '}
          <strong>Retrato Dinâmico</strong>:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-typewriter text-sm sm:text-[15px]">
          <div className="rounded-lg bg-wood-dark/90 border-2 border-gold-aged/50 p-3.5">
            <strong className="font-grimoire text-amber-300 text-base block mb-1">
              1. CONTROLE ESQUERDO (AÇÃO EM SI)
            </strong>
            Permite usar rapidamente a carta selecionada em <strong>Si Mesmo</strong> (como curar-se com a Seringa,
            erguer uma Parede própria, fortalecer sua Faca com Manip. de Alma ou quebrar um Pacto de Sangue).
          </div>
          <div className="rounded-lg bg-wood-dark/90 border-2 border-red-500/50 p-3.5">
            <strong className="font-grimoire text-red-300 text-base block mb-1">
              2. CÍRCULO CENTRAL (RETRATO DINÂMICO)
            </strong>
            Seu avatar reage em tempo real à partida: muda de expressão, iluminação e postura quando você está com{' '}
            <strong>pouca vida</strong>, <strong>emparedado</strong>, com a <strong>mão exposta</strong>, sob{' '}
            <strong>Marca da Morte</strong> ou <strong>alvejado</strong>. As barras vermelhas exibem suas vidas.
          </div>
          <div className="rounded-lg bg-wood-dark/90 border-2 border-amber-500/50 p-3.5">
            <strong className="font-grimoire text-amber-200 text-base block mb-1">
              3. CONTROLE DIREITO (DESCARTAR / PASSAR)
            </strong>
            Agrupa os botões amplos para <strong>Descartar</strong> cartas selecionadas da mão (renovando suas opções
            no próximo turno) ou <strong>Passar a Vez</strong> sem jogar nenhuma carta.
          </div>
        </div>
      </section>

      {/* 3. Ordem de Resolução das 5 Prioridades */}
      <section className="rounded-xl border-2 border-iron/80 bg-black/55 p-4 sm:p-6">
        <div className="font-grimoire font-black text-lg sm:text-xl tracking-wider text-amber-100 mb-3 flex items-center gap-2.5">
          <Swords size={22} className="text-gold-aged shrink-0" />
          <span>ORDEM DE PRIORIDADE NA RODADA (P1 → P5)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-sm sm:text-[15px]">
          <div className="rounded-lg border-2 border-purple-500/75 bg-purple-950/35 p-3.5">
            <span className="font-mono text-purple-200 font-extrabold text-sm sm:text-base block mb-1">
              P1 · REAÇÃO (1º a resolver)
            </span>
            <strong>Espelho Amaldiçoado:</strong> Reflete ataques e maldições de volta aos atacantes e rouba paredes.
            Se ninguém interagir com o alvo protegido, cobra <strong>-1 Vida</strong> (Lei do Vácuo).
          </div>
          <div className="rounded-lg border-2 border-cyan-500/75 bg-cyan-950/35 p-3.5">
            <span className="font-mono text-cyan-200 font-extrabold text-sm sm:text-base block mb-1">
              P2 · DEFENSIVO (2º a resolver)
            </span>
            <strong>Parede:</strong> Ergue grades de ferro que bloqueiam 1 golpe de Faca e prendem a mira do jogador
            emparedado (só pode mirar em si mesmo ou usar Pacto de Sangue).
          </div>
          <div className="rounded-lg border-2 border-emerald-500/75 bg-emerald-950/35 p-3.5">
            <span className="font-mono text-emerald-200 font-extrabold text-sm sm:text-base block mb-1">
              P3 · SUPORTE (3º a resolver)
            </span>
            <strong>Seringa, Manip. de Alma e Revelar:</strong> Curas por carga (cuidado com a Overdose!), trocas de
            barra de vida, fortalecimento permanente da Faca (+1 Dano) e revelação de mão.
          </div>
          <div className="rounded-lg border-2 border-amber-500/75 bg-amber-950/35 p-3.5">
            <span className="font-mono text-amber-200 font-extrabold text-sm sm:text-base block mb-1">
              P4 · CONTROLE (4º a resolver)
            </span>
            <strong>Pacto de Sangue, Marca da Morte e Desarmar:</strong> Vínculos de sangue que atravessam paredes,
            maldições de morte em 5 rodadas e descarte forçado de 2 cartas.
          </div>
          <div className="rounded-lg border-2 border-red-500/80 bg-red-950/35 p-3.5 md:col-span-2 lg:col-span-2">
            <span className="font-mono text-red-200 font-extrabold text-sm sm:text-base block mb-1">
              P5 · OFENSIVO (5º e último a resolver)
            </span>
            <strong>Faca & Contagem da Marca da Morte:</strong> As lâminas cortam a mesa causando dano ou estilhaçando
            paredes. Em seguida, quem estiver com a <strong>Marca da Morte</strong> e não tiver sangrado na rodada
            perde 1 turno na contagem regressiva!
          </div>
        </div>
      </section>

      {/* 4. Controle de Câmera 3D */}
      <section className="rounded-xl border-2 border-stone-700 bg-black/60 p-4 sm:p-6">
        <div className="flex items-center gap-2.5 text-amber-300 font-grimoire font-black text-lg sm:text-xl tracking-wider mb-2">
          <Eye size={22} className="shrink-0" />
          <span>VISÃO 3D EM PRIMEIRA PESSOA & ACESSO AO GRIMÓRIO</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-sm sm:text-[15px]">
          <div className="rounded-lg bg-wood-dark/80 border border-gold-aged/45 p-3.5">
            <strong className="font-mono text-amber-300 block mb-1">1. OLHAR PARA O TOPO ↑</strong>
            Inclina a visão para observar melhor as <strong>Silhuetas 3D</strong> dos oponentes, suas vidas, pactos,
            marcas e cartas reveladas.
          </div>
          <div className="rounded-lg bg-wood-dark/80 border border-red-500/45 p-3.5">
            <strong className="font-mono text-red-300 block mb-1">2. OLHAR PARA A MESA / MÃO</strong>
            Foca no feltro octogonal, no relógio central, nas suas <strong>Cartas</strong> e nos controles da HUD.
          </div>
          <div className="rounded-lg bg-wood-dark/80 border border-amber-500/45 p-3.5">
            <strong className="font-mono text-amber-200 block mb-1">3. EMBAIXO DA MESA ↓</strong>
            Clique na barra inferior (ou tecla Seta Baixo) para abrir o <strong>Livro Grimório</strong> e o{' '}
            <strong>Caderno de Anotações & Chat</strong>.
          </div>
        </div>
      </section>
    </div>
  );
}

function TabTheCards() {
  return (
    <div className="space-y-4 text-parchment">
      <CardGrimoireBook />
    </div>
  );
}

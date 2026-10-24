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
import InscryptionCard from './InscryptionCard';
import { CARD_TYPES } from '../models/cardModel';

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
            className="w-full max-w-3xl max-h-[86dvh] flex flex-col rounded-xl border-4 border-stone-900 bg-gradient-to-b from-[#241710] via-wood-dark to-[#0f0906] text-parchment shadow-[0_0_60px_rgba(0,0,0,0.95),inset_0_0_40px_rgba(44,29,18,0.7)] overflow-hidden"
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
                      3D · 7 CARTAS
                    </span>
                  </h2>
                  <p className="text-[10px] sm:text-xs font-mono text-amber-200/80 tracking-wide">
                    Grimório de cartas, visão 3D em 1ª pessoa e sobrevivência no STRIKE / VOID
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
                <span>🃏 AS 7 CARTAS</span>
                <span className="hidden sm:inline text-[11px] font-mono opacity-80">(Grimório Completo)</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
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
            Olha embaixo da mesa e abre o <strong>Caderno de Anotações & Chat</strong> clandestino.
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
          <Swords size={15} className="text-gold-aged" /> COREOGRAFIA DA RESOLUÇÃO (4 ETAPAS)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10.5px] font-mono">
          <div className="rounded border border-fuchsia-950 bg-black/60 p-2">
            <span className="text-fuchsia-400 font-bold block mb-0.5">1. ESPELHOS AMALDIÇOADOS</span>
            Reflete ataques, quebra Pacto de Sangue contra o autor e pune uso no vazio com -1 Vida.
          </div>
          <div className="rounded border border-blue-950 bg-black/60 p-2">
            <span className="text-blue-400 font-bold block mb-0.5">2. PAREDES</span>
            Ergue grades de ferro que bloqueiam 1 facada e prendem a mira do alvo.
          </div>
          <div className="rounded border border-amber-900 bg-black/60 p-2">
            <span className="text-amber-400 font-bold block mb-0.5">3. RITUAIS & ARCANOS</span>
            Resolve Pacto de Sangue, Manipulamento de Alma, Desarmar e Revelar.
          </div>
          <div className="rounded border border-red-950 bg-black/60 p-2">
            <span className="text-red-400 font-bold block mb-0.5">4. FACAS</span>
            Executa golpes diretos, estilhaça paredes e propaga dano pelos Pactos de Sangue!
          </div>
        </div>
      </div>
    </div>
  );
}

function TabTheCards() {
  const cardsList = [
    {
      type: CARD_TYPES.FACA,
      title: '🔪 FACA (ATAQUE & QUEBRA DE PAREDE)',
      badge: 'Ofensiva · 1+ Dano',
      borderCls: 'border-red-950/70',
      titleCls: 'text-red-400',
      bullets: [
        'Causa 1 de Dano (ou mais se fortalecida por Manipulamento de Alma) se o alvo não estiver emparedado.',
        'Se o alvo estiver protegido por Parede, destrói a Parede (e se a Faca tiver dano > 1, o dano excedente perfura o alvo!).',
        'Usar em si mesmo quando EMPAREDADO destrói sua própria Parede sem sofrer dano!',
      ],
    },
    {
      type: CARD_TYPES.PAREDE,
      title: '🧱 PAREDE (DEFESA & PRISÃO TÁTICA)',
      badge: 'Defensiva · Isolamento',
      borderCls: 'border-cyan-950/80',
      titleCls: 'text-[#7fa3c0]',
      bullets: [
        'Ergue grades de ferro em volta do alvo selecionado (em você ou num oponente).',
        'Absorve 1 facada e se quebra.',
        'Enquanto estiver EMPAREDADO, o jogador só pode mirar em si mesmo (exceto com Pacto de Sangue, que ignora paredes!).',
      ],
    },
    {
      type: CARD_TYPES.REVERSO,
      title: '🪞 ESPELHO AMALDIÇOADO (ANTIGO REVERSO)',
      badge: 'Reflexo · Maldição',
      borderCls: 'border-fuchsia-950/80',
      titleCls: 'text-fuchsia-300',
      bullets: [
        'Arte atualizada para um Espelho Quebrado sombrio.',
        'Reflete ações externas de volta para quem atacou o alvo protegido pelo espelho.',
        'Inverte auto-golpes (Blefe Russo) ou rouba Paredes erguidas pelo alvo para o conjurador.',
        'Lei do Vácuo: se nenhuma ação interagir com o alvo na rodada, quem usou o Espelho Amaldiçoado perde 1 Vida!',
      ],
    },
    {
      type: CARD_TYPES.REVELAR,
      title: '👁️ REVELAR (OLHO ABISSAL)',
      badge: 'Nova · Espionagem',
      borderCls: 'border-amber-900/80',
      titleCls: 'text-amber-300',
      bullets: [
        'Utiliza a arte hipnótica do Olho Abissal.',
        'Revela todas as cartas da mão da pessoa selecionada para TODA A MESA!',
        'As cartas reveladas ficam expostas flutuando acima da silhueta do alvo e registradas no Caderno.',
      ],
    },
    {
      type: CARD_TYPES.DESARMAR,
      title: '🧤 DESARMAR (SABOTAGEM DIRETA)',
      badge: 'Nova · Descarte Forçado',
      borderCls: 'border-orange-900/80',
      titleCls: 'text-orange-300',
      bullets: [
        'Arranca e descarta 2 cartas aleatórias diretamente da mão de outro jogador.',
        'Como cada jogador compra apenas 1 carta por rodada, desarmar um oponente reduz drasticamente as opções dele!',
      ],
    },
    {
      type: CARD_TYPES.MANIPULAMENTO_ALMA,
      title: '👻 MANIPULAMENTO DE ALMA (VIDA OU PODER)',
      badge: 'Nova · Troca de Vida / +1 Faca',
      borderCls: 'border-teal-900/80',
      titleCls: 'text-teal-300',
      bullets: [
        'Em outro jogador: Troca a sua barra de vida atual pela barra de vida do alvo selecionado!',
        'Em si mesmo: Canaliza a própria alma e aumenta permanentemente o dano da sua própria Faca (+1 de Dano)!',
      ],
    },
    {
      type: CARD_TYPES.PACTO_SANGUE,
      title: '🩸 PACTO DE SANGUE (VÍNCULO CARMESIM)',
      badge: 'Nova · Ignora Parede & Vincula Vida',
      borderCls: 'border-rose-900/80',
      titleCls: 'text-rose-400',
      bullets: [
        'Ignora Parede: Pode ser usado mesmo se você ou o alvo estiverem Emparedados!',
        'Vincula a barra de vida com outra pessoa: sempre que um dos dois sofrer dano, o outro também perde vida!',
        'Risco Mortal: Se o alvo refletir o Pacto de Sangue com o Espelho Amaldiçoado, você toma 1 de Dano imediatamente!',
      ],
    },
  ];

  return (
    <div className="space-y-3 text-parchment">
      {cardsList.map((item) => (
        <div
          key={item.type}
          className={cn(
            'rounded-lg border-2 bg-black/60 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start',
            item.borderCls
          )}
        >
          <div className="shrink-0 mx-auto sm:mx-0">
            <InscryptionCard card={{ type: item.type }} small />
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn('font-grimoire font-extrabold text-sm sm:text-base tracking-wider', item.titleCls)}>
                {item.title}
              </h3>
              <span className="text-[10px] font-mono bg-stone-900 border border-stone-700 text-amber-200 px-1.5 py-0.5 rounded">
                {item.badge}
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs text-parchment-dark">
              {item.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

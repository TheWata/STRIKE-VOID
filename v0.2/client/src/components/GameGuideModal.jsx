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
  Zap,
  Search,
  Crosshair,
  Shield,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { audio } from '../lib/audio';
import CardGrimoireBook from './CardGrimoireBook';
import GameIcon from './GameIcon';
import { CARD_TYPES, CARD_META } from '../models/cardModel';

const QUICK_CARDS_DATA = [
  {
    type: CARD_TYPES.REVERSO,
    name: 'Espelho Amaldiçoado',
    priority: 'P1 · REAÇÃO',
    priorityCls: 'bg-purple-950/80 border-purple-500 text-purple-200',
    icon: 'cursed-mirror',
    shortEffect: 'Reflete ataques e maldições de volta para quem mirou em você.',
    selfAction: 'Alvo em si: reflete golpes contra você (Cuidado: se ninguém te atacar na rodada, perde 1 Vida no Vácuo!).',
    wallRule: 'Respeita Parede. Se emparedado, só pode usar em si mesmo.',
    badgeTone: 'border-purple-500',
  },
  {
    type: CARD_TYPES.PAREDE,
    name: 'Parede de Ferro',
    priority: 'P2 · DEFENSIVO',
    priorityCls: 'bg-cyan-950/80 border-cyan-500 text-cyan-200',
    icon: 'iron-wall',
    shortEffect: 'Ergue grades de ferro que absorvem 1 golpe de Faca.',
    selfAction: 'Alvo em si: ergue a Parede ao redor de você. Enquanto emparedado, só pode mirar em si ou usar Pacto.',
    wallRule: 'Cria o estado Emparedado. Absorve 1 facada e se estilhaça.',
    badgeTone: 'border-cyan-500',
  },
  {
    type: CARD_TYPES.SERINGA,
    name: 'Seringa Alquímica',
    priority: 'P3 · SUPORTE',
    priorityCls: 'bg-emerald-950/80 border-emerald-500 text-emerald-200',
    icon: 'syringe-vial',
    shortEffect: 'Acumula +1 carga por turno na mão (máx 4). Cada carga cura +1 de Vida.',
    selfAction: 'Alvo em si: restaura vida. ALERTA: cargas em excesso da sua vida máxima aplicam OVERDOSE e Marca da Morte!',
    wallRule: 'Respeita Parede (não pode ser usada em oponente emparedado).',
    badgeTone: 'border-emerald-500',
  },
  {
    type: CARD_TYPES.MANIPULAMENTO_ALMA,
    name: 'Manipulamento de Alma',
    priority: 'P3 · SUPORTE',
    priorityCls: 'bg-teal-950/80 border-teal-500 text-teal-200',
    icon: 'soul-flame',
    shortEffect: 'Em oponente: troca sua vida pela dele. Em si mesmo: +1 Dano permanente na Faca.',
    selfAction: 'Alvo em si: canaliza a alma e concede +1 DANO PERMANENTE para a sua própria Faca pelo resto da partida!',
    wallRule: 'Respeita Parede.',
    badgeTone: 'border-teal-500',
  },
  {
    type: CARD_TYPES.REVELAR,
    name: 'Revelar',
    priority: 'P3 · SUPORTE',
    priorityCls: 'bg-amber-950/80 border-amber-500 text-amber-200',
    icon: 'abyssal-eye',
    shortEffect: 'Expõe todas as cartas da mão de um adversário para a mesa por 2 turnos.',
    selfAction: 'Não aplicável em si mesmo. Selecione um oponente vivo na mesa para revelar a mão dele.',
    wallRule: 'Bloqueado se você estiver emparedado.',
    badgeTone: 'border-amber-500',
  },
  {
    type: CARD_TYPES.PACTO_SANGUE,
    name: 'Pacto de Sangue',
    priority: 'P4 · CONTROLE',
    priorityCls: 'bg-rose-950/80 border-rose-500 text-rose-200',
    icon: 'broken-chain',
    shortEffect: 'Vincula vidas compartilhando dano. Atravessa qualquer parede!',
    selfAction: 'Alvo em si: se você tiver pacto ativo, QUEBRA todos os seus pactos! Se não tiver pacto, perde 1 de Vida.',
    wallRule: 'IGNORA PAREDES. Pode ser lançado mesmo se você ou o alvo estiverem emparedados.',
    badgeTone: 'border-rose-500',
  },
  {
    type: CARD_TYPES.MARCA_MORTE,
    name: 'Marca da Morte',
    priority: 'P4 · CONTROLE',
    priorityCls: 'bg-lime-950/80 border-lime-500 text-lime-200',
    icon: 'death-mark',
    shortEffect: 'Amaldiçoa o alvo: se ficar 5 rodadas sem tomar dano, morre na hora!',
    selfAction: 'Apenas em oponentes. Sofrer qualquer dano na mesa purga a maldição com sangue.',
    wallRule: 'Bloqueado se você estiver emparedado.',
    badgeTone: 'border-lime-500',
  },
  {
    type: CARD_TYPES.DESARMAR,
    name: 'Desarmar',
    priority: 'P4 · CONTROLE',
    priorityCls: 'bg-orange-950/80 border-orange-500 text-orange-200',
    icon: 'disarm-slash',
    shortEffect: 'Arranca e descarta até 2 cartas aleatórias da mão do adversário.',
    selfAction: 'Apenas em oponentes. Clique na silhueta de um jogador para desarmá-lo.',
    wallRule: 'Bloqueado se você estiver emparedado.',
    badgeTone: 'border-orange-500',
  },
  {
    type: CARD_TYPES.FACA,
    name: 'Faca Cerimonial',
    priority: 'P5 · OFENSIVO',
    priorityCls: 'bg-red-950/80 border-red-500 text-red-200',
    icon: 'dagger-strike',
    shortEffect: 'Causa 1+ de dano fatal ou estilhaça a Parede do alvo.',
    selfAction: 'Alvo em si: se você estiver EMPAREDADO, destrói sua Parede sem sofrer dano! Se livre: corta a própria carne (-1 HP).',
    wallRule: 'Destrói a Parede do alvo (dano fortalecido que sobra atinge a vida).',
    badgeTone: 'border-red-500',
  },
];

export default function GameGuideModal({ open, onClose, inGame = false }) {
  // Durante a partida, abre diretamente na Consulta Rápida (para leitura instantânea no meio do turno)
  const [activeTab, setActiveTab] = useState(inGame ? 'quick' : 'cards');

  useEffect(() => {
    if (open && inGame) {
      setActiveTab('quick');
    }
  }, [open, inGame]);

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
            className="w-[96vw] max-w-5xl max-h-[90dvh] flex flex-col rounded-2xl border-4 border-stone-900 bg-gradient-to-b from-[#241710] via-wood-dark to-[#0f0906] text-parchment shadow-[0_0_75px_rgba(0,0,0,0.98),inset_0_0_40px_rgba(44,29,18,0.7)] overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-4 sm:px-6 py-3 border-b-2 border-stone-700/80 bg-gradient-to-r from-[#332115] via-[#3d2719] to-[#2a1b11] shadow-[0_2px_15px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-blood/45 border-2 border-blood-bright text-white shadow-[0_0_16px_rgba(220,38,38,0.5)] shrink-0">
                  <BookOpen size={20} className="text-red-200" />
                </div>
                <div>
                  <h2
                    id="guide-title"
                    className="font-grimoire font-black text-base sm:text-xl tracking-wider text-amber-100 flex flex-wrap items-center gap-2"
                  >
                    <span>MANUAL DO CONDENADO</span>
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-200 bg-gold-aged/20 border border-gold-aged/60 px-2 py-0.5 rounded">
                      CONSULTA RÁPIDA · 9 CARTAS · P1 → P5
                    </span>
                  </h2>
                  <p className="text-[11px] sm:text-xs font-typewriter text-amber-200/80 tracking-wide mt-0.5">
                    Consulte os efeitos das cartas, interações com o retrato e regras de combate a qualquer momento
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
                className="h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border-2 border-stone-600 bg-stone-900/95 hover:bg-blood hover:border-red-400 text-stone-200 hover:text-white transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
                aria-label="Fechar guia"
              >
                <X size={20} />
              </button>
            </div>

            {/* Abas Principais: Consulta Rápida (para o meio da partida), Grimório Detalhado e Regras Gerais */}
            <div className="px-3 sm:px-6 py-2.5 bg-black/60 border-b border-stone-800/90 flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
              <button
                id="tab-guide-quick"
                type="button"
                onClick={() => handleTabChange('quick')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-grimoire font-extrabold text-xs sm:text-sm tracking-wider transition-all min-h-[42px] cursor-pointer',
                  activeTab === 'quick'
                    ? 'border-2 border-blood-bright bg-blood/60 text-white shadow-[0_0_16px_rgba(220,38,38,0.6)]'
                    : 'border border-iron/70 bg-black/50 text-parchment-dark hover:border-gold-aged hover:text-amber-100'
                )}
              >
                <Zap size={16} className={activeTab === 'quick' ? 'text-amber-300' : 'text-stone-400'} />
                <span>⚡ CONSULTA RÁPIDA (9 CARTAS)</span>
              </button>

              <button
                id="tab-guide-cards"
                type="button"
                onClick={() => handleTabChange('cards')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-grimoire font-extrabold text-xs sm:text-sm tracking-wider transition-all min-h-[42px] cursor-pointer',
                  activeTab === 'cards'
                    ? 'border-2 border-gold-aged bg-gold-aged/25 text-amber-100 shadow-[0_0_16px_rgba(212,175,55,0.45)]'
                    : 'border border-iron/70 bg-black/50 text-parchment-dark hover:border-gold-aged hover:text-amber-100'
                )}
              >
                <Layers size={16} className={activeTab === 'cards' ? 'text-gold-aged' : 'text-stone-400'} />
                <span>🃏 GRIMÓRIO ILUSTRADO</span>
              </button>

              <button
                id="tab-guide-game"
                type="button"
                onClick={() => handleTabChange('game')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-grimoire font-extrabold text-xs sm:text-sm tracking-wider transition-all min-h-[42px] cursor-pointer',
                  activeTab === 'game'
                    ? 'border-2 border-amber-500 bg-amber-950/40 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                    : 'border border-iron/70 bg-black/50 text-parchment-dark hover:border-gold-aged hover:text-amber-100'
                )}
              >
                <Flame size={16} className={activeTab === 'game' ? 'text-amber-400' : 'text-stone-400'} />
                <span>🩸 REGRAS, CONTROLES & RETRATO</span>
              </button>
            </div>

            {/* Conteúdo com rolagem fluida e alta legibilidade */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 font-typewriter text-xs sm:text-sm leading-relaxed scrollbar-thin">
              {activeTab === 'quick' ? (
                <TabQuickReference />
              ) : activeTab === 'game' ? (
                <TabTheGame />
              ) : (
                <TabTheCards />
              )}
            </div>

            {/* Rodapé com atalho de fechar */}
            <div className="px-4 sm:px-6 py-2.5 bg-black/85 border-t border-iron/50 flex items-center justify-between text-xs font-mono text-parchment shrink-0">
              <span className="flex items-center gap-1.5 text-gold-aged font-bold text-[11px] sm:text-xs">
                <Sparkles size={14} /> Dica: Pressione [G] ou [ESC] durante a partida para abrir/fechar o guia instantaneamente.
              </span>
              <button
                type="button"
                onClick={() => {
                  audio.play('click');
                  onClose();
                }}
                className="px-3 py-1 rounded border border-gold-aged/60 bg-stone-900 hover:bg-blood text-amber-100 font-bold transition-colors cursor-pointer"
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

/**
 * Aba de Consulta Rápida de Partida:
 * Tabela ultra-legível com todas as 9 cartas, prioridades, efeitos imediatos,
 * o que acontece ao usar em si mesmo (clicar no retrato) e interação com parede.
 */
function TabQuickReference() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = QUICK_CARDS_DATA.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shortEffect.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.selfAction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.priority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3.5 text-parchment">
      {/* Barra de Busca de Consulta Rápida */}
      <div className="flex items-center gap-2 bg-black/70 border border-gold-aged/50 rounded-lg px-3 py-1.5 shadow-inner">
        <Search size={15} className="text-gold-aged shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar carta ou efeito (ex: seringa, parede, espelho, dano)..."
          className="flex-1 bg-transparent text-xs sm:text-sm font-mono text-amber-100 outline-none placeholder:text-stone-500"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-stone-400 hover:text-white font-mono text-xs cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Grade de Cartas Formatada para Leitura em Segundos */}
      <div className="space-y-2.5">
        {filtered.map((c) => (
          <div
            key={c.type}
            className="rounded-lg border-2 border-stone-800 bg-gradient-to-r from-[#21140c] via-[#1a0f09] to-[#120905] p-3 sm:p-3.5 shadow-md hover:border-gold-aged/70 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-black/60 border border-gold-aged/50 text-gold-aged shrink-0">
                  <GameIcon name={c.icon} size={18} />
                </div>
                <div>
                  <h4 className="font-grimoire font-black text-sm sm:text-base text-amber-100 leading-tight">
                    {c.name}
                  </h4>
                  <p className="font-typewriter text-xs text-parchment-dark mt-0.5">
                    {c.shortEffect}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  'px-2 py-0.5 rounded border font-mono text-[10.5px] font-extrabold uppercase shrink-0',
                  c.priorityCls
                )}
              >
                {c.priority}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-typewriter">
              <div className="rounded bg-black/45 border border-red-900/60 p-2 text-red-100">
                <span className="font-mono text-[10px] font-extrabold text-red-300 uppercase block mb-0.5 flex items-center gap-1">
                  <Crosshair size={12} className="text-red-400" />
                  <span>USAR EM SI MESMO (CLICAR NO RETRATO):</span>
                </span>
                <span>{c.selfAction}</span>
              </div>

              <div className="rounded bg-black/45 border border-sky-900/60 p-2 text-sky-100">
                <span className="font-mono text-[10px] font-extrabold text-sky-300 uppercase block mb-0.5 flex items-center gap-1">
                  <Shield size={12} className="text-sky-400" />
                  <span>INTERAÇÃO COM PAREDE:</span>
                </span>
                <span>{c.wallRule}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabTheGame() {
  return (
    <div className="space-y-4 text-parchment">
      {/* 1. Objetivo Central */}
      <section className="rounded-xl border-2 border-blood/70 bg-black/65 p-3.5 sm:p-5 shadow-[0_0_24px_rgba(139,0,0,0.28)]">
        <div className="flex items-center gap-2 text-red-300 font-grimoire font-black text-base sm:text-lg tracking-wider mb-1.5">
          <Skull size={20} className="text-blood-bright shrink-0" />
          <span>O OBJETIVO DOS CONDENADOS</span>
        </div>
        <p className="text-parchment text-xs sm:text-sm leading-relaxed">
          De <strong>2 a 8 jogadores</strong> sentam-se ao redor da mesa cerimonial. Cada jogador inicia com{' '}
          <strong>2 a 5 Vidas</strong> (padrão: 3 Vidas). Em cada rodada, todos escolhem simultaneamente sua ação
          antes do relógio central zerar. Quando todas as escolhas são travadas, as cartas são reveladas e resolvidas
          em ordem estrita de prioridade (<strong>P1 até P5</strong>). O último sobrevivente vence a partida!
        </p>
      </section>

      {/* 2. HUD de Combate e Retrato Dinâmico do Jogador */}
      <section className="rounded-xl border-2 border-gold-aged/70 bg-black/65 p-3.5 sm:p-5 shadow-[0_0_24px_rgba(212,175,55,0.2)]">
        <div className="flex items-center gap-2 text-amber-200 font-grimoire font-black text-base sm:text-lg tracking-wider mb-2">
          <ShieldAlert size={20} className="text-gold-aged shrink-0" />
          <span>HUD DE COMBATE & RETRATO DINÂMICO DE TENSÃO</span>
        </div>
        <p className="text-parchment text-xs sm:text-sm mb-3">
          A área inferior da tela organiza suas cartas na camada superior e seus controles de combate ao redor do seu{' '}
          <strong>Retrato Central</strong>:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-typewriter text-xs sm:text-sm">
          <div className="rounded-lg bg-wood-dark/90 border-2 border-gold-aged/50 p-3">
            <strong className="font-grimoire text-amber-300 text-sm block mb-1">
              1. ASA ESQUERDA (DESCARTAR)
            </strong>
            Permite <strong>Descartar</strong> as cartas selecionadas da mão (até o limite da sala) para renovar
            opções na próxima rodada.
          </div>
          <div className="rounded-lg bg-wood-dark/90 border-2 border-red-500/50 p-3">
            <strong className="font-grimoire text-red-300 text-sm block mb-1">
              2. CÍRCULO CENTRAL (RETRATO & AUTO-USO)
            </strong>
            Seu avatar exibe expressões dinâmicas (Normal, Pouca Vida, Preso, Dor, Alívio) e funciona como{' '}
            <strong>alvo direto</strong>: ao selecionar uma carta compatível, surge um contorno circular vermelho — basta clicar no retrato para utilizá-la em si mesmo!
          </div>
          <div className="rounded-lg bg-wood-dark/90 border-2 border-amber-500/50 p-3">
            <strong className="font-grimoire text-amber-200 text-sm block mb-1">
              3. ASA DIREITA (PASSAR A VEZ)
            </strong>
            Permite <strong>Passar a Vez</strong> imediatamente, mantendo sua mão atual sem gastar nem descartar cartas na rodada.
          </div>
        </div>
      </section>

      {/* 3. Ordem de Resolução das 5 Prioridades */}
      <section className="rounded-xl border-2 border-iron/80 bg-black/55 p-3.5 sm:p-5">
        <div className="font-grimoire font-black text-base sm:text-lg tracking-wider text-amber-100 mb-2.5 flex items-center gap-2">
          <Swords size={20} className="text-gold-aged shrink-0" />
          <span>ORDEM DE PRIORIDADE NA RODADA (P1 → P5)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs sm:text-sm">
          <div className="rounded-lg border-2 border-purple-500/75 bg-purple-950/35 p-2.5">
            <span className="font-mono text-purple-200 font-extrabold text-xs block mb-1">
              P1 · REAÇÃO (1º a resolver)
            </span>
            <strong>Espelho Amaldiçoado:</strong> Reflete ataques e maldições de volta. No vácuo: <strong>-1 Vida</strong>.
          </div>
          <div className="rounded-lg border-2 border-cyan-500/75 bg-cyan-950/35 p-2.5">
            <span className="font-mono text-cyan-200 font-extrabold text-xs block mb-1">
              P2 · DEFENSIVO (2º a resolver)
            </span>
            <strong>Parede:</strong> Ergue grades de ferro que bloqueiam 1 facada e prendem a mira do emparedado.
          </div>
          <div className="rounded-lg border-2 border-emerald-500/75 bg-emerald-950/35 p-2.5">
            <span className="font-mono text-emerald-200 font-extrabold text-xs block mb-1">
              P3 · SUPORTE (3º a resolver)
            </span>
            <strong>Seringa, Manip. Alma e Revelar:</strong> Curas por carga (cuidado com Overdose!), trocas de vida, +1 Dano na Faca e revelação de mão.
          </div>
          <div className="rounded-lg border-2 border-amber-500/75 bg-amber-950/35 p-2.5">
            <span className="font-mono text-amber-200 font-extrabold text-xs block mb-1">
              P4 · CONTROLE (4º a resolver)
            </span>
            <strong>Pacto de Sangue, Marca e Desarmar:</strong> Vínculos que atravessam paredes, maldições de morte e descarte forçado de 2 cartas.
          </div>
          <div className="rounded-lg border-2 border-red-500/80 bg-red-950/35 p-2.5 md:col-span-2 lg:col-span-2">
            <span className="font-mono text-red-200 font-extrabold text-xs block mb-1">
              P5 · OFENSIVO (5º e último a resolver)
            </span>
            <strong>Faca Cerimonial:</strong> Golpes fatais na mesa ou estilhaçamento de paredes. Em seguida, contagem regressiva da Marca da Morte.
          </div>
        </div>
      </section>

      {/* 4. Controle de Câmera 3D */}
      <section className="rounded-xl border-2 border-stone-700 bg-black/60 p-3.5 sm:p-5">
        <div className="flex items-center gap-2 text-amber-300 font-grimoire font-black text-base sm:text-lg tracking-wider mb-2">
          <Eye size={20} className="shrink-0" />
          <span>VISÃO 3D EM PRIMEIRA PESSOA & ACESSO AO GRIMÓRIO</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs sm:text-sm">
          <div className="rounded-lg bg-wood-dark/80 border border-gold-aged/45 p-2.5">
            <strong className="font-mono text-amber-300 block mb-0.5">1. OLHAR PARA O TOPO ↑</strong>
            Observa as <strong>Silhuetas 3D</strong> dos oponentes, vidas, pactos e cartas reveladas.
          </div>
          <div className="rounded-lg bg-wood-dark/80 border border-red-500/45 p-2.5">
            <strong className="font-mono text-red-300 block mb-0.5">2. OLHAR PARA A MESA / MÃO</strong>
            Foca nas suas <strong>Cartas</strong> e nos controles da HUD de combate.
          </div>
          <div className="rounded-lg bg-wood-dark/80 border border-amber-500/45 p-2.5">
            <strong className="font-mono text-amber-200 block mb-0.5">3. EMBAIXO DA MESA ↓</strong>
            Clique na barra inferior para abrir o <strong>Livro Grimório</strong> e o <strong>Caderno de Chat</strong>.
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

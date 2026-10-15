import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Skull,
  Swords,
  Shield,
  RotateCcw,
  Clock,
  Flame,
  AlertTriangle,
  Sparkles,
  BookOpen,
  HelpCircle,
  Hourglass,
  Layers,
  Heart,
  Ban,
  ArrowRight,
  Crosshair,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { audio } from '../lib/audio';
import InscryptionCard from './InscryptionCard';

/* ------------------------------------------------------------------ */
/* Modal Interativo de Regras e Como Jogar: STRIKE / VOID            */
/* ------------------------------------------------------------------ */
export default function GameGuideModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'cards'

  // Fechar no ESC
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
            className="w-full max-w-3xl max-h-[90dvh] sm:max-h-[86dvh] flex flex-col rounded-xl border-4 border-stone-900 bg-gradient-to-b from-[#241710] via-wood-dark to-[#0f0906] text-parchment shadow-[0_0_60px_rgba(0,0,0,0.95),inset_0_0_40px_rgba(44,29,18,0.7)] overflow-hidden"
          >
            {/* Header com Título e Fechar */}
            <div className="relative px-3 sm:px-6 pt-3 sm:pt-4 pb-3 border-b-2 border-iron/60 bg-black/40 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 rounded bg-blood/30 border border-blood-bright/60 text-blood-bright shadow-[0_0_12px_rgba(220,38,38,0.4)] shrink-0">
                  <BookOpen size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2
                    id="guide-title"
                    className="font-grimoire font-extrabold text-sm sm:text-lg tracking-wider text-parchment flex items-center gap-1.5"
                  >
                    MANUAL DO CONDENADO
                    <span className="text-[10px] font-mono text-gold-aged bg-gold-aged/10 border border-gold-aged/40 px-1.5 py-0.2 rounded hidden sm:inline-block">
                      v0.2
                    </span>
                  </h2>
                  <p className="text-[10px] sm:text-xs font-mono text-parchment-dark tracking-wide">
                    Regras, blefes e sobrevivência no STRIKE / VOID
                  </p>
                </div>
              </div>

              <button
                id="btn-close-guide"
                onClick={() => {
                  audio.play('click');
                  onClose();
                }}
                className="h-10 w-10 flex items-center justify-center rounded border border-iron/80 bg-black/60 hover:bg-blood/40 hover:border-blood-bright text-parchment-dark hover:text-white transition-colors shrink-0"
                aria-label="Fechar guia"
              >
                <X size={18} />
              </button>
            </div>

            {/* Seletor de Abas (Tabs) */}
            <div className="px-3 sm:px-6 pt-2.5 pb-2 bg-black/50 border-b border-iron/40 flex gap-2 shrink-0">
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
                <span>O JOGO</span>
                <span className="hidden sm:inline text-[11px] font-mono opacity-80">(Regras & Dinâmica)</span>
              </button>

              <button
                id="tab-guide-cards"
                onClick={() => handleTabChange('cards')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-md font-grimoire font-bold text-xs sm:text-sm tracking-wider transition-all min-h-[44px]',
                  activeTab === 'cards'
                    ? 'border-2 border-gold-aged bg-gold-aged/20 text-gold-aged shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                    : 'border border-iron/60 bg-black/40 text-parchment-dark hover:border-gold-aged hover:text-gold-aged'
                )}
              >
                <Layers size={15} className={activeTab === 'cards' ? 'text-gold-aged' : 'text-stone-400'} />
                <span>AS CARTAS</span>
                <span className="hidden sm:inline text-[11px] font-mono opacity-80">(Efeitos & Blefes)</span>
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 font-typewriter text-xs sm:text-sm leading-relaxed scrollbar-thin">
              {activeTab === 'game' ? <TabTheGame /> : <TabTheCards />}
            </div>

            {/* Rodapé Informativo */}
            <div className="px-3 sm:px-6 py-2.5 bg-black/60 border-t border-iron/40 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-parchment-dark shrink-0">
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

/* ------------------------------------------------------------------ */
/* ABA 1: O Jogo (Regras & Dinâmica)                                  */
/* ------------------------------------------------------------------ */
function TabTheGame() {
  return (
    <div className="space-y-4 text-parchment">
      {/* 1. Objetivo Central */}
      <div className="rounded-lg border-2 border-blood/60 bg-black/50 p-3 sm:p-4 shadow-[0_0_20px_rgba(139,0,0,0.25)]">
        <div className="flex items-center gap-2 text-blood-bright font-grimoire font-extrabold text-sm sm:text-base tracking-wider mb-1.5">
          <Skull size={18} /> O OBJETIVO DOS CONDENADOS
        </div>
        <p className="text-parchment-light">
          Você e outros <strong>4 a 8 jogadores</strong> estão trancados em uma mesa cerimonial. Cada um recebe uma
          reserva de vidas. Seu objetivo é simples e brutal: <strong>ser o último sobrevivente de pé</strong>.
        </p>
      </div>

      {/* Grid de 2 colunas para Turnos Simultâneos e Mão Limitada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Turnos Simultâneos */}
        <div className="rounded-lg border border-iron/70 bg-black/40 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gold-aged font-grimoire font-bold text-xs sm:text-sm tracking-wider mb-1">
            <Clock size={16} /> TURNOS SIMULTÂNEOS
          </div>
          <p className="text-[11px] sm:text-xs text-parchment-dark">
            <strong>Ninguém espera a sua vez.</strong> Em cada rodada, o relógio central inicia uma contagem regressiva.
            Todos os jogadores vivos escolhem secretamente uma carta e um alvo <em>ao mesmo tempo</em>. Quando o relógio
            zera ou todos travam (<span className="text-gold-aged font-mono">🔒</span>), a rodada é resolvida de uma só vez!
          </p>
        </div>

        {/* Mão Limitada */}
        <div className="rounded-lg border border-iron/70 bg-black/40 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gold-aged font-grimoire font-bold text-xs sm:text-sm tracking-wider mb-1">
            <Layers size={16} /> MÃO DE 3 CARTAS
          </div>
          <p className="text-[11px] sm:text-xs text-parchment-dark">
            Você sempre mantém exatamente <strong>3 cartas na mão</strong>. A cada nova rodada, você compra cartas do
            baralho central balanceado (96 cartas divididas igualmente entre <em>Facas</em>, <em>Paredes</em> e{' '}
            <em>Reversos</em>). O jogo exige ler intenções e prever quem vai atacar quem.
          </p>
        </div>
      </div>

      {/* Sangramento & Pressão do Relógio */}
      <div className="rounded-lg border border-iron/70 bg-black/40 p-3 sm:p-4">
        <div className="flex items-center gap-2 text-red-400 font-grimoire font-bold text-xs sm:text-sm tracking-wider mb-1">
          <Heart size={16} className="text-blood-bright fill-blood-bright" /> SANGRAMENTO & TEMPO ACELERADO
        </div>
        <p className="text-[11px] sm:text-xs text-parchment-dark mb-2">
          A quantidade de vidas iniciais é configurada pelo líder da sala (de <strong>2 a 5 Vidas</strong>). Mas atenção:
        </p>
        <div className="rounded bg-wood-dark/70 border border-stone-800 p-2.5 font-mono text-[11px] space-y-1 text-parchment">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Hourglass size={13} /> O sangue derramado cobra seu preço:
          </div>
          <p className="text-[10.5px] text-parchment-dark">
            Quanto mais ferido você estiver, <strong>menos tempo você terá para pensar</strong> no relógio central! O
            pânico aumenta, o coração pulsa acelerado na tela e você precisa decidir antes de desmaiar.
          </p>
        </div>
      </div>

      {/* O Vazio (A Regra do Castigo) */}
      <div className="rounded-lg border-2 border-fuchsia-900/60 bg-black/50 p-3 sm:p-4">
        <div className="flex items-center gap-2 text-fuchsia-400 font-grimoire font-bold text-xs sm:text-sm tracking-wider mb-1">
          <AlertTriangle size={16} /> A LEI DO VAZIO: HESITAÇÃO É MORTE
        </div>
        <p className="text-[11px] sm:text-xs text-parchment-dark mb-2">
          O STRIKE / VOID pune severamente jogadas covardes ou equivocadas no vazio:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-[11px] sm:text-xs text-parchment-light">
          <li>
            <strong className="text-amber-300">Tempo Esgotado:</strong> Se você não escolher uma carta antes do seu
            relógio zerar, você é forçado a <strong>Passar a Vez</strong>, ficando desprotegido contra todas as facadas da
            rodada.
          </li>
          <li>
            <strong className="text-fuchsia-400">Reverso no Vazio:</strong> Se você usar a carta Reverso em um alvo que não
            recebeu nenhum ataque e não se auto-atacou, você sofre <strong>Vácuo e perde 1 Vida instantaneamente</strong>!
          </li>
        </ul>
      </div>

      {/* Ordem de Resolução dos Revelares */}
      <div className="rounded-lg border border-iron/70 bg-black/40 p-3 sm:p-4">
        <div className="font-grimoire font-bold text-xs sm:text-sm tracking-wider text-parchment mb-2 flex items-center gap-2">
          <Swords size={15} className="text-gold-aged" /> COREOGRAFIA DA RESOLUÇÃO (ORDEM DOS EVENTOS)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10.5px] font-mono">
          <div className="rounded border border-fuchsia-950 bg-black/60 p-2">
            <span className="text-fuchsia-400 font-bold block mb-0.5">1. REVERSO</span>
            Inverte vetores de ataque e pune Reversos no vazio com -1 de Vida.
          </div>
          <div className="rounded border border-blue-950 bg-black/60 p-2">
            <span className="text-blue-400 font-bold block mb-0.5">2. PAREDE</span>
            Ergue barricadas de ferro, isolando os alvos das ações da rodada.
          </div>
          <div className="rounded border border-red-950 bg-black/60 p-2">
            <span className="text-red-400 font-bold block mb-0.5">3. FACA</span>
            Executa ataques diretos, estilhaça paredes ou corta a carne desprotegida.
          </div>
          <div className="rounded border border-gold-aged/50 bg-black/60 p-2">
            <span className="text-gold-aged font-bold block mb-0.5">4. ANÁLISE</span>
            Leitura da crônica no painel de logs antes do início da próxima rodada.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ABA 2: As Cartas (Efeitos & Blefes)                                */
/* ------------------------------------------------------------------ */
function TabTheCards() {
  return (
    <div className="space-y-4 text-parchment">
      {/* 1. FACA */}
      <div className="rounded-lg border-2 border-red-950/70 bg-black/50 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
        <div className="shrink-0 mx-auto sm:mx-0">
          <InscryptionCard card={{ type: 'FACA' }} small />
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-grimoire font-extrabold text-sm sm:text-base text-red-400 tracking-wider">
              🔪 FACA (O ATAQUE)
            </h3>
            <span className="text-[10px] font-mono bg-red-950/60 border border-red-600/50 text-red-300 px-1.5 py-0.5 rounded">
              Ofensiva / Cortante
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-parchment-light">
            O instrumento primário de eliminação. Desfere um golpe direto no alvo selecionado:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs text-parchment-dark">
            <li>
              <strong className="text-parchment">Ataque Direto:</strong> Causa <strong>1 Dano</strong> (-1 Vida) se o
              alvo não tiver proteção.
            </li>
            <li>
              <strong className="text-orange-400">Estilhaço de Barricada:</strong> Se o alvo estiver protegido por uma{' '}
              <em>Parede</em>, a faca quebra a parede (0 de dano direto, mas deixa o alvo desprotegido para as próximas
              rodadas).
            </li>
            <li>
              <strong className="text-amber-300">Auto-Golpe / Quebra Interna:</strong> Se você estiver <em>Emparedado</em>,
              usar a faca em si mesmo quebra a sua própria barricada sem tomar dano! Se você não estiver emparedado, sofre{' '}
              <span className="text-blood-bright font-bold">-1 Vida</span> de auto-dano.
            </li>
          </ul>
        </div>
      </div>

      {/* 2. PAREDE */}
      <div className="rounded-lg border-2 border-stone-800 bg-black/50 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
        <div className="shrink-0 mx-auto sm:mx-0">
          <InscryptionCard card={{ type: 'PAREDE' }} small />
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-grimoire font-extrabold text-sm sm:text-base text-[#7fa3c0] tracking-wider">
              🧱 PAREDE (A DEFESA & ISOLAMENTO)
            </h3>
            <span className="text-[10px] font-mono bg-blue-950/60 border border-[#7fa3c0]/50 text-[#7fa3c0] px-1.5 py-0.5 rounded">
              Defensiva / Tática
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-parchment-light">
            Ergue uma barricada de grades e arame farpado em torno de qualquer jogador (em você mesmo ou em um adversário):
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs text-parchment-dark">
            <li>
              <strong className="text-parchment">Bloqueio de Dano:</strong> Absorve 1 golpe de faca que atingir o alvo na
              rodada e é estilhaçada.
            </li>
            <li>
              <strong className="text-blue-300">O Estado de EMPAREDADO:</strong> O jogador trancado dentro da parede{' '}
              <strong>só pode usar cartas em si mesmo ou passar a vez</strong>! Ele fica impedido de atacar ou alvejar
              qualquer outro condenado até que a parede caia.
            </li>
            <li>
              <strong className="text-amber-300">Uso Ofensivo:</strong> Você pode emparedar um jogador agressivo para impedi-lo
              de finalizar outro jogador na mesa.
            </li>
          </ul>
        </div>
      </div>

      {/* 3. REVERSO */}
      <div className="rounded-lg border-2 border-fuchsia-950/80 bg-black/50 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
        <div className="shrink-0 mx-auto sm:mx-0">
          <InscryptionCard card={{ type: 'REVERSO' }} small />
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-grimoire font-extrabold text-sm sm:text-base text-fuchsia-300 tracking-wider">
              🔄 REVERSO (O INVERSOR SOMBRIO)
            </h3>
            <span className="text-[10px] font-mono bg-fuchsia-950/60 border border-fuchsia-600/50 text-fuchsia-300 px-1.5 py-0.5 rounded">
              Mental / Blefe Letal
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-parchment-light">
            A carta mais imprevisível e letal do jogo. Aplica uma inversão vetorial no <strong>Alvo</strong> selecionado
            (você ou outro jogador). Resolve <em>antes</em> de todas as facadas e paredes!
          </p>

          {/* Exemplos didáticos do Reverso */}
          <div className="space-y-2 mt-2 pt-2 border-t border-iron/40 font-mono text-[10.5px]">
            {/* Exemplo A: Ataque Externo */}
            <div className="rounded bg-wood-dark/60 p-2 border border-iron/60">
              <div className="flex items-center gap-1.5 text-gold-aged font-bold mb-0.5">
                <ArrowRight size={13} /> 1. ATAQUE EXTERNO REFLETIDO
              </div>
              <p className="text-parchment-dark">
                Se você aplicar Reverso no Jogador B (<span className="text-parchment">Você ➔ Reverso ➔ B</span>), e o
                Jogador C tentar esfaquear B (<span className="text-parchment">C ➔ Faca ➔ B</span>):
                <br />
                <span className="text-green-400 font-bold">↳ A facada é refletida de volta para C!</span> C leva o dano da
                própria faca. As ações que <em>saem</em> de B para outros não são afetadas.
              </p>
            </div>

            {/* Exemplo B: Auto-Ataque Invertido */}
            <div className="rounded bg-wood-dark/60 p-2 border border-iron/60">
              <div className="flex items-center gap-1.5 text-red-400 font-bold mb-0.5">
                <Crosshair size={13} /> 2. AUTO-ATAQUE INVERTIDO (A ROLETA RUSSA REVERSA)
              </div>
              <p className="text-parchment-dark">
                Se o Jogador A jogar Reverso no Jogador B, e B tentar esfaquear a si mesmo (
                <span className="text-parchment">B ➔ Faca ➔ B</span>):
                <br />
                <span className="text-red-400 font-bold">↳ O Reverso inverte a faca de B diretamente contra A!</span> B não
                sofre nada e A é perfurado pelo golpe.
              </p>
            </div>

            {/* Exemplo C: Punição do Vácuo */}
            <div className="rounded bg-wood-dark/60 p-2 border border-fuchsia-900/60">
              <div className="flex items-center gap-1.5 text-fuchsia-400 font-bold mb-0.5">
                <Ban size={13} /> 3. PUNIÇÃO DO VÁCUO (LEI DO SANGUE)
              </div>
              <p className="text-parchment-dark">
                Se o Reverso for conjurado e <strong>nenhuma ação interagir com o alvo</strong> (ninguém o atacou e ele não se
                auto-atacou):
                <br />
                <span className="text-fuchsia-300 font-bold">
                  ↳ O conjurador sofre Vácuo e perde 1 Vida instantaneamente!
                </span>{' '}
                Nunca jogue Reverso às cegas se você não tiver certeza de que haverá sangue.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PASSAR A VEZ */}
      <div className="rounded-lg border border-iron/60 bg-black/40 p-3 sm:p-4">
        <div className="flex items-center gap-2 text-stone-400 font-grimoire font-bold text-xs sm:text-sm tracking-wider mb-1">
          <Hourglass size={15} /> PASSAR A VEZ (TEMPO ESGOTADO OU HESITAÇÃO)
        </div>
        <p className="text-[11px] sm:text-xs text-parchment-dark">
          Se o seu tempo de rodada acabar antes de você escolher uma carta e alvo, o jogo executa automaticamente a ação{' '}
          <strong>PASSOU</strong>. Nenhuma carta é gasta, mas você fica completamente indefeso contra as facas dos
          adversários.
        </p>
      </div>
    </div>
  );
}

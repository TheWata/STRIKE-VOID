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
  ShieldAlert,
  CheckCircle2,
  Zap,
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
            className="w-full max-w-3xl max-h-[85dvh] flex flex-col rounded-xl border-4 border-stone-900 bg-gradient-to-b from-[#241710] via-wood-dark to-[#0f0906] text-parchment shadow-[0_0_60px_rgba(0,0,0,0.95),inset_0_0_40px_rgba(44,29,18,0.7)] overflow-hidden"
          >
            {/* Header com Título e Fechar com visual iluminado e claro */}
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
                      v0.2
                    </span>
                  </h2>
                  <p className="text-[10px] sm:text-xs font-mono text-amber-200/80 tracking-wide">
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
                className="h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md border border-stone-600 bg-stone-900/90 hover:bg-blood/60 hover:border-red-500 text-stone-200 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                aria-label="Fechar guia"
              >
                <X size={18} />
              </button>
            </div>

            {/* Seletor de Abas (Tabs) */}
            <div className="px-3 sm:px-6 pt-2.5 pb-2.5 bg-black/40 border-b border-stone-800/80 flex gap-2 shrink-0">
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
                <span>🩸 O JOGO</span>
                <span className="hidden sm:inline text-[11px] font-mono opacity-80">(Regras & Dinâmica)</span>
              </button>

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
                <span>🃏 AS CARTAS</span>
                <span className="hidden sm:inline text-[11px] font-mono opacity-80">(Efeitos & Blefes)</span>
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 font-typewriter text-xs sm:text-sm leading-relaxed scrollbar-thin">
              {activeTab === 'game' ? <TabTheGame /> : <TabTheCards />}
            </div>

            {/* Rodapé Informativo */}
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

/* ------------------------------------------------------------------ */
/* ABA 1: O Jogo (Regras & Dinâmica)                                  */
/* ------------------------------------------------------------------ */
function TabTheGame() {
  return (
    <div className="space-y-4 text-parchment">
      {/* 1. Objetivo Central */}
      <div className="rounded-lg border-2 border-blood/60 bg-black/60 p-3 sm:p-4 shadow-[0_0_20px_rgba(139,0,0,0.25)]">
        <div className="flex items-center gap-2 text-blood-bright font-grimoire font-extrabold text-sm sm:text-base tracking-wider mb-1.5">
          <Skull size={18} /> O OBJETIVO DOS CONDENADOS
        </div>
        <p className="text-parchment-light">
          Você e outros participantes (de <strong>2 a 8 jogadores</strong> na mesa) estão trancados em uma mesa cerimonial. Cada jogador
          inicia com uma reserva de vidas (de <strong>2 a 5 Vidas</strong>, configurada pelo anfitrião da sala, sendo 3 o
          padrão). Seu objetivo é impiedoso e direto: <strong>ser o último sobrevivente de pé</strong> na mesa.
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
            <strong>Ninguém espera a sua vez.</strong> Em cada rodada, o relógio central inicia a contagem regressiva.
            Todos os jogadores vivos escolhem secretamente uma carta e um alvo <em>ao mesmo tempo</em>. Quando o relógio
            zera ou todos travam a jogada (<span className="text-gold-aged font-mono">🔒</span>), o round é imediatamente
            resolvido em cadeia!
          </p>
        </div>

        {/* Mão Limitada & Regra Antitrinca */}
        <div className="rounded-lg border border-iron/70 bg-black/40 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gold-aged font-grimoire font-bold text-xs sm:text-sm tracking-wider mb-1">
            <Layers size={16} /> MÃO DE CARTAS & REGRA ANTITRINCA
          </div>
          <p className="text-[11px] sm:text-xs text-parchment-dark">
            O limite da mão é configurável pelo líder (de <strong>3 a 5 cartas</strong>, padrão 3). A cada round, você
            reabastece a mão a partir do baralho compartilhado de 96 cartas (32 Facas, 32 Paredes, 32 Reversos).
          </p>
          <div className="mt-2 pt-1.5 border-t border-iron/40 text-[10.5px] font-mono text-amber-200">
            <strong>⚖️ Proibido 3 Cartas Iguais:</strong> O sistema impede qualquer jogador de acumular uma trinca na mão
            (máximo de 2 cartas de cada tipo), exigindo versatilidade tática e blefe constante!
          </div>
        </div>
      </div>

      {/* O Vazio: Hesitação & Defender no Vazio */}
      <div className="rounded-lg border-2 border-fuchsia-900/60 bg-black/55 p-3 sm:p-4 shadow-[0_0_20px_rgba(112,26,117,0.2)]">
        <div className="flex items-center gap-2 text-fuchsia-400 font-grimoire font-bold text-xs sm:text-sm tracking-wider mb-1.5">
          <AlertTriangle size={16} /> A LEI DO VAZIO: HESITAÇÃO É MORTE
        </div>
        <p className="text-[11px] sm:text-xs text-parchment-dark mb-2.5">
          O STRIKE / VOID pune severamente jogadas covardes, indecisões e apostas cegas no vazio:
        </p>
        <div className="space-y-2 font-mono text-[11px]">
          <div className="rounded bg-wood-dark/70 border border-stone-800 p-2.5 space-y-0.5">
            <div className="text-amber-300 font-bold flex items-center gap-1.5">
              <Hourglass size={13} /> 1. Hesitação / Tempo Esgotado:
            </div>
            <p className="text-parchment-dark">
              Se você não travar sua escolha antes do relógio individual zerar, você é forçado a <strong>Passar a Vez</strong>{' '}
              (ação <span className="text-amber-200">NONE</span>). Nenhuma carta é gasta, mas você fica completamente indefeso
              contra qualquer facada da rodada!
            </p>
          </div>

          <div className="rounded bg-wood-dark/70 border border-stone-800 p-2.5 space-y-0.5">
            <div className="text-blue-300 font-bold flex items-center gap-1.5">
              <ShieldAlert size={13} /> 2. Defender no Vazio (Parede Desperdiçada):
            </div>
            <p className="text-parchment-dark">
              Erguer uma Parede em si mesmo quando ninguém te ataca prende você dentro da sua própria barricada (estado de{' '}
              <strong>EMPAREDADO</strong>). Você fica impedido de atacar qualquer outro jogador na rodada seguinte até
              conseguir quebrar a própria grade com uma Faca!
            </p>
          </div>

          <div className="rounded bg-wood-dark/70 border border-fuchsia-900/50 p-2.5 space-y-0.5">
            <div className="text-fuchsia-300 font-bold flex items-center gap-1.5">
              <Ban size={13} /> 3. Reverso no Vazio (Punição do Vácuo):
            </div>
            <p className="text-parchment-dark">
              Se você conjurar a carta Reverso em um alvo que não recebeu nenhum ataque externo e não tentou se auto-atacar, a
              magia cobra sangue do conjurador:{' '}
              <strong className="text-blood-bright">você sofre Vácuo e perde 1 Vida instantaneamente (-1 HP)!</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Sangramento & Pressão do Relógio */}
      <div className="rounded-lg border border-iron/70 bg-black/40 p-3 sm:p-4">
        <div className="flex items-center gap-2 text-red-400 font-grimoire font-bold text-xs sm:text-sm tracking-wider mb-1">
          <Heart size={16} className="text-blood-bright fill-blood-bright" /> SANGRAMENTO & TEMPO ACELERADO
        </div>
        <p className="text-[11px] sm:text-xs text-parchment-dark mb-2">
          As vidas iniciais variam de <strong>2 a 5 Vidas</strong>. Porém, cada gota de sangue derramado cobra seu preço na
          sua capacidade de raciocínio:
        </p>
        <div className="rounded bg-wood-dark/70 border border-stone-800 p-2.5 font-mono text-[11px] space-y-1 text-parchment">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Hourglass size={13} /> A Equação do Pânico:
          </div>
          <p className="text-[10.5px] text-parchment-dark">
            Quanto mais ferido você estiver, <strong>menos tempo você terá no relógio para decidir</strong>! A pulsação do
            coração acelera no áudio, a vinheta de sangue cobre as bordas da tela e com 1 HP restante você terá frações de
            segundo para travar sua jogada antes de sofrer apagão mental.
          </p>
        </div>
      </div>

      {/* Ordem de Resolução dos Revelares */}
      <div className="rounded-lg border border-iron/70 bg-black/40 p-3 sm:p-4">
        <div className="font-grimoire font-bold text-xs sm:text-sm tracking-wider text-parchment mb-2 flex items-center gap-2">
          <Swords size={15} className="text-gold-aged" /> COREOGRAFIA DA RESOLUÇÃO (ORDEM DOS EVENTOS)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10.5px] font-mono">
          <div className="rounded border border-fuchsia-950 bg-black/60 p-2">
            <span className="text-fuchsia-400 font-bold block mb-0.5">1. REVERSO</span>
            Inverte vetores de ataque, rouba paredes e pune Reversos no vazio com -1 de Vida.
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
  const [selectedScenario, setSelectedScenario] = useState('external');

  const scenarios = [
    {
      id: 'external',
      title: 'Ataque Externo Refletido',
      badge: 'Reflexão Direta',
      color: 'text-gold-aged border-gold-aged/50',
      action: 'C esfaqueia B  (C ➔ B)',
      reverso: 'A aplicou Reverso em B',
      outcome: 'A faca volta contra C!',
      result: '↳ C perde 1 Vida pelo próprio ataque. B sai ileso!',
      desc: 'Qualquer facada enviada de fora contra o alvo do Reverso é repelida e atinge o próprio atacante.',
    },
    {
      id: 'russian_bluff',
      title: 'Auto-Ataque (Blefe Russo)',
      badge: 'Roleta Russa Invertida',
      color: 'text-red-400 border-red-500/50',
      action: 'B se esfaqueia  (B ➔ B)',
      reverso: 'A aplicou Reverso em B',
      outcome: 'O golpe inverte contra A!',
      result: '↳ O Reverso redireciona a faca: B perfura A (-1 Vida em A). B sai ileso!',
      desc: 'A jogada mental definitiva: sabendo que A vai jogar Reverso nele, B crava a faca em si mesmo para que ela perfure A!',
    },
    {
      id: 'steal_wall',
      title: 'Roubo de Parede',
      badge: 'Usurpação Tática',
      color: 'text-blue-400 border-blue-500/50',
      action: 'B tenta erguer Parede em si mesmo',
      reverso: 'A aplicou Reverso em B',
      outcome: 'A Parede é roubada para A!',
      result: '↳ A recebe a Parede e fica protegido; B fica desprotegido!',
      desc: 'Se o alvo tentar erguer uma defesa própria enquanto sob efeito de Reverso externo, a barricada é usurpada pelo conjurador do Reverso.',
    },
    {
      id: 'vacuum',
      title: 'A Lei do Vazio (Vácuo)',
      badge: 'Punição Imediata',
      color: 'text-fuchsia-400 border-fuchsia-500/50',
      action: 'Nenhuma ação interagiu com o Alvo',
      reverso: 'A jogou Reverso no Alvo',
      outcome: 'O Vazio devora quem hesitou!',
      result: '↳ A sofre Vácuo e perde 1 Vida instantaneamente (-1 HP)!',
      desc: 'Usar Reverso sem que haja sangue ou auto-ataque no alvo é punido com dano direto no conjurador.',
    },
  ];

  const currentScenario = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];

  return (
    <div className="space-y-4 text-parchment">
      {/* 1. FACA */}
      <div className="rounded-lg border-2 border-red-950/70 bg-black/60 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
        <div className="shrink-0 mx-auto sm:mx-0">
          <InscryptionCard card={{ type: 'FACA' }} small />
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-grimoire font-extrabold text-sm sm:text-base text-red-400 tracking-wider">
              🔪 FACA (O ATAQUE & CORTE)
            </h3>
            <span className="text-[10px] font-mono bg-red-950/60 border border-red-600/50 text-red-300 px-1.5 py-0.5 rounded">
              Ofensiva / 1 Dano
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-parchment-light">
            O instrumento primário de eliminação. Desfere um golpe direto no alvo selecionado:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs text-parchment-dark">
            <li>
              <strong className="text-parchment">Ataque Direto:</strong> Causa <strong>1 Dano</strong> (-1 Vida) se o
              alvo não estiver protegido por uma Parede.
            </li>
            <li>
              <strong className="text-orange-400">Estilhaço de Barricada:</strong> Se o alvo estiver protegido por uma{' '}
              <em>Parede</em>, a faca estilhaça a parede (0 de dano direto na rodada, mas desprotege o alvo).
            </li>
            <li>
              <strong className="text-amber-300">Quebra Interna vs Auto-Dano:</strong>
              <br />
              <span className="pl-4 inline-block">
                • <em>Se você está Emparedado:</em> Usar a faca em si mesmo destrói sua própria parede sem tomar dano!
              </span>
              <br />
              <span className="pl-4 inline-block">
                • <em>Se você está Livre:</em> Usar a faca em si mesmo causa{' '}
                <span className="text-blood-bright font-bold">-1 Vida</span> de auto-dano intencional (exceto com o Blefe Russo de Reverso).
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. PAREDE */}
      <div className="rounded-lg border-2 border-stone-800 bg-black/60 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
        <div className="shrink-0 mx-auto sm:mx-0">
          <InscryptionCard card={{ type: 'PAREDE' }} small />
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-grimoire font-extrabold text-sm sm:text-base text-[#7fa3c0] tracking-wider">
              🧱 PAREDE (A DEFESA & PRISÃO TÁTICA)
            </h3>
            <span className="text-[10px] font-mono bg-blue-950/60 border border-[#7fa3c0]/50 text-[#7fa3c0] px-1.5 py-0.5 rounded">
              Defensiva / Bloqueio
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-parchment-light">
            Ergue uma barricada de ferro e arame farpado em torno de qualquer jogador (em você ou em um adversário):
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-xs text-parchment-dark">
            <li>
              <strong className="text-parchment">Bloqueio de Dano:</strong> Absorve 1 facada que atingir o alvo na rodada
              e é destruída.
            </li>
            <li>
              <strong className="text-blue-300">O Estado de EMPAREDADO:</strong> O jogador trancado dentro da parede{' '}
              <strong>só pode usar cartas em si mesmo ou passar a vez</strong>! Fica completamente impedido de atacar ou
              alvejar outros jogadores até que a barricada caia.
            </li>
            <li>
              <strong className="text-amber-300">Defender no Vazio (Risco):</strong> Se você erguer uma parede em si mesmo
              sem ninguém te atacar, você ficará preso dentro dela no round seguinte!
            </li>
            <li>
              <strong className="text-purple-300">Uso Ofensivo:</strong> Você pode emparedar um adversário perigoso para
              neutralizar os ataques dele na próxima rodada.
            </li>
          </ul>
        </div>
      </div>

      {/* 3. REVERSO */}
      <div className="rounded-lg border-2 border-fuchsia-950/80 bg-black/60 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
        <div className="shrink-0 mx-auto sm:mx-0">
          <InscryptionCard card={{ type: 'REVERSO' }} small />
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-grimoire font-extrabold text-sm sm:text-base text-fuchsia-300 tracking-wider">
              🔄 REVERSO (O INVERSOR SOMBRIO)
            </h3>
            <span className="text-[10px] font-mono bg-fuchsia-950/60 border border-fuchsia-600/50 text-fuchsia-300 px-1.5 py-0.5 rounded">
              Mental / Blefe Letal
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-parchment-light">
            A carta mais imprevisível e letal da mesa. Aplica uma inversão vetorial no <strong>Alvo</strong> selecionado
            (você ou outro jogador). Resolve <em>antes</em> de todas as facas e paredes!
          </p>

          {/* Seletor Interativo de Cenários do Reverso */}
          <div className="mt-2 pt-2 border-t border-iron/40 space-y-2">
            <div className="text-[10.5px] font-mono text-gold-aged font-bold flex items-center gap-1.5">
              <Zap size={13} /> SIMULADOR DE CENÁRIOS INTERATIVO:
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    audio.play('select');
                    setSelectedScenario(s.id);
                  }}
                  className={cn(
                    'p-1.5 rounded text-[10px] font-mono text-left transition-all border min-h-[36px]',
                    selectedScenario === s.id
                      ? 'border-fuchsia-400 bg-fuchsia-950/50 text-white shadow-[0_0_10px_rgba(192,38,211,0.3)]'
                      : 'border-iron/60 bg-black/50 text-parchment-dark hover:border-parchment-dark'
                  )}
                >
                  <span className="font-bold block truncate">{s.title}</span>
                </button>
              ))}
            </div>

            {/* Painel do Cenário Ativo */}
            <motion.div
              key={currentScenario.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded bg-wood-dark/80 p-2.5 border border-iron/60 space-y-1.5 font-mono text-[10.5px]"
            >
              <div className="flex items-center justify-between gap-1">
                <span className={cn('font-bold tracking-wider', currentScenario.color)}>
                  {currentScenario.title.toUpperCase()}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 border border-stone-700 text-parchment-dark">
                  {currentScenario.badge}
                </span>
              </div>

              <div className="bg-black/60 rounded p-2 border border-stone-800 space-y-1">
                <div className="flex items-center gap-2 text-stone-300">
                  <span className="text-stone-500">Ação:</span> {currentScenario.action}
                </div>
                <div className="flex items-center gap-2 text-fuchsia-300">
                  <span className="text-stone-500">Reverso:</span> {currentScenario.reverso}
                </div>
                <div className="pt-1 border-t border-stone-800 text-amber-300 font-bold">
                  {currentScenario.result}
                </div>
              </div>

              <p className="text-[10px] text-parchment-dark leading-snug">{currentScenario.desc}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 4. PASSAR A VEZ */}
      <div className="rounded-lg border border-iron/60 bg-black/50 p-3 sm:p-4">
        <div className="flex items-center gap-2 text-stone-400 font-grimoire font-bold text-xs sm:text-sm tracking-wider mb-1">
          <Hourglass size={15} /> PASSAR A VEZ (TEMPO ESGOTADO OU HESITAÇÃO)
        </div>
        <p className="text-[11px] sm:text-xs text-parchment-dark">
          Se você optar por clicar no botão <strong>Passar a Vez</strong> ou se o seu relógio esgotar antes de confirmar uma
          jogada, o servidor executa a ação <strong>NONE</strong>. Nenhuma carta é gasta da sua mão, mas você fica 100%
          desprotegido contra todas as facadas da rodada!
        </p>
      </div>
    </div>
  );
}

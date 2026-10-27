import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Shield,
  Crosshair,
  Flame,
  Layers,
  ZoomIn,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { audio } from '../lib/audio';
import InscryptionCard from './InscryptionCard';
import CardInspectModal from './CardInspectModal';
import GameIcon from './GameIcon';
import { CARD_TYPES, CARD_META, CARD_CATEGORIES } from '../models/cardModel';

/**
 * Dados completos de cada carta para o Livro de Cartas (Grimório),
 * ordenados por Prioridade (P1 -> P5).
 */
export const GRIMOIRE_CARDS = [
  {
    type: CARD_TYPES.REVERSO,
    shortEffect: 'Reflete ataques e maldições de volta aos agressores. No vazio: -1 Vida.',
    targetLabel: 'Você ou Outro Jogador',
    wallRule: 'Respeita Parede (em si mesmo se emparedado)',
    bullets: [
      'Prioridade 1 (Reação): Resolve antes de todas as outras cartas da mesa.',
      'Reflete ataques e maldições de volta para quem mirou no alvo protegido (Faca, Marca da Morte, Desarmar, Seringa, Revelar, etc.).',
      'Se refletir um Pacto de Sangue, o autor do pacto sofre 1 de Dano imediato!',
      'Lei do Vácuo: Se ninguém interagir com o alvo protegido na rodada, quem usou o Espelho Amaldiçoado perde 1 Vida!',
    ],
  },
  {
    type: CARD_TYPES.PAREDE,
    shortEffect: 'Ergue grades de ferro que bloqueiam 1 facada, mas prendem a mira do alvo.',
    targetLabel: 'Você ou Outro Jogador',
    wallRule: 'Cria o estado Emparedado',
    bullets: [
      'Prioridade 2 (Defensivo): Ergue grades de ferro ao redor do alvo antes de Suportes, Controles e Facas.',
      'Absorve 1 golpe de Faca e se estilhaça ao bloquear.',
      'Enquanto estiver EMPAREDADO, o jogador só pode mirar em si mesmo (exceto com Pacto de Sangue, que ignora paredes).',
    ],
  },
  {
    type: CARD_TYPES.SERINGA,
    shortEffect: 'Ganha +1 carga por turno na mão (máx 4). Cura ou aplica Overdose!',
    targetLabel: 'Você ou Outro Jogador',
    wallRule: 'Respeita Parede',
    bullets: [
      'Prioridade 3 (Suporte): Começa vazia (0/4 cargas) ao ser comprada e não surte efeito se usada com 0 cargas.',
      'Cada turno que permanece na sua mão adiciona +1 carga (máximo de 4 cargas). Cada carga cura +1 de Vida.',
      'OVERDOSE: Se aplicar cargas além da vida máxima do alvo, restaura a vida ao máximo e aplica MARCA DA MORTE com (5 − excesso) turnos!',
      'Exemplo prático: Com 2/3 de Vida (falta 1), usar Seringa cheia (4 cargas) → cura para 3/3 e o excesso (3) reduz a Marca da Morte para 5 − 3 = 2 turnos!',
    ],
  },
  {
    type: CARD_TYPES.MANIPULAMENTO_ALMA,
    shortEffect: 'Troca sua barra de vida com outro jogador ou concede +1 Dano permanente à sua Faca.',
    targetLabel: 'Outro Jogador (Troca Vida) ou Você (+1 Faca)',
    wallRule: 'Respeita Parede',
    bullets: [
      'Prioridade 3 (Suporte): Resolve na fase de suporte, antes dos Controles (P4) e das Facas (P5).',
      'Usado em OUTRO jogador: Troca a sua barra de vida atual pela barra de vida dele imediatamente!',
      'Usado em SI MESMO: Fortalece sua alma e aumenta permanentemente o dano da sua própria Faca em +1 pelo resto da partida!',
    ],
  },
  {
    type: CARD_TYPES.REVELAR,
    shortEffect: 'Expõe todas as cartas da mão do oponente selecionado para toda a mesa.',
    targetLabel: 'Apenas Outro Jogador',
    wallRule: 'Bloqueada se você estiver Emparedado',
    bullets: [
      'Prioridade 3 (Suporte): Invoca o Olho Abissal para devassar o jogo oculto de um adversário.',
      'Revela todas as cartas da mão da pessoa selecionada para TODA A MESA durante esta e a próxima rodada!',
      'As cartas reveladas ficam visíveis acima da silhueta 3D do alvo (podendo ser ampliadas) e registradas no Caderno.',
    ],
  },
  {
    type: CARD_TYPES.PACTO_SANGUE,
    shortEffect: 'Ignora Parede e vincula sua vida à de outro. Em si mesmo: quebra seus pactos.',
    targetLabel: 'Outro (Vincula Vida) ou Você (Quebra Pacto)',
    wallRule: 'IGNORA PAREDES (pode mirar em qualquer jogador vivo)',
    bullets: [
      'Prioridade 4 (Controle): Atravessa qualquer Parede e vincula sua barra de vida à do alvo (todo dano sofrido por um fere o outro também).',
      'USADO EM SI MESMO: Se você já estiver em um Pacto de Sangue, QUEBRA todos os seus pactos ativos! Se não estiver em nenhum pacto, você perde 1 de Vida!',
      'Se refletido pelo Espelho Amaldiçoado, ricocheteia e causa 1 de Dano imediato em quem lançou!',
    ],
  },
  {
    type: CARD_TYPES.MARCA_MORTE,
    shortEffect: 'Amaldiçoa o alvo: se ficar 5 rodadas sem tomar dano, morre instantaneamente!',
    targetLabel: 'Apenas Outro Jogador',
    wallRule: 'Bloqueada se você estiver Emparedado',
    bullets: [
      'Prioridade 4 (Controle): Crava a Marca da Morte em outro jogador com contagem regressiva de 5 rodadas.',
      'Se o jogador marcado passar 5 rodadas sem sofrer dano, MORRE INSTANTANEAMENTE ao fim da rodada!',
      'Sofrer qualquer dano na mesa (e sobreviver) sacia a maldição com sangue e remove a Marca da Morte.',
    ],
  },
  {
    type: CARD_TYPES.DESARMAR,
    shortEffect: 'Sabota o alvo descartando 2 cartas aleatórias diretamente da mão dele.',
    targetLabel: 'Apenas Outro Jogador',
    wallRule: 'Bloqueada se você estiver Emparedado',
    bullets: [
      'Prioridade 4 (Controle): Sabotagem direta nos recursos táticos de um adversário.',
      'Arranca e descarta até 2 cartas aleatórias diretamente da mão do jogador selecionado.',
    ],
  },
  {
    type: CARD_TYPES.FACA,
    shortEffect: 'Golpeia causando 1+ de Dano ou destrói 1 Parede (em si mesmo quebra Parede sem dano).',
    targetLabel: 'Você ou Outro Jogador',
    wallRule: 'Destrói 1 Parede do alvo (ou a própria sem sofrer dano)',
    bullets: [
      'Prioridade 5 (Ofensivo): Resolve por último na rodada, executando os golpes sangrentos na mesa.',
      'Causa 1 de Dano (ou mais se fortalecida por Manipulamento de Alma). Se o alvo estiver Emparedado, destrói a Parede (dano excedente perfura!).',
      'Usar em si mesmo quando EMPAREDADO destrói sua própria Parede sem sofrer dano. Sem Parede, corta a si mesmo (útil para saciar e remover uma Marca da Morte!).',
    ],
  },
];

const CATEGORY_FILTERS = [
  { id: 'ALL', label: 'TODAS AS CARTAS (9)' },
  { id: 'REACAO', label: 'P1 · REAÇÃO' },
  { id: 'DEFENSIVO', label: 'P2 · DEFENSIVO' },
  { id: 'SUPORTE', label: 'P3 · SUPORTE' },
  { id: 'CONTROLE', label: 'P4 · CONTROLE' },
  { id: 'OFENSIVO', label: 'P5 · OFENSIVO' },
];

/**
 * Livro Grimório das Cartas:
 * Apresenta todas as cartas em seu tamanho real de gameplay (ou maior),
 * preservando proporções e detalhes visuais, com explicações completas
 * e tipografia ampla ao lado de cada carta, além de inspeção ampliada.
 */
export default function CardGrimoireBook({ compact = false, className }) {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [focusedType, setFocusedType] = useState(null);
  const [previewSyringeCharges, setPreviewSyringeCharges] = useState(4);
  const [inspectedCard, setInspectedCard] = useState(null);

  const filteredCards = GRIMOIRE_CARDS.filter((item) => {
    if (focusedType) return item.type === focusedType;
    if (categoryFilter === 'ALL') return true;
    return CARD_META[item.type]?.category === categoryFilter;
  });

  return (
    <div
      id="card-grimoire-book"
      className={cn(
        'rounded-xl overflow-hidden border-2 border-[#7c532f] bg-gradient-to-b from-[#26150d] via-[#1b0f09] to-[#120905] shadow-[0_24px_65px_rgba(0,0,0,0.98)] flex flex-col select-text',
        className
      )}
    >
      {/* CABEÇALHO DO LIVRO GRIMÓRIO */}
      <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#361c12] via-[#4a2618] to-[#2d160e] border-b-2 border-[#7c532f] flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold-aged/20 border border-gold-aged/70 text-gold-aged shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-grimoire font-black tracking-wider text-amber-100 text-base sm:text-xl leading-tight">
                LIVRO DAS CARTAS · GRIMÓRIO DO VAZIO
              </h3>
              <p className="font-typewriter text-xs sm:text-sm text-amber-200/90 mt-0.5">
                Cartas exibidas em tamanho real de partida · Clique em qualquer carta para inspeção ampliada
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 border border-gold-aged/50 font-mono text-xs text-amber-200">
            <Layers size={14} className="text-gold-aged" />
            <span>Ordem de Resolução: P1 → P5</span>
          </span>
        </div>

        {/* Filtros por Categoria / Prioridade com Tipografia Confortável */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_FILTERS.map((f) => {
            const isActive = !focusedType && categoryFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  audio.play('select');
                  setFocusedType(null);
                  setCategoryFilter(f.id);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-mono text-xs sm:text-sm font-extrabold border transition-all cursor-pointer',
                  isActive
                    ? 'bg-gold-aged text-black border-gold-aged shadow-[0_0_12px_rgba(212,175,55,0.55)]'
                    : 'bg-black/70 text-amber-100/90 border-stone-700 hover:border-gold-aged/70 hover:text-white'
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Navegação Direta por Carta Individual */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="font-mono text-xs font-bold text-amber-200/80 shrink-0 mr-1">
            Ir para:
          </span>
          {GRIMOIRE_CARDS.map((entry) => {
            const meta = CARD_META[entry.type];
            const isFocused = focusedType === entry.type;
            return (
              <button
                key={entry.type}
                type="button"
                onClick={() => {
                  audio.play('select');
                  setFocusedType((prev) => (prev === entry.type ? null : entry.type));
                }}
                className={cn(
                  'shrink-0 px-2.5 py-1 rounded-md font-mono text-xs font-bold border transition-all cursor-pointer',
                  isFocused
                    ? 'bg-blood text-white border-gold-aged shadow-[0_0_10px_rgba(220,38,38,0.6)]'
                    : 'bg-stone-900/90 text-parchment border-stone-700/90 hover:border-gold-aged/60 hover:text-amber-100'
                )}
              >
                P{meta.priority} · {meta.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTA DE SEÇÕES DE CARTAS EM TAMANHO REAL + EXPLICAÇÃO AO LADO */}
      <div className="p-3 sm:p-5 space-y-5 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06),transparent_75%)]">
        {filteredCards.map((entry) => {
          const meta = CARD_META[entry.type];
          const cat = CARD_CATEGORIES[meta.category];
          const isSyringe = entry.type === CARD_TYPES.SERINGA;
          const charges = isSyringe ? previewSyringeCharges : 0;

          return (
            <article
              key={entry.type}
              data-guide-card={entry.type}
              className="rounded-xl border-2 border-[#7a5835] bg-gradient-to-b from-[#23140c] via-[#1a0e08] to-[#130a06] p-4 sm:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.85)] flex flex-col lg:flex-row items-center lg:items-start gap-5 sm:gap-7"
            >
              {/* COLUNA ESQUERDA: CARTA RENDERIZADA EM TAMANHO REAL DA GAMEPLAY (OU MAIOR) */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="p-2 rounded-xl bg-black/55 border border-gold-aged/40 shadow-[0_14px_32px_rgba(0,0,0,0.9)]">
                  <InscryptionCard
                    card={{ type: entry.type, charges }}
                    xlarge={!compact}
                    large={compact}
                    onInspect={() =>
                      setInspectedCard({
                        type: entry.type,
                        charges,
                      })
                    }
                  />
                </div>

                {/* Botão explícito para abrir Inspeção Ampliada */}
                <button
                  type="button"
                  onClick={() => {
                    audio.play('select');
                    setInspectedCard({
                      type: entry.type,
                      charges,
                    });
                  }}
                  className="mt-2.5 w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-gold-aged/75 bg-[#331d10] hover:bg-[#482917] text-amber-100 font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md"
                >
                  <ZoomIn size={15} className="text-gold-aged shrink-0" />
                  <span>Ampliar Carta</span>
                </button>

                {/* Controle interativo de cargas para testar a Seringa em tamanho real */}
                {isSyringe && (
                  <div className="mt-2.5 w-full p-2 rounded-lg bg-black/70 border border-emerald-500/50 flex flex-col items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-300">
                      <GameIcon name="syringe-vial" size={13} />
                      <span>Simular Cargas ({previewSyringeCharges}/4):</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            audio.play('click');
                            setPreviewSyringeCharges(c);
                          }}
                          className={cn(
                            'px-2 py-1 rounded font-mono text-xs font-extrabold border transition-all cursor-pointer',
                            previewSyringeCharges === c
                              ? 'bg-emerald-600 text-white border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                              : 'bg-stone-900 text-amber-100 border-stone-700 hover:border-emerald-400'
                          )}
                        >
                          {c}/4
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* COLUNA DIREITA: EXPLICAÇÃO DETALHADA EM PERGAMINHO DE ALTA LEGIBILIDADE */}
              <div className="flex-1 w-full rounded-xl border-2 border-[#8c6d46] bg-gradient-to-b from-[#f4e7cd] via-[#ecdab7] to-[#e1cba2] text-[#1a0f06] p-4 sm:p-5 shadow-[inset_0_0_28px_rgba(120,85,40,0.3)] flex flex-col justify-between">
                <div>
                  {/* Topo: Prioridade, Categoria e Título Grande */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#b09268]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-md border font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider',
                            cat?.badgeCls
                          )}
                        >
                          PRIORIDADE {meta.priority} · {meta.categoryLabel}
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-[#5a371c]">
                          {meta.foot}
                        </span>
                      </div>

                      <h4 className="font-grimoire font-black text-xl sm:text-2xl text-[#241006] tracking-wide leading-tight">
                        {meta.name}
                      </h4>
                    </div>
                  </div>

                  {/* Resumo em destaque */}
                  <p className="mt-3 font-typewriter font-bold text-base sm:text-lg text-[#4a1515] leading-snug">
                    {entry.shortEffect}
                  </p>

                  {/* Quadros de Alvo e Parede */}
                  <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-[#e5d2ad] border border-[#9e7f56] p-2.5 sm:p-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold uppercase text-[#7f1d1d] mb-0.5">
                        <Crosshair size={14} className="shrink-0" />
                        <span>Alvo da Carta</span>
                      </div>
                      <div className="font-typewriter text-sm sm:text-[15px] font-bold text-[#1e1107]">
                        {entry.targetLabel}
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#e5d2ad] border border-[#9e7f56] p-2.5 sm:p-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold uppercase text-[#1e3a8a] mb-0.5">
                        <Shield size={14} className="shrink-0" />
                        <span>Interação com Parede</span>
                      </div>
                      <div className="font-typewriter text-sm sm:text-[15px] font-bold text-[#1e1107]">
                        {entry.wallRule}
                      </div>
                    </div>
                  </div>

                  {/* Lista detalhada do que a carta faz */}
                  <div className="mt-4">
                    <div className="font-grimoire font-black text-sm sm:text-base uppercase tracking-wider text-[#6b1d1d] mb-2 flex items-center gap-1.5">
                      <Flame size={15} className="text-[#8b0000] shrink-0" />
                      <span>COMO FUNCIONA NO COMBATE:</span>
                    </div>
                    <ul className="space-y-2.5 font-typewriter text-[15px] sm:text-base leading-relaxed text-[#180d05]">
                      {entry.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#8b0000] font-bold shrink-0 mt-0.5">❖</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#bfa37a] flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#54361e]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles size={13} className="text-[#8b0000]" />
                    <span>Grimório Oficial · STRIKE / VOID</span>
                  </span>
                  <span className="font-bold">
                    Ordem na Rodada: {meta.priority}º ({meta.categoryLabel})
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal de Inspeção Ampliada */}
      <CardInspectModal
        card={inspectedCard}
        onClose={() => setInspectedCard(null)}
        allowBrowseAll={true}
        onSelectCardType={(nextType) =>
          setInspectedCard({
            type: nextType,
            charges: nextType === CARD_TYPES.SERINGA ? previewSyringeCharges : 0,
          })
        }
      />
    </div>
  );
}

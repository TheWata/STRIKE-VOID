import React, { useState } from 'react';
import { BookOpen, Sparkles, Shield, Crosshair, Flame, Layers } from 'lucide-react';
import { cn } from '../lib/cn';
import { audio } from '../lib/audio';
import InscryptionCard from './InscryptionCard';
import GameIcon from './GameIcon';
import { CARD_TYPES, CARD_META, CARD_CATEGORIES } from '../models/cardModel';

/**
 * Dados completos de cada carta para o Livro de Cartas (Grimório),
 * ordenados por Prioridade (P1 -> P5).
 */
export const GRIMOIRE_CARDS = [
  {
    type: CARD_TYPES.REVERSO,
    shortEffect: 'Reflete ataques e maldições. No vazio: -1 Vida.',
    targetLabel: 'Você ou Outro Jogador',
    wallRule: 'Respeita Parede (em si mesmo se emparedado)',
    bullets: [
      'Prioridade 1 (Reação): Resolve antes de todas as outras cartas da mesa.',
      'Reflete ataques e maldições de volta para quem mirou no alvo protegido (Faca, Marca da Morte, Desarmar, Seringa, etc.).',
      'Se refletir um Pacto de Sangue, o autor do pacto toma 1 de Dano imediato!',
      'Lei do Vácuo: Se ninguém interagir com o alvo protegido na rodada, quem usou o Espelho Amaldiçoado perde 1 Vida!',
    ],
  },
  {
    type: CARD_TYPES.PAREDE,
    shortEffect: 'Bloqueia 1 facada e prende a mira do alvo.',
    targetLabel: 'Você ou Outro Jogador',
    wallRule: 'Cria o estado Emparedado',
    bullets: [
      'Prioridade 2 (Defensivo): Ergue grades de ferro ao redor do alvo antes de Suportes, Controles e Facas.',
      'Absorve 1 golpe de Faca e se estilhaça.',
      'Enquanto estiver EMPAREDADO, o jogador só pode mirar em si mesmo (exceto com Pacto de Sangue, que ignora paredes).',
    ],
  },
  {
    type: CARD_TYPES.SERINGA,
    shortEffect: 'Enche +1/turno (máx 4). Cura ou causa Overdose!',
    targetLabel: 'Você ou Outro Jogador',
    wallRule: 'Respeita Parede',
    bullets: [
      'Prioridade 3 (Suporte): Começa vazia (0/4 cargas) ao ser comprada e não faz nada se usada com 0 cargas.',
      'Cada turno que passa na sua mão enche +1 carga (máximo de 4 cargas). Cada carga cura +1 de Vida.',
      'OVERDOSE: A cura deve ser exatamente a necessária para a vida cheia. Se aplicar cargas além da vida máxima, cura tudo e aplica MARCA DA MORTE com (5 − excesso) turnos!',
      'Exemplo prático: Com 2/3 de Vida (falta 1), aplica Seringa cheia (4 cargas) → cura para 3/3 e o excesso (3) reduz a Marca da Morte para 5 − 3 = 2 turnos sem tomar dano para morrer!',
    ],
  },
  {
    type: CARD_TYPES.MANIPULAMENTO_ALMA,
    shortEffect: 'Troca barra de vida c/ outro ou +1 Dano na Faca.',
    targetLabel: 'Outro (Troca Vida) ou Você (+1 Faca)',
    wallRule: 'Respeita Parede',
    bullets: [
      'Prioridade 3 (Suporte): Resolve junto aos suportes, antes dos Controles e das Facas.',
      'Usado em OUTRO jogador: Troca a sua barra de vida atual pela barra de vida dele!',
      'Usado em SI MESMO: Fortalece sua alma e aumenta permanentemente o dano da sua própria Faca em +1!',
    ],
  },
  {
    type: CARD_TYPES.REVELAR,
    shortEffect: 'Expõe todas as cartas da mão do alvo p/ a mesa.',
    targetLabel: 'Apenas Outro Jogador',
    wallRule: 'Bloqueada se você estiver Emparedado',
    bullets: [
      'Prioridade 3 (Suporte): Utiliza o Olho Abissal para devassar o jogo oculto de um oponente.',
      'Revela todas as cartas da mão da pessoa selecionada para TODA A MESA!',
      'As cartas reveladas ficam flutuando acima da silhueta 3D do alvo e registradas no Caderno.',
    ],
  },
  {
    type: CARD_TYPES.PACTO_SANGUE,
    shortEffect: 'Ignora Parede e vincula vida. Em si: quebra pacto.',
    targetLabel: 'Outro (Vincula) ou Você (Quebra Pacto)',
    wallRule: 'IGNORA PAREDES (pode mirar em qualquer um)',
    bullets: [
      'Prioridade 4 (Controle): Atravessa qualquer Parede e vincula sua barra de vida à de outra pessoa (todo dano sofrido é compartilhado).',
      'USADO EM SI MESMO: Se você já estiver em um Pacto de Sangue, QUEBRA o pacto imediatamente! Se não estiver em nenhum pacto, você toma 1 de Dano!',
      'Se refletido pelo Espelho Amaldiçoado, você toma 1 de Dano imediato!',
    ],
  },
  {
    type: CARD_TYPES.MARCA_MORTE,
    shortEffect: 'Se ficar 5 rodadas sem tomar dano, morre insta!',
    targetLabel: 'Apenas Outro Jogador',
    wallRule: 'Bloqueada se você estiver Emparedado',
    bullets: [
      'Prioridade 4 (Controle): Crava a Marca da Morte em outro jogador com contagem de 5 rodadas.',
      'Se o jogador marcado ficar 5 rodadas sem tomar dano, MORRE INSTANTANEAMENTE!',
      'Sofrer qualquer dano (e sobreviver) sacia a maldição com sangue e remove a Marca da Morte.',
    ],
  },
  {
    type: CARD_TYPES.DESARMAR,
    shortEffect: 'Descarta 2 cartas aleatórias da mão do alvo.',
    targetLabel: 'Apenas Outro Jogador',
    wallRule: 'Bloqueada se você estiver Emparedado',
    bullets: [
      'Prioridade 4 (Controle): Sabotagem direta na mão de um adversário.',
      'Arranca e descarta até 2 cartas aleatórias diretamente da mão do jogador selecionado.',
    ],
  },
  {
    type: CARD_TYPES.FACA,
    shortEffect: 'Causa 1+ de Dano ou destrói uma Parede.',
    targetLabel: 'Você ou Outro Jogador',
    wallRule: 'Quebra Parede do alvo (ou a própria sem dano)',
    bullets: [
      'Prioridade 5 (Ofensivo): Resolve por último, executando os golpes sangrentos na mesa.',
      'Causa 1 de Dano (ou mais se fortalecida por Manipulamento de Alma) ou destrói uma Parede.',
      'Usar em si mesmo quando EMPAREDADO destrói sua própria Parede sem sofrer dano (ou pode ser usado em si mesmo para sangrar e limpar uma Marca da Morte!).',
    ],
  },
];

const CATEGORY_FILTERS = [
  { id: 'ALL', label: 'TODAS (9)' },
  { id: 'REACAO', label: 'P1 · REAÇÃO' },
  { id: 'DEFENSIVO', label: 'P2 · DEFENSIVO' },
  { id: 'SUPORTE', label: 'P3 · SUPORTE' },
  { id: 'CONTROLE', label: 'P4 · CONTROLE' },
  { id: 'OFENSIVO', label: 'P5 · OFENSIVO' },
];

/**
 * Livro Grimório das Cartas:
 * Exibe todas as 9 cartas numa grade interativa e mostra em detalhes o que cada carta faz.
 * Usado tanto debaixo da mesa (ao lado do Caderno/Chat) quanto no Modal de Guia.
 */
export default function CardGrimoireBook({ compact = false, className }) {
  const [selectedType, setSelectedType] = useState(CARD_TYPES.SERINGA);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [previewSyringeCharges, setPreviewSyringeCharges] = useState(4);

  const filteredCards = GRIMOIRE_CARDS.filter((item) => {
    if (categoryFilter === 'ALL') return true;
    return CARD_META[item.type]?.category === categoryFilter;
  });

  const activeEntry =
    GRIMOIRE_CARDS.find((c) => c.type === selectedType) || GRIMOIRE_CARDS[0];
  const activeMeta = CARD_META[activeEntry.type];
  const activeCat = CARD_CATEGORIES[activeMeta.category];

  return (
    <div
      id="card-grimoire-book"
      className={cn(
        'rounded-xl overflow-hidden border-2 border-[#6e4726] bg-gradient-to-b from-[#26150d] via-[#1b0f09] to-[#120905] shadow-[0_24px_65px_rgba(0,0,0,0.98)] flex flex-col select-text',
        className
      )}
    >
      {/* CABEÇALHO DO LIVRO GRIMÓRIO */}
      <div className="px-3 py-2 bg-gradient-to-r from-[#361c12] via-[#4a2618] to-[#2d160e] border-b-2 border-[#7c532f] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-gold-aged/20 border border-gold-aged/60 text-gold-aged">
            <BookOpen size={14} />
          </div>
          <div>
            <h3 className="font-grimoire font-black tracking-widest text-amber-100 text-xs sm:text-sm leading-none">
              LIVRO DAS CARTAS · GRIMÓRIO DO VAZIO
            </h3>
            <p className="font-mono text-[9.5px] text-amber-200/75 mt-0.5">
              Clique em qualquer carta na grade para inspecionar seus efeitos e prioridades
            </p>
          </div>
        </div>

        {/* Filtro rápido por Tipo / Prioridade */}
        <div className="flex flex-wrap items-center gap-1">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                audio.play('select');
                setCategoryFilter(f.id);
              }}
              className={cn(
                'px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border transition-all',
                categoryFilter === f.id
                  ? 'bg-gold-aged text-black border-gold-aged shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                  : 'bg-black/60 text-amber-200/80 border-stone-700 hover:border-gold-aged/60'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* PÁGINAS ABERTAS DO LIVRO (ESQUERDA: GRADE DE TODAS AS CARTAS | DIREITA: PÁGINA DO QUE A CARTA FAZ) */}
      <div
        className={cn(
          'grid grid-cols-1 gap-3 p-2.5 sm:p-3.5 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06),transparent_75%)]',
          !compact && 'lg:grid-cols-12'
        )}
      >
        {/* PÁGINA ESQUERDA: GRADE COM TODAS AS CARTAS */}
        <div className={cn(!compact && 'lg:col-span-7', 'flex flex-col')}>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="font-grimoire font-bold text-[10px] sm:text-[11px] tracking-wider text-amber-200 flex items-center gap-1.5">
              <Layers size={12} className="text-gold-aged" />
              GRADE DE CARTAS ({filteredCards.length})
            </span>
            <span className="font-mono text-[9px] text-stone-400">
              Ordenadas por Prioridade (P1 → P5)
            </span>
          </div>

          <div className="grid grid-cols-2 min-[460px]:grid-cols-3 gap-2 sm:gap-2.5 max-h-[420px] sm:max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredCards.map((entry) => {
              const meta = CARD_META[entry.type];
              const cat = CARD_CATEGORIES[meta.category];
              const isSelected = selectedType === entry.type;
              const charges = entry.type === CARD_TYPES.SERINGA ? previewSyringeCharges : 0;

              return (
                <button
                  key={entry.type}
                  type="button"
                  onClick={() => {
                    audio.play('select');
                    setSelectedType(entry.type);
                  }}
                  className={cn(
                    'group relative flex flex-col items-center text-center p-1.5 sm:p-2 rounded-lg border-2 transition-all cursor-pointer',
                    isSelected
                      ? 'border-gold-aged bg-gradient-to-b from-[#3d2516] to-[#21130b] shadow-[0_0_16px_rgba(212,175,55,0.45)] scale-[1.01]'
                      : 'border-[#472d1c] bg-black/55 hover:border-gold-aged/60 hover:bg-[#24150c]/80'
                  )}
                >
                  {/* Selo de Prioridade e Tipo */}
                  <span
                    className={cn(
                      'mb-1 px-1.5 py-[1px] rounded border font-mono text-[8px] font-extrabold uppercase tracking-wider',
                      cat?.badgeCls
                    )}
                  >
                    P{meta.priority} · {meta.categoryLabel}
                  </span>

                  {/* Miniatura da Carta */}
                  <div className="my-0.5 pointer-events-none">
                    <InscryptionCard
                      card={{ type: entry.type, charges }}
                      large
                    />
                  </div>

                  {/* Nome + Resumo rápido do que faz */}
                  <div className="mt-1.5 font-grimoire font-extrabold text-[11px] sm:text-[12.5px] text-amber-100 leading-tight truncate w-full">
                    {meta.name}
                  </div>
                  <p className="mt-0.5 font-typewriter text-[10px] sm:text-[11.5px] text-[#e6d3ae] leading-snug line-clamp-3">
                    {entry.shortEffect}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* PÁGINA DIREITA: PÁGINA DE PERGAMINHO DETALHANDO O QUE A CARTA SELECIONADA FAZ */}
        <div
          className={cn(
            !compact && 'lg:col-span-5',
            'rounded-lg border-2 border-[#8c6d46] bg-gradient-to-b from-[#f3e5c8] via-[#ead7b3] to-[#dfc89e] text-[#1e120a] p-3 shadow-[inset_0_0_28px_rgba(120,85,40,0.35)] flex flex-col justify-between'
          )}
        >
          <div>
            {/* Topo da Página da Carta */}
            <div className="flex items-start gap-3 pb-2.5 border-b-2 border-[#b09268]">
              <div className="shrink-0">
                <InscryptionCard
                  card={{
                    type: activeEntry.type,
                    charges:
                      activeEntry.type === CARD_TYPES.SERINGA ? previewSyringeCharges : 0,
                  }}
                  xlarge
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1 mb-1">
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded border font-mono text-[10.5px] font-extrabold uppercase',
                      activeCat?.badgeCls
                    )}
                  >
                    PRIORIDADE {activeMeta.priority} · {activeMeta.categoryLabel}
                  </span>
                </div>

                <h4 className="font-grimoire font-black text-base sm:text-lg text-[#2b1408] tracking-wide leading-tight">
                  {activeMeta.name}
                </h4>

                <div className="mt-2 space-y-1 font-mono text-[11.5px] sm:text-xs text-[#3a210f]">
                  <div className="flex items-center gap-1">
                    <Crosshair size={11} className="text-[#8b0000] shrink-0" />
                    <span>
                      <strong>Alvo:</strong> {activeEntry.targetLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield size={11} className="text-[#1e3a8a] shrink-0" />
                    <span>
                      <strong>Parede:</strong> {activeEntry.wallRule}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controle interativo de cargas para testar a Seringa no próprio livro */}
            {activeEntry.type === CARD_TYPES.SERINGA && (
              <div className="mt-2 p-1.5 rounded bg-[#e2ceaa] border border-[#9e7f56] flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 font-mono text-[9.5px] font-bold text-[#2b180a]">
                  <GameIcon name="syringe-vial" size={12} />
                  <span>Simular Cargas na Mão:</span>
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
                        'px-1.5 py-0.5 rounded font-mono text-[9.5px] font-extrabold border transition-all',
                        previewSyringeCharges === c
                          ? 'bg-[#15803d] text-white border-black'
                          : 'bg-[#f7eed9] text-[#2b180a] border-[#8c6d46] hover:bg-white'
                      )}
                    >
                      {c}/4
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista detalhada do que a carta faz */}
            <div className="mt-2.5">
              <div className="font-grimoire font-extrabold text-xs sm:text-[13px] uppercase tracking-wider text-[#6b1d1d] mb-1.5 flex items-center gap-1">
                <Flame size={12} className="text-[#8b0000]" /> O QUE ESTA CARTA FAZ:
              </div>
              <ul className="space-y-2 font-typewriter text-[13px] sm:text-sm leading-snug text-[#1a0f06]">
                {activeEntry.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#8b0000] font-bold shrink-0">❖</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-[#bfa37a] flex items-center justify-between font-mono text-[9px] text-[#5c3d24]">
            <span className="flex items-center gap-1">
              <Sparkles size={10} className="text-[#8b0000]" />
              Grimório Oficial · STRIKE / VOID
            </span>
            <span>
              Ordem na Rodada: {activeMeta.priority}º ({activeMeta.categoryLabel})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

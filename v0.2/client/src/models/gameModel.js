export const PHASE_LABELS = {
  LOBBY: 'LOBBY',
  DEALING: 'EMBARALHANDO...',
  PLANNING: 'PLANEJAMENTO',
  REVEAL_REVERSO: 'P1 · REAÇÃO (ESPELHOS)',
  REVEAL_PAREDE: 'P2 · DEFENSIVO (PAREDES)',
  REVEAL_SUPORTE: 'P3 · SUPORTE (CURA & ALMA)',
  REVEAL_ESPECIAIS: 'P4 · CONTROLE (PACTOS & MALDIÇÕES)',
  REVEAL_FACA: 'P5 · OFENSIVO (FACAS)',
  ANALYSIS: 'ANÁLISE',
  GAME_OVER: 'FIM DE JOGO',
};

export const RESOLUTION_STEPS = [
  {
    key: 'REVEAL_REVERSO',
    label: 'P1 · REAÇÃO',
    subtitle: 'Espelhos amaldiçoados se estilhaçam. Refletir no vazio custa sangue!',
    color:
      'border-purple-500 text-purple-200 bg-purple-950/95 shadow-[0_0_20px_rgba(168,85,247,0.6)]',
  },
  {
    key: 'REVEAL_PAREDE',
    label: 'P2 · DEFENSIVO',
    subtitle: 'Barricadas de ferro e osso erguem-se ao redor dos assentos.',
    color:
      'border-cyan-400 text-cyan-200 bg-cyan-950/95 shadow-[0_0_20px_rgba(34,211,238,0.6)]',
  },
  {
    key: 'REVEAL_SUPORTE',
    label: 'P3 · SUPORTE',
    subtitle: 'Seringas injetam cura (ou overdose!), almas são trocadas e mãos reveladas!',
    color:
      'border-emerald-400 text-emerald-200 bg-emerald-950/95 shadow-[0_0_20px_rgba(52,211,153,0.6)]',
  },
  {
    key: 'REVEAL_ESPECIAIS',
    label: 'P4 · CONTROLE',
    subtitle: 'Pactos de sangue, Marcas da Morte e Desarmes cobram seu tributo!',
    color:
      'border-amber-400 text-amber-200 bg-amber-950/95 shadow-[0_0_20px_rgba(245,158,11,0.6)]',
  },
  {
    key: 'REVEAL_FACA',
    label: 'P5 · OFENSIVO',
    subtitle: 'As lâminas cortam a mesa e a Marca da Morte avança sobre quem não sangrou!',
    color:
      'border-blood-bright text-red-200 bg-red-950/95 shadow-[0_0_24px_rgba(220,38,38,0.7)]',
  },
];

export const VISUAL_EFFECT_BADGES = {
  VACUUM: {
    label: '🩸 VÁCUO (-1 VIDA)',
    cls: 'border-purple-400 bg-purple-950/95 text-purple-200',
  },
  REFLECT: {
    label: '🪞 ESPELHO AMALDIÇOADO!',
    cls: 'border-fuchsia-400 bg-fuchsia-950/95 text-fuchsia-200',
  },
  WALLED: {
    label: '🧱 EMPAREDADO',
    cls: 'border-cyan-400 bg-cyan-950/95 text-cyan-200',
  },
  WALL_BROKEN: {
    label: '💥 PAREDE QUEBRADA',
    cls: 'border-amber-400 bg-amber-950/95 text-amber-200',
  },
  DAMAGE: {
    label: '🔪 FERIDO',
    cls: 'border-red-500 bg-red-950/95 text-red-200',
  },
  REVEALED: {
    label: '👁️ MÃO REVELADA',
    cls: 'border-amber-400 bg-amber-950/95 text-amber-200',
  },
  DISARMED: {
    label: '🧤 DESARMADO (-2 CARTAS)',
    cls: 'border-orange-400 bg-orange-950/95 text-orange-200',
  },
  SOUL_SWAP: {
    label: '👻 VIDA TROCADA!',
    cls: 'border-teal-400 bg-teal-950/95 text-teal-200',
  },
  SOUL_BUFF: {
    label: '🔥 FACA FORTALECIDA (+1 DANO)',
    cls: 'border-emerald-400 bg-emerald-950/95 text-emerald-200',
  },
  BLOOD_PACT: {
    label: '🩸 PACTO DE SANGUE ATIVO',
    cls: 'border-rose-500 bg-rose-950/95 text-rose-200',
  },
  PACT_BROKEN: {
    label: '⛓️‍💥 PACTO QUEBRADO!',
    cls: 'border-amber-300 bg-amber-950/95 text-amber-100',
  },
  HEAL: {
    label: '💉 CURADO!',
    cls: 'border-emerald-400 bg-emerald-950/95 text-emerald-200',
  },
  SYRINGE_EMPTY: {
    label: '💉 SERINGA VAZIA (0/4)',
    cls: 'border-stone-400 bg-stone-900/95 text-stone-300',
  },
  OVERDOSE: {
    label: '☣️ OVERDOSE! (MARCA DA MORTE)',
    cls: 'border-lime-400 bg-lime-950/95 text-lime-200',
  },
  DEATH_MARKED: {
    label: '☠️ MARCA DA MORTE!',
    cls: 'border-lime-400 bg-lime-950/95 text-lime-200',
  },
  DEATH_MARK_KILL: {
    label: '💀 MORTE INSTANTÂNEA (MARCA)',
    cls: 'border-red-500 bg-black/95 text-red-300',
  },
};

export const LOG_STYLES = {
  VACUUM:
    'text-fuchsia-300 font-semibold bg-fuchsia-950/30 border-l-2 border-fuchsia-500 pl-2 py-0.5 rounded-r shadow-sm',
  REFLECT:
    'text-amber-300 font-semibold bg-gold-aged/15 border-l-2 border-gold-aged pl-2 py-0.5 rounded-r shadow-sm',
  STEAL:
    'text-amber-200 font-bold bg-amber-950/30 border-l-2 border-amber-400 pl-2 py-0.5 rounded-r shadow-sm',
  WALL: 'text-[#9ed0f6] font-medium bg-blue-950/30 border-l-2 border-[#7fa3c0] pl-2 py-0.5 rounded-r shadow-sm',
  BREAK:
    'text-orange-300 font-medium bg-orange-950/30 border-l-2 border-orange-500 pl-2 py-0.5 rounded-r shadow-sm',
  DAMAGE:
    'text-red-300 font-semibold bg-red-950/35 border-l-2 border-blood-bright pl-2 py-0.5 rounded-r shadow-sm',
  HEAL: 'text-emerald-200 font-semibold bg-emerald-950/35 border-l-2 border-emerald-400 pl-2 py-0.5 rounded-r shadow-sm',
  CURSE:
    'text-lime-200 font-bold bg-lime-950/40 border-l-2 border-lime-400 pl-2 py-0.5 rounded-r shadow-sm',
  PACT: 'text-rose-300 font-bold bg-rose-950/40 border-l-2 border-rose-500 pl-2 py-0.5 rounded-r shadow-sm',
  SOUL: 'text-teal-200 font-semibold bg-teal-950/35 border-l-2 border-teal-400 pl-2 py-0.5 rounded-r shadow-sm',
  DISARM:
    'text-orange-200 font-semibold bg-orange-950/35 border-l-2 border-orange-400 pl-2 py-0.5 rounded-r shadow-sm',
  REVEAL:
    'text-amber-200 font-semibold bg-amber-950/35 border-l-2 border-amber-400 pl-2 py-0.5 rounded-r shadow-sm',
  DEATH:
    'text-white font-extrabold bg-red-950/70 border-l-2 border-red-500 pl-2 py-0.5 rounded-r shadow-[0_0_10px_rgba(220,38,38,0.3)]',
  SYSTEM:
    'text-amber-100 font-bold bg-stone-900/60 border-l-2 border-stone-500 pl-2 py-0.5 rounded-r text-[10px] tracking-wider',
  CHAT: 'text-emerald-300 font-medium bg-emerald-950/30 border-l-2 border-emerald-500 pl-2 py-0.5 rounded-r shadow-sm',
  CHAT_DEAD:
    'text-purple-300 italic font-medium bg-purple-950/35 border-l-2 border-purple-500 pl-2 py-0.5 rounded-r shadow-sm',
};

export const CAMERA_ZONES = {
  PLAYERS: 'PLAYERS', // Mouse para cima -> olha para as silhuetas dos jogadores
  CARDS: 'CARDS', // Mouse no meio/baixo -> olha para a mesa e cartas na mão
  NOTEBOOK: 'NOTEBOOK', // Mouse bem embaixo -> acessa o caderno de anotações e chat
};

export const MIN_MAX_HP = 2;
export const MAX_MAX_HP = 5;
export const DEFAULT_MAX_HP = 3;

export const MIN_HAND_CARDS = 3;
export const MAX_HAND_CARDS = 5;
export const DEFAULT_HAND_CARDS = 3;

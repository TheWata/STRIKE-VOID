export const CARD_TYPES = {
  FACA: 'FACA',
  PAREDE: 'PAREDE',
  REVERSO: 'REVERSO', // Espelho Amaldiçoado
  REVELAR: 'REVELAR',
  DESARMAR: 'DESARMAR',
  MANIPULAMENTO_ALMA: 'MANIPULAMENTO_ALMA',
  PACTO_SANGUE: 'PACTO_SANGUE',
  MARCA_MORTE: 'MARCA_MORTE',
  SERINGA: 'SERINGA',
};

export const CARD_CATEGORIES = {
  REACAO: {
    id: 'REACAO',
    label: 'REAÇÃO',
    priority: 1,
    badgeCls: 'border-purple-400/80 bg-purple-950/95 text-purple-100',
  },
  DEFENSIVO: {
    id: 'DEFENSIVO',
    label: 'DEFENSIVO',
    priority: 2,
    badgeCls: 'border-cyan-400/80 bg-cyan-950/95 text-cyan-100',
  },
  SUPORTE: {
    id: 'SUPORTE',
    label: 'SUPORTE',
    priority: 3,
    badgeCls: 'border-emerald-400/80 bg-emerald-950/95 text-emerald-100',
  },
  CONTROLE: {
    id: 'CONTROLE',
    label: 'CONTROLE',
    priority: 4,
    badgeCls: 'border-amber-400/80 bg-amber-950/95 text-amber-100',
  },
  OFENSIVO: {
    id: 'OFENSIVO',
    label: 'OFENSIVO',
    priority: 5,
    badgeCls: 'border-red-500/85 bg-red-950/95 text-red-100',
  },
};

export const CARD_META = {
  [CARD_TYPES.REVERSO]: {
    type: CARD_TYPES.REVERSO,
    name: 'ESPELHO AMALDIÇOADO',
    shortName: 'ESPELHO',
    foot: 'REFLETE AÇÕES · VÁCUO: -1 VIDA',
    targetShort: 'Alvo: Você ou Outro',
    wallShort: 'Respeita Parede',
    cardText:
      'Reflete ataques e maldições de volta aos agressores ou rouba Paredes. No vazio (sem ataques ao alvo), cobra -1 Vida!',
    category: 'REACAO',
    categoryLabel: 'REAÇÃO',
    priority: 1,
    badge: 'P1 · Reação',
    accentColor: '#c084fc',
    requiresOtherPlayer: false,
    ignoresWall: false,
    description:
      'Prioridade 1 (Reação): Espelho quebrado que reflete ações de volta aos atacantes ou rouba paredes. No vazio, cobra 1 Vida!',
  },
  [CARD_TYPES.PAREDE]: {
    type: CARD_TYPES.PAREDE,
    name: 'PAREDE',
    shortName: 'PAREDE',
    foot: 'BLOQUEIA 1 FACA · PRENDE MIRA',
    targetShort: 'Alvo: Você ou Outro',
    wallShort: 'Cria Emparedado',
    cardText:
      'Ergue grades de ferro ao redor do alvo. Absorve 1 golpe de Faca, mas impede o emparedado de mirar nos outros.',
    category: 'DEFENSIVO',
    categoryLabel: 'DEFENSIVO',
    priority: 2,
    badge: 'P2 · Defensivo',
    accentColor: '#7fa3c0',
    requiresOtherPlayer: false,
    ignoresWall: false,
    description:
      'Prioridade 2 (Defensivo): Ergue grades de ferro ao redor do alvo. Absorve 1 facada, mas impede o emparedado de mirar nos outros.',
  },
  [CARD_TYPES.SERINGA]: {
    type: CARD_TYPES.SERINGA,
    name: 'SERINGA',
    shortName: 'SERINGA',
    foot: '+1 CARGA/TURNO · OVERDOSE',
    targetShort: 'Alvo: Você ou Outro',
    wallShort: 'Respeita Parede',
    cardText:
      'Ganha +1 carga/turno na mão (máx 4). Cura 1 Vida por carga. Exceder a vida máxima causa OVERDOSE (Marca da Morte)!',
    category: 'SUPORTE',
    categoryLabel: 'SUPORTE',
    priority: 3,
    badge: 'P3 · Suporte',
    accentColor: '#4ade80',
    requiresOtherPlayer: false,
    ignoresWall: false,
    description:
      'Prioridade 3 (Suporte): Começa vazia (0/4) e ganha +1 carga a cada turno na mão. Cura 1 Vida por carga. Se a cura exceder a vida máxima, entra em OVERDOSE e aplica Marca da Morte com (5 − excesso) turnos!',
  },
  [CARD_TYPES.MANIPULAMENTO_ALMA]: {
    type: CARD_TYPES.MANIPULAMENTO_ALMA,
    name: 'MANIP. DE ALMA',
    shortName: 'MANIP. ALMA',
    foot: 'TROCA VIDA / +1 DANO NA FACA',
    targetShort: 'Alvo: Outro ou Você',
    wallShort: 'Respeita Parede',
    cardText:
      'Em outro jogador: troca sua barra de vida atual pela dele. Em si mesmo: aumenta permanentemente sua Faca (+1 Dano)!',
    category: 'SUPORTE',
    categoryLabel: 'SUPORTE',
    priority: 3,
    badge: 'P3 · Suporte',
    accentColor: '#2dd4bf',
    requiresOtherPlayer: false,
    ignoresWall: false,
    description:
      'Prioridade 3 (Suporte): Se usado em outro jogador, troca sua barra de vida com a dele. Se usado em si mesmo, aumenta permanentemente o dano da própria Faca (+1 Dano)!',
  },
  [CARD_TYPES.REVELAR]: {
    type: CARD_TYPES.REVELAR,
    name: 'REVELAR',
    shortName: 'REVELAR',
    foot: 'EXPÕE A MÃO DO ALVO P/ A MESA',
    targetShort: 'Alvo: Outro Jogador',
    wallShort: 'Bloqueada se Emparedado',
    cardText:
      'O Olho Abissal revela todas as cartas da mão do oponente selecionado para toda a mesa durante esta e a próxima rodada.',
    category: 'SUPORTE',
    categoryLabel: 'SUPORTE',
    priority: 3,
    badge: 'P3 · Suporte',
    accentColor: '#f59e0b',
    requiresOtherPlayer: true,
    ignoresWall: false,
    description:
      'Prioridade 3 (Suporte): O Olho Abissal revela todas as cartas da mão do jogador selecionado para toda a mesa durante esta e a próxima rodada.',
  },
  [CARD_TYPES.PACTO_SANGUE]: {
    type: CARD_TYPES.PACTO_SANGUE,
    name: 'PACTO DE SANGUE',
    shortName: 'PACTO SANGUE',
    foot: 'VINCULA VIDA · EM SI: QUEBRA',
    targetShort: 'Alvo: Qualquer (Ignora Parede)',
    wallShort: 'Ignora Paredes',
    cardText:
      'Ignora Parede e vincula sua vida à de outro (dano compartilhado). Em si mesmo: quebra seus pactos (sem pacto: -1 Vida).',
    category: 'CONTROLE',
    categoryLabel: 'CONTROLE',
    priority: 4,
    badge: 'P4 · Controle',
    accentColor: '#f43f5e',
    requiresOtherPlayer: false,
    ignoresWall: true,
    description:
      'Prioridade 4 (Controle): Ignora Parede e vincula sua vida à de outra pessoa. Usado em SI MESMO: quebra seus pactos ativos (se não estiver em pacto, perde 1 Vida). Se refletido, toma 1 de dano!',
  },
  [CARD_TYPES.MARCA_MORTE]: {
    type: CARD_TYPES.MARCA_MORTE,
    name: 'MARCA DA MORTE',
    shortName: 'MARCA MORTE',
    foot: '5 RODADAS SEM DANO = MORTE',
    targetShort: 'Alvo: Outro Jogador',
    wallShort: 'Bloqueada se Emparedado',
    cardText:
      'Amaldiçoa outro jogador por 5 rodadas. Se chegar a 0 sem tomar dano, morre instantaneamente! Sangrar remove a marca.',
    category: 'CONTROLE',
    categoryLabel: 'CONTROLE',
    priority: 4,
    badge: 'P4 · Controle',
    accentColor: '#a3e635',
    requiresOtherPlayer: true,
    ignoresWall: false,
    description:
      'Prioridade 4 (Controle): Amaldiçoa outro jogador com a Marca da Morte. Se o marcado ficar 5 rodadas sem tomar dano, morre instantaneamente! Sofrer dano sacia e remove a marca.',
  },
  [CARD_TYPES.DESARMAR]: {
    type: CARD_TYPES.DESARMAR,
    name: 'DESARMAR',
    shortName: 'DESARMAR',
    foot: 'DESCARTA 2 CARTAS DO ALVO',
    targetShort: 'Alvo: Outro Jogador',
    wallShort: 'Bloqueada se Emparedado',
    cardText:
      'Sabotagem direta: arranca e descarta até 2 cartas aleatórias diretamente da mão do oponente selecionado.',
    category: 'CONTROLE',
    categoryLabel: 'CONTROLE',
    priority: 4,
    badge: 'P4 · Controle',
    accentColor: '#fb923c',
    requiresOtherPlayer: true,
    ignoresWall: false,
    description:
      'Prioridade 4 (Controle): Arranca e descarta 2 cartas aleatórias diretamente da mão de outro jogador.',
  },
  [CARD_TYPES.FACA]: {
    type: CARD_TYPES.FACA,
    name: 'FACA',
    shortName: 'FACA',
    foot: 'CAUSA 1+ DANO · QUEBRA PAREDE',
    targetShort: 'Alvo: Você ou Outro',
    wallShort: 'Quebra 1 Parede',
    cardText:
      'Golpeia o alvo causando 1 de Dano (+ se fortalecida) ou destrói 1 Parede. Em si mesmo emparedado: quebra a própria Parede.',
    category: 'OFENSIVO',
    categoryLabel: 'OFENSIVO',
    priority: 5,
    badge: 'P5 · Ofensivo',
    accentColor: '#dc2626',
    requiresOtherPlayer: false,
    ignoresWall: false,
    description:
      'Prioridade 5 (Ofensivo): Golpeia o alvo causando 1 de Dano (ou mais se fortalecida por Manipulamento de Alma) ou destrói uma Parede.',
  },
};

/**
 * Verifica se um jogador `targetPlayer` pode ser alvo da carta `selectedCard` usada por `me`.
 */
export function canTargetPlayer({ canAct, selectedCard, targetPlayer, me }) {
  if (!canAct || !selectedCard || !targetPlayer || !targetPlayer.isAlive || !me) {
    return false;
  }
  const meta = CARD_META[selectedCard.type];
  const isSelf = targetPlayer.id === me.id;

  // Cartas que exigem outro jogador como alvo (Revelar, Desarmar, Marca da Morte)
  if (meta?.requiresOtherPlayer && isSelf) {
    return false;
  }

  // Pacto de Sangue ignora parede do conjurador e do alvo (pode mirar em si ou em qualquer vivo)
  if (meta?.ignoresWall) {
    return true;
  }

  // Se o conjurador estiver emparedado, só pode mirar em si mesmo
  if (me.isWalled) {
    return isSelf;
  }

  return true;
}

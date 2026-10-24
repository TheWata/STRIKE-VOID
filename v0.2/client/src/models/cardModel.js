export const CARD_TYPES = {
  FACA: 'FACA',
  PAREDE: 'PAREDE',
  REVERSO: 'REVERSO', // Espelho Amaldiçoado
  REVELAR: 'REVELAR',
  DESARMAR: 'DESARMAR',
  MANIPULAMENTO_ALMA: 'MANIPULAMENTO_ALMA',
  PACTO_SANGUE: 'PACTO_SANGUE',
};

export const CARD_META = {
  [CARD_TYPES.FACA]: {
    type: CARD_TYPES.FACA,
    name: 'FACA',
    shortName: 'FACA',
    foot: '1 DANO / QUEBRA PAREDE',
    badge: 'Ofensiva · 1+ Dano',
    accentColor: '#dc2626',
    requiresOtherPlayer: false,
    ignoresWall: false,
    description:
      'Golpeia o alvo causando 1 de Dano (ou mais se fortalecida por Manipulamento de Alma) ou destrói uma Parede.',
  },
  [CARD_TYPES.PAREDE]: {
    type: CARD_TYPES.PAREDE,
    name: 'PAREDE',
    shortName: 'PAREDE',
    foot: 'ISOLA ALVO / AUTO-MIRA',
    badge: 'Defensiva · Prisão',
    accentColor: '#7fa3c0',
    requiresOtherPlayer: false,
    ignoresWall: false,
    description:
      'Ergue grades de ferro ao redor do alvo. Absorve 1 facada, mas impede o emparedado de mirar nos outros.',
  },
  [CARD_TYPES.REVERSO]: {
    type: CARD_TYPES.REVERSO,
    name: 'ESPELHO AMALDIÇOADO',
    shortName: 'ESPELHO AMALD.',
    foot: 'REFLETE / ROUBA PAREDE',
    badge: 'Reflexo · Maldição',
    accentColor: '#c084fc',
    requiresOtherPlayer: false,
    ignoresWall: false,
    description:
      'Um espelho quebrado amaldiçoado que reflete ações de volta aos atacantes ou rouba paredes. No vazio, cobra 1 Vida!',
  },
  [CARD_TYPES.REVELAR]: {
    type: CARD_TYPES.REVELAR,
    name: 'REVELAR',
    shortName: 'REVELAR',
    foot: 'EXPÕE A MÃO DO ALVO',
    badge: 'Visão · Espionagem',
    accentColor: '#f59e0b',
    requiresOtherPlayer: true,
    ignoresWall: false,
    description:
      'O Olho Abissal revela todas as cartas da mão do jogador selecionado para toda a mesa durante esta e a próxima rodada.',
  },
  [CARD_TYPES.DESARMAR]: {
    type: CARD_TYPES.DESARMAR,
    name: 'DESARMAR',
    shortName: 'DESARMAR',
    foot: 'DESCARTA 2 DO ALVO',
    badge: 'Sabotagem · Descarte',
    accentColor: '#fb923c',
    requiresOtherPlayer: true,
    ignoresWall: false,
    description:
      'Arranca e descarta 2 cartas aleatórias diretamente da mão de outro jogador.',
  },
  [CARD_TYPES.MANIPULAMENTO_ALMA]: {
    type: CARD_TYPES.MANIPULAMENTO_ALMA,
    name: 'MANIP. DE ALMA',
    shortName: 'MANIP. ALMA',
    foot: 'TROCA VIDA / +1 FACA',
    badge: 'Arcano · Vida & Dano',
    accentColor: '#2dd4bf',
    requiresOtherPlayer: false,
    ignoresWall: false,
    description:
      'Se usado em outro jogador, troca sua barra de vida com a dele. Se usado em si mesmo, aumenta permanentemente o dano da própria Faca (+1 Dano)!',
  },
  [CARD_TYPES.PACTO_SANGUE]: {
    type: CARD_TYPES.PACTO_SANGUE,
    name: 'PACTO DE SANGUE',
    shortName: 'PACTO SANGUE',
    foot: 'IGNORA PAREDE / VINCULA',
    badge: 'Sangue · Vínculo',
    accentColor: '#f43f5e',
    requiresOtherPlayer: true,
    ignoresWall: true,
    description:
      'Ignora qualquer Parede e vincula sua barra de vida à de outra pessoa (todo dano sofrido é compartilhado). Se refletido pelo Espelho Amaldiçoado, você toma 1 de dano!',
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

  // Cartas que exigem outro jogador como alvo (Revelar, Desarmar, Pacto de Sangue)
  if (meta?.requiresOtherPlayer && isSelf) {
    return false;
  }

  // Pacto de Sangue ignora parede do conjurador e do alvo
  if (meta?.ignoresWall) {
    return !isSelf;
  }

  // Se o conjurador estiver emparedado, só pode mirar em si mesmo
  if (me.isWalled) {
    return isSelf;
  }

  return true;
}

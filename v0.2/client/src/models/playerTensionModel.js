import { CARD_TYPES, CARD_META } from './cardModel.js';
import { EXPRESSION_KEYS, EXPRESSION_LABELS } from './expressionAtlas.js';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

const HOSTILE_CARD_TYPES = [
  CARD_TYPES.FACA,
  CARD_TYPES.MARCA_MORTE,
  CARD_TYPES.DESARMAR,
  CARD_TYPES.PACTO_SANGUE,
  CARD_TYPES.PAREDE,
  CARD_TYPES.REVELAR,
];

/**
 * Avalia o efeito real da carta selecionada caso seja usada no próprio jogador
 * e retorna a reação facial contextual (Prioridade 1) e os textos de preview.
 */
export function resolveContextualSelfCardReaction(selectedCard, me) {
  if (!selectedCard || !me) return null;

  const meta = CARD_META[selectedCard.type];
  if (!meta || meta.requiresOtherPlayer) return null;

  const maxLives = Math.max(1, Number(me.maxLives ?? me.maxHp) || 3);
  const lives = clamp(Number(me.lives ?? me.hp ?? maxLives), 0, maxLives);
  const missingHp = Math.max(0, maxLives - lives);
  const isWalled = Boolean(me.isWalled);
  const hasActivePact = Array.isArray(me.bloodPactWith) && me.bloodPactWith.length > 0;
  const currentKnife = Number(me.knifeDamage) || 1;

  switch (selectedCard.type) {
    case CARD_TYPES.SERINGA: {
      const charges = Number(selectedCard.charges) || 0;
      if (charges <= 0) {
        return {
          expression: EXPRESSION_KEYS.TRISTE,
          actionTitle: 'Seringa Vazia (0/4)',
          actionSubtitle: 'Sem cargas restantes — não restaura vida',
          tone: 'neutral',
        };
      }
      if (charges > missingHp) {
        return {
          expression: EXPRESSION_KEYS.ENVENENADO,
          actionTitle: `Risco de Overdose (${charges}/4)`,
          actionSubtitle: 'Excede sua vida máxima e aplica Marca da Morte!',
          tone: 'danger',
        };
      }
      return {
        expression: EXPRESSION_KEYS.ALIVIO,
        actionTitle: `Curar +${charges} Vida (${charges}/4)`,
        actionSubtitle: 'Clique no retrato para restaurar sua vitalidade',
        tone: 'beneficial',
      };
    }

    case CARD_TYPES.FACA: {
      if (isWalled) {
        return {
          expression: EXPRESSION_KEYS.DETERMINADO,
          actionTitle: 'Quebrar Minha Parede',
          actionSubtitle: 'Destrói suas grades de ferro sem sofrer dano',
          tone: 'beneficial',
        };
      }
      return {
        expression: currentKnife >= lives ? EXPRESSION_KEYS.MORRENDO : EXPRESSION_KEYS.MEDO,
        actionTitle: `Auto-Golpe (-${currentKnife} HP)`,
        actionSubtitle: 'Cuidado: corta a própria carne na mesa!',
        tone: 'danger',
      };
    }

    case CARD_TYPES.PACTO_SANGUE: {
      if (hasActivePact) {
        return {
          expression: EXPRESSION_KEYS.DETERMINADO,
          actionTitle: 'Romper Meu Pacto',
          actionSubtitle: 'Quebra todos os seus vínculos de sangue ativos',
          tone: 'beneficial',
        };
      }
      return {
        expression: lives <= 1 ? EXPRESSION_KEYS.MORRENDO : EXPRESSION_KEYS.MEDO,
        actionTitle: 'Pacto Vazio (-1 HP)',
        actionSubtitle: 'Sem pacto ativo: fere a si mesmo em 1 Vida',
        tone: 'danger',
      };
    }

    case CARD_TYPES.MANIPULAMENTO_ALMA: {
      return {
        expression: EXPRESSION_KEYS.LOUCURA,
        actionTitle: `Fortalecer Faca (${currentKnife + 1}x Dano)`,
        actionSubtitle: 'Aumenta permanentemente o dano da sua Faca em +1',
        tone: 'beneficial',
      };
    }

    case CARD_TYPES.PAREDE: {
      return {
        expression: EXPRESSION_KEYS.DETERMINADO,
        actionTitle: 'Erguer Parede em Mim',
        actionSubtitle: 'Bloqueia 1 Faca, mas restringe sua mira no próximo turno',
        tone: 'tactical',
      };
    }

    case CARD_TYPES.REVERSO: {
      return {
        expression: lives <= 1 ? EXPRESSION_KEYS.ANSIEDADE : EXPRESSION_KEYS.ATENCAO,
        actionTitle: 'Espelho em Mim',
        actionSubtitle: 'Reflete ataques e maldições (Risco de Vácuo se ninguém atacar)',
        tone: 'tactical',
      };
    }

    default:
      return {
        expression: EXPRESSION_KEYS.ATENCAO,
        actionTitle: `Usar ${meta.name} em Mim`,
        actionSubtitle: 'Clique no retrato para confirmar a ação',
        tone: 'tactical',
      };
  }
}

/**
 * Resolve a expressão ativa do personagem respeitando a hierarquia estrita de 5 prioridades:
 *   Prioridade 1 — Reação contextual ao apontar uma carta auto-alvejável para o retrato
 *   Prioridade 2 — Reação temporária a evento imediato (DOR ou ALIVIO)
 *   Prioridade 3 — Estado crítico ou efeito prioritário de combate
 *   Prioridade 4 — Condições persistentes da partida
 *   Prioridade 5 — Expressão padrão (NORMAL)
 */
export function resolvePortraitExpression({
  factors,
  tensionLevel,
  tensionScore,
  selectedCard = null,
  canSelfTarget = false,
  isHoveringValidSelfTarget = false,
  isDamagedEvent = false,
  isReliefEvent = false,
  me = null,
}) {
  if (!factors) {
    return {
      expressionKey: EXPRESSION_KEYS.NORMAL,
      expressionLabel: EXPRESSION_LABELS.NORMAL,
      priorityLevel: 5,
      selfCardPreview: null,
    };
  }

  const selfCardPreview =
    canSelfTarget && selectedCard ? resolveContextualSelfCardReaction(selectedCard, me) : null;

  // PRIORIDADE 1: Reação contextual ao apontar uma carta válida sobre o próprio retrato
  if (isHoveringValidSelfTarget && selfCardPreview) {
    const key = selfCardPreview.expression;
    return {
      expressionKey: key,
      expressionLabel: EXPRESSION_LABELS[key] || 'Atenção',
      priorityLevel: 1,
      selfCardPreview,
    };
  }

  // Se o jogador está morto, mantém expressão de morte/colapso
  if (!factors.isAlive) {
    return {
      expressionKey: EXPRESSION_KEYS.MORRENDO,
      expressionLabel: EXPRESSION_LABELS.MORRENDO,
      priorityLevel: 3,
      selfCardPreview,
    };
  }

  // PRIORIDADE 2: Reação temporária a evento imediato de combate (DOR tem precedência sobre ALIVIO)
  if (isDamagedEvent || factors.isDamagedNow) {
    return {
      expressionKey: EXPRESSION_KEYS.DOR,
      expressionLabel: EXPRESSION_LABELS.DOR,
      priorityLevel: 2,
      selfCardPreview,
    };
  }

  if (isReliefEvent || factors.isHealingNow) {
    return {
      expressionKey: EXPRESSION_KEYS.ALIVIO,
      expressionLabel: EXPRESSION_LABELS.ALIVIO,
      priorityLevel: 2,
      selfCardPreview,
    };
  }

  // PRIORIDADE 3: Estado crítico ou efeito prioritário de combate
  if (
    factors.isCriticalHp &&
    (factors.hasLethalIncoming ||
      factors.isDeathMarkUrgent ||
      factors.incomingAttackCount >= 2)
  ) {
    return {
      expressionKey: EXPRESSION_KEYS.MORRENDO,
      expressionLabel: EXPRESSION_LABELS.MORRENDO,
      priorityLevel: 3,
      selfCardPreview,
    };
  }

  if (
    factors.isCriticalHp &&
    (factors.incomingAttackCount === 1 ||
      factors.pactPartnerInDanger ||
      factors.isWalledWithoutEscape)
  ) {
    return {
      expressionKey: EXPRESSION_KEYS.CHORANDO,
      expressionLabel: EXPRESSION_LABELS.CHORANDO,
      priorityLevel: 3,
      selfCardPreview,
    };
  }

  if (factors.isOverdoseNow || factors.isDeathMarkUrgent) {
    return {
      expressionKey: EXPRESSION_KEYS.ENVENENADO,
      expressionLabel: EXPRESSION_LABELS.ENVENENADO,
      priorityLevel: 3,
      selfCardPreview,
    };
  }

  if (factors.isWalled) {
    return {
      expressionKey: EXPRESSION_KEYS.PRESO,
      expressionLabel: EXPRESSION_LABELS.PRESO,
      priorityLevel: 3,
      selfCardPreview,
    };
  }

  if (factors.isDisarmed) {
    return {
      expressionKey: EXPRESSION_KEYS.PARALISADO,
      expressionLabel: EXPRESSION_LABELS.PARALISADO,
      priorityLevel: 3,
      selfCardPreview,
    };
  }

  if (factors.isSoulSwapped || factors.isReflecting) {
    return {
      expressionKey: EXPRESSION_KEYS.LOUCURA,
      expressionLabel: EXPRESSION_LABELS.LOUCURA,
      priorityLevel: 3,
      selfCardPreview,
    };
  }

  if (factors.isHandRevealed || factors.incomingAttackCount >= 2) {
    return {
      expressionKey: EXPRESSION_KEYS.ASSUSTADO,
      expressionLabel: EXPRESSION_LABELS.ASSUSTADO,
      priorityLevel: 3,
      selfCardPreview,
    };
  }

  // PRIORIDADE 4: Condições persistentes da partida
  if (factors.isCriticalHp) {
    return {
      expressionKey: EXPRESSION_KEYS.POUCA_VIDA,
      expressionLabel: EXPRESSION_LABELS.POUCA_VIDA,
      priorityLevel: 4,
      selfCardPreview,
    };
  }

  if (
    factors.incomingAttackCount === 1 ||
    factors.enemyHasLethalKnife ||
    (factors.hasBloodPact && factors.pactPartnerInDanger)
  ) {
    return {
      expressionKey: EXPRESSION_KEYS.MEDO,
      expressionLabel: EXPRESSION_LABELS.MEDO,
      priorityLevel: 4,
      selfCardPreview,
    };
  }

  if (factors.hasDeathMark) {
    return {
      expressionKey: EXPRESSION_KEYS.ENVENENADO,
      expressionLabel: EXPRESSION_LABELS.ENVENENADO,
      priorityLevel: 4,
      selfCardPreview,
    };
  }

  if (
    factors.hasBloodPact ||
    factors.timeUrgency > 0 ||
    factors.selectedCardSelfRisk === 'OVERDOSE' ||
    factors.selectedCardSelfRisk === 'SELF_DAMAGE'
  ) {
    return {
      expressionKey: EXPRESSION_KEYS.ANSIEDADE,
      expressionLabel: EXPRESSION_LABELS.ANSIEDADE,
      priorityLevel: 4,
      selfCardPreview,
    };
  }

  if (factors.isLowHp) {
    return {
      expressionKey: EXPRESSION_KEYS.FERIDO,
      expressionLabel: EXPRESSION_LABELS.FERIDO,
      priorityLevel: 4,
      selfCardPreview,
    };
  }

  if (factors.lowHandResources || factors.isSyringeEmpty) {
    return {
      expressionKey: EXPRESSION_KEYS.TRISTE,
      expressionLabel: EXPRESSION_LABELS.TRISTE,
      priorityLevel: 4,
      selfCardPreview,
    };
  }

  if (factors.hasSoulBuff) {
    return {
      expressionKey: EXPRESSION_KEYS.DETERMINADO,
      expressionLabel: EXPRESSION_LABELS.DETERMINADO,
      priorityLevel: 4,
      selfCardPreview,
    };
  }

  if (tensionLevel === 'WATCHFUL' || tensionScore >= 0.2) {
    return {
      expressionKey: EXPRESSION_KEYS.ATENCAO,
      expressionLabel: EXPRESSION_LABELS.ATENCAO,
      priorityLevel: 4,
      selfCardPreview,
    };
  }

  // PRIORIDADE 5: Expressão padrão
  return {
    expressionKey: EXPRESSION_KEYS.NORMAL,
    expressionLabel: EXPRESSION_LABELS.NORMAL,
    priorityLevel: 5,
    selfCardPreview,
  };
}

/**
 * Avalia todas as condições reais da partida no STRIKE / VOID e consolida
 * o estado físico, emocional e tático do retrato dinâmico do jogador.
 *
 * Não altera nenhuma regra de combate; atua exclusivamente como camada
 * interpretativa para o avatar reativo da HUD.
 */
export function computePlayerPortraitState({
  me,
  players = [],
  phase = 'PLANNING',
  selectedCard = null,
  canSelfTarget = false,
  isHoveringValidSelfTarget = false,
  secsLeft = null,
  isDamagedEvent = false,
  isRecovering = false,
}) {
  if (!me) {
    return {
      tensionScore: 0,
      tensionLevel: 'CALM',
      statusLabel: 'AGUARDANDO',
      statusSummary: 'Aguardando início do ritual',
      expressionKey: EXPRESSION_KEYS.NORMAL,
      expressionLabel: EXPRESSION_LABELS.NORMAL,
      expressionPriority: 5,
      selfCardPreview: null,
      factors: {},
      visualParams: {
        heartbeatDuration: 3.8,
        eyeState: 'calm',
        postureState: 'composed',
        shadowIntensity: 0.25,
        crimsonGlow: 0,
        activeSegments: 1,
      },
    };
  }

  const maxLives = Math.max(1, Number(me.maxLives ?? me.maxHp) || 3);
  const lives = clamp(Number(me.lives ?? me.hp ?? maxLives), 0, maxLives);
  const isAlive = Boolean(me.isAlive && lives > 0);

  if (!isAlive) {
    return {
      tensionScore: 1,
      tensionLevel: 'DEAD',
      statusLabel: 'ESPÍRITO ESPECTADOR',
      statusSummary: 'Sua carne tombou na mesa; resta o sussurro no Vazio',
      expressionKey: EXPRESSION_KEYS.MORRENDO,
      expressionLabel: EXPRESSION_LABELS.MORRENDO,
      expressionPriority: 3,
      selfCardPreview: null,
      factors: {
        isAlive: false,
        lives: 0,
        maxLives,
        hpRatio: 0,
      },
      visualParams: {
        heartbeatDuration: 0,
        eyeState: 'dead',
        postureState: 'spectral',
        shadowIntensity: 0.88,
        crimsonGlow: 0.15,
        activeSegments: 0,
      },
    };
  }

  const aliveOpponents = players.filter((p) => p.id !== me.id && p.isAlive);
  const hand = Array.isArray(me.hand) ? me.hand : [];
  const fx = me.visualEffect || null;

  /* ------------------------------------------------------------------ */
  /* 1. VITALIDADE & DESGASTE FÍSICO (Vida Atual / Máxima + Dano)       */
  /* ------------------------------------------------------------------ */
  const hpRatio = lives / maxLives;
  const missingHpRatio = 1 - hpRatio;
  const isCriticalHp = lives === 1;
  const isLowHp = lives < maxLives;
  const isDamagedNow =
    isDamagedEvent || fx === 'DAMAGE' || fx === 'VACUUM' || fx === 'DEATH_MARK_KILL';
  const isHealingNow = fx === 'HEAL' || isRecovering;

  let vitalityStress = isCriticalHp ? 0.72 : missingHpRatio * 0.52;
  if (isDamagedNow) vitalityStress = clamp(vitalityStress + 0.22, 0, 1);

  /* ------------------------------------------------------------------ */
  /* 2. PRESSÃO TÁTICA & CERCAMENTO (Emparedado, Exposto, Sem Recursos) */
  /* ------------------------------------------------------------------ */
  const isWalled = Boolean(me.isWalled || fx === 'WALLED');
  const hasWallEscapeCard = hand.some(
    (c) => c.type === CARD_TYPES.FACA || c.type === CARD_TYPES.PACTO_SANGUE
  );
  const isWalledWithoutEscape = isWalled && !hasWallEscapeCard;

  const isHandRevealed = Boolean(me.isHandRevealed || fx === 'REVEALED');
  const isDisarmed = fx === 'DISARMED';
  const isSoulSwapped = fx === 'SOUL_SWAP';
  const isSyringeEmpty = fx === 'SYRINGE_EMPTY';
  const lowHandResources = hand.length <= 1 && phase === 'PLANNING' && !me.lockedIn;

  // Verifica se o jogador está com menos vida que os oponentes vivos (desvantagem na mesa)
  const opponentsWithMoreHp = aliveOpponents.filter((p) => (p.lives ?? 0) > lives).length;
  const isOutnumberedAndWeak =
    aliveOpponents.length >= 2 && opponentsWithMoreHp === aliveOpponents.length && isLowHp;

  // Pressão de oponentes já travados enquanto o jogador ainda decide
  const lockedOpponentsCount = aliveOpponents.filter((p) => p.lockedIn).length;
  const allOpponentsWaitingOnMe =
    phase === 'PLANNING' &&
    !me.lockedIn &&
    aliveOpponents.length > 0 &&
    lockedOpponentsCount === aliveOpponents.length;

  let corneredScore = 0;
  if (isWalled) corneredScore += isWalledWithoutEscape ? 0.52 : 0.36;
  if (isHandRevealed) corneredScore += 0.28;
  if (isDisarmed) corneredScore += 0.32;
  else if (lowHandResources) corneredScore += 0.18;
  if (isOutnumberedAndWeak) corneredScore += 0.2;
  if (allOpponentsWaitingOnMe) corneredScore += 0.12;
  corneredScore = clamp(corneredScore, 0, 1);

  /* ------------------------------------------------------------------ */
  /* 3. AMEAÇA IMINENTE & CONDIÇÕES DE COMBATE (Alvejado, Marca, Pacto) */
  /* ------------------------------------------------------------------ */
  const incomingAttacks = [];
  for (const opp of aliveOpponents) {
    const act = opp.selectedAction;
    if (!act || act.hidden || !act.cardType || act.cardType === 'NONE' || act.cardType === 'DISCARD') {
      continue;
    }
    const targetsMe =
      act.targetId === me.id ||
      (Array.isArray(act.additionalTargets) && act.additionalTargets.includes(me.id));
    if (targetsMe && HOSTILE_CARD_TYPES.includes(act.cardType)) {
      const oppKnife = opp.knifeDamage || 1;
      const isLethal =
        act.cardType === CARD_TYPES.FACA &&
        ((!isWalled && oppKnife >= lives) || (isWalled && oppKnife - 1 >= lives));
      incomingAttacks.push({
        attackerId: opp.id,
        attackerName: opp.name,
        cardType: act.cardType,
        isLethal,
      });
    }
  }

  const incomingAttackCount = incomingAttacks.length;
  const hasLethalIncoming = incomingAttacks.some((a) => a.isLethal);

  // Marca da Morte
  const deathMarkTurns =
    me.deathMarkTurns != null && me.deathMarkTurns > 0 ? Number(me.deathMarkTurns) : null;
  const hasDeathMark = deathMarkTurns != null;
  const isDeathMarkUrgent = hasDeathMark && deathMarkTurns <= 2;
  const isOverdoseNow = fx === 'OVERDOSE';

  // Pacto de Sangue e risco compartilhado com parceiros vinculados
  const pactIds = Array.isArray(me.bloodPactWith) ? me.bloodPactWith : [];
  const pactPartners = pactIds
    .map((pid) => players.find((p) => p.id === pid))
    .filter((p) => p && p.isAlive);
  const hasBloodPact = pactPartners.length > 0;
  const pactPartnerInDanger = pactPartners.some(
    (partner) =>
      partner.lives <= 1 ||
      (partner.deathMarkTurns != null && partner.deathMarkTurns <= 2) ||
      partner.visualEffect === 'DAMAGE'
  );

  // Oponentes com Faca Fortalecida na mesa
  const enemyMaxKnife = aliveOpponents.reduce(
    (max, p) => Math.max(max, Number(p.knifeDamage) || 1),
    1
  );
  const enemyHasLethalKnife = enemyMaxKnife >= lives && enemyMaxKnife > 1;

  // Urgência de relógio no fim do planejamento
  const timeUrgency =
    phase === 'PLANNING' && !me.lockedIn && secsLeft != null && secsLeft > 0
      ? secsLeft <= 3
        ? 2
        : secsLeft <= 6
          ? 1
          : 0
      : 0;

  // Risco tático da própria carta selecionada na mão (aviso preditivo)
  let selectedCardSelfRisk = null;
  if (phase === 'PLANNING' && !me.lockedIn && selectedCard) {
    if (
      selectedCard.type === CARD_TYPES.SERINGA &&
      (selectedCard.charges || 0) > maxLives - lives
    ) {
      selectedCardSelfRisk = 'OVERDOSE';
    } else if (
      selectedCard.type === CARD_TYPES.PACTO_SANGUE &&
      !hasBloodPact
    ) {
      selectedCardSelfRisk = 'SELF_DAMAGE';
    } else if (selectedCard.type === CARD_TYPES.REVERSO) {
      selectedCardSelfRisk = 'VACUUM_RISK';
    }
  }

  let threatScore = 0;
  if (hasLethalIncoming) {
    threatScore += 0.78;
  } else if (incomingAttackCount >= 2) {
    threatScore += 0.62;
  } else if (incomingAttackCount === 1) {
    threatScore += 0.38;
  }

  if (hasDeathMark) {
    if (deathMarkTurns === 1) threatScore += 0.75;
    else if (deathMarkTurns === 2) threatScore += 0.52;
    else threatScore += 0.32;
  }
  if (isOverdoseNow) threatScore += 0.25;

  if (hasBloodPact) {
    threatScore += pactPartnerInDanger ? 0.34 : 0.16;
  }

  if (enemyHasLethalKnife) {
    threatScore += 0.24;
  } else if (enemyMaxKnife > 1) {
    threatScore += 0.1;
  }

  if (timeUrgency === 2) threatScore += 0.28;
  else if (timeUrgency === 1) threatScore += 0.14;

  if (selectedCardSelfRisk === 'OVERDOSE') threatScore += 0.14;
  threatScore = clamp(threatScore, 0, 1);

  /* ------------------------------------------------------------------ */
  /* 4. COMBINAÇÃO SINÉRGICA E ALÍVIO (Evita exagero em fator isolado)  */
  /* ------------------------------------------------------------------ */
  const activeDimensions = [
    vitalityStress >= 0.3,
    corneredScore >= 0.28,
    threatScore >= 0.3,
  ].filter(Boolean).length;

  const synergyBonus =
    activeDimensions >= 3 ? 0.22 : activeDimensions === 2 ? 0.13 : 0;

  const dominant = Math.max(vitalityStress, corneredScore, threatScore);
  const secondary =
    (vitalityStress + corneredScore + threatScore - dominant) * 0.42;

  let rawTension = dominant + secondary + synergyBonus;

  if (isHealingNow && !hasLethalIncoming && !isCriticalHp && !isDamagedNow) {
    rawTension = Math.max(0.08, rawTension * 0.55 - 0.12);
  }

  const tensionScore = Number(clamp(rawTension, 0, 1).toFixed(2));

  /* ------------------------------------------------------------------ */
  /* 5. CLASSIFICAÇÃO DO ESTADO E EXPRESSÃO DO SPRITESHEET              */
  /* ------------------------------------------------------------------ */
  const knifeDamage = Number(me.knifeDamage) || 1;
  const hasSoulBuff = knifeDamage > 1 || fx === 'SOUL_BUFF';
  const isReflecting = Boolean(me.isReflecting || fx === 'REFLECT');
  const isVacuum = fx === 'VACUUM';

  let tensionLevel = 'CALM';
  if (isHealingNow && !isDamagedNow && tensionScore < 0.45) {
    tensionLevel = 'RELIEF';
  } else if (
    isDamagedNow ||
    tensionScore >= 0.74 ||
    (isCriticalHp && (corneredScore >= 0.3 || threatScore >= 0.3))
  ) {
    tensionLevel = 'CRITICAL';
  } else if (corneredScore >= 0.45 || (isWalled && tensionScore >= 0.42)) {
    tensionLevel = 'CORNERED';
  } else if (tensionScore >= 0.46) {
    tensionLevel = 'PRESSURED';
  } else if (tensionScore >= 0.22) {
    tensionLevel = 'WATCHFUL';
  }

  const factors = {
    isAlive,
    lives,
    maxLives,
    hpRatio,
    isLowHp,
    isCriticalHp,
    isDamagedNow,
    isHealingNow,
    isWalled,
    isWalledWithoutEscape,
    isHandRevealed,
    isDisarmed,
    isSoulSwapped,
    isSyringeEmpty,
    lowHandResources,
    incomingAttacks,
    incomingAttackCount,
    hasLethalIncoming,
    enemyHasLethalKnife,
    hasDeathMark,
    deathMarkTurns,
    isDeathMarkUrgent,
    isOverdoseNow,
    hasBloodPact,
    pactPartners,
    pactPartnerInDanger,
    enemyMaxKnife,
    timeUrgency,
    selectedCardSelfRisk,
    hasSoulBuff,
    knifeDamage,
    isReflecting,
    isVacuum,
    activeDimensions,
  };

  const resolvedExpression = resolvePortraitExpression({
    factors,
    tensionLevel,
    tensionScore,
    selectedCard,
    canSelfTarget,
    isHoveringValidSelfTarget,
    isDamagedEvent,
    isReliefEvent: isRecovering,
    me,
  });

  // Construção do resumo contextual real
  const activeReasons = [];
  if (isCriticalHp) activeReasons.push('1 Vida restante');
  else if (isLowHp) activeReasons.push(`Ferido (${lives}/${maxLives} HP)`);

  if (incomingAttackCount > 0) {
    activeReasons.push(
      incomingAttackCount === 1
        ? `Alvejado por ${incomingAttacks[0].attackerName}`
        : `Cercado por ${incomingAttackCount} ataques`
    );
  }
  if (hasDeathMark) {
    activeReasons.push(`Marca da Morte (${deathMarkTurns}t)`);
  }
  if (isWalled) {
    activeReasons.push(isWalledWithoutEscape ? 'Emparedado sem saída' : 'Emparedado');
  }
  if (hasBloodPact) {
    activeReasons.push(
      pactPartnerInDanger
        ? `Pacto em risco (${pactPartners.map((p) => p.name).join(', ')})`
        : `Pacto c/ ${pactPartners.map((p) => p.name).join(', ')}`
    );
  }
  if (isHandRevealed) activeReasons.push('Mão exposta');
  if (isDisarmed) activeReasons.push('Desarmado');
  if (timeUrgency > 0) activeReasons.push('Tempo esgotando');
  if (hasSoulBuff && activeReasons.length === 0) {
    activeReasons.push(`Faca Fortalecida (${knifeDamage}x Dano)`);
  }

  let statusLabel = 'ESTÁVEL';
  if (isHoveringValidSelfTarget && resolvedExpression.selfCardPreview) {
    statusLabel = resolvedExpression.selfCardPreview.actionTitle.toUpperCase();
  } else if (isDamagedNow) {
    statusLabel = 'DOR · FERIMENTO';
  } else if (tensionLevel === 'RELIEF') {
    statusLabel = 'ALÍVIO · RECUPERADO';
  } else if (tensionLevel === 'CRITICAL') {
    statusLabel =
      activeDimensions >= 2 ? 'COLAPSO IMINENTE' : 'ESTADO CRÍTICO';
  } else if (tensionLevel === 'CORNERED') {
    statusLabel = 'ENCURRALADO';
  } else if (tensionLevel === 'PRESSURED') {
    statusLabel = 'AMEAÇA ELEVADA';
  } else if (tensionLevel === 'WATCHFUL') {
    statusLabel = 'SOB TENSÃO';
  } else if (hasSoulBuff) {
    statusLabel = 'ALMA FORTALECIDA';
  }

  const statusSummary =
    isHoveringValidSelfTarget && resolvedExpression.selfCardPreview
      ? resolvedExpression.selfCardPreview.actionSubtitle
      : activeReasons.length > 0
        ? activeReasons.slice(0, 2).join(' · ')
        : tensionLevel === 'RELIEF'
          ? 'Vitalidade restaurada na mesa'
          : 'Postura firme e controle tático';

  const heartbeatDuration =
    tensionLevel === 'CRITICAL'
      ? 0.68
      : tensionLevel === 'CORNERED' || tensionLevel === 'PRESSURED'
        ? 1.15
        : tensionLevel === 'WATCHFUL'
          ? 2.1
          : 3.6;

  const eyeState =
    isDamagedNow || tensionLevel === 'CRITICAL'
      ? 'desperate'
      : tensionLevel === 'CORNERED'
        ? 'cornered'
        : tensionLevel === 'PRESSURED' || tensionLevel === 'WATCHFUL'
          ? 'vigilant'
          : tensionLevel === 'RELIEF'
            ? 'relieved'
            : hasSoulBuff
              ? 'empowered'
              : 'calm';

  const postureState =
    isDamagedNow
      ? 'recoil'
      : tensionLevel === 'CRITICAL'
        ? 'agonized'
        : isWalled
          ? 'caged'
          : tensionLevel === 'CORNERED' || tensionLevel === 'PRESSURED'
            ? 'guarded'
            : tensionLevel === 'RELIEF'
              ? 'relieved'
              : hasSoulBuff
                ? 'empowered'
                : 'composed';

  const shadowIntensity = Number(clamp(0.24 + tensionScore * 0.66, 0.2, 0.92).toFixed(2));
  const crimsonGlow = Number(clamp(tensionScore * 0.95, 0, 1).toFixed(2));
  const activeSegments = Math.max(1, Math.round(tensionScore * 8));

  return {
    tensionScore,
    tensionLevel,
    statusLabel,
    statusSummary,
    expressionKey: resolvedExpression.expressionKey,
    expressionLabel: resolvedExpression.expressionLabel,
    expressionPriority: resolvedExpression.priorityLevel,
    selfCardPreview: resolvedExpression.selfCardPreview,
    factors,
    visualParams: {
      heartbeatDuration,
      eyeState,
      postureState,
      shadowIntensity,
      crimsonGlow,
      activeSegments,
    },
  };
}

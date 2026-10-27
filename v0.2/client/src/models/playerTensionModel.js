import { CARD_TYPES } from './cardModel.js';

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
  secsLeft = null,
  isRecovering = false,
}) {
  if (!me) {
    return {
      tensionScore: 0,
      tensionLevel: 'CALM',
      statusLabel: 'AGUARDANDO',
      statusSummary: 'Aguardando início do ritual',
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
  const isDamagedNow = fx === 'DAMAGE' || fx === 'VACUUM' || fx === 'DEATH_MARK_KILL';
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
  // Ataques revelados na rodada apontando diretamente para o jogador
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

  // Combinação de situações: pouca vida + encurralado/ameaça amplifica a tensão
  const synergyBonus =
    activeDimensions >= 3 ? 0.22 : activeDimensions === 2 ? 0.13 : 0;

  // Peso consolidado das três dimensões + bônus de combinação
  const dominant = Math.max(vitalityStress, corneredScore, threatScore);
  const secondary =
    (vitalityStress + corneredScore + threatScore - dominant) * 0.42;

  let rawTension = dominant + secondary + synergyBonus;

  // Se o jogador acabou de se curar / recuperar e não está sob risco letal imediato, suaviza a tensão
  if (isHealingNow && !hasLethalIncoming && !isCriticalHp) {
    rawTension = Math.max(0.08, rawTension * 0.55 - 0.12);
  }

  const tensionScore = Number(clamp(rawTension, 0, 1).toFixed(2));

  /* ------------------------------------------------------------------ */
  /* 5. CLASSIFICAÇÃO DO ESTADO E RÓTULO TÁTICO CONTEXTUAL              */
  /* ------------------------------------------------------------------ */
  const knifeDamage = Number(me.knifeDamage) || 1;
  const hasSoulBuff = knifeDamage > 1 || fx === 'SOUL_BUFF';
  const isReflecting = Boolean(me.isReflecting || fx === 'REFLECT');
  const isVacuum = fx === 'VACUUM';

  let tensionLevel = 'CALM';
  if (isHealingNow && tensionScore < 0.45) {
    tensionLevel = 'RELIEF';
  } else if (tensionScore >= 0.74 || (isCriticalHp && (corneredScore >= 0.3 || threatScore >= 0.3))) {
    tensionLevel = 'CRITICAL';
  } else if (corneredScore >= 0.45 || (isWalled && tensionScore >= 0.42)) {
    tensionLevel = 'CORNERED';
  } else if (tensionScore >= 0.46) {
    tensionLevel = 'PRESSURED';
  } else if (tensionScore >= 0.22) {
    tensionLevel = 'WATCHFUL';
  }

  // Construção do resumo contextual real (sem inventar mecânicas)
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
  if (tensionLevel === 'RELIEF') statusLabel = 'ALÍVIO · RECUPERADO';
  else if (tensionLevel === 'CRITICAL') {
    statusLabel =
      activeDimensions >= 2 ? 'COLAPSO IMINENTE' : 'ESTADO CRÍTICO';
  } else if (tensionLevel === 'CORNERED') statusLabel = 'ENCURRALADO';
  else if (tensionLevel === 'PRESSURED') statusLabel = 'AMEAÇA ELEVADA';
  else if (tensionLevel === 'WATCHFUL') statusLabel = 'SOB TENSÃO';
  else if (hasSoulBuff) statusLabel = 'ALMA FORTALECIDA';

  const statusSummary =
    activeReasons.length > 0
      ? activeReasons.slice(0, 2).join(' · ')
      : tensionLevel === 'RELIEF'
        ? 'Vitalidade restaurada na mesa'
        : 'Postura firme e controle tático';

  // Parâmetros visuais contínuos para animar o retrato
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
    factors: {
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
      lowHandResources,
      incomingAttacks,
      incomingAttackCount,
      hasLethalIncoming,
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
    },
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

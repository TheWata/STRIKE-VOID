const {
  CARD_TYPES,
  CARD_NAMES,
  SUPPORT_CARD_TYPES,
  CONTROL_CARD_TYPES,
  BASE_DEATH_MARK_TURNS,
  MAX_SYRINGE_CHARGES,
} = require('../models/CardModel');
const { resetPlayerForMatch } = require('../models/PlayerModel');
const { buildDeck, drawCardForPlayer, normalizeCard } = require('./deckService');
const { getPlayer, alivePlayers, emitRoomState, getPublicRoomsList } = require('./roomService');
const { scheduleBot } = require('./botService');
const { wait, calculatePlayerTime } = require('../helpers/timeCalculator');
const { addLog } = require('../helpers/logger');
const {
  DEFAULT_HAND_CARDS,
  DEFAULT_INITIAL_HAND_CARDS,
} = require('../helpers/validators');

function applyAction(room, player, cardId, targetId) {
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return { ok: false, error: 'Carta inválida.' };
  const card = player.hand[idx];
  const finalTarget = targetId || player.id;
  const target = getPlayer(room, finalTarget);
  if (!target || !target.isAlive) return { ok: false, error: 'Alvo inválido.' };

  // Regra de Parede: apenas Pacto de Sangue ignora a parede e pode mirar fora
  if (player.isWalled && finalTarget !== player.id && card.type !== CARD_TYPES.PACTO_SANGUE) {
    return {
      ok: false,
      error: 'Você está EMPAREDADO! Só pode usar cartas em si mesmo, usar Pacto de Sangue ou passar a vez.',
    };
  }

  // Validações específicas por tipo de carta
  if (card.type === CARD_TYPES.DESARMAR && finalTarget === player.id) {
    return { ok: false, error: 'Desarmar só pode ser usado contra outro jogador!' };
  }
  if (card.type === CARD_TYPES.REVELAR && finalTarget === player.id) {
    return { ok: false, error: 'Revelar deve ser usado para expor a mão de outro jogador!' };
  }
  if (card.type === CARD_TYPES.MARCA_MORTE && finalTarget === player.id) {
    return { ok: false, error: 'Marca da Morte deve ser lançada em outro jogador!' };
  }

  const cardCharges = card.type === CARD_TYPES.SERINGA ? card.charges || 0 : undefined;

  player.hand.splice(idx, 1);
  room.gameState.discardPile.push(normalizeCard(card));
  player.selectedAction = {
    cardId: card.id,
    cardType: card.type,
    cardCharges,
    targetId: finalTarget,
    originalTargetId: finalTarget,
    status: 'PENDING',
  };
  player.lockedIn = true;
  return { ok: true };
}

function passAction(player) {
  player.selectedAction = {
    cardType: 'NONE',
    targetId: null,
    originalTargetId: null,
    status: 'PENDING',
  };
  player.lockedIn = true;
}

/**
 * Rompe todos os vínculos de Pacto de Sangue de um jogador.
 */
function breakBloodPactsForPlayer(room, player) {
  const partners = [...(player.bloodPactWith || [])];
  player.bloodPactWith = [];
  for (const pid of partners) {
    const partner = getPlayer(room, pid);
    if (partner && partner.bloodPactWith) {
      partner.bloodPactWith = partner.bloodPactWith.filter((id) => id !== player.id);
    }
  }
  return partners;
}

/**
 * Aplica ou reduz a contagem da Marca da Morte em um jogador.
 */
function inflictDeathMark(room, target, turns) {
  const safeTurns = Math.max(1, Math.min(BASE_DEATH_MARK_TURNS, Math.round(turns)));
  if (target.deathMarkTurns != null && target.deathMarkTurns > 0) {
    target.deathMarkTurns = Math.min(target.deathMarkTurns, safeTurns);
  } else {
    target.deathMarkTurns = safeTurns;
  }
  target.deathMarkAppliedRound = room.gameState.round;
}

/**
 * Aplica dano a um jogador, purga sua Marca da Morte (pois sangrou)
 * e propaga o dano para todos os vinculados por Pacto de Sangue.
 */
function applyDamage(room, target, amount, visited = new Set(), visualFx = 'DAMAGE') {
  if (!target || !target.isAlive || amount <= 0 || visited.has(target.id)) return;
  visited.add(target.id);

  target.lives = Math.max(0, target.lives - amount);
  target.visualEffect = visualFx;
  target.tookDamageThisRound = true;

  // Se estava sob efeito da Marca da Morte e ainda sobreviveu ao golpe, o sangue derramado sacia a Marca!
  if (target.deathMarkTurns != null && target.deathMarkTurns > 0 && target.lives > 0) {
    target.deathMarkTurns = null;
    target.deathMarkAppliedRound = null;
    addLog(
      room,
      'CURSE',
      `💀✨ [MARCA SACIADA] ${target.name} sangrou na mesa e se livrou da Marca da Morte!`
    );
  }

  const pactPartners = target.bloodPactWith || [];
  for (const partnerId of pactPartners) {
    const partner = getPlayer(room, partnerId);
    if (partner && partner.isAlive && !visited.has(partner.id)) {
      addLog(
        room,
        'PACT',
        `🩸 [PACTO DE SANGUE] O sangue derramado de ${target.name} reverberou no vínculo e feriu ${partner.name} (-${amount} Vida)!`
      );
      applyDamage(room, partner, amount, visited, 'DAMAGE');
    }
  }
}

/**
 * Processa a contagem regressiva da Marca da Morte ao final da rodada.
 * Quem passar 5 rodadas (ou os turnos restantes após Overdose) sem tomar dano morre instantaneamente.
 */
function processDeathMarksEndOfRound(room) {
  for (const p of alivePlayers(room)) {
    if (p.deathMarkTurns == null || p.deathMarkTurns <= 0) continue;
    // Se tomou dano nesta rodada, a marca já foi limpa em applyDamage
    if (p.tookDamageThisRound) {
      p.deathMarkTurns = null;
      p.deathMarkAppliedRound = null;
      continue;
    }
    // Só desconta turno a partir da rodada seguinte à aplicação da marca
    if (p.deathMarkAppliedRound != null && p.deathMarkAppliedRound >= room.gameState.round) {
      continue;
    }

    p.deathMarkTurns -= 1;
    if (p.deathMarkTurns <= 0) {
      p.lives = 0;
      p.deathMarkTurns = null;
      p.deathMarkAppliedRound = null;
      p.visualEffect = 'DEATH_MARK_KILL';
      addLog(
        room,
        'DEATH',
        `☠️ [MARCA DA MORTE] A contagem chegou a ZERO! ${p.name} ficou sem tomar dano e MORREU INSTANTANEAMENTE!`
      );
    } else {
      addLog(
        room,
        'CURSE',
        `⏳ [MARCA DA MORTE] ${p.name} não sangrou nesta rodada! Restam ${p.deathMarkTurns} rodada(s) antes da morte instantânea!`
      );
    }
  }
}

function checkDeaths(room) {
  for (const p of room.players) {
    if (p.lives <= 0 && p.isAlive) {
      p.isAlive = false;
      p.isWalled = false;
      p.deathMarkTurns = null;
      p.deathMarkAppliedRound = null;
      breakBloodPactsForPlayer(room, p);
      addLog(room, 'DEATH', '💀 ' + p.name + ' FOI ELIMINADO DA MESA!');
    }
  }
}

/**
 * Carrega em +1 todas as Seringas que já estavam na mão do jogador ao iniciar um novo turno (máx 4 cargas).
 */
function chargeSyringesInHand(player) {
  for (const c of player.hand) {
    if (c.type === CARD_TYPES.SERINGA) {
      c.charges = Math.min(MAX_SYRINGE_CHARGES, (c.charges || 0) + 1);
    }
  }
}

async function runGame(io, room, token) {
  const aborted = () => token !== room.gameState.gameToken;

  while (!aborted()) {
    /* ---------------- DEALING ---------------- */
    room.gameState.phase = 'DEALING';
    room.gameState.round += 1;
    room.gameState.isPaused = false;
    room.gameState.skipAnalysisFlag = false;
    for (const p of room.players) {
      p.visualEffect = null;
      p.isReflecting = false;
      p.tookDamageThisRound = false;
      p.selectedAction = null;
      p.lockedIn = false;
    }
    const aliveCount = alivePlayers(room).length;
    const initialHandSize =
      room.gameState.settings.initialHandCards || DEFAULT_INITIAL_HAND_CARDS;
    const maxHandSize = room.gameState.settings.maxHandCards || DEFAULT_HAND_CARDS;

    for (const p of alivePlayers(room)) {
      if (room.gameState.round === 1) {
        while (p.hand.length < initialHandSize) {
          const card = drawCardForPlayer(room, p);
          if (!card) break;
          p.hand.push(card);
        }
      } else {
        // Antes de comprar a nova carta do turno, cada Seringa que passou o turno na mão enche +1 carga (máx 4)
        chargeSyringesInHand(p);

        if (p.hand.length < maxHandSize) {
          const card = drawCardForPlayer(room, p);
          if (card) p.hand.push(card);
        }
      }
      p.allowedTime = calculatePlayerTime(p, aliveCount, room.gameState.settings);
    }
    addLog(room, 'SYSTEM', '— ROUND ' + room.gameState.round + ' —');
    emitRoomState(io, room);
    await wait(1200);
    if (aborted()) return;

    /* ---------------- PLANNING ---------------- */
    room.gameState.phase = 'PLANNING';
    room.gameState.planningElapsed = 0;
    emitRoomState(io, room);
    const round = room.gameState.round;
    for (const bot of alivePlayers(room).filter((p) => p.isBot)) {
      scheduleBot(io, room, bot, token, round, applyAction, passAction);
    }

    await new Promise((resolve) => {
      const startedAt = Date.now();
      const interval = setInterval(() => {
        if (aborted()) {
          clearInterval(interval);
          return resolve();
        }
        const elapsedSec = (Date.now() - startedAt) / 1000;
        room.gameState.planningElapsed = elapsedSec;
        io.to(room.code).emit('timer_tick', { elapsedSec });

        let forced = false;
        for (const p of alivePlayers(room)) {
          if (elapsedSec >= p.allowedTime && !p.lockedIn) {
            p.lockedIn = true;
            p.selectedAction = {
              cardType: 'NONE',
              targetId: null,
              originalTargetId: null,
              status: 'PENDING',
            };
            forced = true;
          }
        }
        if (forced) emitRoomState(io, room);

        if (alivePlayers(room).every((p) => p.lockedIn)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      room.gameState.planningInterval = interval;
    });
    if (aborted()) return;

    const alive = () => alivePlayers(room);
    const actionOf = (p) => p.selectedAction || { cardType: 'NONE', targetId: null };

    /* ================================================================== */
    /* PRIORIDADE 1 — REAÇÃO: REVEAL_REVERSO (ESPELHO AMALDIÇOADO)        */
    /* ================================================================== */
    room.gameState.phase = 'REVEAL_REVERSO';
    for (const p of room.players) p.visualEffect = null;
    const revUsers = alive().filter((p) => actionOf(p).cardType === CARD_TYPES.REVERSO);

    const reversosByTarget = new Map();
    for (const revPlayer of revUsers) {
      const revAction = revPlayer.selectedAction;
      const targetId = revAction.targetId || revPlayer.id;
      const target = getPlayer(room, targetId);
      if (!target || !target.isAlive) {
        revAction.status = 'MISFIRE';
        continue;
      }
      if (!reversosByTarget.has(targetId)) {
        reversosByTarget.set(targetId, []);
      }
      reversosByTarget.get(targetId).push(revPlayer);
    }

    const reflectableExternalTypes = [
      CARD_TYPES.FACA,
      CARD_TYPES.PAREDE,
      CARD_TYPES.REVELAR,
      CARD_TYPES.DESARMAR,
      CARD_TYPES.MANIPULAMENTO_ALMA,
      CARD_TYPES.PACTO_SANGUE,
      CARD_TYPES.MARCA_MORTE,
      CARD_TYPES.SERINGA,
    ];

    for (const [targetId, reversores] of reversosByTarget.entries()) {
      const target = getPlayer(room, targetId);
      if (!target || !target.isAlive) continue;

      const reversorNames = reversores.map((r) => r.name).join(' e ');

      // (1) Ações EXTERNAS de outros jogadores contra o Alvo
      const externalActions = alive().filter((p) => {
        if (p.id === target.id) return false;
        const a = actionOf(p);
        return reflectableExternalTypes.includes(a.cardType) && a.targetId === target.id;
      });

      // (2) Ação INTERNA do próprio Alvo (Auto-alvo: Faca/Parede em si mesmo)
      const targetAction = actionOf(target);
      const hasSelfAction =
        (targetAction.cardType === CARD_TYPES.FACA ||
          targetAction.cardType === CARD_TYPES.PAREDE) &&
        targetAction.targetId === target.id;

      let targetHadInteraction = false;

      for (const attacker of externalActions) {
        const a = attacker.selectedAction;
        a.targetId = attacker.id;
        a.status = 'REFLECTED';
        targetHadInteraction = true;

        if (a.cardType === CARD_TYPES.PAREDE) {
          addLog(
            room,
            'REFLECT',
            `🪞 [PAREDE REFLETIDA] ${target.name} estava protegido pelo Espelho Amaldiçoado (${reversorNames})! A Parede de ${attacker.name} voltou contra ${attacker.name}!`
          );
        } else if (a.cardType === CARD_TYPES.PACTO_SANGUE) {
          addLog(
            room,
            'REFLECT',
            `🪞 [PACTO REFLETIDO] ${target.name} ergueu o Espelho Amaldiçoado (${reversorNames})! O Pacto de Sangue de ${attacker.name} estilhaçou contra ele mesmo!`
          );
        } else if (a.cardType === CARD_TYPES.FACA) {
          addLog(
            room,
            'REFLECT',
            `🪞 [ESPELHO AMALDIÇOADO] ${target.name} estava sob o Espelho Amaldiçoado (${reversorNames})! A Faca de ${attacker.name} foi refletida de volta para ${attacker.name}!`
          );
        } else {
          addLog(
            room,
            'REFLECT',
            `🪞 [ESPELHO AMALDIÇOADO] ${target.name} refletiu ${CARD_NAMES[a.cardType] || a.cardType} de ${attacker.name} de volta para ${attacker.name}!`
          );
        }
      }

      if (hasSelfAction) {
        targetHadInteraction = true;
        const externalReversores = reversores.filter((r) => r.id !== target.id);

        if (externalReversores.length > 0) {
          targetAction.targetId = externalReversores[0].id;
          if (externalReversores.length > 1) {
            targetAction.additionalTargets = externalReversores.slice(1).map((r) => r.id);
          }
          targetAction.status = 'REFLECTED';

          const extNames = externalReversores.map((r) => r.name).join(' e ');
          if (targetAction.cardType === CARD_TYPES.PAREDE) {
            addLog(
              room,
              'STEAL',
              `🛡️ [ROUBO DE PAREDE] ${target.name} tentou erguer uma Parede em si mesmo, mas o Espelho Amaldiçoado de ${extNames} roubou a Parede para ${extNames}!`
            );
          } else {
            addLog(
              room,
              'REFLECT',
              `🪞 [AUTO-GOLPE INVERTIDO] ${target.name} tentou se esfaquear, mas o Espelho Amaldiçoado de ${extNames} inverteu o golpe contra ${extNames}!`
            );
          }
        }
      }

      if (targetHadInteraction) {
        target.isReflecting = true;
        target.visualEffect = 'REFLECT';
        for (const revPlayer of reversores) {
          revPlayer.isReflecting = true;
          revPlayer.visualEffect = 'REFLECT';
          revPlayer.selectedAction.status = 'RESOLVED';
        }
      }
    }

    // Regra de Vácuo do Espelho Amaldiçoado
    for (const revPlayer of revUsers) {
      const revAction = revPlayer.selectedAction;
      if (revAction.status !== 'RESOLVED') {
        revAction.status = 'MISFIRE';
        const targetId = revAction.targetId || revPlayer.id;
        const target = getPlayer(room, targetId);
        if (!target || target.id === revPlayer.id) {
          addLog(
            room,
            'VACUUM',
            `[VÁCUO] ${revPlayer.name} ergueu o Espelho Amaldiçoado em si mesmo no vazio e perdeu 1 Vida!`
          );
        } else {
          addLog(
            room,
            'VACUUM',
            `[VÁCUO] ${revPlayer.name} apontou o Espelho Amaldiçoado para ${target.name}, mas nada atingiu o alvo (-1 Vida)!`
          );
        }
        applyDamage(room, revPlayer, 1, new Set(), 'VACUUM');
      }
    }
    checkDeaths(room);
    emitRoomState(io, room);
    await wait(2400);
    if (aborted()) return;

    /* ================================================================== */
    /* PRIORIDADE 2 — DEFENSIVO: REVEAL_PAREDE                            */
    /* ================================================================== */
    room.gameState.phase = 'REVEAL_PAREDE';
    for (const p of room.players) p.visualEffect = null;
    for (const player of alive().filter((p) => actionOf(p).cardType === CARD_TYPES.PAREDE)) {
      const action = player.selectedAction;
      const targetIds = [action.targetId, ...(action.additionalTargets || [])].filter(Boolean);
      for (const tid of targetIds) {
        const target = getPlayer(room, tid);
        if (!target || !target.isAlive) continue;
        target.isWalled = true;
        target.visualEffect = 'WALLED';
        if (action.status === 'REFLECTED') {
          if (tid === player.id) {
            addLog(room, 'WALL', '[PAREDE REFLETIDA] ' + target.name + ' ficou preso na própria Parede!');
          } else {
            addLog(
              room,
              'WALL',
              '🛡️ [PAREDE ROUBADA] ' + target.name + ' recebeu a Parede roubada de ' + player.name + '!'
            );
          }
        } else {
          addLog(room, 'WALL', '[PAREDE] ' + player.name + ' isolou ' + target.name + ' na Parede!');
        }
      }
    }
    emitRoomState(io, room);
    await wait(2100);
    if (aborted()) return;

    /* ================================================================== */
    /* PRIORIDADE 3 — SUPORTE: SERINGA, MANIPULAMENTO DE ALMA, REVELAR    */
    /* ================================================================== */
    const supportUsers = alive().filter((p) => SUPPORT_CARD_TYPES.includes(actionOf(p).cardType));
    if (supportUsers.length > 0) {
      room.gameState.phase = 'REVEAL_SUPORTE';
      for (const p of room.players) p.visualEffect = null;

      // 3.1 SERINGA (Cura exata até maxLives; qualquer excesso de carga gera Overdose com Marca da Morte!)
      for (const player of supportUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.SERINGA)) {
        const action = player.selectedAction;
        const charges = action.cardCharges || 0;
        const target = getPlayer(room, action.targetId);
        if (!target || !target.isAlive) continue;

        if (charges <= 0) {
          target.visualEffect = 'SYRINGE_EMPTY';
          addLog(
            room,
            'HEAL',
            `💉 [SERINGA VAZIA] ${player.name} injetou uma Seringa vazia (0 cargas) em ${target.name} — nada aconteceu!`
          );
        } else {
          const missingHp = Math.max(0, target.maxLives - target.lives);
          const excess = charges - missingHp;

          if (excess <= 0) {
            // Cura limpa sem ultrapassar a vida máxima
            const prevHp = target.lives;
            target.lives = Math.min(target.maxLives, target.lives + charges);
            target.visualEffect = 'HEAL';
            addLog(
              room,
              'HEAL',
              `💉 [SERINGA] ${player.name} aplicou Seringa (${charges} carga(s)) em ${target.name}: vida restaurada (${prevHp}➔${target.lives}/${target.maxLives} HP)!`
            );
          } else {
            // OVERDOSE! Cura tudo, mas aplica Marca da Morte menos cada carga além da vida máxima
            const prevHp = target.lives;
            target.lives = target.maxLives;
            const remainingTurns = Math.max(1, BASE_DEATH_MARK_TURNS - excess);
            inflictDeathMark(room, target, remainingTurns);
            target.visualEffect = 'OVERDOSE';
            addLog(
              room,
              'CURSE',
              `💉☠️ [OVERDOSE!] Seringa (${charges} cargas) curou ${target.name} (${prevHp}➔${target.lives}/${target.maxLives} HP), mas ${excess} carga(s) excederam a vida máxima! ${target.name} contraiu MARCA DA MORTE com apenas ${target.deathMarkTurns} turno(s) restante(s)!`
            );
          }
        }
      }

      // 3.2 MANIPULAMENTO DE ALMA (Troca barra de vida com outro; em si mesmo aumenta dano da própria Faca)
      for (const player of supportUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.MANIPULAMENTO_ALMA)) {
        const action = player.selectedAction;
        if (action.originalTargetId === player.id) {
          player.knifeDamage = (player.knifeDamage || 1) + 1;
          player.visualEffect = 'SOUL_BUFF';
          addLog(
            room,
            'SOUL',
            `👻 [MANIPULAMENTO DE ALMA] ${player.name} fortaleceu a própria alma! Sua Faca agora causa ${player.knifeDamage} de Dano!`
          );
        } else if (action.status === 'REFLECTED') {
          player.visualEffect = 'REFLECT';
          addLog(
            room,
            'SOUL',
            `🪞 [ALMA REFLETIDA] O Manipulamento de Alma de ${player.name} foi refletido pelo Espelho Amaldiçoado de volta para si mesmo!`
          );
        } else {
          const target = getPlayer(room, action.targetId);
          if (target && target.isAlive) {
            const myPrev = player.lives;
            const targetPrev = target.lives;
            player.lives = targetPrev;
            target.lives = myPrev;
            if (player.lives > player.maxLives) player.maxLives = player.lives;
            if (target.lives > target.maxLives) target.maxLives = target.lives;
            player.visualEffect = 'SOUL_SWAP';
            target.visualEffect = 'SOUL_SWAP';
            addLog(
              room,
              'SOUL',
              `👻 [MANIPULAMENTO DE ALMA] ${player.name} (${myPrev}➔${player.lives} HP) trocou de barra de vida com ${target.name} (${targetPrev}➔${target.lives} HP)!`
            );
          }
        }
      }

      // 3.3 REVELAR (Revela as cartas da pessoa selecionada para toda a mesa)
      for (const player of supportUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.REVELAR)) {
        const action = player.selectedAction;
        const target = getPlayer(room, action.targetId);
        if (!target || !target.isAlive) continue;

        target.handRevealedUntilRound = room.gameState.round + 1;
        target.visualEffect = 'REVEALED';
        const cardsText =
          target.hand.length > 0
            ? target.hand.map((c) => CARD_NAMES[c.type] || c.type).join(', ')
            : 'Mão Vazia';
        addLog(
          room,
          'REVEAL',
          `👁️ [REVELAR] ${player.name} expôs as cartas de ${target.name} para toda a mesa: [${cardsText}]!`
        );
      }

      checkDeaths(room);
      emitRoomState(io, room);
      await wait(2400);
      if (aborted()) return;
    }

    /* ================================================================== */
    /* PRIORIDADE 4 — CONTROLE/MALDIÇÃO: PACTO, MARCA DA MORTE, DESARMAR  */
    /* ================================================================== */
    const controlUsers = alive().filter((p) => CONTROL_CARD_TYPES.includes(actionOf(p).cardType));
    if (controlUsers.length > 0) {
      room.gameState.phase = 'REVEAL_ESPECIAIS';
      for (const p of room.players) p.visualEffect = null;

      // 4.1 PACTO DE SANGUE:
      // - Se usado em SI MESMO: quebra o pacto se já estiver em um; se não estiver em nenhum, toma 1 de dano!
      // - Se usado em OUTRO e refletido: toma 1 de dano!
      // - Se usado em OUTRO normalmente: ignora parede e vincula a barra de vida!
      for (const player of controlUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.PACTO_SANGUE)) {
        const action = player.selectedAction;
        if (action.originalTargetId === player.id) {
          // Usado em si mesmo!
          if ((player.bloodPactWith || []).length > 0) {
            const brokenIds = breakBloodPactsForPlayer(room, player);
            const brokenNames = brokenIds
              .map((id) => getPlayer(room, id)?.name)
              .filter(Boolean)
              .join(', ');
            player.visualEffect = 'PACT_BROKEN';
            addLog(
              room,
              'PACT',
              `⛓️‍💥 [PACTO QUEBRADO] ${player.name} usou Pacto de Sangue em si mesmo e rompeu o vínculo com ${brokenNames || 'a mesa'}!`
            );
          } else {
            addLog(
              room,
              'DAMAGE',
              `🩸 [PACTO VAZIO] ${player.name} usou Pacto de Sangue em si mesmo sem estar em nenhum pacto e sofreu -1 Vida!`
            );
            applyDamage(room, player, 1, new Set(), 'DAMAGE');
          }
        } else if (action.status === 'REFLECTED') {
          addLog(
            room,
            'DAMAGE',
            `🩸 [PACTO REFLETIDO] O Pacto de Sangue de ${player.name} ricocheteou no Espelho Amaldiçoado e feriu ${player.name} (-1 Vida)!`
          );
          applyDamage(room, player, 1, new Set(), 'DAMAGE');
        } else {
          const target = getPlayer(room, action.targetId);
          if (target && target.isAlive && target.id !== player.id) {
            if (!player.bloodPactWith.includes(target.id)) player.bloodPactWith.push(target.id);
            if (!target.bloodPactWith.includes(player.id)) target.bloodPactWith.push(player.id);
            player.visualEffect = 'BLOOD_PACT';
            target.visualEffect = 'BLOOD_PACT';
            addLog(
              room,
              'PACT',
              `🩸 [PACTO DE SANGUE] ${player.name} ignorou barreiras e vinculou sua barra de vida com ${target.name}!`
            );
          }
        }
      }

      // 4.2 MARCA DA MORTE (Marca o alvo: se ficar 5 rodadas sem tomar dano, morre instantaneamente)
      for (const player of controlUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.MARCA_MORTE)) {
        const action = player.selectedAction;
        const target = getPlayer(room, action.targetId);
        if (!target || !target.isAlive) continue;

        inflictDeathMark(room, target, BASE_DEATH_MARK_TURNS);
        target.visualEffect = 'DEATH_MARKED';
        if (action.status === 'REFLECTED') {
          addLog(
            room,
            'CURSE',
            `☠️ [MARCA REFLETIDA] A Marca da Morte de ${player.name} refletiu no Espelho Amaldiçoado e marcou o próprio ${player.name} (${target.deathMarkTurns} rodadas)!`
          );
        } else {
          addLog(
            room,
            'CURSE',
            `☠️ [MARCA DA MORTE] ${player.name} amaldiçoou ${target.name}! Se ficar ${target.deathMarkTurns} rodadas sem tomar dano, morrerá instantaneamente!`
          );
        }
      }

      // 4.3 DESARMAR (Descarta 2 cartas aleatórias da mão do alvo)
      for (const player of controlUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.DESARMAR)) {
        const action = player.selectedAction;
        const target = getPlayer(room, action.targetId);
        if (!target || !target.isAlive) continue;

        const discarded = [];
        for (let i = 0; i < 2 && target.hand.length > 0; i++) {
          const randIdx = Math.floor(Math.random() * target.hand.length);
          const [removed] = target.hand.splice(randIdx, 1);
          if (removed) {
            discarded.push({ ...removed });
            room.gameState.discardPile.push(normalizeCard(removed));
          }
        }
        target.visualEffect = 'DISARMED';
        if (discarded.length > 0) {
          const names = discarded.map((c) => CARD_NAMES[c.type] || c.type).join(', ');
          if (action.status === 'REFLECTED') {
            addLog(
              room,
              'DISARM',
              `🧤 [DESARMAR REFLETIDO] ${player.name} teve o Desarmar refletido e descartou ${discarded.length} carta(s): [${names}]!`
            );
          } else {
            addLog(
              room,
              'DISARM',
              `🧤 [DESARMAR] ${player.name} arrancou ${discarded.length} carta(s) aleatória(s) da mão de ${target.name}: [${names}]!`
            );
          }
        } else {
          addLog(
            room,
            'DISARM',
            `🧤 [DESARMAR] ${player.name} tentou desarmar ${target.name}, mas sua mão já estava vazia!`
          );
        }
      }

      checkDeaths(room);
      emitRoomState(io, room);
      await wait(2500);
      if (aborted()) return;
    }

    /* ================================================================== */
    /* PRIORIDADE 5 — OFENSIVO: REVEAL_FACA + CONTAGEM DA MARCA DA MORTE  */
    /* ================================================================== */
    room.gameState.phase = 'REVEAL_FACA';
    for (const p of room.players) p.visualEffect = null;
    const knives = alive().filter((p) => actionOf(p).cardType === CARD_TYPES.FACA);

    // 5A: Auto-alvo intencional (não refletido)
    for (const player of knives) {
      const action = player.selectedAction;
      const dmg = player.knifeDamage || 1;
      if (action.originalTargetId === player.id && action.status !== 'REFLECTED') {
        if (player.isWalled) {
          player.isWalled = false;
          player.visualEffect = 'WALL_BROKEN';
          action.processed = true;
          addLog(
            room,
            'BREAK',
            '[QUEBRA INTERNA] ' + player.name + ' usou a própria Faca e destruiu sua Parede!'
          );
        } else {
          action.processed = true;
          addLog(
            room,
            'DAMAGE',
            `[AUTO-DANO] ${player.name} se cortou com a própria Faca (-${dmg} Vida)!`
          );
          applyDamage(room, player, dmg, new Set(), 'DAMAGE');
        }
      }
    }

    // 5B: Facas externas e refletidas/invertidas
    for (const player of knives) {
      const action = player.selectedAction;
      if (action.processed) continue;
      const dmg = player.knifeDamage || 1;
      const targetIds = [action.targetId, ...(action.additionalTargets || [])].filter(Boolean);
      for (const tid of targetIds) {
        const target = getPlayer(room, tid);
        if (!target || !target.isAlive) continue;
        if (target.isWalled) {
          target.isWalled = false;
          target.visualEffect = 'WALL_BROKEN';
          if (dmg > 1) {
            const pierce = dmg - 1;
            addLog(
              room,
              'BREAK',
              `💥 [ESTILHAÇO PERFURANTE] A Faca fortalecida de ${player.name} (${dmg} Dano) destruiu a Parede de ${target.name} e perfurou com -${pierce} Vida!`
            );
            applyDamage(room, target, pierce, new Set(), 'DAMAGE');
          } else {
            addLog(
              room,
              'BREAK',
              '[ESTILHAÇO] A Faca de ' + player.name + ' destruiu a Parede de ' + target.name + ' (0 Dano)!'
            );
          }
        } else {
          if (action.status === 'REFLECTED') {
            if (action.originalTargetId === player.id) {
              addLog(
                room,
                'DAMAGE',
                `🩸 [GOLPE REVERTIDO] O golpe de ${player.name} foi invertido e atingiu ${target.name} (-${dmg} Vida)!`
              );
            } else if (tid === player.id) {
              addLog(
                room,
                'DAMAGE',
                `🩸 [FACA REFLETIDA] ${player.name} foi atingido pela própria Faca refletida (-${dmg} Vida)!`
              );
            } else {
              addLog(
                room,
                'DAMAGE',
                `🩸 [SANGUE] Faca refletida de ${player.name} atingiu ${target.name} (-${dmg} Vida)!`
              );
            }
          } else {
            addLog(
              room,
              'DAMAGE',
              `🩸 [SANGUE] Faca de ${player.name} atingiu ${target.name} em cheio (-${dmg} Vida)!`
            );
          }
          applyDamage(room, target, dmg, new Set(), 'DAMAGE');
        }
      }
      action.processed = true;
    }

    // 5C: Processa a contagem da Marca da Morte ao fim dos ataques da rodada
    processDeathMarksEndOfRound(room);

    checkDeaths(room);
    emitRoomState(io, room);
    await wait(3000);
    if (aborted()) return;

    /* ---------------- ANALYSIS / VITÓRIA ---------------- */
    const survivors = alivePlayers(room);
    if (survivors.length <= 1) {
      room.gameState.phase = 'GAME_OVER';
      room.status = 'FINISHED';
      room.gameState.winner = survivors[0]
        ? { id: survivors[0].id, name: survivors[0].name }
        : null;
      addLog(
        room,
        'SYSTEM',
        room.gameState.winner
          ? '🏆 ' + room.gameState.winner.name + ' VENCEU A PARTIDA!'
          : 'Ninguém sobreviveu. EMPATE NO VAZIO.'
      );
      emitRoomState(io, room);
      return;
    }

    room.gameState.phase = 'ANALYSIS';
    emitRoomState(io, room);
    let remainingMs = room.gameState.settings.analysisDuration * 1000;
    room.gameState.skipAnalysisFlag = false;
    while (remainingMs > 0 && !room.gameState.skipAnalysisFlag && !aborted()) {
      await wait(100);
      if (!room.gameState.isPaused) remainingMs -= 100;
      io.to(room.code).emit('analysis_tick', {
        remainingSec: Math.max(0, remainingMs / 1000),
        paused: room.gameState.isPaused,
      });
    }
    if (aborted()) return;
    room.gameState.isPaused = false;
  }
}

function startGame(io, room) {
  room.gameState.gameToken++;
  room.status = 'IN_GAME';
  room.gameState.phase = 'DEALING';
  room.gameState.deck = buildDeck();
  room.gameState.discardPile = [];
  room.gameState.logs = [];
  room.gameState.winner = null;
  room.gameState.round = 0;
  room.players.forEach((p) => {
    resetPlayerForMatch(p, room.gameState.settings.maxHp);
  });
  addLog(room, 'SYSTEM', 'A mesa foi selada. Que comece o ritual.');
  io.to(room.code).emit('game_started', { roomCode: room.code });
  emitRoomState(io, room);
  io.emit('public_rooms_updated', getPublicRoomsList());
  runGame(io, room, room.gameState.gameToken).catch((err) =>
    console.error(`[Sala ${room.code}] Erro no loop de jogo:`, err)
  );
}

module.exports = {
  applyAction,
  passAction,
  breakBloodPactsForPlayer,
  inflictDeathMark,
  applyDamage,
  processDeathMarksEndOfRound,
  chargeSyringesInHand,
  checkDeaths,
  runGame,
  startGame,
};

const { CARD_TYPES, CARD_NAMES, SPECIAL_CARD_TYPES } = require('../models/CardModel');
const { resetPlayerForMatch } = require('../models/PlayerModel');
const { buildDeck, drawCardForPlayer } = require('./deckService');
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

  // Validações específicas das novas cartas
  if (card.type === CARD_TYPES.DESARMAR && finalTarget === player.id) {
    return { ok: false, error: 'Desarmar só pode ser usado contra outro jogador!' };
  }
  if (card.type === CARD_TYPES.PACTO_SANGUE && finalTarget === player.id) {
    return { ok: false, error: 'Pacto de Sangue deve vincular sua vida com outro jogador!' };
  }
  if (card.type === CARD_TYPES.REVELAR && finalTarget === player.id) {
    return { ok: false, error: 'Revelar deve ser usado para expor a mão de outro jogador!' };
  }

  player.hand.splice(idx, 1);
  room.gameState.discardPile.push(card);
  player.selectedAction = {
    cardId: card.id,
    cardType: card.type,
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
 * Aplica dano a um jogador e propaga o dano para todos os vinculados por Pacto de Sangue.
 */
function applyDamage(room, target, amount, visited = new Set(), visualFx = 'DAMAGE') {
  if (!target || !target.isAlive || amount <= 0 || visited.has(target.id)) return;
  visited.add(target.id);

  target.lives = Math.max(0, target.lives - amount);
  target.visualEffect = visualFx;

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

function checkDeaths(room) {
  for (const p of room.players) {
    if (p.lives <= 0 && p.isAlive) {
      p.isAlive = false;
      p.isWalled = false;
      p.bloodPactWith = [];
      for (const other of room.players) {
        if (other.bloodPactWith) {
          other.bloodPactWith = other.bloodPactWith.filter((id) => id !== p.id);
        }
      }
      addLog(room, 'DEATH', '💀 ' + p.name + ' FOI ELIMINADO DA MESA!');
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

    /* ---------------- 1. REVEAL_REVERSO (ESPELHO AMALDIÇOADO) ---------------- */
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

    /* ---------------- 2. REVEAL_PAREDE ---------------- */
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
    await wait(2200);
    if (aborted()) return;

    /* ---------------- 3. REVEAL_ESPECIAIS (REVELAR, DESARMAR, MANIP. ALMA, PACTO SANGUE) ---------------- */
    const specialUsers = alive().filter((p) => SPECIAL_CARD_TYPES.includes(actionOf(p).cardType));
    if (specialUsers.length > 0) {
      room.gameState.phase = 'REVEAL_ESPECIAIS';
      for (const p of room.players) p.visualEffect = null;

      // 3.1 PACTO DE SANGUE (Ignora parede, vincula vida; se refletido toma dano)
      for (const player of specialUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.PACTO_SANGUE)) {
        const action = player.selectedAction;
        if (action.status === 'REFLECTED') {
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

      // 3.2 MANIPULAMENTO DE ALMA (Troca barra de vida com outro; se em si mesmo aumenta dano da própria faca)
      for (const player of specialUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.MANIPULAMENTO_ALMA)) {
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

      // 3.3 DESARMAR (Descarta 2 cartas aleatórias da mão do alvo)
      for (const player of specialUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.DESARMAR)) {
        const action = player.selectedAction;
        const target = getPlayer(room, action.targetId);
        if (!target || !target.isAlive) continue;

        const discarded = [];
        for (let i = 0; i < 2 && target.hand.length > 0; i++) {
          const randIdx = Math.floor(Math.random() * target.hand.length);
          const [removed] = target.hand.splice(randIdx, 1);
          if (removed) {
            room.gameState.discardPile.push(removed);
            discarded.push(removed);
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

      // 3.4 REVELAR (Revela as cartas da pessoa selecionada para toda a mesa)
      for (const player of specialUsers.filter((p) => actionOf(p).cardType === CARD_TYPES.REVELAR)) {
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
      await wait(2600);
      if (aborted()) return;
    }

    /* ---------------- 4. REVEAL_FACA ---------------- */
    room.gameState.phase = 'REVEAL_FACA';
    for (const p of room.players) p.visualEffect = null;
    const knives = alive().filter((p) => actionOf(p).cardType === CARD_TYPES.FACA);

    // 4A: Auto-alvo intencional (não refletido)
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

    // 4B: Facas externas e refletidas/invertidas
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
  applyDamage,
  checkDeaths,
  runGame,
  startGame,
};

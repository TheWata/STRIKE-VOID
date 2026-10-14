const express = require('express');
const http = require('http');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { Server } = require('socket.io');

// uuid v9 (CJS) works with require; newer majors are ESM-only -> fall back to crypto.
let uuid;
try {
  uuid = require('uuid').v4;
  if (typeof uuid !== 'function') throw new Error('no v4');
} catch (e) {
  uuid = () => crypto.randomUUID();
}

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors({ origin: '*' }));

// Servir o build do front-end se existir
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('/api/health', (_req, res) => res.json({ status: 'online', game: 'STRIKE/VOID v2' }));

// Redireciona qualquer outra rota para o SPA se os estáticos existirem (compatível com Express 5)
app.use((req, res, next) => {
  if (req.method === 'GET') {
    const indexPath = path.join(clientDist, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

/* ------------------------------------------------------------------ */
/* 1. GERENCIAMENTO DE MÚLTIPLAS SALAS EM MEMÓRIA                    */
/* ------------------------------------------------------------------ */
const rooms = new Map();

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem 0, O, 1, I
function generateRoomCode() {
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
    }
  } while (rooms.has(code));
  return code;
}

function getPublicRoomsList() {
  const list = [];
  for (const [, room] of rooms.entries()) {
    if (room.isPublic && room.status === 'LOBBY') {
      list.push({
        code: room.code,
        name: room.name,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
      });
    }
  }
  return list;
}

function createRoom({ code, name, hostId, isPublic }) {
  return {
    code,
    name: name || `Sala ${code}`,
    hostId,
    isPublic: Boolean(isPublic),
    maxPlayers: 8,
    minPlayers: 4,
    status: 'LOBBY', // 'LOBBY' | 'IN_GAME' | 'FINISHED'
    players: [],
    gameState: {
      phase: 'LOBBY',
      round: 0,
      isPaused: false,
      settings: {
        useFixedTime: false,
        baseTestTime: 10,
        secondsPerPlayer: 2.0,
        damagePenalty: 0.33,
        analysisDuration: 8.0,
      },
      deck: [],
      discardPile: [],
      logs: [],
      winner: null,
      gameToken: 0,
      skipAnalysisFlag: false,
      planningElapsed: 0,
      logCounter: 0,
      planningInterval: null,
    },
  };
}

const BOT_NAMES = ['LESHY_BOT', 'DEALER_X', 'GRIMORA', 'MAGNIFICUS', 'PO3_UNIT', 'BONE_LORD', 'HOUND_7', 'TRAPPER_BOT'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getPlayer = (room, id) => room.players.find((p) => p.id === id);
const alivePlayers = (room) => room.players.filter((p) => p.isAlive);
const connectedHumans = (room) => room.players.filter((p) => !p.isBot && io.sockets.sockets.has(p.id));

/* ------------------------------------------------------------------ */
/* 2. JOGADOR                                                         */
/* ------------------------------------------------------------------ */
function createPlayer(id, name, isBot) {
  return {
    id,
    name,
    isBot,
    lives: 3,
    maxLives: 3,
    isAlive: true,
    isWalled: false,
    isReflecting: false,
    hand: [],
    selectedAction: null,
    lockedIn: false,
    allowedTime: 20,
    visualEffect: null,
  };
}

/* ------------------------------------------------------------------ */
/* 3. BARALHO PROPORCIONAL (96 cartas)                                */
/* ------------------------------------------------------------------ */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck() {
  const deck = [];
  for (let i = 0; i < 32; i++) deck.push({ id: uuid(), type: 'FACA' });
  for (let i = 0; i < 32; i++) deck.push({ id: uuid(), type: 'PAREDE' });
  for (let i = 0; i < 32; i++) deck.push({ id: uuid(), type: 'REVERSO' });
  return shuffle(deck);
}

function drawCard(room) {
  if (room.gameState.deck.length === 0) {
    room.gameState.deck = room.gameState.discardPile;
    room.gameState.discardPile = [];
    shuffle(room.gameState.deck);
  }
  return room.gameState.deck.pop();
}

/* ------------------------------------------------------------------ */
/* 4. EQUAÇÃO DE TEMPO INDIVIDUAL                                     */
/* ------------------------------------------------------------------ */
function calculatePlayerTime(player, aliveCount, settings) {
  if (!player.isAlive) return 0;
  if (settings.useFixedTime === true) return settings.baseTestTime;
  const damageTaken = player.maxLives - player.lives;
  const factor = Math.pow(1 - settings.damagePenalty, damageTaken);
  const dynamicTime = aliveCount * settings.secondsPerPlayer * factor;
  return Number((settings.baseTestTime + dynamicTime).toFixed(1));
}

/* ------------------------------------------------------------------ */
/* 5. LOGS + SANITIZAÇÃO DE ESTADO                                    */
/* ------------------------------------------------------------------ */
function addLog(room, type, text) {
  room.gameState.logs.push({
    id: ++room.gameState.logCounter,
    round: room.gameState.round,
    type,
    text,
    timestamp: Date.now(),
  });
  if (room.gameState.logs.length > 300) room.gameState.logs.shift();
}

const REVEAL_ORDER = {
  PLANNING: [],
  REVEAL_REVERSO: ['REVERSO'],
  REVEAL_PAREDE: ['REVERSO', 'PAREDE'],
  REVEAL_FACA: ['REVERSO', 'PAREDE', 'FACA', 'NONE'],
  ANALYSIS: ['REVERSO', 'PAREDE', 'FACA', 'NONE'],
  GAME_OVER: ['REVERSO', 'PAREDE', 'FACA', 'NONE'],
};

function sanitizeStateForClients(room, viewerId) {
  const revealed = REVEAL_ORDER[room.gameState.phase] || [];
  return {
    you: viewerId,
    roomCode: room.code,
    roomName: room.name,
    hostId: room.hostId,
    isPublic: room.isPublic,
    roomStatus: room.status,
    minPlayers: room.minPlayers,
    maxPlayers: room.maxPlayers,
    phase: room.gameState.phase,
    round: room.gameState.round,
    isPaused: room.gameState.isPaused,
    settings: room.gameState.settings,
    logs: room.gameState.logs.slice(-120),
    winner: room.gameState.winner,
    deckCount: room.gameState.deck ? room.gameState.deck.length : 0,
    players: room.players.map((p) => {
      const isMe = p.id === viewerId;
      let action = null;
      if (p.selectedAction) {
        const a = p.selectedAction;
        if (isMe && room.gameState.phase === 'PLANNING') {
          action = { ...a };
        } else if (revealed.includes(a.cardType) || (a.status === 'REFLECTED' && room.gameState.phase !== 'PLANNING')) {
          action = { ...a };
        } else {
          action = { hidden: true, cardType: null, targetId: null, status: 'PENDING' };
        }
      }
      return {
        id: p.id,
        name: p.name,
        isBot: p.isBot,
        lives: p.lives,
        maxLives: p.maxLives,
        isAlive: p.isAlive,
        isWalled: p.isWalled,
        isReflecting: p.isReflecting,
        hand: isMe ? p.hand : [],
        handCount: p.hand ? p.hand.length : 0,
        selectedAction: action,
        lockedIn: p.lockedIn,
        allowedTime: p.allowedTime,
        visualEffect: p.visualEffect,
      };
    }),
  };
}

function emitRoomState(room) {
  for (const p of room.players) {
    if (!p.isBot) {
      const sanitized = sanitizeStateForClients(room, p.id);
      io.to(p.id).emit('game_state', sanitized);
      io.to(p.id).emit('room_updated', { roomState: sanitized });
    }
  }
}

function toast(socketId, message) {
  io.to(socketId).emit('error_message', message);
}

/* ------------------------------------------------------------------ */
/* 6. AÇÕES DO JOGO                                                   */
/* ------------------------------------------------------------------ */
function applyAction(room, player, cardId, targetId) {
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return { ok: false, error: 'Carta inválida.' };
  const card = player.hand[idx];
  const finalTarget = targetId || player.id;
  const target = getPlayer(room, finalTarget);
  if (!target || !target.isAlive) return { ok: false, error: 'Alvo inválido.' };
  if (player.isWalled && finalTarget !== player.id) {
    return {
      ok: false,
      error: 'Você está EMPAREDADO! Só pode usar cartas em si mesmo ou passar a vez.',
    };
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
  player.selectedAction = { cardType: 'NONE', targetId: null, originalTargetId: null, status: 'PENDING' };
  player.lockedIn = true;
}

function scheduleBot(room, bot, token, round) {
  const delay = 1500 + Math.random() * 2000;
  setTimeout(() => {
    if (token !== room.gameState.gameToken || room.gameState.phase !== 'PLANNING' || room.gameState.round !== round) return;
    if (!bot.isAlive || bot.lockedIn) return;
    if (bot.isWalled) {
      const knife = bot.hand.find((c) => c.type === 'FACA');
      if (knife) applyAction(room, bot, knife.id, bot.id);
      else passAction(bot);
    } else {
      const card = bot.hand[Math.floor(Math.random() * bot.hand.length)];
      if (!card) {
        passAction(bot);
      } else if (card.type === 'REVERSO') {
        const others = alivePlayers(room).filter((p) => p.id !== bot.id);
        if (others.length > 0 && Math.random() < 0.4) {
          applyAction(room, bot, card.id, others[Math.floor(Math.random() * others.length)].id);
        } else {
          applyAction(room, bot, card.id, bot.id);
        }
      } else {
        const others = alivePlayers(room).filter((p) => p.id !== bot.id);
        if (others.length === 0) passAction(bot);
        else applyAction(room, bot, card.id, others[Math.floor(Math.random() * others.length)].id);
      }
    }
    emitRoomState(room);
  }, delay);
}

/* ------------------------------------------------------------------ */
/* 7. MÁQUINA DE ESTADOS DO JOGO                                      */
/* ------------------------------------------------------------------ */
function checkDeaths(room) {
  for (const p of room.players) {
    if (p.lives <= 0 && p.isAlive) {
      p.isAlive = false;
      p.isWalled = false;
      addLog(room, 'DEATH', '💀 ' + p.name + ' FOI ELIMINADO DA MESA!');
    }
  }
}

async function runGame(room, token) {
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
    for (const p of alivePlayers(room)) {
      while (p.hand.length < 3) p.hand.push(drawCard(room));
      p.allowedTime = calculatePlayerTime(p, aliveCount, room.gameState.settings);
    }
    addLog(room, 'SYSTEM', '— ROUND ' + room.gameState.round + ' —');
    emitRoomState(room);
    await wait(1200);
    if (aborted()) return;

    /* ---------------- PLANNING ---------------- */
    room.gameState.phase = 'PLANNING';
    room.gameState.planningElapsed = 0;
    emitRoomState(room);
    const round = room.gameState.round;
    for (const bot of alivePlayers(room).filter((p) => p.isBot)) scheduleBot(room, bot, token, round);

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
            p.selectedAction = { cardType: 'NONE', targetId: null, originalTargetId: null, status: 'PENDING' };
            forced = true;
          }
        }
        if (forced) emitRoomState(room);

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

    /* ---------------- REVEAL_REVERSO ---------------- */
    room.gameState.phase = 'REVEAL_REVERSO';
    for (const p of room.players) p.visualEffect = null;
    const revUsers = alive().filter((p) => actionOf(p).cardType === 'REVERSO');

    for (const revPlayer of revUsers) {
      const revAction = revPlayer.selectedAction;
      const targetId = revAction.targetId;

      if (targetId === revPlayer.id) {
        // CASO 1: Usou em si mesmo (Escudo Reativo)
        const attackers = alive().filter((o) => {
          const a = actionOf(o);
          return o.id !== revPlayer.id && (a.cardType === 'FACA' || a.cardType === 'PAREDE') && a.targetId === revPlayer.id;
        });

        if (attackers.length === 0) {
          revPlayer.lives = Math.max(0, revPlayer.lives - 1);
          revPlayer.visualEffect = 'VACUUM';
          revAction.status = 'MISFIRE';
          addLog(room, 'VACUUM', '[VÁCUO] ' + revPlayer.name + ' usou Reverso em si mesmo no vazio e perdeu 1 Vida!');
        } else {
          revPlayer.isReflecting = true;
          revPlayer.visualEffect = 'REFLECT';
          revAction.status = 'RESOLVED';
          for (const attacker of attackers) {
            attacker.selectedAction.targetId = attacker.id;
            attacker.selectedAction.status = 'REFLECTED';
            if (attacker.selectedAction.cardType === 'PAREDE') {
              addLog(room, 'REFLECT', '[PAREDE REFLETIDA] ' + revPlayer.name + ' refletiu a Parede de volta para ' + attacker.name + '!');
            } else {
              addLog(room, 'REFLECT', '[REVERSO] ' + revPlayer.name + ' refletiu a Faca de ' + attacker.name + ' de volta para ' + attacker.name + '!');
            }
          }
        }
      } else {
        // CASO 2: Usou em OUTRA pessoa (Reverso Ofensivo / Intervenção)
        const target = getPlayer(room, targetId);
        const tAction = target ? target.selectedAction : null;

        if (!target || !target.isAlive || !tAction || tAction.cardType === 'NONE' || tAction.cardType === 'REVERSO') {
          revPlayer.lives = Math.max(0, revPlayer.lives - 1);
          revPlayer.visualEffect = 'VACUUM';
          revAction.status = 'MISFIRE';
          addLog(room, 'VACUUM', '[VÁCUO] ' + revPlayer.name + ' tentou reverter ' + (target ? target.name : 'o vazio') + ', mas não havia ação reversível (-1 Vida)!');
        } else if (tAction.cardType === 'PAREDE') {
          revPlayer.isReflecting = true;
          revPlayer.visualEffect = 'REFLECT';
          revAction.status = 'RESOLVED';

          if (tAction.targetId === target.id) {
            tAction.targetId = revPlayer.id;
            tAction.status = 'REFLECTED';
            addLog(room, 'STEAL', '🛡️ [ROUBO DE PAREDE] ' + revPlayer.name + ' reverteu a Parede de ' + target.name + ' e ROUBOU para si!');
          } else {
            tAction.targetId = target.id;
            tAction.status = 'REFLECTED';
            addLog(room, 'REFLECT', '[PAREDE REFLETIDA] ' + revPlayer.name + ' reverteu a Parede de ' + target.name + ' de volta para ' + target.name + '!');
          }
        } else if (tAction.cardType === 'FACA') {
          revPlayer.isReflecting = true;
          revPlayer.visualEffect = 'REFLECT';
          revAction.status = 'RESOLVED';

          if (tAction.targetId === target.id) {
            tAction.targetId = revPlayer.id;
            tAction.status = 'REFLECTED';
            addLog(room, 'REFLECT', '[REVERSO] ' + revPlayer.name + ' reverteu o golpe interno de ' + target.name + ' para si!');
          } else {
            tAction.targetId = target.id;
            tAction.status = 'REFLECTED';
            addLog(room, 'REFLECT', '[REVERSO] ' + revPlayer.name + ' reverteu a Faca de ' + target.name + ' de volta para ' + target.name + '!');
          }
        }
      }
    }
    emitRoomState(room);
    await wait(2500);
    if (aborted()) return;

    /* ---------------- REVEAL_PAREDE ---------------- */
    room.gameState.phase = 'REVEAL_PAREDE';
    for (const p of room.players) p.visualEffect = null;
    for (const player of alive().filter((p) => actionOf(p).cardType === 'PAREDE')) {
      const action = player.selectedAction;
      const target = getPlayer(room, action.targetId);
      if (!target) continue;
      target.isWalled = true;
      target.visualEffect = 'WALLED';
      if (action.status === 'REFLECTED') {
        if (action.targetId === player.id) {
          addLog(room, 'WALL', '[PAREDE REFLETIDA] ' + target.name + ' ficou preso na própria Parede!');
        } else {
          addLog(room, 'WALL', '🛡️ [PAREDE ROUBADA] ' + target.name + ' recebeu a Parede roubada de ' + player.name + '!');
        }
      } else {
        addLog(room, 'WALL', '[PAREDE] ' + player.name + ' isolou ' + target.name + ' na Parede!');
      }
    }
    emitRoomState(room);
    await wait(2500);
    if (aborted()) return;

    /* ---------------- REVEAL_FACA ---------------- */
    room.gameState.phase = 'REVEAL_FACA';
    for (const p of room.players) p.visualEffect = null;
    const knives = alive().filter((p) => actionOf(p).cardType === 'FACA');

    // 3A: Auto-alvo intencional (não refletido)
    for (const player of knives) {
      const action = player.selectedAction;
      if (action.originalTargetId === player.id && action.status !== 'REFLECTED') {
        if (player.isWalled) {
          player.isWalled = false;
          player.visualEffect = 'WALL_BROKEN';
          action.processed = true;
          addLog(room, 'BREAK', '[QUEBRA INTERNA] ' + player.name + ' usou a própria Faca e destruiu sua Parede!');
        } else {
          player.lives = Math.max(0, player.lives - 1);
          player.visualEffect = 'DAMAGE';
          action.processed = true;
          addLog(room, 'DAMAGE', '[AUTO-DANO] ' + player.name + ' se cortou com a própria Faca (-1 Vida)!');
        }
      }
    }

    // 3B: Facas externas e refletidas
    for (const player of knives) {
      const action = player.selectedAction;
      if (action.processed) continue;
      const target = getPlayer(room, action.targetId);
      if (!target) continue;
      if (target.isWalled) {
        target.isWalled = false;
        target.visualEffect = 'WALL_BROKEN';
        addLog(room, 'BREAK', '[ESTILHAÇO] A Faca de ' + player.name + ' destruiu a Parede de ' + target.name + ' (0 Dano)!');
      } else {
        target.lives = Math.max(0, target.lives - 1);
        target.visualEffect = 'DAMAGE';
        addLog(room, 'DAMAGE', '[SANGUE] Faca atingiu ' + target.name + ' em cheio (-1 Vida)!');
      }
      action.processed = true;
    }
    checkDeaths(room);
    emitRoomState(room);
    await wait(3000);
    if (aborted()) return;

    /* ---------------- ANALYSIS / VITÓRIA ---------------- */
    const survivors = alivePlayers(room);
    if (survivors.length <= 1) {
      room.gameState.phase = 'GAME_OVER';
      room.status = 'FINISHED';
      room.gameState.winner = survivors[0] ? { id: survivors[0].id, name: survivors[0].name } : null;
      addLog(room, 'SYSTEM', room.gameState.winner ? '🏆 ' + room.gameState.winner.name + ' VENCEU A PARTIDA!' : 'Ninguém sobreviveu. EMPATE NO VAZIO.');
      emitRoomState(room);
      return;
    }

    room.gameState.phase = 'ANALYSIS';
    emitRoomState(room);
    let remainingMs = room.gameState.settings.analysisDuration * 1000;
    room.gameState.skipAnalysisFlag = false;
    while (remainingMs > 0 && !room.gameState.skipAnalysisFlag && !aborted()) {
      await wait(100);
      if (!room.gameState.isPaused) remainingMs -= 100;
      io.to(room.code).emit('analysis_tick', { remainingSec: Math.max(0, remainingMs / 1000), paused: room.gameState.isPaused });
    }
    if (aborted()) return;
    room.gameState.isPaused = false;
  }
}

function resetToLobby(room) {
  room.gameState.gameToken++;
  if (room.gameState.planningInterval) {
    clearInterval(room.gameState.planningInterval);
    room.gameState.planningInterval = null;
  }
  room.status = 'LOBBY';
  room.gameState.phase = 'LOBBY';
  room.gameState.round = 0;
  room.gameState.isPaused = false;
  room.gameState.deck = [];
  room.gameState.discardPile = [];
  room.gameState.logs = [];
  room.gameState.winner = null;

  // Manter apenas jogadores conectados ou bots
  room.players = room.players.filter((p) => p.isBot || io.sockets.sockets.has(p.id));
  room.players.forEach((p) => {
    p.lives = 3;
    p.maxLives = 3;
    p.isAlive = true;
    p.isWalled = false;
    p.isReflecting = false;
    p.hand = [];
    p.selectedAction = null;
    p.lockedIn = false;
    p.visualEffect = null;
  });
  emitRoomState(room);
  io.emit('public_rooms_updated', getPublicRoomsList());
}

function startGame(room) {
  room.gameState.gameToken++;
  room.status = 'IN_GAME';
  room.gameState.phase = 'DEALING';
  room.gameState.deck = buildDeck();
  room.gameState.discardPile = [];
  room.gameState.logs = [];
  room.gameState.winner = null;
  room.gameState.round = 0;
  room.players.forEach((p) => {
    p.lives = 3;
    p.maxLives = 3;
    p.isAlive = true;
    p.isWalled = false;
    p.isReflecting = false;
    p.hand = [];
    p.selectedAction = null;
    p.lockedIn = false;
    p.visualEffect = null;
  });
  addLog(room, 'SYSTEM', 'A mesa foi selada. Que comece o ritual.');
  io.to(room.code).emit('game_started', { roomCode: room.code });
  emitRoomState(room);
  io.emit('public_rooms_updated', getPublicRoomsList());
  runGame(room, room.gameState.gameToken).catch((err) => console.error(`[Sala ${room.code}] Erro no loop de jogo:`, err));
}

function cleanUpRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.gameState.gameToken++;
  if (room.gameState.planningInterval) {
    clearInterval(room.gameState.planningInterval);
    room.gameState.planningInterval = null;
  }
  rooms.delete(roomCode);
  io.emit('public_rooms_updated', getPublicRoomsList());
}

function handlePlayerLeave(socket) {
  const roomCode = socket.data?.roomCode;
  if (!roomCode) return;
  const room = rooms.get(roomCode);
  if (!room) {
    socket.data.roomCode = null;
    return;
  }

  socket.leave(roomCode);
  socket.data.roomCode = null;

  const player = getPlayer(room, socket.id);
  if (!player) return;

  if (room.status === 'LOBBY') {
    room.players = room.players.filter((p) => p.id !== socket.id);
  } else {
    player.isAlive = false;
    player.lives = 0;
    player.isWalled = false;
    if (!player.lockedIn) {
      player.lockedIn = true;
      player.selectedAction = { cardType: 'NONE', targetId: null, originalTargetId: null, status: 'PENDING' };
    }
    addLog(room, 'DEATH', '💀 ' + player.name + ' abandonou a mesa.');
  }

  const humans = connectedHumans(room);
  if (humans.length === 0) {
    cleanUpRoom(roomCode);
    return;
  }

  // Se o host saiu, migra a liderança para o próximo humano
  if (room.hostId === socket.id) {
    const nextHost = humans[0];
    if (nextHost) {
      room.hostId = nextHost.id;
      io.to(room.code).emit('host_migrated', { newHostId: room.hostId });
    }
  }

  emitRoomState(room);
  io.emit('public_rooms_updated', getPublicRoomsList());
}

/* ------------------------------------------------------------------ */
/* 8. EVENTOS SOCKET.IO                                               */
/* ------------------------------------------------------------------ */
io.on('connection', (socket) => {
  // Envia lista pública atualizada ao conectar
  socket.emit('public_rooms_updated', getPublicRoomsList());

  socket.on('get_public_rooms', () => {
    socket.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('create_room', ({ playerName, roomName, isPublic } = {}) => {
    // Se o socket já estava em uma sala, sai dela primeiro
    if (socket.data?.roomCode) {
      handlePlayerLeave(socket);
    }

    const cleanPlayer = String(playerName || '').trim().slice(0, 16) || 'JOGADOR_1';
    const cleanRoom = String(roomName || '').trim().slice(0, 24) || `SALA DE ${cleanPlayer.toUpperCase()}`;
    const code = generateRoomCode();

    const room = createRoom({
      code,
      name: cleanRoom,
      hostId: socket.id,
      isPublic: isPublic !== false, // Padrão pública se não especificado
    });

    const hostPlayer = createPlayer(socket.id, cleanPlayer, false);
    room.players.push(hostPlayer);
    rooms.set(code, room);

    socket.join(code);
    socket.data = socket.data || {};
    socket.data.roomCode = code;

    const sanitized = sanitizeStateForClients(room, socket.id);
    socket.emit('room_joined', { roomState: sanitized });
    emitRoomState(room);

    if (room.isPublic) {
      io.emit('public_rooms_updated', getPublicRoomsList());
    }
  });

  socket.on('join_room', ({ playerName, roomCode } = {}) => {
    if (!roomCode) {
      return socket.emit('room_error', { message: 'Código de sala é obrigatório.' });
    }

    const normalizedCode = String(roomCode).toUpperCase().trim();
    const room = rooms.get(normalizedCode);

    if (!room) {
      return socket.emit('room_error', { message: 'Sala não encontrada. Verifique o código.' });
    }

    if (room.status !== 'LOBBY') {
      return socket.emit('room_error', { message: 'A partida nesta sala já está em andamento.' });
    }

    if (room.players.length >= room.maxPlayers) {
      return socket.emit('room_error', { message: 'Esta sala já atingiu a capacidade máxima (8 jogadores).' });
    }

    if (socket.data?.roomCode && socket.data.roomCode !== normalizedCode) {
      handlePlayerLeave(socket);
    }

    const cleanPlayer = String(playerName || '').trim().slice(0, 16) || `JOGADOR_${room.players.length + 1}`;

    // Evita duplicar se já estiver na lista
    let player = getPlayer(room, socket.id);
    if (!player) {
      player = createPlayer(socket.id, cleanPlayer, false);
      room.players.push(player);
    } else {
      player.name = cleanPlayer;
    }

    socket.join(normalizedCode);
    socket.data = socket.data || {};
    socket.data.roomCode = normalizedCode;

    const sanitized = sanitizeStateForClients(room, socket.id);
    socket.emit('room_joined', { roomState: sanitized });
    emitRoomState(room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('leave_room', () => {
    handlePlayerLeave(socket);
    socket.emit('left_room');
  });

  /* ---- CONTROLES DE HOST ---- */
  socket.on('toggle_room_privacy', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.isPublic = !room.isPublic;
    emitRoomState(room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('add_bot', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;
    if (room.players.length >= room.maxPlayers) {
      return toast(socket.id, 'Sala cheia (8 jogadores).');
    }
    const used = room.players.filter((p) => p.isBot).map((p) => p.name);
    const name = BOT_NAMES.find((n) => !used.includes(n)) || 'BOT_' + uuid().slice(0, 4);
    room.players.push(createPlayer('bot-' + uuid(), name, true));
    emitRoomState(room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('remove_bot', (botId) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;
    const bot = getPlayer(room, botId);
    if (!bot || !bot.isBot) return;
    room.players = room.players.filter((p) => p.id !== botId);
    emitRoomState(room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('kick_player', ({ targetId } = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;
    if (targetId === socket.id) return;

    const targetPlayer = getPlayer(room, targetId);
    if (!targetPlayer) return;

    if (targetPlayer.isBot) {
      room.players = room.players.filter((p) => p.id !== targetId);
    } else {
      const targetSocket = io.sockets.sockets.get(targetId);
      if (targetSocket) {
        targetSocket.leave(room.code);
        targetSocket.data.roomCode = null;
        targetSocket.emit('kicked_from_room', { message: 'Você foi expulso da sala pelo líder.' });
      }
      room.players = room.players.filter((p) => p.id !== targetId);
    }

    emitRoomState(room);
    io.emit('public_rooms_updated', getPublicRoomsList());
  });

  socket.on('update_settings', (newSettings = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    const s = room.gameState.settings;
    const num = (v, min, max, fallback) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    };
    if (typeof newSettings.useFixedTime === 'boolean') s.useFixedTime = newSettings.useFixedTime;
    s.baseTestTime = num(newSettings.baseTestTime, 5, 40, s.baseTestTime);
    s.secondsPerPlayer = num(newSettings.secondsPerPlayer, 1, 5, s.secondsPerPlayer);
    s.damagePenalty = num(newSettings.damagePenalty, 0, 0.5, s.damagePenalty);
    s.analysisDuration = num(newSettings.analysisDuration, 3, 20, s.analysisDuration);
    emitRoomState(room);
  });

  socket.on('start_game', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;
    if (room.players.length < room.minPlayers) {
      return toast(socket.id, `Mínimo de ${room.minPlayers} jogadores para iniciar. Adicione bots ou convide amigos.`);
    }
    startGame(room);
  });

  socket.on('restart_game', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'GAME_OVER') return;
    resetToLobby(room);
  });

  /* ---- AÇÕES DE GAMEPLAY NA PARTIDA ---- */
  socket.on('select_action', ({ cardId, targetId } = {}) => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'PLANNING') return;
    const player = getPlayer(room, socket.id);
    if (!player || !player.isAlive || player.lockedIn) return;

    const result = applyAction(room, player, cardId, targetId);
    if (!result.ok) return toast(socket.id, result.error);
    emitRoomState(room);
  });

  socket.on('pass_turn', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'PLANNING') return;
    const player = getPlayer(room, socket.id);
    if (!player || !player.isAlive || player.lockedIn) return;

    passAction(player);
    emitRoomState(room);
  });

  socket.on('toggle_pause', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'ANALYSIS' || !getPlayer(room, socket.id)) return;
    room.gameState.isPaused = !room.gameState.isPaused;
    emitRoomState(room);
  });

  socket.on('skip_analysis', () => {
    const roomCode = socket.data?.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.gameState.phase !== 'ANALYSIS' || !getPlayer(room, socket.id)) return;
    room.gameState.skipAnalysisFlag = true;
    room.gameState.isPaused = false;
  });

  socket.on('disconnect', () => {
    handlePlayerLeave(socket);
  });
});

server.listen(PORT, () => console.log('STRIKE/VOID v2 server rodando na porta ' + PORT));

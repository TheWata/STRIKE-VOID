const express = require('express');
const http = require('http');
const cors = require('cors');
const crypto = require('crypto');
const { Server } = require('socket.io');

// uuid v9 (CJS) works with require; newer majors are ESM-only -> fall back to crypto.
let uuid;
try {
  uuid = require('uuid').v4;
  if (typeof uuid !== 'function') throw new Error('no v4');
} catch (e) {
  uuid = () => crypto.randomUUID();
}

const path = require('path');

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors({ origin: '*' }));

// Servir o build do front-end se existir
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('/api/health', (_req, res) => res.json({ status: 'online', game: 'STRIKE/VOID v2' }));

// Redireciona qualquer outra rota para o SPA se os estáticos existirem
app.get('*', (_req, res, next) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

/* ------------------------------------------------------------------ */
/* 3.1 ESTADO DA SALA                                                  */
/* ------------------------------------------------------------------ */
const room = {
  phase: 'LOBBY', // 'LOBBY' | 'DEALING' | 'PLANNING' | 'REVEAL_REVERSO' | 'REVEAL_PAREDE' | 'REVEAL_FACA' | 'ANALYSIS' | 'GAME_OVER'
  round: 0,
  isPaused: false,
  settings: {
    useFixedTime: false,
    baseTestTime: 10, // 10 segundos de folga padrão para testes
    secondsPerPlayer: 2.0, // 2s por jogador vivo
    damagePenalty: 0.33, // 33% menos tempo por dano
    analysisDuration: 8.0, // 8s para ler os logs entre os rounds
  },
  deck: [],
  discardPile: [],
  players: [],
  logs: [],
  winner: null,
};

const BOT_NAMES = ['LESHY_BOT', 'DEALER_X', 'GRIMORA', 'MAGNIFICUS', 'PO3_UNIT', 'BONE_LORD', 'HOUND_7'];
const MAX_PLAYERS = 8;
const MIN_PLAYERS = 2;

// Metadados auxiliares fora do objeto "room" (não vão para o cliente)
let gameToken = 0; // incrementa a cada partida/reset para abortar loops antigos
let skipAnalysisFlag = false;
let planningElapsed = 0;
let logCounter = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getPlayer = (id) => room.players.find((p) => p.id === id);
const alivePlayers = () => room.players.filter((p) => p.isAlive);

/* ------------------------------------------------------------------ */
/* 3.2 JOGADOR                                                         */
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
/* 3.3 BARALHO PROPORCIONAL (96 cartas)                                */
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

function drawCard() {
  if (room.deck.length === 0) {
    room.deck = room.discardPile;
    room.discardPile = [];
    shuffle(room.deck);
  }
  return room.deck.pop();
}

/* ------------------------------------------------------------------ */
/* 3.4 EQUAÇÃO DE TEMPO INDIVIDUAL                                     */
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
/* LOGS + SANITIZAÇÃO DE ESTADO                                        */
/* ------------------------------------------------------------------ */
function addLog(type, text) {
  room.logs.push({ id: ++logCounter, round: room.round, type, text, timestamp: Date.now() });
  if (room.logs.length > 300) room.logs.shift();
}

const REVEAL_ORDER = {
  PLANNING: [],
  REVEAL_REVERSO: ['REVERSO'],
  REVEAL_PAREDE: ['REVERSO', 'PAREDE'],
  REVEAL_FACA: ['REVERSO', 'PAREDE', 'FACA', 'NONE'],
  ANALYSIS: ['REVERSO', 'PAREDE', 'FACA', 'NONE'],
  GAME_OVER: ['REVERSO', 'PAREDE', 'FACA', 'NONE'],
};

/**
 * Estado sanitizado para um cliente específico: esconde mãos alheias e ações
 * ainda não reveladas (ninguém "vê" a jogada do outro durante o PLANNING).
 */
function sanitizeStateForClients(viewerId) {
  const revealed = REVEAL_ORDER[room.phase] || [];
  const hostId = room.players.find((p) => !p.isBot)?.id || null;
  return {
    you: viewerId,
    hostId,
    phase: room.phase,
    round: room.round,
    isPaused: room.isPaused,
    settings: room.settings,
    logs: room.logs.slice(-120),
    winner: room.winner,
    deckCount: room.deck.length,
    players: room.players.map((p) => {
      const isMe = p.id === viewerId;
      let action = null;
      if (p.selectedAction) {
        const a = p.selectedAction;
        if (isMe && room.phase === 'PLANNING') {
          action = { ...a };
        } else if (revealed.includes(a.cardType) || (a.status === 'REFLECTED' && room.phase !== 'PLANNING')) {
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
        handCount: p.hand.length,
        selectedAction: action,
        lockedIn: p.lockedIn,
        allowedTime: p.allowedTime,
        visualEffect: p.visualEffect,
      };
    }),
  };
}

function emitState() {
  for (const [sid, sock] of io.sockets.sockets) {
    sock.emit('game_state', sanitizeStateForClients(sid));
  }
}

function toast(socketId, message) {
  io.to(socketId).emit('error_message', message);
}

/* ------------------------------------------------------------------ */
/* AÇÕES                                                               */
/* ------------------------------------------------------------------ */
function applyAction(player, cardId, targetId) {
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return { ok: false, error: 'Carta inválida.' };
  const card = player.hand[idx];
  // REVERSO pode mirar em si mesmo (defesa) ou em qualquer outro jogador (ofensivo/roubo)
  const finalTarget = targetId || player.id;
  const target = getPlayer(finalTarget);
  if (!target || !target.isAlive) return { ok: false, error: 'Alvo inválido.' };
  if (player.isWalled && finalTarget !== player.id) {
    return {
      ok: false,
      error: 'Você está EMPAREDADO! Só pode usar cartas em si mesmo ou passar a vez.',
    };
  }
  player.hand.splice(idx, 1);
  room.discardPile.push(card);
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

function scheduleBot(bot, token, round) {
  const delay = 1500 + Math.random() * 2000;
  setTimeout(() => {
    if (token !== gameToken || room.phase !== 'PLANNING' || room.round !== round) return;
    if (!bot.isAlive || bot.lockedIn) return;
    if (bot.isWalled) {
      const knife = bot.hand.find((c) => c.type === 'FACA');
      if (knife) applyAction(bot, knife.id, bot.id);
      else passAction(bot);
    } else {
      const card = bot.hand[Math.floor(Math.random() * bot.hand.length)];
      if (!card) {
        passAction(bot);
      } else if (card.type === 'REVERSO') {
        const others = alivePlayers().filter((p) => p.id !== bot.id);
        // Bot varia entre auto-defesa (60%) e reverter um oponente (40%)
        if (others.length > 0 && Math.random() < 0.4) {
          applyAction(bot, card.id, others[Math.floor(Math.random() * others.length)].id);
        } else {
          applyAction(bot, card.id, bot.id);
        }
      } else {
        const others = alivePlayers().filter((p) => p.id !== bot.id);
        if (others.length === 0) passAction(bot);
        else applyAction(bot, card.id, others[Math.floor(Math.random() * others.length)].id);
      }
    }
    emitState();
  }, delay);
}

/* ------------------------------------------------------------------ */
/* 3.5 MÁQUINA DE ESTADOS                                              */
/* ------------------------------------------------------------------ */
function checkDeaths() {
  for (const p of room.players) {
    if (p.lives <= 0 && p.isAlive) {
      p.isAlive = false;
      p.isWalled = false;
      addLog('DEATH', '💀 ' + p.name + ' FOI ELIMINADO DA MESA!');
    }
  }
}

async function runGame(token) {
  const aborted = () => token !== gameToken;

  while (!aborted()) {
    /* ---------------- DEALING ---------------- */
    room.phase = 'DEALING';
    room.round += 1;
    room.isPaused = false;
    skipAnalysisFlag = false;
    for (const p of room.players) {
      p.visualEffect = null;
      p.isReflecting = false;
      p.selectedAction = null;
      p.lockedIn = false;
    }
    const aliveCount = alivePlayers().length;
    for (const p of alivePlayers()) {
      while (p.hand.length < 3) p.hand.push(drawCard());
      p.allowedTime = calculatePlayerTime(p, aliveCount, room.settings);
    }
    addLog('SYSTEM', '— ROUND ' + room.round + ' —');
    emitState();
    await wait(1200);
    if (aborted()) return;

    /* ---------------- PLANNING ---------------- */
    room.phase = 'PLANNING';
    planningElapsed = 0;
    emitState();
    const round = room.round;
    for (const bot of alivePlayers().filter((p) => p.isBot)) scheduleBot(bot, token, round);

    await new Promise((resolve) => {
      const startedAt = Date.now();
      const interval = setInterval(() => {
        if (aborted()) {
          clearInterval(interval);
          return resolve();
        }
        const elapsedSec = (Date.now() - startedAt) / 1000;
        planningElapsed = elapsedSec;
        io.emit('timer_tick', { elapsedSec });

        let forced = false;
        for (const p of alivePlayers()) {
          if (elapsedSec >= p.allowedTime && !p.lockedIn) {
            p.lockedIn = true;
            p.selectedAction = { cardType: 'NONE', targetId: null, originalTargetId: null, status: 'PENDING' };
            forced = true;
          }
        }
        if (forced) emitState();

        if (alivePlayers().every((p) => p.lockedIn)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
    if (aborted()) return;

    const alive = () => alivePlayers();
    const actionOf = (p) => p.selectedAction || { cardType: 'NONE', targetId: null };

    /* ---------------- REVEAL_REVERSO ---------------- */
    room.phase = 'REVEAL_REVERSO';
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
          addLog('VACUUM', '[VÁCUO] ' + revPlayer.name + ' usou Reverso em si mesmo no vazio e perdeu 1 Vida!');
        } else {
          revPlayer.isReflecting = true;
          revPlayer.visualEffect = 'REFLECT';
          revAction.status = 'RESOLVED';
          for (const attacker of attackers) {
            attacker.selectedAction.targetId = attacker.id;
            attacker.selectedAction.status = 'REFLECTED';
            if (attacker.selectedAction.cardType === 'PAREDE') {
              addLog('REFLECT', '[PAREDE REFLETIDA] ' + revPlayer.name + ' refletiu a Parede de volta para ' + attacker.name + '!');
            } else {
              addLog('REFLECT', '[REVERSO] ' + revPlayer.name + ' refletiu a Faca de ' + attacker.name + ' de volta para ' + attacker.name + '!');
            }
          }
        }
      } else {
        // CASO 2: Usou em OUTRA pessoa (Reverso Ofensivo / Intervenção)
        const target = getPlayer(targetId);
        const tAction = target ? target.selectedAction : null;

        if (!target || !target.isAlive || !tAction || tAction.cardType === 'NONE' || tAction.cardType === 'REVERSO') {
          // O alvo não atacou nem usou parede -> Vácuo!
          revPlayer.lives = Math.max(0, revPlayer.lives - 1);
          revPlayer.visualEffect = 'VACUUM';
          revAction.status = 'MISFIRE';
          addLog('VACUUM', '[VÁCUO] ' + revPlayer.name + ' tentou reverter ' + (target ? target.name : 'o vazio') + ', mas não havia ação reversível (-1 Vida)!');
        } else if (tAction.cardType === 'PAREDE') {
          revPlayer.isReflecting = true;
          revPlayer.visualEffect = 'REFLECT';
          revAction.status = 'RESOLVED';

          if (tAction.targetId === target.id) {
            // "se reverter alguem que usou a parede em si mesmo, rouba a parede"
            tAction.targetId = revPlayer.id;
            tAction.status = 'REFLECTED';
            addLog('STEAL', '🛡️ [ROUBO DE PAREDE] ' + revPlayer.name + ' reverteu a Parede de ' + target.name + ' e ROUBOU para si!');
          } else {
            // "Reverso em parede, volta pro remetente"
            tAction.targetId = target.id;
            tAction.status = 'REFLECTED';
            addLog('REFLECT', '[PAREDE REFLETIDA] ' + revPlayer.name + ' reverteu a Parede de ' + target.name + ' de volta para ' + target.name + '!');
          }
        } else if (tAction.cardType === 'FACA') {
          revPlayer.isReflecting = true;
          revPlayer.visualEffect = 'REFLECT';
          revAction.status = 'RESOLVED';

          if (tAction.targetId === target.id) {
            tAction.targetId = revPlayer.id;
            tAction.status = 'REFLECTED';
            addLog('REFLECT', '[REVERSO] ' + revPlayer.name + ' reverteu o golpe interno de ' + target.name + ' para si!');
          } else {
            tAction.targetId = target.id;
            tAction.status = 'REFLECTED';
            addLog('REFLECT', '[REVERSO] ' + revPlayer.name + ' reverteu a Faca de ' + target.name + ' de volta para ' + target.name + '!');
          }
        }
      }
    }
    emitState();
    await wait(2500);
    if (aborted()) return;

    /* ---------------- REVEAL_PAREDE ---------------- */
    room.phase = 'REVEAL_PAREDE';
    for (const p of room.players) p.visualEffect = null;
    for (const player of alive().filter((p) => actionOf(p).cardType === 'PAREDE')) {
      const action = player.selectedAction;
      const target = getPlayer(action.targetId);
      if (!target) continue;
      target.isWalled = true;
      target.visualEffect = 'WALLED';
      if (action.status === 'REFLECTED') {
        if (action.targetId === player.id) {
          addLog('WALL', '[PAREDE REFLETIDA] ' + target.name + ' ficou preso na própria Parede!');
        } else {
          addLog('WALL', '🛡️ [PAREDE ROUBADA] ' + target.name + ' recebeu a Parede roubada de ' + player.name + '!');
        }
      } else {
        addLog('WALL', '[PAREDE] ' + player.name + ' isolou ' + target.name + ' na Parede!');
      }
    }
    emitState();
    await wait(2500);
    if (aborted()) return;

    /* ---------------- REVEAL_FACA ---------------- */
    room.phase = 'REVEAL_FACA';
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
          addLog('BREAK', '[QUEBRA INTERNA] ' + player.name + ' usou a própria Faca e destruiu sua Parede!');
        } else {
          player.lives = Math.max(0, player.lives - 1);
          player.visualEffect = 'DAMAGE';
          action.processed = true;
          addLog('DAMAGE', '[AUTO-DANO] ' + player.name + ' se cortou com a própria Faca (-1 Vida)!');
        }
      }
    }

    // 3B: Facas externas e refletidas
    for (const player of knives) {
      const action = player.selectedAction;
      if (action.processed) continue;
      const target = getPlayer(action.targetId);
      if (!target) continue;
      if (target.isWalled) {
        target.isWalled = false;
        target.visualEffect = 'WALL_BROKEN';
        addLog('BREAK', '[ESTILHAÇO] A Faca de ' + player.name + ' destruiu a Parede de ' + target.name + ' (0 Dano)!');
      } else {
        target.lives = Math.max(0, target.lives - 1);
        target.visualEffect = 'DAMAGE';
        addLog('DAMAGE', '[SANGUE] Faca atingiu ' + target.name + ' em cheio (-1 Vida)!');
      }
      action.processed = true;
    }
    checkDeaths();
    emitState();
    await wait(3000);
    if (aborted()) return;

    /* ---------------- ANALYSIS / VITÓRIA ---------------- */
    const survivors = alivePlayers();
    if (survivors.length <= 1) {
      room.phase = 'GAME_OVER';
      room.winner = survivors[0] ? { id: survivors[0].id, name: survivors[0].name } : null;
      addLog('SYSTEM', room.winner ? '🏆 ' + room.winner.name + ' VENCEU A PARTIDA!' : 'Ninguém sobreviveu. EMPATE NO VAZIO.');
      emitState();
      return;
    }

    room.phase = 'ANALYSIS';
    emitState();
    let remainingMs = room.settings.analysisDuration * 1000;
    skipAnalysisFlag = false;
    while (remainingMs > 0 && !skipAnalysisFlag && !aborted()) {
      await wait(100);
      if (!room.isPaused) remainingMs -= 100;
      io.emit('analysis_tick', { remainingSec: Math.max(0, remainingMs / 1000), paused: room.isPaused });
    }
    if (aborted()) return;
    room.isPaused = false;
  }
}

/* ------------------------------------------------------------------ */
/* LOBBY / PARTIDA                                                     */
/* ------------------------------------------------------------------ */
const connectedHumans = () => room.players.filter((p) => !p.isBot && io.sockets.sockets.has(p.id));

function resetToLobby() {
  gameToken++;
  // Humanos desconectados não fazem parte do próximo lobby
  room.players = room.players.filter((p) => p.isBot || io.sockets.sockets.has(p.id));
  room.phase = 'LOBBY';
  room.round = 0;
  room.isPaused = false;
  room.deck = [];
  room.discardPile = [];
  room.logs = [];
  room.winner = null;
  room.players.forEach((p) => {
    p.lives = 3;
    p.isAlive = true;
    p.isWalled = false;
    p.isReflecting = false;
    p.hand = [];
    p.selectedAction = null;
    p.lockedIn = false;
    p.visualEffect = null;
  });
  emitState();
}

function startGame() {
  gameToken++;
  room.deck = buildDeck();
  room.discardPile = [];
  room.logs = [];
  room.winner = null;
  room.round = 0;
  room.players.forEach((p) => {
    p.lives = 3;
    p.isAlive = true;
    p.isWalled = false;
    p.isReflecting = false;
    p.hand = [];
    p.selectedAction = null;
    p.lockedIn = false;
    p.visualEffect = null;
  });
  addLog('SYSTEM', 'A mesa foi selada. Que comece o ritual.');
  runGame(gameToken).catch((err) => console.error('Erro no loop de jogo:', err));
}

/* ------------------------------------------------------------------ */
/* 3.6 EVENTOS SOCKET.IO                                               */
/* ------------------------------------------------------------------ */
io.on('connection', (socket) => {
  console.log('conectado:', socket.id);
  // Sala órfã (ninguém conectado numa partida antiga): volta ao lobby limpo
  if (room.phase !== 'LOBBY' && connectedHumans().length === 0) {
    room.players = [];
    resetToLobby();
  }
  socket.emit('game_state', sanitizeStateForClients(socket.id));

  socket.on('join_game', ({ name } = {}) => {
    if (room.phase !== 'LOBBY') return toast(socket.id, 'A partida já começou.');
    if (getPlayer(socket.id)) return;
    if (room.players.length >= MAX_PLAYERS) return toast(socket.id, 'Mesa cheia (8 jogadores).');
    const clean = String(name || '').trim().slice(0, 16) || 'JOGADOR_' + (room.players.length + 1);
    room.players.push(createPlayer(socket.id, clean, false));
    emitState();
  });

  socket.on('add_bot', () => {
    if (room.phase !== 'LOBBY') return;
    if (!getPlayer(socket.id)) return;
    if (room.players.length >= MAX_PLAYERS) return toast(socket.id, 'Mesa cheia (8 jogadores).');
    const used = room.players.filter((p) => p.isBot).map((p) => p.name);
    const name = BOT_NAMES.find((n) => !used.includes(n)) || 'BOT_' + uuid().slice(0, 4);
    room.players.push(createPlayer('bot-' + uuid(), name, true));
    emitState();
  });

  socket.on('remove_bot', (botId) => {
    if (room.phase !== 'LOBBY') return;
    const bot = getPlayer(botId);
    if (!bot || !bot.isBot) return;
    room.players = room.players.filter((p) => p.id !== botId);
    emitState();
  });

  socket.on('update_settings', (newSettings = {}) => {
    if (!getPlayer(socket.id)) return;
    const s = room.settings;
    const num = (v, min, max, fallback) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    };
    if (typeof newSettings.useFixedTime === 'boolean') s.useFixedTime = newSettings.useFixedTime;
    s.baseTestTime = num(newSettings.baseTestTime, 5, 40, s.baseTestTime);
    s.secondsPerPlayer = num(newSettings.secondsPerPlayer, 1, 5, s.secondsPerPlayer);
    s.damagePenalty = num(newSettings.damagePenalty, 0, 0.5, s.damagePenalty);
    s.analysisDuration = num(newSettings.analysisDuration, 3, 20, s.analysisDuration);
    emitState();
  });

  socket.on('start_game', () => {
    if (room.phase !== 'LOBBY') return;
    const me = getPlayer(socket.id);
    if (!me) return;
    if (room.players.length < MIN_PLAYERS) return toast(socket.id, 'Mínimo de 2 jogadores (adicione um bot).');
    startGame();
  });

  socket.on('restart_game', () => {
    if (room.phase !== 'GAME_OVER') return;
    resetToLobby();
  });

  socket.on('toggle_pause', () => {
    if (room.phase !== 'ANALYSIS' || !getPlayer(socket.id)) return;
    room.isPaused = !room.isPaused;
    emitState();
  });

  socket.on('skip_analysis', () => {
    if (room.phase !== 'ANALYSIS' || !getPlayer(socket.id)) return;
    skipAnalysisFlag = true;
    room.isPaused = false;
  });

  socket.on('select_action', ({ cardId, targetId } = {}) => {
    const player = getPlayer(socket.id);
    if (!player || room.phase !== 'PLANNING' || !player.isAlive || player.lockedIn) return;
    const result = applyAction(player, cardId, targetId);
    if (!result.ok) return toast(socket.id, result.error);
    emitState();
  });

  socket.on('pass_turn', () => {
    const player = getPlayer(socket.id);
    if (!player || room.phase !== 'PLANNING' || !player.isAlive || player.lockedIn) return;
    passAction(player);
    emitState();
  });

  socket.on('disconnect', () => {
    console.log('desconectado:', socket.id);
    const player = getPlayer(socket.id);
    if (!player) return;
    if (room.phase === 'LOBBY') {
      room.players = room.players.filter((p) => p.id !== socket.id);
    } else {
      player.isAlive = false;
      player.lives = 0;
      player.isWalled = false;
      if (!player.lockedIn) {
        player.lockedIn = true;
        player.selectedAction = { cardType: 'NONE', targetId: null, originalTargetId: null, status: 'PENDING' };
      }
      addLog('DEATH', '💀 ' + player.name + ' abandonou a mesa.');
    }
    // Sem humanos restantes: zera a sala
    if (connectedHumans().length === 0) {
      room.players = [];
      resetToLobby();
      return;
    }
    emitState();
  });
});

server.listen(PORT, () => console.log('STRIKE/VOID v2 server rodando na porta ' + PORT));

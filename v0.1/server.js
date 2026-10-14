const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const CARD_TYPES = ['FACA', 'PAREDE', 'REVERSO'];
const MIN_PLAYERS_TO_START = 4;
const MAX_PLAYERS = 8;
const STARTING_LIFE = 3;
const HAND_SIZE = 3;
const ROUND_SECONDS = 8;

const game = {
  status: 'lobby',
  roundNumber: 0,
  players: new Map(),
  deck: [],
  round: null,
  logs: [],
  nextNameNumber: 1,
};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function refillDeck() {
  const fresh = [];
  for (let i = 0; i < 32; i += 1) {
    fresh.push('FACA', 'PAREDE', 'REVERSO');
  }
  shuffle(fresh);
  game.deck.push(...fresh);
}

function drawCard() {
  if (game.deck.length < MAX_PLAYERS + HAND_SIZE) {
    refillDeck();
  }
  return game.deck.pop();
}

function getPlayersArray() {
  return Array.from(game.players.values());
}

function getAlivePlayers() {
  return getPlayersArray().filter((p) => p.alive);
}

function playerPublic(player) {
  return {
    id: player.id,
    name: player.name,
    life: player.life,
    alive: player.alive,
    isolatedActive: player.isolatedActive,
    isolatedNext: player.isolatedNext,
    handSize: player.hand.length,
    submitted: Boolean(game.round && game.round.submissions.has(player.id)),
    autoLocked: Boolean(game.round && game.round.autoLocked.has(player.id)),
  };
}

function getRoundBaseSeconds() {
  return ROUND_SECONDS;
}

function getPersonalSeconds() {
  return ROUND_SECONDS;
}

function playerName(playerId) {
  const p = game.players.get(playerId);
  return p ? `[${p.name}]` : '[Unknown]';
}

function pushLog(message) {
  game.logs.push({
    at: Date.now(),
    text: message,
  });
  if (game.logs.length > 30) {
    game.logs.shift();
  }
}

function emitState(extra = {}) {
  const alive = getAlivePlayers();
  io.emit('state', {
    status: game.status,
    roundNumber: game.roundNumber,
    players: getPlayersArray().map(playerPublic),
    aliveCount: alive.length,
    logs: game.logs,
    round: game.round
      ? {
          number: game.round.number,
          phase: game.round.phase,
          startedAt: game.round.startedAt,
          endsAt: game.round.endsAt,
          baseSeconds: game.round.baseSeconds,
          arrows: game.round.arrows,
          reveal: game.round.reveal,
          personalDeadlines: game.round.personalDeadlines,
        }
      : null,
    ...extra,
  });
}

function emitPrivateState() {
  for (const player of getPlayersArray()) {
    const personalDeadline = game.round ? game.round.personalDeadlines[player.id] || null : null;
    player.socket.emit('privateState', {
      id: player.id,
      hand: player.hand,
      life: player.life,
      alive: player.alive,
      personalDeadline,
    });
  }
}

function autoSubmitExpired() {
  if (!game.round || game.round.phase !== 'planning') {
    return;
  }

  const now = Date.now();
  const alive = getAlivePlayers();
  let changed = false;
  for (const player of alive) {
    if (game.round.submissions.has(player.id)) {
      continue;
    }
    const deadline = game.round.personalDeadlines[player.id];
    if (now <= deadline) {
      continue;
    }
    game.round.submissions.set(player.id, {
      actorId: player.id,
      card: 'VAZIO',
      targetId: player.id,
      submittedAt: now,
      auto: true,
      gainCard: true,
    });
    game.round.autoLocked.add(player.id);
    pushLog(`${player.name} did not act in time and defaulted to VOID (+1 card).`);
    changed = true;
  }

  if (changed) {
    emitState();
    emitPrivateState();
  }
}

function applyDamage(playerId, amount, reason, events) {
  const player = game.players.get(playerId);
  if (!player || !player.alive) {
    return;
  }
  player.life = Math.max(0, player.life - amount);
  events.push({ type: 'damage', targetId: playerId, amount, reason });
  if (player.life === 0) {
    player.alive = false;
    events.push({ type: 'eliminated', playerId });
  }
}

function resolveRound() {
  if (!game.round || game.round.phase !== 'planning') {
    return;
  }

  game.round.phase = 'revealed';
  const round = game.round;
  const alive = getAlivePlayers();
  const aliveIds = new Set(alive.map((p) => p.id));
  const events = [];
  const narration = [];

  for (const player of alive) {
    if (!round.submissions.has(player.id)) {
      round.submissions.set(player.id, {
        actorId: player.id,
        card: 'VAZIO',
        targetId: player.id,
        submittedAt: Date.now(),
        auto: true,
        gainCard: true,
      });
      round.autoLocked.add(player.id);
      narration.push(`${player.name} had no action submitted and defaults to VOID (+1 card).`);
    }
  }

  const actions = [];
  for (const [actorId, submission] of round.submissions.entries()) {
    if (!aliveIds.has(actorId)) {
      continue;
    }
    const actor = game.players.get(actorId);
    const declaredTargetId = aliveIds.has(submission.targetId) ? submission.targetId : actorId;
    const effectiveTargetId = actor.isolatedActive ? actorId : declaredTargetId;
    actions.push({
      actorId,
      card: submission.card,
      declaredTargetId,
      targetId: effectiveTargetId,
      auto: submission.auto,
      gainCard: Boolean(submission.gainCard),
      consumed: false,
      bounced: false,
    });

    if (submission.card === 'VAZIO') {
      narration.push(`${playerName(actorId)} chooses VOID, does nothing, and prepares to draw 1 card.`);
    } else {
      const isolationNote = declaredTargetId !== effectiveTargetId ? ' (isolated -> redirected to self)' : '';
      narration.push(`${playerName(actorId)} plays ${submission.card} targeting ${playerName(declaredTargetId)}${isolationNote}.`);
    }
  }

  round.arrows = actions.map((a) => ({
    from: a.actorId,
    to: a.targetId,
    card: a.card,
  }));

  const reversoUsers = new Set(actions.filter((a) => a.card === 'REVERSO').map((a) => a.actorId));
  const reversoTriggered = new Set();

  for (const action of actions) {
    if (action.consumed || action.card === 'REVERSO' || action.card === 'VAZIO') {
      continue;
    }
    if (!reversoUsers.has(action.targetId)) {
      continue;
    }
    if (action.actorId === action.targetId) {
      continue;
    }

    reversoTriggered.add(action.targetId);
    if (action.card === 'FACA') {
      applyDamage(action.actorId, 1, 'REFLECT_FACA', events);
      events.push({ type: 'reflect', by: action.targetId, against: action.actorId, card: 'FACA' });
      narration.push(`${playerName(action.targetId)} reflects FACA and ${playerName(action.actorId)} takes 1 damage.`);
      action.consumed = true;
      continue;
    }

    if (action.card === 'PAREDE') {
      action.targetId = action.actorId;
      action.bounced = true;
      events.push({ type: 'reflect', by: action.targetId, against: action.actorId, card: 'PAREDE' });
      narration.push(`${playerName(action.targetId)} reflects PAREDE back to ${playerName(action.actorId)}.`);
    }
  }

  for (const action of actions) {
    if (action.card === 'REVERSO' && !reversoTriggered.has(action.actorId)) {
      applyDamage(action.actorId, 1, 'VACUUM_REVERSO', events);
      events.push({ type: 'vacuum', playerId: action.actorId });
      narration.push(`${playerName(action.actorId)} triggers VACUUM on REVERSO and takes 1 damage.`);
    }
  }

  const wallMap = new Map();
  for (const player of alive) {
    const tokens = [];
    if (player.isolatedActive) {
      tokens.push({
        from: 'PREVIOUS_ROUND',
        providesNext: false,
      });
    }
    wallMap.set(player.id, tokens);
  }

  for (const action of actions) {
    if (action.consumed || action.card !== 'PAREDE') {
      continue;
    }
    const tokens = wallMap.get(action.targetId);
    if (!tokens) {
      continue;
    }
    tokens.push({ from: action.actorId, providesNext: true });
    events.push({ type: 'wall_create', from: action.actorId, targetId: action.targetId });
    narration.push(`${playerName(action.actorId)} creates PAREDE around ${playerName(action.targetId)} for next round.`);
  }

  for (const action of actions) {
    if (action.consumed || action.card !== 'FACA') {
      continue;
    }
    if (action.actorId !== action.targetId) {
      continue;
    }
    const actor = game.players.get(action.actorId);
    if (!actor || !actor.isolatedActive) {
      continue;
    }
    const tokens = wallMap.get(action.targetId) || [];
    if (tokens.length > 0) {
      tokens.shift();
      action.consumed = true;
      events.push({ type: 'escape', playerId: action.actorId });
      narration.push(`${playerName(action.actorId)} attacks self from inside and breaks the PAREDE.`);
    }
  }

  const facaActions = actions.filter((a) => !a.consumed && a.card === 'FACA');
  facaActions.sort((a, b) => String(a.actorId).localeCompare(String(b.actorId)));
  for (const action of facaActions) {
    const tokens = wallMap.get(action.targetId) || [];
    if (tokens.length > 0) {
      tokens.shift();
      events.push({ type: 'wall_break', by: action.actorId, targetId: action.targetId });
      narration.push(`${playerName(action.actorId)} hits ${playerName(action.targetId)} but the PAREDE absorbs and breaks.`);
      continue;
    }
    applyDamage(action.targetId, 1, 'FACA_HIT', events);
    narration.push(`${playerName(action.actorId)} lands FACA on ${playerName(action.targetId)} for 1 damage.`);
  }

  for (const action of actions) {
    if (action.card !== 'VAZIO' || !action.gainCard) {
      continue;
    }
    const actor = game.players.get(action.actorId);
    if (!actor || !actor.alive) {
      continue;
    }
    actor.hand.push(drawCard());
    events.push({ type: 'idle_draw', playerId: action.actorId });
    narration.push(`${playerName(action.actorId)} resolves VOID and draws +1 card.`);
  }

  for (const player of alive) {
    const tokens = wallMap.get(player.id) || [];
    player.isolatedActive = false;
    player.isolatedNext = tokens.some((t) => t.providesNext);
  }

  for (const player of getAlivePlayers()) {
    while (player.hand.length < HAND_SIZE) {
      player.hand.push(drawCard());
    }
  }

  round.reveal = {
    actions: actions.map((a) => ({
      actorId: a.actorId,
      card: a.card,
      declaredTargetId: a.declaredTargetId,
      targetId: a.targetId,
      auto: a.auto,
      bounced: a.bounced,
    })),
    events,
    narration,
  };

  for (const line of narration) {
    pushLog(`R${round.number}: ${line}`);
  }

  const survivors = getAlivePlayers();
  if (survivors.length <= 1) {
    game.status = 'finished';
    if (survivors.length === 1) {
      pushLog(`Winner: ${survivors[0].name}`);
    } else {
      pushLog('No winner this match.');
    }
    emitState();
    emitPrivateState();
    return;
  }

  emitState();
  emitPrivateState();

  setTimeout(() => {
    if (game.status === 'finished') {
      return;
    }
    startRound();
  }, 6000);
}

function startRound() {
  const alive = getAlivePlayers();
  if (alive.length < 2) {
    game.status = 'finished';
    emitState();
    return;
  }

  game.status = 'playing';
  game.roundNumber += 1;
  const baseSeconds = getRoundBaseSeconds();
  const startedAt = Date.now();
  const endsAt = startedAt + baseSeconds * 1000;

  for (const player of alive) {
    player.isolatedActive = Boolean(player.isolatedNext);
    player.isolatedNext = false;
  }

  const personalDeadlines = {};
  for (const player of alive) {
    const seconds = getPersonalSeconds();
    personalDeadlines[player.id] = startedAt + Math.floor(seconds * 1000);
  }

  game.round = {
    number: game.roundNumber,
    phase: 'planning',
    startedAt,
    endsAt,
    baseSeconds,
    submissions: new Map(),
    personalDeadlines,
    autoLocked: new Set(),
    arrows: [],
    reveal: null,
  };

  pushLog(`Round ${game.roundNumber} started.`);
  emitState();
  emitPrivateState();

  const intervalId = setInterval(() => {
    if (!game.round || game.round.number !== game.roundNumber || game.round.phase !== 'planning') {
      clearInterval(intervalId);
      return;
    }
    autoSubmitExpired();

    const aliveCurrent = getAlivePlayers();
    const allHandled = aliveCurrent.every((p) => game.round.submissions.has(p.id));
    if (allHandled) {
      clearInterval(intervalId);
      resolveRound();
    }
  }, 250);

  setTimeout(() => {
    clearInterval(intervalId);
    resolveRound();
  }, baseSeconds * 1000 + 20);
}

function restartGame() {
  game.status = 'lobby';
  game.roundNumber = 0;
  game.round = null;
  game.logs = [];
  game.deck = [];
  refillDeck();

  for (const player of getPlayersArray()) {
    player.life = STARTING_LIFE;
    player.alive = true;
    player.isolatedActive = false;
    player.isolatedNext = false;
    player.hand = [];
    for (let i = 0; i < HAND_SIZE; i += 1) {
      player.hand.push(drawCard());
    }
  }

  pushLog('Game reset. Waiting to start.');
  emitState();
  emitPrivateState();
}

function maybeAutoStart() {
  if (game.status !== 'lobby') {
    return;
  }
  const connectedCount = getPlayersArray().length;
  if (connectedCount >= MIN_PLAYERS_TO_START) {
    restartGame();
    startRound();
  }
}

io.on('connection', (socket) => {
  if (game.players.size >= MAX_PLAYERS) {
    socket.emit('lobbyError', { message: 'Lobby full (max 8 players).' });
    socket.disconnect(true);
    return;
  }

  const player = {
    id: socket.id,
    socket,
    name: `User_${game.nextNameNumber}`,
    life: STARTING_LIFE,
    alive: true,
    hand: [],
    isolatedActive: false,
    isolatedNext: false,
  };
  game.nextNameNumber += 1;

  for (let i = 0; i < HAND_SIZE; i += 1) {
    player.hand.push(drawCard());
  }

  game.players.set(socket.id, player);
  pushLog(`${player.name} connected.`);
  emitState();
  emitPrivateState();

  maybeAutoStart();

  socket.on('rename', (payload) => {
    const raw = payload && typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!raw) {
      return;
    }
    player.name = raw.slice(0, 20);
    pushLog(`${socket.id.slice(0, 4)} renamed to ${player.name}.`);
    emitState();
  });

  socket.on('submitAction', (payload) => {
    if (!game.round || game.round.phase !== 'planning') {
      return;
    }
    if (!player.alive) {
      return;
    }
    if (game.round.submissions.has(player.id)) {
      return;
    }

    const now = Date.now();
    const personalDeadline = game.round.personalDeadlines[player.id] || 0;
    if (now > personalDeadline) {
      socket.emit('actionRejected', { reason: 'Personal timer expired.' });
      return;
    }

    const cardIndex = Number(payload && payload.cardIndex);
    const targetId = payload && payload.targetId;
    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= player.hand.length) {
      socket.emit('actionRejected', { reason: 'Invalid card index.' });
      return;
    }
    if (!game.players.has(targetId) || !game.players.get(targetId).alive) {
      socket.emit('actionRejected', { reason: 'Invalid target.' });
      return;
    }

    const [card] = player.hand.splice(cardIndex, 1);
    game.round.submissions.set(player.id, {
      actorId: player.id,
      card,
      targetId,
      submittedAt: now,
      auto: false,
      gainCard: false,
    });

    emitState();
    emitPrivateState();

    const alive = getAlivePlayers();
    if (alive.every((p) => game.round.submissions.has(p.id))) {
      resolveRound();
    }
  });

  socket.on('submitIdleDraw', () => {
    if (!game.round || game.round.phase !== 'planning') {
      return;
    }
    if (!player.alive) {
      return;
    }
    if (game.round.submissions.has(player.id)) {
      return;
    }

    const now = Date.now();
    const personalDeadline = game.round.personalDeadlines[player.id] || 0;
    if (now > personalDeadline) {
      socket.emit('actionRejected', { reason: 'Timer expired.' });
      return;
    }

    game.round.submissions.set(player.id, {
      actorId: player.id,
      card: 'VAZIO',
      targetId: player.id,
      submittedAt: now,
      auto: false,
      gainCard: true,
    });

    emitState();
    emitPrivateState();

    const alive = getAlivePlayers();
    if (alive.every((p) => game.round.submissions.has(p.id))) {
      resolveRound();
    }
  });

  socket.on('chat', (payload) => {
    const msg = payload && typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!msg) {
      return;
    }
    io.emit('chat', {
      at: Date.now(),
      from: player.name,
      message: msg.slice(0, 300),
    });
  });

  socket.on('restart', () => {
    restartGame();
    if (getPlayersArray().length >= MIN_PLAYERS_TO_START) {
      startRound();
    }
  });

  socket.on('disconnect', () => {
    const existing = game.players.get(socket.id);
    if (!existing) {
      return;
    }
    const leftName = existing.name;
    game.players.delete(socket.id);
    pushLog(`${leftName} disconnected.`);

    if (game.players.size === 0) {
      game.status = 'lobby';
      game.round = null;
      game.roundNumber = 0;
      game.logs = [];
      emitState();
      return;
    }

    emitState();
    emitPrivateState();

    if (game.status === 'playing' && game.round && game.round.phase === 'planning') {
      const alive = getAlivePlayers();
      if (alive.length <= 1) {
        game.status = 'finished';
        pushLog('Game finished due to player count.');
        emitState();
      }
    }

    if (game.status === 'lobby') {
      maybeAutoStart();
    }
  });
});

server.listen(PORT, () => {
  console.log(`STRIKE/VOID prototype server running at http://localhost:${PORT}`);
});

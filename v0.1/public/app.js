const socket = io();

const ui = {
  phaseLabel: document.getElementById('phaseLabel'),
  timer: document.getElementById('timer'),
  globalTimer: document.getElementById('globalTimer'),
  table: document.getElementById('table'),
  arrows: document.getElementById('arrows'),
  logs: document.getElementById('logs'),
  hand: document.getElementById('hand'),
  selectionInfo: document.getElementById('selectionInfo'),
  idleBtn: document.getElementById('idleBtn'),
  restartBtn: document.getElementById('restartBtn'),
  chat: document.getElementById('chat'),
  chatInput: document.getElementById('chatInput'),
  sendChatBtn: document.getElementById('sendChatBtn'),
  nameInput: document.getElementById('nameInput'),
  renameBtn: document.getElementById('renameBtn'),
};

const state = {
  me: null,
  public: null,
  private: null,
  chatLines: [],
  timerIntervalId: null,
  draggingCardIndex: null,
};

function fmtTime(secondsFloat) {
  const total = Math.max(0, Math.ceil(secondsFloat));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getPlayerById(id) {
  if (!state.public) {
    return null;
  }
  return state.public.players.find((p) => p.id === id) || null;
}

function getSortedPlayers() {
  if (!state.public) {
    return [];
  }
  return [...state.public.players].sort((a, b) => a.name.localeCompare(b.name));
}

function getRoundActionForPlayer(playerId) {
  const round = state.public && state.public.round;
  if (!round || !round.reveal || !Array.isArray(round.reveal.actions)) {
    return null;
  }
  return round.reveal.actions.find((a) => a.actorId === playerId) || null;
}

function playerLifeSkulls(player) {
  if (!player.alive) {
    return 'X X X';
  }
  return '☠'.repeat(player.life) + '·'.repeat(Math.max(0, 3 - player.life));
}

function getSlotPositions(players) {
  const out = new Map();
  if (!players.length) {
    return out;
  }
  const n = players.length;
  const cx = 50;
  const cy = 50;
  const rx = 39;
  const ry = 34;
  players.forEach((p, index) => {
    const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / n);
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    out.set(p.id, { x, y });
  });
  return out;
}

function renderArrows(positions) {
  const round = state.public && state.public.round;
  if (!round || round.phase !== 'revealed' || !Array.isArray(round.arrows)) {
    ui.arrows.innerHTML = '';
    return;
  }

  const defs = `
    <defs>
      <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L7,3 z" fill="#d8c59a"></path>
      </marker>
    </defs>
  `;

  const pieces = [defs];
  for (const arrow of round.arrows) {
    const from = positions.get(arrow.from);
    const to = positions.get(arrow.to);
    if (!from || !to) {
      continue;
    }
    const x1 = from.x * 10;
    const y1 = from.y * 7;
    const x2 = to.x * 10;
    const y2 = to.y * 7;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    pieces.push(`<line class="arrow-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#arrowHead)" />`);
    pieces.push(`<text class="arrow-label" x="${mx}" y="${my}">${arrow.card}</text>`);
  }
  ui.arrows.innerHTML = pieces.join('');
}

function formatLog(text) {
  let f = text.replace(/\[(.*?)\]/g, '<span class="log-name">$1</span>');
  f = f.replace(/\b1 damage\b/g, '<span class="log-damage">1 damage</span>');
  f = f.replace(/\b(FACA|PAREDE|REVERSO|VAZIO)\b/g, '<span class="log-card $1">$1</span>');
  f = f.replace(/\b([A-Za-z0-9_]+ foi eliminado!)\b/i, '<span class="log-eliminated">$1</span>');
  return f;
}

function renderLogs() {
  if (!state.public) {
    return;
  }

  const lines = [];
  for (const entry of state.public.logs || []) {
    lines.push(formatLog(entry.text));
  }

  const reveal = state.public.round && state.public.round.reveal;
  if (reveal && Array.isArray(reveal.narration)) {
    for (const line of reveal.narration) {
      lines.push(formatLog(line));
    }
  }

  const newHtml = lines
    .slice(-80)
    .map((line) => `<div class="line">${line}</div>`)
    .join('');
    
  if (ui.logs._cachedHtml !== newHtml) {
    ui.logs.innerHTML = newHtml;
    ui.logs._cachedHtml = newHtml;
    ui.logs.scrollTop = ui.logs.scrollHeight;
  }
}

function canActNow() {
  if (!state.private || !state.private.alive) {
    return false;
  }
  const mePublic = getPlayerById(state.me);
  const round = state.public && state.public.round;
  return Boolean(
    mePublic &&
      mePublic.alive &&
      round &&
      round.phase === 'planning' &&
      !mePublic.submitted
  );
}

function sendActionFromDrag(cardIndex, targetId) {
  if (!canActNow()) {
    return;
  }
  socket.emit('submitAction', {
    cardIndex,
    targetId,
  });
  state.draggingCardIndex = null;
  ui.selectionInfo.textContent = 'Action locked. Waiting for reveal...';
}

function wireDropZone(element, targetId) {
  element.addEventListener('dragover', (event) => {
    if (!canActNow()) {
      return;
    }
    event.preventDefault();
    element.classList.add('drop-hover');
  });

  element.addEventListener('dragleave', () => {
    element.classList.remove('drop-hover');
  });

  element.addEventListener('drop', (event) => {
    if (!canActNow()) {
      return;
    }
    event.preventDefault();
    element.classList.remove('drop-hover');
    const raw = event.dataTransfer.getData('text/card-index');
    const idx = Number(raw);
    if (!Number.isInteger(idx)) {
      return;
    }
    const target = getPlayerById(targetId);
    if (!target || !target.alive) {
      return;
    }
    sendActionFromDrag(idx, targetId);
  });
}

function renderTable() {
  if (state.draggingCardIndex !== null) {
    return; // Never mutate the DOM while a drag is in flight
  }

  if (!state.public) {
    ui.table.querySelectorAll('.player-slot').forEach(el => el.remove());
    ui.arrows.innerHTML = '';
    return;
  }

  const players = getSortedPlayers();
  const positions = getSlotPositions(players);
  
  // Track existing slots to remove stale ones
  const activeIds = new Set(players.map(p => p.id));
  ui.table.querySelectorAll('.player-slot').forEach(el => {
    if (!activeIds.has(el.getAttribute('data-player-id'))) {
      el.remove();
    }
  });

  for (const p of players) {
    const pos = positions.get(p.id);
    const isMe = p.id === state.me;

    let actionText = '-';
    if (state.public.round && state.public.round.phase === 'planning') {
      actionText = p.submitted ? 'LOCKED' : 'WAITING';
    }
    if (state.public.round && state.public.round.phase === 'revealed') {
      const action = getRoundActionForPlayer(p.id);
      if (action) {
        const target = getPlayerById(action.targetId);
        actionText = `${action.card} -> ${target ? target.name.replace(/\s/g, '') : 'Unknown'}`;
      } else {
        actionText = 'NO ACTION';
      }
    }

    const classes = ['player-slot'];
    if (isMe) classes.push('self');
    if (!p.alive) classes.push('dead');
    if (p.isolatedActive) classes.push('isolated');

    let slot = document.getElementById(`slot-${p.id}`);
    if (!slot) {
      slot = document.createElement('div');
      slot.id = `slot-${p.id}`;
      slot.setAttribute('data-player-id', p.id);
      slot.className = classes.join(' ');
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'player-name';
      
      const lifeDiv = document.createElement('div');
      lifeDiv.className = 'player-life';
      
      const actionDiv = document.createElement('div');
      actionDiv.className = 'action-slot anim-flip'; // Start flip effect
      
      slot.appendChild(nameDiv);
      slot.appendChild(lifeDiv);
      slot.appendChild(actionDiv);
      ui.table.appendChild(slot);
      
      wireDropZone(slot, p.id);
    } else {
      // Retain custom animation and interaction classes safely
      const existingClasses = new Set(slot.className.split(' ').filter(Boolean));
      const keeps = ['anim-damage', 'anim-wall', 'anim-reflect', 'drop-hover'];
      keeps.forEach(k => { if (existingClasses.has(k)) classes.push(k); });
      
      const newClassStr = classes.join(' ');
      if (slot.className !== newClassStr) {
        slot.className = newClassStr;
      }
    }

    const newLeft = `${pos.x}%`;
    const newTop = `${pos.y}%`;
    if (slot.style.left !== newLeft) slot.style.left = newLeft;
    if (slot.style.top !== newTop) slot.style.top = newTop;

    const nameEl = slot.querySelector('.player-name');
    if (nameEl.textContent !== p.name) nameEl.textContent = p.name;
    
    const lifeEl = slot.querySelector('.player-life');
    const lifeText = playerLifeSkulls(p);
    if (lifeEl.textContent !== lifeText) lifeEl.textContent = lifeText;

    const actionEl = slot.querySelector('.action-slot');
    if (actionEl.textContent !== actionText) {
      actionEl.textContent = actionText;
      // Trigger flip if revealing
      if (state.public.round && state.public.round.phase === 'revealed') {
        actionEl.classList.remove('anim-flip');
        void actionEl.offsetWidth; // reflow trigger
        actionEl.classList.add('anim-flip');
      }
    }
  }

  renderArrows(positions);
}

function renderHand() {
  if (state.draggingCardIndex !== null) {
    return; // Don't interrupt while the user is actively dragging
  }

  if (!state.private) {
    ui.hand.innerHTML = '<div class="card">Connecting...</div>';
    return;
  }

  if (!state.private.alive) {
    ui.hand.innerHTML = '<div class="card">ELIMINATED</div>';
    return;
  }

  const hand = state.private.hand || [];
  if (!hand.length) {
    ui.hand.innerHTML = '<div class="card">No cards</div>';
    return;
  }

  const canAct = canActNow();
  
  // If we already have exactly 3 cards, just update text and classes
  const existingCards = ui.hand.querySelectorAll('.card[data-card-index]');
  if (existingCards.length === hand.length) {
    existingCards.forEach((cardEl, idx) => {
      cardEl.textContent = hand[idx];
      cardEl.draggable = canAct;
      if (canAct) cardEl.classList.remove('locked');
      else cardEl.classList.add('locked');
    });
    return;
  }

  // Otherwise rebuild (e.g. at the start of a round)
  ui.hand.innerHTML = hand
    .map((card, idx) => {
      const disabledClass = canAct ? '' : 'locked';
      return `<div class="card ${disabledClass}" data-card-index="${idx}" draggable="${canAct ? 'true' : 'false'}">${card}</div>`;
    })
    .join('');

  ui.hand.querySelectorAll('.card').forEach((cardEl) => {
    cardEl.addEventListener('dragstart', (event) => {
      if (!canActNow()) {
        event.preventDefault();
        return;
      }
      const idx = Number(cardEl.getAttribute('data-card-index'));
      state.draggingCardIndex = idx;
      cardEl.classList.add('dragging');
      event.dataTransfer.setData('text/card-index', String(idx));
      event.dataTransfer.effectAllowed = 'move';
      ui.selectionInfo.textContent = 'Drop the card on a player to lock your action.';
    });

    cardEl.addEventListener('dragend', () => {
      cardEl.classList.remove('dragging');
      state.draggingCardIndex = null;
      // Now that drag is done, flush any pending renders
      renderTable();
      renderHand();
    });
  });
}

function renderPhase() {
  const phase = state.public ? state.public.status : 'lobby';
  ui.phaseLabel.textContent = phase.toUpperCase();
}

function renderTimer() {
  const round = state.public && state.public.round;
  if (!round) {
    ui.timer.textContent = 'TIME: --:--';
    ui.globalTimer.textContent = 'ROUND END: --:--';
    return;
  }

  if (round.phase === 'revealed') {
    ui.timer.textContent = 'ANALYZING';
    ui.globalTimer.textContent = 'RESOLVING TURN...';
    return;
  }

  const now = Date.now();
  const globalSeconds = (round.endsAt - now) / 1000;
  ui.globalTimer.textContent = `ROUND END: ${fmtTime(globalSeconds)}`;
  ui.timer.textContent = `TIME: ${fmtTime(globalSeconds)}`;
}

function renderChat() {
  const newHtml = state.chatLines
    .slice(-60)
    .map((msg) => `<div class="line">[${new Date(msg.at).toLocaleTimeString()}] <b>${msg.from}</b>: ${msg.message}</div>`)
    .join('');
  if (ui.chat._cachedHtml !== newHtml) {
    ui.chat.innerHTML = newHtml;
    ui.chat._cachedHtml = newHtml;
    ui.chat.scrollTop = ui.chat.scrollHeight;
  }
}

function renderActionHint() {
  if (!state.private || !state.private.alive) {
    ui.selectionInfo.textContent = 'You are eliminated. Spectating only.';
    return;
  }

  const round = state.public && state.public.round;
  const mePublic = getPlayerById(state.me);
  if (!round || round.phase !== 'planning') {
    ui.selectionInfo.textContent = 'Reveal phase. Watch arrows and outcomes.';
    return;
  }

  if (mePublic && mePublic.submitted) {
    ui.selectionInfo.textContent = 'Action locked. Waiting for others...';
    return;
  }

  ui.selectionInfo.textContent = 'Drag a card to any player slot (including yourself), or click VOID.';
}

function renderIdleButton() {
  ui.idleBtn.disabled = !canActNow();
}

function renderAll() {
  renderPhase();
  renderTimer();
  renderTable();
  renderHand();
  renderLogs();
  renderChat();
  renderActionHint();
  renderIdleButton();
}

ui.idleBtn.addEventListener('click', () => {
  if (!canActNow()) {
    return;
  }
  socket.emit('submitIdleDraw');
  ui.selectionInfo.textContent = 'VOID selected. You will draw +1 card this round.';
});

ui.renameBtn.addEventListener('click', () => {
  const name = ui.nameInput.value.trim();
  if (!name) {
    return;
  }
  socket.emit('rename', { name });
});

ui.sendChatBtn.addEventListener('click', () => {
  const message = ui.chatInput.value.trim();
  if (!message) {
    return;
  }
  socket.emit('chat', { message });
  ui.chatInput.value = '';
});

ui.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    ui.sendChatBtn.click();
  }
});

ui.restartBtn.addEventListener('click', () => {
  socket.emit('restart');
});

socket.on('connect', () => {
  state.me = socket.id;
  renderAll();
});

let lastRoundNumberForAnim = 0;

function playRevealAnimations(events) {
  if (!Array.isArray(events)) return;
  // Trigger animations based on event types
  setTimeout(() => {
    events.forEach((ev) => {
      if (ev.type === 'damage') {
        const slot = document.getElementById(`slot-${ev.targetId}`);
        if (slot) {
          slot.classList.remove('anim-damage');
          void slot.offsetWidth; // Reflow
          slot.classList.add('anim-damage');
        }
      }
      if (ev.type === 'wall_create' || ev.type === 'reflect' && ev.card === 'PAREDE') {
        const targetId = ev.type === 'reflect' ? ev.against : ev.targetId;
        const slot = document.getElementById(`slot-${targetId}`);
        if (slot) {
          slot.classList.remove('anim-wall');
          void slot.offsetWidth; // Reflow
          slot.classList.add('anim-wall');
        }
      }
      if (ev.type === 'reflect' && ev.card === 'FACA') {
        const slot = document.getElementById(`slot-${ev.by}`);
        if (slot) {
          slot.classList.remove('anim-reflect');
          void slot.offsetWidth; // Reflow
          slot.classList.add('anim-reflect');
        }
      }
    });
  }, 200); // Slight delay for aesthetic feel
}

socket.on('state', (payload) => {
  const isNewReveal = payload.round 
                       && payload.round.phase === 'revealed' 
                       && payload.round.number > lastRoundNumberForAnim;

  state.public = payload;
  
  if (payload.round && payload.round.phase === 'revealed') {
    lastRoundNumberForAnim = payload.round.number;
  }

  renderAll();

  if (isNewReveal && payload.round.reveal) {
    playRevealAnimations(payload.round.reveal.events);
  }
});

socket.on('privateState', (payload) => {
  state.private = payload;
  renderAll();
});

socket.on('chat', (payload) => {
  state.chatLines.push(payload);
  renderChat();
});

socket.on('actionRejected', (payload) => {
  ui.selectionInfo.textContent = `Action rejected: ${payload.reason}`;
});

socket.on('lobbyError', (payload) => {
  ui.selectionInfo.textContent = payload.message;
});

if (state.timerIntervalId) {
  clearInterval(state.timerIntervalId);
}
state.timerIntervalId = setInterval(() => {
  renderTimer();
}, 200);

renderAll();

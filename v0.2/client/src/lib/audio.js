/**
 * STRIKE/VOID audio engine — 100% procedural (Web Audio API), sem arquivos externos.
 * - MÚSICA DINÂMICA: tema ocultista/industrial (estilo Inscryption + Buckshot Roulette).
 *   Fica mais intensa quanto menos vidas o jogador tem:
 *     - 3 Vidas: Sub-bass profundo, pulso misterioso, sinos atmosféricos e ticking suave.
 *     - 2 Vidas: Kick industrial pesado, baixo sintetizado ritmado, caixa/metal e arpejo sombrio.
 *     - 1 Vida: Pânico mortal! Batida rápida, baixo distorcido agressivo, pratos implacáveis e alarmes dissonantes.
 * - SOM AMBIENTE: Ativo APENAS quando o jogador está ASSISTINDO (espectador / eliminado),
 *   criando o silêncio fúnebre do vácuo com vento, madeira rangendo e estalos de vela.
 * - SFX de gameplay sincronizados com as fases.
 */

const STORAGE_KEY = 'strikevoid.audio.v2';

function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (p && typeof p === 'object') {
      return { muted: false, music: 0.7, ambient: 0.6, sfx: 0.8, ...p };
    }
  } catch (e) {
    /* ignore */
  }
  return { muted: false, music: 0.7, ambient: 0.6, sfx: 0.8 };
}

const prefs = loadPrefs();

let ctx = null;
let master = null;
let sfxBus = null;
let ambBus = null;
let ambFadeGain = null;
let musicBus = null;
let musicFadeGain = null;
let noiseBuf = null;

let ambStarted = false;
let eventTimer = null;

// Sequenciador de música
const BPM = 116;
const STEP_TIME = 60 / BPM / 4; // 16th note (~0.1293s)
let musicTimer = null;
let nextStepTime = 0;
let current16thStep = 0;
let musicPlaying = false;
let musicIntensity = 1; // 1 (3 vidas), 2 (2 vidas), 3 (1 vida)
let clockTension = 0;

const rand = (a, b) => a + Math.random() * (b - a);

/* ------------------------------------------------------------------ */
/* Inicialização do Grafo de Áudio                                    */
/* ------------------------------------------------------------------ */
function makeImpulse(seconds, decay) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();

  master = ctx.createGain();
  master.gain.value = prefs.muted ? 0 : 1;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.knee.value = 10;
  comp.ratio.value = 5;
  comp.attack.value = 0.005;
  comp.release.value = 0.15;
  master.connect(comp).connect(ctx.destination);

  const convolver = ctx.createConvolver();
  convolver.buffer = makeImpulse(2.2, 3.2);
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  convolver.connect(wet).connect(master);

  // Barramento de SFX
  sfxBus = ctx.createGain();
  sfxBus.gain.value = prefs.sfx;
  sfxBus.connect(master);
  sfxBus.connect(convolver);

  // Barramento de Música (com fade gain)
  musicBus = ctx.createGain();
  musicBus.gain.value = prefs.music;
  musicFadeGain = ctx.createGain();
  musicFadeGain.gain.value = 0; // Começa em 0 até a partida ativar
  musicFadeGain.connect(master);

  const musicRevSend = ctx.createGain();
  musicRevSend.gain.value = 0.18;
  musicFadeGain.connect(musicRevSend).connect(convolver);
  musicBus.connect(musicFadeGain);

  // Barramento de Ambiente (com fade gain para tocar apenas espectando)
  ambBus = ctx.createGain();
  ambBus.gain.value = prefs.ambient * 0.8;
  ambFadeGain = ctx.createGain();
  ambFadeGain.gain.value = 1; // Padrão no lobby/espectador
  ambFadeGain.connect(master);

  const ambSend = ctx.createGain();
  ambSend.gain.value = 0.35;
  ambFadeGain.connect(ambSend).connect(convolver);
  ambBus.connect(ambFadeGain);

  // Buffer de ruído reutilizável
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  return ctx;
}

/* ------------------------------------------------------------------ */
/* Primitivas de Síntese                                              */
/* ------------------------------------------------------------------ */
function tone({ freq, to, type = 'sine', t, dur = 0.2, vol = 0.2, attack = 0.005, bus }) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(20, freq), t);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus || sfxBus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise({ t, dur = 0.2, vol = 0.2, type = 'bandpass', f1 = 1000, f2, q = 1, attack = 0.003, bus }) {
  if (!ctx || !noiseBuf) return;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(Math.max(30, f1), t);
  if (f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(bus || sfxBus);
  s.start(t, Math.random());
  s.stop(t + dur + 0.05);
}

function bell(t, freq, dur = 1.4, vol = 0.12) {
  tone({ freq, type: 'sine', t, dur, vol, attack: 0.004 });
  tone({ freq: freq * 2.76, type: 'sine', t, dur: dur * 0.45, vol: vol * 0.35, attack: 0.004 });
  tone({ freq: freq * 1.003, type: 'triangle', t, dur: dur * 0.8, vol: vol * 0.4, attack: 0.004 });
}

function rattle(t, n, spacing, vol = 0.1, descending = false) {
  for (let i = 0; i < n; i++) {
    noise({
      t: t + i * spacing + rand(0, 0.015),
      dur: 0.05,
      vol: vol * (descending ? 1 - i / (n + 1) : 1),
      type: 'highpass',
      f1: rand(3500, 6500),
      q: 2,
    });
  }
}

/* ------------------------------------------------------------------ */
/* MOTOR DE MÚSICA DINÂMICA (Inscryption + Buckshot Roulette Style)    */
/* ------------------------------------------------------------------ */
function synthKick(t, level) {
  if (!ctx) return;
  // Sweep de frequência
  const o = ctx.createOscillator();
  const startF = level === 3 ? 165 : level === 2 ? 140 : 95;
  const endF = level === 3 ? 32 : 38;
  const dur = level === 3 ? 0.35 : 0.25;
  o.frequency.setValueAtTime(startF, t);
  o.frequency.exponentialRampToValueAtTime(endF, t + 0.09);

  const g = ctx.createGain();
  const v = level === 3 ? 0.85 : level === 2 ? 0.65 : 0.35;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.02);

  // Click transient metálico
  if (level >= 2) {
    noise({
      t,
      dur: 0.02,
      vol: level === 3 ? 0.25 : 0.12,
      type: 'highpass',
      f1: 3000,
      bus: musicBus,
    });
  }
}

function synthSnare(t, level) {
  if (!ctx) return;
  const dur = level === 3 ? 0.22 : 0.16;
  noise({
    t,
    dur,
    vol: level === 3 ? 0.38 : 0.22,
    type: 'bandpass',
    f1: 1800,
    f2: 700,
    q: 1.5,
    bus: musicBus,
  });
  // Corpo tonal
  tone({
    freq: 210,
    to: 85,
    type: 'triangle',
    t,
    dur: 0.1,
    vol: level === 3 ? 0.3 : 0.18,
    bus: musicBus,
  });
}

function synthHat(t, open = false, level = 1) {
  if (!ctx) return;
  const dur = open ? 0.14 : 0.035;
  const vol = (open ? 0.16 : 0.08) * (level === 3 ? 1.3 : 1);
  noise({
    t,
    dur,
    vol,
    type: 'highpass',
    f1: open ? 6000 : 7800,
    q: 2,
    bus: musicBus,
  });
}

function synthBass(t, freq, dur, level) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();

  if (level === 1) {
    // 3 Vidas: Sub-bass profundo e misterioso
    o.type = 'sine';
    f.type = 'lowpass';
    f.frequency.value = 140;
    f.Q.value = 1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  } else if (level === 2) {
    // 2 Vidas: Baixo sintetizado com punch e filtro ressonante
    o.type = 'sawtooth';
    f.type = 'lowpass';
    f.Q.value = 4.5;
    f.frequency.setValueAtTime(650, t);
    f.frequency.exponentialRampToValueAtTime(160, t + dur * 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  } else {
    // 1 Vida: Pânico mortal! Baixo distorcido, agressivo e rasgante
    o.type = 'sawtooth';
    f.type = 'lowpass';
    f.Q.value = 6;
    f.frequency.setValueAtTime(1900, t);
    f.frequency.exponentialRampToValueAtTime(260, t + dur * 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.45, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  o.frequency.setValueAtTime(freq, t);
  o.connect(f).connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function synthArp(t, freq, level) {
  if (!ctx) return;
  const dur = level === 3 ? 0.09 : 0.12;
  const o = ctx.createOscillator();
  o.type = level === 3 ? 'sawtooth' : 'triangle';
  o.frequency.setValueAtTime(freq, t);

  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = level === 3 ? 2400 : 1300;
  f.Q.value = 3.5;

  const g = ctx.createGain();
  const vol = level === 3 ? 0.14 : level === 2 ? 0.09 : 0.05;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.connect(f).connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function alarmStab(t) {
  if (!ctx) return;
  // Dissonância apavorante de advertência (A5 + Bb5)
  [880, 932.3].forEach((freq) => {
    tone({
      freq,
      type: 'sawtooth',
      t,
      dur: 0.18,
      vol: 0.08,
      attack: 0.005,
      bus: musicBus,
    });
  });
}

/* ------------------------------------------------------------------ */
/* SEQUENCIADOR DE MÚSICA (32 passos = 2 compassos)                    */
/* ------------------------------------------------------------------ */
// Progressão em Ré menor: D -> F -> G -> A/Ab
const BASS_NOTES_BAR1 = [36.7, 36.7, 43.6, 43.6]; // D1, F1
const BASS_NOTES_BAR2 = [49.0, 49.0, 51.9, 55.0]; // G1, Ab1, A1
const ARP_PATTERN = [
  293.7, 349.2, 440.0, 587.3, 523.3, 440.0, 349.2, 440.0,
  293.7, 349.2, 415.3, 587.3, 523.3, 415.3, 349.2, 329.6,
  293.7, 392.0, 466.2, 587.3, 523.3, 466.2, 392.0, 466.2,
  277.2, 329.6, 440.0, 554.4, 440.0, 392.0, 329.6, 277.2,
];

function scheduleStep(step, t) {
  const lvl = musicIntensity;

  /* 1. BATERIA */
  if (lvl === 1) {
    // 3 Vidas: minimalista, kick suave no início de cada compasso
    if (step === 0 || step === 16) synthKick(t, 1);
    if (step % 4 === 0) synthHat(t, false, 1);
  } else if (lvl === 2) {
    // 2 Vidas: kick nos tempos 1 e 3, caixa nos tempos 2 e 4, pratos constantes
    if (step === 0 || step === 8 || step === 16 || step === 24 || step === 14 || step === 30) {
      synthKick(t, 2);
    }
    if (step === 4 || step === 12 || step === 20 || step === 28) {
      synthSnare(t, 2);
    }
    synthHat(t, step === 10 || step === 26, 2);
  } else if (lvl === 3) {
    // 1 Vida: Pânico total! Four-on-the-floor + sincopados e pratos implacáveis
    if (step % 4 === 0 || step === 6 || step === 14 || step === 22 || step === 30) {
      synthKick(t, 3);
    }
    if (step === 4 || step === 12 || step === 20 || step === 28 || step === 7 || step === 23) {
      synthSnare(t, 3);
    }
    synthHat(t, step % 4 === 2, 3);
    if (step === 0 || step === 16) alarmStab(t);
  }

  /* 2. BAIXO */
  const bar = Math.floor(step / 16);
  const beat = Math.floor((step % 16) / 4);
  const rootFreq = bar === 0 ? BASS_NOTES_BAR1[beat] : BASS_NOTES_BAR2[beat];

  if (lvl === 1) {
    // Notas longas sustentadas
    if (step % 8 === 0) synthBass(t, rootFreq, STEP_TIME * 6.5, 1);
  } else if (lvl === 2) {
    // Ritmo sincopado envolvente
    if (step % 2 === 0 || step % 4 === 3) {
      const octJump = step % 4 === 3 ? rootFreq * 2 : rootFreq;
      synthBass(t, octJump, STEP_TIME * 1.5, 2);
    }
  } else if (lvl === 3) {
    // Ritmo galopante agressivo em todas as semicolcheias
    const octave = (step % 4 === 1 || step % 4 === 3) ? rootFreq * 2 : rootFreq;
    synthBass(t, octave, STEP_TIME * 0.95, 3);
  }

  /* 3. ARPEJO & ATMOSFERA */
  if (lvl === 1) {
    if (step === 0) tone({ freq: 293.7, type: 'sine', t, dur: 2.8, vol: 0.1, bus: musicBus });
    if (step === 16) tone({ freq: 440.0, type: 'sine', t, dur: 2.8, vol: 0.08, bus: musicBus });
  } else if (lvl === 2) {
    if (step % 2 === 0) synthArp(t, ARP_PATTERN[step], 2);
  } else if (lvl === 3) {
    synthArp(t, ARP_PATTERN[step], 3);
  }
}

function musicScheduler() {
  if (!ctx || !musicPlaying) return;
  const scheduleAhead = 0.12; // 120ms lookahead
  while (nextStepTime < ctx.currentTime + scheduleAhead) {
    scheduleStep(current16thStep, nextStepTime);
    nextStepTime += STEP_TIME;
    current16thStep = (current16thStep + 1) % 32;
  }
}

function startMusicEngine() {
  if (musicPlaying || !ctx) return;
  musicPlaying = true;
  nextStepTime = ctx.currentTime + 0.05;
  current16thStep = 0;
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = setInterval(musicScheduler, 25);
}

function stopMusicEngine() {
  musicPlaying = false;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

/* ------------------------------------------------------------------ */
/* SFX DE GAMEPLAY                                                    */
/* ------------------------------------------------------------------ */
const SFX = {
  click: (t) => {
    tone({ freq: 620, to: 320, type: 'triangle', t, dur: 0.06, vol: 0.14 });
    noise({ t, dur: 0.03, vol: 0.06, type: 'highpass', f1: 3000 });
  },
  select: (t) => {
    tone({ freq: 330, type: 'triangle', t, dur: 0.1, vol: 0.14 });
    tone({ freq: 495, type: 'sine', t: t + 0.04, dur: 0.14, vol: 0.1 });
    noise({ t, dur: 0.05, vol: 0.08, f1: 2500, f2: 1500 });
  },
  shuffle: (t) => {
    for (let i = 0; i < 7; i++) {
      noise({ t: t + i * 0.045, dur: 0.07, vol: 0.12, f1: rand(1800, 3500), f2: rand(900, 1800), q: 0.8 });
    }
  },
  deal: (t) => {
    noise({ t, dur: 0.12, vol: 0.28, f1: 3200, f2: 1100, q: 0.9 });
    tone({ freq: 140, to: 60, type: 'sine', t: t + 0.05, dur: 0.1, vol: 0.2 });
  },
  lock: (t) => {
    tone({ freq: 160, to: 55, t, dur: 0.16, vol: 0.5 });
    noise({ t, dur: 0.07, vol: 0.18, type: 'lowpass', f1: 900 });
    tone({ freq: 520, to: 380, type: 'square', t: t + 0.02, dur: 0.05, vol: 0.04 });
  },
  lockOther: (t) => {
    tone({ freq: 130, to: 60, t, dur: 0.14, vol: 0.18 });
    noise({ t, dur: 0.05, vol: 0.06, type: 'lowpass', f1: 700 });
  },
  flip: (t) => {
    noise({ t, dur: 0.22, vol: 0.2, f1: 1200, f2: 4000, q: 0.8 });
    noise({ t: t + 0.2, dur: 0.04, vol: 0.2, type: 'highpass', f1: 4000 });
    tone({ freq: 240, to: 120, type: 'triangle', t: t + 0.2, dur: 0.07, vol: 0.12 });
  },
  knife: (t) => {
    noise({ t, dur: 0.18, vol: 0.3, type: 'highpass', f1: 2200, f2: 9000, q: 1.2 });
    tone({ freq: 2400, type: 'sine', t: t + 0.02, dur: 0.5, vol: 0.05 });
    tone({ freq: 3180, type: 'sine', t: t + 0.02, dur: 0.38, vol: 0.04 });
    tone({ freq: 1500, to: 900, type: 'sawtooth', t, dur: 0.12, vol: 0.05 });
  },
  damage: (t) => {
    tone({ freq: 95, to: 38, t, dur: 0.45, vol: 0.7 });
    noise({ t, dur: 0.22, vol: 0.32, type: 'lowpass', f1: 1400, f2: 200 });
    tone({ freq: 200, to: 60, type: 'sawtooth', t, dur: 0.22, vol: 0.12 });
    noise({ t: t + 0.05, dur: 0.12, vol: 0.12, type: 'bandpass', f1: 900, q: 3 });
  },
  wall: (t) => {
    [[220, 0.7], [347, 0.5], [523, 0.35], [811, 0.22]].forEach(([f, v]) => tone({ freq: f, type: 'triangle', t, dur: 0.9, vol: 0.12 * v }));
    noise({ t, dur: 0.06, vol: 0.2, type: 'bandpass', f1: 2000, q: 2 });
    rattle(t + 0.08, 7, 0.05, 0.1, true);
  },
  wallBreak: (t) => {
    noise({ t, dur: 0.6, vol: 0.4, type: 'bandpass', f1: 1800, f2: 400, q: 0.5 });
    [[180, 1], [293, 0.7], [457, 0.5], [733, 0.4]].forEach(([f, v]) => tone({ freq: f, to: f * 0.8, type: 'sawtooth', t, dur: 0.5, vol: 0.09 * v }));
    tone({ freq: 70, to: 35, t, dur: 0.4, vol: 0.4 });
    rattle(t + 0.12, 10, 0.045, 0.14, true);
  },
  reflect: (t) => {
    tone({ freq: 1200, to: 2600, t, dur: 0.35, vol: 0.1 });
    tone({ freq: 1800, to: 700, t, dur: 0.4, vol: 0.08 });
    [880, 1320, 1760].forEach((f, i) => bell(t + 0.12 + i * 0.07, f, 0.9, 0.08));
    noise({ t, dur: 0.35, vol: 0.08, type: 'highpass', f1: 5000 });
  },
  vacuum: (t) => {
    noise({ t, dur: 1.0, vol: 0.38, type: 'bandpass', f1: 3200, f2: 160, q: 1.4, attack: 0.15 });
    tone({ freq: 420, to: 38, type: 'sine', t, dur: 1.0, vol: 0.35, attack: 0.1 });
    tone({ freq: 90, to: 30, t: t + 0.95, dur: 0.4, vol: 0.6 });
  },
  death: (t) => {
    [110, 164.8, 220.5].forEach((f, i) => tone({ freq: f, type: 'sine', t: t + i * 0.01, dur: 2.6, vol: 0.2 - i * 0.04, attack: 0.01 }));
    tone({ freq: 74, to: 30, t, dur: 1.4, vol: 0.5 });
    noise({ t, dur: 0.5, vol: 0.12, type: 'lowpass', f1: 600, f2: 120 });
  },
  bell: (t) => {
    bell(t, 392, 1.4, 0.11);
    bell(t + 0.01, 784, 1.0, 0.05);
  },
  analysis: (t) => {
    bell(t, 294, 1.8, 0.09);
  },
  tick: (t) => {
    tone({ freq: 950, type: 'sine', t, dur: 0.05, vol: 0.14 });
  },
  tickUrgent: (t) => {
    tone({ freq: 1250, type: 'square', t, dur: 0.05, vol: 0.06 });
    tone({ freq: 80, to: 50, t, dur: 0.12, vol: 0.4 });
  },
  error: (t) => {
    tone({ freq: 130, type: 'sawtooth', t, dur: 0.14, vol: 0.14 });
    tone({ freq: 118, type: 'sawtooth', t: t + 0.16, dur: 0.2, vol: 0.14 });
  },
  win: (t) => {
    [392, 466.2, 587.3, 784].forEach((f, i) => bell(t + i * 0.2, f, 2.2, 0.13));
    tone({ freq: 98, type: 'sine', t, dur: 2.5, vol: 0.2 });
  },
  lose: (t) => {
    [330, 262, 196, 147].forEach((f, i) => {
      tone({ freq: f, type: 'triangle', t: t + i * 0.35, dur: 1.4, vol: 0.14 });
      tone({ freq: f / 2, type: 'sine', t: t + i * 0.35, dur: 1.6, vol: 0.14 });
    });
  },
};

/* ------------------------------------------------------------------ */
/* SOM AMBIENTE (Somente para ESPECTADOR / ELIMINADO / ASSISTINDO)     */
/* ------------------------------------------------------------------ */
const AMBIENT_EVENTS = [
  // Madeira rangendo
  (t) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const f0 = rand(70, 130);
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0 * rand(0.7, 1.3), t + 0.9);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = rand(250, 500);
    bp.Q.value = 9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.25);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.9);
    o.connect(bp).connect(g).connect(ambBus);
    o.start(t);
    o.stop(t + 1);
  },
  // Vela crepitando
  (t) => {
    const n = Math.floor(rand(3, 7));
    for (let i = 0; i < n; i++) {
      noise({ t: t + rand(0, 0.7), dur: 0.025, vol: rand(0.04, 0.1), type: 'highpass', f1: rand(2500, 5000), q: 1.5, bus: ambBus });
    }
  },
  // Batida distante no escuro
  (t) => {
    tone({ freq: 62, to: 38, t, dur: 0.45, vol: 0.22, bus: ambBus });
    tone({ freq: 70, to: 40, t: t + 0.22, dur: 0.35, vol: 0.14, bus: ambBus });
  },
  // Sussurro do vento do vácuo
  (t) => {
    noise({ t, dur: 2.8, vol: 0.11, type: 'bandpass', f1: rand(300, 600), f2: rand(900, 1500), q: 1.2, attack: 1.2, bus: ambBus });
  },
];

function scheduleAmbientEvent() {
  eventTimer = setTimeout(() => {
    if (ctx && ctx.state === 'running' && !prefs.muted && ambFadeGain && ambFadeGain.gain.value > 0.05) {
      AMBIENT_EVENTS[Math.floor(Math.random() * AMBIENT_EVENTS.length)](ctx.currentTime + 0.05);
    }
    scheduleAmbientEvent();
  }, rand(3500, 9000));
}

function startAmbientGenerators() {
  if (ambStarted || !ctx) return;
  ambStarted = true;

  // Drone sombrio
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 180;
  lp.Q.value = 2.5;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.55;
  [
    [55, 'sawtooth', 0.2],
    [55.45, 'sawtooth', 0.2],
    [82.4, 'sine', 0.2],
    [110.3, 'triangle', 0.12],
  ].forEach(([f, type, v]) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = v;
    o.connect(g).connect(lp);
    o.start();
  });
  lp.connect(droneGain).connect(ambBus);

  // Vento espectral
  const wind = ctx.createBufferSource();
  wind.buffer = noiseBuf;
  wind.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 500;
  bp.Q.value = 0.8;
  const windG = ctx.createGain();
  windG.gain.value = 0.12;
  wind.connect(bp).connect(windG).connect(ambBus);
  wind.start();

  scheduleAmbientEvent();
}

/* ------------------------------------------------------------------ */
/* CONTROLE DE ESTADO DO JOGADOR (MÚSICA vs AMBIENTE)                  */
/* ------------------------------------------------------------------ */
let currentMode = 'lobby'; // 'playing' | 'spectating' | 'lobby' | 'game_over'

function updateModes() {
  if (!ctx) return;
  const t = ctx.currentTime;

  if (currentMode === 'playing') {
    // JOGANDO: Música ativa, som ambiente mutado!
    startMusicEngine();
    if (musicFadeGain) musicFadeGain.gain.setTargetAtTime(1, t, 0.4);
    if (ambFadeGain) ambFadeGain.gain.setTargetAtTime(0.0001, t, 0.6);
  } else if (currentMode === 'spectating') {
    // ASSISTINDO: Música parada, som ambiente ativo na mesa vazia/espectador!
    if (musicFadeGain) musicFadeGain.gain.setTargetAtTime(0.0001, t, 0.8);
    setTimeout(() => {
      if (currentMode === 'spectating') stopMusicEngine();
    }, 1000);
    startAmbientGenerators();
    if (ambFadeGain) ambFadeGain.gain.setTargetAtTime(1, t, 0.6);
  } else if (currentMode === 'game_over') {
    if (musicFadeGain) musicFadeGain.gain.setTargetAtTime(0.0001, t, 1.2);
    if (ambFadeGain) ambFadeGain.gain.setTargetAtTime(0.4, t, 1.2);
  } else {
    // LOBBY: Música desligada, ambiente suave de espera
    stopMusicEngine();
    startAmbientGenerators();
    if (musicFadeGain) musicFadeGain.gain.setValueAtTime(0, t);
    if (ambFadeGain) ambFadeGain.gain.setTargetAtTime(0.6, t, 0.6);
  }
}

/* ------------------------------------------------------------------ */
/* API PÚBLICA                                                        */
/* ------------------------------------------------------------------ */
function unlock() {
  if (!ensure()) return;
  const go = () => {
    startAmbientGenerators();
    updateModes();
  };
  if (ctx.state === 'suspended') ctx.resume().then(go).catch(() => {});
  else go();
}

if (typeof window !== 'undefined') {
  const onGesture = () => {
    unlock();
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    }
  };
  window.addEventListener('pointerdown', onGesture);
  window.addEventListener('keydown', onGesture);
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  });
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    /* ignore */
  }
}

export const audio = {
  /** Toca um efeito sonoro instantâneo ou com delay */
  play(name, delay = 0) {
    if (!ctx || ctx.state !== 'running' || prefs.muted) return;
    const fn = SFX[name];
    if (fn) fn(ctx.currentTime + 0.01 + delay);
  },

  getPrefs: () => ({ ...prefs }),

  setMuted(m) {
    prefs.muted = !!m;
    if (master) master.gain.setTargetAtTime(prefs.muted ? 0 : 1, ctx.currentTime, 0.05);
    save();
    if (!prefs.muted) unlock();
  },

  setMusicVolume(v) {
    prefs.music = v;
    if (musicBus) musicBus.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
    save();
  },

  setAmbientVolume(v) {
    prefs.ambient = v;
    if (ambBus) ambBus.gain.setTargetAtTime(v * 0.8, ctx.currentTime, 0.05);
    save();
  },

  setSfxVolume(v) {
    prefs.sfx = v;
    if (sfxBus) sfxBus.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
    save();
  },

  /**
   * Atualiza o estado do jogador na mesa:
   * - inGame: se a partida está rodando (fase !== LOBBY && !== GAME_OVER)
   * - isAlive: se o jogador local está vivo
   * - lives: quantidade de vidas atuais (3, 2, 1)
   */
  setPlayerState({ inGame, isAlive, lives, phase }) {
    if (!inGame || phase === 'LOBBY') {
      currentMode = 'lobby';
    } else if (phase === 'GAME_OVER') {
      currentMode = 'game_over';
    } else if (isAlive) {
      currentMode = 'playing';
      // Ajusta intensidade da música conforme as vidas restantes:
      // 3 Vidas = intensidade 1 | 2 Vidas = intensidade 2 | 1 Vida = intensidade 3 (pânico máximo)
      if (lives >= 3) musicIntensity = 1;
      else if (lives === 2) musicIntensity = 2;
      else musicIntensity = 3;
    } else {
      // Morto ou espectador: assistindo da escuridão -> apenas som ambiente!
      currentMode = 'spectating';
    }
    updateModes();
  },

  setClockTension(v) {
    clockTension = v;
  },

  unlock,
};

export default audio;

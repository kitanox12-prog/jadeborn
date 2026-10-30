'use strict';
/* ===================== CORE ===================== */
const TILE = 32;
var TOUCH_UI = false;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, s) { return vnoise(x, y, s) * .55 + vnoise(x * 2.1, y * 2.1, s + 7) * .3 + vnoise(x * 4.3, y * 4.3, s + 13) * .15; }

function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function load(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

/* ---------- Canvas ---------- */
const cv = $('game'), ctx = cv.getContext('2d');
const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
let W = 0, H = 0, ZOOM = 1, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  ZOOM = (W < 820 || H < 520) ? 0.78 : 1;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  lightCv.width = Math.ceil(W / 2); lightCv.height = Math.ceil(H / 2);
}
window.addEventListener('resize', resize);
resize();

/* ---------- Input ---------- */
const keys = {};
const mouse = { x: 0, y: 0, wx: 0, wy: 0 };
let uiBlocking = () => false;
window.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) e.preventDefault();
  if (!keys[k]) onKeyPress(k, e);
  keys[k] = true;
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* ---------- Audio (synthesized) ---------- */
const SND = {
  ctx: null, on: true, master: null, musicGain: null, musicTimer: null,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.16; this.musicGain.connect(this.master);
      this.startMusic();
    } catch (e) { this.ctx = null; }
  },
  toggle() { this.on = !this.on; if (this.master) this.master.gain.value = this.on ? 0.5 : 0; return this.on; },
  tone(freq, dur, type = 'sine', vol = 0.2, slide = 0, delay = 0, dest) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.2, hp = 800, delay = 0) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + delay;
    const n = Math.floor(this.ctx.sampleRate * dur), buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
  },
  sfx(name) {
    switch (name) {
      case 'hit': this.noise(0.08, 0.25, 1400); this.tone(160, 0.08, 'square', 0.06, -60); break;
      case 'crit': this.noise(0.12, 0.35, 900); this.tone(220, 0.12, 'sawtooth', 0.08, -120); break;
      case 'slash': this.noise(0.1, 0.18, 2500); break;
      case 'cast': this.tone(520, 0.18, 'triangle', 0.08, 380); this.tone(780, 0.14, 'sine', 0.05, 200, 0.04); break;
      case 'heal': [523, 659, 784].forEach((f, i) => this.tone(f, 0.35, 'sine', 0.07, 0, i * 0.06)); break;
      case 'shield': this.tone(330, 0.4, 'triangle', 0.08, 220); break;
      case 'roar': this.tone(110, 0.4, 'sawtooth', 0.12, -40); this.noise(0.3, 0.12, 300); break;
      case 'whirl': this.noise(0.35, 0.22, 1800); this.tone(300, 0.3, 'triangle', 0.05, -150); break;
      case 'boom': this.noise(0.5, 0.4, 120); this.tone(70, 0.5, 'sine', 0.25, -30); break;
      case 'pickup': this.tone(880, 0.1, 'triangle', 0.08); this.tone(1320, 0.14, 'triangle', 0.06, 0, 0.07); break;
      case 'coin': this.tone(1200, 0.08, 'square', 0.04); this.tone(1600, 0.1, 'square', 0.035, 0, 0.06); break;
      case 'quest': [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.08, 0, i * 0.09)); break;
      case 'level': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.6, 'triangle', 0.09, 0, i * 0.08)); break;
      case 'ui': this.tone(660, 0.05, 'square', 0.03); break;
      case 'deny': this.tone(140, 0.12, 'square', 0.05); break;
      case 'die': this.tone(240, 0.6, 'sawtooth', 0.08, -180); break;
      case 'burst': this.noise(0.8, 0.3, 400); [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.9, 'sine', 0.08, 0, i * 0.05)); break;
      case 'tele': this.tone(200, 0.25, 'sine', 0.05, 300); break;
      case 'beacon': [262, 330, 392, 523, 659, 784].forEach((f, i) => this.tone(f, 1.2, 'triangle', 0.07, 0, i * 0.12)); break;
    }
  },
  startMusic() {
    // gentle generative pad: D dorian drone + sparse plucked arpeggio
    const scale = [146.83, 164.81, 174.61, 196, 220, 246.94, 261.63, 293.66, 329.63, 349.23, 392];
    let step = 0;
    const play = () => {
      if (!this.ctx) return;
      if (this.on) {
        const bar = Math.floor(step / 8);
        const roots = [0, 3, 5, 4];
        const r = roots[bar % 4];
        if (step % 8 === 0) {
          [0, 2, 4].forEach(i => this.tone(scale[(r + i) % scale.length] / 2, 3.6, 'sine', 0.05, 0, 0, this.musicGain));
        }
        if (Math.random() < 0.55) {
          const n = scale[(r + pick([0, 2, 4, 7, 9])) % scale.length] * (Math.random() < 0.3 ? 2 : 1);
          this.tone(n, 1.2, 'triangle', 0.035, 0, 0, this.musicGain);
        }
      }
      step++;
      this.musicTimer = setTimeout(play, 450);
    };
    play();
  }
};

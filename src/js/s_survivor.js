/* ===================== SURVIVOR MODE ("Lantern Dreams") =====================
   A separate, run-based mode: endless waves, auto-firing skills, XP gems, upgrade cards, evolutions,
   elites at 5:00 and 10:00, the dream's keeper at 15:00 and permanent Lantern Forge upgrades.
   It never touches the story save. The arena is a 3x3 tiling of one 40x40 pattern; when the heroes leave
   the middle copy everything is shifted by one pattern width, so the field feels endless. */
G.mode = 'story';
const SV_META_KEY = 'jadeborn_survivor_meta';
const SV_RUN_LEN = 15 * 60, SV_PER = 40, SV_N = SV_PER * 3, SV_CAP3 = 420;
const IS3D = typeof build3DZone === 'function';

const SV_STAGES = [
  { id: 'meadow', name: 'Brightfield Dreams', blurb: 'Wolves and thorn sprites under a bruised sky. The gentlest dream.', style: 'meadow', canopy: 'oak', dark: .22, tint: '#1a1440', mult: 1, amb: 'brightfield',
    roster: [[0, 'wolf', 6], [0, 'sprite', 2], [50, 'pup', 6], [150, 'wolf', 8], [240, 'sprite', 4], [330, 'alpha', 1], [450, 'pup', 10], [600, 'wolf', 10]], elite: ['alpha', 'alpha'], boss: 'gnarl' },
  { id: 'mire', name: 'Murkfen Nightmare', blurb: 'Lurkers, wisps that spit cold light and spiders in the fog.', style: 'marsh', canopy: 'dead', dark: .3, tint: '#06201a', mult: 1.5, fog: true, amb: 'murkfen',
    roster: [[0, 'mireling', 6], [0, 'lurker', 2], [50, 'wisp', 3], [150, 'spider', 6], [270, 'lurker', 6], [420, 'wisp', 5], [540, 'mireling', 14]], elite: ['hulk', 'hulk'], boss: 'witch', req: 'meadow' },
  { id: 'keep', name: 'The Endless Keep', blurb: 'Hollow Knights, shade archers and wraiths in halls that never end.', style: 'keep', canopy: 'dead', dark: .32, tint: '#140a26', mult: 2.2, amb: 'keep',
    roster: [[0, 'wraith', 5], [0, 'knight', 2], [50, 'archer', 3], [180, 'knight', 5], [300, 'wraith', 9], [450, 'archer', 6]], elite: ['knight', 'knight'], boss: 'king', req: 'mire' },
  { id: 'peak', name: 'Frostspire Peak', blurb: 'White wolves, frostcallers and ice giants at the top of the world.', style: 'snow', canopy: 'pine', dark: .26, tint: '#0a1438', mult: 3, snow: true, amb: 'frostspire',
    roster: [[0, 'frostwolf', 6], [0, 'rimeling', 3], [50, 'frostcaller', 3], [180, 'rimewraith', 6], [300, 'frostwolf', 10], [450, 'frostcaller', 6]], elite: ['golem', 'golem'], boss: 'wyrm', req: 'keep' },
];
// stage difficulty steepens the curves instead of raising the start, so every dream opens fair
function svHpCurve(min, m = 1) { return 38 * (1 + .5 * min * m + .09 * min * min * m); }
function svAtkCurve(min, m = 1) { return 7 * (1 + .25 * min * m + .04 * min * min * m); }

/* ---------- Auto-firing skills ---------- */
const SVW = {
  // Orhun
  slash: { hero: 'orhun', name: "Duelist's Edge", icon: 'sword', max: 6, evo: 'p_might', evoName: 'Dawnbreaker', d: L => L >= 7 ? 'A golden cross of blades all around Orhun.' : `Slashes in front of Orhun${L >= 3 ? ' and behind him' : ''}${L >= 5 ? ', twice' : ''}. ${Math.round((1.1 + L * .25) * 100)}% damage.`,
    cd: L => L >= 7 ? .8 : 1.3 - L * .06, fire(h, w, L) {
      const ev = L >= 7, R = (ev ? 3.2 : 2.1 + L * .12) * TILE * SVM.area, dmg = h.atk * (ev ? 3.2 : 1.1 + L * .25);
      const tn = svNearest(h.x, h.y, R * 1.5), [fx, fy] = tn ? [tn.x - h.x, tn.y - h.y] : svFacing(h), a0 = Math.atan2(fy, fx), dirs = ev ? [0, Math.PI / 2, Math.PI, -Math.PI / 2] : (L >= 3 ? [0, Math.PI] : [0]);
      const go = () => { for (const da of dirs) { const a = a0 + da; for (let k = -1; k <= 1; k++) G.fx.push({ k: 'slash', x: h.x + Math.cos(a + k * .4) * R * .6, y: h.y - 14 + Math.sin(a + k * .4) * R * .6, t: 0, dur: .2, big: ev, a: a + 1 }); }
        for (const f of svFoesNear(h.x, h.y, R)) { const a = Math.atan2(f.y - h.y, f.x - h.x); if (ev || dirs.some(da => Math.abs(angDiff(a, a0 + da)) < 1.05)) svHit(h, f, dmg); } sfx('slash'); };
      go(); if (L >= 5 && !ev) svLater(.2, () => { if (!h.dead) go(); });
    } },
  whirl: { hero: 'orhun', name: 'Whirling Blades', icon: 'whirl', max: 6, evo: 'p_spell', evoName: 'Blade Tempest', orbit: true, d: L => L >= 7 ? 'Eight great blades circle Orhun.' : `${1 + Math.ceil(L / 1.5)} blades circle Orhun and cut anything they touch.`,
    cd: () => 99, count: L => (L >= 7 ? 8 : 1 + Math.ceil(L / 1.5)) + SVM.amount, radius: L => (L >= 7 ? 2.7 : 1.7 + L * .08) * TILE * SVM.area, speed: L => (L >= 7 ? 4 : 2.6 + L * .15) * SVM.dur, dmg: (h, L) => h.atk * (L >= 7 ? 1.6 : .6 + L * .12) },
  wave: { hero: 'orhun', name: 'Crescent Wave', icon: 'wave', max: 6, d: L => `Sends ${1 + Math.floor(L / 2)} piercing wave${L >= 2 ? 's' : ''} at the nearest enemies.`,
    cd: L => 2.5 - L * .15, fire(h, w, L) {
      const n = 1 + Math.floor(L / 2) + SVM.amount, t = svNearest(h.x, h.y, 10 * TILE); if (!t) return;
      const a0 = Math.atan2(t.y - h.y, t.x - h.x);
      for (let k = 0; k < n; k++) { const a = a0 + (k - (n - 1) / 2) * .22; svShot(h, a, 430, 9 * TILE, h.atk * (1.5 + L * .28), { pierce: 99, col: '#cfe6ff', r: 14 * SVM.area, wave: true }); }
      sfx('whirl');
    } },
  quake: { hero: 'orhun', name: 'Earthsplitter', icon: 'quake', max: 6, evo: 'p_heart', evoName: 'Worldbreaker', d: L => L >= 7 ? 'Shakes the ground twice in a huge ring, stunning everything.' : 'Slams the ground around Orhun for heavy damage and a short stun.',
    cd: L => L >= 7 ? 3 : 4.6 - L * .28, fire(h, w, L) {
      const ev = L >= 7, R = (ev ? 5.2 : 2.4 + L * .25) * TILE * SVM.area, dmg = h.atk * (ev ? 4 : 1.8 + L * .35);
      const go = () => { if (!SV.on || h.dead) return; burstFx(h.x, h.y, R, '#ffb070', 14); shake(ev ? 8 : 4); sfx('boom'); for (const f of svFoesNear(h.x, h.y, R)) { svHit(h, f, dmg); if (!f.def.boss && !f.dead) addBuff(f, { id: 'stun', name: 'Stunned', dur: .8, mods: { stun: true }, col: '#ffe6a8' }); } };
      go(); if (ev) svLater(.45, go);
    } },
  roar: { hero: 'orhun', name: 'Challenging Roar', icon: 'roar', max: 5, d: L => `Hurls back every enemy within ${(3 + L * .35).toFixed(1)} yards and weakens them.`,
    cd: L => 6.5 - L * .5, fire(h, w, L) {
      const R = (3 + L * .35) * TILE * SVM.area; ring(h.x, h.y, R, '#ffcf6a'); sfx('roar');
      for (const f of svFoesNear(h.x, h.y, R)) { const a = Math.atan2(f.y - h.y, f.x - h.x); if (!f.def.boss && !f.svElite) f.kb = { vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, t: .22 }; svHit(h, f, h.atk * (.5 + L * .12)); if (!f.dead) addBuff(f, { id: 'daunt', name: 'Daunted', dur: 4, mods: { dmgDone: .8 }, col: '#ffcf6a' }); }
    } },
  exec: { hero: 'orhun', name: "Executioner's Edge", icon: 'axe', max: 5, d: L => 'Strikes the toughest enemy nearby for huge damage, doubled below 30% health.',
    cd: L => 3.4 - L * .3, fire(h, w, L) {
      const list = svFoesNear(h.x, h.y, 7 * TILE); if (!list.length) return;
      const t = list.sort((a, b) => b.hp - a.hp)[0]; zap(h.x, h.y - 16, t.x, t.y - 16, '#ff8a6a', true);
      G.fx.push({ k: 'slash', x: t.x, y: t.y - 16, t: 0, dur: .25, big: true, a: 1 }); svHit(h, t, h.atk * (4 + L * .9) * (t.hp / t.maxHp < .3 ? 2 : 1)); sfx('crit');
    } },
  // Handan
  bolt: { hero: 'handan', name: 'Jade Bolt', icon: 'bolt', max: 6, evo: 'p_echo', evoName: 'Jade Storm', d: L => L >= 7 ? 'A storm of ten jade bolts every volley.' : `Fires ${L} bolt${L > 1 ? 's' : ''} at different enemies.`,
    cd: L => L >= 7 ? .55 : 1.1 - L * .06, fire(h, w, L) {
      const n = (L >= 7 ? 10 : L) + SVM.amount, list = svFoesNear(h.x, h.y, 9 * TILE).sort((a, b) => dist(a, h) - dist(b, h)).slice(0, n); if (!list.length) return;
      list.forEach((t, k) => svLater(k * .04, () => { if (!t.dead && !h.dead) shoot(h, t, L >= 7 ? '#c9f5df' : '#7dffc8', 480, () => svHit(h, t, h.atk * (L >= 7 ? 2.4 : 1.45 + L * .16)), L >= 7 ? 7 : 5); }));
      sfx('cast');
    } },
  chain: { hero: 'handan', name: 'Chain Lightning', icon: 'chain', max: 6, evo: 'p_reach', evoName: 'Storm Crown', d: L => L >= 7 ? 'Lightning leaps between fourteen enemies, twice.' : `Lightning leaps between ${3 + L} enemies.`,
    cd: L => L >= 7 ? 1.2 : 2.4 - L * .15, fire(h, w, L) {
      const go = () => { if (!SV.on || h.dead) return; let cur = svNearest(h.x, h.y, 8 * TILE); if (!cur) return; const hit = new Set(); let px = h.x, py = h.y - 26, m = h.atk * (L >= 7 ? 2.6 : 1.3 + L * .22);
        for (let k = 0; k < (L >= 7 ? 14 : 3 + L) + SVM.amount && cur; k++) { hit.add(cur); zap(px, py, cur.x, cur.y - 16, '#bfe6ff'); svHit(h, cur, m); px = cur.x; py = cur.y - 16; m *= .94; const near = svFoesNear(cur.x, cur.y, 5 * TILE * SVM.area).filter(f => !hit.has(f) && !f.dead); cur = near.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0]; }
        sfx('cast'); };
      go(); if (L >= 7) svLater(.2, go);
    } },
  fire: { hero: 'handan', name: 'Lanternfire', icon: 'fire', max: 6, evo: 'p_glass', evoName: 'Falling Stars', d: L => L >= 7 ? 'Six falling stars every volley.' : `Calls down ${1 + Math.floor(L / 2)} burning lantern${L >= 2 ? 's' : ''} on enemy packs.`,
    cd: L => L >= 7 ? 1.6 : 3 - L * .2, fire(h, w, L) {
      const n = (L >= 7 ? 6 : 1 + Math.floor(L / 2)) + SVM.amount, R = (L >= 7 ? 2.8 : 1.8 + L * .15) * TILE * SVM.area, list = svFoesNear(h.x, h.y, 9 * TILE);
      for (let k = 0; k < n && list.length; k++) { const t = list[Math.floor(Math.random() * list.length)];
        const tl = { x: t.x, y: t.y, r: R, dur: .6, t: 0, col: '#ffb050', harm: false, sv: true };
        tl.onEnd = () => { if (!SV.on) return; burstFx(tl.x, tl.y, R, '#ffb050', 10); sfx('boom'); for (const f of svFoesNear(tl.x, tl.y, R)) { svHit(h, f, h.atk * (L >= 7 ? 3.6 : 1.8 + L * .32)); if (!f.dead) addBuff(f, { id: 'burn', name: 'Burning', dur: 2, dot: h.atk * .3, src: h, col: '#ffb050' }); } };
        G.teles.push(tl); }
    } },
  nova: { hero: 'handan', name: 'Frost Nova', icon: 'nova', max: 5, d: L => `Freezes every enemy within ${(2.5 + L * .3).toFixed(1)} yards of Handan.`,
    cd: L => 5.2 - L * .4, fire(h, w, L) {
      const R = (2.5 + L * .3) * TILE * SVM.area; burstFx(h.x, h.y, R, '#dff4ff', 14); sfx('whirl');
      for (const f of svFoesNear(h.x, h.y, R)) { svHit(h, f, h.atk * (1 + L * .22)); if (!f.def.boss && !f.dead) addBuff(f, { id: 'root', name: 'Frozen', dur: 1.5 + L * .2, mods: { root: true }, col: '#bfe6ff' }); }
    } },
  orbs: { hero: 'handan', name: 'Jade Orbs', icon: 'ward', max: 6, orbit: true, d: L => `${1 + Math.ceil(L / 1.5)} jade orbs circle Handan, burning enemies and swallowing enemy shots.`,
    cd: () => 99, count: L => 1 + Math.ceil(L / 1.5) + SVM.amount, radius: L => (1.4 + L * .08) * TILE * SVM.area, speed: L => -(2.2 + L * .15) * SVM.dur, dmg: (h, L) => h.atk * (.55 + L * .12), eats: true },
  mend: { hero: 'handan', name: 'Mending Light', icon: 'heal', max: 5, d: L => `Heals both heroes for ${8 + L * 3}% of their health${L >= 4 ? ' and burns nearby enemies' : ''}.`,
    cd: L => 6.5 - L * .6, fire(h, w, L) {
      sfx('heal'); for (const o of svHeroes()) { heal(h, o, o.maxHp * (.08 + L * .03)); sparkle(o, '#fff2b0'); }
      if (L >= 4) { const R = 2.5 * TILE * SVM.area; ring(h.x, h.y, R, '#fff2b0'); for (const f of svFoesNear(h.x, h.y, R)) svHit(h, f, h.atk * 1.3); }
    } },
  thorn: { hero: 'handan', name: 'Thornbind', icon: 'root', max: 5, d: L => `Thorns burst under ${1 + Math.floor(L / 2)} enem${L >= 2 ? 'ies' : 'y'}, rooting and cutting everything nearby.`,
    cd: L => 3.6 - L * .3, fire(h, w, L) {
      const list = svFoesNear(h.x, h.y, 8 * TILE); const n = 1 + Math.floor(L / 2) + SVM.amount;
      for (let k = 0; k < n && list.length; k++) { const t = list[Math.floor(Math.random() * list.length)]; const R = 1.6 * TILE * SVM.area; if (G.fx.length < 500) vines(t); for (const f of svFoesNear(t.x, t.y, R)) { if (f.dead) continue; if (!f.def.boss) addBuff(f, { id: 'root', name: 'Rooted', dur: 1.8, mods: { root: true }, col: '#a8e07a' }); addBuff(f, { id: 'thorn', name: 'Thorns', dur: 3, dot: h.atk * (.4 + L * .1), src: h, col: '#a8e07a' }); } }
    } },
};
const SVP = {
  p_might: { name: 'Whetstone', icon: 'sword', max: 5, d: L => `+${L * 10}% damage.` },
  p_heart: { name: 'Iron Heart', icon: 'oath', max: 5, d: L => `+${L * 15}% max health.` },
  p_boots: { name: 'Swift Boots', icon: 'charge', max: 5, d: L => `+${L * 8}% move speed.` },
  p_magnet: { name: 'Magnet Charm', icon: 'ward', max: 5, d: L => `+${L * 35}% pickup range.` },
  p_glass: { name: 'Hourglass', icon: 'haste', max: 5, d: L => `Skills recharge ${L * 7}% faster.` },
  p_crown: { name: 'Crown of Insight', icon: 'banner', max: 5, d: L => `+${L * 10}% experience.` },
  p_echo: { name: 'Echo Stone', icon: 'barrage', max: 2, d: L => `+${L} bolt, blade, wave or orb for every skill.` },
  p_spell: { name: 'Spellbinder', icon: 'renew', max: 5, d: L => `Orbiting blades and orbs spin ${L * 12}% faster.` },
  p_reach: { name: 'Wide Reach', icon: 'nova', max: 5, d: L => `+${L * 10}% area for every skill.` },
  p_regen: { name: 'Hearthstone', icon: 'heal', max: 5, d: L => `Regenerate ${(L * .3).toFixed(1)}% health every second.` },
};
const SVM = { might: 1, area: 1, cd: 1, amount: 0, dur: 1, speed: 1, magnet: 1, xp: 1, regen: 0, hp: 1, gold: 1 };

/* ---------- Meta progression (Lantern Forge) ---------- */
const SV_FORGE = [
  { id: 'might', name: 'Might', max: 5, d: r => `+${r * 5}% damage` },
  { id: 'vital', name: 'Vitality', max: 5, d: r => `+${r * 10}% max health` },
  { id: 'recov', name: 'Recovery', max: 5, d: r => `Regenerate ${(r * .2).toFixed(1)}% health per second` },
  { id: 'swift', name: 'Swiftness', max: 5, d: r => `+${r * 5}% move speed` },
  { id: 'magnet', name: 'Magnetism', max: 5, d: r => `+${r * 20}% pickup range` },
  { id: 'growth', name: 'Growth', max: 5, d: r => `+${r * 5}% experience` },
  { id: 'greed', name: 'Greed', max: 5, d: r => `+${r * 10}% gold` },
  { id: 'haste', name: 'Haste', max: 5, d: r => `Skills recharge ${r * 3}% faster` },
  { id: 'revive', name: 'Second Chance', max: 1, d: () => 'Revive once per dream' },
  { id: 'reroll', name: 'Insight', max: 3, d: r => `${r} reroll${r === 1 ? '' : 's'} of upgrade cards per dream` },
];
function svMeta() { const m = load(SV_META_KEY) || {}; m.embers = m.embers || 0; m.forge = m.forge || {}; m.best = m.best || {}; m.done = m.done || {}; return m; }
function svSaveMeta(m) { store(SV_META_KEY, m); }
function forgeCost(id, rank) { return Math.round(60 * Math.pow(1.7, rank) * (id === 'revive' ? 4 : id === 'reroll' ? 2 : 1)); }

/* ---------- Helpers ---------- */
const SV = { on: false, weapons: { orhun: [], handan: [] }, passives: {}, gems: [], shots: [], bullets: [], chests: [] };
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
function svHeroes() { return heroes().filter(h => !h.dead); }
function svFacing(h) { if (h.lastMv && (h.lastMv[0] || h.lastMv[1])) return h.lastMv; const t = svNearest(h.x, h.y, 8 * TILE); if (t) { const l = Math.hypot(t.x - h.x, t.y - h.y) || 1; return [(t.x - h.x) / l, (t.y - h.y) / l]; } return [h.face || 1, 0]; }
function svFoesNear(x, y, R) { const out = []; for (const f of G.foes) if (!f.dead && Math.hypot(f.x - x, f.y - y) < R + f.r) out.push(f); return out; }
function svNearest(x, y, R) { let best = null, bd = R; for (const f of G.foes) { if (f.dead) continue; const d = Math.hypot(f.x - x, f.y - y); if (d < bd) { bd = d; best = f; } } return best; }
function svHit(h, f, amt) { if (!f || f.dead) return; dealDamage(h, f, amt * SVM.might, { threat: .2 }); }
function svShot(h, a, sp, range, dmg, o = {}) { SV.shots.push({ x: h.x, y: h.y - 16, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: range / sp, dmg: dmg * SVM.might, src: h, pierce: o.pierce || 1, hit: new Set(), col: o.col || '#ffffff', r: o.r || 8, wave: o.wave, a }); }
function svNeed(l) { return Math.round(5 + (l - 1) * 6 + Math.pow(l, 1.85)); }
function svLater(d, fn) { SV.later.push({ t: SV.t + d, fn }); }
function svClock(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`; }
function svSpawnR() { let r = Math.hypot(W, H) / ZOOM / 2 + 40; if (IS3D && typeof S3 !== 'undefined') r = Math.max(r, S3.dist * 1.15 * TILE); return r; }

/* ---------- Arena (one wrapping 40x40 pattern, tiled 3x3) ---------- */
const SV_ARENAS = {};
function svPattern(st, idx) {
  const PN = SV_PER, seed = 300 + idx * 37;
  const z = new Zone('arena', st.name, PN, PN, { seed, dark: st.dark, tint: st.tint, style: st.style, canopy: st.canopy, fog: st.fog, snow: st.snow });
  const md = v => ((Math.floor(v) % PN) + PN) % PN;
  z.get = function (x, y) { return this.g[md(y) * PN + md(x)]; };
  z.set = function (x, y, t) { this.g[md(y) * PN + md(x)] = t; };
  const r = mulberry32(seed), keep = st.style === 'keep';
  z.fill(keep ? T.FLOOR : T.GRASS);
  const blob = (t, n, r0, r1, only) => { for (let i = 0; i < n; i++) z.circle(r() * PN, r() * PN, r0 + r() * (r1 - r0), t, only); };
  if (!keep) blob(T.DGRASS, 14, 1.5, 4.5);
  if (st.style === 'marsh') blob(T.MARSH, 12, 1.5, 4, [T.GRASS, T.DGRASS]);
  if (st.style === 'snow') blob(T.ICE, 5, 2, 4, [T.GRASS, T.DGRASS]);
  const wd = (x, y, a, b) => { const dx = Math.min(Math.abs(x - a), PN - Math.abs(x - a)), dy = Math.min(Math.abs(y - b), PN - Math.abs(y - b)); return Math.hypot(dx, dy); };
  for (let i = 0; i < 10; i++) {
    const cx = Math.floor(r() * PN), cy = Math.floor(r() * PN); if (wd(cx, cy, 20, 20) < 6) continue;
    if (keep && r() < .4) { const hz = r() < .5, len = 3 + Math.floor(r() * 3); for (let k = 0; k < len; k++) z.set(cx + (hz ? k : 0), cy + (hz ? 0 : k), T.WALL); continue; }
    const n = 1 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) z.set(cx + Math.floor(r() * 3) - 1, cy + Math.floor(r() * 3) - 1, keep ? T.ROCK : (r() < .65 ? T.TREE : T.ROCK));
  }
  for (let i = 0; i < 4; i++) { let x, y, k = 0; do { x = Math.floor(r() * PN); y = Math.floor(r() * PN); k++; } while (k < 40 && (SOLID.has(z.get(x, y)) || wd(x, y, 20, 20) < 4)); z.decor.push({ type: st.style === 'meadow' || st.style === 'marsh' ? 'lantern' : 'brazier', x, y }); }
  return z;
}
function svArena(st) {
  if (SV_ARENAS[st.id]) return SV_ARENAS[st.id];
  const idx = SV_STAGES.indexOf(st), pat = svPattern(st, idx);
  const z = new Zone('arena', st.name, SV_N, SV_N, { seed: pat.seed, dark: st.dark, tint: st.tint, style: st.style, canopy: st.canopy, fog: st.fog, snow: st.snow });
  for (let y = 0; y < SV_N; y++) for (let x = 0; x < SV_N; x++) z.g[y * SV_N + x] = pat.get(x, y);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) for (const d of pat.decor) z.decor.push({ ...d, x: d.x + i * SV_PER, y: d.y + j * SV_PER });
  z.entries = { start: [SV_N / 2 + .5, SV_N / 2 + .5] };
  if (!IS3D) { renderZone(pat); pat.base.svPattern = true; pat.over.svPattern = true; z.base = pat.base; z.over = pat.over; z.mini = pat.mini; }
  SV_ARENAS[st.id] = z;
  return z;
}
if (!IS3D) {
  // The 2D renderer copies the visible part of z.base/z.over by world coordinates; tile the pattern instead.
  const _di = CanvasRenderingContext2D.prototype.drawImage;
  const tiled = function (img, sx, sy, sw, sh, dx, dy) {
    const PW = img.width, PH = img.height;
    for (let y = sy; y < sy + sh - .01;) { const py = ((y % PH) + PH) % PH, hh = Math.min(PH - py, sy + sh - y);
      for (let x = sx; x < sx + sw - .01;) { const px = ((x % PW) + PW) % PW, ww = Math.min(PW - px, sx + sw - x); _di.call(this, img, px, py, ww, hh, dx + (x - sx), dy + (y - sy), ww, hh); x += ww; }
      y += hh; }
  };
  for (const c of [ctx, octx]) c.drawImage = function (img) { if (img && img.svPattern && arguments.length === 9) return tiled.call(this, img, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]); return _di.apply(this, arguments); };
}
function svRecenter() {
  const al = svHeroes(); if (!al.length) return;
  if (G.teles.some(t => !t.sv) || G.foes.some(f => !f.dead && f.bs && f.bs.cast)) return;
  const ax = al.reduce((s, h) => s + h.x, 0) / al.length, ay = al.reduce((s, h) => s + h.y, 0) / al.length, PP = SV_PER * TILE;
  const dx = ax < PP ? PP : ax > 2 * PP ? -PP : 0, dy = ay < PP ? PP : ay > 2 * PP ? -PP : 0;
  if (!dx && !dy) return;
  const mv = o => { if (o && typeof o.x === 'number') { o.x += dx; o.y += dy; } };
  for (const h of partyAll()) { mv(h); h.path = null; }
  for (const f of G.foes) { mv(f); mv(f.home); mv(f.wander); f.path = null; }
  for (const list of [SV.gems, SV.chests, SV.shots, SV.bullets, G.proj, G.texts, G.pools, G.teles]) for (const o of list) { mv(o); if (o.y0 !== undefined) o.y0 += dy; }
  for (const f of G.fx) { for (const k of ['x', 'x1', 'x2', 'bx']) if (typeof f[k] === 'number') f[k] += dx; for (const k of ['y', 'y1', 'y2', 'by']) if (typeof f[k] === 'number') f[k] += dy; }
  G.cam.x += dx; G.cam.y += dy; G.moveTo = null;
  for (const w of [...SV.weapons.orhun, ...SV.weapons.handan]) if (w.pos) for (const p of w.pos) { p[0] += dx; p[1] += dy; }
  if (IS3D && typeof S3 !== 'undefined') for (const m of S3.ents.values()) { if (m.px !== undefined) { m.px += dx; m.pz += dy; } }
}

/* ---------- Start / end ---------- */
const _heroesSV = heroes;
heroes = function () { return G.mode === 'survivor' ? [P.orhun, P.handan].filter(h => !h.svAbsent) : [P.orhun, P.handan]; };
const _rcSV = recalcStats;
recalcStats = function () {
  _rcSV();
  if (G.mode !== 'survivor') return;
  const m = SVM.hp * (1 + (SV.passives.p_heart || 0) * .15);
  for (const h of [P.orhun, P.handan]) { const r = h.maxHp ? h.hp / h.maxHp : 1; h.maxHp = Math.round(h.maxHp * m); if (!h.dead) h.hp = Math.max(1, Math.round(h.maxHp * r)); }
};
function svRecalc() {
  const f = svMeta().forge, p = SV.passives;
  SVM.might = (1 + (f.might || 0) * .05) * (1 + (p.p_might || 0) * .1) * (SV.solo ? 1.2 : 1);
  SVM.area = 1 + (p.p_reach || 0) * .1;
  SVM.amount = p.p_echo || 0;
  SVM.dur = 1 + (p.p_spell || 0) * .12;
  recalcStats();
}
function startSurvivor(stageId, party) {
  const st = SV_STAGES.find(s => s.id === stageId); const meta = svMeta(), f = meta.forge;
  G.mode = 'survivor';
  resetState();
  G.coop = party === 'coop'; G.ctrl = party === 'handan' ? 'handan' : 'orhun';
  document.documentElement.classList.add('sv');
  Object.assign(SVM, { might: 1, area: 1, cd: 1 - (f.haste || 0) * .03, amount: 0, dur: 1, speed: 1 + (f.swift || 0) * .05, magnet: 1 + (f.magnet || 0) * .2, xp: 1 + (f.growth || 0) * .05, regen: (f.recov || 0) * .2, hp: (1 + (f.vital || 0) * .1) * (party === 'orhun' || party === 'handan' ? 1.4 : 1), gold: 1 + (f.greed || 0) * .1 });
  Object.assign(SV, { on: true, st, party, solo: party === 'orhun' || party === 'handan', t: 0, lvl: 1, xp: 0, kills: 0, gold: 0, gems: [], shots: [], bullets: [], chests: [], spawnT: 1, farT: 0, events: {}, over: false, won: false, bossOut: false, revives: f.revive ? 1 : 0, rerolls: f.reroll || 0,
    weapons: { orhun: [], handan: [] }, passives: {}, pending: 0, offer: null, evolved: {}, ang: {}, later: [], ref: FOES[st.roster[0][1]] });
  P.orhun.svAbsent = party === 'handan'; P.handan.svAbsent = party === 'orhun';
  for (const h of [P.orhun, P.handan]) if (h.svAbsent) { h.dead = true; h.hp = 0; }
  if (P.handan.svAbsent) { P.fox.dead = true; P.fox.respawnT = 1e9; }
  if (!P.orhun.svAbsent) SV.weapons.orhun.push({ id: 'slash', lvl: 1, cd: .5 });
  if (!P.handan.svAbsent) SV.weapons.handan.push({ id: 'bolt', lvl: 1, cd: .5 });
  // a lone hero brings a second skill, so every party starts with two
  if (party === 'orhun') SV.weapons.orhun.push({ id: 'whirl', lvl: 1, cd: 0 });
  if (party === 'handan') SV.weapons.handan.push({ id: 'orbs', lvl: 1, cd: 0 });
  G.level = 1; svRecalc();
  for (const h of heroes()) h.hp = h.maxHp;
  ZONES.arena = svArena(st);
  if (IS3D && typeof AMB !== 'undefined') AMB.arena = AMB[st.amb];
  enterZone('arena', 'start');
  G.npcs = []; G.inCombat = true;
  startPlaying();
  [...$('party').children].forEach((el, i) => el.hidden = !!P[i ? 'handan' : 'orhun'].svAbsent);
  for (const id of ['svLevel', 'svPause', 'svEnd']) $(id).hidden = true;
  $('svHud').hidden = false; $('svMenu').hidden = true; svHud(true);
  $('svLantern').querySelector('span').textContent = TOUCH_UI ? 'Lantern' : 'F'; $('svLantern').style.fontSize = TOUCH_UI ? '10px' : '';
  $('svDodge').querySelector('span').textContent = TOUCH_UI ? 'Dodge' : 'Shift';
  banner(st.name, 'Survive until the lantern burns at dawn');
  sfx('beacon');
}
function svEnd(won) {
  if (SV.over) return;
  SV.over = true; SV.won = won; G.paused = true;
  const meta = svMeta();
  const embers = Math.round(SV.gold + SV.kills / 25 + SV.t / 20 + (won ? 150 : 0));
  meta.embers += embers;
  if (SV.t > (meta.best[SV.st.id] || 0)) meta.best[SV.st.id] = Math.floor(SV.t);
  if (won) meta.done[SV.st.id] = true;
  svSaveMeta(meta);
  const w = $('svEnd'); w.hidden = false;
  w.innerHTML = `<h2 style="justify-content:center">${won ? 'Dawn breaks' : 'The lantern gutters out'}</h2>
    <p style="text-align:center;color:#cfc8b6;margin:0 0 10px">${won ? 'You outlasted the dream and broke its keeper.' : 'The dream swallows you. The lantern remembers how far you came.'}</p>
    <div class="svStats"><div><b>${svClock(SV.t)}</b><span>survived</span></div><div><b>${SV.kills}</b><span>defeated</span></div><div><b>${SV.lvl}</b><span>level</span></div><div><b>+${embers}</b><span>embers</span></div></div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px"><button class="btn primary" id="svAgain">Dream again</button><button class="btn" id="svToMenu">Lantern Forge</button><button class="btn" id="svToTitle">Title screen</button></div>`;
  $('svAgain').onclick = () => { w.hidden = true; startSurvivor(SV.st.id, SV.party); };
  $('svToMenu').onclick = () => { w.hidden = true; svQuit(); openSvMenu('forge'); };
  $('svToTitle').onclick = () => { w.hidden = true; svQuit(); };
}
function svQuit() {
  SV.on = false; G.mode = 'story'; G.started = false; G.paused = false; G.coop = !!load('jadeborn_coop');
  document.documentElement.classList.remove('sv');
  for (const id of ['svHud', 'svLevel', 'svPause', 'svEnd']) $(id).hidden = true;
  [...$('party').children].forEach(el => el.hidden = false);
  $('hud').hidden = true; $('title').hidden = false;
  resetState(); enterZone('town', 'start'); $('banner').style.opacity = 0;
}

/* ---------- Spawning ---------- */
function svScaleFoe(f, kind) {
  const min = SV.t / 60, st = SV.st, ref = SV.ref;
  const hr = clamp(f.def.hp / ref.hp, .6, 3), ar = clamp(f.def.atk / ref.atk, .7, 2);
  const H = svHpCurve(min, st.mult) * (SV.solo ? .85 : 1), A = svAtkCurve(min, 1 + (st.mult - 1) * .6);
  if (kind === 'boss') { f.maxHp = Math.round(svHpCurve(15, st.mult) * 320 * (SV.solo ? .7 : 1)); f.atk = A * 1.7; }
  else if (kind === 'elite') { f.maxHp = Math.round(H * 40); f.atk = A * 1.6; }
  else { f.maxHp = Math.round(H * hr * (kind === 'swarm' ? .7 : 1)); f.atk = A * ar; }
  f.hp = f.maxHp;
}
function svPlace(c, R, ang) {
  const z = G.zone;
  for (let tries = 0; tries < 12; tries++) {
    const a = ang !== undefined ? ang + (Math.random() - .5) * 1.4 : Math.random() * Math.PI * 2, rr = R + Math.random() * 90;
    const x = c.x + Math.cos(a) * rr, y = c.y + Math.sin(a) * rr;
    if (x < 3 * TILE || y < 3 * TILE || x > (z.w - 3) * TILE || y > (z.h - 3) * TILE) continue;
    if (circleHitsSolid(z, x, y, 14)) continue;
    return [x, y];
  }
  return null;
}
function svSpawn(type, kind = 'normal', at) {
  const hs = svHeroes(), c = hs[Math.floor(Math.random() * hs.length)] || ctrlHero();
  const p = at || svPlace(c, svSpawnR()); if (!p) return null;
  const f = makeFoe(type, p[0] / TILE - .5, p[1] / TILE - .5);
  if (kind === 'elite') { f.def = { ...f.def, scale: (f.def.scale || 1) * 1.45, elite: true, r: Math.round(f.def.r * 1.4) }; f.r = f.def.r; f.name = 'Dream-touched ' + f.def.name; f.svElite = true; }
  svScaleFoe(f, kind);
  f.aggro = true; for (const h of hs) f.threat.set(h, 1);
  f.svhit = {}; f.svHorde = kind === 'normal' || kind === 'swarm';
  G.foes.push(f); return f;
}
function svSpawnTick(dt) {
  const min = SV.t / 60, st = SV.st;
  const cap = Math.min(330, 20 + Math.floor(min * 22)) * (SV.solo ? .7 : 1), alive = G.foes.length;
  SV.spawnT -= dt;
  if (SV.spawnT <= 0 && alive < cap && !SV.bossOut) {
    SV.spawnT = Math.max(.12, .9 - min * .06) / (SV.solo ? .7 : 1);
    const pool = st.roster.filter(r => SV.t >= r[0]);
    const tot = pool.reduce((s, r) => s + r[2], 0); let roll = Math.random() * tot, type = pool[0][1];
    for (const r of pool) { if ((roll -= r[2]) < 0) { type = r[1]; break; } }
    const n = 1 + Math.floor(min / 2.5);
    for (let i = 0; i < n; i++) svSpawn(type);
  }
  // a closing ring every 2 minutes
  const sw = Math.floor(SV.t / 120);
  if (sw > 0 && !SV.events['sw' + sw] && !SV.bossOut) {
    SV.events['sw' + sw] = true; banner('A swarm closes in', '');
    const c = svHeroes()[0] || ctrlHero(), type = st.roster[Math.min(st.roster.length - 1, sw - 1)][1], n = 26 + sw * 4, R = svSpawnR();
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = c.x + Math.cos(a) * R, y = c.y + Math.sin(a) * R; if (circleHitsSolid(G.zone, x, y, 14) || x < 3 * TILE || y < 3 * TILE || x > (SV_N - 3) * TILE || y > (SV_N - 3) * TILE) continue; svSpawn(type, 'swarm', [x, y]); }
  }
  for (const [at, idx] of [[300, 0], [600, 1]]) if (SV.t >= at && !SV.events['el' + at]) { SV.events['el' + at] = true; const e = svSpawn(st.elite[idx], 'elite'); if (e) { banner(e.name, 'Guardian of the dream'); e.svChest = true; sfx('roar'); } }
  if (SV.t >= SV_RUN_LEN && !SV.events.boss) {
    SV.events.boss = true; SV.bossOut = true;
    const b = svSpawn(st.boss, 'boss'); if (b) { b.svBoss = true; b.svChest = true; b.home = { x: b.x, y: b.y }; bossPull(b); }
  }
  // the horde never stays behind: stragglers are brought back around the heroes
  SV.farT -= dt;
  if (SV.farT <= 0) {
    SV.farT = .5; const hs = svHeroes(); if (!hs.length) return;
    const far = svSpawnR() + 10 * TILE;
    for (const f of G.foes) { if (f.dead || !f.svHorde) continue; let nd = 1e9, nh = null; for (const h of hs) { const d = Math.hypot(h.x - f.x, h.y - f.y); if (d < nd) { nd = d; nh = h; } }
      if (nd > far) { const mvA = nh.lastMv && G.t - (nh.lastMvT || 0) < .5 ? Math.atan2(nh.lastMv[1], nh.lastMv[0]) : undefined; const p = svPlace(nh, svSpawnR(), mvA); if (p) { f.x = p[0]; f.y = p[1]; f.kb = null; } } }
  }
}

/* ---------- Foes in the horde ---------- */
function svFoeTick(f, dt, grid) {
  if (f.def.boss || f.svElite || f.def.orb) {
    if (f.dead) { f.t += dt; f.deathT += dt; return; }
    if (!f.def.orb) {
      for (const h of svHeroes()) if (!f.threat.has(h)) f.threat.set(h, 1);
      const tg = foeTarget(f);
      if (tg && dist(f, tg) > 13 * TILE && !(f.bs && f.bs.cast)) { const a = Math.atan2(f.y - tg.y, f.x - tg.x); const p = svPlace(tg, 8 * TILE, a); if (p) { burstFx(f.x, f.y - 20, 30, '#7a5aa8', 10); f.x = p[0]; f.y = p[1]; burstFx(f.x, f.y - 20, 30, '#7a5aa8', 10); } }
      f.home = { x: f.x, y: f.y };
    }
    foeTick(f, dt); if (!f.def.orb) svBossBullets(f, dt); return;
  }
  f.t += dt;
  if (f.dead) { f.deathT += dt; return; }
  tickBuffs(f, dt); if (f.dead) return;
  if (f.flash) f.flash = Math.max(0, f.flash - dt);
  f.swing = Math.max(0, f.swing - dt * 3);
  if (f.kb) { moveEnt(f, f.kb.vx * dt, f.kb.vy * dt); f.blockedX = f.blockedY = false; f.kb.t -= dt; if (f.kb.t <= 0) f.kb = null; return; }
  if (has(f, 'stun')) { f.moving = false; return; }
  let tgt = null, bd = 1e9;
  for (const h of svHeroes()) { const d = Math.hypot(h.x - f.x, h.y - f.y); if (d < bd) { bd = d; tgt = h; } }
  if (!tgt) { f.moving = false; return; }
  const ranged = f.def.ranged, want = ranged ? f.def.range * .8 : 0;
  if (!has(f, 'root')) {
    let vx = 0, vy = 0;
    if (bd > want + 6) { vx = (tgt.x - f.x) / bd; vy = (tgt.y - f.y) / bd; }
    else if (ranged && bd < want * .6) { vx = -(tgt.x - f.x) / bd; vy = -(tgt.y - f.y) / bd; }
    const gx = Math.floor(f.x / 48), gy = Math.floor(f.y / 48);
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cell = grid.get((gx + i) * 4096 + gy + j); if (!cell) continue; for (const o of cell) { if (o === f) continue; const dx = f.x - o.x, dy = f.y - o.y, d = Math.hypot(dx, dy), m = f.r + o.r; if (d < m && d > .1) { vx += dx / d * (m - d) / m * 1.5; vy += dy / d * (m - d) / m * 1.5; } } }
    const sp = f.def.spd * (.9 + Math.min(SV.t / 60, 20) * .015) * mod(f, 'speed');
    const l = Math.hypot(vx, vy);
    if (l > .05) { moveEnt(f, vx / l * sp * dt, vy / l * sp * dt); f.blockedX = f.blockedY = false; f.moving = true; f.dirx = vx / l; f.diry = vy / l; if (Math.abs(vx) > .1) f.face = vx > 0 ? 1 : -1; } else f.moving = false;
  } else f.moving = false;
  f.atkT -= dt;
  if (f.atkT <= 0) {
    if (ranged && bd < f.def.range * 1.2) { f.atkT = f.def.rate * 1.4; f.swing = 1; const a = Math.atan2(tgt.y - f.y, tgt.x - f.x); svBullet(f, a, 200, f.atk * .9, f.def.proj || '#c58aff'); }
    else if (!ranged && bd < f.r + tgt.r + 8) { f.atkT = f.def.rate; f.swing = 1; f.dirx = (tgt.x - f.x) / bd; f.diry = (tgt.y - f.y) / bd; dealDamage(f, tgt, f.atk, { melee: true }); }
  }
}
function svBullet(f, a, sp, dmg, col, r = 7) { if (SV.bullets.length > 700) return; SV.bullets.push({ x: f.x, y: f.y - 16, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 5, dmg, col, r, src: f }); }
function svBossBullets(f, dt) {
  f.svB = (f.svB === undefined ? 3 : f.svB) - dt; if (f.svB > 0 || f.dead) return;
  const p2 = f.hp / f.maxHp < .5, n = f.def.boss ? (p2 ? 20 : 14) : 10;
  f.svB = f.def.boss ? (p2 ? 2.4 : 3.4) : 4.5; f.svSpin = (f.svSpin || 0) + .35;
  const col = f.def.proj || f.def.light || '#ff7a5a';
  for (let i = 0; i < n; i++) svBullet(f, f.svSpin + i / n * Math.PI * 2, f.def.boss ? 165 : 145, f.atk * .6, col, 8);
  if (f.def.boss && p2) svLater(.45, () => { if (!f.dead) for (let i = 0; i < n; i++) svBullet(f, f.svSpin + (i + .5) / n * Math.PI * 2, 195, f.atk * .6, col, 8); });
}

/* ---------- Kills, gems, chests ---------- */
const _killSV = kill;
kill = function (e, src) {
  if (G.mode !== 'survivor' || e.team !== 'foe') { _killSV(e, src); if (G.mode === 'survivor') G.wipeT = 0; return; }
  e.hp = 0; e.dead = true; e.buffs = []; e.deathT = 0;
  if (G.target === e) G.target = null;
  SV.kills++;
  const big = e.def.boss || e.svElite;
  const v = big ? 40 : (e.def.hp / SV.ref.hp > 1.6 ? 2 : 1);
  SV.gems.push({ x: e.x, y: e.y, v: Math.max(1, Math.round(v * (1 + SV.t / 360))), t: 0 });
  if (Math.random() < .04 || big) SV.gems.push({ x: e.x + rnd(-10, 10), y: e.y + rnd(-10, 10), coin: true, v: big ? 25 : rint(1, 3), t: 0 });
  if (Math.random() < .005) SV.gems.push({ x: e.x, y: e.y, food: true, t: 0 });
  else if (Math.random() < .0025 || (big && !e.svBoss)) SV.gems.push({ x: e.x + 8, y: e.y, vac: true, t: 0 });
  if (e.svChest) SV.chests.push({ x: e.x, y: e.y, t: 0 });
  if (G.fx.length < 420) { G.fx.push({ k: 'ring', x: e.x, y: e.y - 8, r: 18, col: '#7a5aa8', t: 0, dur: .3 }); for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28; G.fx.push({ k: 'p', x: e.x, y: e.y - 10, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30, col: '#9a7ac8', t: 0, dur: .4, sz: 3 }); } }
  if (big) { burstFx(e.x, e.y - 10, 40, '#e0a64e', 18); shake(6); sfx('boom'); }
  if (e.svBoss) { G.teles = []; G.pools = []; G.eclipse = false; G.blizzard = false; for (const f of G.foes) if (!f.dead && f !== e) { f.hp = 0; f.dead = true; f.deathT = 0; } banner(e.name, 'The dream breaks'); sfx('beacon'); svLater(2.6, () => svEnd(true)); }
};
function svPickups(dt) {
  const hs = svHeroes(); if (!hs.length) return;
  const mag = (2.8 * TILE) * SVM.magnet * (1 + (SV.passives.p_magnet || 0) * .35);
  for (const g of SV.gems) {
    g.t += dt; let near = null, nd = 1e9;
    for (const h of hs) { const d = Math.hypot(h.x - g.x, h.y - g.y); if (d < nd) { nd = d; near = h; } }
    if (g.pull || nd < mag) { g.pull = true; const sp = 280 + g.t * 300; g.x += (near.x - g.x) / nd * Math.min(nd, sp * dt); g.y += (near.y - 12 - g.y) / nd * Math.min(nd, sp * dt); }
    if (nd < 18) {
      g.taken = true;
      if (g.coin) { SV.gold += Math.round(g.v * SVM.gold); sfx('coin'); }
      else if (g.food) { for (const h of hs) heal(near, h, h.maxHp * .3); sfx('heal'); }
      else if (g.vac) { for (const o of SV.gems) { o.pull = true; o.t = Math.max(o.t, 1.5); } burstFx(near.x, near.y - 20, 4 * TILE, '#fff2b0', 20); sfx('beacon'); floatText(near.x, near.y - 70, 'Lantern wisp!', '#fff2b0', 1.1); }
      else { SV.xp += g.v * SVM.xp * (1 + (SV.passives.p_crown || 0) * .1); sfx('pickup'); }
    }
  }
  SV.gems = SV.gems.filter(g => !g.taken);
  if (SV.gems.length > 500) { const old = SV.gems.filter(g => !g.coin && !g.food && !g.vac && !g.pull).slice(0, SV.gems.length - 420); if (old.length > 1) { const keep = old[0]; for (const g of old.slice(1)) { keep.v += g.v; g.taken = true; } SV.gems = SV.gems.filter(g => !g.taken); } }
  for (const c of SV.chests) { c.t += dt; for (const h of hs) if (!c.taken && Math.hypot(h.x - c.x, h.y - c.y) < 30) { c.taken = true; svOpenChest(h); } }
  SV.chests = SV.chests.filter(c => !c.taken);
  while (SV.xp >= svNeed(SV.lvl)) { SV.xp -= svNeed(SV.lvl); SV.lvl++; SV.pending++; G.level = Math.min(MAX_LVL, SV.lvl); svRecalc(); for (const h of hs) { h.hp = Math.min(h.maxHp, h.hp + h.maxHp * .1); sparkle(h, '#ffe08a'); } sfx('level'); }
}
function svOpenChest(h) {
  sfx('quest'); burstFx(h.x, h.y - 20, 60, '#ffd27a', 24);
  const evo = svOffers().filter(o => o.kind === 'evo');
  if (evo.length) { svApply(evo[0]); toast(`Evolved: <b>${SVW[evo[0].id].evoName}</b>!`); svHud(true); return; }
  SV.gold += 30; SV.pending++; toast('A lantern chest! Choose a gift.');
}

/* ---------- Upgrade cards ---------- */
function svOffers() {
  const out = [];
  for (const k of ['orhun', 'handan']) {
    if (P[k].svAbsent) continue;
    const owned = SV.weapons[k];
    for (const w of owned) { const def = SVW[w.id]; if (w.lvl < def.max) out.push({ kind: 'up', hero: k, id: w.id, lvl: w.lvl + 1 }); else if (def.evo && !SV.evolved[w.id] && SV.passives[def.evo]) out.push({ kind: 'evo', hero: k, id: w.id, lvl: 7 }); }
    if (owned.length < 6) for (const id in SVW) if (SVW[id].hero === k && !owned.some(w => w.id === id)) out.push({ kind: 'new', hero: k, id, lvl: 1 });
  }
  const np = Object.keys(SV.passives).length;
  for (const id in SVP) { const L = SV.passives[id] || 0; if (L < SVP[id].max && (L > 0 || np < 6)) out.push({ kind: 'pas', id, lvl: L + 1 }); }
  return out;
}
function svRollOffer() {
  const all = svOffers(); const evo = all.filter(o => o.kind === 'evo'); const rest = all.filter(o => o.kind !== 'evo');
  const out = evo.slice(0, 1);
  while (out.length < 3 && rest.length) { const w = rest.map(o => o.kind === 'up' ? 3 : o.kind === 'new' ? 2.2 : 1.6); let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0; for (; i < rest.length - 1; i++) if ((r -= w[i]) < 0) break; out.push(rest.splice(i, 1)[0]); }
  if (!out.length) out.push({ kind: 'gold' });
  return out;
}
function svApply(o) {
  if (o.kind === 'gold') { SV.gold += 25; for (const h of svHeroes()) heal(h, h, h.maxHp * .3); return; }
  if (o.kind === 'pas') { SV.passives[o.id] = o.lvl; svRecalc(); return; }
  const list = SV.weapons[o.hero];
  if (o.kind === 'new') list.push({ id: o.id, lvl: 1, cd: .3 });
  else { const w = list.find(w => w.id === o.id); if (w) { w.lvl = o.lvl; if (o.kind === 'evo') { SV.evolved[o.id] = true; burstFx(P[o.hero].x, P[o.hero].y - 20, 80, '#ffd27a', 30); sfx('beacon'); } } }
}
function svIconSpec(t, id) {
  if (t === 'p') return { bg: '#1e2a40', fg: '#9fc8ff', s: SVP[id].icon };
  const def = SVW[id], sup = id === 'mend'; return { bg: sup ? '#123a2c' : '#4a1a12', fg: sup ? '#8affc8' : '#ffb08a', s: def.icon };
}
function svCardHtml(o, i) {
  if (o.kind === 'gold') return `<button class="boonCard" data-c="${i}" style="--rc:#f2c75c"><span class="rar">Gift</span><b>Lantern bread & 25 gold</b><span class="txt">Heals both heroes for 30%.</span></button>`;
  const isP = o.kind === 'pas', def = isP ? SVP[o.id] : SVW[o.id];
  const col = o.kind === 'evo' ? '#ffb347' : o.kind === 'new' ? '#5fdc6c' : isP ? '#5aa6ff' : '#d8d8d8';
  const name = o.kind === 'evo' ? def.evoName : def.name;
  const who = isP ? 'Both heroes' : HERO[o.hero].name;
  const label = o.kind === 'evo' ? 'Evolution' : o.kind === 'new' ? 'New skill' : isP ? (o.lvl === 1 ? 'New relic' : `Relic level ${o.lvl}`) : `Level ${o.lvl}`;
  return `<button class="boonCard" data-c="${i}" style="--rc:${col}"><span class="rar">${label}</span><span class="svCardHead"><canvas width="36" height="36" data-ic="${isP ? 'p' : 'w'}:${o.id}"></canvas><b>${name}</b></span><span class="who">${who}</span><span class="txt">${def.d(o.lvl)}</span></button>`;
}
function svOpenLevel() {
  const w = $('svLevel'); G.paused = true;
  if (!SV.offer) SV.offer = svRollOffer();
  w.hidden = false;
  w.innerHTML = `<h2>Level ${SV.lvl}${SV.pending > 1 ? ` <small class="svMore">${SV.pending} picks waiting</small>` : ''}</h2>
    <div class="boonRow">${SV.offer.map(svCardHtml).join('')}</div>
    ${SV.rerolls > 0 ? `<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn" id="svReroll">Reroll (${SV.rerolls})</button></div>` : ''}`;
  w.querySelectorAll('canvas[data-ic]').forEach(c => { const [t, id] = c.dataset.ic.split(':'); drawIcon(c, svIconSpec(t, id)); });
  w.querySelectorAll('[data-c]').forEach(el => el.onclick = () => { if (!SV.offer) return; svApply(SV.offer[+el.dataset.c]); SV.offer = null; SV.pending = Math.max(0, SV.pending - 1); w.hidden = true; G.paused = false; sfx('quest'); svHud(true); });
  if ($('svReroll')) $('svReroll').onclick = () => { SV.rerolls--; SV.offer = null; svOpenLevel(); };
}

/* ---------- Main survivor update ---------- */
const _updSV = update;
let svHudT = 0;
update = function (dt) {
  if (G.mode !== 'survivor') return _updSV(dt);
  if (!G.started || SV.over || G.paused || G.dialog) return;
  if (SV.pending > 0) { svOpenLevel(); return; }
  G.t += dt; SV.t += dt;
  G.gauge = Math.min(100, G.gauge + dt * .3);
  if (SV.later.length) { const due = SV.later.filter(l => l.t <= SV.t); SV.later = SV.later.filter(l => l.t > SV.t); for (const l of due) try { l.fn(); } catch (e) { console.error(e); } }
  G.inCombat = true; G.mounted = false;
  const c = ctrlHero();
  const spd = SVM.speed * (1 + (SV.passives.p_boots || 0) * .08);
  for (const h of svHeroes()) { const b = h.buffs.find(x => x.id === 'svspd'); if (!b) h.buffs.push({ id: 'svspd', t: 1e9, dur: 1e9, tick: 1, mods: { speed: spd } }); else b.mods.speed = spd; }
  const mv = (h, v) => { if (h.dead || h.dash) return; if (v[0] || v[1]) moveHero(h, v[0], v[1], dt); else h.moving = false; };
  if (!c.dead) mv(c, inputVec(1));
  if (G.coop) mv(P.handan, inputVec(2));
  else { const o = otherHero(); if (!o.dead && !o.svAbsent) svPartner(o, c.dead ? o : c, dt); }
  // basic weapon attacks pick the nearest enemy in reach
  for (const h of svHeroes()) { const t = svNearest(h.x, h.y, weaponReach(h) + 30); if (h === c) { G.target = t; G.autoAtk = !!t; } else h.target = t; }
  for (const h of heroes()) {
    heroTick(h, dt);
    if (h.dead) { h.svRevT = (h.svRevT || 0) + dt; const o = h === P.orhun ? P.handan : P.orhun; if (h.svRevT > 15 && !o.dead && !o.svAbsent) { h.dead = false; h.hp = Math.round(h.maxHp * .5); h.x = o.x + 16; h.y = o.y + 8; h.iframes = 2; h.svRevT = 0; sparkle(h, '#fff2b0'); toast(`${h.name} rises again.`); } }
    else { h.svRevT = 0; const rg = SVM.regen + (SV.passives.p_regen || 0) * .3; if (rg) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * rg / 100 * dt); }
  }
  if (!P.handan.svAbsent) foxTick(P.fox, dt);
  // skills fire on their own
  const cdm = SVM.cd * (1 - (SV.passives.p_glass || 0) * .07);
  for (const k of ['orhun', 'handan']) { const h = P[k]; if (h.dead || h.svAbsent) continue; for (const w of SV.weapons[k]) { const def = SVW[w.id]; if (def.orbit) { svOrbit(h, w, def, dt); continue; } w.cd -= dt; if (w.cd <= 0) { w.cd = Math.max(.25, def.cd(w.lvl) * cdm); try { def.fire(h, w, w.lvl); } catch (e) { console.error(e); } } } }
  // the horde
  const grid = new Map();
  for (const f of G.foes) { if (f.dead) continue; const key = Math.floor(f.x / 48) * 4096 + Math.floor(f.y / 48); let cell = grid.get(key); if (!cell) grid.set(key, cell = []); cell.push(f); }
  for (const f of G.foes) svFoeTick(f, dt, grid);
  G.foes = G.foes.filter(f => !(f.dead && f.deathT > .5));
  // hero shots and enemy bullets
  for (const s of SV.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    for (const f of G.foes) { if (f.dead || s.hit.has(f)) continue; if (Math.hypot(f.x - s.x, f.y - 16 - s.y) < f.r + s.r) { s.hit.add(f); dealDamage(s.src, f, s.dmg, { threat: .2 }); if (--s.pierce <= 0) { s.life = 0; break; } } }
  }
  SV.shots = SV.shots.filter(s => s.life > 0);
  for (const b of SV.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (circleHitsSolid(G.zone, b.x, b.y + 16, 3)) { b.life = 0; continue; }
    for (const h of svHeroes()) if (Math.hypot(h.x - b.x, h.y - 18 - b.y) < h.r + b.r - 2) { b.life = 0; dealDamage(b.src, h, b.dmg, {}); break; }
  }
  SV.bullets = SV.bullets.filter(b => b.life > 0);
  svSpawnTick(dt);
  updateProj(dt);
  svPickups(dt);
  if (G.texts.length > 70) G.texts.splice(0, G.texts.length - 70);
  if (G.fx.length > 600) G.fx.splice(0, G.fx.length - 600);
  // defeat / second chance
  if (!svHeroes().length) {
    if (SV.revives > 0) { SV.revives--; const a = heroes()[0]; for (const h of heroes()) { h.dead = false; h.hp = Math.round(h.maxHp * .5); h.iframes = 2.5; h.x = a.x; h.y = a.y; sparkle(h, '#fff2b0'); } burstFx(a.x, a.y, 6 * TILE, '#fff2b0', 40); for (const f of svFoesNear(a.x, a.y, 6 * TILE)) if (!f.def.boss && !f.svElite) kill(f, a); banner('Second Chance', 'The lantern refuses to go out'); }
    else { svEnd(false); return; }
  }
  svRecenter();
  // camera
  const al = svHeroes(); let fx = c.x, fy = c.y;
  if (al.length && (G.coop || c.dead)) { fx = al.reduce((s, h) => s + h.x, 0) / al.length; fy = al.reduce((s, h) => s + h.y, 0) / al.length; }
  G.cam.x = lerp(G.cam.x, fx - W / ZOOM / 2, Math.min(1, dt * 8)); G.cam.y = lerp(G.cam.y, fy - H / ZOOM / 2, Math.min(1, dt * 8));
  G.shake = Math.max(0, G.shake - dt * 30);
  svHudT -= dt; if (svHudT <= 0) { svHudT = .25; svHud(); }
};
function svOrbit(h, w, def, dt) {
  const L = w.lvl, n = def.count(L), R = def.radius(L);
  SV.ang[w.id] = (SV.ang[w.id] || 0) + def.speed(L) * dt;
  w.pos = [];
  for (let i = 0; i < n; i++) {
    const a = SV.ang[w.id] + i / n * Math.PI * 2, x = h.x + Math.cos(a) * R, y = h.y - 14 + Math.sin(a) * R * .8;
    w.pos.push([x, y, a]);
    for (const f of G.foes) { if (f.dead) continue; if (Math.abs(f.x - x) < f.r + 14 && Math.hypot(f.x - x, f.y - 14 - y) < f.r + 12) { const key = w.id + i; if (!f.svhit) f.svhit = {}; if ((f.svhit[key] || 0) <= SV.t) { f.svhit[key] = SV.t + .45; svHit(h, f, def.dmg(h, L)); if (!f.def.boss && !f.svElite && w.id === 'whirl' && !f.dead) f.kb = { vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, t: .1 }; } } }
    if (def.eats) for (const b of SV.bullets) if (Math.abs(b.x - x) < 16 && Math.hypot(b.x - x, b.y - y) < 16) b.life = 0;
  }
}
function svPartner(o, lead, dt) {
  let vx = 0, vy = 0;
  const dl = Math.hypot(lead.x - o.x, lead.y - o.y);
  if (lead !== o && dl > 14 * TILE) { burstFx(o.x, o.y - 20, 24, '#7dffc8', 8); o.x = lead.x - 20; o.y = lead.y + 12; return; }
  if (lead !== o && dl > 3 * TILE) { const w = dl > 6 * TILE ? 3 : 1; vx += (lead.x - o.x) / dl * w; vy += (lead.y - o.y) / dl * w; }
  for (const f of svFoesNear(o.x, o.y, 3 * TILE)) { const d = Math.hypot(o.x - f.x, o.y - f.y) || 1; vx += (o.x - f.x) / d * (3 * TILE - d) / (3 * TILE) * 2; vy += (o.y - f.y) / d * (3 * TILE - d) / (3 * TILE) * 2; }
  for (const b of SV.bullets) { const d = Math.hypot(o.x - b.x, o.y - 16 - b.y); if (d < 50 && d > .1) { vx += (o.x - b.x) / d; vy += (o.y - 16 - b.y) / d; } }
  if (Math.hypot(vx, vy) > .15) moveHero(o, vx, vy, dt); else o.moving = false;
  const tl = G.teles.find(p => p.harm && Math.hypot(p.x - o.x, p.y - o.y) < p.r + 4 && p.t > p.dur * .5); if (tl && !(o.cds.dodge > 0)) dodge(o, o.x - tl.x, o.y - tl.y);
}

/* ---------- Rendering: 2D ---------- */
const SVC = new Map();
function svFoeSprite(f) {
  const sc = f.def.scale || 1, S = sc > 1.25 ? 192 : 128, ax = S / 2, ay = Math.round(S * .8);
  const fr = Math.floor(((f.t % Math.PI) / Math.PI) * 12), key = f.type + '|' + (f.moving ? 1 : 0) + '|' + fr + '|' + (f.flash > 0 ? 1 : 0) + '|' + (f.swing > .3 ? 1 : 0);
  let c = SVC.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
    drawFoeShape(g, { ...f, t: fr / 12 * Math.PI, face: 1, dead: false, x: 0, y: 0, swing: f.swing > .3 ? .8 : 0 }, ax, ay);
    g.globalCompositeOperation = 'source-atop';
    if (f.def.tint) { g.globalAlpha = f.def.tint.a * .8; g.fillStyle = f.def.tint.c; g.fillRect(0, 0, S, S); }
    if (f.flash > 0) { g.globalAlpha = .55; g.fillStyle = '#fff'; g.fillRect(0, 0, S, S); }
    c.ax = ax; c.ay = ay; SVC.set(key, c);
  }
  return c;
}
const _drawFoeSV = drawFoe;
drawFoe = function (g, f) {
  if (!f.svHorde) return _drawFoeSV(g, f);
  const c = svFoeSprite(f);
  g.save(); g.globalAlpha = f.dead ? Math.max(0, 1 - f.deathT * 2) : 1;
  g.translate(Math.round(f.x), Math.round(f.y)); if ((f.face || 1) < 0) g.scale(-1, 1);
  g.drawImage(c, -c.ax, -c.ay);
  if (!f.dead && f.buffs.length && f.buffs.some(b => b.id === 'root')) { g.globalAlpha = .5; g.fillStyle = '#bfe6ff'; g.beginPath(); g.ellipse(0, 1, f.r + 3, (f.r + 3) * .45, 0, 0, 7); g.fill(); }
  g.restore();
};
const SV_GEMCOL = v => v >= 10 ? '#ff6a9a' : v >= 3 ? '#7dff8a' : '#5ad1ff';
function svRender2D(g, t, layer) {
  if (!SV.on) return;
  const cx = G.cam.x, cy = G.cam.y, vw = W / ZOOM, vh = H / ZOOM;
  const vis = (x, y, m = 40) => x > cx - m && x < cx + vw + m && y > cy - m && y < cy + vh + m;
  if (layer === 0) {
    for (const gm of SV.gems) {
      if (!vis(gm.x, gm.y)) continue;
      const x = gm.x, y = gm.y - 6 + Math.sin(t * 4 + gm.x) * 1.5;
      if (gm.coin) { g.fillStyle = '#7a5420'; g.beginPath(); g.arc(x, y + 1, 5, 0, 7); g.fill(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); g.fillStyle = '#fff2c0'; g.fillRect(x - 1, y - 3, 2, 2); continue; }
      if (gm.vac) { g.fillStyle = 'rgba(255,242,176,.35)'; g.beginPath(); g.arc(x, y, 11 + Math.sin(t * 6) * 2, 0, 7); g.fill(); g.fillStyle = '#fff2b0'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + t, rr = i % 2 ? 3 : 8; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); continue; }
      if (gm.food) { g.fillStyle = '#c86a3a'; g.beginPath(); g.ellipse(x, y, 7, 5, 0, 0, 7); g.fill(); g.fillStyle = '#f2c78a'; g.fillRect(x - 4, y - 3, 8, 2); continue; }
      const s = gm.v >= 10 ? 7 : gm.v >= 3 ? 5.5 : 4.5;
      g.fillStyle = SV_GEMCOL(gm.v); g.beginPath(); g.moveTo(x, y - s * 1.3); g.lineTo(x + s, y); g.lineTo(x, y + s * 1.1); g.lineTo(x - s, y); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(x - 1, y - s * .8, 2, s * .6);
    }
    for (const ch of SV.chests) { if (!vis(ch.x, ch.y)) continue; const x = ch.x, y = ch.y, b = Math.sin(t * 3) * 2; g.fillStyle = `rgba(255,210,120,${.25 + Math.sin(t * 4) * .1})`; g.beginPath(); g.ellipse(x, y + 2, 24, 9, 0, 0, 7); g.fill(); g.fillStyle = '#6a3e1a'; g.fillRect(x - 12, y - 16 + b, 24, 16); g.fillStyle = '#c8902e'; g.fillRect(x - 13, y - 20 + b, 26, 6); g.fillRect(x - 2, y - 14 + b, 4, 6); g.fillStyle = '#ffe9a0'; g.fillRect(x - 1, y - 13 + b, 2, 3); }
    return;
  }
  for (const s of SV.shots) { if (!vis(s.x, s.y)) continue; g.strokeStyle = s.col; g.globalAlpha = Math.min(1, s.life * 3) * .9; g.lineWidth = 4; g.beginPath(); g.arc(s.x - Math.cos(s.a) * s.r * .6, s.y - Math.sin(s.a) * s.r * .6, s.r * 1.4, s.a - 1.1, s.a + 1.1); g.stroke(); g.lineWidth = 1.5; g.strokeStyle = '#fff'; g.stroke(); g.globalAlpha = 1; }
  for (const k of ['orhun', 'handan']) for (const w of SV.weapons[k]) {
    if (!w.pos || P[k].dead) continue; const ev = SV.evolved[w.id];
    for (const [x, y, a] of w.pos) {
      if (w.id === 'whirl') { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#20242c'; g.fillRect(-3, -12, 6, 24); g.fillStyle = ev ? '#ffd27a' : '#e8eef8'; g.fillRect(-2, -11, 4, 22); g.fillStyle = '#8a6a3a'; g.fillRect(-3, 8, 6, 4); g.restore(); }
      else { g.fillStyle = 'rgba(125,255,200,.3)'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.fillStyle = '#7dffc8'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 2, y - 3, 3, 3); }
    }
  }
  for (const b of SV.bullets) { if (!vis(b.x, b.y)) continue; g.globalAlpha = .35; g.fillStyle = b.col; g.beginPath(); g.arc(b.x, b.y, b.r * 1.7, 0, 7); g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y, b.r * .45, 0, 7); g.fill(); }
}

/* ---------- Rendering: 3D (instanced horde, gems, bullets) ---------- */
const SV3 = { root: null, types: new Map() };
function svInst(geom, mat, cap) {
  const im = new THREE.InstancedMesh(geom, mat, cap); im.count = 0; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false;
  const col = new THREE.Color(1, 1, 1); for (let i = 0; i < cap; i++) im.setColorAt(i, col);
  SV3.root.add(im); return im;
}
function svType3D(type) {
  let T3 = SV3.types.get(type); if (T3) return T3;
  const m = makeFoe3D({ def: FOES[type], type, t: 0, x: 0, y: 0, buffs: [], bs: {}, threat: new Map() });
  m.g.updateMatrixWorld(true);
  const parts = [];
  m.g.traverse(o => { if (o.isMesh && o.visible && !(o.material.transparent && o.material.opacity < .05)) parts.push({ im: svInst(o.geometry, o.material, SV_CAP3), local: o.matrixWorld.clone() }); });
  T3 = { parts, n: 0 }; SV3.types.set(type, T3); return T3;
}
function svInit3D(R) {
  SV3.root = new THREE.Group(); R.scene.add(SV3.root);
  const basic = (c, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
  const halo = () => basic('#ffffff', { transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
  SV3.shadow = svInst(new THREE.CircleGeometry(.5, 14), basic('#000000', { transparent: true, opacity: .3, depthWrite: false }), SV_CAP3 * 2);
  SV3.gems = svInst(new THREE.OctahedronGeometry(.1, 0), basic('#ffffff'), 1000);
  SV3.bul = svInst(new THREE.SphereGeometry(.1, 8, 6), basic('#ffffff'), 720);
  SV3.bulH = svInst(new THREE.SphereGeometry(.2, 8, 6), halo(), 720);
  SV3.shots = svInst(new THREE.TorusGeometry(.42, .055, 4, 14, Math.PI), basic('#dff0ff', { transparent: true, opacity: .85, depthWrite: false }), 160);
  SV3.blades = svInst(new THREE.BoxGeometry(.04, .13, .62), basic('#e8f2ff'), 48);
  SV3.orbs = svInst(new THREE.SphereGeometry(.13, 12, 8), basic('#7dffc8'), 48);
  SV3.orbsH = svInst(new THREE.SphereGeometry(.26, 10, 8), halo(), 48);
  SV3.chests = svInst(new THREE.BoxGeometry(.55, .38, .4), new THREE.MeshStandardMaterial({ color: '#c8902e', metalness: .7, roughness: .3, emissive: 0x7a4a10, emissiveIntensity: .7 }), 12);
  SV3.chestsH = svInst(new THREE.SphereGeometry(.7, 12, 8), halo(), 12);
  SV3.M = new THREE.Matrix4(); SV3.M2 = new THREE.Matrix4(); SV3.Q = new THREE.Quaternion(); SV3.E = new THREE.Euler(0, 0, 0, 'YXZ'); SV3.P = new THREE.Vector3(); SV3.S = new THREE.Vector3(); SV3.C = new THREE.Color();
  SV3.white = new THREE.Color(1, 1, 1); SV3.flash = new THREE.Color(2.4, 2.4, 2.4); SV3.frozen = new THREE.Color(.75, .95, 1.5); SV3.gold = new THREE.Color(1.8, 1.3, .5);
}
function svRender3D(R, dt, t) {
  if (!SV3.root) { if (!SV.on) return; svInit3D(R); }
  SV3.root.visible = SV.on;
  if (!SV.on) return;
  if (SV3.root.parent !== R.scene) R.scene.add(SV3.root);
  const { M, M2, Q, E, P: Pv, S, C, white } = SV3;
  const put = (im, i, x, y, z, rx, ry, rz, s, col) => { E.set(rx, ry, rz, 'YXZ'); Q.setFromEuler(E); Pv.set(x, y, z); S.set(s, s, s); M.compose(Pv, Q, S); im.setMatrixAt(i, M); if (col) im.setColorAt(i, col); };
  const done = (im, n) => { im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; };
  for (const T3 of SV3.types.values()) T3.n = 0;
  let ns = 0;
  const fx = S3.focus.x, fz = S3.focus.z;
  for (const f of G.foes) {
    if (!f.svHorde) continue;
    const X = f.x / TILE, Z = f.y / TILE;
    if (Math.abs(X - fx) > 30 || Math.abs(Z - fz) > 26) continue;
    const T3 = svType3D(f.type); if (T3.n >= SV_CAP3) continue;
    if (f.dirx !== undefined) { const target = Math.atan2(f.dirx, f.diry); const cur = f.yaw3 === undefined ? target : f.yaw3; f.yaw3 = cur + angDiff(target, cur) * Math.min(1, dt * 10); }
    let s = 1, y = 0, rz = 0, rx = 0;
    if (f.dead) { const u = Math.min(1, f.deathT / .5); s = 1 - u * .6; y = -u * .4; rz = u * 1.2; }
    else if (f.moving) { const ph = t * 12 + f.t * 3; y = Math.abs(Math.sin(ph)) * .05; rz = Math.sin(ph) * .08; }
    if (f.swing > 0) rx = Math.sin(f.swing * Math.PI) * .3;
    E.set(rx, f.yaw3 || 0, rz, 'YXZ'); Q.setFromEuler(E); Pv.set(X, y, Z); S.set(s, s, s); M2.compose(Pv, Q, S);
    const col = f.flash > 0 ? SV3.flash : (f.buffs.length && f.buffs.some(b => b.id === 'root') ? SV3.frozen : white);
    for (const p of T3.parts) { M.multiplyMatrices(M2, p.local); p.im.setMatrixAt(T3.n, M); p.im.setColorAt(T3.n, col); }
    T3.n++;
    if (!f.dead && ns < SV_CAP3 * 2) put(SV3.shadow, ns++, X, .02, Z, -Math.PI / 2, 0, 0, (f.r / 12) * (f.def.scale || 1), null);
  }
  for (const T3 of SV3.types.values()) for (const p of T3.parts) done(p.im, T3.n);
  done(SV3.shadow, ns);
  let n = 0;
  for (const gm of SV.gems) { if (n >= 1000) break; const X = gm.x / TILE, Z = gm.y / TILE; if (Math.abs(X - fx) > 24 || Math.abs(Z - fz) > 20) continue; C.set(gm.vac ? '#fff2b0' : gm.coin ? '#ffd24a' : gm.food ? '#ff8a5a' : SV_GEMCOL(gm.v)); put(SV3.gems, n++, X, .28 + Math.sin(t * 4 + gm.x) * .05, Z, 0, t * 2 + gm.x, 0, gm.vac ? 2.4 + Math.sin(t * 6) * .3 : gm.coin ? 1.1 : gm.v >= 10 ? 1.6 : gm.v >= 3 ? 1.3 : 1, C); }
  done(SV3.gems, n);
  n = 0;
  for (const b of SV.bullets) { if (n >= 720) break; const X = b.x / TILE, Z = (b.y + 16) / TILE; C.set(b.col); put(SV3.bul, n, X, .55, Z, 0, 0, 0, b.r / 7, C); put(SV3.bulH, n, X, .55, Z, 0, 0, 0, b.r / 7, C); n++; }
  done(SV3.bul, n); done(SV3.bulH, n);
  n = 0;
  for (const s of SV.shots) { if (n >= 160) break; put(SV3.shots, n++, s.x / TILE, .45, (s.y + 16) / TILE, -Math.PI / 2, Math.atan2(-Math.cos(s.a), -Math.sin(s.a)), 0, s.r / 14, null); }
  done(SV3.shots, n);
  let nb = 0, no = 0;
  for (const k of ['orhun', 'handan']) for (const w of SV.weapons[k]) {
    if (!w.pos || P[k].dead) continue;
    for (const [x, y, a] of w.pos) {
      if (w.id === 'whirl' && nb < 48) put(SV3.blades, nb++, x / TILE, .62, (y + 14) / TILE, .5, -a, 0, SV.evolved.whirl ? 1.4 : 1, SV.evolved.whirl ? SV3.gold : white);
      else if (w.id === 'orbs' && no < 48) { C.set('#7dffc8'); put(SV3.orbs, no, x / TILE, .6, (y + 14) / TILE, 0, 0, 0, 1, C); put(SV3.orbsH, no, x / TILE, .6, (y + 14) / TILE, 0, 0, 0, 1 + Math.sin(t * 6 + no) * .1, C); no++; }
    }
  }
  done(SV3.blades, nb); done(SV3.orbs, no); done(SV3.orbsH, no);
  n = 0;
  for (const ch of SV.chests) { if (n >= 12) break; C.set('#ffcf6a'); put(SV3.chests, n, ch.x / TILE, .3 + Math.sin(t * 3) * .06, ch.y / TILE, 0, t, 0, 1, null); put(SV3.chestsH, n, ch.x / TILE, .4, ch.y / TILE, 0, 0, 0, 1 + Math.sin(t * 4) * .15, C); n++; }
  done(SV3.chests, n); done(SV3.chestsH, n);
}

/* ---------- HUD ---------- */
function svHud(full) {
  if (!SV.on) return;
  const top = $('svTop');
  top.querySelector('.clock').textContent = svClock(Math.min(SV.t, SV_RUN_LEN));
  top.querySelector('.boss').hidden = !(SV.bossOut && !SV.won);
  top.querySelector('.kills').textContent = SV.kills;
  top.querySelector('.gold').textContent = SV.gold;
  top.querySelector('.lv').textContent = 'Lv ' + SV.lvl;
  $('svXp').style.width = Math.min(100, SV.xp / svNeed(SV.lvl) * 100) + '%';
  const gp = Math.floor(G.gauge), lb = $('svLantern'); lb.querySelector('i').style.height = gp + '%'; lb.classList.toggle('full', gp >= 100);
  const ch = ctrlHero(), dg = ch.cds.dodge || 0; $('svDodge').querySelector('i').style.height = (dg > 0 ? (dg / DODGE[ch.key].cd) * 100 : 0) + '%';
  if (full) {
    const kit = $('svKit');
    kit.innerHTML = ['orhun', 'handan'].filter(k => !P[k].svAbsent).map(k => `<div class="kitrow">${SV.weapons[k].map(w => `<span class="kit ${SV.evolved[w.id] ? 'evo' : ''}" title="${SV.evolved[w.id] ? SVW[w.id].evoName : SVW[w.id].name}"><canvas width="30" height="30" data-ic="w:${w.id}"></canvas><i>${w.lvl >= 7 ? '★' : w.lvl}</i></span>`).join('')}</div>`).join('') +
      `<div class="kitrow">${Object.keys(SV.passives).map(id => `<span class="kit pas" title="${SVP[id].name}"><canvas width="30" height="30" data-ic="p:${id}"></canvas><i>${SV.passives[id]}</i></span>`).join('')}</div>`;
    kit.querySelectorAll('canvas[data-ic]').forEach(c => { const [t, id] = c.dataset.ic.split(':'); drawIcon(c, svIconSpec(t, id)); });
  }
}

/* ---------- Menus ---------- */
function openSvMenu(tab = 'play') {
  const m = svMeta(), w = $('svMenu'); w.hidden = false;
  const party = w.dataset.party || 'both';
  const stageOpen = s => !s.req || m.done[s.req] || (m.best[s.req] || 0) >= 600;
  w.innerHTML = `<h2>Lantern Dreams <button class="x" id="svClose" aria-label="Close">×</button></h2>
    <p class="svIntro">Liora's dream trials. Your skills fire on their own: you move, dodge and choose upgrades. Survive 15 minutes, then break the dream's keeper. Dreams never touch your story save.</p>
    <div class="ctabs"><button class="btn ${tab === 'play' ? 'on' : ''}" data-st="play">Dream</button><button class="btn ${tab === 'forge' ? 'on' : ''}" data-st="forge">Lantern Forge · ${m.embers} embers</button></div>
    ${tab === 'play' ? `<div class="svParty">${[['both', 'Orhun & Handan', 'You lead, the other follows'], ['orhun', 'Orhun alone', 'Blades and fury'], ['handan', 'Handan alone', 'Spells and Lumen'], ['coop', 'Two players', 'Shared keyboard or two pads']].map(([id, n, s]) => `<button class="btn ${party === id ? 'on' : ''}" data-party="${id}"><b>${n}</b><span>${s}</span></button>`).join('')}</div>
      <div class="svStages">${SV_STAGES.map(s => { const open = stageOpen(s), best = m.best[s.id]; return `<button class="svStage ${open ? '' : 'lock'}" data-stage="${s.id}" ${open ? '' : 'disabled'}><b>${s.name}</b><span>${s.blurb}</span><small>${open ? (m.done[s.id] ? 'Conquered · ' : '') + (best ? 'Best ' + svClock(best) : 'Not dreamt yet') : 'Survive 10 minutes in the previous dream to open'}</small></button>`; }).join('')}</div>`
    : `<div class="svForge">${SV_FORGE.map(f => { const r = m.forge[f.id] || 0, cost = forgeCost(f.id, r), maxed = r >= f.max, can = !maxed && m.embers >= cost; return `<div class="fg"><b>${f.name}</b><span>${f.d(Math.max(1, r))}</span><small>Rank ${r}/${f.max}</small><button class="btn ${can ? 'primary' : ''}" data-buy="${f.id}" ${can ? '' : 'disabled'}>${maxed ? 'Maxed' : cost + ' embers'}</button></div>`; }).join('')}</div>`}`;
  $('svClose').onclick = () => { w.hidden = true; };
  w.querySelectorAll('[data-st]').forEach(b => b.onclick = () => openSvMenu(b.dataset.st));
  w.querySelectorAll('[data-party]').forEach(b => b.onclick = () => { w.dataset.party = b.dataset.party; sfx('ui'); openSvMenu('play'); });
  w.querySelectorAll('[data-stage]').forEach(b => b.onclick = () => { SND.init(); w.hidden = true; startSurvivor(b.dataset.stage, w.dataset.party || 'both'); });
  w.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const mm = svMeta(), id = b.dataset.buy, r = mm.forge[id] || 0, cost = forgeCost(id, r); if (mm.embers < cost) return; mm.embers -= cost; mm.forge[id] = r + 1; svSaveMeta(mm); sfx('coin'); openSvMenu('forge'); });
}
function svPause() {
  if (!SV.on || SV.over || !$('svLevel').hidden) return;
  const w = $('svPause');
  if (!w.hidden) { w.hidden = true; G.paused = false; return; }
  G.paused = true; w.hidden = false;
  w.innerHTML = `<h2>Paused</h2><p style="color:#cfc8b6;margin:0 0 12px">${SV.st.name} · ${svClock(SV.t)} · ${SV.kills} defeated · level ${SV.lvl}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="svResume">Resume</button><button class="btn" id="svGiveUp">End this dream</button></div>`;
  $('svResume').onclick = () => { w.hidden = true; G.paused = false; };
  $('svGiveUp').onclick = () => { w.hidden = true; G.paused = false; svEnd(false); };
}

/* ---------- DOM & styles ---------- */
(function () {
  const st = document.createElement('style');
  st.textContent = `.sv #bar,.sv #tracker,.sv #menu,.sv #gaugeRow,.sv #target,.sv #tUtil,.sv #tUse,.sv #mmwrap,.sv #xpbar,.sv #log,.sv #bottom{display:none!important}
  #svTop{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);display:flex;gap:14px;align-items:center;padding:5px 12px;z-index:6;font-variant-numeric:tabular-nums;white-space:nowrap}
  #svTop .clock{font-family:var(--display);font-size:26px;color:var(--parch);min-width:3.1em;text-align:center}
  #svTop span{font-size:13px;color:#cfc8b6}#svTop b{color:var(--parch)}#svTop .boss{color:#ff8a6a;font-weight:800;letter-spacing:.1em}#svTop .btn{padding:4px 10px}
  #svXpBar{position:fixed;left:0;right:0;top:0;height:6px;background:#07090d;z-index:7;pointer-events:none}#svXp{height:100%;width:0;background:linear-gradient(90deg,#2b7d5f,#7dffc8);box-shadow:0 0 8px #46c495;transition:width .2s}
  #svKit{position:fixed;right:max(12px,env(safe-area-inset-right,0px));top:calc(14px + env(safe-area-inset-top,0px));display:flex;flex-direction:column;gap:3px;align-items:flex-end;z-index:6;pointer-events:none}
  .kitrow{display:flex;gap:3px}.kit{position:relative;width:28px;height:28px;border:1px solid #000;border-radius:4px;overflow:hidden}.kit canvas{width:28px;height:28px;display:block}.kit i{position:absolute;right:1px;bottom:0;font-style:normal;font-size:10px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000}.kit.evo{box-shadow:0 0 0 2px #ffb347}.kit.pas{border-color:#2a4a7a}
  #svBtns{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));display:flex;gap:12px;z-index:6}
  .svb{width:64px;height:64px;border-radius:50%;border:2px solid #000;background:radial-gradient(circle at 50% 35%,#2a3242,#141922);color:var(--parch);font:800 12px var(--body);letter-spacing:.04em;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.5),inset 0 0 0 1px rgba(224,166,78,.3);position:relative;overflow:hidden;padding:0;cursor:pointer;touch-action:none}
  .svb i{position:absolute;left:0;right:0;bottom:0;height:0;display:block;pointer-events:none}.svb span{position:relative}
  #svLantern i{background:linear-gradient(0deg,#2b7d5f,#46c495);opacity:.7}#svLantern.full{box-shadow:0 0 16px #46c495,0 0 0 2px #7dffc8}#svDodge i{background:rgba(0,0,0,.6);bottom:auto;top:0}
  .svb:active{transform:scale(.92)}
  #svMenu{width:780px;z-index:45}.svIntro{margin:0 0 10px;color:#cfc8b6;max-width:64ch}.svParty{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.svParty .btn{display:flex;flex-direction:column;gap:2px;text-transform:none;letter-spacing:0;padding:8px;text-align:left}.svParty .btn b{font-size:13px}.svParty .btn span{font-size:11px;color:#cfc8b6;font-weight:500}.svParty .btn.on{border-color:var(--jade);background:#14231e}
  .svStages{display:grid;grid-template-columns:1fr 1fr;gap:8px}.svStage{display:flex;flex-direction:column;gap:4px;text-align:left;padding:12px;border:1px solid var(--edge);border-radius:6px;background:linear-gradient(180deg,#1d2430,#121720);color:var(--parch);cursor:pointer;font:inherit}.svStage:hover{border-color:var(--brass)}.svStage b{font-family:var(--display);font-size:18px;font-weight:400}.svStage span{font-size:13px;color:#cfc8b6}.svStage small{font-size:11.5px;color:var(--jade)}.svStage.lock{opacity:.45;cursor:default}
  .svForge{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:10px}.fg{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:8px 10px;border:1px solid var(--edge);border-radius:5px;background:#141a23}.fg b{font-size:14px}.fg span{grid-column:1;font-size:12px;color:#cfc8b6}.fg small{grid-column:1;font-size:11px;color:var(--mute)}.fg .btn{grid-row:1/4;grid-column:2;align-self:center}
  #svLevel{width:720px}#svPause,#svEnd{width:460px}.svMore{font-size:14px;color:#9a978e;font-family:var(--body)}.svCardHead{display:flex;gap:8px;align-items:center}.svCardHead canvas{width:36px;height:36px;border-radius:4px;flex:none}
  .svStats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.svStats div{display:flex;flex-direction:column;align-items:center;padding:8px;border:1px solid var(--edge);border-radius:5px;background:#141a23}.svStats b{font-family:var(--display);font-size:22px}.svStats span{font-size:11px;color:var(--mute);text-transform:uppercase;letter-spacing:.08em}
  @media (max-width:820px){.svParty{grid-template-columns:repeat(2,1fr)}.svStages,.svForge{grid-template-columns:1fr}#svMenu,#svLevel{width:auto}}
  @media (max-height:520px){#svTop{gap:10px;padding:3px 10px}#svTop .clock{font-size:20px}#svLevel .boonCard{padding:8px;gap:4px}#svLevel .boonCard b{font-size:16px}#svLevel h2{margin-bottom:6px}.svb{width:58px;height:58px}#svMenu .svStage{padding:8px}#svMenu .svStage span{font-size:12px}}`;
  document.head.appendChild(st);
  const hud = document.createElement('div'); hud.id = 'svHud'; hud.hidden = true;
  hud.innerHTML = `<div id="svXpBar"><div id="svXp"></div></div><div id="svTop" class="frame"><span class="lv">Lv 1</span><span class="clock">00:00</span><span class="boss" hidden>BOSS</span><span>☠ <b class="kills">0</b></span><span class="gold" style="color:#f2c75c">0</span><button class="btn" id="svPauseBtn" aria-label="Pause">II</button></div><div id="svKit"></div>
    <div id="svBtns"><button class="svb" id="svLantern" aria-label="Lanternburst"><i></i><span>F</span></button><button class="svb" id="svDodge" aria-label="Dodge"><i></i><span>Dodge</span></button></div>`;
  document.body.appendChild(hud);
  for (const id of ['svMenu', 'svLevel', 'svPause', 'svEnd']) { const w = document.createElement('div'); w.id = id; w.className = 'win'; w.hidden = true; document.body.appendChild(w); }
  const tap = (el, fn) => el.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); SND.init(); fn(); });
  tap($('svPauseBtn'), () => svPause());
  tap($('svLantern'), () => { if (!G.paused) lanternburst(); });
  tap($('svDodge'), () => { if (!G.paused) dodge(ctrlHero()); });
  const row = document.querySelector('#title .row');
  const b = document.createElement('button'); b.className = 'btn'; b.id = 'bSurvivor'; b.textContent = 'Lantern Dreams'; b.title = 'Survivor mode';
  b.onclick = () => { SND.init(); openSvMenu('play'); };
  row.insertBefore(b, $('bHelp2'));
  // in a dream the whole canvas is a joystick on phones; clicks do nothing
  window.addEventListener('pointerdown', ev => {
    if (G.mode !== 'survivor' || ev.target !== cv) return;
    ev.stopPropagation();
    if (TOUCH_UI && window.joyStart && !G.paused) joyStart(ev);
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden && SV.on && !SV.over && !G.paused) svPause(); });
})();

/* ---------- Survivor rules for shared systems ---------- */
const _sfxSV = SND.sfx.bind(SND), _sfxLast = {};
SND.sfx = function (n) { const now = performance.now(); if (_sfxLast[n] && now - _sfxLast[n] < 45) return; _sfxLast[n] = now; _sfxSV(n); };
const _saveSV = saveGame; saveGame = function (silent) { if (G.mode === 'survivor') return; return _saveSV(silent); };
const _gaugeSV = gaugeAdd; gaugeAdd = function (v) { return _gaugeSV(G.mode === 'survivor' ? v * .1 : v); };
const _dlgSV = playDialog; playDialog = function (lines, onEnd) { if (G.mode === 'survivor') { onEnd && onEnd(); return; } return _dlgSV(lines, onEnd); };
const _lbSV = lanternburst; lanternburst = function (who) {
  if (G.mode !== 'survivor') return _lbSV(who);
  const c = who || ctrlHero(); const ready = G.gauge >= 100;
  _lbSV(c);
  if (ready) for (const f of svFoesNear(c.x, c.y, 11 * TILE)) if (!f.dead) svHit(c, f, (P.orhun.atk + P.handan.atk) * 2.5);
};
const _uaSV = useAbility; useAbility = function (h, i) {
  if (G.mode !== 'survivor') return _uaSV(h, i);
  if (!$('svLevel').hidden) { const b = $('svLevel').querySelector(`[data-c="${i}"]`); if (b) b.click(); return; }
  if (!$('svEnd').hidden && i === 0 && $('svAgain')) $('svAgain').click();
  if (!$('svPause').hidden && i === 0) $('svResume').click();
};
const _intSV = interact; interact = function (h) { if (G.mode !== 'survivor') return _intSV(h); svPause(); };
const _potSV = drinkPotion; drinkPotion = function (c) { if (G.mode !== 'survivor') return _potSV(c); };
const _ctSV = cycleTarget; cycleTarget = function (h) { if (G.mode !== 'survivor') return _ctSV(h); };
const _mtSV = mountToggle; mountToggle = function () { if (G.mode !== 'survivor') return _mtSV(); };
const _swSV = swapHero; swapHero = function (silent) { if (G.mode === 'survivor') { const o = otherHero(); if (G.coop || o.svAbsent || o.dead) return; } return _swSV(silent); };
const _okpSV = onKeyPress; onKeyPress = function (k, e) {
  if (G.mode !== 'survivor') return _okpSV(k, e);
  SND.init();
  if (!$('svLevel').hidden) { const i = ['1', '2', '3'].indexOf(k); if (i >= 0) { const b = $('svLevel').querySelector(`[data-c="${i}"]`); if (b) b.click(); } else if (k === 'r' && $('svReroll')) $('svReroll').click(); return; }
  if (!$('svEnd').hidden) { if (k === 'enter' || k === ' ') $('svAgain').click(); return; }
  if (!$('help').hidden) { if (k === 'escape' || k === 'h') $('help').hidden = true; return; }
  if (k === 'escape' || k === 'p') { svPause(); return; }
  if (G.paused) return;
  const code = e && e.code || '';
  if (G.coop) { if (k === 'shift') { dodge(code === 'ShiftRight' ? P.handan : P.orhun); return; } if (k === 'm' || code === 'Numpad0' || code === 'NumpadEnter') { lanternburst(P.handan); return; } if (k === 'f') { lanternburst(P.orhun); return; } }
  switch (k) { case 'shift': case ' ': dodge(ctrlHero()); break; case 'f': lanternburst(); break; case 'q': swapHero(); break; case 'm': $('bSound').click(); break; case 'h': $('help').hidden = false; break; }
};

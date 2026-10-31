/* ===================== GAME STATE & SIMULATION ===================== */
const G = {
  zone: null, t: 0, ctrl: 'orhun', foes: [], npcs: [], proj: [], fx: [], texts: [], teles: [], pools: [],
  level: 1, xp: 0, gold: 15, inv: [], potions: 3, potCd: 0, gauge: 0,
  equip: { orhun: {}, handan: {} }, q: {}, beacons: {}, bossDead: {}, talents: { orhun: {}, handan: {} }, talentPicks: {}, picked: {},
  gateOpen: false, cam: { x: 0, y: 0 }, target: null, shake: 0, moveTo: null, paused: false, started: false, ended: false,
  coop: false, vendorStock: [], seenBanter: {}, wipeT: 0, autoAtk: false, saveT: 0, combatT: 0, kills: 0,
};
const P = {};
const GCD = 1.0;
function B(id) { return (G.boons && G.boons[id]) || 0; }
function rageGain(h, v) { h.res = Math.min(100, h.res + v * (h.tal('ragengine') ? 1.5 : 1) * (1 + B('rage') / 100)); }
const WPROF = {
  sword:      { owner: 'orhun', name: 'Sword', rate: 1.5, mult: .85, reach: 54, desc: 'Balanced slashes.' },
  greataxe:   { owner: 'orhun', name: 'Greataxe', rate: 2.25, mult: 1.5, reach: 58, desc: 'Slow, heavy blows that also hit every enemy next to the target.' },
  spear:      { owner: 'orhun', name: 'Spear', rate: 1.65, mult: .95, reach: 86, desc: 'Long-reach thrusts that pierce the enemy behind the target.' },
  twinblades: { owner: 'orhun', name: 'Twin Blades', rate: .8, mult: .48, reach: 50, crit: .06, desc: 'Very fast alternating cuts. +6% critical chance.' },
  staff:      { owner: 'handan', name: 'Staff', rate: 1.8, mult: .5, reach: 250, desc: 'Jade bolts.' },
  orb:        { owner: 'handan', name: 'Orb', rate: 2.4, mult: .72, reach: 240, desc: 'A slow orb that bursts on impact and hits nearby enemies.' },
  wand:       { owner: 'handan', name: 'Wand', rate: 1.0, mult: .3, reach: 230, desc: 'Rapid sparks.' },
  tome:       { owner: 'handan', name: 'Tome', rate: 2.0, mult: .45, reach: 240, desc: 'Lightning that jumps to two more enemies.' },
};
function heroWeapon(h) { const w = G.equip && G.equip[h.key] && G.equip[h.key].weapon; return (w && w.wtype) || (h.key === 'orhun' ? 'sword' : 'staff'); }
function weaponReach(h) { return WPROF[heroWeapon(h)].reach; }
function zap(x1, y1, x2, y2, col = '#bfe6ff', straight = false) { G.fx.push({ k: 'zap', x1, y1, x2, y2, col, straight, t: 0, dur: straight ? .16 : .28, seed: Math.random() * 99 }); }

/* ---------- Entities ---------- */
function makeHero(key) {
  const h = { key, hero: true, team: 'party', name: HERO[key].name, x: 0, y: 0, r: HERO[key].r, dir: 0, face: 1, frame: 0, t: Math.random() * 5,
    hp: 1, maxHp: 1, res: key === 'orhun' ? 0 : 999, resMax: 100, atk: 1, def: 0, crit: .08, buffs: [], cds: {}, gcd: 0, swingT: 0, autoT: 0,
    target: null, dead: false, moving: false, path: null, pathT: 0, dash: null, reviveT: 0, aiT: 0,
    tal(id) { return !!G.talents[key][id]; } };
  return h;
}
function makeFox() {
  return { key: 'fox', pet: true, team: 'party', name: 'Lumen', x: 0, y: 0, r: 8, hp: 60, maxHp: 60, atk: 5, def: 2, crit: .05, buffs: [], cds: {}, t: 0, face: 1,
    dead: false, moving: false, path: null, pathT: 0, autoT: 0, respawnT: 0, target: null, tal() { return false; } };
}
function recalcStats() {
  for (const key of ['orhun', 'handan']) {
    const h = P[key], b = HERO[key].base(G.level), eq = G.equip[key];
    let hp = b.hp, atk = b.atk, def = b.def, crit = b.crit;
    for (const s of ['weapon', 'armor', 'trinket']) { const it = eq[s]; if (!it) continue; hp += it.stats.hp || 0; atk += it.stats.atk || 0; def += it.stats.def || 0; crit += it.stats.crit || 0; }
    if (h.tal('thickskin')) def *= 1.2;
    if (h.tal('keenedge')) crit += .08;
    const ratio = h.maxHp > 1 ? h.hp / h.maxHp : 1;
    if (key === 'orhun' && h.tal('champion')) { hp *= 1.1; atk *= 1.1; }
    hp *= 1 + B(key === 'orhun' ? 'o_hp' : 'h_hp') / 100; if (key === 'orhun') def *= 1 + B('o_def') / 100; crit += B('crit') / 100 + (WPROF[heroWeapon(h)].crit || 0);
    let resMax = b.resMax;
    if (key === 'handan' && h.tal('lanternheart')) { atk *= 1.12; resMax = Math.round(resMax * 1.2); }
    h.maxHp = Math.round(hp); h.atk = atk; h.def = def; h.crit = crit; h.resMax = resMax;
    h.hp = Math.max(h.dead ? 0 : 1, Math.round(h.maxHp * ratio));
    if (key === 'handan') h.res = Math.min(h.res, h.resMax);
  }
  const f = P.fox, mult = P.handan.tal('foxbond') ? 1.5 : 1;
  const r = f.maxHp ? f.hp / f.maxHp : 1;
  f.maxHp = Math.round((60 + 20 * (G.level - 1)) * mult); f.hp = Math.round(f.maxHp * r); f.atk = P.handan.atk * .35 * (P.handan.tal('foxbond') ? 2 : 1); f.def = 2 + G.level;
}
function heroes() { return [P.orhun, P.handan]; }
function partyAll() { return [P.orhun, P.handan, P.fox]; }
function partyAlive() { return partyAll().filter(e => !e.dead); }
function ctrlHero() { return P[G.ctrl]; }
function otherHero() { return P[G.ctrl === 'orhun' ? 'handan' : 'orhun']; }

function makeFoe(type, tx, ty) {
  const d = FOES[type];
  return { type, def: d, name: d.name, team: 'foe', x: (tx + .5) * TILE, y: (ty + .5) * TILE, home: { x: (tx + .5) * TILE, y: (ty + .5) * TILE },
    r: d.r, hp: d.hp, maxHp: d.hp, atk: d.atk, deff: d.def, crit: .05, buffs: [], threat: new Map(), aggro: false, atkT: rnd(.3, 1.2), t: Math.random() * 9,
    face: Math.random() < .5 ? -1 : 1, moving: false, path: null, pathT: 0, wander: null, wanderT: rnd(1, 4), forced: null, forcedT: 0, swing: 0, dead: false, deathT: 0, bs: {}, evade: false };
}

/* ---------- Buffs ---------- */
function addBuff(e, b) {
  if (e.dead) return;
  const ex = e.buffs.find(x => x.id === b.id);
  b.t = b.dur; b.tick = 1;
  if (ex) Object.assign(ex, b); else e.buffs.push(b);
  if (b.debuff && e.team === 'foe' && b.src) aggro(e, b.src);
}
function mod(e, k) { let v = 1; for (const b of e.buffs) if (b.mods && b.mods[k] !== undefined && typeof b.mods[k] === 'number') v *= b.mods[k]; return v; }
function has(e, k) { return e.buffs.some(b => b.mods && b.mods[k]); }
function tickBuffs(e, dt) {
  for (const b of e.buffs) {
    b.t -= dt;
    if (b.dot) { b.tick -= dt; if (b.tick <= 0) { b.tick += 1; if (b.src && !e.dead) dealDamage(b.src, e, b.dot, { dot: true, threat: 1, noCrit: true }); } }
    if (b.hot) { b.tick -= dt; if (b.tick <= 0) { b.tick += 1; heal(b.src || e, e, b.hot, true); } }
  }
  const keep = [];
  for (const b of e.buffs) { if (b.t > 0 && !(b.absorb !== undefined && b.absorb <= 0)) keep.push(b); else if (b.bloom && !e.dead) { heal(b.bloom, e, e.maxHp * .15); sparkle(e, '#8affe0'); } }
  e.buffs = keep;
}

/* ---------- Combat core ---------- */
function gaugeAdd(v) { const m = (P.handan && P.handan.tal('lanternsoul') ? 1.5 : 1) * (1 + B('lantern') / 100); G.gauge = Math.min(100, G.gauge + v * m * 0.075 / (1 + 0.28 * (G.level - 1))); }
function dealDamage(src, tgt, amt, o = {}) {
  if (!tgt || tgt.dead || amt <= 0) return 0;
  if (tgt.evade) { floatText(tgt.x, tgt.y - 40, 'Evade', '#ccc'); return 0; }
  if (tgt.iframes > 0) { if (!o.dot) floatText(tgt.x, tgt.y - 44, 'Dodged', '#c9f5df', .85); return 0; }
  let d = amt * rnd(.92, 1.08) * mod(src, 'dmgDone');
  if (src.team === 'party') { if (src.key === 'orhun') { d *= 1 + B('o_atk') / 100; if (B('fury') && src.hp / src.maxHp < .3) d *= 1.3; } else if (src.key === 'handan') d *= 1 + B('h_atk') / 100; else if (src.key === 'fox') d *= 1 + B('fox') / 100; }
  let crit = false;
  if (!o.noCrit && Math.random() < (src.crit || 0)) { d *= 1.75 + (src.team === 'party' ? B('critdmg') / 100 : 0); crit = true; }
  const def = tgt.team === 'foe' ? tgt.deff : tgt.def;
  d *= 60 / (60 + def);
  d *= mod(tgt, 'dmgTaken');
  if (tgt.key === 'orhun' && tgt.tal('laststand') && tgt.hp / tgt.maxHp < .35) d *= .75;
  if (tgt.def && tgt.def.boss === 'king' && tgt.bs.p3) d *= 1.0;
  d = Math.max(1, Math.round(d));
  // absorbs
  let absorbed = 0;
  for (const b of tgt.buffs) if (b.absorb > 0 && d > 0) { const a = Math.min(b.absorb, d); b.absorb -= a; d -= a; absorbed += a; }
  tgt.hp -= d;
  const fromParty = src.team === 'party';
  const col = fromParty ? (crit ? '#ffd86a' : (o.dot ? '#d8b8ff' : '#ffffff')) : '#ff6a5a';
  if (d > 0) floatText(tgt.x + rnd(-8, 8), tgt.y - 44 - (tgt.r > 16 ? tgt.r : 0), (crit ? d + '!' : '' + d), col, crit ? 1.35 : (o.dot ? .8 : 1));
  if (absorbed) floatText(tgt.x, tgt.y - 30, 'absorb ' + absorbed, '#8affe0', .8);
  if (fromParty && src.key === 'orhun' && B('leech') && d > 0) src.hp = Math.min(src.maxHp, src.hp + d * B('leech') / 100);
  if (fromParty) { gaugeAdd(d); if (crit && src.key === 'orhun' && src.tal('bloodthirst')) heal(src, src, src.maxHp * .04, true); }
  if (tgt.team === 'foe') {
    const tm = (o.threat || 1) * (src.key === 'orhun' ? 1.6 : src.key === 'fox' ? .7 : 1);
    addThreat(tgt, src, (d + absorbed) * tm + 1);
    if (!o.dot) { tgt.flash = .12; sfx(crit ? 'crit' : 'hit'); }
  } else {
    tgt.flash = .15;
    if (tgt.key === 'orhun') { rageGain(P.orhun, (d / tgt.maxHp) * 90); if (o.melee && B('thorns') && src.team === 'foe' && !src.dead) dealDamage(tgt, src, (d + absorbed) * B('thorns') / 100, { noCrit: true, threat: 1 }); }
    if (absorbed && B('wardspike') && src.team === 'foe' && !src.dead && tgt.buffs.some(b => b.id === 'ward')) dealDamage(P.handan, src, P.handan.atk * .6, { noCrit: true });
    if (o.melee && tgt.buffs.some(b => b.riposte) && !src.dead) { setTimeout(() => dealDamage(tgt, src, tgt.atk * .6, { threat: 2, label: 'Riposte' }), 120); }
    if (src.def && src.def.drain) heal(src, src, d * .5, true);
    if (src.def && src.def.chill && !o.dot) addBuff(tgt, { id: 'chill', name: 'Chilled', dur: 3, mods: { speed: .65 }, col: '#9fdcff', debuff: true });
    if (src.def && src.def.poison && !o.dot && Math.random() < .5) addBuff(tgt, { id: 'poison', name: 'Venom', dur: 5, dot: src.atk * .25, src, col: '#8aff5a', debuff: true });
    if (tgt.hero && tgt.hp > 0 && tgt.hp / tgt.maxHp < .3 && !tgt.lowWarned) { tgt.lowWarned = true; }
  }
  if (tgt.hp <= 0) kill(tgt, src);
  return d;
}
function heal(src, tgt, amt, quiet) {
  if (!tgt || tgt.dead) return 0;
  let h = amt * rnd(.95, 1.05);
  if (src && src.key === 'handan') h *= 1 + B('healpow') / 100;
  if (!quiet && Math.random() < (src.crit || 0)) h *= 1.5;
  h = Math.round(h);
  const real = Math.min(h, tgt.maxHp - tgt.hp);
  tgt.hp += real;
  if (h > 0) floatText(tgt.x + rnd(-6, 6), tgt.y - 48, '+' + h, '#7dff8a', quiet ? .8 : 1.05);
  if (src.team === 'party' && real > 0) {
    gaugeAdd(real * .8);
    for (const f of G.foes) if (f.aggro && !f.dead) addThreat(f, src, real * .35);
  }
  return real;
}
function addThreat(f, src, v) {
  if (f.dead || src.team !== 'party') return;
  if (!f.aggro) aggro(f, src);
  f.threat.set(src, (f.threat.get(src) || 0) + v);
}
function taunt(f, src, dur) {
  aggro(f, src);
  let top = 0; for (const v of f.threat.values()) top = Math.max(top, v);
  f.threat.set(src, top * 1.25 + 50);
  f.forced = src; f.forcedT = dur;
  floatText(f.x, f.y - 50, 'Taunted', '#ffcf6a', .8);
}
function aggro(f, src, chain = true) {
  if (f.dead || f.evade) return;
  const was = f.aggro;
  f.aggro = true;
  if (!f.threat.has(src) && src.team === 'party') f.threat.set(src, 1);
  if (!was) {
    if (f.def.boss) bossPull(f);
    if (chain && !f.def.boss) for (const o of G.foes) if (o !== f && !o.aggro && !o.dead && !o.def.boss && dist(o, f) < 4.5 * TILE) aggro(o, src, false);
    if (!G.target || G.target.dead) { /* don't steal target */ }
  }
}
function foeTarget(f) {
  if (f.forcedT > 0 && f.forced && !f.forced.dead) return f.forced;
  let best = null, bv = -1;
  for (const [e, v] of f.threat) { if (e.dead) { f.threat.delete(e); continue; } if (v > bv) { bv = v; best = e; } }
  return best;
}
function kill(e, src) {
  if (e.key === 'orhun' && P.handan.tal('phoenix') && !P.handan.dead && !G.phoenixUsed) {
    G.phoenixUsed = true; e.hp = Math.round(e.maxHp * .3); sparkle(e, '#ffd27a'); burstFx(e.x, e.y - 20, 40, '#ffd27a', 16); floatText(e.x, e.y - 70, 'Phoenix Thread!', '#ffd27a', 1.2); sfx('heal'); return;
  }
  e.hp = 0; e.dead = true; e.buffs = [];
  if (e.team === 'foe') {
    e.deathT = 0;
    if (G.target === e) { G.target = null; G.autoAtk = false; }
    const d = e.def;
    if (!d.orb) {
      const diff = G.level - d.lvl;
      const xp = Math.round(d.xp * (diff >= 4 ? .25 : diff >= 3 ? .6 : 1));
      gainXp(xp);
      if (d.gold) { const g = Math.round(rint(d.gold[0], d.gold[1]) * (1 + B('gold') / 100)); G.gold += g; floatText(e.x, e.y - 20, '+' + g + 'g', '#f2c75c', .8); }
      qProgress(d.boss ? 'boss' : 'kill', e.type);
      if (d.boss) qProgress('kill', e.type);
      rollLoot(e);
      G.kills++;
    }
    if (d.boss) {
      G.bossDead[e.type] = true; sfx('boom'); shake(10);
      banner(d.name, 'Defeated');
      for (const f of G.foes) if (!f.dead && f.summoned) { f.hp = 0; f.dead = true; f.deathT = 0; burstFx(f.x, f.y - 10, 16, '#7a5aa8', 8); }
      G.teles = []; G.pools = []; G.eclipse = false; G.blizzard = false;
      saveGame(true);
    }
    burstFx(e.x, e.y - 10, 26, d.boss ? '#e0a64e' : '#7a5aa8', 14);
  } else if (e.hero) {
    sfx('die'); log(e.name + ' has fallen!', '#ff7a6a');
    e.reviveT = 0;
    if (G.ctrl === e.key && !otherHero().dead && !G.coop) { swapHero(true); }
    if (P.orhun.dead && P.handan.dead) { G.wipeT = 3.5; banner('The light fades...', 'You will return at the last safe place'); }
  } else if (e.pet) { e.respawnT = 15; log('Lumen fades into jade mist.', '#8affe0'); }
}

/* ---------- Effects helpers used by abilities ---------- */
function sfx(n) { SND.sfx(n); }
function shake(v) { G.shake = Math.max(G.shake, v); }
function floatText(x, y, text, col, size = 1) { G.texts.push({ x, y, text, col, size, t: 0, dur: 1.1, vx: rnd(-10, 10) }); }
function ring(x, y, r, col) { G.fx.push({ k: 'ring', x, y, r, col, t: 0, dur: .45 }); }
function burstFx(x, y, r, col, n = 18) { G.fx.push({ k: 'ring', x, y, r, col, t: 0, dur: .5 }); for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = rnd(40, 140); G.fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, col, t: 0, dur: rnd(.4, .8), sz: rnd(2, 4) }); } }
function sparkle(e, col) { for (let i = 0; i < 12; i++) G.fx.push({ k: 'p', x: e.x + rnd(-12, 12), y: e.y - rnd(0, 30), vx: rnd(-10, 10), vy: rnd(-60, -20), col, t: 0, dur: rnd(.5, .9), sz: rnd(2, 3) }); }
function spinFx(c) { G.fx.push({ k: 'spin', x: c.x, y: c.y - 14, r: 2.3 * TILE, t: 0, dur: .35, col: '#e8eef8' }); }
function vines(t) { G.fx.push({ k: 'vines', e: t, t: 0, dur: 4 }); }
function swing(c, t, big) { c.swingT = .25; if (t) c.face = t.x >= c.x ? 1 : -1; G.fx.push({ k: 'slash', x: t ? t.x : c.x, y: (t ? t.y : c.y) - 16, t: 0, dur: .2, big, a: Math.random() * 3 }); sfx('slash'); }
function shoot(src, tgt, col, speed, onHit, size = 5) { G.proj.push({ x: src.x, y: src.y - 22, tgt, col, speed, onHit, size, t: 0 }); }
function foesNear(e, R) { return G.foes.filter(f => !f.dead && !f.evade && dist(f, e) <= R + f.r); }
function foesNearPt(x, y, R) { return G.foes.filter(f => !f.dead && !f.evade && Math.hypot(f.x - x, f.y - y) <= R + f.r); }
function log(msg, col = '#d9d4c6') { const el = $('log'); const d = document.createElement('div'); d.style.color = col; d.textContent = msg; el.appendChild(d); while (el.children.length > 9) el.removeChild(el.firstChild); }

/* ---------- Abilities ---------- */
function abilityList(h) { return ABIL[h.key]; }
function acost(h, a) { return a.costFn ? a.costFn(h) : a.cost; }
function abilityReady(h, a) {
  if (G.level < a.lvl) return 'locked';
  if (h.dead) return 'dead';
  if (has(h, 'stun')) return 'stunned';
  if ((h.cds[a.id] || 0) > 0) return 'cd';
  if (h.gcd > 0 && a.cd !== undefined) return 'gcd';
  if (h.res < acost(h, a)) return 'res';
  return 'ok';
}
function resolveTarget(h, a, explicit) {
  if (a.tgt === 'self') return h;
  if (a.tgt === 'ally') {
    if (explicit && explicit.team === 'party' && !explicit.dead && explicit.hero) return explicit;
    if (G.target && G.target.team === 'party' && G.target.hero && !G.target.dead && h === ctrlHero()) return G.target;
    if (a.id === 'ward') return P.orhun.dead ? h : P.orhun;
    const hs = heroes().filter(x => !x.dead).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
    return hs[0] || h;
  }
  if (explicit && explicit.team === 'foe' && !explicit.dead) return explicit;
  if (h === ctrlHero() && G.target && G.target.team === 'foe' && !G.target.dead) return G.target;
  if (h !== ctrlHero() && h.target && h.target.team === 'foe' && !h.target.dead && !h.target.evade && dist(h, h.target) - h.target.r < (a.range + .5) * TILE) return h.target;
  // auto-pick nearest foe in range
  let best = null, bd = 1e9;
  for (const f of G.foes) { if (f.dead || f.evade) continue; const d = dist(f, h) - f.r; if (d < (a.range + .5) * TILE && d < bd && lineClear(h.x, h.y - 10, f.x, f.y - 10, 3)) { bd = d; best = f; } }
  return best;
}
function useAbility(h, idx, explicit, quiet) {
  const a = abilityList(h)[idx]; if (!a) return false;
  const st = abilityReady(h, a);
  const say = (m) => { if (!quiet) { floatText(h.x, h.y - 60, m, '#ff9a8a', .85); sfx('deny'); } };
  if (st !== 'ok') { if (!quiet) { if (st === 'locked') say('Unlocks at level ' + a.lvl); else if (st === 'res') say(h.key === 'orhun' ? 'Not enough rage' : 'Not enough mana'); else if (st === 'cd') say('Not ready yet'); } return false; }
  const t = resolveTarget(h, a, explicit);
  if (!t) { say(a.tgt === 'foe' ? 'No target' : 'No ally'); return false; }
  if (a.tgt !== 'self') {
    const d = dist(h, t) - t.r - h.r;
    if (d > a.range * TILE) { say('Out of range'); return false; }
    if (a.minRange && d < a.minRange * TILE) { say('Too close'); return false; }
    if (a.range > 3 && !lineClear(h.x, h.y - 10, t.x, t.y - 10, 3)) { say('No line of sight'); return false; }
  }
  h.res = Math.max(0, h.res - acost(h, a)); if (h.key === 'orhun' && a.gain) rageGain(h, a.gain);
  h.cds[a.id] = Math.max(0, a.cd + (a.cdMod ? a.cdMod(h) : 0)) * (1 - Math.min(.5, B('haste') / 100));
  h.gcd = GCD;
  if (t.team === 'foe') { if (h === ctrlHero()) { G.target = t; G.autoAtk = true; } h.target = t; h.face = t.x >= h.x ? 1 : -1; }
  if (h.key === 'handan') h.swingT = .3;
  a.use(h, t);
  if (!quiet) flashSlot(idx, h.key);
  return true;
}

/* ---------- Hero updates ---------- */
function unstick(e) {
  const z = G.zone; if (!z || !circleHitsSolid(z, e.x, e.y, e.r * .8)) return;
  for (let r = 6; r < 4 * TILE; r += 6) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r; if (!circleHitsSolid(z, x, y, e.r * .8)) { e.x = x; e.y = y; e.path = null; return; } }
}
function heroTick(h, dt) {
  h.t += dt;
  if (!h.dead && !G.mounted) unstick(h);
  if (h.iframes > 0) h.iframes -= dt;
  if (h.dead) {
    if (!G.inCombat && !(P.orhun.dead && P.handan.dead)) { h.reviveT += dt; if (h.reviveT > 4) { h.dead = false; h.hp = Math.round(h.maxHp * .35); h.lowWarned = false; const o = h === P.orhun ? P.handan : P.orhun; h.x = o.x + 20; h.y = o.y + 10; sparkle(h, '#fff2b0'); log(h.name + ' is back on their feet.', '#8affe0'); } }
    return;
  }
  tickBuffs(h, dt);
  const cdr = mod(h, 'cdr');
  for (const k in h.cds) if (h.cds[k] > 0) h.cds[k] = Math.max(0, h.cds[k] - dt * (k === 'dodge' ? 1 : cdr));
  h.gcd = Math.max(0, h.gcd - dt);
  h.swingT = Math.max(0, h.swingT - dt);
  if (h.flash) h.flash = Math.max(0, h.flash - dt);
  if (h.key === 'handan') h.res = Math.min(h.resMax, h.res + (G.inCombat ? (3.2 + h.resMax * .012) * (h.tal('deepwells') ? 1.4 : 1) * (1 + B('mana') / 100) : h.resMax * .12) * dt);
  if (G.inCombat && B('regen')) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * B('regen') / 100 * dt);
  else if (!G.inCombat) h.res = Math.max(0, h.res - 4 * dt);
  if (!G.inCombat && h.hp < h.maxHp) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * .05 * dt);
  if (h.hp / h.maxHp > .5) h.lowWarned = false;
  // dash
  if (h.dash) {
    const s = Math.min(h.dash.left, h.dash.sp * dt);
    moveEnt(h, h.dash.vx * s, h.dash.vy * s); h.dash.left -= s;
    G.fx.push({ k: 'p', x: h.x, y: h.y - 10, vx: 0, vy: 0, col: '#ffe6a8', t: 0, dur: .25, sz: 4 });
    if (h.dash.left <= 0 || h.blockedX || h.blockedY) { const cb = h.dash.onEnd; h.dash = null; cb && cb(); }
    h.blockedX = h.blockedY = false;
    return;
  }
  // auto attack
  h.autoT -= dt;
  const tgt = h === ctrlHero() ? (G.autoAtk ? G.target : null) : h.target;
  if (tgt && tgt.team === 'foe' && !tgt.dead && !has(h, 'stun') && h.autoT <= 0) {
    const wt = heroWeapon(h), W = WPROF[wt];
    const d = dist(h, tgt) - tgt.r - h.r;
    if (d <= W.reach && (h.key === 'orhun' || lineClear(h.x, h.y - 10, tgt.x, tgt.y - 10, 3))) {
      h.autoT = W.rate / (mod(h, 'aspd') * (1 + B('aspd') / 100));
      h.swingKind = wt; h.swingN = (h.swingN || 0) + 1;
      if (h.key === 'orhun') {
        h.face = tgt.x >= h.x ? 1 : -1;
        if (wt === 'spear') { h.swingT = .22; const a = Math.atan2(tgt.y - h.y, tgt.x - h.x); zap(h.x, h.y - 16, tgt.x + Math.cos(a) * 20, tgt.y - 16 + Math.sin(a) * 20, '#f4f6ff', true); sfx('slash'); }
        else swing(h, tgt, wt === 'greataxe');
        dealDamage(h, tgt, h.atk * W.mult, { threat: 1.4 });
        if (wt === 'greataxe' || B('cleave')) for (const o of foesNear(tgt, 1.6 * TILE)) if (o !== tgt) dealDamage(h, o, h.atk * W.mult * (wt === 'greataxe' ? .6 : .4), { threat: 1.2 });
        if (wt === 'spear') { const a = Math.atan2(tgt.y - h.y, tgt.x - h.x); const o = G.foes.find(f => f !== tgt && !f.dead && !f.evade && Math.hypot(f.x - (tgt.x + Math.cos(a) * 34), f.y - (tgt.y + Math.sin(a) * 34)) < 30 + f.r); if (o) dealDamage(h, o, h.atk * W.mult * .6, { threat: 1.2 }); }
        rageGain(h, 8 * (wt === 'twinblades' ? .55 : wt === 'greataxe' ? 1.4 : 1));
      } else {
        h.swingT = .2; h.face = tgt.x >= h.x ? 1 : -1;
        const chainExtra = B('chainatk');
        const chainFrom = (first, n, mult) => { let cur = first; const hit = new Set([first]); for (let k = 0; k < n; k++) { const nx = G.foes.filter(f => !f.dead && !f.evade && !hit.has(f) && dist(f, cur) < 4 * TILE).sort((a, b) => dist(a, cur) - dist(b, cur))[0]; if (!nx) break; hit.add(nx); zap(cur.x, cur.y - 16, nx.x, nx.y - 16, wt === 'tome' ? '#d8b8ff' : '#9ff5d0'); mult *= .7; dealDamage(h, nx, h.atk * mult, { threat: 1 }); cur = nx; } };
        if (wt === 'tome') { zap(h.x, h.y - 26, tgt.x, tgt.y - 16, '#d8b8ff'); dealDamage(h, tgt, h.atk * W.mult, { threat: 1 }); chainFrom(tgt, 2 + chainExtra, W.mult); sfx('cast'); }
        else if (wt === 'orb') shoot(h, tgt, '#9fe8ff', 230, () => { dealDamage(h, tgt, h.atk * W.mult, { threat: 1 }); for (const o of foesNear(tgt, 1.4 * TILE)) if (o !== tgt) dealDamage(h, o, h.atk * W.mult * .5, { threat: .8 }); burstFx(tgt.x, tgt.y - 16, 30, '#9fe8ff', 6); if (chainExtra) chainFrom(tgt, chainExtra, W.mult); }, 7);
        else if (wt === 'wand') shoot(h, tgt, '#c9ffe6', 520, () => { dealDamage(h, tgt, h.atk * W.mult, { threat: 1 }); if (chainExtra) chainFrom(tgt, chainExtra, W.mult); }, 2.5);
        else shoot(h, tgt, '#46c495', 360, () => { dealDamage(h, tgt, h.atk * W.mult, { threat: 1 }); if (chainExtra) chainFrom(tgt, chainExtra, W.mult); }, 3);
      }
    }
  }
}

function moveHero(h, vx, vy, dt) {
  if (has(h, 'root') || has(h, 'stun')) { h.moving = false; return; }
  const len = Math.hypot(vx, vy);
  if (len < .01) { h.moving = false; return; }
  vx /= len; vy /= len;
  const tile = G.zone.get(Math.floor(h.x / TILE), Math.floor(h.y / TILE));
  const sp = (HERO[h.key] ? HERO[h.key].speed : 140) * mod(h, 'speed') * (1 + B('speed') / 100);
  h.lastMv = [vx, vy]; h.lastMvT = G.t;
  const slow = tile === T.MARSH ? .72 : 1;
  const ox = h.x, oy = h.y;
  moveEnt(h, vx * sp * slow * dt, vy * sp * slow * dt);
  h.blockedX = h.blockedY = false;
  if (G.coop && h.hero) {
    const o = h === P.orhun ? P.handan : P.orhun;
    if (!o.dead) {
      const mx = W / ZOOM - 140, my = H / ZOOM - 170;
      const over = (x, y) => Math.max(0, Math.abs(x - o.x) - mx) + Math.max(0, Math.abs(y - o.y) - my);
      if (over(h.x, h.y) > over(ox, oy)) { h.x = ox; h.y = oy; }
    }
  }
  h.moving = true;
  if (Math.abs(vx) > Math.abs(vy)) { h.dir = 2; h.face = vx > 0 ? 1 : -1; } else h.dir = vy > 0 ? 0 : 1;
}
function steer(e, tx, ty, dt, speed, stopAt = 6) {
  const d = Math.hypot(tx - e.x, ty - e.y);
  if (d <= stopAt) { e.moving = false; return true; }
  e.pathT -= dt;
  let gx = tx, gy = ty;
  if (!lineClear(e.x, e.y, tx, ty, e.r * .8)) {
    if (!e.path || e.pathT <= 0 || !e.path.length) { e.path = findPath(e.x, e.y, tx, ty, 3500); e.pathT = .7; }
    if (e.path && e.path.length) { [gx, gy] = e.path[0]; if (Math.hypot(gx - e.x, gy - e.y) < 8) { e.path.shift(); if (e.path.length) [gx, gy] = e.path[0]; } }
  } else e.path = null;
  const vx = gx - e.x, vy = gy - e.y;
  if (e.hero || e.pet) {
    if (e.hero) moveHero(e, vx, vy, dt);
    else { const l = Math.hypot(vx, vy) || 1; moveEnt(e, vx / l * speed * dt, vy / l * speed * dt); e.moving = true; e.face = vx >= 0 ? 1 : -1; }
  } else {
    const l = Math.hypot(vx, vy) || 1;
    moveEnt(e, vx / l * speed * dt, vy / l * speed * dt); e.moving = true; if (Math.abs(vx) > 2) e.face = vx > 0 ? 1 : -1;
  }
  return false;
}

function engagedFoes(range = 15) {
  const c = ctrlHero();
  return G.foes.filter(f => f.aggro && !f.dead && !f.evade && dist(f, c) < range * TILE);
}

/* Generic skill AI: every skill carries an ai(h, ctx) that returns a target (or true for self) when it is worth casting. */
function aiCtx(h, eng) {
  const lo = heroes().filter(x => !x.dead).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const t = h.target && !h.target.dead && h.target.team === 'foe' ? h.target : null;
  return { eng, t, d: t ? dist(h, t) - t.r - h.r : 1e9, lo, near: foesNear(h, 2.3 * TILE).length, mana: h.key === 'handan' ? h.res / h.resMax : 1 };
}
function aiCast(h, eng, filter) {
  if (h.gcd > 0 || h.dead || h.dash || has(h, 'stun')) return false;
  const C = aiCtx(h, eng);
  const list = ABIL[h.key].map((a, i) => ({ a, i })).filter(o => o.a.ai && (!filter || filter(o.a)) && abilityReady(h, o.a) === 'ok').sort((x, y) => (y.a.prio || 0) - (x.a.prio || 0));
  for (const { a, i } of list) {
    let tg = null; try { tg = a.ai(h, C); } catch (e) { tg = null; }
    if (tg && useAbility(h, i, tg === true ? null : tg, true)) return true;
  }
  return false;
}
function heroAI(h, dt) {
  if (h.dead || h.dash || has(h, 'stun')) return;
  const lead = ctrlHero();
  const eng = engagedFoes();
  if (eng.length) {
    if (h.key === 'orhun') {
      let t = (G.target && G.target.team === 'foe' && !G.target.dead && G.target.aggro) ? G.target : null;
      const onSoft = eng.filter(f => { const ft = foeTarget(f); return ft && ft !== P.orhun; }).sort((a, b) => dist(a, P.handan) - dist(b, P.handan));
      if (!t) t = onSoft[0] || eng.slice().sort((a, b) => dist(a, h) - dist(b, h))[0];
      h.target = t;
      aiCast(h, eng);
      const d = dist(h, t) - t.r - h.r;
      if (d > weaponReach(h) - 4) steer(h, t.x, t.y, dt, 0, t.r + h.r + 10);
      else { h.moving = false; h.face = t.x >= h.x ? 1 : -1; h.dir = 2; }
    } else {
      let t = (G.target && G.target.team === 'foe' && !G.target.dead && G.target.aggro) ? G.target : (P.orhun.target && !P.orhun.target.dead ? P.orhun.target : null);
      if (!t) t = eng.slice().sort((a, b) => dist(a, h) - dist(b, h))[0];
      const orb = eng.filter(f => f.def.orb).sort((a, b) => dist(a, h) - dist(b, h))[0];
      if (orb) t = orb;
      h.target = t;
      h.aiT -= dt;
      if (h.aiT <= 0 && h.gcd <= 0) { h.aiT = .15; aiCast(h, eng); }
      // positioning: keep 4-7 tiles from target, near leader
      const avoidPool = G.pools.find(p => !p.ally && Math.hypot(p.x - h.x, p.y - h.y) < p.r + 6) || G.teles.find(p => p.harm && Math.hypot(p.x - h.x, p.y - h.y) < p.r + 8);
      if (avoidPool) { const a = Math.atan2(h.y - avoidPool.y, h.x - avoidPool.x); moveHero(h, Math.cos(a), Math.sin(a), dt); }
      else if (t) {
        const d = dist(h, t);
        const melee = eng.find(f => foeTarget(f) === h && !f.def.ranged && dist(f, h) < 2.2 * TILE);
        if (melee && !P.orhun.dead) { steer(h, P.orhun.x - (melee.x - P.orhun.x) * .5, P.orhun.y - (melee.y - P.orhun.y) * .5, dt, 0, 10); }
        else if (d > 7.2 * TILE) steer(h, t.x, t.y, dt, 0, 5 * TILE);
        else if (!lineClear(h.x, h.y - 10, t.x, t.y - 10, 3)) steer(h, t.x, t.y, dt, 0, TILE);
        else if (d < 3.2 * TILE && !t.def.ranged) { const a = Math.atan2(h.y - t.y, h.x - t.x); moveHero(h, Math.cos(a), Math.sin(a), dt); }
        else { h.moving = false; h.face = t.x >= h.x ? 1 : -1; h.dir = 2; }
      }
    }
    { const tl = G.teles.find(p => p.harm && Math.hypot(p.x - h.x, p.y - h.y) < p.r + 4 && p.t > p.dur * .5); if (tl && !(h.cds.dodge > 0)) { dodge(h, h.x - tl.x, h.y - tl.y); return; } }
    if (h.key === 'orhun') { const tl = G.teles.find(p => p.harm && Math.hypot(p.x - h.x, p.y - h.y) < p.r + 6 && p.t > p.dur * .35); if (tl) { const a = Math.atan2(h.y - tl.y, h.x - tl.x); moveHero(h, Math.cos(a), Math.sin(a), dt); } }
    return;
  }
  // out of combat: heal up, follow leader
  h.target = null;
  if (h.key === 'handan' && h.gcd <= 0 && h.res > 40) {
    const lo = heroes().filter(x => !x.dead).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (lo && lo.hp / lo.maxHp < .5) { const i = ABIL.handan.findIndex(a => a.role === 'heal' && abilityReady(h, a) === 'ok'); if (i >= 0) useAbility(h, i, lo, true); }
  }
  followLeader(h, lead, dt, h.key === 'orhun' ? 1 : -1);
}
function followLeader(e, lead, dt, side) {
  if (lead.dead) { e.moving = false; return; }
  const fx = lead.x - lead.face * 26 + side * 4, fy = lead.y + side * 18;
  const d = Math.hypot(fx - e.x, fy - e.y);
  if (d > 28 * TILE) { e.x = lead.x; e.y = lead.y; e.path = null; return; }
  if (d > 30) steer(e, fx, fy, dt, e.pet ? 150 : 0, 18);
  else e.moving = false;
}
function foxTick(f, dt) {
  f.t += dt;
  if (f.dead) { f.respawnT -= dt; if (f.respawnT <= 0 && !P.handan.dead) { f.dead = false; f.hp = f.maxHp; f.x = P.handan.x; f.y = P.handan.y; sparkle(f, '#8affe0'); } return; }
  if (P.handan.dead) { f.moving = false; return; }
  tickBuffs(f, dt);
  if (f.flash) f.flash = Math.max(0, f.flash - dt);
  if (!G.inCombat && f.hp < f.maxHp) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * .08 * dt);
  const eng = engagedFoes();
  if (eng.length) {
    let t = P.orhun.target && !P.orhun.target.dead ? P.orhun.target : (P.handan.target && !P.handan.target.dead ? P.handan.target : eng[0]);
    if (ctrlHero() && G.target && G.target.team === 'foe' && !G.target.dead && G.target.aggro) t = G.target;
    const d = dist(f, t) - t.r - f.r;
    if (d > 14) steer(f, t.x + (f.x < t.x ? -t.r : t.r), t.y + 4, dt, 165, 6);
    else { f.moving = false; f.face = t.x >= f.x ? 1 : -1; f.autoT -= dt; if (f.autoT <= 0) { f.autoT = 1.3; dealDamage(f, t, f.atk, { threat: 1 }); if (P.handan.tal('lumenfury') && !t.dead) { addBuff(t, { id: 'lchill', name: 'Chilled', dur: 3, mods: { speed: .7 }, col: '#9fdcff' }); heal(P.handan, P.handan, P.handan.maxHp * .02, true); } } }
  } else followLeader(f, P.handan, dt, 2);
}

/* ---------- Foe AI ---------- */
function foeTick(f, dt) {
  f.t += dt;
  if (f.dead) { f.deathT += dt; return; }
  tickBuffs(f, dt);
  if (f.dead) return;
  if (f.flash) f.flash = Math.max(0, f.flash - dt);
  f.swing = Math.max(0, f.swing - dt * 3);
  f.forcedT = Math.max(0, f.forcedT - dt);
  if (f.evade) {
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * .5 * dt);
    if (steer(f, f.home.x, f.home.y, dt, f.def.spd * 1.6, 8) || Math.hypot(f.x - f.home.x, f.y - f.home.y) < 10) { f.evade = false; f.hp = f.maxHp; f.moving = false; }
    return;
  }
  if (has(f, 'stun')) { f.moving = false; return; }
  const rooted = has(f, 'root');
  if (f.def.orb) { // drift toward king
    const k = G.foes.find(x => x.type === 'king' && !x.dead);
    if (!k) { f.hp = 0; f.dead = true; return; }
    if (!f.aggro) { for (const h of heroes()) if (!h.dead) f.threat.set(h, 1); f.aggro = true; }
    steer(f, k.x, k.y, dt, f.def.spd, k.r + 6);
    if (dist(f, k) < k.r + 14) { heal(k, k, k.maxHp * .05); floatText(k.x, k.y - 80, 'The King devours a Shadow Orb', '#c58aff', 1); f.dead = true; f.hp = 0; f.deathT = 0; burstFx(k.x, k.y - 30, 30, '#c58aff'); }
    return;
  }
  if (!f.aggro) {
    // idle wander + detect
    f.wanderT -= dt;
    if (!f.def.boss) {
      if (f.wanderT <= 0) { f.wanderT = rnd(3, 7); const a = Math.random() * 6.28, r = rnd(10, 60); f.wander = { x: f.home.x + Math.cos(a) * r, y: f.home.y + Math.sin(a) * r }; }
      if (f.wander) { if (steer(f, f.wander.x, f.wander.y, dt, f.def.spd * .35, 6) || f.blockedX || f.blockedY) { f.wander = null; f.moving = false; } f.blockedX = f.blockedY = false; }
    }
    const R = (f.def.boss ? 6.5 : f.def.ranged ? 6 : 5) * TILE;
    for (const h of partyAlive()) if (dist(f, h) < R && lineClear(f.x, f.y - 8, h.x, h.y - 8, 4)) { aggro(f, h); break; }
    return;
  }
  const tgt = foeTarget(f);
  const leash = f.def.boss ? 15 * TILE : 20 * TILE;
  if (!tgt || dist(f, f.home) > leash || (tgt && dist(tgt, f.home) > leash + 4 * TILE)) { resetFoe(f); return; }
  if (f.def.boss) { if (bossTick(f, tgt, dt)) return; }
  const d = dist(f, tgt) - tgt.r - f.r;
  const range = f.def.range;
  const hasLos = !f.def.ranged || lineClear(f.x, f.y - 10, tgt.x, tgt.y - 10, 3);
  if ((d > range || !hasLos) && !rooted) steer(f, tgt.x, tgt.y, dt, f.def.spd * (f.enraged ? 1.15 : 1) * mod(f, 'speed'), f.def.ranged ? 0 : tgt.r + f.r + range * .5);
  else f.moving = false;
  // separation
  for (const o of G.foes) { if (o === f || o.dead) continue; const dd = dist(o, f), m = o.r + f.r; if (dd < m && dd > .1) { const p = (m - dd) * .5; moveEnt(f, (f.x - o.x) / dd * p, (f.y - o.y) / dd * p); } }
  f.blockedX = f.blockedY = false;
  f.atkT -= dt;
  if (d <= range + 2 && hasLos && f.atkT <= 0 && !(f.bs && f.bs.cast)) {
    f.atkT = f.def.rate * rnd(.9, 1.1);
    f.face = tgt.x >= f.x ? 1 : -1;
    if (f.def.ranged) { f.swing = 1; shoot(f, tgt, f.def.proj, 300, () => dealDamage(f, tgt, f.atk * (f.enraged ? 1.25 : 1), {}), 5); }
    else { f.swing = 1; dealDamage(f, tgt, f.atk * (f.enraged ? 1.25 : 1), { melee: true }); }
  }
}
function resetFoe(f) {
  f.aggro = false; f.threat.clear(); f.forced = null; f.forcedT = 0; f.buffs = []; f.evade = true; f.path = null; f.bs = {}; f.enraged = false;
  if (G.target === f) { G.autoAtk = false; }
  if (f.def.boss) { G.teles = []; G.pools = []; G.eclipse = false; for (const o of G.foes) if (o.summoned && !o.dead) { o.dead = true; o.deathT = 1; } log(f.name + ' resets.', '#bbb'); }
}

/* ---------- Bosses ---------- */
function bossPull(f) {
  const lines = BANTER[f.type];
  if (lines && !G.seenBanter[f.type]) { G.seenBanter[f.type] = true; playDialog(lines.map(([w, t]) => ({ who: w, text: t }))); }
  if (!G.target || G.target.dead) { G.target = f; }
  banner(f.name, { gnarl: 'Beast of the Shrine', witch: 'Mistress of Murkfen', king: 'Lord of the Hollow', wyrm: 'The Cold Crown' }[f.type] || '');
}
function tele(x, y, r, dur, onEnd, col = '#ff4a3a', follow) { const t = { x, y, r, dur, t: 0, onEnd, col, harm: true, follow }; G.teles.push(t); return t; }
function hitParty(x, y, r, src, amt) { for (const h of partyAlive()) if (Math.hypot(h.x - x, h.y - y) < r + h.r) dealDamage(src, h, amt, {}); }
function arenaPoint(f, rad) { for (let i = 0; i < 30; i++) { const a = Math.random() * 6.28, r = rnd(rad * .3, rad); const x = f.home.x + Math.cos(a) * r, y = f.home.y + Math.sin(a) * r; if (!circleHitsSolid(G.zone, x, y, 12)) return [x, y]; } return [f.home.x, f.home.y]; }
function summon(type, x, y, src) { const o = makeFoe(type, x / TILE - .5, y / TILE - .5); o.summoned = true; G.foes.push(o); aggro(o, src || ctrlHero(), false); for (const h of heroes()) if (!h.dead) o.threat.set(h, h === P.orhun ? 5 : 3); sparkle(o, '#7a5aa8'); return o; }
function bossTick(f, tgt, dt) {
  const b = f.bs;
  const castBlock = () => { f.moving = false; return true; };
  if (b.cast) { b.cast.t -= dt; f.moving = false; if (b.cast.t <= 0) { const c = b.cast; b.cast = null; c.end && c.end(); } return true; }
  const hpP = f.hp / f.maxHp;
  if (f.type === 'gnarl') {
    if (b.slam === undefined) { b.slam = 7; b.charge = 12; }
    b.slam -= dt; b.charge -= dt;
    if (hpP < .5 && !b.enr) { b.enr = true; f.enraged = true; floatText(f.x, f.y - 80, 'Gnarlback enrages!', '#ff7a3a', 1.3); sfx('roar'); for (let i = 0; i < 3; i++) { const [x, y] = arenaPoint(f, 6 * TILE); summon('pup', x, y, P.orhun); } }
    if (b.slam <= 0) { b.slam = b.enr ? 7 : 9; const x = f.x, y = f.y; tele(x, y, 3.3 * TILE, 1.7); b.cast = { name: 'Ground Slam', t: 1.7, dur: 1.7, end: () => { sfx('boom'); shake(9); burstFx(x, y, 3.3 * TILE, '#c9a060', 24); hitParty(x, y, 3.3 * TILE, f, f.atk * 2.6); } }; return castBlock(); }
    if (b.charge <= 0) {
      b.charge = 13; const hs = heroes().filter(h => !h.dead); const v = hs.find(h => h !== tgt) || hs[0];
      if (v) { const x = v.x, y = v.y; tele(x, y, 1.7 * TILE, 1.4); b.cast = { name: 'Gore Charge', t: 1.4, dur: 1.4, end: () => { const a = Math.atan2(y - f.y, x - f.x); const dd = Math.hypot(x - f.x, y - f.y); for (let s = 0; s < dd; s += 8) moveEnt(f, Math.cos(a) * 8, Math.sin(a) * 8); sfx('crit'); shake(7); burstFx(f.x, f.y, 1.7 * TILE, '#ff8a5a', 14); hitParty(f.x, f.y, 1.7 * TILE, f, f.atk * 2.2); } }; return castBlock(); }
    }
  } else if (f.type === 'witch') {
    if (b.pool === undefined) { b.pool = 6; b.adds = 13; }
    b.pool -= dt; b.adds -= dt;
    if (hpP < .5 && !b.blink) { b.blink = true; const [x, y] = arenaPoint(f, 4 * TILE); burstFx(f.x, f.y - 20, 30, '#7dff9a'); f.x = x; f.y = y; burstFx(f.x, f.y - 20, 30, '#7dff9a'); sfx('tele'); floatText(f.x, f.y - 70, 'The fen shifts beneath you!', '#7dff9a', 1.2); b.pool = 2; }
    if (b.pool <= 0) {
      b.pool = b.blink ? 6.5 : 9;
      const spots = heroes().filter(h => !h.dead).map(h => [h.x, h.y]); spots.push(arenaPoint(f, 5 * TILE));
      for (const [x, y] of spots) tele(x, y, 1.5 * TILE, 1.4, () => { G.pools.push({ x, y, r: 1.5 * TILE, t: 0, dur: 11, dmg: f.atk * .45, src: f, tick: 0 }); }, '#5aff6a');
      b.cast = { name: 'Fen Rot', t: 1.4, dur: 1.4, end: () => sfx('tele') }; return castBlock();
    }
    if (b.adds <= 0) { b.adds = 18; b.cast = { name: 'Call the Fen', t: 1.6, dur: 1.6, end: () => { for (let i = 0; i < (b.blink ? 3 : 2); i++) { const [x, y] = arenaPoint(f, 6 * TILE); summon('mireling', x, y, P.orhun); } } }; return castBlock(); }
  } else if (f.type === 'wyrm') {
    if (b.breath === undefined) { b.breath = 5; b.tail = 9; b.spikes = 6; b.storm = 4; }
    b.breath -= dt; b.tail -= dt;
    if (hpP < .72 && !b.adds1) { b.adds1 = true; floatText(f.x, f.y - 100, 'The ice answers Vyrmhal!', '#bfe6ff', 1.2); for (let i = 0; i < 2; i++) { const [x, y] = arenaPoint(f, 5 * TILE); summon('rimeling', x, y, P.orhun); } }
    if (hpP < .55 && !b.p2) { b.p2 = true; G.blizzard = true; banner('Whiteout', 'Vyrmhal calls the blizzard'); sfx('roar'); b.spikes = 2; }
    if (hpP < .35 && !b.adds2) { b.adds2 = true; for (let i = 0; i < 3; i++) { const [x, y] = arenaPoint(f, 5 * TILE); summon('rimeling', x, y, P.orhun); } }
    if (hpP < .22 && !b.p3) {
      b.p3 = true; G.gauge = 100; sfx('beacon');
      playDialog([{ who: 'handan', text: 'The pendant is burning again! The forge remembers it, Orhun!' }, { who: 'orhun', text: 'Then give it something to remember. Now!' }, { who: 'narrator', text: 'The Lantern gauge is full. Press F (or the lantern button) to unleash Lanternburst.' }]);
    }
    if (b.p2) {
      b.spikes -= dt; b.storm -= dt;
      if (b.storm <= 0) { b.storm = 4; for (const h of partyAlive()) dealDamage(f, h, f.atk * .22, { noCrit: true, dot: true }); }
      if (b.spikes <= 0) {
        b.spikes = 7; const spots = heroes().filter(h => !h.dead).map(h => [h.x, h.y]); spots.push(arenaPoint(f, 5 * TILE), arenaPoint(f, 5 * TILE));
        for (const [x, y] of spots) tele(x, y, 1.4 * TILE, 1.5, () => { burstFx(x, y, 1.4 * TILE, '#bfe6ff', 10); sfx('crit'); hitParty(x, y, 1.4 * TILE, f, f.atk * 1.8); }, '#7ec8ff');
      }
    }
    if (b.breath <= 0) {
      b.breath = b.p2 ? 8 : 9.5; const a = Math.atan2(tgt.y - f.y, tgt.x - f.x); const pts = [];
      for (let k = 1; k <= 5; k++) pts.push([f.x + Math.cos(a) * k * 1.45 * TILE, f.y + Math.sin(a) * k * 1.45 * TILE]);
      for (const [x, y] of pts) tele(x, y, 1.2 * TILE, 1.7, null, '#7ec8ff');
      b.cast = { name: 'Frost Breath', t: 1.7, dur: 1.7, end: () => {
        sfx('whirl'); shake(7); const hit = new Set();
        for (const [x, y] of pts) { burstFx(x, y, 1.2 * TILE, '#dff4ff', 8); for (const h of partyAlive()) if (!hit.has(h) && Math.hypot(h.x - x, h.y - y) < 1.2 * TILE + h.r) { hit.add(h); dealDamage(f, h, f.atk * 2.3, {}); addBuff(h, { id: 'chill', name: 'Chilled', dur: 4, mods: { speed: .6 }, col: '#9fdcff', debuff: true }); } }
      } };
      return castBlock();
    }
    if (b.tail <= 0) {
      b.tail = b.p2 ? 8 : 10; const x = f.x, y = f.y; tele(x, y, 2.9 * TILE, 1.5, null, '#7ec8ff');
      b.cast = { name: 'Tail Sweep', t: 1.5, dur: 1.5, end: () => { f.swing = 1; sfx('boom'); shake(9); burstFx(x, y, 2.9 * TILE, '#bfe6ff', 20); hitParty(x, y, 2.9 * TILE, f, f.atk * 2.4); } };
      return castBlock();
    }
  } else if (f.type === 'king') {
    if (b.cleave === undefined) { b.cleave = 6; b.orbs = 11; b.rings = 9; }
    b.cleave -= dt; b.orbs -= dt;
    if (hpP < .6 && !b.p2) { b.p2 = true; banner('Eclipse', 'The Hollow King drinks the light'); sfx('roar'); G.eclipse = true; }
    if (b.p2) b.rings -= dt;
    if (hpP < .25 && !b.p3) {
      b.p3 = true; G.gauge = 100; sfx('beacon');
      playDialog([{ who: 'handan', text: 'Orhun, the pendant! It\'s burning! I can feel the First Lantern answering!' }, { who: 'orhun', text: 'Then let\'s give him everything. Now!' }, { who: 'narrator', text: 'The Lantern gauge is full. Press F to unleash Lanternburst.' }]);
    }
    if (b.cleave <= 0) { b.cleave = b.p2 ? 6 : 7.5; const x = tgt.x, y = tgt.y; tele(x, y, 2.4 * TILE, 1.4); b.cast = { name: 'Hollow Cleave', t: 1.4, dur: 1.4, end: () => { f.swing = 1; sfx('crit'); shake(8); burstFx(x, y, 2.4 * TILE, '#c58aff', 16); hitParty(x, y, 2.4 * TILE, f, f.atk * 2.4); } }; return castBlock(); }
    if (b.orbs <= 0) {
      b.orbs = b.p2 ? 17 : 20; floatText(f.x, f.y - 90, 'Shadow Orbs rise! Destroy them!', '#c58aff', 1.25); sfx('tele');
      const pts = [[-6, -5], [6, -5], [-6, 5], [6, 5]];
      for (const [ox, oy] of pts) { const x = f.home.x + ox * TILE, y = f.home.y + oy * TILE; if (!circleHitsSolid(G.zone, x, y, 10)) { const o = summon('orb', x, y, P.orhun); o.summoned = true; } }
    }
    if (b.p2 && b.rings <= 0) { b.rings = 8; for (const h of heroes().filter(h => !h.dead)) { const hx = h.x, hy = h.y; tele(hx, hy, 2 * TILE, 1.8, () => { burstFx(hx, hy, 2 * TILE, '#8a4ae8', 10); hitParty(hx, hy, 2 * TILE, f, f.atk * 1.7); }, '#a05aff'); } }
  }
  return false;
}

/* ---------- Projectiles, fx, pools ---------- */
function updateProj(dt) {
  for (const p of G.proj) {
    p.t += dt;
    const tg = p.tgt; if (!tg) { p.done = true; continue; }
    const tx = tg.x, ty = tg.y - 16;
    const d = Math.hypot(tx - p.x, ty - p.y);
    if (d < 10 || tg.dead) { p.done = true; if (!tg.dead) p.onHit(); continue; }
    p.x += (tx - p.x) / d * p.speed * dt; p.y += (ty - p.y) / d * p.speed * dt;
    if (Math.random() < .6) G.fx.push({ k: 'p', x: p.x, y: p.y, vx: 0, vy: 0, col: p.col, t: 0, dur: .25, sz: p.size * .6 });
    if (p.t > 3) p.done = true;
  }
  G.proj = G.proj.filter(p => !p.done);
  for (const f of G.fx) { f.t += dt; if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 60 * dt; } }
  G.fx = G.fx.filter(f => f.t < f.dur);
  for (const t of G.texts) { t.t += dt; t.y -= 34 * dt; t.x += t.vx * dt; }
  G.texts = G.texts.filter(t => t.t < t.dur);
  for (const t of G.teles) { t.t += dt; if (t.t >= t.dur) { t.done = true; t.onEnd && t.onEnd(); } }
  G.teles = G.teles.filter(t => !t.done);
  for (const p of G.pools) {
    p.t += dt; p.tick -= dt;
    if (p.tick <= 0) { p.tick = .8; for (const h of partyAlive()) if (Math.hypot(h.x - p.x, h.y - p.y) < p.r + h.r * .5) dealDamage(p.src, h, p.dmg, { noCrit: true, dot: true }); }
  }
  G.pools = G.pools.filter(p => p.t < p.dur);
}

/* ---------- XP, loot, quests ---------- */
function gainXp(n) {
  if (G.level >= MAX_LVL) return;
  n = Math.round(n * (1 + B('xpb') / 100));
  G.xp += n; floatText(ctrlHero().x, ctrlHero().y - 70, '+' + n + ' xp', '#c9a8ff', .8);
  while (G.level < MAX_LVL && G.xp >= XP_NEED[G.level]) {
    G.xp -= XP_NEED[G.level]; G.level++;
    recalcStats();
    for (const h of heroes()) { h.hp = h.maxHp; if (h.key === 'handan') h.res = h.resMax; if (h.dead) { h.dead = false; h.hp = h.maxHp; } sparkle(h, '#ffe08a'); }
    sfx('level'); banner('Level ' + G.level, 'Orhun and Handan grow stronger');
    log('You reached level ' + G.level + '.', '#ffd86a');
    for (const k of ['orhun', 'handan']) for (const a of SKILL_POOL[k]) if (a.lvl === G.level) toast(G.loadout && G.loadout[k].includes(a.id) ? `${HERO[k].name} learned <b>${a.name}</b>` : `New skill for ${HERO[k].name}: <b>${a.name}</b>. Equip it in Skills (K).`);
    G.pendingBoons = (G.pendingBoons || 0) + 1;
    if (TALENTS[G.level]) G.pendingTalent = G.level;
    rollVendor();
    if (Math.random() < .5) { const l = pick(BANTER.levelup); setTimeout(() => bark(l[0], l[1]), 1500); }
  }
  if (G.level >= MAX_LVL) G.xp = 0;
}
function makeItem(slot, owner, ilvl, rarity) {
  const m = 1 + rarity * .3;
  const stats = {};
  if (slot === 'weapon') { stats.atk = Math.round(ilvl * .95 * m + 1); if (rarity >= 2) stats.crit = +(rnd(.01, .03) * rarity / 2).toFixed(3); }
  if (slot === 'armor') { stats.def = Math.round(ilvl * .6 * m + 1); stats.hp = Math.round(ilvl * 6 * m + 6); }
  if (slot === 'trinket') { const r = Math.random(); if (r < .33) stats.crit = +(.01 + rarity * .012).toFixed(3); else if (r < .66) stats.hp = Math.round(ilvl * 5 * m); else stats.atk = Math.round(ilvl * .5 * m + 1); if (rarity >= 2) stats.hp = (stats.hp || 0) + Math.round(ilvl * 3); }
  const base = pick((owner === 'any' ? ITEM_NAMES.any : ITEM_NAMES[owner])[slot]);
  let name = pick(ITEM_NAMES.pre[rarity]) + ' ' + base + (rarity >= 2 ? pick(ITEM_NAMES.suf) : '');
  return { uid: Math.random().toString(36).slice(2, 9), name, slot, owner, rarity, ilvl, stats, value: Math.round(ilvl * 3 * (1 + rarity * 1.5)) };
}
function randomItem(ilvl, rarity) {
  const slot = pick(['weapon', 'armor', 'weapon', 'armor', 'trinket']);
  const owner = slot === 'trinket' ? 'any' : pick(['orhun', 'handan']);
  return makeItem(slot, owner, ilvl, rarity);
}
function rollRarity(boost = 0) { const r = Math.random() * 100 - boost; return r < 2 ? 3 : r < 12 ? 2 : r < 40 ? 1 : 0; }
function rollLoot(f) {
  const d = f.def;
  if (d.summoned || f.summoned) return;
  let items = [];
  if (d.boss) { items.push(randomItem(d.lvl + 1, Math.random() < .45 ? 3 : 2)); items.push(randomItem(d.lvl, 2)); G.potions += 2; toast('+2 Healing Draughts'); }
  else if (d.elite) items.push(randomItem(d.lvl + 1, Math.max(1, rollRarity(20))));
  else if (Math.random() < .2) items.push(randomItem(d.lvl, rollRarity()));
  if (!d.boss && Math.random() < .08) { G.potions++; toast('Found a Healing Draught'); }
  for (const it of items) giveItem(it);
}
function giveItem(it) {
  if (G.inv.length >= 999) { G.gold += it.value; toast(`Bags full. Sold <span class="c${it.rarity}">${it.name}</span> for ${it.value}g`); return; }
  G.inv.push(it); toast(`Loot: <span class="c${it.rarity}">${it.name}</span>`); sfx('coin');
  refreshCharWin();
}
function qState(id) { return G.q[id] ? G.q[id].st : (QUESTS.find(q => q.id === id).pre.every(p => G.q[p] && G.q[p].st === 'done') ? 'avail' : 'locked'); }
function qTurnin(q) { return q.turnin || q.giver; }
function qProgress(type, key) {
  for (const q of QUESTS) {
    const s = G.q[q.id]; if (!s || s.st !== 'active') continue;
    let changed = false;
    q.obj.forEach((o, i) => {
      if (s.prog[i] >= o.n) return;
      if ((o.t === 'kill' && type === 'kill' && o.e.includes(key)) || (o.t === 'collect' && type === 'collect' && o.item === key) || (o.t === 'boss' && type === 'boss' && o.e === key) || (o.t === 'beacon' && type === 'beacon' && o.id === key) || (o.t === 'visit' && type === 'visit' && o.zone === key)) { s.prog[i]++; changed = true; toast(`${o.label}: ${s.prog[i]}/${o.n}`); }
    });
    if (changed && q.obj.every((o, i) => s.prog[i] >= o.n)) {
      if (q.final) { s.st = 'done'; continue; }
      s.st = 'ready'; sfx('quest'); toast(`<b>${q.name}</b> complete. Return to ${NPCS[qTurnin(q)].name}.`);
    }
    if (changed) renderTracker();
  }
}
function acceptQuest(q) {
  G.q[q.id] = { st: 'active', prog: q.obj.map(() => 0) };
  // credit already-done objectives
  q.obj.forEach((o, i) => { if (o.t === 'visit' && G.zone && G.zone.id === o.zone) G.q[q.id].prog[i] = 1; if (o.t === 'boss' && G.bossDead[o.e]) G.q[q.id].prog[i] = 1; if (o.t === 'beacon' && G.beacons[o.id]) G.q[q.id].prog[i] = 1; });
  if (q.obj.every((o, i) => G.q[q.id].prog[i] >= o.n)) G.q[q.id].st = 'ready';
  sfx('quest'); toast(`Quest accepted: <b>${q.name}</b>`); log('Quest accepted: ' + q.name, '#e0a64e');
  renderTracker(); saveGame(true);
}
function turnIn(q) {
  G.q[q.id].st = 'done';
  gainXp(q.xp); G.gold += q.gold;
  if (q.potions) G.potions += q.potions;
  if (q.item) giveItem(randomItem(G.level + 1, q.item));
  sfx('quest'); toast(`<b>${q.name}</b> turned in. +${q.xp} xp, +${q.gold}g`);
  if (q.id === 'q9') { G.gateOpen = true; toast('The throne gate grinds open.'); }
  if (q.id === 'q15') { G.frostGate = true; toast('The ice gate melts away. The forge road is open.'); }
  renderTracker(); saveGame(true);
}

/* ---------- Interactions ---------- */
function nearestNpc(range = 2.2 * TILE, c = ctrlHero()) { let best = null, bd = range; for (const n of G.npcs) { const d = dist(n, c); if (d < bd) { bd = d; best = n; } } return best; }
function nearestBeacon(range = 2.6 * TILE, c = ctrlHero()) { for (const b of G.zone.beacons) { const d = Math.hypot((b.x + .5) * TILE - c.x, (b.y + .5) * TILE - c.y); if (d < range) return b; } return null; }
function interact(h = ctrlHero()) {
  if (G.dialog) { advanceDialog(); return; }
  const n = nearestNpc(undefined, h); if (n) { talkTo(n); return; }
  const b = nearestBeacon(undefined, h);
  if (b) {
    if (G.beacons[b.id]) { toast('The beacon burns bright.'); return; }
    const bossFor = BEACON_BOSS[b.id];
    if (!G.bossDead[bossFor]) { toast('The Hollow still guards this beacon.'); return; }
    relight(b); return;
  }
}
function relight(b) {
  G.beacons[b.id] = true; sfx('beacon'); shake(6);
  burstFx((b.x + .5) * TILE, (b.y + .5) * TILE - 20, 120, '#7dffc8', 40);
  burstFx((b.x + .5) * TILE, (b.y + .5) * TILE - 20, 70, '#ffd86a', 30);
  qProgress('beacon', b.id);
  if (b.id === 'b3') { setTimeout(showEnding, 2500); saveGame(true); return; }
  if (b.id === 'b4') { setTimeout(showEnding2, 2500); saveGame(true); return; }
  banner('Beacon relit', b.id === 'b1' ? 'Brightfield breathes again' : 'The fog of Murkfen recedes');
  const lines = BANTER[b.id]; if (lines) setTimeout(() => playDialog(lines.map(([w, t]) => ({ who: w, text: t }))), 900);
  saveGame(true);
}
function lanternburst(who) {
  let c = who || ctrlHero(); if (c.dead) c = c === P.orhun ? P.handan : P.orhun;
  if (G.gauge < 100) { floatText(c.x, c.y - 60, 'The lantern is not ready', '#8affe0', .85); sfx('deny'); return; }
  if (c.dead) return;
  G.gauge = 0; sfx('burst'); shake(12);
  burstFx(c.x, c.y - 20, 6 * TILE, '#7dffc8', 60); burstFx(c.x, c.y - 20, 4 * TILE, '#ffd86a', 30);
  G.fx.push({ k: 'flash', t: 0, dur: .6 });
  for (const h of heroes()) { if (h.dead) { h.dead = false; h.hp = 1; h.x = c.x + rnd(-20, 20); h.y = c.y + rnd(-10, 10); } heal(P.handan, h, h.maxHp * .45); }
  const dmg = (P.orhun.atk + P.handan.atk) * 3.2;
  for (const f of foesNear(c, 6 * TILE)) { let d = dmg; if ((f.type === 'king' || f.type === 'wyrm') && f.bs.p3) d += f.maxHp * (f.type === 'wyrm' ? .1 : .12); dealDamage(P.handan, f, d, { noCrit: true, threat: .5 }); }
  floatText(c.x, c.y - 80, 'LANTERNBURST', '#c9f5df', 1.6);
  if (B('lanternlink')) for (const h of heroes()) { for (const k in h.cds) if (k !== 'dodge') h.cds[k] = 0; }
}
function drinkPotion(c = ctrlHero()) {
  if (G.potCd > 0) { floatText(c.x, c.y - 60, 'Potion not ready', '#ff9a8a', .85); return; }
  if (G.potions <= 0) { floatText(c.x, c.y - 60, 'No Healing Draughts', '#ff9a8a', .85); sfx('deny'); return; }
  if (c.dead) return;
  G.potions--; G.potCd = 20; heal(c, c, c.maxHp * .45 * (1 + B('draught') / 100)); sparkle(c, '#ff8a7a'); sfx('heal');
  if (c.key === 'orhun' && c.tal('secondwind')) { c.res = Math.min(100, c.res + 30); addBuff(c, { id: 'secondwind', name: 'Second Wind', dur: 6, mods: { dmgTaken: .8 }, col: '#ff8a7a' }); }
}
function swapHero(silent) {
  if (G.coop) return;
  const o = otherHero(); if (o.dead) { if (!silent) toast(o.name + ' has fallen.'); return; }
  G.ctrl = o.key; G.moveTo = null; ctrlHero().path = null; otherHero().path = null;
  if (!silent) { sfx('ui'); }
  ring(o.x, o.y, 30, o.key === 'orhun' ? '#e0a64e' : '#46c495');
  buildActionBar(); renderParty();
}
function cycleTarget(c = ctrlHero()) {
  const mine = c === ctrlHero();
  const list = G.foes.filter(f => !f.dead && !f.evade && dist(f, c) < 12 * TILE).sort((a, b) => dist(a, c) - dist(b, c));
  if (!list.length) { if (mine) G.target = null; else c.target = null; return; }
  const cur = mine ? G.target : c.target;
  const nt = list[(list.indexOf(cur) + 1) % list.length];
  if (mine) { G.target = nt; G.autoAtk = false; } else c.target = nt;
}

/* ---------- Zone enter / wipe ---------- */
function enterZone(id, entryKey, pos) {
  const z = ZONES[id];
  if (!z.base) renderZone(z);
  G.zone = z; G.foes = []; G.proj = []; G.teles = []; G.pools = []; G.fx = []; G.texts = []; G.target = null; G.autoAtk = false; G.eclipse = false; G.moveTo = null;
  for (const s of z.spawns) { if (FOES[s.type].boss && G.bossDead[s.type]) continue; G.foes.push(makeFoe(s.type, s.x, s.y)); }
  G.npcs = z.npcs.filter(n => !n.req || n.req()).map(n => ({ ...n, x: (n.x + .5) * TILE, y: (n.y + .5) * TILE, t: Math.random() * 5 }));
  let p = pos || z.entries[entryKey] || z.entries.start || z.entries.west || Object.values(z.entries)[0];
  const px = pos ? pos[0] : (p[0]) * TILE, py = pos ? pos[1] : (p[1]) * TILE;
  const c = ctrlHero(), o = otherHero();
  c.x = px; c.y = py; o.x = px - 20; o.y = py + 14; P.fox.x = px - 10; P.fox.y = py + 24;
  for (const h of partyAll()) { h.path = null; h.dash = null; }
  G.cam.x = c.x - W / ZOOM / 2; G.cam.y = c.y - H / ZOOM / 2;
  $('zonename').textContent = z.name;
  G.lastSafe = { zone: id, pos: [px, py] };
  if (BANTER[z.name] && !G.seenBanter[z.name]) { G.seenBanter[z.name] = true; setTimeout(() => playDialog(BANTER[z.name].map(([w, t]) => ({ who: w, text: t }))), 700); }
  G.blizzard = false; G.eclipse = false;
  qProgress('visit', id);
  if (id === 'town' && ch1Done() && !G.seenBanter.ch2 && !(G.q.q11)) { G.seenBanter.ch2 = true; setTimeout(() => playDialog(BANTER.ch2.map(([w, t]) => ({ who: w, text: t }))), 900); }
  banner(z.name, { frostspire: 'Where the first flame was forged', town: 'The last city of lantern light', brightfield: 'Meadows under a bruised sky', murkfen: 'Where the fog keeps its dead', keep: 'Seat of the Hollow King' }[id]);
  renderTracker();
}
let zoneLock = 0;
function checkPortals() {
  if (zoneLock > 0) return;
  const c = ctrlHero();
  const who = G.coop ? heroes().filter(h => !h.dead) : [c];
  for (const p of G.zone.portals) {
    const hit = who.find(h => { const hx = h.x / TILE, hy = h.y / TILE; return hx >= p.x - .3 && hx <= p.x + p.w + .3 && hy >= p.y && hy <= p.y + p.h; });
    if (hit) { const c = hit; {
      const push = p.push || [p.x < G.zone.w / 2 ? 40 : -40, 0];
      if (p.req && !p.req()) { toast(p.lock); zoneLock = 2; c.x += push[0]; c.y += push[1]; return; }
      if (G.inCombat) { toast('You cannot leave while in combat.'); zoneLock = 1.5; c.x += push[0]; c.y += push[1]; return; }
      zoneLock = 1.5;
      fadeTo(() => { enterZone(p.to, p.entry); saveGame(true); });
      return;
    } }
  }
}
function fadeTo(fn) { const f = $('fade'); f.style.opacity = 1; G.paused = true; setTimeout(() => { fn(); f.style.opacity = 0; G.paused = false; }, 380); }
function wipe() {
  fadeTo(() => {
    for (const h of heroes()) { h.dead = false; h.hp = Math.round(h.maxHp * .6); h.buffs = []; h.lowWarned = false; if (h.key === 'handan') h.res = h.resMax; else h.res = 0; }
    P.fox.dead = false; P.fox.hp = P.fox.maxHp;
    const z = G.zone.id;
    const entry = z === 'town' ? 'start' : (z === 'keep' ? 'west' : 'west');
    enterZone(z, entry);
    log('You gather yourselves at the edge of ' + G.zone.name + '.', '#8affe0');
  });
}

/* ---------- Main update ---------- */
function update(dt) {
  if (G.paused || G.dialog || !G.started) return;
  G.t += dt;
  zoneLock = Math.max(0, zoneLock - dt);
  G.potCd = Math.max(0, G.potCd - dt);
  G.inCombat = G.foes.some(f => f.aggro && !f.dead && !f.evade);
  if (!G.inCombat) G.phoenixUsed = false;
  if (G.inCombat) G.combatT += dt; else G.combatT = 0;
  if (G.wipeT > 0) { G.wipeT -= dt; if (G.wipeT <= 0) wipe(); }
  const c = ctrlHero();
  // controlled movement
  if (!c.dead && !c.dash) {
    const [vx, vy] = inputVec(1);
    if (vx || vy) { G.moveTo = null; c.path = null; moveHero(c, vx, vy, dt); }
    else if (G.moveTo) {
      const m = G.moveTo;
      if (m.npc) { if (dist(c, m.npc) < 1.8 * TILE) { G.moveTo = null; c.moving = false; talkTo(m.npc); } else steer(c, m.npc.x, m.npc.y, dt, 0, 20); }
      else if (m.foe) { const t = m.foe; const reach = weaponReach(c); if (t.dead) G.moveTo = null; else if (dist(c, t) - t.r - c.r <= reach * .9 && (c.key === 'orhun' || lineClear(c.x, c.y - 10, t.x, t.y - 10, 3))) { G.moveTo = null; c.moving = false; c.face = t.x >= c.x ? 1 : -1; } else steer(c, t.x, t.y, dt, 0, t.r + c.r + 8); }
      else if (steer(c, m.x, m.y, dt, 0, 6)) G.moveTo = null;
    } else c.moving = false;
  }
  if (G.coop) {
    const h2 = P.handan;
    if (!h2.dead && !h2.dash && !G.mounted) {
      const [vx, vy] = inputVec(2);
      if (vx || vy) moveHero(h2, vx, vy, dt); else h2.moving = false;
    }
  }
  for (const h of heroes()) heroTick(h, dt);
  if (!G.coop) heroAI(otherHero(), dt);
  foxTick(P.fox, dt);
  for (const f of G.foes) foeTick(f, dt);
  G.foes = G.foes.filter(f => !(f.dead && f.deathT > 1.2));
  updateProj(dt);
  checkPortals();
  // pickups
  for (const p of G.zone.pickups) {
    if (G.picked[p.id] || !pickupActive(p)) continue;
    if (heroes().some(h => !h.dead && Math.hypot((p.x + .5) * TILE - h.x, (p.y + .5) * TILE - h.y) < 26)) { G.picked[p.id] = true; sfx('pickup'); sparkle({ x: (p.x + .5) * TILE, y: (p.y + .5) * TILE }, '#c9f5df'); qProgress('collect', p.item); }
  }
  // low hp barks
  for (const h of heroes()) if (!h.dead && h.hp / h.maxHp < .3 && G.inCombat && !h.barked) { h.barked = true; const l = h.key === 'orhun' ? BANTER.lowhp[0] : BANTER.lowhp[1]; bark(l[0], l[1]); }
  for (const h of heroes()) if (h.hp / h.maxHp > .6) h.barked = false;
  if (G.pendingTalent && !G.inCombat && !G.dialog) openTalent(G.pendingTalent);
  // camera
  let fx = c.x, fy = c.y;
  if (G.coop) { const al = heroes().filter(h => !h.dead); if (al.length) { fx = al.reduce((s, h) => s + h.x, 0) / al.length; fy = al.reduce((s, h) => s + h.y, 0) / al.length; } }
  const tx = fx - W / ZOOM / 2, ty = fy - H / ZOOM / 2;
  G.cam.x = lerp(G.cam.x, tx, Math.min(1, dt * 6)); G.cam.y = lerp(G.cam.y, ty, Math.min(1, dt * 6));
  const zw = G.zone.w * TILE, zh = G.zone.h * TILE;
  G.cam.x = clamp(G.cam.x, Math.min(0, zw - W / ZOOM), Math.max(0, zw - W / ZOOM)); G.cam.y = clamp(G.cam.y, Math.min(0, zh - H / ZOOM), Math.max(0, zh - H / ZOOM));
  if (zw < W / ZOOM) G.cam.x = (zw - W / ZOOM) / 2; if (zh < H / ZOOM) G.cam.y = (zh - H / ZOOM) / 2;
  G.shake = Math.max(0, G.shake - dt * 30);
  G.saveT += dt; if (G.saveT > 30 && !G.inCombat) { G.saveT = 0; saveGame(true); }
}
function pickupActive(p) {
  const map = { moonpetal: 'q2', token: 'q5', shard: 'q9', ember: 'q13' };
  const s = G.q[map[p.item]]; return s && s.st === 'active';
}

/* ---------- Input vectors (keyboard, touch stick, gamepads) ---------- */
var PADV = [[0, 0], [0, 0]];
function inputVec(player) {
  let vx = 0, vy = 0;
  if (player === 1) {
    const ar = !G.coop;
    if (keys['w'] || (ar && keys['arrowup'])) vy -= 1; if (keys['s'] || (ar && keys['arrowdown'])) vy += 1;
    if (keys['a'] || (ar && keys['arrowleft'])) vx -= 1; if (keys['d'] || (ar && keys['arrowright'])) vx += 1;
    if (window.JOY && JOY.active && JOY.mag > .18) { vx += JOY.vx; vy += JOY.vy; }
    vx += PADV[0][0]; vy += PADV[0][1];
  } else {
    if (keys['arrowup']) vy -= 1; if (keys['arrowdown']) vy += 1; if (keys['arrowleft']) vx -= 1; if (keys['arrowright']) vx += 1;
    vx += PADV[1][0]; vy += PADV[1][1];
  }
  return [vx, vy];
}

/* ---------- Dodge: Orhun rolls, Handan steps through the jade ---------- */
const DODGE = { orhun: { cd: 6, dist: 3.2 * TILE, ifr: .45, name: 'Combat Roll' }, handan: { cd: 8, dist: 4 * TILE, ifr: .35, name: 'Jade Step' } };
function dodge(h, dx = 0, dy = 0) {
  if (!h || h.dead || h.dash || has(h, 'stun')) return false;
  const human = G.coop || h === ctrlHero();
  if ((h.cds.dodge || 0) > 0) { if (human) { floatText(h.x, h.y - 60, 'Not ready yet', '#ff9a8a', .85); sfx('deny'); } return false; }
  if (!dx && !dy) {
    if (human) { const v = inputVec(G.coop && h.key === 'handan' ? 2 : 1); dx = v[0]; dy = v[1]; }
    if (!dx && !dy && h.lastMv && G.t - (h.lastMvT || 0) < .25) { dx = h.lastMv[0]; dy = h.lastMv[1]; }
    if (!dx && !dy) { const near = G.foes.filter(f => !f.dead && f.aggro).sort((a, b) => dist(a, h) - dist(b, h))[0]; if (near) { dx = h.x - near.x; dy = h.y - near.y; } }
    if (!dx && !dy) { dx = h.face || 1; dy = 0; }
  }
  const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  const D = DODGE[h.key];
  h.cds.dodge = D.cd; h.iframes = D.ifr;
  h.buffs = h.buffs.filter(b => !(b.mods && (b.mods.root || b.mods.speed)));
  if (Math.abs(dx) > Math.abs(dy)) { h.dir = 2; h.face = dx > 0 ? 1 : -1; } else h.dir = dy > 0 ? 0 : 1;
  if (h.key === 'orhun') { h.dash = { vx: dx, vy: dy, left: D.dist, sp: 600, roll: true, onEnd: null }; sfx('slash'); }
  else {
    sparkle(h, '#7dffc8'); ring(h.x, h.y, 24, '#46c495');
    for (let s = 0; s < D.dist; s += 6) { const ox = h.x, oy = h.y; moveEnt(h, dx * 6, dy * 6); h.blockedX = h.blockedY = false; if (h.x === ox && h.y === oy) break; }
    sparkle(h, '#c9f5df'); ring(h.x, h.y, 30, '#7dffc8'); sfx('tele');
  }
  if (human) flashSlot('dodge', h.key);
  return true;
}

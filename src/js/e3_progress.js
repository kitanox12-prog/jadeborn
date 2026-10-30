/* ===================== PROGRESSION: skills, loadouts, boons, weapons ===================== */

/* ---------- New skills (unlock past level 8) ---------- */
SKILL_POOL.orhun.push(
  { id: 'crescent', name: 'Crescent Wave', school: 'Duelist', lvl: 10, cost: 20, cd: 7, range: 6, tgt: 'foe', icon: { bg: '#203a5a', fg: '#cfe6ff', s: 'wave' },
    desc: c => `Send a crescent of steel through every enemy in a line for <b>${Math.round(c.atk * 2)}</b> damage.`,
    use(c, t) {
      swing(c, t); sfx('whirl'); const a = Math.atan2(t.y - c.y, t.x - c.x), L = 7 * TILE;
      for (let k = 1; k <= 6; k++) G.fx.push({ k: 'slash', x: c.x + Math.cos(a) * k * TILE * 1.1, y: c.y - 16 + Math.sin(a) * k * TILE * 1.1, t: -k * .04, dur: .22, big: true, a: a + 1 });
      for (const f of G.foes) { if (f.dead || f.evade) continue; const dx = f.x - c.x, dy = f.y - c.y, along = dx * Math.cos(a) + dy * Math.sin(a), perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)); if (along > 0 && along < L && perp < 26 + f.r) dealDamage(c, f, c.atk * 2, { threat: 2, label: 'Wave' }); }
      return true;
    } },
  { id: 'frenzy', name: 'Blood Frenzy', school: 'Berserker', lvl: 12, cost: 30, cd: 25, range: 0, tgt: 'self', icon: { bg: '#5a1010', fg: '#ff7a5a', s: 'frenzy' },
    desc: c => `For 8s Orhun attacks 40% faster and deals 30% more damage, but takes 10% more.`,
    use(c) { sfx('roar'); addBuff(c, { id: 'frenzy', name: 'Blood Frenzy', dur: 8, mods: { dmgDone: 1.3, dmgTaken: 1.1, aspd: 1.4 }, col: '#ff5a3a' }); burstFx(c.x, c.y - 20, 30, '#ff5a3a', 14); return true; } },
  { id: 'oath', name: "Guardian's Oath", school: 'Guardian', lvl: 14, cost: 20, cd: 22, range: 0, tgt: 'self', icon: { bg: '#4a3a14', fg: '#ffe6a8', s: 'oath' },
    desc: c => `For 6s Handan takes 40% less damage and Orhun 15% less. Every enemy attacking Handan turns on Orhun.`,
    use(c) {
      sfx('shield'); addBuff(P.handan, { id: 'oath', name: "Guardian's Oath", dur: 6, mods: { dmgTaken: .6 }, col: '#e0a64e' }); addBuff(c, { id: 'oathc', name: 'Oathbound', dur: 6, mods: { dmgTaken: .85 }, col: '#e0a64e' });
      for (const f of G.foes) if (!f.dead && f.aggro && foeTarget(f) === P.handan) taunt(f, c, 3);
      ring(P.handan.x, P.handan.y, 34, '#ffd27a'); ring(c.x, c.y, 34, '#ffd27a'); return true;
    } },
  { id: 'quake', name: 'Earthsplitter', school: 'Berserker', lvl: 18, cost: 35, cd: 16, range: 7, minRange: 1.5, tgt: 'foe', icon: { bg: '#4a2a10', fg: '#ffb070', s: 'quake' },
    desc: c => `Leap at an enemy and smash the ground: <b>${Math.round(c.atk * 2.6)}</b> damage to everything within 2.5 yards and a 1s stun.`,
    use(c, t) {
      const a = Math.atan2(t.y - c.y, t.x - c.x), d = Math.max(0, dist(c, t) - t.r - c.r - 6);
      c.dash = { vx: Math.cos(a), vy: Math.sin(a), left: d, sp: 520, onEnd: () => { sfx('boom'); shake(8); burstFx(c.x, c.y, 2.5 * TILE, '#ffb070', 22); for (const f of foesNear(c, 2.5 * TILE)) { dealDamage(c, f, c.atk * 2.6, { threat: 2.5, label: 'Quake' }); addBuff(f, { id: 'stun', name: 'Stunned', dur: 1, mods: { stun: true }, col: '#ffe6a8', debuff: true }); } } };
      return true;
    } },
  { id: 'dance', name: 'Blade Dance', school: 'Duelist', lvl: 22, cost: 25, cd: 14, range: 1.9, tgt: 'foe', icon: { bg: '#2a3a5a', fg: '#e8eef8', s: 'dance' },
    desc: c => `Five lightning cuts for <b>${Math.round(c.atk * .8)}</b> each. Attacks pass through Orhun while he dances.`,
    use(c, t) { c.iframes = Math.max(c.iframes || 0, .9); for (let k = 0; k < 5; k++) setTimeout(() => { if (!t.dead && !c.dead) { swing(c, t); dealDamage(c, t, c.atk * .8, { threat: 1.8, label: 'Dance' }); } }, k * 130); return true; } },
  { id: 'banner', name: 'Rallying Banner', school: 'Guardian', lvl: 26, cost: 30, cd: 30, range: 0, tgt: 'self', icon: { bg: '#5a2a14', fg: '#ffd27a', s: 'banner' },
    desc: c => `Plant a banner for 10s. Heroes near it heal 3% of their health every second and take 15% less damage.`,
    use(c) { sfx('quest'); G.pools.push({ x: c.x, y: c.y, r: 3 * TILE, t: 0, dur: 10, tick: 0, ally: true, src: c, col: '#ffd27a' }); burstFx(c.x, c.y, 3 * TILE, '#ffd27a', 14); return true; } },
);
SKILL_POOL.handan.push(
  { id: 'barrage', name: 'Arcane Barrage', school: 'Arcanist', lvl: 10, cost: 24, cd: 8, range: 8, tgt: 'foe', icon: { bg: '#2a1a4a', fg: '#c9a0ff', s: 'barrage' },
    desc: c => `Fire 5 jade missiles split between nearby enemies, <b>${Math.round(c.atk * .75)}</b> each.`,
    use(c, t) {
      sfx('cast'); const pool = [t, ...G.foes.filter(f => f !== t && !f.dead && !f.evade && dist(f, t) < 5 * TILE).sort((a, b) => dist(a, t) - dist(b, t)).slice(0, 4)];
      for (let k = 0; k < 5; k++) { const tg = pool[k % pool.length]; setTimeout(() => { if (!tg.dead && !c.dead) shoot(c, tg, '#c9a0ff', 460, () => dealDamage(c, tg, c.atk * .75, { threat: 1 }), 4); }, k * 90); }
      return true;
    } },
  { id: 'renewal', name: 'Renewal', school: 'Archmage', lvl: 12, cost: 28, cd: 18, range: 0, tgt: 'self', role: 'heal', icon: { bg: '#1e4a20', fg: '#c8ffb0', s: 'renew' },
    desc: c => `Both heroes heal <b>${Math.round(c.atk * 2.8)}</b> + 28% of their health over 8s.`,
    use(c) { sfx('heal'); for (const h of heroes()) if (!h.dead) { addBuff(h, { id: 'renewal', name: 'Renewal', dur: 8, hot: c.atk * .35 + h.maxHp * .035, src: c, col: '#b8ffb0' }); sparkle(h, '#c8ffb0'); } return true; } },
  { id: 'chain', name: 'Chain Lightning', school: 'Arcanist', lvl: 14, cost: 26, cd: 9, range: 8, tgt: 'foe', icon: { bg: '#1a2a5a', fg: '#bfe6ff', s: 'chain' },
    desc: c => `Lightning strikes an enemy for <b>${Math.round(c.atk * 1.7)}</b> and jumps to 4 more, losing 15% each jump.`,
    use(c, t) {
      sfx('cast'); let cur = t, m = 1.7; const hit = new Set([t]); zap(c.x, c.y - 26, t.x, t.y - 16); dealDamage(c, t, c.atk * m, { threat: 1 });
      for (let k = 0; k < 4; k++) { const nx = G.foes.filter(f => !f.dead && !f.evade && !hit.has(f) && dist(f, cur) < 4.5 * TILE).sort((a, b) => dist(a, cur) - dist(b, cur))[0]; if (!nx) break; hit.add(nx); m *= .85; zap(cur.x, cur.y - 16, nx.x, nx.y - 16); dealDamage(c, nx, c.atk * m, { threat: 1 }); cur = nx; }
      return true;
    } },
  { id: 'nova', name: 'Frost Nova', school: 'Arcanist', lvl: 18, cost: 22, cd: 16, range: 0, tgt: 'self', icon: { bg: '#1a3a5a', fg: '#dff4ff', s: 'nova' },
    desc: c => `Freeze every enemy within 3 yards in place for 2.5s and deal <b>${Math.round(c.atk * 1.2)}</b> damage.`,
    use(c) { sfx('whirl'); burstFx(c.x, c.y, 3 * TILE, '#dff4ff', 22); for (const f of foesNear(c, 3 * TILE)) { dealDamage(c, f, c.atk * 1.2, { threat: 1 }); if (!f.def.boss) addBuff(f, { id: 'root', name: 'Frozen', dur: 2.5, mods: { root: true }, src: c, col: '#bfe6ff', debuff: true }); } return true; } },
  { id: 'haste', name: 'Quickening', school: 'Archmage', lvl: 22, cost: 35, cd: 30, range: 0, tgt: 'self', icon: { bg: '#3a3a10', fg: '#fff2a0', s: 'haste' },
    desc: c => `For 8s both heroes recharge abilities 35% faster and move 20% faster.`,
    use(c) { sfx('level'); for (const h of heroes()) if (!h.dead) { addBuff(h, { id: 'haste', name: 'Quickening', dur: 8, mods: { cdr: 1.35, speed: 1.2 }, col: '#fff2a0' }); sparkle(h, '#fff2a0'); } return true; } },
  { id: 'meteor', name: 'Falling Lantern', school: 'Arcanist', lvl: 26, cost: 45, cd: 20, range: 9, tgt: 'foe', icon: { bg: '#5a2a08', fg: '#ffd27a', s: 'meteor' },
    desc: c => `Call a burning lantern down from the sky. After 1.2s it hits everything within 2.5 yards for <b>${Math.round(c.atk * 4.5)}</b>.`,
    use(c, t) { const x = t.x, y = t.y; sfx('cast'); G.teles.push({ x, y, r: 2.5 * TILE, dur: 1.2, t: 0, col: '#ffb050', harm: false, onEnd: () => { sfx('boom'); shake(9); burstFx(x, y, 2.5 * TILE, '#ffb050', 30); for (const f of foesNearPt(x, y, 2.5 * TILE)) { dealDamage(c, f, c.atk * 4.5, { threat: 1.2 }); addBuff(f, { id: 'burn', name: 'Burning', dur: 3, dot: c.atk * .4, src: c, col: '#ffb050', debuff: true }); } } }); return true; } },
);

/* ---------- Schools, priorities and AI for every skill ---------- */
const nearestFoe = (h, eng, r = 99) => eng.filter(f => dist(f, h) < r * TILE).sort((a, b) => dist(a, h) - dist(b, h))[0];
const inLos = (h, t, r) => t && dist(h, t) - t.r < r * TILE && lineClear(h.x, h.y - 10, t.x, t.y - 10, 3);
const SKILL_META = {
  sunder: { school: 'Duelist', prio: 10, ai: (h, C) => C.t && C.d < 2 * TILE ? C.t : null },
  roar: { school: 'Guardian', prio: 80, ai: (h, C) => C.eng.some(f => { const ft = foeTarget(f); return ft && ft !== P.orhun && dist(f, h) < 5 * TILE; }) ? true : null },
  whirl: { school: 'Berserker', prio: 40, ai: (h, C) => C.near >= 2 ? true : null },
  ironhide: { school: 'Guardian', prio: 90, ai: (h, C) => h.hp / h.maxHp < .45 && C.eng.some(f => foeTarget(f) === h) ? true : null },
  exec: { school: 'Duelist', prio: 50, ai: (h, C) => C.t && C.d < 2 * TILE && h.res >= 40 && (C.t.hp / C.t.maxHp < .3 || h.res >= 75) ? C.t : null },
  charge: { school: 'Duelist', prio: 30, ai: (h, C) => C.t && C.d > 3 * TILE && C.d < 8 * TILE ? C.t : null },
  crescent: { prio: 35, ai: (h, C) => C.t && C.d < 6 * TILE && (C.eng.length >= 2 || C.d > 1.5 * TILE) ? C.t : null },
  frenzy: { prio: 45, ai: (h, C) => C.t && C.d < 2 * TILE && !h.buffs.some(b => b.id === 'frenzy') && C.t.hp > h.atk * 4 ? true : null },
  oath: { prio: 85, ai: (h, C) => !P.handan.dead && C.eng.some(f => foeTarget(f) === P.handan) && P.handan.hp / P.handan.maxHp < .75 ? true : null },
  quake: { prio: 38, ai: (h, C) => C.t && C.d < 7 * TILE && foesNearPt(C.t.x, C.t.y, 2.5 * TILE).length >= 2 ? C.t : null },
  dance: { prio: 42, ai: (h, C) => C.t && C.d < 2 * TILE && C.t.maxHp > h.atk * 8 ? C.t : null },
  banner: { prio: 70, ai: (h, C) => heroes().some(x => !x.dead && x.hp / x.maxHp < .7) && C.eng.length ? true : null },
  bolt: { school: 'Arcanist', prio: 10, ai: (h, C) => inLos(h, C.t, 8) && C.mana > .22 ? C.t : null },
  thorn: { school: 'Arcanist', prio: 60, ai: (h, C) => C.eng.find(f => foeTarget(f) === h && dist(f, h) < 3 * TILE && !f.def.boss && !has(f, 'root')) || null },
  mend: { school: 'Archmage', role: 'heal', prio: 95, ai: (h, C) => C.lo && C.lo.hp / C.lo.maxHp < .62 ? C.lo : null },
  wither: { school: 'Arcanist', prio: 25, ai: (h, C) => inLos(h, C.t, 8) && C.mana > .3 && C.t.maxHp > 100 && C.t.hp / C.t.maxHp > .3 && !C.t.buffs.some(b => b.id === 'wither') ? C.t : null },
  ward: { school: 'Archmage', prio: 88, ai: (h, C) => !P.orhun.dead && C.eng.some(f => foeTarget(f) === P.orhun) && !P.orhun.buffs.some(b => b.id === 'ward') ? P.orhun : null },
  fire: { school: 'Arcanist', prio: 40, ai: (h, C) => inLos(h, C.t, 8) && C.mana > .3 && foesNearPt(C.t.x, C.t.y, 2.5 * TILE).length >= 3 ? C.t : null },
  barrage: { prio: 35, ai: (h, C) => inLos(h, C.t, 8) && C.mana > .3 && C.eng.length >= 2 ? C.t : null },
  renewal: { prio: 92, ai: (h, C) => heroes().filter(x => !x.dead && x.hp / x.maxHp < .75).length >= 2 || (C.lo && C.lo.hp / C.lo.maxHp < .5) ? true : null },
  chain: { prio: 38, ai: (h, C) => inLos(h, C.t, 8) && C.mana > .28 && C.eng.length >= 3 ? C.t : null },
  nova: { prio: 65, ai: (h, C) => foesNear(h, 3 * TILE).filter(f => !f.def.boss).length >= 2 ? true : null },
  haste: { prio: 55, ai: (h, C) => C.mana > .4 && (C.eng.some(f => f.def.boss || f.def.elite) || C.eng.length >= 4) ? true : null },
  meteor: { prio: 45, ai: (h, C) => inLos(h, C.t, 9) && C.mana > .35 && (foesNearPt(C.t.x, C.t.y, 2.5 * TILE).length >= 3 || C.t.def.boss || C.t.def.elite) ? C.t : null },
};
for (const k of ['orhun', 'handan']) for (const a of SKILL_POOL[k]) Object.assign(a, SKILL_META[a.id] || {});
const SKILL_BY_ID = {}; for (const k of ['orhun', 'handan']) for (const a of SKILL_POOL[k]) SKILL_BY_ID[a.id] = a;
const SCHOOL_COL = { Duelist: '#7fb4ff', Guardian: '#ffd27a', Berserker: '#ff7a5a', Arcanist: '#c9a0ff', Archmage: '#8affb0' };
const DEFAULT_LOADOUT = { orhun: ['sunder', 'roar', 'whirl', 'ironhide', 'exec', 'charge'], handan: ['bolt', 'thorn', 'mend', 'wither', 'ward', 'fire'] };

const ABIL = { orhun: [], handan: [] };
function syncLoadout() {
  for (const k of ['orhun', 'handan']) {
    const lo = (G.loadout && G.loadout[k]) || DEFAULT_LOADOUT[k];
    ABIL[k] = lo.map(id => SKILL_BY_ID[id]).filter(Boolean);
  }
}
function autoOn(key, id) { const m = G.autoSkills && G.autoSkills[key]; return !m || m[id] !== false; }

/* skills get the existing talents and boons that touch them */
(function () {
  const sunder = SKILL_BY_ID.sunder, u0 = sunder.use;
  sunder.use = function (c, t) {
    const r = u0.call(this, c, t);
    c.sunders = (c.sunders || 0) + 1;
    if (B('quakestep') && c.sunders % 4 === 0) { burstFx(c.x, c.y, 2.5 * TILE, '#ffcf6a', 14); shake(4); for (const f of foesNear(c, 2.5 * TILE)) dealDamage(c, f, c.atk * 1.1, { threat: 2 }); }
    return r;
  };
  const bolt = SKILL_BY_ID.bolt, b0 = bolt.use;
  bolt.use = function (c, t) {
    const r = b0.call(this, c, t);
    const n = B('multibolt'); if (n) { const m = c.atk * 1.25 * (c.tal('sharpjade') ? 1.15 : 1) * .7; G.foes.filter(f => f !== t && !f.dead && !f.evade && dist(f, c) < 8 * TILE).sort((a, b) => dist(a, t) - dist(b, t)).slice(0, n).forEach((o, k) => setTimeout(() => { if (!o.dead) shoot(c, o, '#9ff5d0', 430, () => dealDamage(c, o, m, { threat: 1 }), 5); }, 60 + k * 60)); }
    return r;
  };
  const mend = SKILL_BY_ID.mend, m0 = mend.use;
  mend.use = function (c, t) { const r = m0.call(this, c, t); if (B('twinmend')) addBuff(t, { id: 'echo', name: 'Echoing Light', dur: 4, hot: (c.atk * 2.2 + t.maxHp * .12) * .3 / 4, src: c, col: '#fff2b0' }); return r; };
})();

/* ---------- Boons: one pick from three every level ---------- */
const RARITY_B = [{ n: 'Common', m: 1, c: '#d8d8d8' }, { n: 'Uncommon', m: 1.5, c: '#5fdc6c' }, { n: 'Rare', m: 2.2, c: '#5aa6ff' }, { n: 'Epic', m: 3.2, c: '#c27cff' }, { n: 'Legendary', m: 4.5, c: '#ffb347' }];
const BOONS = [
  { id: 'o_atk', who: 'orhun', n: 'Whetstone', v: 4, d: v => `Orhun deals ${v}% more damage.` },
  { id: 'h_atk', who: 'handan', n: 'Jade Focus', v: 4, d: v => `Handan's spells and attacks deal ${v}% more damage.` },
  { id: 'o_hp', who: 'orhun', n: 'Iron Constitution', v: 5, d: v => `Orhun has ${v}% more health.` },
  { id: 'h_hp', who: 'handan', n: 'Warm Hearth', v: 5, d: v => `Handan has ${v}% more health.` },
  { id: 'o_def', who: 'orhun', n: 'Riveted Plates', v: 6, d: v => `Orhun has ${v}% more armor.` },
  { id: 'crit', who: 'both', n: 'Keen Eyes', v: 1.5, d: v => `+${v}% critical strike chance for both heroes.` },
  { id: 'critdmg', who: 'both', n: 'Deadly Precision', v: 10, d: v => `Critical hits deal ${v}% more damage.` },
  { id: 'haste', who: 'both', n: 'Quick Hands', v: 3, d: v => `Abilities recharge ${v}% faster.` },
  { id: 'regen', who: 'both', n: 'Second Breath', v: .3, d: v => `Both heroes regenerate ${v}% of their health every second during fights.` },
  { id: 'leech', who: 'orhun', n: 'Blood Price', v: 1.5, d: v => `Orhun heals for ${v}% of the damage he deals.` },
  { id: 'mana', who: 'handan', n: 'Deep Current', v: 8, d: v => `Handan regenerates mana ${v}% faster in fights.` },
  { id: 'rage', who: 'orhun', n: 'Short Temper', v: 8, d: v => `Orhun builds rage ${v}% faster.` },
  { id: 'healpow', who: 'handan', n: 'Gentle Hands', v: 6, d: v => `Handan's healing is ${v}% stronger.` },
  { id: 'speed', who: 'both', n: 'Light Boots', v: 3, d: v => `Both heroes move ${v}% faster.` },
  { id: 'fox', who: 'handan', n: "Lumen's Bond", v: 15, d: v => `Lumen deals ${v}% more damage.` },
  { id: 'gold', who: 'both', n: 'Lucky Coin', v: 10, d: v => `Find ${v}% more gold.` },
  { id: 'xpb', who: 'both', n: 'Quick Study', v: 5, d: v => `Gain ${v}% more experience.` },
  { id: 'lantern', who: 'both', n: 'Kindled Pendant', v: 8, d: v => `The Lantern gauge fills ${v}% faster.` },
  { id: 'draught', who: 'both', n: 'Strong Brew', v: 10, d: v => `Healing Draughts restore ${v}% more.` },
  { id: 'aspd', who: 'both', n: 'Battle Rhythm', v: 4, d: v => `Basic attacks are ${v}% faster.` },
  { id: 'multibolt', who: 'handan', n: 'Splitting Jade', min: 2, max: 3, flat: 1, d: () => 'Jade Bolt fires one more bolt at another enemy.' },
  { id: 'chainatk', who: 'handan', n: 'Arcing Bolts', min: 2, max: 2, flat: 1, d: () => "Handan's basic attacks jump to one more enemy." },
  { id: 'cleave', who: 'orhun', n: 'Sweeping Strikes', min: 2, max: 1, flat: 1, d: () => "Orhun's basic attacks also hit enemies next to the target for 40%." },
  { id: 'thorns', who: 'orhun', n: 'Bristling Mail', min: 2, max: 3, flat: 12, d: () => 'Enemies that hit Orhun in melee take 12% of the damage back.' },
  { id: 'wardspike', who: 'handan', n: 'Thorned Ward', min: 2, max: 1, flat: 1, d: () => 'Enemies that strike a Jade Ward are burned by it.' },
  { id: 'quakestep', who: 'orhun', n: 'Aftershock', min: 3, max: 1, flat: 1, d: () => 'Every 4th Sunder sends out a shockwave that hits all nearby enemies.' },
  { id: 'twinmend', who: 'handan', n: 'Echoing Light', min: 3, max: 1, flat: 1, d: () => 'Mending Light leaves a glow that heals 30% more over 4s.' },
  { id: 'lanternlink', who: 'both', n: 'Shared Flame', min: 3, max: 1, flat: 1, d: () => 'Lanternburst also resets every ability cooldown.' },
  { id: 'fury', who: 'orhun', n: 'Unstoppable', min: 4, max: 1, flat: 1, d: () => 'Below 30% health Orhun deals 30% more damage.' },
  { id: 'veil', who: 'both', n: 'Starlight Veil', min: 4, max: 1, flat: 1, d: () => 'At the start of every fight both heroes gain a shield worth 12% of their health.' },
];
const BOON_BY_ID = {}; for (const b of BOONS) BOON_BY_ID[b.id] = b;
function rollBoonRarity(lvl) {
  const w = [Math.max(10, 70 - lvl * 1.2), 28, 6 + lvl * .7, Math.max(0, lvl - 12) * .9, Math.max(0, lvl - 26) * .6];
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { if ((r -= w[i]) < 0) return i; }
  return 0;
}
function rollBoons() {
  const out = [], used = new Set();
  for (let tries = 0; out.length < 3 && tries < 60; tries++) {
    const rar = rollBoonRarity(G.level);
    const pool = BOONS.filter(b => !used.has(b.id) && (b.min === undefined || rar >= b.min) && (!b.max || (G.boonStacks[b.id] || 0) < b.max));
    if (!pool.length) continue;
    const b = pick(pool);
    used.add(b.id);
    const val = b.flat ? b.flat : Math.round(b.v * RARITY_B[rar].m * 10) / 10;
    out.push({ id: b.id, rar, val });
  }
  return out;
}
function applyBoon(c) {
  G.boons[c.id] = Math.round(((G.boons[c.id] || 0) + c.val) * 100) / 100;
  G.boonStacks[c.id] = (G.boonStacks[c.id] || 0) + 1;
  G.boonLog.push({ id: c.id, rar: c.rar, val: c.val, lvl: G.level });
  recalcStats();
}
function openBoons() {
  const w = $('boonWin');
  if (!G.boonOffer) G.boonOffer = rollBoons();
  G.paused = true; w.hidden = false;
  const left = G.pendingBoons;
  w.innerHTML = `<h2>Choose a boon</h2><p style="margin:0 0 12px;color:#cfc8b6">Level ${G.level}. Pick one blessing for the road${left > 1 ? ` (${left} to choose)` : ''}. Higher levels bring rarer boons.</p>
    <div class="boonRow">${G.boonOffer.map((c, i) => { const b = BOON_BY_ID[c.id], R = RARITY_B[c.rar]; const who = b.who === 'both' ? 'Both heroes' : HERO[b.who].name;
      return `<button class="boonCard" data-b="${i}" style="--rc:${R.c}"><span class="rar">${R.n}</span><b>${b.n}</b><span class="who">${who}</span><span class="txt">${b.d(c.val)}</span>${G.boons[c.id] ? `<span class="have">You have: ${b.flat ? (G.boonStacks[c.id] + '×') : G.boons[c.id] + (c.id === 'crit' || c.id === 'regen' ? '%' : '%')}</span>` : ''}</button>`; }).join('')}</div>`;
  w.querySelectorAll('[data-b]').forEach(el => el.onclick = () => {
    applyBoon(G.boonOffer[+el.dataset.b]); sfx('quest');
    G.boonOffer = null; G.pendingBoons = Math.max(0, G.pendingBoons - 1);
    w.hidden = true; G.paused = false; saveGame(true);
  });
}

/* ---------- Combat-start shield (Starlight Veil) and the boon prompt ---------- */
const _upd3 = update;
update = function (dt) {
  const was = G.inCombat;
  _upd3(dt);
  if (!G.started || G.paused || G.dialog) return;
  if (!was && G.inCombat && B('veil')) for (const h of heroes()) if (!h.dead) { addBuff(h, { id: 'veil', name: 'Starlight Veil', dur: 12, absorb: h.maxHp * .12, col: '#c9e6ff' }); sparkle(h, '#c9e6ff'); }
  if (G.pendingBoons > 0 && !G.inCombat && $('talent').hidden && $('boonWin').hidden) openBoons();
};
/* friendly pools (Rallying Banner) */
const _updProj0 = updateProj;
updateProj = function (dt) {
  for (const p of G.pools) if (p.ally) {
    p.tick -= dt;
    if (p.tick <= 0) { p.tick = 1; for (const h of heroes()) if (!h.dead && Math.hypot(h.x - p.x, h.y - p.y) < p.r) { heal(p.src, h, h.maxHp * .03, true); addBuff(h, { id: 'rally', name: 'Rallied', dur: 1.2, mods: { dmgTaken: .85 }, col: '#ffd27a' }); } }
    p.tick2 = p.tick; p.tick = 99; // hide from the hostile pool code below
  }
  _updProj0(dt);
  for (const p of G.pools) if (p.ally) p.tick = p.tick2;
};

/* ---------- Weapons in loot ---------- */
const WEAPON_NAMES = {
  sword: ['Longsword', 'Sabre', 'Broadblade', "Duelist's Blade"], greataxe: ['Greataxe', "Headsman's Axe", 'War Cleaver'], spear: ['Spear', 'Glaive', 'Halberd'], twinblades: ['Twin Blades', 'Paired Fangs', 'Twin Sabres'],
  staff: ['Staff', 'Willow Stave', 'Lantern Staff'], orb: ['Orb', 'Moon Sphere', 'Seer\'s Orb'], wand: ['Wand', 'Jade Wand', 'Spark Rod'], tome: ['Tome', 'Grimoire', 'Storm Codex'],
};
const _makeItem0 = makeItem;
makeItem = function (slot, owner, ilvl, rarity, wtype) {
  const it = _makeItem0(slot, owner, ilvl, rarity);
  if (slot === 'weapon') {
    const types = owner === 'orhun' ? ['sword', 'greataxe', 'spear', 'twinblades'] : ['staff', 'orb', 'wand', 'tome'];
    it.wtype = wtype || pick(types);
    const base = pick(WEAPON_NAMES[it.wtype]);
    it.name = pick(ITEM_NAMES.pre[rarity]) + ' ' + base + (rarity >= 2 ? pick(ITEM_NAMES.suf) : '');
    if (it.wtype === 'greataxe') it.stats.atk = Math.round(it.stats.atk * 1.1);
  }
  if (slot === 'armor') it.tint = pick(owner === 'orhun' ? ARMOR_TINTS.orhun : ARMOR_TINTS.handan)[rarity];
  return it;
};
const ARMOR_TINTS = {
  orhun: [['#3a3226', '#2c4a3a', '#2a3a5a', '#4a2a5a'], ['#4a2a22', '#3a5a2a', '#2a4a7a', '#6a2a3a'], ['#2a2a2a', '#5a4a2a', '#2a5a5a', '#7a5a1a']],
  handan: [['#2a3a2e', '#1e3a4a', '#3a1e4a', '#14504a'], ['#3a2a1e', '#2a2a5a', '#4a1e3a', '#1a5a6a'], ['#1e1e26', '#2e3a6a', '#5a2a5a', '#0e5a4a']],
};

/* ===================== UI: boon window, Skills and Boons tabs ===================== */
var charTab = 'gear';
let skillSel = null;
(function () {
  const st = document.createElement('style');
  st.textContent = `#boonWin{width:720px}.boonRow{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .boonCard{display:flex;flex-direction:column;gap:6px;text-align:left;padding:12px;border:2px solid var(--rc);border-radius:6px;background:linear-gradient(180deg,#1d2430,#121720);color:var(--parch);cursor:pointer;font:inherit;box-shadow:0 0 14px color-mix(in srgb,var(--rc) 30%,transparent)}
  .boonCard:hover,.boonCard:focus-visible{transform:translateY(-2px);box-shadow:0 0 22px var(--rc)}
  .boonCard .rar{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--rc);font-weight:800}
  .boonCard b{font-family:var(--display);font-size:19px;font-weight:400}
  .boonCard .who{font-size:12px;color:var(--mute)}.boonCard .txt{font-size:14px;line-height:1.4}.boonCard .have{font-size:11.5px;color:var(--jade)}
  .ctabs{display:flex;gap:6px;margin:-4px 0 12px}.ctabs .btn.on{border-color:var(--brass);background:#3a2e1a;color:#fff}
  .skcol{display:flex;flex-direction:column;gap:8px;min-width:0}
  .lorow{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
  .loslot{position:relative;border:1px solid var(--edge);border-radius:5px;background:#0e1219;padding:4px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;min-width:0}
  .loslot.sel{border-color:var(--jade);box-shadow:0 0 0 1px var(--jade)}
  .loslot canvas{width:40px;height:40px;border-radius:4px}
  .loslot .nm{font-size:10.5px;line-height:1.1;text-align:center;color:#d9d4c6;min-height:2.2em;overflow:hidden}
  .loslot .au{font-size:10px;font-weight:800;letter-spacing:.06em;border-radius:8px;padding:1px 6px;border:1px solid #333;color:#777;background:#151a22}
  .loslot .au.on{color:#0b2a20;background:#46c495;border-color:#46c495}
  .loslot.lock canvas{filter:grayscale(1) brightness(.5)}
  .sklist{display:grid;grid-template-columns:1fr;gap:5px;max-height:46vh;overflow:auto;padding-right:2px}
  .skcard{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--edge);border-radius:5px;padding:6px;background:#141a23;cursor:pointer;text-align:left;color:var(--parch);font:inherit;min-width:0}
  .skcard.sel{border-color:var(--jade);background:#14231e}.skcard.lock{opacity:.45;cursor:default}.skcard.equipped{border-color:#6a5a30;background:#1c1a14}
  .skcard canvas{width:34px;height:34px;flex:none;border-radius:4px}
  .skcard .bd{display:block;min-width:0;flex:1}.skcard b{font-size:13px}.skcard small{display:block;font-size:11px;color:var(--mute)}.skcard .ds{display:block;margin-top:2px;font-size:11.5px;color:#c9c3b3;line-height:1.3}
  .slot.autoOn{box-shadow:inset 0 0 0 2px #46c495}
  .slot.autoOn::before{content:'A';position:absolute;right:3px;top:1px;font-size:10px;font-weight:900;color:#46c495;text-shadow:0 1px 2px #000;z-index:2}
  @media (max-width:600px){.boonRow{grid-template-columns:1fr}}
  @media (max-width:820px){.lorow{grid-template-columns:repeat(3,1fr)}#boonWin{width:min(720px,calc(100vw - 24px))}}
  @media (max-height:520px){.boonCard{padding:8px;gap:3px}.boonCard b{font-size:16px}.boonCard .txt{font-size:12.5px}#boonWin h2{font-size:18px;margin-bottom:4px}#boonWin p{font-size:12px}}`;
  document.head.appendChild(st);
  const bw = document.createElement('div'); bw.id = 'boonWin'; bw.className = 'win'; bw.hidden = true; document.body.appendChild(bw);
})();

function tabsHtml() { return `<div class="ctabs">${[['gear', 'Gear & bags'], ['skills', 'Skills'], ['boons', 'Boons']].map(([k, n]) => `<button class="btn ${charTab === k ? 'on' : ''}" data-ctab="${k}">${n}</button>`).join('')}</div>`; }
function bindTabs(w) { w.querySelectorAll('[data-ctab]').forEach(b => b.onclick = () => { charTab = b.dataset.ctab; skillSel = null; sfx('ui'); refreshCharWin(); }); }
const _rcw0 = refreshCharWin;
refreshCharWin = function () {
  const w = $('winChar'); if (w.hidden) return;
  if (vendorMode) charTab = 'gear';
  if (charTab === 'gear') { _rcw0(); const h2 = w.querySelector('h2'); if (h2) h2.insertAdjacentHTML('afterend', tabsHtml()); bindTabs(w); return; }
  hideTip();
  const head = `<h2>${charTab === 'skills' ? 'Skills' : 'Boons'} <button class="x" data-close="winChar" aria-label="Close">×</button></h2>${tabsHtml()}`;
  if (charTab === 'skills') {
    w.innerHTML = head + `<p style="margin:0 0 10px;color:#cfc8b6;font-size:13px">Pick a skill, then pick a slot to put it there. <b style="color:#46c495">A</b> marks skills that fire on their own when auto-cast is on (${G.autoCast ? 'on' : 'off'} now, Z or the ⋯ menu).</p>
      <div class="chargrid">${['orhun', 'handan'].map(k => `<div class="skcol"><h3 style="color:${k === 'orhun' ? '#e0a64e' : '#46c495'}">${HERO[k].name} <span style="color:#9a978e;font-size:13px;font-family:var(--body)">· ${k === 'orhun' ? 'Guardian · Duelist · Berserker' : 'Arcanist · Archmage'}</span></h3>
        <div class="lorow">${G.loadout[k].map((id, i) => { const a = SKILL_BY_ID[id]; const lock = G.level < a.lvl; return `<div class="loslot ${lock ? 'lock' : ''} ${skillSel && skillSel.k === k && skillSel.slot === i ? 'sel' : ''}" data-lo="${k}:${i}"><canvas width="40" height="40"></canvas><span class="nm">${i + 1}. ${a.name}</span><span class="au ${autoOn(k, id) ? 'on' : ''}" data-au="${k}:${id}">AUTO</span></div>`; }).join('')}</div>
        <div class="sklist">${SKILL_POOL[k].map(a => { const lock = G.level < a.lvl, eq = G.loadout[k].indexOf(a.id); return `<button class="skcard ${lock ? 'lock' : ''} ${eq >= 0 ? 'equipped' : ''} ${skillSel && skillSel.k === k && skillSel.id === a.id ? 'sel' : ''}" data-sk="${k}:${a.id}"><canvas width="34" height="34"></canvas><span class="bd"><b>${a.name}</b><small style="color:${SCHOOL_COL[a.school] || '#aaa'}">${a.school || ''}${lock ? ' · unlocks at level ' + a.lvl : eq >= 0 ? ' · slot ' + (eq + 1) : ''}</small><span class="ds">${a.desc(P[k])}</span></span></button>`; }).join('')}</div></div>`).join('')}</div>`;
    w.querySelectorAll('[data-lo]').forEach(el => { const [k, i] = el.dataset.lo.split(':'); drawIcon(el.querySelector('canvas'), SKILL_BY_ID[G.loadout[k][+i]].icon); el.onclick = ev => { if (ev.target.dataset.au) return; slotClick(k, +i); }; });
    w.querySelectorAll('[data-au]').forEach(el => el.onclick = ev => { ev.stopPropagation(); const [k, id] = el.dataset.au.split(':'); G.autoSkills[k][id] = !autoOn(k, id); sfx('ui'); refreshCharWin(); buildActionBar(); });
    w.querySelectorAll('[data-sk]').forEach(el => { const [k, id] = el.dataset.sk.split(':'); drawIcon(el.querySelector('canvas'), SKILL_BY_ID[id].icon); if (!el.classList.contains('lock')) el.onclick = () => skillClick(k, id); });
  } else {
    const agg = {};
    for (const e of G.boonLog) { const a = agg[e.id] || (agg[e.id] = { n: 0, best: 0 }); a.n++; a.best = Math.max(a.best, e.rar); }
    const ids = Object.keys(agg);
    w.innerHTML = head + (ids.length ? `<div class="sklist">${ids.map(id => { const b = BOON_BY_ID[id], v = G.boons[id]; return `<div class="skcard" style="cursor:default;border-color:${RARITY_B[agg[id].best].c}"><span class="bd"><b>${b.n}</b><small>${b.who === 'both' ? 'Both heroes' : HERO[b.who].name} · taken ${agg[id].n}×</small><span class="ds">${b.d(b.flat ? v : Math.round(v * 10) / 10)}${b.flat && agg[id].n > 1 ? ` (×${agg[id].n})` : ''}</span></span></div>`; }).join('')}</div>` : '<p style="color:#9a978e">No boons yet. You choose one every time you level up.</p>');
  }
  bindTabs(w);
};
function slotClick(k, i) {
  if (skillSel && skillSel.k === k && skillSel.id) { equipSkill(k, skillSel.id, i); return; }
  skillSel = { k, slot: i }; sfx('ui'); refreshCharWin();
}
function skillClick(k, id) {
  if (skillSel && skillSel.k === k && skillSel.slot !== undefined) { equipSkill(k, id, skillSel.slot); return; }
  skillSel = { k, id }; sfx('ui'); refreshCharWin();
}
function equipSkill(k, id, slot) {
  const lo = G.loadout[k], cur = lo.indexOf(id);
  if (cur >= 0) { const tmp = lo[slot]; lo[slot] = id; lo[cur] = tmp; } else lo[slot] = id;
  skillSel = null; syncLoadout(); buildActionBar(); sfx('quest'); refreshCharWin(); saveGame(true);
}
const _bab3 = buildActionBar;
buildActionBar = function () { _bab3(); };
const _uh3 = updateHUD;
updateHUD = function (dt) {
  _uh3(dt);
  for (const s of slotEls) if (!s.pot && !s.dodge && s.key) { const a = ABIL[s.key][s.i]; s.el.classList.toggle('autoOn', !!(G.autoCast && a && autoOn(s.key, a.id) && G.level >= a.lvl)); }
};

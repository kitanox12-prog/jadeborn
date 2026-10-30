/* ===================== DATA ===================== */
const XP_NEED = [0, 100, 150, 210, 280, 360, 450, 560, 680, 820, 1000, 1180, 1380, 1600, 1850, Infinity];
const MAX_LVL = 15;
const BEACON_BOSS = { b1: 'gnarl', b2: 'witch', b3: 'king', b4: 'wyrm' };
const RARITY = ['Common', 'Uncommon', 'Rare', 'Epic'];
const RCOL = ['#d8d8d8', '#5fdc6c', '#5aa6ff', '#c27cff'];

const HERO = {
  orhun: {
    name: 'Orhun', title: 'Duelist', res: 'rage', age: 27,
    base: lv => ({ hp: 150 + 30 * (lv - 1), atk: 14 + 3.3 * (lv - 1), def: 7 + 1.6 * (lv - 1), crit: 0.08, resMax: 100 }),
    speed: 128, r: 10, melee: 54, atkRate: 1.5,
  },
  handan: {
    name: 'Handan', title: 'Loreweaver', res: 'mana', age: 26,
    base: lv => ({ hp: 100 + 19 * (lv - 1), atk: 15 + 3.6 * (lv - 1), def: 3 + 0.9 * (lv - 1), crit: 0.08, resMax: 120 + 14 * (lv - 1) }),
    speed: 128, r: 10, melee: 250, atkRate: 1.8,
  }
};

/* Ability definitions. range in tiles. use(c,t) returns true when it fired. */
const ABIL = {
  orhun: [
    { id: 'sunder', name: 'Sunder', lvl: 1, cost: 0, gain: 15, cd: 3, range: 1.9, tgt: 'foe', icon: { bg: '#6b2a20', fg: '#f0d6b0', s: 'sword' },
      desc: c => `A heavy strike for <b>${Math.round(c.atk * 1.5)}</b> damage. Generates 15 rage and a lot of threat.`,
      use(c, t) { swing(c, t); dealDamage(c, t, c.atk * 1.5, { threat: 3.2, label: 'Sunder' }); if (c.tal('stormblade')) { const o = foesNear(t, 2.5 * TILE).find(f => f !== t); if (o) { G.fx.push({ k: 'slash', x: o.x, y: o.y - 16, t: 0, dur: .2, a: 1 }); dealDamage(c, o, c.atk * .9, { threat: 2.4, label: 'Storm' }); } } return true; } },
    { id: 'roar', name: 'Challenging Roar', lvl: 1, cost: 10, cd: 12, range: 0, tgt: 'self', icon: { bg: '#5a3a14', fg: '#ffd27a', s: 'roar' },
      desc: c => `Taunt every enemy within 5 yards for 4s and weaken them (−15% damage) for 8s. Pulls aggro off Handan.`,
      use(c) {
        sfx('roar'); ring(c.x, c.y, 160, '#ffcf6a');
        let n = 0;
        for (const f of foesNear(c, 5 * TILE)) { taunt(f, c, 4); addBuff(f, { id: 'daunt', name: 'Daunted', dur: 8, mods: { dmgDone: 0.85 }, col: '#ffcf6a', debuff: true }); n++; }
        if (c.tal('warcry')) for (const h of heroes()) if (!h.dead) { addBuff(h, { id: 'warcry', name: 'War Cry', dur: 8, mods: { dmgDone: 1.15 }, col: '#ffcf6a' }); sparkle(h, '#ffcf6a'); }
        if (!n) floatText(c.x, c.y - 30, 'No enemies near', '#bbb');
        return true;
      } },
    { id: 'whirl', name: 'Whirling Blades', lvl: 2, cost: 25, cd: 6, range: 0, tgt: 'self', icon: { bg: '#3a3f4c', fg: '#e8eef8', s: 'whirl' },
      desc: c => `Spin and hit every enemy within 2 yards for <b>${Math.round(c.atk * 1.15 * (c.tal('cyclone') ? 1.5 : 1))}</b> damage. Good threat on packs.`,
      use(c) {
        sfx('whirl'); spinFx(c);
        for (let k = 0; k < (c.tal('bladestorm') ? 2 : 1); k++) for (const f of foesNear(c, 2.3 * TILE)) dealDamage(c, f, c.atk * 1.15 * (c.tal('cyclone') ? 1.5 : 1), { threat: 2.2, label: 'Whirl' });
        return true;
      } },
    { id: 'ironhide', name: 'Ironhide Parry', lvl: 4, cost: 15, cd: 20, range: 0, tgt: 'self', cdMod: c => c.tal('unbroken') ? -6 : 0, icon: { bg: '#2c3a4a', fg: '#c9d8ea', s: 'shield' },
      desc: c => `For 6s take ${c.tal('bulwark') ? 75 : 50}% less damage and riposte each melee hit for <b>${Math.round(c.atk * 0.6)}</b>.`,
      use(c) { sfx('shield'); addBuff(c, { id: 'ironhide', name: 'Ironhide', dur: 6, mods: { dmgTaken: c.tal('bulwark') ? 0.25 : 0.5 }, riposte: true, col: '#9fc3ee' }); ring(c.x, c.y, 40, '#9fc3ee'); return true; } },
    { id: 'exec', name: "Executioner's Edge", lvl: 6, cost: 40, cd: 10, range: 1.9, tgt: 'foe', icon: { bg: '#4a1010', fg: '#ff8a6a', s: 'axe' },
      desc: c => `A finishing blow for <b>${Math.round(c.atk * 3.2)}</b> damage, doubled against enemies under 30% health.`,
      cdMod: c => c.tal('headsman') ? -4 : 0,
      use(c, t) { swing(c, t, true); const m = t.hp / t.maxHp < 0.3 ? 2 : 1; dealDamage(c, t, c.atk * 3.2 * m, { threat: 2, label: 'Execute', big: true }); shake(m > 1 ? 7 : 4); return true; } },
    { id: 'charge', name: 'Shoulder Charge', lvl: 8, cost: 0, gain: 10, cd: 14, range: 8, minRange: 2, tgt: 'foe', icon: { bg: '#5a4418', fg: '#ffe6a8', s: 'charge' },
      desc: c => `Rush an enemy up to 8 yards away, stunning it for 1.5s and dealing <b>${Math.round(c.atk * 0.9)}</b> damage.`,
      use(c, t) {
        const a = Math.atan2(t.y - c.y, t.x - c.x), d = dist(c, t) - t.r - c.r - 4;
        c.dash = { vx: Math.cos(a), vy: Math.sin(a), left: d, sp: 620, onEnd: () => { dealDamage(c, t, c.atk * 0.9, { threat: 2.5, label: 'Charge' }); addBuff(t, { id: 'stun', name: 'Stunned', dur: 1.5, mods: { stun: true }, col: '#ffe6a8', debuff: true }); shake(5); sfx('hit'); } };
        return true;
      } },
  ],
  handan: [
    { id: 'bolt', name: 'Jade Bolt', lvl: 1, cost: 6, cd: 0, range: 8, tgt: 'foe', icon: { bg: '#134a3a', fg: '#9ff5d0', s: 'bolt' },
      desc: c => `Hurl a bolt of jade fire for <b>${Math.round(c.atk * 1.25 * (c.tal('sharpjade') ? 1.15 : 1))}</b> damage.`,
      use(c, t) { const m = c.atk * 1.25 * (c.tal('sharpjade') ? 1.15 : 1); sfx('cast'); shoot(c, t, '#7dffc8', 420, () => dealDamage(c, t, m, { threat: 1, label: 'Bolt' }), 6); if (c.tal('twinbolt')) { const o = G.foes.filter(f => f !== t && !f.dead && !f.evade && dist(f, t) < 5 * TILE).sort((a, b) => dist(a, t) - dist(b, t))[0]; if (o) shoot(c, o, '#c9f5df', 400, () => dealDamage(c, o, m * .6, { threat: 1 }), 4); } return true; } },
    { id: 'thorn', name: 'Thornbind', lvl: 1, cost: 14, cd: 10, range: 8, tgt: 'foe', icon: { bg: '#24401c', fg: '#a8e07a', s: 'root' },
      desc: c => `Roots the enemy in place for 4s and deals <b>${Math.round(c.atk * 1.0)}</b> damage over the duration.`,
      use(c, t) { sfx('cast'); addBuff(t, { id: 'root', name: 'Thornbind', dur: 4, mods: { root: true }, dot: c.atk * 0.25, src: c, col: '#a8e07a', debuff: true }); vines(t); return true; } },
    { id: 'mend', name: 'Mending Light', lvl: 2, cost: 22, costFn: c => c.tal('wellspring') ? 13 : 22, cd: 5, range: 9, tgt: 'ally', icon: { bg: '#4a4214', fg: '#fff2b0', s: 'heal' },
      desc: c => `Heal an ally for <b>${Math.round(c.atk * 2.2)}</b> + 12% of their max health. Targets the most wounded hero if you have no friendly target.${c.tal('bloom') ? ' The other hero is healed for half.' : ''}`,
      use(c, t) {
        sfx('heal');
        const amt = c.atk * 2.2 + t.maxHp * 0.12; heal(c, t, amt); sparkle(t, '#fff2b0');
        if (c.tal('bloom')) { for (const o of partyAlive()) if (o !== t && o.hero) heal(c, o, amt * 0.5); }
        return true;
      } },
    { id: 'wither', name: 'Wither Hex', lvl: 4, cost: 16, cd: 8, range: 8, tgt: 'foe', icon: { bg: '#3a1a4a', fg: '#e0a8ff', s: 'hex' },
      desc: c => `Curse an enemy: <b>${Math.round(c.atk * 4 * (c.tal('rot') ? 1.5 : 1))}</b> damage over 8s and it deals 20% less damage.`,
      use(c, t) { sfx('cast'); addBuff(t, { id: 'wither', name: 'Wither Hex', dur: 8, mods: { dmgDone: 0.8 }, dot: c.atk * 0.5 * (c.tal('rot') ? 1.5 : 1), src: c, col: '#c98aff', debuff: true }); sparkle(t, '#c98aff'); return true; } },
    { id: 'ward', name: 'Jade Ward', lvl: 6, cost: 25, cd: 15, range: 9, tgt: 'ally', icon: { bg: '#0f4a40', fg: '#8affe0', s: 'ward' },
      desc: c => `Shield an ally, absorbing <b>${Math.round((c.atk * 3 + 40) * (c.tal('thickward') ? 1.5 : 1))}</b> damage for 10s. Defaults to Orhun.`,
      use(c, t) { sfx('shield'); addBuff(t, { id: 'ward', name: 'Jade Ward', dur: 10, absorb: (c.atk * 3 + 40) * (c.tal('thickward') ? 1.5 : 1), col: '#8affe0', bloom: c.tal('wardburst') ? c : null }); ring(t.x, t.y, 30, '#8affe0'); return true; } },
    { id: 'fire', name: 'Lanternfire', lvl: 8, cost: 38, cd: 12, range: 8, tgt: 'foe', icon: { bg: '#5a2a08', fg: '#ffc070', s: 'fire' },
      desc: c => `Call down lantern flame on the target, burning all enemies within ${c.tal('wildfire') ? 3.5 : 2.5} yards for <b>${Math.round(c.atk * 2.2)}</b> plus a short burn.`,
      use(c, t) {
        sfx('boom'); const R = (c.tal('wildfire') ? 3.5 : 2.5) * TILE; burstFx(t.x, t.y, R, '#ffb050'); shake(4);
        for (const f of foesNearPt(t.x, t.y, R)) { dealDamage(c, f, c.atk * 2.2, { threat: 1.2, label: 'Fire' }); addBuff(f, { id: 'burn', name: 'Burning', dur: 3, dot: c.atk * 0.3, src: c, col: '#ffb050', debuff: true }); }
        return true;
      } },
  ]
};

const TALENTS = {
  3: { orhun: [['thickskin', 'Thick Skin', '+20% armor.'], ['keenedge', 'Keen Edge', '+8% critical strike chance.']],
       handan: [['deepwells', 'Deep Wells', '+40% mana regeneration.'], ['sharpjade', 'Sharpened Jade', 'Jade Bolt deals 15% more damage.']] },
  5: { orhun: [['bloodthirst', 'Bloodthirst', 'Critical hits heal Orhun for 4% of his max health.'], ['ragengine', 'Rage Engine', 'Generate 50% more rage.']],
       handan: [['bloom', 'Verdant Bloom', 'Mending Light also heals the other hero for half.'], ['rot', 'Creeping Rot', 'Wither Hex deals 50% more damage.']] },
  7: { orhun: [['bulwark', 'Bulwark', 'Ironhide Parry reduces damage by 75% instead of 50%.'], ['cyclone', 'Cyclone', 'Whirling Blades deals 50% more damage.']],
       handan: [['foxbond', 'Fox Bond', 'Lumen deals double damage and has 50% more health.'], ['thickward', 'Thicker Ward', 'Jade Ward absorbs 50% more.']] },
  9: { orhun: [['laststand', 'Last Stand', 'Below 35% health, take 25% less damage.'], ['headsman', 'Headsman', "Executioner's Edge cooldown reduced by 4s."]],
       handan: [['lanternsoul', 'Lantern Soul', 'The Lantern gauge fills 50% faster.'], ['wildfire', 'Wildfire', 'Lanternfire radius increased to 3.5 yards.']] },
  11: { orhun: [['stormblade', 'Stormblade', 'Sunder also strikes a second nearby enemy for 60% damage.'], ['unbroken', 'Unbroken', 'Ironhide Parry cooldown reduced by 6s.']],
        handan: [['twinbolt', 'Twin Bolt', 'Jade Bolt fires a second bolt at another nearby enemy for 60% damage.'], ['wellspring', 'Wellspring', 'Mending Light costs 40% less mana.']] },
  13: { orhun: [['warcry', 'War Cry', 'Challenging Roar also gives both heroes 15% more damage for 8s.'], ['secondwind', 'Second Wind', 'Healing Draughts also give Orhun 30 rage and 20% damage reduction for 6s.']],
        handan: [['wardburst', 'Ward Bloom', 'When Jade Ward breaks or ends, it heals its target for 15% of their max health.'], ['lumenfury', 'Lumen\'s Fury', 'Lumen\'s bites chill enemies (30% slower) and heal Handan for 2% of her max health.']] },
  15: { orhun: [['champion', 'Lantern Champion', '10% more health and attack.'], ['bladestorm', 'Bladestorm', 'Whirling Blades strikes twice.']],
        handan: [['lanternheart', 'Lanternheart', '12% more spell power and 20% more mana.'], ['phoenix', 'Phoenix Thread', 'Once per fight, when Orhun would fall he is restored to 30% health.']] },
};

const FOES = {
  wolf:    { name: 'Hollow Wolf', lvl: 2, hp: 64, atk: 7, def: 2, spd: 92, range: 30, rate: 1.5, xp: 24, draw: 'wolf', r: 12, gold: [1, 4] },
  sprite:  { name: 'Bramble Sprite', lvl: 2, hp: 48, atk: 7, def: 1, spd: 70, range: 170, rate: 2.1, xp: 24, ranged: true, proj: '#9be36a', draw: 'sprite', r: 10, gold: [1, 4] },
  alpha:   { name: 'Ashmane Alpha', lvl: 4, hp: 300, atk: 16, def: 5, spd: 100, range: 36, rate: 1.7, xp: 120, elite: true, draw: 'wolf', scale: 1.45, r: 16, gold: [8, 15] },
  pup:     { name: 'Hollow Whelp', lvl: 3, hp: 40, atk: 6, def: 1, spd: 110, range: 26, rate: 1.2, xp: 6, draw: 'wolf', scale: .75, r: 9 },
  gnarl:   { name: 'Gnarlback', lvl: 5, hp: 2700, atk: 25, def: 6, spd: 85, range: 46, rate: 1.9, xp: 420, boss: 'gnarl', draw: 'boar', scale: 1.5, r: 32, gold: [40, 60] },
  lurker:  { name: 'Bog Lurker', lvl: 6, hp: 180, atk: 17, def: 6, spd: 70, range: 30, rate: 1.7, xp: 58, draw: 'lurker', r: 13, gold: [3, 8] },
  wisp:    { name: 'Mire Wisp', lvl: 6, hp: 130, atk: 18, def: 3, spd: 80, range: 180, rate: 2.1, xp: 58, ranged: true, proj: '#b8ffd8', draw: 'wisp', r: 10, light: '#b8ffd8', gold: [3, 8] },
  spider:  { name: 'Fen Spider', lvl: 6, hp: 145, atk: 15, def: 4, spd: 108, range: 28, rate: 1.3, xp: 58, poison: true, draw: 'spider', r: 12, gold: [3, 8] },
  hulk:    { name: 'Mire Hulk', lvl: 7, hp: 700, atk: 33, def: 9, spd: 62, range: 40, rate: 2.3, xp: 250, elite: true, draw: 'lurker', scale: 1.7, r: 20, gold: [15, 25] },
  mireling:{ name: 'Mireling', lvl: 6, hp: 80, atk: 10, def: 2, spd: 90, range: 26, rate: 1.4, xp: 8, draw: 'lurker', scale: .7, r: 9 },
  witch:   { name: 'Mirethal, the Fen Witch', lvl: 8, hp: 5800, atk: 35, def: 8, spd: 70, range: 210, rate: 2.2, xp: 950, ranged: true, proj: '#7dff9a', boss: 'witch', draw: 'witch', scale: 1.35, r: 18, light: '#7dff9a', gold: [80, 120] },
  knight:  { name: 'Hollow Knight', lvl: 9, hp: 360, atk: 30, def: 12, spd: 74, range: 34, rate: 1.9, xp: 115, draw: 'knight', r: 13, gold: [6, 14] },
  archer:  { name: 'Shade Archer', lvl: 9, hp: 220, atk: 27, def: 6, spd: 80, range: 210, rate: 2.1, xp: 100, ranged: true, proj: '#c9a0ff', draw: 'archer', r: 11, gold: [6, 14] },
  wraith:  { name: 'Lantern Wraith', lvl: 9, hp: 250, atk: 26, def: 5, spd: 104, range: 30, rate: 1.5, xp: 100, drain: true, draw: 'wraith', r: 12, gold: [6, 14] },
  king:    { name: 'The Hollow King', lvl: 11, hp: 11500, atk: 50, def: 14, spd: 80, range: 48, rate: 2.1, xp: 2000, boss: 'king', draw: 'king', scale: 1.2, r: 26, gold: [200, 300] },
  frostwolf: { name: 'Rimefang Wolf', lvl: 11, hp: 430, atk: 34, def: 10, spd: 104, range: 30, rate: 1.4, xp: 140, draw: 'wolf', scale: 1.1, r: 13, gold: [8, 16], tint: { c: '#dceeff', a: .72 } },
  frostcaller: { name: 'Hollow Frostcaller', lvl: 12, hp: 380, atk: 36, def: 8, spd: 70, range: 210, rate: 2.2, xp: 160, ranged: true, proj: '#9fdcff', chill: true, draw: 'witch', r: 12, light: '#9fdcff', gold: [9, 18], tint: { c: '#9fc8ff', a: .55 } },
  rimewraith: { name: 'Rime Wraith', lvl: 12, hp: 420, atk: 35, def: 7, spd: 110, range: 30, rate: 1.5, xp: 160, drain: true, chill: true, draw: 'wraith', r: 12, light: '#bfe6ff', gold: [9, 18], tint: { c: '#cfeaff', a: .6 } },
  golem:   { name: 'Rime Colossus', lvl: 13, hp: 1900, atk: 52, def: 16, spd: 58, range: 44, rate: 2.4, xp: 520, elite: true, draw: 'golem', scale: 1.35, r: 22, light: '#7ec8ff', gold: [25, 40] },
  rimeling:{ name: 'Rimeling', lvl: 13, hp: 260, atk: 24, def: 6, spd: 96, range: 28, rate: 1.4, xp: 12, draw: 'golem', scale: .6, r: 10 },
  wyrm:    { name: 'Vyrmhal, the Cold Crown', lvl: 16, hp: 21500, atk: 68, def: 16, spd: 78, range: 58, rate: 2.2, xp: 3000, boss: 'wyrm', draw: 'wyrm', scale: 1.3, r: 34, light: '#9fdcff', gold: [300, 420] },
  orb:     { name: 'Shadow Orb', lvl: 10, hp: 110, atk: 0, def: 0, spd: 28, range: 0, rate: 99, xp: 0, draw: 'orb', r: 11, orb: true, light: '#b07cff' },
};

/* ---------- NPCs and quests ---------- */
const NPCS = {
  maren: { name: 'Elder Maren', title: 'Keeper of Lanternhold', look: { robe: '#5b4a7a', hair: '#d8d3c8', skin: '#e0b896', beard: true, staff: true } },
  sela: { name: 'Sela', title: 'Herbalist', look: { robe: '#3f6a3a', hair: '#a8452a', skin: '#efc9a6' } },
  dorrak: { name: 'Dorrak', title: 'Smith & Trader', look: { robe: '#6a4a2a', hair: '#2a1d14', skin: '#c99872', beard: true, apron: true }, vendor: true },
  taner: { name: 'Scout Brannoc', title: 'Ember Road Watch', look: { robe: '#3a4a5a', hair: '#3a2a1a', skin: '#d8a882', hood: '#2a3640' } },
  ayla: { name: 'Liora', title: 'Spirit of the First Lantern', look: { robe: '#8ad8c0', hair: '#e8fff6', skin: '#cff5ea', ghost: true } },
  kael: { name: 'Warden Kael', title: 'Keeper of the Pass', look: { robe: '#4a3a5a', hair: '#cfd4dc', skin: '#d9b08c', beard: true, hood: '#3a4a62' } },
};

const QUESTS = [
  { id: 'q1', name: 'The Dark East Road', giver: 'maren', pre: [], zone: 'Brightfield',
    text: 'Hollow Wolves have been seen on the east road since the Brightfield lanterns failed. Thin their numbers before they reach the walls.',
    obj: [{ t: 'kill', e: ['wolf', 'alpha'], n: 6, label: 'Hollow Wolves slain' }], xp: 130, gold: 20, done: 'The road is quieter already. Good work, both of you.' },
  { id: 'q2', name: 'Moonpetal for the Wounded', giver: 'sela', pre: [], zone: 'Brightfield',
    text: 'Moonpetal blooms where lantern light once fell. It glows faintly at night. Bring me five and I can brew draughts for the watch, and for you.',
    obj: [{ t: 'collect', item: 'moonpetal', n: 5, label: 'Moonpetal gathered' }], xp: 110, gold: 10, potions: 4, done: 'Lovely. These will save lives. Take some draughts for the road.' },
  { id: 'q3', name: 'Thorns in the Field', giver: 'dorrak', pre: [], zone: 'Brightfield',
    text: 'Bramble Sprites are spitting thorns at my ore carts in southern Brightfield. Clear five of them and I will make it worth your while.',
    obj: [{ t: 'kill', e: ['sprite'], n: 5, label: 'Bramble Sprites cleared' }], xp: 120, gold: 25, item: 1, done: 'Ha! My carts thank you. Here, something from my forge.' },
  { id: 'q4', name: 'The Beast at the Shrine', giver: 'maren', pre: ['q1'], zone: 'Brightfield',
    text: 'Something huge nests at the Brightfield shrine, where our first beacon stands cold. Slay it, then relight the beacon. Handan, your pendant should wake the flame.',
    obj: [{ t: 'boss', e: 'gnarl', n: 1, label: 'Gnarlback slain' }, { t: 'beacon', id: 'b1', n: 1, label: 'Brightfield beacon relit' }], xp: 320, gold: 50, item: 2,
    done: 'I saw the light from here. The road to Murkfen is open. Scout Brannoc waits at the fen camp.' },
  { id: 'q5', name: 'The Lost Patrol', giver: 'taner', pre: ['q4'], zone: 'Murkfen',
    text: 'Three of my scouts went into the fog and never came back. Their lantern tokens would tell me where they fell. Find them.',
    obj: [{ t: 'collect', item: 'token', n: 3, label: 'Scout tokens recovered' }], xp: 380, gold: 40, item: 1, done: 'All three... At least now their families will know. Thank you.' },
  { id: 'q6', name: 'Lights in the Fog', giver: 'taner', pre: ['q4'], zone: 'Murkfen',
    text: 'The wisps lure travelers into the deep water. Put out six of them so my people can move again.',
    obj: [{ t: 'kill', e: ['wisp'], n: 6, label: 'Mire Wisps snuffed' }], xp: 380, gold: 40, done: 'The fog feels thinner already.' },
  { id: 'q7', name: 'Witch of the Fen', giver: 'taner', pre: ['q5', 'q6'], zone: 'Murkfen',
    text: 'Mirethal sits on the drowned isle in the north-east, feeding the fen to the Hollow. Her death relights the second beacon, and opens the causeway to the Hollow Keep.',
    obj: [{ t: 'boss', e: 'witch', n: 1, label: 'Mirethal slain' }, { t: 'beacon', id: 'b2', n: 1, label: 'Murkfen beacon relit' }], xp: 750, gold: 90, item: 3,
    done: 'Two beacons burning. Only the First Lantern remains, inside the Hollow Keep. Someone... something waits for you there.' },
  { id: 'q8', name: 'Breaching the Keep', giver: 'ayla', pre: ['q7'], zone: 'Hollow Keep',
    text: 'I am what is left of the First Lantern\'s keeper. The Hollow Knights guard every hall. Break four of them so the shards can be reached.',
    obj: [{ t: 'kill', e: ['knight'], n: 4, label: 'Hollow Knights broken' }], xp: 650, gold: 60, done: 'Their armor was empty all along. Only hate filled it.' },
  { id: 'q9', name: 'Shards of the First Lantern', giver: 'ayla', pre: ['q7'], zone: 'Hollow Keep',
    text: 'When the King fell to the Hollow, the First Lantern shattered. Three shards remain in the north, south and east halls. With them, the throne gate will open to your pendant.',
    obj: [{ t: 'collect', item: 'shard', n: 3, label: 'Lantern shards found' }], xp: 650, gold: 60, item: 2, done: 'Your pendant sings with them. The throne gate is open now.' },
  { id: 'q10', name: 'The Hollow King', giver: 'ayla', pre: ['q8', 'q9'], zone: 'Hollow Keep',
    text: 'He was the lantern\'s guardian once. Now he is its hunger. End him, and relight the First Lantern on the throne dais.',
    obj: [{ t: 'boss', e: 'king', n: 1, label: 'The Hollow King defeated' }, { t: 'beacon', id: 'b3', n: 1, label: 'The First Lantern relit' }], xp: 1200, gold: 200, item: 3, done: 'end', final: true },
  // ---- Chapter II: Frostspire ----
  { id: 'q11', name: 'The North Road', giver: 'maren', turnin: 'kael', pre: ['q10'], zone: 'Frostspire Pass', ch: 2,
    text: 'Frost on the north road, in autumn. The wells froze overnight. Liora says the King was only a vessel: the shadow in his crown fled north to Frostspire, where the First Lantern was forged. Go to the pass and find Warden Kael.',
    obj: [{ t: 'visit', zone: 'frostspire', n: 1, label: 'Reach Frostspire Pass' }], xp: 400, gold: 30, potions: 3,
    done: 'Maren sent you? Then the lowlands are finally listening. Welcome to Frostspire. Stay near the fire when you can, and keep your blades dry.' },
  { id: 'q12', name: 'Teeth of the Pass', giver: 'kael', pre: ['q11'], zone: 'Frostspire Pass', ch: 2,
    text: 'The wolves up here were grey once. Now they run white and hungry, and they hunt anything warm. Thin the packs on the lower slopes.',
    obj: [{ t: 'kill', e: ['frostwolf'], n: 8, label: 'Rimefang Wolves slain' }], xp: 900, gold: 60, done: 'Good. The supply sledges can move again.' },
  { id: 'q13', name: 'Embers in the Ice', giver: 'kael', pre: ['q11'], zone: 'Frostspire Pass', ch: 2,
    text: 'When the forge went cold, its embers scattered and froze. You will see them glowing under the snow. Bring me five and I can keep this camp alive.',
    obj: [{ t: 'collect', item: 'ember', n: 5, label: 'Frozen embers gathered' }], xp: 900, gold: 50, potions: 4, done: 'Feel that? Warm. First warm thing up here in a week.' },
  { id: 'q14', name: 'The Frozen Choir', giver: 'kael', pre: ['q12'], zone: 'Frostspire Pass', ch: 2,
    text: 'Hollow Frostcallers chant on the ridge, and Rime Wraiths follow the song. Every verse makes the mountain colder. Silence six of them.',
    obj: [{ t: 'kill', e: ['frostcaller', 'rimewraith'], n: 6, label: 'Choir silenced' }], xp: 1100, gold: 70, item: 2, done: 'Quiet at last. I had forgotten what the wind sounds like.' },
  { id: 'q15', name: 'Walls of Ice', giver: 'kael', pre: ['q13'], zone: 'Frostspire Pass', ch: 2,
    text: 'Two Rime Colossi stand guard where the forge road climbs. The ice gate behind them answers only to the old forge-flame, and your pendant carries some of it. Break the guardians.',
    obj: [{ t: 'kill', e: ['golem'], n: 2, label: 'Rime Colossi shattered' }], xp: 1200, gold: 80, item: 2, done: 'The gate is melting. The forge road is yours.' },
  { id: 'q16', name: 'The Cold Crown', giver: 'kael', pre: ['q14', 'q15'], zone: 'Frostspire Pass', ch: 2,
    text: 'The shadow from the crown found a body worth having: Vyrmhal, the old wyrm that slept under the forge. Kill it, and relight the Forge of the First Flame. Then Velmara keeps its light for good.',
    obj: [{ t: 'boss', e: 'wyrm', n: 1, label: 'Vyrmhal slain' }, { t: 'beacon', id: 'b4', n: 1, label: 'The Forge of the First Flame relit' }], xp: 2500, gold: 400, item: 3, done: 'end', final: true },
];

/* ---------- Dialogue ---------- */
const NPC_TALK = {
  maren: ['Lanternhold has stood for three hundred winters. It will stand for one more.', 'Keep your pendant close, Handan. It remembers more than any of us.'],
  sela: ['A draught a day keeps the Hollow away. Mostly.', 'If you see moonpetal, pick it gently. It bruises.'],
  dorrak: ['Steel or potions, I have both. Coin first.', 'Bring me what you find out there. I buy anything that is not cursed. Mostly.'],
  taner: ['Stay on the dry paths. The water here has teeth.', 'My scouts were good people. Every one of them.'],
  ayla: ['I kept the light for two hundred years. I can keep it a little longer.', 'The pendant chose her, you know. It does not choose lightly.'],
  kael: ['Keep moving up here. Standing still is how the cold gets you.', 'Twenty years on this pass. Never seen the forge-smoke stop. Until now.', 'If you hear singing on the ridge, do not follow it.'],
};

const BANTER = {
  intro: [
    ['handan', 'The lanterns on the east road went dark again last night. That makes nine.'],
    ['orhun', 'Then we light them again. That is the whole plan, right?'],
    ['handan', 'You stand in front and hit things. I keep you standing. Lumen judges everyone.'],
    ['orhun', 'Fair division of labor. Let\'s go see Elder Maren before she sends someone to drag us.'],
  ],
  Brightfield: [
    ['orhun', 'Smells like rain and wolves out here.'],
    ['handan', 'Lumen doesn\'t like it either. Her tail is all puffed up.'],
  ],
  Murkfen: [
    ['handan', 'My pendant is warm. Something in this fen remembers the First Lantern.'],
    ['orhun', 'Mud up to my knees and a haunted swamp. You take me to the nicest places.'],
    ['handan', 'You said you wanted to travel more.'],
  ],
  'Hollow Keep': [
    ['orhun', 'Whatever happens in there...'],
    ['handan', '...we walk out together. Say it properly.'],
    ['orhun', 'We walk out together.'],
  ],
  gnarl: [['orhun', 'That is not a boar. That is a hill with tusks.'], ['handan', 'Then be a taller hill. I\'ll handle the healing.']],
  witch: [['witch', 'Two little candles, wading into my fen. I will drink your light slowly.'], ['handan', 'Orhun, keep her eyes on you. I\'ll deal with the puddles.']],
  king: [['king', 'The lantern-bearer returns. Give me the shard, child, and I will make the dark painless.'], ['orhun', 'She said no. I\'m saying it louder.'], ['handan', 'When the pendant wakes, I\'ll need everything you have left. Stay close.']],
  'Frostspire Pass': [
    ['handan', 'My breath is freezing. And the pendant... it\'s cold, Orhun. It\'s never been cold.'],
    ['orhun', 'Then we find the forge and warm it up again. Stay close to me.'],
    ['handan', 'Closer than that and you\'ll have to carry me.'],
    ['orhun', 'Wouldn\'t be the first time.'],
  ],
  ch2: [
    ['handan', 'Orhun. The pendant is cold again. The light didn\'t stay.'],
    ['orhun', 'Then it isn\'t over. Let\'s hear what Elder Maren knows.'],
  ],
  wyrm: [['wyrm', 'Little flames. The crown told me of you. It said you would be... smaller.'], ['orhun', 'Funny. The King said something like that too.'], ['handan', 'Watch the breath! Get out of the blue when it glows!']],
  b4: [['handan', 'The forge is singing. I can hear it in the pendant.'], ['orhun', 'Every lantern in Velmara is going to feel that.']],
  b1: [['handan', 'It\'s warm. The flame knows the pendant.'], ['orhun', 'One down. Look at that light.']],
  b2: [['orhun', 'Two beacons. I can see Lanternhold\'s glow from here.'], ['handan', 'The Keep is next. I can feel it pulling.']],
  levelup: [['orhun', 'Getting stronger. Feels good.'], ['handan', 'I learned something new. Remind me to show you.'], ['orhun', 'Was that a level? That was a level.'], ['handan', 'Lumen\'s getting cocky. I blame you.']],
  lowhp: [['handan', 'Orhun! Back up, I\'ve got you!'], ['orhun', 'Handan, behind you!']],
};

const ITEM_NAMES = {
  pre: [['Worn', 'Plain', 'Sturdy', 'Traveler\'s'], ['Fine', 'Tempered', 'Keen', 'Polished'], ['Lanternforged', 'Moonlit', 'Emberwrought', 'Duskwoven'], ['Jadeborn', 'Dawnbreaker\'s', 'First-Light', 'Starfallen']],
  orhun: { weapon: ['Longsword', 'Sabre', 'Broadblade', 'Duelist\'s Blade'], armor: ['Brigandine', 'Mail Coat', 'Leather Jerkin', 'Scale Hauberk'] },
  handan: { weapon: ['Staff', 'Rod', 'Willow Stave', 'Lantern Staff'], armor: ['Robe', 'Mantle', 'Spellweave Coat', 'Night Robe'] },
  any: { trinket: ['Charm', 'Band', 'Amulet', 'Lantern Token', 'Signet'] },
  suf: [' of the Fen', ' of Embers', ' of Brightfield', ' of the Keep', ' of Velmara', ' of the Ember Road', ' of Frostspire', ' of the Cold Forge'],
};

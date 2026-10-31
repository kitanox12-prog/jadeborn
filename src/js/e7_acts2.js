/* ===================== ACTS VI–X: the road to dawn =====================
   Sunscar Dunes → Thornveil → Cindermaw Caldera → Skyreach Spires → the Dawnless Gate.
   Zones share one template (entry south, boss terrace north behind a gate, exit east); bosses run on a
   data-driven kit of telegraphed attacks. Beacons b8–b12; the last one brings the first sunrise. */
function act5Done() { return !!(G.q.q34 && G.q.q34.st === 'done'); }
const qDone = id => !!(G.q[id] && G.q[id].st === 'done');

/* ---------- Foes ---------- */
const F = (name, lvl, draw, tint, o = {}) => Object.assign({ name, lvl, hp: Math.round(38 * lvl), atk: Math.round(3 * lvl), def: Math.round(lvl * .7), spd: 80, range: 32, rate: 1.7, xp: Math.round(12 * lvl), draw, r: 12, gold: [lvl, lvl * 2], tint: tint ? { c: tint, a: .55 } : undefined }, o);
Object.assign(FOES, {
  sandstalker: F('Sandstalker', 33, 'spider', '#d0a050', { spd: 102, r: 13, poison: true }),
  dunewraith: F('Dune Wraith', 34, 'wraith', '#e0c080', { spd: 108, drain: true }),
  sunpriest: F('Hollow Sunpriest', 34, 'witch', '#ffb040', { ranged: true, range: 210, rate: 2.2, proj: '#ffd070', light: '#ffc060' }),
  sandgolem: F('Sand Colossus', 35, 'golem', '#c8a060', { hp: 5100, atk: 140, def: 30, elite: true, scale: 1.4, r: 22, rate: 2.4, spd: 56, xp: 1600 }),
  scorpqueen: F('Sekhmar, the Sand Queen', 36, 'spider', '#e0a030', { hp: 72000, atk: 140, def: 30, boss: 'scorpqueen', scale: 2.6, r: 34, range: 60, rate: 2.1, spd: 84, xp: 14000, light: '#ffc060', gold: [800, 1000] }),
  vinehound: F('Vinehound', 37, 'wolf', '#4ac050', { spd: 110, poison: true }),
  bloomsprite: F('Bloom Sprite', 37, 'sprite', '#ff6aa0', { ranged: true, range: 190, rate: 2.1, proj: '#ff9ac0', light: '#ff9ac0' }),
  mossknight: F('Moss-Grown Knight', 39, 'knight', '#3a8a4a', { def: 34 }),
  thornbrute: F('Thorn Brute', 39, 'lurker', '#5aa040', { hp: 5700, atk: 156, def: 32, elite: true, scale: 1.75, r: 21, rate: 2.3, spd: 62, xp: 1800 }),
  rootmother: F('Verdigris, the Rootmother', 40, 'treant', '#3aa060', { hp: 80000, atk: 156, def: 32, boss: 'rootmother', scale: 1.9, r: 32, range: 64, rate: 2.3, spd: 58, xp: 16000, light: '#8aff9a', gold: [900, 1100] }),
  magmahound: F('Magma Hound', 41, 'wolf', '#ff5a1a', { spd: 112, light: '#ff7a3a' }),
  ashcaller: F('Ashcaller', 42, 'witch', '#ff7a3a', { ranged: true, range: 210, rate: 2.2, proj: '#ff8a3a' }),
  cinderknight: F('Cinder Knight', 43, 'knight', '#c83a14', { def: 38 }),
  obsidiangolem: F('Obsidian Colossus', 43, 'golem', '#2a1a1a', { hp: 6300, atk: 170, def: 38, elite: true, scale: 1.45, r: 23, rate: 2.4, spd: 56, xp: 2000, light: '#ff5a1a' }),
  ignivar: F('Ignivar, the Ash Wyrm', 44, 'wyrm', '#ff4a1a', { hp: 88000, atk: 172, def: 36, boss: 'ignivar', scale: 1.45, r: 34, range: 60, rate: 2.2, spd: 78, xp: 18000, light: '#ff7a3a', gold: [1000, 1200] }),
  galewisp: F('Gale Wisp', 45, 'wisp', '#bfe0ff', { ranged: true, range: 200, rate: 2.0, proj: '#dff0ff', light: '#bfe0ff', spd: 92 }),
  skyknight: F('Skyreach Sentinel', 45, 'knight', '#d0e0ff', { def: 40 }),
  stormsprite: F('Storm Sprite', 46, 'sprite', '#7ac8ff', { ranged: true, range: 190, rate: 2.0, proj: '#9ad8ff', chill: true, light: '#9ad8ff' }),
  stormgolem: F('Storm Colossus', 46, 'golem', '#6a8ad8', { hp: 6700, atk: 182, def: 40, elite: true, scale: 1.45, r: 23, rate: 2.4, spd: 58, xp: 2200, light: '#9ad0ff' }),
  zephyrion: F('Zephyrion, the Storm Herald', 47, 'witch', '#7ab8ff', { hp: 94000, atk: 182, def: 36, boss: 'zephyrion', scale: 1.8, r: 26, range: 220, rate: 2.0, spd: 80, ranged: true, proj: '#bfe6ff', xp: 20000, light: '#9ad0ff', gold: [1100, 1300] }),
  umbralhound: F('Umbral Hound', 48, 'wolf', '#3a0a1a', { spd: 116, drain: true }),
  hollowherald: F('Hollow Herald', 48, 'archer', '#c03050', { ranged: true, range: 220, rate: 2.1, proj: '#ff6a8a' }),
  gravetitan: F('Dawnless Titan', 49, 'knight', '#5a1a2a', { scale: 1.2, r: 15, def: 44, hp: 2100 }),
  echoknight: F('Echo of the Hollow King', 49, 'king', '#c03050', { hp: 7100, atk: 190, def: 42, elite: true, scale: 1.15, r: 24, range: 50, rate: 2.2, spd: 70, xp: 2400, light: '#ff4a6a' }),
  umbrath: F('Umbrath, the First Shadow', 50, 'king', '#1a0008', { hp: 108000, atk: 196, def: 40, boss: 'umbrath', scale: 1.8, r: 32, range: 62, rate: 2.0, spd: 84, xp: 30000, light: '#ff4a6a', gold: [2000, 2500] }),
});
Object.assign(BEACON_BOSS, { b8: 'scorpqueen', b9: 'rootmother', b10: 'ignivar', b11: 'zephyrion', b12: 'umbrath' });
Object.assign(NPCS, {
  talia: { name: 'Wayfinder Talia', title: 'Guide of the Sunscar caravans', look: { robe: '#a0703a', hair: '#2a1a12', skin: '#c08a5a', hood: '#d8b878' } },
  oren: { name: 'Druid Oren', title: 'Keeper of the Thornveil', look: { robe: '#2a5a2a', hair: '#7a6a4a', skin: '#c89a6a', beard: true, staff: true } },
  garrick: { name: 'Forgemaster Garrick', title: 'Last smith of the Cindermaw', look: { robe: '#4a3a32', hair: '#c86a2a', skin: '#d8a07a', beard: true, apron: true } },
  selene: { name: 'Aeromancer Selene', title: 'Warden of the Skyreach', look: { robe: '#4a6aa8', hair: '#e8eef8', skin: '#e8c4a4', staff: true } },
  lioraflame: { name: 'Liora', title: 'Spirit of the First Lantern', look: { robe: '#8ad8c0', hair: '#e8fff6', skin: '#cff5ea', ghost: true } },
});
Object.assign(NPC_TALK, {
  talia: ['Drink before you are thirsty. The desert does not give second chances.', 'The Sunwell kept the caravans alive for a thousand years. Now it only burns.', 'You two travel like people who have done this before.'],
  oren: ['Every thorn here was a flower once. The Hollow teaches things to bite.', 'Walk where the moss is soft. The roots listen.', 'Your fox is welcome here. The jungle likes Lumen better than it likes me.'],
  garrick: ['Mind the lava. It does not care how brave you are.', 'I forged lanterns for this whole country. Now I forge excuses.', 'Whatever the Hollow is making in my forge, it is not a horseshoe.'],
  selene: ['Do not look down. Or do, the view is the best part.', 'The wind up here remembers every storm. Zephyrion is all of them at once.', 'Hold on to each other in the gusts. That is not a metaphor.'],
  lioraflame: ['I have waited three hundred years for this night to end.', 'All the lanterns you lit are holding the door open for us.', 'The First Lantern chose well. It chose both of you.'],
});

/* ---------- Acts as data ---------- */
const ACT_DEFS = [
  { n: 6, id: 'dunes', name: 'Sunscar Dunes', sub: 'Beneath the Hollow Sun', seed: 251, style: 'desert', canopy: 'dead', dark: .38, tint: '#3a1a08', trees: .74, rocks: .955, lakes: [[52, 36, 5, 3.5]],
    prev: ['brightfield', 'south'], giver: 'ayla', npc: 'talia', q: 35, beacon: 'b8', beaconName: 'the Sunwell', item: ['sunshard', 'Sun-shards gathered'], A: 'sandstalker', BC: ['dunewraith', 'sunpriest'], elite: 'sandgolem', boss: 'scorpqueen', xp: 1,
    quests: [
      ['The Hollow Sun', 'The stars came back, Orhun, but when the dark broke something else woke: a Hollow Sun over the southern desert. It burns beacons from the sky down. Go south through Brightfield and find Wayfinder Talia at the edge of the Sunscar Dunes.', 'Liora sent you? Then the sky really is falling. Welcome to the Sunscar. Mind the sand, it moves.'],
      ['Stalkers in the Sand', 'Sandstalkers hunt the dune roads at night and drag whole caravans under. Break eight of them so my people can travel again.', 'The caravan bells are ringing again. That is the sound of people coming home.'],
      ['Pieces of the Sun', 'When the Hollow Sun rose, it shed burning sun-shards across the dunes. Gather six before they set the oasis alight.', 'Careful, they are still warm. With these I can light the way for the caravans.'],
      ['The Sunpriest Choir', 'Dune Wraiths and Hollow Sunpriests sing to the Hollow Sun at the old temples. Silence eight of them.', 'The sky looks a little less red tonight. Thank you.'],
      ['Colossi at the Temple', 'Two Sand Colossi guard the gate to the Sunwell temple. Topple them and the gate will open for anyone carrying the First Lantern.', 'The temple gate is grinding open. The Sand Queen waits inside.'],
      ['The Sand Queen', 'Sekhmar, the Sand Queen, swallowed the Sunwell\'s flame and grew fat on it. End her, relight the Sunwell, and come back to me.', 'The Sunwell burns clean again. The Hollow Sun\'s light fell east, into the Thornveil. Druid Oren keeps the jungle road; tell him I sent you.'],
    ],
    banter: { enter: [['handan', 'It is so hot, even at night.'], ['orhun', 'Look at the sky. That sun is not ours.'], ['handan', 'Then we put it out.']], boss: [['scorpqueen', 'Tiny lights in my desert. I will bury you with the caravans.'], ['orhun', 'Watch the tail!'], ['handan', 'Stay out of the burning circles!']], beacon: [['handan', 'The Sunwell. Feel that? Real warmth.'], ['orhun', 'One sun down. Talia will want to hear it.']] } },
  { n: 7, id: 'thornveil', name: 'Thornveil', sub: 'The jungle that bites', seed: 281, style: 'jungle', canopy: 'oak', dark: .5, tint: '#06200e', fog: true, trees: .5, rocks: .985, lakes: [[20, 36, 6, 4], [56, 38, 4, 3]],
    prev: ['dunes', 'east'], giver: 'talia', npc: 'oren', q: 41, beacon: 'b9', beaconName: 'the Verdant Lantern', item: ['dewlotus', 'Dew lotuses picked'], A: 'vinehound', BC: ['bloomsprite', 'mossknight'], elite: 'thornbrute', boss: 'rootmother', xp: 1.25,
    quests: [
      ['Into the Thornveil', 'East of the dunes, the Hollow Sun\'s light fell into the Thornveil and the jungle began to grow teeth. Find Druid Oren where the jungle road begins.', 'Talia still sends me strays, I see. Good strays, this time. Welcome to the Thornveil.'],
      ['Teeth in the Green', 'The Vinehounds were jungle dogs once. Now they are more thorn than fur. Thin the packs: eight of them.', 'Quieter. The birds are coming back to the low branches.'],
      ['Dew Lotuses', 'Dew lotuses only open under clean moonlight. Pick six and I can brew a draught that heals what the thorns poison.', 'Lovely. Hold one up to the light. That is what this jungle is supposed to look like.'],
      ['The Overgrown Watch', 'Bloom Sprites and Moss-Grown Knights hold the old watchtowers. Break eight of them.', 'The towers are ours again. I can see the canopy from up there.'],
      ['Brutes at the Root Gate', 'Two Thorn Brutes guard the Root Gate. The gate is alive; it will open for you once its wardens fall.', 'The Root Gate is opening. Be gentle with her if you can. Be quick if you cannot.'],
      ['The Rootmother', 'Verdigris, the Rootmother, wants to grow a wall of thorns over every lantern in Velmara. End her, relight the Verdant Lantern, and return to me.', 'The jungle is breathing again. But the roots told me where the Hollow went: down, into the Cindermaw. Forgemaster Garrick is still there.'],
    ],
    banter: { enter: [['handan', 'Everything here is green. Even the dark is green.'], ['orhun', 'And everything here wants to eat us.'], ['handan', 'Not everything. Look, fireflies.']], boss: [['rootmother', 'Little sparks... I will grow over you like I grew over the old road.'], ['handan', 'Watch the roots under your feet!'], ['orhun', 'Dodge out of the snares. I mean it.']], beacon: [['handan', 'The Verdant Lantern. It glows green, like the pendant.'], ['orhun', 'Like you, then.']] } },
  { n: 8, id: 'caldera', name: 'Cindermaw Caldera', sub: 'Where the Hollow forges its crown', seed: 311, style: 'volcanic', canopy: 'dead', dark: .45, tint: '#2a0602', trees: .78, rocks: .95, lakes: [[18, 34, 6, 4], [54, 26, 5, 3.5], [48, 44, 4, 2.5]],
    prev: ['thornveil', 'east'], giver: 'oren', npc: 'garrick', q: 47, beacon: 'b10', beaconName: 'the Heartforge', item: ['emberglass', 'Ember-glass collected'], A: 'magmahound', BC: ['ashcaller', 'cinderknight'], elite: 'obsidiangolem', boss: 'ignivar', xp: 1.5,
    quests: [
      ['Down into the Fire', 'The roots led the Hollow down into the Cindermaw, the volcano where the lantern-smiths worked. Forgemaster Garrick never left his forge. Find him.', 'Two of you, and a fox. The roots really are desperate. Come in, get warm. Well, warmer.'],
      ['Magma Hounds', 'Magma Hounds circle my forge every night. Put eight of them down before they chew through the bellows.', 'Good. I can hear myself hammer again.'],
      ['Ember-glass', 'Ember-glass forms where lava meets the cold. Bring me six pieces; I will need them for what comes next.', 'Perfect. Sharp, bright and hot. My favourite kind of rock.'],
      ['The Ash Choir', 'Ashcallers and Cinder Knights guard the lava paths and sing the mountain angry. Silence eight of them.', 'The mountain is grumbling less. That is as calm as it gets here.'],
      ['Obsidian Wardens', 'Two Obsidian Colossi guard the gate to the Heartforge. Break them and the gate will melt.', 'The gate is down. Ignivar is inside, sitting on my forge like a chicken on an egg.'],
      ['The Ash Wyrm', 'Ignivar is the youngest of Vyrmhal\'s brood, and he is forging a crown of shadow in my Heartforge. End him, relight the Heartforge, and come back.', 'The Heartforge sings again. But the crown is gone: it was carried up, into the sky, to the Skyreach Spires. Aeromancer Selene watches the winds there.'],
    ],
    banter: { enter: [['orhun', 'Mind the lava. Do not touch the lava. I am serious.'], ['handan', 'I was not going to touch the lava, Orhun.'], ['orhun', 'You touched the frozen lake.']], boss: [['ignivar', 'My brother froze. My sister drowned. I will burn.'], ['handan', 'He breathes fire in lines! Stay off them!'], ['orhun', 'Then let us end the family business.']], beacon: [['handan', 'The Heartforge. It is singing the same song as the First Flame.'], ['orhun', 'Garrick will cry. Do not tell him I said that.']] } },
  { n: 9, id: 'spires', name: 'Skyreach Spires', sub: 'Islands above the storm', seed: 341, style: 'sky', canopy: 'pine', dark: .2, tint: '#4a6ab8', trees: .7, rocks: .975, voids: .6,
    prev: ['caldera', 'east'], giver: 'garrick', npc: 'selene', q: 53, beacon: 'b11', beaconName: 'the Stormlantern', item: ['stormfeather', 'Storm feathers caught'], A: 'skyknight', BC: ['galewisp', 'stormsprite'], elite: 'stormgolem', boss: 'zephyrion', xp: 1.8,
    quests: [
      ['Up into the Sky', 'The shadow crown was carried up the old sky-stairs to the Skyreach Spires, islands that float above the storm. Aeromancer Selene keeps watch there.', 'Visitors! Real ones, with feet! Welcome to the Spires. Do not walk off the edges.'],
      ['Sentinels of the Spires', 'The Skyreach Sentinels guarded these islands for the Starwatch. The Hollow turned them. Lay eight of them to rest.', 'Thank you. They were good guards, once. They deserved better.'],
      ['Storm Feathers', 'The great storm-birds shed feathers that still crackle with lightning. Catch six for me before the wind carries them off.', 'Wonderful. With these I can calm the winds around the Herald\'s island.'],
      ['Gale and Spark', 'Gale Wisps and Storm Sprites ride the winds and feed the Herald\'s storm. Silence eight of them.', 'The winds are softer. I can hear birds again, real ones.'],
      ['Storm Colossi', 'Two Storm Colossi hold the bridge to the Herald\'s island. Break them and the wind-gate will open.', 'The wind-gate is open. Zephyrion waits with the crown. Hold on to each other.'],
      ['The Storm Herald', 'Zephyrion means to carry the shadow crown to the Dawnless Gate at the edge of the world. Stop him, relight the Stormlantern, and come back to me.', 'The storm is breaking. And there, past the clouds: the Dawnless Gate. Liora is waiting for you on the other side.'],
    ],
    banter: { enter: [['handan', 'Orhun, we are above the clouds. Actually above them.'], ['orhun', 'Do not look down. Do not look down.'], ['handan', 'You looked down.']], boss: [['zephyrion', 'Every storm that ever broke over Velmara was me. You are two candles in a gale.'], ['orhun', 'Lightning on the ground! Move!'], ['handan', 'Candles burn longer than storms.']], beacon: [['handan', 'The Stormlantern. The wind is singing.'], ['orhun', 'One more. Just one more.']] } },
  { n: 10, id: 'dawnless', name: 'The Dawnless Gate', sub: 'Where the first shadow sleeps', seed: 371, style: 'crimson', canopy: 'dead', dark: .58, tint: '#1e0410', trees: .76, rocks: .97, voids: .64,
    prev: ['spires', 'east'], giver: 'selene', npc: 'lioraflame', q: 59, beacon: 'b12', beaconName: 'the Dawn Lantern', item: ['dawnshard', 'Dawn-shards found'], A: 'umbralhound', BC: ['hollowherald', 'gravetitan'], elite: 'echoknight', boss: 'umbrath', xp: 2.1, last: true,
    quests: [
      ['The Edge of the World', 'Past the storm lies the Dawnless Gate, where night itself began. Liora went ahead of you. Go to her.', 'You came. Of course you came. This is where every Hollow was born, and where it ends.'],
      ['Hounds of the First Night', 'Umbral Hounds run the black fields before the Gate. Clear eight of them so we can reach the stair.', 'The stair is clear. I can almost feel the morning on the other side.'],
      ['Shards of Dawn', 'Every sunrise that never came left a shard of itself here. Find six dawn-shards; together with the lanterns you lit, they will be enough.', 'Look at them. Three hundred years of mornings, waiting for you.'],
      ['The Last Host', 'Hollow Heralds and Dawnless Titans stand on the stair. Break eight of them.', 'The host is broken. Only the echoes remain.'],
      ['Echoes of the King', 'Two echoes of the Hollow King guard the Gate, shadows of a shadow. Free them, and the Gate will open.', 'The Gate is open. Umbrath waits. Whatever happens, hold each other\'s hands.'],
      ['The First Shadow', 'Umbrath, the First Shadow, is the night that swallowed Velmara. Break him, and raise the Dawn Lantern at the top of the stair.', 'end'],
    ],
    banter: { enter: [['handan', 'Everything is red. Like the sky is bleeding.'], ['orhun', 'Then we close the wound.'], ['handan', 'Together?'], ['orhun', 'Always.']], boss: [['umbrath', 'I was here before the first lantern. I will be here after the last.'], ['handan', 'Not after this one.'], ['orhun', 'Stay close to me, Handan.']], beacon: [['handan', 'The Dawn Lantern...'], ['orhun', 'Look east.']] } },
];
const ACT_BY_ID = {};
for (const A of ACT_DEFS) {
  ACT_BY_ID[A.id] = A;
  const qid = i => 'q' + (A.q + i), m = A.xp;
  const xp = [2200, 4500, 4500, 5200, 5600, 9000].map(v => Math.round(v * m / 50) * 50);
  const QS = A.quests, plural = n => n.replace(/^Echo of/, 'Echoes of').replace(/Colossus$/, 'Colossi').replace(/([^s])$/, '$1s'), lbl = { kA: plural(FOES[A.A].name) + ' slain', kB: 'Foes of the ' + A.name.replace(/^The /, '') + ' defeated', el: plural(FOES[A.elite].name) + ' broken', bo: FOES[A.boss].name.split(',')[0] + ' defeated', be: A.beaconName[0].toUpperCase() + A.beaconName.slice(1) + ' relit' };
  QUESTS.push(
    { id: qid(0), name: QS[0][0], giver: A.giver, turnin: A.npc, pre: [A.n === 6 ? 'q34' : 'q' + (A.q - 1)], zone: A.name, ch: A.n, text: QS[0][1], done: QS[0][2], obj: [{ t: 'visit', zone: A.id, n: 1, label: 'Reach ' + A.name }], xp: xp[0], gold: 150 * m | 0, potions: 4 },
    { id: qid(1), name: QS[1][0], giver: A.npc, pre: [qid(0)], zone: A.name, ch: A.n, text: QS[1][1], done: QS[1][2], obj: [{ t: 'kill', e: [A.A], n: 8, label: lbl.kA }], xp: xp[1], gold: 220 * m | 0 },
    { id: qid(2), name: QS[2][0], giver: A.npc, pre: [qid(0)], zone: A.name, ch: A.n, text: QS[2][1], done: QS[2][2], obj: [{ t: 'collect', item: A.item[0], n: 6, label: A.item[1] }], xp: xp[2], gold: 200 * m | 0, potions: 5 },
    { id: qid(3), name: QS[3][0], giver: A.npc, pre: [qid(1)], zone: A.name, ch: A.n, text: QS[3][1], done: QS[3][2], obj: [{ t: 'kill', e: A.BC, n: 8, label: lbl.kB }], xp: xp[3], gold: 260 * m | 0, item: 3 },
    { id: qid(4), name: QS[4][0], giver: A.npc, pre: [qid(2)], zone: A.name, ch: A.n, text: QS[4][1], done: QS[4][2], obj: [{ t: 'kill', e: [A.elite], n: 2, label: lbl.el }], xp: xp[4], gold: 300 * m | 0, item: 3 },
    Object.assign({ id: qid(5), name: QS[5][0], giver: A.npc, pre: [qid(3), qid(4)], zone: A.name, ch: A.n, text: QS[5][1], done: QS[5][2], obj: [{ t: 'boss', e: A.boss, n: 1, label: lbl.bo }, { t: 'beacon', id: A.beacon, n: 1, label: lbl.be }], xp: xp[5], gold: 600 * m | 0, item: 3 }, A.last ? { final: true } : {}),
  );
  BANTER[A.name] = A.banter.enter; BANTER[A.boss] = A.banter.boss; BANTER[A.beacon] = A.banter.beacon;
  TRAVEL_ORDER.push(A.id); BEACON_ZONE_NAME[A.beacon] = A.name;
  ITEM_NAMES.suf.push(' of the ' + A.name.replace(/^The /, ''));
}
BANTER.umbrath3 = [['handan', 'Orhun! Every lantern we ever lit is answering! I can feel all of them!'], ['orhun', 'Then we light the last one together. Hold on to me!']];
BANTER.ch6 = [['handan', 'Orhun... the sky to the south. Is that a sunrise?'], ['orhun', 'No. That light is wrong. Too red.'], ['handan', 'Liora will know. Let us find her.']];

/* ---------- Palettes ---------- */
Object.assign(PAL, {
  desert: { grass: ['#8a7044', '#94784a', '#80683e', '#9a8050'], dg: ['#7a6038', '#806640', '#745a34'], blade: '#a08a50', flower: ['#e0c070', '#d07a3a'], path: ['#a08a60', '#988258', '#a89068'], pebble: '#6a5a3a' },
  jungle: { grass: ['#1e4a24', '#22522a', '#1a4420', '#28582e'], dg: ['#163a1c', '#1a4020', '#143618'], blade: '#3a8a3a', flower: ['#ff6a9a', '#ffd040', '#a070ff'], path: ['#5a4a2a', '#544428', '#604e2e'], pebble: '#6a5a3a' },
  volcanic: { grass: ['#2a2220', '#30261f', '#261e1c', '#2e2420'], dg: ['#3a1e14', '#401f12', '#361c12'], blade: '#5a3a2a', flower: ['#ff6a2a', '#ffb040'], path: ['#4a3a30', '#45362c', '#503e34'], pebble: '#6a4a3a' },
  sky: { grass: ['#4a6a5a', '#4e705e', '#466454', '#527462'], dg: ['#3e5a4c', '#42604f', '#3a5448'], blade: '#6a9a7a', flower: ['#e0f0ff', '#ffd0f0', '#fff2b0'], path: ['#8a8a9a', '#82828f', '#9090a0'], pebble: '#a0a0b0' },
  crimson: { grass: ['#2a1418', '#30161c', '#261214', '#341820'], dg: ['#3a1018', '#401220', '#360e16'], blade: '#6a2a3a', flower: ['#ff4a6a', '#ffd86a'], path: ['#4a2a32', '#45262e', '#502e36'], pebble: '#6a3a44' },
});

/* ---------- Zone template ---------- */
function actZone(A) {
  const z = new Zone(A.id, A.name, 72, 52, { seed: A.seed, dark: A.dark, tint: A.tint, style: A.style, canopy: A.canopy, fog: A.fog, snow: A.snow });
  z.fill(T.GRASS);
  z.scatter(T.DGRASS, (x, y) => fbm(x * .12, y * .12, A.seed + 1) > .55);
  z.border(2, A.style === 'sky' || A.style === 'crimson' ? T.ROCK : T.TREE, [[34, 50, 5, 2], [70, 24, 2, 5]]);
  for (const [lx, ly, rx, ry] of A.lakes || []) for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) { const d = Math.hypot((x - lx) / rx, (y - ly) / ry) + (fbm(x * .3, y * .3, A.seed + 2) - .5) * .4; if (d < 1) z.set(x, y, d < .55 ? T.DEEP : T.WATER); }
  z.scatter(T.TREE, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && y > 18 && fbm(x * .14, y * .14, A.seed + 4) > A.trees);
  z.scatter(T.ROCK, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && y > 18 && hash2(x, y, A.seed + 5) > A.rocks);
  // boss terrace behind the gate
  z.rect(2, 16, 68, 2, T.ROCK); z.rect(3, 3, 66, 13, T.FLOOR); z.circle(36, 9, 6.5, T.PLAZA);
  [[26, 5], [46, 5], [26, 13], [46, 13], [20, 9], [52, 9], [12, 6], [60, 6], [12, 12], [60, 12]].forEach(([x, y]) => z.set(x, y, T.ROCK));
  for (let x = 33; x <= 39; x++) { z.set(x, 16, T.GATE); z.set(x, 17, T.PATH); }
  z.path([[36, 51], [36, 44], [30, 36], [38, 28], [36, 20], [36, 18]], 3);
  z.path([[30, 36], [14, 32], [10, 22]], 2); z.path([[38, 28], [56, 30], [62, 22]], 2); z.path([[56, 30], [71, 26]], 3);
  z.path([[36, 44], [54, 44]], 2); z.path([[36, 44], [18, 44]], 2);
  const CL = [[36, 44, 4.5], [30, 36, 3.5], [38, 28, 3.5], [14, 32, 3.5], [10, 22, 3.5], [56, 30, 3.5], [62, 22, 3.5], [54, 44, 3.5], [18, 44, 3.5], [36, 21, 3.5], [66, 26, 2.5]];
  CL.forEach(([x, y, r]) => z.circle(x, y, r, T.GRASS, [T.TREE, T.ROCK, T.DGRASS]));
  if (A.voids) z.scatter(T.VOID, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && y > 19 && y < 48 && fbm(x * .09, y * .09, A.seed + 3) > A.voids && Math.hypot(x - 36, y - 44) > 7 && !CL.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) < r + 1));
  z.beacons.push({ id: A.beacon, x: 36, y: 6, first: !!A.last });
  [[30, 6], [42, 6], [30, 12], [42, 12]].forEach(([x, y]) => z.decor.push({ type: 'brazier', x, y }));
  [[36, 40], [31, 34], [38, 25], [35, 19], [14, 30], [56, 28]].forEach(([x, y]) => z.lantern(x, y, A.beacon));
  z.decor.push({ type: 'campfire', x: 38, y: 45 }, { type: 'tent', x: 41, y: 42 }, { type: 'tent', x: 31, y: 42 });
  z.lantern(33, 47); z.lantern(40, 47);
  z.npcs.push({ id: A.npc, x: 36.5, y: 44.2 });
  const S = (type, x, y) => z.spawns.push({ type, x, y });
  [[30, 36], [14, 32], [10, 22], [56, 30], [62, 22], [54, 44], [18, 44], [38, 28]].forEach(([x, y], i) => {
    const t1 = i % 3 === 0 ? A.A : A.BC[i % 2], t2 = i % 2 ? A.A : A.BC[(i + 1) % 2];
    S(t1, x - 1, y); S(t2, x + 1, y + 1); if (i % 2 === 0) S(A.A, x, y - 1);
  });
  S(A.elite, 33, 20); S(A.elite, 39, 20); S(A.boss, 36, 10);
  const r = mulberry32(A.seed + 7);
  for (let i = 0; i < 7; i++) { const [x, y] = z.randomOpen(r, 6, 20, 66, 47, [T.GRASS, T.DGRASS]); z.pickups.push({ id: A.item[0].slice(0, 3) + i, item: A.item[0], x, y }); }
  z.portals.push({ x: 34, y: 51, w: 5, h: 1, to: A.prev[0], entry: A.prev[1], label: ZONES[A.prev[0]] ? ZONES[A.prev[0]].name : A.prev[0], push: [0, -48] });
  const next = ACT_DEFS.find(B => B.n === A.n + 1);
  if (next) z.portals.push({ x: 71, y: 24, w: 1, h: 5, to: next.id, entry: 'south', label: next.name, req: () => qDone('q' + (A.q + 5)), lock: 'The way east is sealed until ' + A.beaconName + ' burns again.' });
  z.entries = { south: [36.5, 48.6], east: [68.5, 26.5] };
  z.waystone = { x: 32, y: 46, need: A.beacon };
  return z;
}
const _iz8 = initZones;
initZones = function () {
  _iz8();
  for (const A of ACT_DEFS) ZONES[A.id] = actZone(A);
  // Brightfield gets a south road into the dunes
  const bf = ZONES.brightfield;
  bf.rect(51, 48, 7, 4, T.GRASS); bf.path([[54, 51], [54, 44], [50, 38]], 3);
  bf.portals.push({ x: 52, y: 51, w: 5, h: 1, to: 'dunes', entry: 'south', label: 'Sunscar Dunes', push: [0, -48], req: act5Done, lock: 'A wall of hot wind blocks the south road. It is not yet time.' });
  bf.entries.south = [54.5, 48.6];
  if (typeof TCOL !== 'undefined') Object.assign(TCOL, {
    desert: { [T.GRASS]: '#c8a868', [T.DGRASS]: '#b89858', [T.PATH]: '#a89070', [T.ROCK]: '#c8a868', [T.TREE]: '#b89858', [T.FLOOR]: '#a08868', [T.PLAZA]: '#b8a080', [T.WATER]: '#2a6a7a', [T.DEEP]: '#1a5060', [T.GATE]: '#a89070', [T.BRIDGE]: '#2a6a7a' },
    jungle: { [T.GRASS]: '#2e6a32', [T.DGRASS]: '#24582a', [T.PATH]: '#6a5434', [T.ROCK]: '#2e6a32', [T.TREE]: '#24582a', [T.FLOOR]: '#4a5a48', [T.PLAZA]: '#5a6a58', [T.WATER]: '#1a4a40', [T.DEEP]: '#103a32', [T.GATE]: '#6a5434', [T.BRIDGE]: '#1a4a40' },
    volcanic: { [T.GRASS]: '#3a302c', [T.DGRASS]: '#4a281c', [T.PATH]: '#5a4a40', [T.ROCK]: '#3a302c', [T.TREE]: '#4a281c', [T.FLOOR]: '#463a36', [T.PLAZA]: '#54443e', [T.WATER]: '#ff4a14', [T.DEEP]: '#ff7a1a', [T.GATE]: '#5a4a40', [T.BRIDGE]: '#ff4a14' },
    sky: { [T.GRASS]: '#6a9a7a', [T.DGRASS]: '#5a8a6c', [T.PATH]: '#a8a8b8', [T.ROCK]: '#6a9a7a', [T.TREE]: '#5a8a6c', [T.FLOOR]: '#b0b4c4', [T.PLAZA]: '#c0c4d4', [T.VOID]: '#a8c4f0', [T.GATE]: '#a8a8b8' },
    crimson: { [T.GRASS]: '#3a1a22', [T.DGRASS]: '#4a1a26', [T.PATH]: '#5a3038', [T.ROCK]: '#3a1a22', [T.TREE]: '#4a1a26', [T.FLOOR]: '#482a32', [T.PLAZA]: '#5a343e', [T.VOID]: '#0a0204', [T.GATE]: '#5a3038' },
  });
  if (typeof AMB !== 'undefined') Object.assign(AMB, {
    dunes: { fog: 0x3a2414, near: 20, far: 52, sky: 0xffb070, gnd: 0x3a2a18, hI: .72, moon: 0xffd0a0, mI: .6, exp: 1.12 },
    thornveil: { fog: 0x0a2414, near: 12, far: 36, sky: 0x6ad08a, gnd: 0x10200e, hI: .6, moon: 0xb0ffc0, mI: .42, exp: 1.2 },
    caldera: { fog: 0x2a0a06, near: 16, far: 44, sky: 0xff7040, gnd: 0x200806, hI: .58, moon: 0xff9a6a, mI: .5, exp: 1.18 },
    spires: { fog: 0x8aa0c8, near: 22, far: 60, sky: 0xd8e8ff, gnd: 0x4a5a70, hI: .85, moon: 0xffffff, mI: .7, exp: 1.02 },
    dawnless: { fog: 0x1e0610, near: 15, far: 42, sky: 0xc04a6a, gnd: 0x1a0608, hI: .6, moon: 0xff8aa0, mI: .45, exp: 1.25 },
  });
};
// 2D: lava and open sky instead of water and black void
if (typeof renderZone === 'function') {
  const _rz8 = renderZone;
  renderZone = function (z) {
    _rz8(z);
    if (!z.base || z.base === true || (z.style !== 'volcanic' && z.style !== 'sky' && z.style !== 'crimson')) return;
    const g = z.base.getContext('2d');
    for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) {
      const t = z.get(x, y), X = x * TILE, Y = y * TILE, h = hash2(x, y, 77);
      if (z.style === 'volcanic' && (t === T.WATER || t === T.DEEP)) { g.fillStyle = t === T.DEEP ? '#ff7a1a' : '#d8400e'; g.fillRect(X, Y, TILE, TILE); g.fillStyle = 'rgba(255,220,120,.55)'; g.fillRect(X + h * 20, Y + (1 - h) * 20, 8, 3); g.fillStyle = 'rgba(80,10,0,.35)'; g.fillRect(X + (1 - h) * 18, Y + h * 22, 10, 4); }
      if (z.style === 'sky' && t === T.VOID) { g.fillStyle = h > .5 ? '#a8c4f0' : '#9ab8ea'; g.fillRect(X, Y, TILE, TILE); if (h > .7) { g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(X + 16, Y + 16, 14, 6, 0, 0, 7); g.fill(); } }
      if (z.style === 'crimson' && t === T.VOID) { g.fillStyle = h > .5 ? '#140306' : '#1e050a'; g.fillRect(X, Y, TILE, TILE); if (h > .85) { g.fillStyle = 'rgba(255,60,90,.25)'; g.fillRect(X + 12, Y + 12, 4, 4); } }
    }
  };
}
// 3D: lava glow, dry / lush / dark foliage, tinted treants
if (typeof build3DZone === 'function') {
  const _b3z8 = build3DZone;
  build3DZone = function (z) {
    _b3z8(z);
    if (!z.g3) return;
    if (z.style === 'volcanic' && z.g3.water) { const m = z.g3.water.material; m.color.set('#ff5a1a'); m.emissive.set('#c8300a'); m.emissiveIntensity = 1.3; m.opacity = .95; }
    const pal = { desert: { crown: ['#7a6a3a', '#8a7a4a'], tuft: ['#a08a50', '#b89a5a', '#8a7444'], flower: ['#e0c070', '#d07a3a'] }, jungle: { crown: ['#1a6a2a', '#2a8a3a', '#147a30', '#3a9a3a'], tuft: ['#2a7a2a', '#3a8a3a', '#1e6a2a'], flower: ['#ff6a9a', '#ffd040', '#a070ff'] },
      volcanic: { crown: ['#3a2a24', '#2a1e1a'], tuft: ['#4a2a1a', '#5a3020'], flower: ['#ff6a2a', '#ffb040'] }, sky: { tuft: ['#7aaa8a', '#8aba9a'], flower: ['#e0f0ff', '#ffd0f0', '#fff2b0'] },
      crimson: { crown: ['#4a1020', '#3a0a18'], tuft: ['#5a1a2a', '#4a1424'], flower: ['#ff4a6a', '#ffd86a'] } }[z.style];
    if (!pal) return;
    const C = new THREE.Color(), gc = gIco(.6, 1), gt = gCone(.07, .25, 3), gf = gSph(.045, 6, 4);
    z.g3.root.traverse(o => { if (!o.isInstancedMesh || !o.instanceColor) return; const list = o.geometry === gc ? pal.crown : o.geometry === gt ? pal.tuft : o.geometry === gf ? pal.flower : null; if (!list) return; for (let i = 0; i < o.count; i++) { C.set(list[(i * 7 + (i >> 2)) % list.length]); o.setColorAt(i, C); } o.instanceColor.needsUpdate = true; });
  };
}
if (typeof makeFoe3D === 'function') {
  const _mf8 = makeFoe3D;
  makeFoe3D = function (f) { const m = _mf8(f); if (f.def && f.def.draw === 'treant' && f.def.tint && m.mats) { const tc = new THREE.Color(f.def.tint.c); for (const mt of m.mats) { mt.color.lerp(tc, f.def.tint.a); if (mt.emissive && mt.emissiveIntensity >= 1) mt.emissive.lerp(tc, f.def.tint.a); } } return m; };
}

/* ---------- Gates, pickups, beacons, turn-ins ---------- */
const ACT_ITEMS = Object.fromEntries(ACT_DEFS.map(A => [A.item[0], 'q' + (A.q + 2)]));
const ACT_GATES = Object.fromEntries(ACT_DEFS.map(A => ['q' + (A.q + 4), A]));
const _gate8 = gateOpenFor; gateOpenFor = function (id) { if (ACT_BY_ID[id]) return !!(G.zgates && G.zgates[id]); return _gate8(id); };
const _pick8 = pickupActive; pickupActive = function (p) { const q = ACT_ITEMS[p.item]; if (q) { const s = G.q[q]; return !!(s && s.st === 'active'); } return _pick8(p); };
const _turn8 = turnIn; turnIn = function (q) { _turn8(q); const A = ACT_GATES[q.id]; if (A) { G.zgates = G.zgates || {}; G.zgates[A.id] = true; toast('The gate of ' + A.name + ' opens.'); saveGame(true); } };
const _rl8 = relight;
relight = function (b) {
  const A = ACT_DEFS.find(x => x.beacon === b.id); if (!A) return _rl8(b);
  G.beacons[b.id] = true; sfx('beacon'); shake(6);
  burstFx((b.x + .5) * TILE, (b.y + .5) * TILE - 20, 120, '#7dffc8', 40); burstFx((b.x + .5) * TILE, (b.y + .5) * TILE - 20, 70, '#ffd86a', 30);
  qProgress('beacon', b.id);
  if (A.last) { setTimeout(showEnding4, 2500); saveGame(true); return; }
  banner('Beacon relit', A.beaconName[0].toUpperCase() + A.beaconName.slice(1) + ' burns again');
  const lines = BANTER[b.id]; if (lines) setTimeout(() => playDialog(lines.map(([w, t]) => ({ who: w, text: t }))), 900);
  saveGame(true);
};
const _enter8 = enterZone;
enterZone = function (id, entryKey, pos) {
  _enter8(id, entryKey, pos);
  if (G.mode === 'survivor') return;
  const A = ACT_BY_ID[id]; if (A) banner(A.name, A.sub);
  if (id === 'town' && act5Done() && !G.seenBanter.ch6 && !G.q.q35) { G.seenBanter.ch6 = true; setTimeout(() => playDialog(BANTER.ch6.map(([w, t]) => ({ who: w, text: t }))), 900); }
};

/* ---------- Data-driven boss kits ---------- */
const BOSS_KITS = {
  scorpqueen: { col: '#ffb040', col2: '#ffd070', line: { cd: 8, name: 'Sandstorm Lash', len: 6, dmg: 2.2 }, rain: { cd: 9, name: 'Venom Rain', n: 3, r: 1.5, dmg: 1.6 }, ring: { cd: 13, name: 'Burrow Quake', r: 3.4, dmg: 2.6, p2: true },
    adds: [[.7, ['sandstalker', 'sandstalker', 'sandstalker'], 'Her brood answers!'], [.35, ['dunewraith', 'sunpriest'], 'The sand rises!']], p2: { at: .5, msg: 'Sekhmar\'s shell glows red!' } },
  rootmother: { col: '#7aff8a', col2: '#c8ffb0', snare: { cd: 11, name: 'Strangling Roots', r: 2.2, dmg: 1.2 }, rain: { cd: 8.5, name: 'Spore Bloom', n: 3, r: 1.6, dmg: 1.6 }, ring: { cd: 14, name: 'Thorn Nova', r: 3.6, dmg: 2.6 },
    adds: [[.7, ['bloomsprite', 'bloomsprite', 'bloomsprite'], 'The flowers wake!'], [.35, ['vinehound', 'vinehound', 'vinehound'], 'The hounds answer the roots!']], p2: { at: .5, msg: 'The Rootmother blooms in fury!' } },
  ignivar: { col: '#ff6a2a', col2: '#ffb050', line: { cd: 7.5, name: 'Magma Breath', len: 7, dmg: 2.4 }, rain: { cd: 9, name: 'Falling Ash', n: 4, r: 1.5, dmg: 1.7 }, ring: { cd: 12, name: 'Eruption', r: 3.8, dmg: 2.8, p2: true },
    adds: [[.65, ['magmahound', 'magmahound', 'ashcaller'], 'The mountain sends its hounds!'], [.3, ['cinderknight', 'cinderknight'], 'Cinder Knights climb from the lava!']], p2: { at: .5, msg: 'Ignivar\'s scales split with fire!' } },
  zephyrion: { col: '#9ad0ff', col2: '#ffffff', rain: { cd: 6.5, name: 'Lightning Strikes', n: 5, r: 1.2, dmg: 1.6 }, line: { cd: 9, name: 'Gale Lance', len: 7, dmg: 2.2 }, snare: { cd: 13, name: 'Static Chains', r: 2.4, dmg: 1.2, p2: true }, ring: { cd: 15, name: 'Thunderclap', r: 3.6, dmg: 2.6 },
    adds: [[.7, ['galewisp', 'galewisp', 'stormsprite'], 'The winds take shape!'], [.35, ['skyknight', 'skyknight'], 'The sentinels return!']], p2: { at: .5, msg: 'The storm breaks loose!', eclipse: true } },
  umbrath: { col: '#ff4a6a', col2: '#ffb0c0', cleave: { cd: 6, name: 'Shadow Cleave', r: 2.5, dmg: 2.7 }, rain: { cd: 8, name: 'Falling Night', n: 4, r: 1.5, dmg: 1.9 }, snare: { cd: 13, name: 'Chains of the First Night', r: 2.4, dmg: 1.4, p2: true }, ring: { cd: 11, name: 'Collapse', r: 4, dmg: 2.9, p3: true },
    adds: [[.75, ['umbralhound', 'umbralhound', 'hollowherald'], 'The night has teeth!'], [.5, ['echoknight'], 'An echo of the Hollow King rises!']], p2: { at: .66, msg: 'The last stars go out.', eclipse: true }, p3: { at: .3, dialog: 'umbrath3' } },
};
const _bt8 = bossTick;
bossTick = function (f, tgt, dt) {
  const K = BOSS_KITS[f.type]; if (!K) return _bt8(f, tgt, dt);
  const b = f.bs;
  if (b.cast) { b.cast.t -= dt; f.moving = false; if (b.cast.t <= 0) { const c = b.cast; b.cast = null; c.end && c.end(); } return true; }
  return kitTick(f, tgt, dt, b, f.hp / f.maxHp, K);
};
const KIT_KEYS = ['ring', 'line', 'rain', 'snare', 'cleave'];
function kitTick(f, tgt, dt, b, hpP, K) {
  if (!b.init) { b.init = 1; b.cd = {}; for (const k of KIT_KEYS) if (K[k]) b.cd[k] = K[k].cd * (.35 + Math.random() * .3); }
  for (const k in b.cd) b.cd[k] -= dt;
  const sp = b.p2 ? .75 : 1, col = K.col;
  (K.adds || []).forEach((a, i) => { if (hpP < a[0] && !b['a' + i]) { b['a' + i] = 1; floatText(f.x, f.y - 110, a[2], col, 1.2); for (const t of a[1]) { const [x, y] = arenaPoint(f, 5 * TILE); summon(t, x, y, P.orhun); } } });
  if (K.p2 && hpP < K.p2.at && !b.p2) { b.p2 = 1; f.enraged = true; if (K.p2.eclipse) G.eclipse = true; floatText(f.x, f.y - 95, K.p2.msg, col, 1.35); sfx('roar'); shake(6); }
  if (K.p3 && hpP < K.p3.at && !b.p3) { b.p3 = 1; G.gauge = 100; floatText(f.x, f.y - 110, 'Every lantern answers!', '#fff2b0', 1.5); svHearts((P.orhun.x + P.handan.x) / 2, (P.orhun.y + P.handan.y) / 2 - 40, 10); if (K.p3.dialog) playDialog(BANTER[K.p3.dialog].map(([w, t]) => ({ who: w, text: t }))); }
  const ready = k => K[k] && b.cd[k] <= 0 && (!K[k].p2 || b.p2) && (!K[k].p3 || b.p3);
  const cast = (k, t, end) => { b.cd[k] = K[k].cd * sp; b.cast = { name: K[k].name, t, dur: t, end }; return true; };
  if (ready('ring')) { const R = K.ring.r * TILE, x = f.x, y = f.y; tele(x, y, R, 2.1, null, col); return cast('ring', 2.1, () => { burstFx(x, y, R, K.col2, 22); shake(8); sfx('boom'); hitParty(x, y, R, f, f.atk * K.ring.dmg); }); }
  if (ready('cleave')) { const R = K.cleave.r * TILE, x = tgt.x, y = tgt.y; tele(x, y, R, 1.4, null, col); return cast('cleave', 1.4, () => { f.swing = 1; sfx('crit'); shake(7); burstFx(x, y, R, K.col2, 14); hitParty(x, y, R, f, f.atk * K.cleave.dmg); }); }
  if (ready('line')) {
    const a = Math.atan2(tgt.y - f.y, tgt.x - f.x), pts = []; for (let k = 1; k <= K.line.len; k++) pts.push([f.x + Math.cos(a) * k * 1.4 * TILE, f.y + Math.sin(a) * k * 1.4 * TILE]);
    for (const [x, y] of pts) tele(x, y, 1.2 * TILE, 1.7, null, col);
    return cast('line', 1.7, () => { const hit = new Set(); sfx('boom'); shake(6); for (const [x, y] of pts) { burstFx(x, y, 1.2 * TILE, K.col2, 8); for (const h of partyAlive()) if (!hit.has(h) && Math.hypot(h.x - x, h.y - y) < 1.2 * TILE + h.r) { hit.add(h); dealDamage(f, h, f.atk * K.line.dmg, {}); } } });
  }
  if (ready('rain')) {
    const spots = heroes().filter(h => !h.dead).map(h => [h.x, h.y]); for (let i = 0; i < K.rain.n + (b.p2 ? 2 : 0); i++) spots.push(arenaPoint(f, 6 * TILE));
    const R = K.rain.r * TILE; for (const [x, y] of spots) tele(x, y, R, 1.6, () => { burstFx(x, y, R, K.col2, 9); hitParty(x, y, R, f, f.atk * K.rain.dmg); }, col);
    return cast('rain', 1, null);
  }
  if (ready('snare')) {
    b.cd.snare = K.snare.cd * sp; floatText(f.x, f.y - 100, K.snare.name + '! Dodge to break free!', col, 1.1);
    for (const h of heroes().filter(h => !h.dead)) { if (h.hero) addBuff(h, { id: 'root', name: K.snare.name, dur: 2.4, mods: { root: true }, col, debuff: true }); vines(h); const hx = h.x, hy = h.y, R = K.snare.r * TILE * .6; tele(hx, hy, R, 2, () => { burstFx(hx, hy, R, K.col2, 10); hitParty(hx, hy, R, f, f.atk * K.snare.dmg * 1.6); }, col); }
  }
  return false;
}
const _lb8 = lanternburst;
lanternburst = function (who) {
  const ready = G.gauge >= 100; _lb8(who);
  if (!ready || G.mode === 'survivor') return;
  const c = who || ctrlHero();
  for (const f of G.foes) if (!f.dead && BOSS_KITS[f.type] && f.bs && f.bs.p3 && dist(f, c) < 7 * TILE) { dealDamage(P.handan, f, f.maxHp * .1, { noCrit: true, threat: .5 }); floatText(f.x, f.y - 110, 'The Dawn Lantern burns!', '#fff2b0', 1.4); svHearts(c.x, c.y - 40, 6); }
};

/* ---------- The true ending ---------- */
function showEnding4() {
  G.ended = true;
  svHearts((P.orhun.x + P.handan.x) / 2, (P.orhun.y + P.handan.y) / 2 - 40, 16);
  G.dawn = true;
  playDialog([
    { who: 'narrator', text: 'The Dawn Lantern rises. Far to the east, a thin gold line opens along the edge of the world, and for the first time in three hundred years the sun comes up over Velmara.' },
    { who: 'lioraflame', text: 'This is what the lanterns were always for. Not to fight the night. To wait for the morning.' },
    { who: 'handan', text: 'Orhun... look. A sunrise. Our first one.' },
    { who: 'orhun', text: 'I have waited my whole life to see one. I am glad it is with you.' },
    { who: 'handan', text: 'Then let us see all of them. Every single one.' },
  ], () => {
    const w = $('ending'); w.hidden = false;
    w.innerHTML = `<h2 style="justify-content:center">Dawn over Velmara</h2>
      <p>Orhun and Handan broke Umbrath, the First Shadow, and raised the Dawn Lantern. Every beacon on the Ember Road burns, and the sun rises over Velmara at last.</p>
      <p style="color:#9a978e">Level ${G.level} · ${G.kills} foes defeated · ${G.gold} gold carried</p>
      <p style="color:#e0a64e;font-family:var(--display);font-size:18px">Thank you for walking the Ember Road together.</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button class="btn primary" id="endStay">Keep exploring</button><button class="btn" id="endNew">Start a new journey</button></div>`;
    $('endStay').onclick = () => { w.hidden = true; };
    $('endNew').onclick = () => { w.hidden = true; newGame(); };
  });
}

/* ---------- After the dawn the world is a little brighter; sky islands get real drops ---------- */
const _rlights8 = renderLights;
renderLights = function (g, z, cx, cy, t) { if (G.beacons && G.beacons.b12 && G.mode !== 'survivor') { const d = z.dark; z.dark = d * .45; _rlights8(g, z, cx, cy, t); z.dark = d; return; } return _rlights8(g, z, cx, cy, t); };
EXTRA_3D.push(R => { if (G.mode === 'survivor' || !(G.beacons && G.beacons.b12)) return; R.hemi.intensity *= 1.45; R.moon.intensity *= 1.5; R.moon.color.lerp(new THREE.Color(0xffd8a8), .6); R.renderer.toneMappingExposure *= 1.08; });
if (typeof build3DZone === 'function') {
  const _b3z9 = build3DZone;
  build3DZone = function (z) {
    _b3z9(z);
    if (!z.g3 || (z.style !== 'sky' && z.style !== 'crimson')) return;
    const W1 = z.w + 1;
    z.g3.root.traverse(o => {
      if (!o.isMesh || !o.geometry.attributes.color || o.geometry.attributes.position.count !== W1 * (z.h + 1)) return;
      const pos = o.geometry.attributes.position;
      for (let j = 0; j <= z.h; j++) for (let i = 0; i <= z.w; i++) if ([z.get(i - 1, j - 1), z.get(i, j - 1), z.get(i - 1, j), z.get(i, j)].every(t => t === T.VOID)) pos.setY(j * W1 + i, -3);
      pos.needsUpdate = true; o.geometry.computeVertexNormals();
    });
  };
}

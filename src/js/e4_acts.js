/* ===================== ACTS III–V: Emberwood, Glasswater Vale, the Starless Crown =====================
   Content and systems for the rest of the story: three zones west of Lanternhold, their foes, bosses,
   quests, beacons b5–b7, per-zone gates (G.zgates) and the final ending. Loaded after f_ui.js. */
function ch2Done() { return !!(G.q.q16 && G.q.q16.st === 'done'); }
function act3Done() { return !!(G.q.q22 && G.q.q22.st === 'done'); }
function act4Done() { return !!(G.q.q28 && G.q.q28.st === 'done'); }

/* ---------- Content ---------- */
Object.assign(FOES, {
  // Act III — Emberwood
  cinderhound: { name: 'Cinderhound', lvl: 17, hp: 640, atk: 50, def: 12, spd: 108, range: 30, rate: 1.4, xp: 150, draw: 'wolf', scale: 1.05, r: 13, gold: [9, 18], tint: { c: '#ff7a3a', a: .55 } },
  ashsprite: { name: 'Ash Sprite', lvl: 17, hp: 480, atk: 46, def: 8, spd: 74, range: 190, rate: 2.1, xp: 140, ranged: true, proj: '#ffb050', draw: 'sprite', r: 10, light: '#ffb050', gold: [8, 16], tint: { c: '#ff9a4a', a: .6 } },
  emberknight: { name: 'Ember-Hollowed Knight', lvl: 19, hp: 760, atk: 58, def: 16, spd: 76, range: 34, rate: 1.9, xp: 200, draw: 'knight', r: 13, gold: [12, 22], tint: { c: '#ff6a2a', a: .45 } },
  cinderbrute: { name: 'Cinder Brute', lvl: 20, hp: 3000, atk: 82, def: 20, spd: 62, range: 40, rate: 2.3, xp: 700, elite: true, draw: 'lurker', scale: 1.75, r: 21, gold: [40, 70], tint: { c: '#ff5a1a', a: .5 } },
  morrow: { name: 'Morrowthorn, the Burning Heart', lvl: 21, hp: 34000, atk: 82, def: 18, spd: 60, range: 62, rate: 2.3, xp: 3500, boss: 'morrow', draw: 'treant', scale: 1.65, r: 30, light: '#ff9a3a', gold: [300, 420] },
  // Act IV — Glasswater Vale
  drowned: { name: 'Drowned Sentinel', lvl: 22, hp: 850, atk: 66, def: 20, spd: 74, range: 34, rate: 1.9, xp: 240, draw: 'knight', r: 13, gold: [14, 26], tint: { c: '#3ac8b0', a: .5 } },
  tidecaller: { name: 'Tidecaller', lvl: 23, hp: 760, atk: 64, def: 12, spd: 70, range: 210, rate: 2.2, xp: 230, ranged: true, proj: '#6af0ff', chill: true, draw: 'witch', r: 12, light: '#6af0ff', gold: [14, 26], tint: { c: '#40d8e0', a: .55 } },
  glasscrab: { name: 'Glassback Crab', lvl: 24, hp: 950, atk: 62, def: 26, spd: 90, range: 28, rate: 1.4, xp: 250, draw: 'spider', r: 13, gold: [15, 28], tint: { c: '#8af0e0', a: .6 } },
  reefgolem: { name: 'Reef Colossus', lvl: 25, hp: 3700, atk: 104, def: 26, spd: 56, range: 44, rate: 2.4, xp: 1000, elite: true, draw: 'golem', scale: 1.4, r: 22, gold: [50, 80], tint: { c: '#ff8a8a', a: .45 } },
  tide: { name: 'Thalassar, the Drowned Wyrm', lvl: 26, hp: 48000, atk: 104, def: 24, spd: 74, range: 60, rate: 2.2, xp: 5000, boss: 'tide', draw: 'wyrm', scale: 1.35, r: 34, light: '#6af0ff', gold: [420, 560], tint: { c: '#2ad0c0', a: .55 } },
  // Act V — the Starless Crown
  voidwraith: { name: 'Starless Wraith', lvl: 28, hp: 1000, atk: 80, def: 16, spd: 112, range: 30, rate: 1.5, xp: 320, drain: true, draw: 'wraith', r: 12, gold: [18, 32], tint: { c: '#9a6aff', a: .55 } },
  starknight: { name: 'Starfallen Knight', lvl: 29, hp: 1150, atk: 88, def: 30, spd: 78, range: 34, rate: 1.9, xp: 360, draw: 'knight', r: 13, gold: [20, 34], tint: { c: '#2a1840', a: .5 } },
  umbral: { name: 'Umbral Archer', lvl: 29, hp: 900, atk: 84, def: 16, spd: 82, range: 220, rate: 2.1, xp: 340, ranged: true, proj: '#c08aff', draw: 'archer', r: 11, gold: [18, 32], tint: { c: '#6a3aa8', a: .5 } },
  voidcolossus: { name: 'Void Colossus', lvl: 30, hp: 4500, atk: 124, def: 32, spd: 56, range: 44, rate: 2.4, xp: 1400, elite: true, draw: 'golem', scale: 1.45, r: 23, light: '#b07cff', gold: [60, 90], tint: { c: '#5a2a9a', a: .6 } },
  sovereign: { name: 'Nyxara, the Hollow Sovereign', lvl: 32, hp: 70000, atk: 120, def: 28, spd: 82, range: 60, rate: 2.1, xp: 10000, boss: 'sovereign', draw: 'king', scale: 1.5, r: 30, light: '#c58aff', gold: [700, 900], tint: { c: '#3a1460', a: .45 } },
});
Object.assign(BEACON_BOSS, { b5: 'morrow', b6: 'tide', b7: 'sovereign' });
Object.assign(NPCS, {
  brannoc: { name: 'Elder Brannoc', title: 'Warden of the Old Wood', look: { robe: '#4a5a2a', hair: '#8a7a5a', skin: '#c89a6a', beard: true, hood: '#3a4a22', staff: true } },
  ysolde: { name: 'Captain Ysolde', title: 'Last Ship of the Lantern Fleet', look: { robe: '#2a4a6a', hair: '#d8b070', skin: '#e0b896' } },
  maelis: { name: 'Seer Maelis', title: 'Last of the Starwatch', look: { robe: '#3a2a5a', hair: '#e8e8f0', skin: '#d9b08c', hood: '#2a1a40', staff: true } },
});
Object.assign(NPC_TALK, {
  brannoc: ['The trees here are older than Lanternhold. They remember the first flame. Some of them remember it too well.', 'Burning without fire. That is the Hollow\'s way. It takes what a thing loves and makes it hunger.', 'Walk softly near the Heartgrove. Morrowthorn was my friend, once.'],
  ysolde: ['Glasswater was a harbour city. The sea came in one night and never left.', 'My ship is the only one that still flies the lantern. Fleet of one. Very exclusive.', 'If you hear bells under the water, run. The drowned ring them when they are hungry.'],
  maelis: ['The Starwatch counted every star over Velmara for three hundred years. Then one night we had nothing left to count.', 'The Sovereign is not a creature. It is the dark between your lanterns, given a will.', 'You two carry more light than you know. I can see it from here.'],
});
QUESTS.push(
  // ---- Act III: Emberwood ----
  { id: 'q17', name: 'Smoke on the West Road', giver: 'maren', turnin: 'brannoc', pre: ['q16'], zone: 'Emberwood', ch: 3,
    text: 'The forge burns and the north is safe, but smoke rises from the Emberwood beyond the west gate. The leaves are burning without fire. The shadow that wore the Cold Crown has gone west. Find Elder Brannoc at the forest edge.',
    obj: [{ t: 'visit', zone: 'emberwood', n: 1, label: 'Reach the Emberwood' }], xp: 800, gold: 60, potions: 3,
    done: 'Lanternhold sends its two brightest, I see. Good. The wood needs both of you.' },
  { id: 'q18', name: 'Hounds of Cinder', giver: 'brannoc', pre: ['q17'], zone: 'Emberwood', ch: 3,
    text: 'The wolves of this wood used to sleep under the oaks. Now their fur smoulders and they hunt anything green. Put down eight of them before they burn the eastern groves.',
    obj: [{ t: 'kill', e: ['cinderhound'], n: 8, label: 'Cinderhounds slain' }], xp: 1500, gold: 90, done: 'The eastern groves can breathe again. Thank you.' },
  { id: 'q19', name: 'Heartwood Seeds', giver: 'brannoc', pre: ['q17'], zone: 'Emberwood', ch: 3,
    text: 'The great trees drop sap-gems when they are dying, the way a hearth drops its last embers. Gather six before the Hollow takes them. With them I can replant what we lose.',
    obj: [{ t: 'collect', item: 'sapgem', n: 6, label: 'Sap-gems gathered' }], xp: 1500, gold: 80, potions: 4, done: 'Warm still. These will grow. Everything grows back, if someone cares enough.' },
  { id: 'q20', name: 'The Ashen Choir', giver: 'brannoc', pre: ['q18'], zone: 'Emberwood', ch: 3,
    text: 'Ash Sprites and Ember-Hollowed Knights gather in the clearings and sing the fire deeper into the roots. Silence eight of them.',
    obj: [{ t: 'kill', e: ['ashsprite', 'emberknight'], n: 8, label: 'Choir silenced' }], xp: 1800, gold: 110, item: 2, done: 'Listen. Birds. I had forgotten the wood had birds.' },
  { id: 'q21', name: 'Brutes at the Heartgrove', giver: 'brannoc', pre: ['q19'], zone: 'Emberwood', ch: 3,
    text: 'Two Cinder Brutes guard the old gate of the Heartgrove. The gate is grown from living wood and will open for me only when they fall.',
    obj: [{ t: 'kill', e: ['cinderbrute'], n: 2, label: 'Cinder Brutes felled' }], xp: 2000, gold: 120, item: 2, done: 'The gate remembers me. It is opening. Go, and be gentle with him if you can.' },
  { id: 'q22', name: 'The Burning Heart', giver: 'brannoc', pre: ['q20', 'q21'], zone: 'Emberwood', ch: 3,
    text: 'Morrowthorn guarded the Heartgrove Lantern for a thousand years. The shadow found him lonely and filled him with fire. Free him, relight the Heartgrove Lantern, and come back to me.',
    obj: [{ t: 'boss', e: 'morrow', n: 1, label: 'Morrowthorn freed' }, { t: 'beacon', id: 'b5', n: 1, label: 'The Heartgrove Lantern relit' }], xp: 3500, gold: 300, item: 3,
    done: 'I felt him go. He was smiling, I think. The shadow ran west again, to the drowned vale. Captain Ysolde holds the last ship there.' },
  // ---- Act IV: Glasswater Vale ----
  { id: 'q23', name: 'Down to the Water', giver: 'brannoc', turnin: 'ysolde', pre: ['q22'], zone: 'Glasswater Vale', ch: 4,
    text: 'Past the western roots the land falls into Glasswater Vale, where a whole city sleeps under the sea. Captain Ysolde keeps the last lantern ship moored on the broken bridge. Find her.',
    obj: [{ t: 'visit', zone: 'glasswater', n: 1, label: 'Reach Glasswater Vale' }], xp: 1000, gold: 80, potions: 3,
    done: 'Brannoc\'s wood smoke came over the hills this morning, and then it stopped. That was you? Welcome aboard. What is left of it.' },
  { id: 'q24', name: 'Bells Under the Water', giver: 'ysolde', pre: ['q23'], zone: 'Glasswater Vale', ch: 4,
    text: 'The Drowned Sentinels were the harbour watch. They still walk their rounds, only now they drag people under. Lay eight of them to rest.',
    obj: [{ t: 'kill', e: ['drowned'], n: 8, label: 'Drowned Sentinels at rest' }], xp: 2000, gold: 120, done: 'The bells went quiet. First time in a year.' },
  { id: 'q25', name: 'Tide Pearls', giver: 'ysolde', pre: ['q23'], zone: 'Glasswater Vale', ch: 4,
    text: 'The old harbour lamps burned on tide pearls. There are still some along the shore, if the crabs have not swallowed them. Six would light my ship for a month.',
    obj: [{ t: 'collect', item: 'pearl', n: 6, label: 'Tide pearls found' }], xp: 2000, gold: 110, potions: 4, done: 'Look at that glow. My ship has not been this bright since the fleet sailed.' },
  { id: 'q26', name: 'The Calling Tide', giver: 'ysolde', pre: ['q24'], zone: 'Glasswater Vale', ch: 4,
    text: 'Tidecallers sing on the flooded towers and the Glassback Crabs come running. Every song raises the water an inch. Silence eight of them.',
    obj: [{ t: 'kill', e: ['tidecaller', 'glasscrab'], n: 8, label: 'Tide silenced' }], xp: 2400, gold: 140, item: 2, done: 'The water dropped a hand\'s width. You can see the old street signs now.' },
  { id: 'q27', name: 'Wardens of the Cathedral', giver: 'ysolde', pre: ['q25'], zone: 'Glasswater Vale', ch: 4,
    text: 'Two Reef Colossi guard the Drowned Cathedral where the Tidelight sits. The sea gate will not move while they stand.',
    obj: [{ t: 'kill', e: ['reefgolem'], n: 2, label: 'Reef Colossi broken' }], xp: 2600, gold: 150, item: 2, done: 'The sea gate is rising. Whatever waits in there is waiting for you.' },
  { id: 'q28', name: 'The Drowned Wyrm', giver: 'ysolde', pre: ['q26', 'q27'], zone: 'Glasswater Vale', ch: 4,
    text: 'Thalassar was Vyrmhal\'s sister. Where he took the cold, she took the sea. The shadow is coiled around her heart. End her, relight the Tidelight and come back to the ship.',
    obj: [{ t: 'boss', e: 'tide', n: 1, label: 'Thalassar slain' }, { t: 'beacon', id: 'b6', n: 1, label: 'The Tidelight relit' }], xp: 4500, gold: 400, item: 3,
    done: 'The tide is going out. All of it. There is one place left where the dark can hide: north, past the vale, where the stars used to be. The Starwatch keeps a seer there. Maelis.' },
  // ---- Act V: the Starless Crown ----
  { id: 'q29', name: 'Where the Stars Went', giver: 'ysolde', turnin: 'maelis', pre: ['q28'], zone: 'The Starless Crown', ch: 5,
    text: 'North of the vale the road climbs into the Starless Crown, the old observatory of the Starwatch. Seer Maelis is the last of them. She has been waiting for someone carrying the First Lantern.',
    obj: [{ t: 'visit', zone: 'starless', n: 1, label: 'Reach the Starless Crown' }], xp: 1500, gold: 100, potions: 4,
    done: 'There you are. I saw your light coming up the road for three nights. You are later than the stars said, but not by much.' },
  { id: 'q30', name: 'Wraiths of the Watch', giver: 'maelis', pre: ['q29'], zone: 'The Starless Crown', ch: 5,
    text: 'My brothers and sisters of the Starwatch drift through the halls as Starless Wraiths. They drink warmth from anything living. Give eight of them peace.',
    obj: [{ t: 'kill', e: ['voidwraith'], n: 8, label: 'Wraiths given peace' }], xp: 3000, gold: 160, done: 'I knew some of their names. Thank you for being quick.' },
  { id: 'q31', name: 'Fallen Starlight', giver: 'maelis', pre: ['q29'], zone: 'The Starless Crown', ch: 5,
    text: 'When the stars went out, pieces of them fell here as star-shards. Each still holds a little light. Bring me six and I can show you the Sovereign\'s weakness.',
    obj: [{ t: 'collect', item: 'starshard', n: 6, label: 'Star-shards gathered' }], xp: 3000, gold: 150, potions: 5,
    done: 'There. Look in the shards. The Sovereign fears one thing: two lights burning as one. You already know how to do that.' },
  { id: 'q32', name: 'The Fallen Host', giver: 'maelis', pre: ['q30'], zone: 'The Starless Crown', ch: 5,
    text: 'Starfallen Knights and Umbral Archers hold the terraces below the throne. Break their line: eight of them.',
    obj: [{ t: 'kill', e: ['starknight', 'umbral'], n: 8, label: 'Fallen host broken' }], xp: 3500, gold: 180, item: 3, done: 'The terraces are open. One gate left.' },
  { id: 'q33', name: 'The Throne Gate', giver: 'maelis', pre: ['q31'], zone: 'The Starless Crown', ch: 5,
    text: 'Two Void Colossi stand before the throne gate. They were carved to hold the sky up. Now they hold the dark in.',
    obj: [{ t: 'kill', e: ['voidcolossus'], n: 2, label: 'Void Colossi toppled' }], xp: 4000, gold: 200, item: 3, done: 'The gate is open. Whatever you two have, take all of it with you.' },
  { id: 'q34', name: 'The Last Lantern', giver: 'maelis', pre: ['q32', 'q33'], zone: 'The Starless Crown', ch: 5,
    text: 'Nyxara, the Hollow Sovereign, waits on the throne of the Starwatch. Every lantern you relit pushed the dark here, into one place. End it, and light the First Lantern under the open sky.',
    obj: [{ t: 'boss', e: 'sovereign', n: 1, label: 'The Hollow Sovereign defeated' }, { t: 'beacon', id: 'b7', n: 1, label: 'The First Lantern raised' }], xp: 6000, gold: 600, item: 3, done: 'end', final: true },
);
Object.assign(BANTER, {
  ch3: [['handan', 'Do you smell that? Smoke, from the west road.'], ['orhun', 'The Emberwood. Maren says nobody goes there any more.'], ['handan', 'Then somebody should. Let us talk to her.']],
  'Emberwood': [['orhun', 'The leaves are burning, but nothing is on fire.'], ['handan', 'It is the Hollow. It wears the forest like a cloak.'], ['orhun', 'Stay close. I do not like the way those trees are looking at us.']],
  morrow: [['morrow', 'Little lanterns... my roots remember light. They remember it hurting.'], ['handan', 'You were a guardian once, like the King. Let us end this gently.'], ['orhun', 'Gently. Right. Watch the ember rain!']],
  b5: [['handan', 'The Heartgrove Lantern. It smells like spring.'], ['orhun', 'Brannoc will want to hear it from us.']],
  'Glasswater Vale': [['handan', 'A whole city under the water. Look at the spires.'], ['orhun', 'Watch your step. I am not fishing you out of a lake.'], ['handan', 'You would, though.'], ['orhun', '...I would.']],
  tide: [['tide', 'The deep keeps everything it takes. It will keep you too.'], ['orhun', 'Not today.'], ['handan', 'Get off the surge line when it lights up!']],
  b6: [['handan', 'The Tidelight. One dark lantern left in the whole world.'], ['orhun', 'One. Then we go home.']],
  'The Starless Crown': [['handan', 'No stars. Not one.'], ['orhun', 'Then we brought our own.'], ['handan', 'That was almost poetic.'], ['orhun', 'Do not tell anyone.']],
  sovereign: [['sovereign', 'I am the dark between every lantern you lit. Every flame you kindled only made my shadow longer.'], ['handan', 'Then we will burn until there is no shadow left.'], ['orhun', 'Together. Like always.']],
  sovereign3: [['handan', 'Orhun, the pendant... it is answering! It wants both of us!'], ['orhun', 'Then take my hand. Lanternburst, together!']],
});
ITEM_NAMES.suf.push(' of the Emberwood', ' of Glasswater', ' of the Starwatch');
TRAVEL_ORDER.push('emberwood', 'glasswater', 'starless');
Object.assign(BEACON_ZONE_NAME, { b5: 'the Emberwood', b6: 'Glasswater', b7: 'the Starless Crown' });
Object.assign(PAL, {
  autumn: { grass: ['#4a3a22', '#523f24', '#46361f', '#5a4528'], dg: ['#3a2c1a', '#3f301c', '#352818'], blade: '#8a5a2a', flower: ['#e8a03a', '#d0562a', '#f0d070'], path: ['#6b5538', '#644f34', '#735b3c'], pebble: '#8a7658' },
  ruins: { grass: ['#2e3d3a', '#33433f', '#2a3835', '#36463f'], dg: ['#25332f', '#283631', '#22302b'], blade: '#4a6a5a', flower: ['#9fe0d0', '#e0f0ff'], path: ['#5a5e5a', '#55594f', '#60645e'], pebble: '#7a807a' },
  void: { grass: ['#1e1626', '#221a2c', '#1a1322', '#251c30'], dg: ['#18121f', '#1c1524', '#16101c'], blade: '#4a3a6a', flower: ['#b08aff', '#ffd86a'], path: ['#3a3048', '#352c42', '#3f3450'], pebble: '#5a4a72' },
});

/* ---------- Zones ---------- */
function buildEmberwood() {
  const z = new Zone('emberwood', 'Emberwood', 72, 52, { seed: 101, dark: .55, tint: '#2a1006', style: 'autumn', canopy: 'autumn' });
  z.fill(T.GRASS);
  z.scatter(T.DGRASS, (x, y) => fbm(x * .12, y * .12, 102) > .55);
  z.border(2, T.TREE, [[70, 24, 2, 5], [0, 32, 2, 5]]);
  z.scatter(T.TREE, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && fbm(x * .14, y * .14, 103) > .56);
  z.scatter(T.ROCK, (x, y, t) => t === T.GRASS && hash2(x, y, 104) > .975);
  // the Heartgrove: a walled clearing in the north-west with a living-wood gate
  z.rect(26, 2, 2, 19, T.ROCK); z.rect(2, 19, 26, 2, T.ROCK);
  z.rect(3, 3, 23, 16, T.GRASS);
  z.scatter(T.DGRASS, (x, y, t) => t === T.GRASS && x < 26 && y < 19 && fbm(x * .2, y * .2, 105) > .5);
  z.scatter(T.TREE, (x, y, t) => t !== T.ROCK && x < 26 && y < 19 && Math.hypot(x - 14, y - 10) > 8 && hash2(x, y, 106) > .62);
  z.circle(14, 10, 6.5, T.DGRASS, [T.TREE, T.GRASS]); z.circle(14, 10, 4.2, T.PLAZA);
  z.path([[71, 26], [60, 27], [48, 30], [36, 30], [24, 26], [14, 22], [14, 18]], 3);
  z.path([[36, 30], [30, 40], [12, 36], [0, 34]], 3);
  z.path([[48, 30], [52, 42], [60, 44]], 2);
  z.path([[36, 30], [40, 16], [46, 8]], 2);
  [[60, 27, 4.5], [48, 30, 3.5], [36, 30, 4], [30, 40, 4], [12, 36, 4], [52, 42, 3.5], [46, 8, 4.5], [40, 16, 3.5], [22, 26, 3.5], [14, 23, 3.5]].forEach(([x, y, r]) => z.circle(x, y, r, T.GRASS, [T.TREE, T.ROCK, T.DGRASS]));
  for (let x = 12; x <= 16; x++) { z.set(x, 19, T.GATE); z.set(x, 20, T.PATH); }
  z.set(11, 19, T.ROCK); z.set(17, 19, T.ROCK);
  z.beacons.push({ id: 'b5', x: 14, y: 8 });
  [[9, 6], [19, 6], [9, 13], [19, 13]].forEach(([x, y]) => z.decor.push({ type: 'brazier', x, y }));
  [[60, 24], [48, 27], [36, 27], [24, 23], [11, 23], [17, 23]].forEach(([x, y]) => z.lantern(x, y, 'b5'));
  z.decor.push({ type: 'campfire', x: 61, y: 29 }, { type: 'tent', x: 63, y: 25 }, { type: 'tent', x: 56, y: 31 });
  z.lantern(56, 26); z.lantern(65, 30);
  z.npcs.push({ id: 'brannoc', x: 59.5, y: 28.4 });
  const S = (type, x, y) => z.spawns.push({ type, x, y });
  S('cinderhound', 48, 33); S('cinderhound', 50, 32); S('cinderhound', 46, 32);
  S('cinderhound', 30, 42); S('cinderhound', 32, 40); S('cinderhound', 28, 39);
  S('cinderhound', 52, 44); S('cinderhound', 54, 42); S('cinderhound', 12, 38);
  S('ashsprite', 36, 32); S('ashsprite', 40, 17); S('ashsprite', 42, 15); S('ashsprite', 45, 9); S('ashsprite', 47, 10); S('ashsprite', 22, 28);
  S('emberknight', 24, 25); S('emberknight', 12, 34); S('emberknight', 14, 35); S('emberknight', 44, 7); S('emberknight', 38, 29);
  S('cinderbrute', 12, 23); S('cinderbrute', 17, 23);
  S('morrow', 14, 12);
  const r = mulberry32(107);
  for (let i = 0; i < 7; i++) { const [x, y] = z.randomOpen(r, 30, 22, 66, 48, [T.GRASS, T.DGRASS]); z.pickups.push({ id: 'sg' + i, item: 'sapgem', x, y }); }
  z.portals.push({ x: 71, y: 24, w: 1, h: 5, to: 'town', entry: 'west', label: 'Lanternhold' });
  z.portals.push({ x: 0, y: 32, w: 1, h: 5, to: 'glasswater', entry: 'east', label: 'Glasswater Vale', req: act3Done, lock: 'Roots have grown over the western path. Brannoc can open it once the Heartgrove is free.' });
  z.entries = { east: [68.5, 26.5], west: [2.8, 34.5] };
  z.waystone = { x: 63, y: 22, need: 'b5' };
  return z;
}
function buildGlasswater() {
  const z = new Zone('glasswater', 'Glasswater Vale', 72, 52, { seed: 131, dark: .55, tint: '#04202a', style: 'ruins', canopy: 'dead', fog: true });
  z.fill(T.GRASS);
  z.scatter(T.DGRASS, (x, y) => fbm(x * .13, y * .13, 132) > .55);
  z.border(2, T.TREE, [[70, 28, 2, 5], [34, 0, 5, 2]]);
  const lake = (cx, cy, rx, ry, s) => { for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) { const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (fbm(x * .3, y * .3, s) - .5) * .5; if (d < 1) z.set(x, y, d < .55 ? T.DEEP : T.WATER); } };
  lake(46, 18, 10, 7, 133); lake(36, 37, 7, 5, 134);
  z.scatter(T.TREE, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && fbm(x * .15, y * .15, 135) > .63);
  // the Drowned Cathedral (south-west) behind a sea gate
  z.rect(26, 30, 2, 20, T.ROCK); z.rect(2, 30, 26, 2, T.ROCK);
  z.rect(3, 32, 23, 17, T.FLOOR);
  z.circle(14, 42, 5.2, T.PLAZA);
  [[6, 35], [22, 35], [6, 46], [22, 46], [9, 40], [19, 40]].forEach(([x, y]) => z.set(x, y, T.ROCK));
  // ruined plazas with pillars
  [[58, 40, 4.5], [20, 14, 4.5], [60, 12, 3.5]].forEach(([x, y, r]) => { z.circle(x, y, r, T.FLOOR, [T.GRASS, T.DGRASS, T.TREE]); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; z.set(Math.round(x + Math.cos(a) * (r + .6)), Math.round(y + Math.sin(a) * (r + .6)), T.ROCK); } });
  z.path([[71, 30], [58, 32], [46, 30], [30, 26], [20, 22], [14, 26], [14, 29]], 3);
  z.path([[46, 30], [46, 12], [36, 6], [36, 0]], 3);
  z.path([[30, 26], [34, 44], [48, 46]], 2);
  z.path([[58, 32], [58, 40]], 2);
  z.path([[20, 22], [20, 14]], 2);
  [[60, 32, 4], [46, 30, 3], [30, 26, 3.5], [20, 22, 3], [14, 27, 3], [48, 46, 3.5], [36, 6, 3.5], [46, 10, 2.5]].forEach(([x, y, r]) => z.circle(x, y, r, T.GRASS, [T.TREE, T.DGRASS]));
  for (let x = 12; x <= 16; x++) { z.set(x, 30, T.GATE); z.set(x, 31, T.FLOOR); }
  z.set(11, 30, T.ROCK); z.set(17, 30, T.ROCK);
  z.beacons.push({ id: 'b6', x: 14, y: 45 });
  [[9, 43], [19, 43], [9, 47], [19, 47]].forEach(([x, y]) => z.decor.push({ type: 'brazier', x, y }));
  [[52, 29], [46, 25], [46, 8], [38, 4], [22, 21], [16, 28]].forEach(([x, y]) => z.lantern(x, y, 'b6'));
  z.decor.push({ type: 'campfire', x: 62, y: 34 }, { type: 'tent', x: 64, y: 29 }, { type: 'tent', x: 56, y: 35 });
  z.lantern(56, 30); z.lantern(65, 35);
  z.npcs.push({ id: 'ysolde', x: 60.5, y: 33.4 });
  const S = (type, x, y) => z.spawns.push({ type, x, y });
  S('drowned', 44, 31); S('drowned', 48, 32); S('drowned', 40, 29); S('drowned', 38, 8); S('drowned', 58, 41); S('drowned', 56, 39); S('drowned', 22, 22); S('drowned', 60, 12);
  S('tidecaller', 47, 11); S('tidecaller', 44, 13); S('tidecaller', 20, 15); S('tidecaller', 22, 13); S('tidecaller', 34, 6);
  S('glasscrab', 30, 23); S('glasscrab', 33, 25); S('glasscrab', 34, 44); S('glasscrab', 37, 46); S('glasscrab', 47, 47);
  S('reefgolem', 12, 27); S('reefgolem', 17, 27);
  S('tide', 14, 40);
  const r = mulberry32(137);
  for (let i = 0; i < 7; i++) { const [x, y] = z.randomOpen(r, 28, 6, 64, 48, [T.GRASS, T.DGRASS]); z.pickups.push({ id: 'pl' + i, item: 'pearl', x, y }); }
  z.portals.push({ x: 71, y: 28, w: 1, h: 5, to: 'emberwood', entry: 'west', label: 'Emberwood' });
  z.portals.push({ x: 34, y: 0, w: 5, h: 1, to: 'starless', entry: 'south', label: 'The Starless Crown', push: [0, 48], req: act4Done, lock: 'A wall of black water stands across the north road. It will fall when the Tidelight burns.' });
  z.entries = { east: [68.5, 30.5], north: [36.5, 2.6] };
  z.waystone = { x: 63, y: 27, need: 'b6' };
  return z;
}
function buildStarless() {
  const z = new Zone('starless', 'The Starless Crown', 72, 52, { seed: 171, dark: .62, tint: '#10041e', style: 'void', canopy: 'dead' });
  z.fill(T.GRASS);
  z.scatter(T.DGRASS, (x, y) => fbm(x * .12, y * .12, 172) > .56);
  z.border(2, T.ROCK, [[34, 50, 5, 2]]);
  // throne terrace (north) behind the throne gate
  z.rect(2, 16, 68, 2, T.ROCK);
  z.rect(3, 3, 66, 13, T.FLOOR);
  z.circle(36, 9, 6.5, T.PLAZA);
  [[26, 5], [46, 5], [26, 13], [46, 13], [20, 9], [52, 9], [12, 6], [60, 6], [12, 12], [60, 12]].forEach(([x, y]) => z.set(x, y, T.ROCK));
  for (let x = 33; x <= 39; x++) { z.set(x, 16, T.GATE); z.set(x, 17, T.PATH); }
  z.path([[36, 51], [36, 44], [30, 36], [38, 28], [36, 20], [36, 18]], 3);
  z.path([[30, 36], [14, 32], [10, 22]], 2);
  z.path([[38, 28], [56, 30], [62, 22]], 2);
  z.path([[36, 44], [54, 44]], 2);
  [[36, 44, 4.5], [30, 36, 3.5], [38, 28, 3.5], [14, 32, 3.5], [10, 22, 3.5], [56, 30, 3.5], [62, 22, 3.5], [54, 44, 3.5], [36, 21, 3.5]].forEach(([x, y, r]) => z.circle(x, y, r, T.FLOOR, [T.GRASS, T.DGRASS]));
  // chasms into the dark
  z.scatter(T.VOID, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && y > 19 && y < 49 && fbm(x * .09, y * .09, 173) > .64 && Math.hypot(x - 36, y - 44) > 7);
  z.scatter(T.ROCK, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && y > 19 && hash2(x, y, 174) > .97);
  z.beacons.push({ id: 'b7', x: 36, y: 6, first: true });
  z.decor.push({ type: 'throne', x: 35, y: 2 });
  [[30, 6], [42, 6], [30, 12], [42, 12]].forEach(([x, y]) => z.decor.push({ type: 'brazier', x, y }));
  [[36, 40], [31, 34], [38, 25], [35, 19], [14, 30], [56, 28]].forEach(([x, y]) => z.lantern(x, y, 'b7'));
  z.decor.push({ type: 'campfire', x: 38, y: 45 }, { type: 'tent', x: 41, y: 42 }, { type: 'tent', x: 31, y: 42 });
  z.lantern(33, 47); z.lantern(40, 47);
  z.npcs.push({ id: 'maelis', x: 36.5, y: 44.2 });
  const S = (type, x, y) => z.spawns.push({ type, x, y });
  S('voidwraith', 30, 36); S('voidwraith', 32, 34); S('voidwraith', 14, 32); S('voidwraith', 12, 30); S('voidwraith', 56, 30); S('voidwraith', 58, 28); S('voidwraith', 52, 44);
  S('starknight', 38, 28); S('starknight', 36, 24); S('starknight', 62, 22); S('starknight', 10, 22); S('starknight', 55, 45);
  S('umbral', 12, 24); S('umbral', 60, 24); S('umbral', 40, 30); S('umbral', 34, 23);
  S('voidcolossus', 33, 20); S('voidcolossus', 39, 20);
  S('sovereign', 36, 10);
  const r = mulberry32(177);
  for (let i = 0; i < 7; i++) { const [x, y] = z.randomOpen(r, 6, 20, 66, 40, [T.GRASS, T.DGRASS, T.FLOOR]); z.pickups.push({ id: 'ss' + i, item: 'starshard', x, y }); }
  z.portals.push({ x: 34, y: 51, w: 5, h: 1, to: 'glasswater', entry: 'north', label: 'Glasswater Vale', push: [0, -48] });
  z.entries = { south: [36.5, 48.6] };
  z.waystone = { x: 32, y: 46, need: 'b7' };
  return z;
}
const _initZones4 = initZones;
initZones = function () {
  _initZones4();
  ZONES.emberwood = buildEmberwood(); ZONES.glasswater = buildGlasswater(); ZONES.starless = buildStarless();
  setupActs3D();
};
function setupActs3D() {
  if (typeof TCOL === 'undefined') return;
  Object.assign(TCOL, {
    autumn: { [T.GRASS]: '#6a5228', [T.DGRASS]: '#5a4322', [T.PATH]: '#7a6444', [T.PLAZA]: '#6a6058', [T.TREE]: '#5a4322', [T.ROCK]: '#6a5228', [T.GATE]: '#7a6444', [T.WATER]: '#24384a', [T.DEEP]: '#18283a' },
    ruins: { [T.GRASS]: '#3d524c', [T.DGRASS]: '#33463f', [T.PATH]: '#6a6e68', [T.FLOOR]: '#56606a', [T.PLAZA]: '#626c74', [T.WATER]: '#1c3a44', [T.DEEP]: '#12303a', [T.BRIDGE]: '#1c3a44', [T.ROCK]: '#3d524c', [T.TREE]: '#33463f', [T.GATE]: '#56606a' },
    void: { [T.GRASS]: '#2a2036', [T.DGRASS]: '#221a2e', [T.FLOOR]: '#383046', [T.PATH]: '#433a54', [T.PLAZA]: '#4a4060', [T.ROCK]: '#2a2036', [T.VOID]: '#040208', [T.GATE]: '#433a54', [T.TREE]: '#221a2e' },
  });
  Object.assign(AMB, {
    emberwood: { fog: 0x2a160c, near: 18, far: 46, sky: 0xd0905a, gnd: 0x2a1a10, hI: .64, moon: 0xffc890, mI: .5, exp: 1.2 },
    glasswater: { fog: 0x0a1e28, near: 14, far: 40, sky: 0x4a8898, gnd: 0x0c1a18, hI: .5, moon: 0x98d8f0, mI: .4, exp: 1.1 },
    starless: { fog: 0x140a24, near: 16, far: 42, sky: 0x8a6ac8, gnd: 0x140c1e, hI: .62, moon: 0xc0a0ff, mI: .42, exp: 1.3 },
  });
}

/* ---------- Gates, pickups, saves, beacons, turn-ins ---------- */
const _gateOpen4 = gateOpenFor;
gateOpenFor = function (id) { if (id === 'emberwood' || id === 'glasswater' || id === 'starless') return !!(G.zgates && G.zgates[id]); return _gateOpen4(id); };
const _pickAct4 = pickupActive;
pickupActive = function (p) { const q = { sapgem: 'q19', pearl: 'q25', starshard: 'q31' }[p.item]; if (q) { const s = G.q[q]; return !!(s && s.st === 'active'); } return _pickAct4(p); };
const _reset4 = resetState; resetState = function () { _reset4(); G.zgates = {}; };
const _load4 = loadState; loadState = function (d) { _load4(d); G.zgates = d.zgates || {}; };
const _ser4 = serialize; serialize = function () { const o = _ser4(); o.zgates = G.zgates || {}; return o; };
const _turnIn4 = turnIn;
turnIn = function (q) {
  _turnIn4(q);
  const g = { q21: ['emberwood', 'The living-wood gate of the Heartgrove opens.'], q27: ['glasswater', 'The sea gate rises. The Drowned Cathedral is open.'], q33: ['starless', 'The throne gate of the Starwatch swings open.'] }[q.id];
  if (g) { G.zgates = G.zgates || {}; G.zgates[g[0]] = true; toast(g[1]); saveGame(true); }
};
const _relight4 = relight;
relight = function (b) {
  if (!['b5', 'b6', 'b7'].includes(b.id)) return _relight4(b);
  G.beacons[b.id] = true; sfx('beacon'); shake(6);
  burstFx((b.x + .5) * TILE, (b.y + .5) * TILE - 20, 120, '#7dffc8', 40);
  burstFx((b.x + .5) * TILE, (b.y + .5) * TILE - 20, 70, '#ffd86a', 30);
  qProgress('beacon', b.id);
  if (b.id === 'b7') { setTimeout(showEnding3, 2500); saveGame(true); return; }
  banner('Beacon relit', b.id === 'b5' ? 'The Emberwood cools at last' : 'The vale remembers the sun');
  const lines = BANTER[b.id]; if (lines) setTimeout(() => playDialog(lines.map(([w, t]) => ({ who: w, text: t }))), 900);
  saveGame(true);
};
const _enter4 = enterZone;
enterZone = function (id, entryKey, pos) {
  _enter4(id, entryKey, pos);
  if (G.mode === 'survivor') return;
  const sub = { emberwood: 'Where the leaves burn without fire', glasswater: 'A harbour city under the sea', starless: 'Where the stars went out' }[id];
  if (sub) banner(ZONES[id].name, sub);
  if (id === 'town' && ch2Done() && !G.seenBanter.ch3 && !G.q.q17) { G.seenBanter.ch3 = true; setTimeout(() => playDialog(BANTER.ch3.map(([w, t]) => ({ who: w, text: t }))), 900); }
};
const _qp4 = qProgress;
qProgress = function (type, key) { _qp4(type, key); if (type === 'beacon' || type === 'boss') renderTracker(); };
const _lb4 = lanternburst;
lanternburst = function (who) {
  const ready = G.gauge >= 100; _lb4(who);
  if (!ready || G.mode === 'survivor') return;
  const c = who || ctrlHero();
  for (const f of G.foes) if (!f.dead && f.type === 'sovereign' && f.bs.p3 && dist(f, c) < 7 * TILE) { dealDamage(P.handan, f, f.maxHp * .1, { noCrit: true, threat: .5 }); floatText(f.x, f.y - 110, 'The First Lantern burns!', '#fff2b0', 1.4); svHearts(c.x, c.y - 40, 6); }
};
function svHearts(x, y, n) { for (let i = 0; i < n; i++) G.fx.push({ k: 'heart', x: x + rnd(-30, 30), y: y + rnd(-14, 14), t: -i * .12, dur: 1.4, s: 1 + Math.random() * .4 }); }

/* ---------- Boss mechanics ---------- */
const _bossTick4 = bossTick;
bossTick = function (f, tgt, dt) {
  const fn = { morrow: morrowTick, tide: tideTick, sovereign: sovereignTick }[f.type];
  if (!fn) return _bossTick4(f, tgt, dt);
  const b = f.bs;
  if (b.cast) { b.cast.t -= dt; f.moving = false; if (b.cast.t <= 0) { const c = b.cast; b.cast = null; c.end && c.end(); } return true; }
  return fn(f, tgt, dt, b, f.hp / f.maxHp);
};
const rootH = (h, name, col, dur) => { if (h.hero) addBuff(h, { id: 'root', name, dur, mods: { root: true }, col, debuff: true }); };
function morrowTick(f, tgt, dt, b, hpP) {
  if (b.rain === undefined) { b.rain = 5; b.snare = 10; b.wild = 14; }
  b.rain -= dt; b.snare -= dt; b.wild -= dt;
  if (hpP < .7 && !b.a1) { b.a1 = true; floatText(f.x, f.y - 100, 'Ash saplings wake!', '#ffb050', 1.2); for (let i = 0; i < 3; i++) { const [x, y] = arenaPoint(f, 5 * TILE); summon('ashsprite', x, y, P.orhun); } }
  if (hpP < .5 && !b.enr) { b.enr = true; f.enraged = true; floatText(f.x, f.y - 90, 'Morrowthorn\'s heart blazes!', '#ff9a3a', 1.3); sfx('roar'); }
  if (hpP < .35 && !b.a2) { b.a2 = true; floatText(f.x, f.y - 100, 'The hounds answer the fire!', '#ff7a3a', 1.2); for (let i = 0; i < 3; i++) { const [x, y] = arenaPoint(f, 5 * TILE); summon('cinderhound', x, y, P.orhun); } }
  if (b.wild <= 0) { b.wild = b.enr ? 11 : 15; const x = f.x, y = f.y, R = 3.6 * TILE; tele(x, y, R, 2, null, '#ff6a2a'); b.cast = { name: 'Wildfire', t: 2, dur: 2, end: () => { burstFx(x, y, R, '#ff8a3a', 24); shake(9); sfx('boom'); hitParty(x, y, R, f, f.atk * 2.6); } }; return true; }
  if (b.rain <= 0) {
    b.rain = b.enr ? 6 : 8.5;
    const spots = heroes().filter(h => !h.dead).map(h => [h.x, h.y]); for (let i = 0; i < (b.enr ? 3 : 2); i++) spots.push(arenaPoint(f, 6 * TILE));
    for (const [x, y] of spots) tele(x, y, 1.5 * TILE, 1.6, () => { burstFx(x, y, 1.5 * TILE, '#ffb050', 10); sfx('crit'); hitParty(x, y, 1.5 * TILE, f, f.atk * 1.6); }, '#ff9a3a');
    b.cast = { name: 'Ember Rain', t: 1.1, dur: 1.1 }; return true;
  }
  if (b.snare <= 0) {
    b.snare = 12; const x = tgt.x, y = tgt.y, R = 2.2 * TILE; tele(x, y, R, 1.3, null, '#a8e07a');
    b.cast = { name: 'Root Snare', t: 1.3, dur: 1.3, end: () => { for (const h of partyAlive()) if (Math.hypot(h.x - x, h.y - y) < R + h.r) { dealDamage(f, h, f.atk * 1.1, {}); rootH(h, 'Rooted', '#a8e07a', 2.2); vines(h); } } };
    return true;
  }
  return false;
}
function tideTick(f, tgt, dt, b, hpP) {
  if (b.surge === undefined) { b.surge = 6; b.crash = 11; }
  b.surge -= dt; b.crash -= dt;
  const adds = (list, msg) => { floatText(f.x, f.y - 110, msg, '#8af0ff', 1.2); for (const t of list) { const [x, y] = arenaPoint(f, 5 * TILE); summon(t, x, y, P.orhun); } };
  if (hpP < .75 && !b.a1) { b.a1 = true; adds(['drowned', 'drowned', 'tidecaller'], 'The drowned rise to her call!'); }
  if (hpP < .5 && !b.p2) { b.p2 = true; f.enraged = true; floatText(f.x, f.y - 90, 'The tide rises!', '#6af0ff', 1.3); sfx('roar'); }
  if (hpP < .3 && !b.a2) { b.a2 = true; adds(['glasscrab', 'glasscrab', 'tidecaller'], 'Crabs pour out of the deep!'); }
  if (b.surge <= 0) {
    b.surge = b.p2 ? 7 : 9.5; const a = Math.atan2(tgt.y - f.y, tgt.x - f.x), pts = [];
    for (let k = 1; k <= 6; k++) pts.push([f.x + Math.cos(a) * k * 1.4 * TILE, f.y + Math.sin(a) * k * 1.4 * TILE]);
    for (const [x, y] of pts) tele(x, y, 1.2 * TILE, 1.7, null, '#4ae0e0');
    b.cast = { name: 'Tidal Surge', t: 1.7, dur: 1.7, end: () => { const hit = new Set(); sfx('boom'); shake(7); for (const [x, y] of pts) { burstFx(x, y, 1.2 * TILE, '#8af0ff', 8); for (const h of partyAlive()) if (!hit.has(h) && Math.hypot(h.x - x, h.y - y) < 1.2 * TILE + h.r) { hit.add(h); dealDamage(f, h, f.atk * 2.2, {}); if (h.hero) addBuff(h, { id: 'chill', name: 'Drenched', dur: 3, mods: { speed: .6 }, col: '#6af0ff', debuff: true }); } } } };
    return true;
  }
  if (b.crash <= 0) {
    b.crash = b.p2 ? 8 : 11;
    const spots = heroes().filter(h => !h.dead).map(h => [h.x, h.y]); for (let i = 0; i < (b.p2 ? 5 : 3); i++) spots.push(arenaPoint(f, 6 * TILE));
    for (const [x, y] of spots) tele(x, y, 1.6 * TILE, 1.8, () => { burstFx(x, y, 1.6 * TILE, '#8af0ff', 10); hitParty(x, y, 1.6 * TILE, f, f.atk * 1.7); }, '#4ae0e0');
    b.cast = { name: 'Crashing Waves', t: 1, dur: 1 }; return true;
  }
  return false;
}
function sovereignTick(f, tgt, dt, b, hpP) {
  if (b.cleave === undefined) { b.cleave = 5; b.stars = 9; b.chains = 12; b.collapse = 8; }
  b.cleave -= dt; b.stars -= dt; b.chains -= dt; b.collapse -= dt;
  if (hpP < .66 && !b.p2) {
    b.p2 = true; G.eclipse = true; floatText(f.x, f.y - 110, 'The stars go out.', '#c58aff', 1.5); sfx('tele'); shake(6);
    ['voidwraith', 'voidwraith', 'starknight', 'umbral'].forEach(t => { const [x, y] = arenaPoint(f, 6 * TILE); summon(t, x, y, P.orhun); });
  }
  if (hpP < .33 && !b.p3) {
    b.p3 = true; G.gauge = 100; f.enraged = true; floatText(f.x, f.y - 110, 'The First Lantern answers!', '#fff2b0', 1.5);
    svHearts((P.orhun.x + P.handan.x) / 2, (P.orhun.y + P.handan.y) / 2 - 40, 8);
    playDialog(BANTER.sovereign3.map(([w, t]) => ({ who: w, text: t })));
  }
  if (b.p3 && b.collapse <= 0) { b.collapse = 10; const x = f.x, y = f.y, R = 4 * TILE; tele(x, y, R, 2.2, null, '#8a4ae8'); b.cast = { name: 'Collapse of Night', t: 2.2, dur: 2.2, end: () => { burstFx(x, y, R, '#c58aff', 26); shake(10); sfx('boom'); hitParty(x, y, R, f, f.atk * 2.8); } }; return true; }
  if (b.cleave <= 0) { b.cleave = b.p2 ? 6 : 7.5; const x = tgt.x, y = tgt.y, R = 2.4 * TILE; tele(x, y, R, 1.4); b.cast = { name: 'Starless Cleave', t: 1.4, dur: 1.4, end: () => { f.swing = 1; sfx('crit'); shake(8); burstFx(x, y, R, '#c58aff', 14); hitParty(x, y, R, f, f.atk * 2.6); } }; return true; }
  if (b.stars <= 0) {
    b.stars = b.p2 ? 7 : 9;
    const spots = heroes().filter(h => !h.dead).map(h => [h.x, h.y]); for (let i = 0; i < (b.p3 ? 5 : 3); i++) spots.push(arenaPoint(f, 6 * TILE));
    for (const [x, y] of spots) tele(x, y, 1.5 * TILE, 1.6, () => { burstFx(x, y, 1.5 * TILE, '#e0c0ff', 10); hitParty(x, y, 1.5 * TILE, f, f.atk * 1.8); }, '#e0c0ff');
    b.cast = { name: 'Falling Stars', t: 1, dur: 1 }; return true;
  }
  if (b.p2 && b.chains <= 0) {
    b.chains = 13; floatText(f.x, f.y - 100, 'Shadow Chains! Dodge to break free!', '#c58aff', 1.2);
    for (const h of heroes().filter(h => !h.dead)) { rootH(h, 'Shadow Chains', '#8a4ae8', 2.5); const hx = h.x, hy = h.y; tele(hx, hy, 1.4 * TILE, 2, () => { burstFx(hx, hy, 1.4 * TILE, '#8a4ae8', 10); hitParty(hx, hy, 1.4 * TILE, f, f.atk * 2.2); }, '#8a4ae8'); }
  }
  return false;
}

/* ---------- Final ending ---------- */
function showEnding3() {
  G.ended = true;
  svHearts((P.orhun.x + P.handan.x) / 2, (P.orhun.y + P.handan.y) / 2 - 40, 14);
  playDialog([
    { who: 'narrator', text: 'The First Lantern rises over the Starless Crown. One by one, then all at once, the stars come back to Velmara.' },
    { who: 'maelis', text: 'Three hundred years the Starwatch kept vigil for this night. I am the last of us, and I got to see it.' },
    { who: 'orhun', text: 'Handan. It is over. Actually over.' },
    { who: 'handan', text: 'Then let us not go home right away. Let us walk the Ember Road one more time. Slowly.' },
    { who: 'orhun', text: 'Slowly. Together. That was always the plan.' },
  ], () => {
    const w = $('ending'); w.hidden = false;
    w.innerHTML = `<h2 style="justify-content:center">The stars return</h2>
      <p>Orhun and Handan broke Nyxara, the Hollow Sovereign, and raised the First Lantern under an open sky. Every beacon on the Ember Road burns, and the stars over Velmara are back where they belong.</p>
      <p style="color:#9a978e">Level ${G.level} · ${G.kills} foes defeated · ${G.gold} gold carried</p>
      <p style="color:#cfc8b6;font-size:14px">The road is yours: keep exploring and levelling to 50, or test yourselves in Lantern Dreams from the title screen.</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button class="btn primary" id="endStay">Keep exploring</button><button class="btn" id="endNew">Start a new journey</button></div>`;
    $('endStay').onclick = () => { w.hidden = true; };
    $('endNew').onclick = () => { w.hidden = true; newGame(); };
  });
}

/* ---------- Art: autumn canopy and the Ember Treant ---------- */
const _canopy4 = drawCanopy;
drawCanopy = function (o, cx, cy, kind, a, b) {
  if (kind !== 'autumn') return _canopy4(o, cx, cy, kind, a, b);
  const cols = b > .5 ? ['#5a2410', '#8a3a14', '#b4561c', '#e08a2a'] : ['#4a2a12', '#7a4a16', '#a8701e', '#e0b040'];
  const R = 17 + a * 4;
  o.fillStyle = 'rgba(0,0,0,.25)'; o.beginPath(); o.arc(cx + 2, cy + 4, R, 0, 7); o.fill();
  for (let i = 0; i < 4; i++) { o.fillStyle = cols[i]; for (let k = 0; k < 4; k++) { const ang = k * 1.6 + a * 6 + i, rr = (R - i * 4) * .55; o.beginPath(); o.arc(cx + Math.cos(ang) * rr * .6 - i * 2, cy + Math.sin(ang) * rr * .5 - i * 2.5, R - i * 4.2, 0, 7); o.fill(); } }
};
const _shape4 = drawFoeShape;
drawFoeShape = function (g, e, x, y) {
  if (e.def.draw !== 'treant') return _shape4(g, e, x, y);
  const t = e.t || 0, sc = e.def.scale || 1, f = e.face || 1, sw = e.swing || 0;
  g.save(); g.translate(x, y); g.scale(sc * f, sc);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 2, 28, 8, 0, 0, 7); g.fill();
  g.fillStyle = '#3a2416';
  for (const [rx, rw] of [[-18, 10], [-6, 8], [8, 9], [18, 10]]) { g.beginPath(); g.moveTo(rx - rw / 2, 2); g.lineTo(rx * .4, -14); g.lineTo(rx + rw / 2, 2); g.closePath(); g.fill(); }
  g.fillStyle = '#4a3020'; g.fillRect(-11, -50, 22, 50);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(4, -50, 7, 50);
  g.strokeStyle = '#2a180e'; g.lineWidth = 1.5; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-7 + i * 4, -46); g.lineTo(-8 + i * 4 + Math.sin(i) * 2, -6); g.stroke(); }
  g.strokeStyle = '#3e2818'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-8, -40); g.lineTo(-28, -56 + Math.sin(t * 2) * 2); g.stroke();
  g.beginPath(); g.moveTo(8, -40); g.lineTo(30, -54 + sw * 22); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(-24, -52); g.lineTo(-34, -60); g.moveTo(26, -50 + sw * 20); g.lineTo(36, -58 + sw * 24); g.stroke();
  for (const [cx2, cy2, r, c] of [[0, -66, 22, '#8a3412'], [-15, -60, 14, '#b4561c'], [15, -62, 15, '#d0702a'], [0, -78, 12, '#e0a040'], [-8, -72, 9, '#f0c060']]) { g.fillStyle = c; g.beginPath(); g.arc(cx2, cy2, r, 0, 7); g.fill(); }
  g.fillStyle = '#ffd27a'; g.shadowColor = '#ff9a3a'; g.shadowBlur = 8; g.fillRect(-6, -36, 4, 3); g.fillRect(2, -36, 4, 3); g.shadowBlur = 0;
  g.fillStyle = '#1a0e08'; g.fillRect(-5, -28, 10, 3);
  for (let i = 0; i < 4; i++) { const u = (t * .6 + i * .25) % 1; g.globalAlpha = 1 - u; g.fillStyle = i % 2 ? '#ffb050' : '#ff7a2a'; g.fillRect(-16 + i * 10 + Math.sin(t * 3 + i) * 4, -80 - u * 30, 3, 3); }
  g.restore();
};
if (typeof makeFoe3D === 'function') {
  const _mf4 = makeFoe3D;
  makeFoe3D = function (f) { return f.def && f.def.draw === 'treant' ? makeTreant3D(f) : _mf4(f); };
}
function makeTreant3D(f) {
  const d = f.def, sc = d.scale || 1;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mats = [], M = (c, o = {}) => { const m = uMat(c, o); mats.push(m); return m; };
  const bark = M('#4a3020', { roughness: .95 }), dark = M('#2e1c10', { roughness: 1 });
  mesh(gCyl(.3, .45, 1.6, 8), bark, 0, .95, 0, body);
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const r = mesh(gCone(.12, .6, 5), dark, Math.cos(a) * .38, .18, Math.sin(a) * .38, body); r.rotation.z = Math.cos(a) * 1.1; r.rotation.x = -Math.sin(a) * 1.1; }
  const legs = [];
  for (const sx of [-1, 1]) { const g = new THREE.Group(); g.position.set(sx * .2, .45, 0); body.add(g); mesh(gCyl(.12, .16, .5, 6), dark, 0, -.25, 0, g); legs.push(g); }
  const armL = new THREE.Group(); armL.position.set(-.32, 1.55, 0); body.add(armL); const al = mesh(gCyl(.07, .12, 1, 6), bark, 0, -.4, 0, armL); al.rotation.z = -.5;
  const arm = new THREE.Group(); arm.position.set(.32, 1.55, 0); body.add(arm); const ar = mesh(gCyl(.07, .12, 1, 6), bark, 0, -.4, .1, arm); ar.rotation.z = .5;
  armL.rotation.z = .8; arm.rotation.z = -.8;
  const leafCols = ['#9a3a12', '#c8561c', '#e07a2a', '#f0b040'];
  [[0, 2.1, 0, .62], [-.42, 1.95, .1, .45], [.44, 2, -.05, .48], [0, 2.55, 0, .4], [.1, 2.3, .35, .35], [-.2, 2.35, -.3, .38]].forEach(([x, y, z, r], i) => mesh(gIco(r, 1), M(leafCols[i % 4], { flatShading: true, roughness: .8, emissive: 0x3a1004, emissiveIntensity: .5 }), x, y, z, body));
  const em = M('#ffd27a', { emissive: 0xff9a3a, emissiveIntensity: 2.2 });
  for (const sx of [-1, 1]) mesh(gSph(.05, 6, 4), em, sx * .1, 1.4, .33, body).castShadow = false;
  glow(0xff8a3a, 2.4, body, 2.2, .55);
  root.scale.setScalar(sc);
  return { g: root, body, legs, mats, kind: 'foe', yaw: 0, h: 2.8 * sc, arm };
}
if (typeof build3DZone === 'function') {
  const _b3z4 = build3DZone;
  build3DZone = function (z) {
    _b3z4(z);
    const pal = { autumn: { crown: ['#b5531c', '#d07a2a', '#9a3412', '#e0a040', '#7a2a10'], tuft: ['#8a5a2a', '#a06a30', '#6a4a22'], flower: ['#e8a03a', '#f0d070', '#d0562a'] },
      void: { crown: ['#3a2456', '#2a1a40', '#4a2a6a'], tuft: ['#4a3a6a', '#3a2c55', '#5a3a7a'], flower: ['#b08aff', '#ffd86a'] },
      ruins: { tuft: ['#3a5a4a', '#46685a', '#4a6a6a'], flower: ['#9fe0d0', '#e0f0ff'] } }[z.style];
    if (!pal || !z.g3) return;
    const C = new THREE.Color(), gc = gIco(.6, 1), gp = gCone(.55, .85, 7), gt = gCone(.07, .25, 3), gf = gSph(.045, 6, 4);
    z.g3.root.traverse(o => {
      if (!o.isInstancedMesh || !o.instanceColor) return;
      const list = o.geometry === gc || (o.geometry === gp && z.style === 'autumn') ? pal.crown : o.geometry === gt ? pal.tuft : o.geometry === gf ? pal.flower : null; if (!list) return;
      for (let i = 0; i < o.count; i++) { C.set(list[(i * 7 + (i >> 2)) % list.length]); o.setColorAt(i, C); }
      o.instanceColor.needsUpdate = true;
    });
  };
}

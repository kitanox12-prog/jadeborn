/* ===================== WORLD ===================== */
const T = { GRASS: 0, PATH: 1, WATER: 2, WALL: 3, FLOOR: 4, TREE: 5, MARSH: 6, BRIDGE: 7, ROCK: 8, DGRASS: 9, ROOF: 10, PLAZA: 11, VOID: 12, GATE: 13, DEEP: 14, ICE: 15 };
const SOLID = new Set([T.WATER, T.WALL, T.TREE, T.ROCK, T.ROOF, T.VOID, T.DEEP]);
const MM_COL = { 15: '#9cc4dc', 0: '#2f4a2a', 1: '#7a6244', 2: '#24506e', 3: '#4a4652', 4: '#34323c', 5: '#1a3018', 6: '#33452f', 7: '#7a5a34', 8: '#5a5a60', 9: '#263c26', 10: '#6a3028', 11: '#5a5862', 12: '#000', 13: '#9a7a3a', 14: '#163448' };

class Zone {
  constructor(id, name, w, h, opt) {
    Object.assign(this, { id, name, w, h }, opt);
    this.g = new Uint8Array(w * h);
    this.decor = []; this.houses = []; this.spawns = []; this.npcs = []; this.portals = []; this.pickups = []; this.beacons = []; this.entries = {};
    this.rng = mulberry32(opt.seed || 1);
  }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? T.VOID : this.g[y * this.w + x]; }
  set(x, y, t) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y * this.w + x] = t; }
  fill(t) { this.g.fill(t); }
  rect(x, y, w, h, t) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, t); }
  circle(cx, cy, r, t, only) { for (let j = Math.floor(cy - r); j <= cy + r; j++) for (let i = Math.floor(cx - r); i <= cx + r; i++) if ((i - cx) ** 2 + (j - cy) ** 2 <= r * r && (only === undefined || only.includes(this.get(i, j)))) this.set(i, j, t); }
  path(pts, width = 3, t = T.PATH, wob = 2.2) {
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let s = 0; s <= n; s++) {
        const u = s / n; const env = Math.sin(u * Math.PI);
        const ox = (vnoise(s * 0.08 + k * 9, 3, this.seed) - .5) * wob * env * 2, oy = (vnoise(s * 0.08 + k * 9, 7, this.seed) - .5) * wob * env * 2;
        const cx = lerp(x0, x1, u) + ox, cy = lerp(y0, y1, u) + oy;
        const r = width / 2;
        for (let j = Math.floor(cy - r); j <= cy + r; j++) for (let i = Math.floor(cx - r); i <= cx + r; i++) {
          if ((i + .5 - cx) ** 2 + (j + .5 - cy) ** 2 > r * r + .3) continue;
          const cur = this.get(i, j);
          if (cur === T.VOID || cur === T.ROOF) continue;
          this.set(i, j, (cur === T.WATER || cur === T.DEEP) ? T.BRIDGE : (cur === T.BRIDGE ? T.BRIDGE : t));
        }
      }
    }
  }
  border(th, t, gaps = []) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (x < th || y < th || x >= this.w - th || y >= this.h - th) {
        if (gaps.some(g => x >= g[0] && x < g[0] + g[2] && y >= g[1] && y < g[1] + g[3])) continue;
        this.set(x, y, t);
      }
    }
  }
  scatter(t, test) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (test(x, y, this.get(x, y))) this.set(x, y, t); }
  solid(x, y) { const t = this.get(x, y); if (t === T.GATE) return !gateOpenFor(this.id); return SOLID.has(t); }
  clearPt(x, y, r = 1) { for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) if (this.solid(i, j)) return false; return true; }
  randomOpen(rng, x0, y0, x1, y1, types = [T.GRASS, T.DGRASS, T.MARSH, T.FLOOR, T.PATH]) {
    for (let k = 0; k < 400; k++) {
      const x = Math.floor(lerp(x0, x1, rng())), y = Math.floor(lerp(y0, y1, rng()));
      if (types.includes(this.get(x, y)) && this.clearPt(x, y, 1)) return [x, y];
    }
    return [Math.floor((x0 + x1) / 2), Math.floor((y0 + y1) / 2)];
  }
  house(x, y, w, h) { this.houses.push({ x, y, w, h }); this.rect(x, y, w, h - 2, T.ROOF); this.rect(x, y + h - 2, w, 2, T.WALL); this.decor.push({ type: 'door', x: x + Math.floor(w / 2), y: y + h - 1 }); this.decor.push({ type: 'window', x: x + 1, y: y + h - 2 }); this.decor.push({ type: 'window', x: x + w - 2, y: y + h - 2 }); }
  lantern(x, y, beacon) { this.decor.push({ type: 'lantern', x, y, beacon }); this.set(x, y, this.get(x, y) === T.TREE ? T.GRASS : this.get(x, y)); }
}

/* ---------- Zone builders ---------- */
function gateOpenFor(id) { return id === 'frostspire' ? !!G.frostGate : !!G.gateOpen; }
function ch1Done() { return !!(G.q.q10 && G.q.q10.st === 'done'); }

function buildTown() {
  const z = new Zone('town', 'Lanternhold', 44, 32, { seed: 11, dark: 0.62, tint: '#0a1028', style: 'town', music: 0, canopy: 'oak' });
  z.fill(T.GRASS);
  z.scatter(T.DGRASS, (x, y) => fbm(x * .15, y * .15, 3) > .55);
  z.border(2, T.TREE, [[42, 14, 2, 5], [0, 14, 2, 5], [20, 30, 4, 2]]);
  z.scatter(T.TREE, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && (x < 4 || x > 39 || y < 4 || y > 27) && hash2(x, y, 5) > .55);
  z.rect(13, 10, 18, 13, T.PLAZA);
  z.path([[30, 16], [43, 16]], 3, T.PATH, 0.4);
  z.path([[13, 16], [0, 16]], 3, T.PATH, 0.6);
  z.path([[22, 22], [22, 31]], 3, T.PATH, 0.6);
  z.path([[22, 11], [22, 0]], 3, T.PATH, 0.3);
  z.house(3, 4, 8, 6); z.house(33, 4, 8, 6); z.house(3, 22, 8, 6); z.house(33, 22, 8, 6); z.house(14, 2, 6, 6); z.house(24, 2, 6, 6);
  z.rect(21, 15, 3, 3, T.WATER); z.decor.push({ type: 'fountain', x: 22, y: 16 });
  [[13, 10], [30, 10], [13, 22], [30, 22], [34, 14], [40, 14], [34, 18], [40, 18], [8, 14], [8, 18], [20, 27], [24, 27], [17, 10], [26, 10]].forEach(([x, y]) => z.lantern(x, y));
  z.decor.push({ type: 'stall', x: 28, y: 20 }, { type: 'herbs', x: 15, y: 20 }, { type: 'banner', x: 19, y: 10 }, { type: 'banner', x: 25, y: 10 });
  z.npcs.push({ id: 'maren', x: 22, y: 12.6 }, { id: 'sela', x: 16, y: 19 }, { id: 'dorrak', x: 28, y: 19 }, { id: 'ayla', x: 25.6, y: 12.4, req: ch1Done });
  z.lantern(20, 3); z.lantern(24, 3);
  z.portals.push({ x: 43, y: 14, w: 1, h: 5, to: 'brightfield', entry: 'west', label: 'Brightfield' });
  z.portals.push({ x: 20, y: 0, w: 4, h: 1, to: 'frostspire', entry: 'south', label: 'Frostspire Pass', push: [0, 48], req: ch1Done, lock: 'Deep snow buries the north road. The way opens once the First Lantern burns again.' });
  z.portals.push({ x: 0, y: 14, w: 1, h: 5, to: 'emberwood', entry: 'east', label: 'Emberwood', req: () => typeof ch2Done === 'function' && ch2Done(), lock: 'Smoke hangs over the west road. Finish what waits at Frostspire first.' });
  z.portals.push({ x: 20, y: 31, w: 4, h: 1, to: 'glade', entry: 'south', label: 'Starlit Glade', push: [0, -48] });
  z.entries = { start: [22, 20], east: [40.5, 16.5], north: [22, 2.6], west: [2.8, 16.5], south: [22, 28.6] };
  z.waystone = { x: 18, y: 13 };
  return z;
}

function buildBrightfield() {
  const z = new Zone('brightfield', 'Brightfield', 72, 52, { seed: 23, dark: 0.42, tint: '#1a1440', style: 'meadow', canopy: 'oak' });
  z.fill(T.GRASS);
  z.scatter(T.DGRASS, (x, y) => fbm(x * .1, y * .1, 4) > .55);
  z.border(2, T.TREE, [[0, 24, 2, 5], [70, 42, 2, 5]]);
  // river
  for (let y = 0; y < z.h; y++) { const cx = 36 + Math.round(4 * Math.sin(y / 7)); for (let x = cx - 1; x <= cx + 1; x++) z.set(x, y, T.WATER); z.set(cx - 2, y, hash2(cx, y, 2) > .5 ? T.WATER : z.get(cx - 2, y)); }
  z.scatter(T.TREE, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && fbm(x * .13, y * .13, 9) > .6);
  z.scatter(T.ROCK, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && hash2(x, y, 31) > .985);
  z.path([[0, 26], [18, 25], [36, 26], [48, 24], [58, 26]], 3);
  z.path([[30, 25], [22, 16], [16, 12]], 3);
  z.path([[30, 27], [24, 36], [18, 41]], 3);
  z.path([[60, 30], [64, 38], [71, 44]], 3);
  z.path([[46, 25], [46, 14], [52, 10]], 2);
  z.path([[44, 27], [46, 38], [44, 42]], 2);
  // clearings
  [[16, 12, 4], [18, 41, 4.5], [10, 34, 3], [46, 14, 3], [44, 40, 4], [28, 18, 3], [52, 10, 3]].forEach(([x, y, r]) => z.circle(x, y, r, T.GRASS, [T.TREE, T.ROCK, T.DGRASS]));
  // shrine arena
  z.circle(61, 26, 8, T.GRASS, [T.TREE, T.ROCK, T.DGRASS, T.WATER]);
  z.circle(61, 26, 5.5, T.PLAZA);
  z.circle(61, 26, 3.5, T.GRASS);
  z.set(65, 26, T.PLAZA);
  z.beacons.push({ id: 'b1', x: 61, y: 26 });
  [[8, 25], [16, 24], [25, 24], [41, 23], [52, 23], [56, 28], [62, 34], [66, 40]].forEach(([x, y]) => z.lantern(x, y, 'b1'));
  z.decor.push({ type: 'statue', x: 57, y: 21 }, { type: 'statue', x: 65, y: 21 }, { type: 'statue', x: 57, y: 31 }, { type: 'statue', x: 65, y: 31 });
  z.scatter(T.GRASS, (x, y, t) => false);
  // spawns
  const S = (type, x, y) => z.spawns.push({ type, x, y });
  S('wolf', 15, 11); S('wolf', 17, 13); S('wolf', 14, 14); S('wolf', 28, 17); S('wolf', 29, 19);
  S('wolf', 46, 13); S('wolf', 48, 15); S('wolf', 52, 9); S('alpha', 44, 40); S('pup', 42, 39); S('pup', 46, 41);
  S('sprite', 18, 40); S('sprite', 20, 42); S('sprite', 16, 43); S('sprite', 10, 33); S('sprite', 11, 35); S('sprite', 24, 35);
  S('wolf', 64, 39); S('wolf', 66, 41);
  S('gnarl', 61, 26);
  const r = mulberry32(77);
  for (let i = 0; i < 8; i++) { const [x, y] = z.randomOpen(r, 6, 6, 66, 48, [T.GRASS, T.DGRASS]); z.pickups.push({ id: 'mp' + i, item: 'moonpetal', x, y }); }
  z.portals.push({ x: 0, y: 23, w: 1, h: 7, to: 'town', entry: 'east', label: 'Lanternhold' });
  z.portals.push({ x: 71, y: 41, w: 1, h: 7, to: 'murkfen', entry: 'west', label: 'Murkfen', req: () => G.q.q4 && (G.q.q4.st === 'done' || G.beacons.b1), lock: 'A wall of Hollow darkness blocks the road. Relight the Brightfield beacon first.' });
  z.entries = { west: [3.5, 26.5], east: [68.5, 44.5] };
  z.waystone = { x: 53, y: 27, need: 'b1' };
  return z;
}

function buildMurkfen() {
  const z = new Zone('murkfen', 'Murkfen', 72, 52, { seed: 41, dark: 0.58, tint: '#06201a', style: 'marsh', canopy: 'dead', fog: true });
  z.fill(T.DGRASS);
  z.scatter(T.MARSH, (x, y) => fbm(x * .11, y * .11, 41) > .48);
  z.scatter(T.WATER, (x, y) => fbm(x * .11, y * .11, 41) > .6);
  z.scatter(T.DEEP, (x, y) => fbm(x * .11, y * .11, 41) > .7);
  z.border(2, T.TREE, [[0, 41, 2, 7], [70, 8, 2, 6]]);
  z.scatter(T.TREE, (x, y, t) => (t === T.DGRASS || t === T.MARSH) && fbm(x * .2, y * .2, 47) > .63);
  z.path([[0, 44], [12, 43], [20, 40], [28, 32], [34, 24], [44, 26], [52, 30]], 3);
  z.path([[20, 40], [14, 26], [12, 15]], 3);
  z.path([[34, 24], [38, 14], [40, 9]], 3);
  z.path([[44, 27], [48, 38], [50, 46]], 3);
  z.path([[52, 29], [56, 20], [60, 13]], 3);
  z.path([[62, 11], [71, 11]], 3);
  [[20, 40, 4], [12, 15, 4], [40, 9, 3.5], [50, 46, 4], [28, 32, 3], [44, 26, 3]].forEach(([x, y, r]) => z.circle(x, y, r, T.DGRASS, [T.TREE, T.WATER, T.DEEP, T.MARSH]));
  z.circle(60, 12, 7.5, T.MARSH, [T.TREE, T.WATER, T.DEEP, T.DGRASS]);
  z.circle(60, 12, 5, T.DGRASS);
  z.circle(60, 12, 2.2, T.PLAZA);
  z.beacons.push({ id: 'b2', x: 60, y: 12 });
  [[8, 42], [17, 37], [27, 30], [36, 22], [46, 28], [54, 25], [58, 17], [66, 10]].forEach(([x, y]) => z.lantern(x, y, 'b2'));
  z.decor.push({ type: 'campfire', x: 21, y: 41 }, { type: 'tent', x: 18, y: 38 });
  z.lantern(23, 39);
  z.npcs.push({ id: 'taner', x: 19.5, y: 41 });
  const S = (type, x, y) => z.spawns.push({ type, x, y });
  S('lurker', 11, 14); S('lurker', 14, 16); S('lurker', 13, 12); S('wisp', 30, 31); S('wisp', 27, 34); S('wisp', 38, 10); S('wisp', 41, 8);
  S('wisp', 36, 23); S('wisp', 46, 25); S('spider', 49, 45); S('spider', 52, 47); S('spider', 48, 39); S('spider', 31, 30);
  S('lurker', 42, 12); S('lurker', 55, 22); S('hulk', 15, 26); S('spider', 56, 18);
  S('witch', 60, 12);
  z.pickups.push({ id: 't1', item: 'token', x: 12, y: 13 }, { id: 't2', item: 'token', x: 51, y: 47 }, { id: 't3', item: 'token', x: 40, y: 8 });
  z.portals.push({ x: 0, y: 41, w: 1, h: 7, to: 'brightfield', entry: 'east', label: 'Brightfield' });
  z.portals.push({ x: 71, y: 8, w: 1, h: 6, to: 'keep', entry: 'west', label: 'Hollow Keep', req: () => !!G.beacons.b2, lock: 'The causeway is drowned in shadow. Relight the Murkfen beacon first.' });
  z.entries = { west: [3.5, 44.5], east: [68.5, 11.5] };
  z.waystone = { x: 15, y: 42, need: 'b2' };
  return z;
}

function buildKeep() {
  const z = new Zone('keep', 'Hollow Keep', 60, 60, { seed: 59, dark: 0.7, tint: '#140a26', style: 'keep', canopy: 'dead' });
  z.fill(T.WALL);
  const R = (x, y, w, h) => z.rect(x, y, w, h, T.FLOOR);
  R(2, 26, 12, 9);           // entry hall
  R(14, 29, 7, 3);           // corridor
  R(20, 20, 21, 21);         // courtyard
  R(29, 14, 3, 7); R(22, 4, 17, 11);      // north wing
  R(29, 40, 3, 7); R(22, 46, 17, 11);     // south wing
  R(40, 29, 5, 3); R(44, 23, 12, 14);     // east barracks
  R(38, 7, 6, 3); R(44, 2, 14, 15);       // throne room
  for (let x = 38; x < 44; x++) for (let y = 7; y < 10; y++) if (x === 41) z.set(x, y, T.GATE);
  z.rect(0, 29, 2, 3, T.FLOOR);
  // courtyard ruins
  z.scatter(T.DGRASS, (x, y, t) => t === T.FLOOR && x > 20 && x < 40 && y > 20 && y < 40 && fbm(x * .3, y * .3, 3) > .55);
  [[24, 24], [36, 24], [24, 36], [36, 36], [30, 30]].forEach(([x, y]) => z.set(x, y, T.ROCK));
  [[47, 5], [54, 5], [47, 13], [54, 13]].forEach(([x, y]) => z.set(x, y, T.ROCK));
  [[26, 26], [34, 26], [26, 34], [34, 34], [5, 27], [11, 27], [5, 33], [11, 33], [24, 6], [36, 6], [24, 54], [36, 54], [46, 25], [53, 25], [46, 34], [53, 34], [45, 4], [56, 4], [45, 15], [56, 15]].forEach(([x, y]) => z.decor.push({ type: 'brazier', x, y }));
  z.beacons.push({ id: 'b3', x: 51, y: 6, first: true });
  z.decor.push({ type: 'throne', x: 51, y: 3 });
  z.npcs.push({ id: 'ayla', x: 8, y: 30 });
  const S = (type, x, y) => z.spawns.push({ type, x, y });
  S('knight', 30, 23); S('knight', 26, 36); S('knight', 30, 9); S('knight', 30, 50); S('knight', 49, 28); S('knight', 52, 32);
  S('archer', 34, 22); S('archer', 22, 30); S('archer', 26, 7); S('archer', 34, 52); S('archer', 54, 26);
  S('wraith', 36, 33); S('wraith', 28, 11); S('wraith', 35, 8); S('wraith', 25, 50); S('wraith', 27, 52); S('wraith', 48, 33);
  S('king', 51, 9);
  z.pickups.push({ id: 's1', item: 'shard', x: 30, y: 5 }, { id: 's2', item: 'shard', x: 30, y: 55 }, { id: 's3', item: 'shard', x: 54, y: 30 });
  z.portals.push({ x: 0, y: 28, w: 1, h: 5, to: 'murkfen', entry: 'east', label: 'Murkfen' });
  z.entries = { west: [3.5, 30.5] };
  z.waystone = { x: 4, y: 27, need: 'b3' };
  return z;
}

function buildFrostspire() {
  const z = new Zone('frostspire', 'Frostspire Pass', 72, 52, { seed: 83, dark: 0.5, tint: '#0a1438', style: 'snow', canopy: 'pine', snow: true });
  z.fill(T.GRASS);
  z.scatter(T.DGRASS, (x, y) => fbm(x * .12, y * .12, 84) > .55);
  z.border(2, T.TREE, [[33, 50, 6, 2]]);
  z.scatter(T.ROCK, (x, y, t) => t !== T.TREE && fbm(x * .16, y * .16, 85) > .66);
  z.scatter(T.TREE, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && fbm(x * .14, y * .14, 86) > .6);
  // frozen lake
  for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) { const d = Math.hypot((x - 19) / 8.5, (y - 25) / 6.2) + (fbm(x * .3, y * .3, 87) - .5) * .5; if (d < 1) z.set(x, y, T.ICE); }
  // the forge plateau, walled off by cliffs with an ice gate
  z.rect(46, 2, 2, 17, T.ROCK); z.rect(46, 17, 24, 2, T.ROCK);
  z.rect(48, 2, 22, 15, T.GRASS);
  z.scatter(T.DGRASS, (x, y, t) => t === T.GRASS && x >= 48 && y < 17 && fbm(x * .2, y * .2, 88) > .5);
  z.scatter(T.ROCK, (x, y, t) => t !== T.ROCK && x >= 48 && y < 17 && Math.hypot(x - 58, y - 9) > 7.5 && hash2(x, y, 89) > .55);
  z.circle(58, 9, 7, T.DGRASS, [T.ROCK, T.TREE, T.GRASS]);
  z.circle(58, 9, 4.5, T.PLAZA);
  // paths
  z.path([[36, 51], [36, 44], [30, 38], [24, 33]], 3);
  z.path([[36, 44], [44, 38], [52, 30], [57, 22], [57, 16]], 3);
  z.path([[24, 33], [16, 16], [12, 10]], 3);
  z.path([[30, 38], [10, 42]], 2);
  z.path([[44, 38], [60, 42]], 2);
  z.path([[57, 16], [58, 12]], 3);
  // clearings
  [[36, 44, 4.5], [12, 10, 4.5], [28, 13, 3.5], [12, 42, 4], [60, 42, 4], [23, 33, 3], [50, 31, 3.5], [57, 22, 4]].forEach(([x, y, r]) => z.circle(x, y, r, T.GRASS, [T.TREE, T.ROCK, T.DGRASS]));
  for (let x = 55; x <= 59; x++) { z.set(x, 17, T.GATE); z.set(x, 18, T.PATH); }
  z.set(54, 17, T.ROCK); z.set(60, 17, T.ROCK);
  z.beacons.push({ id: 'b4', x: 58, y: 6, first: true });
  [[52, 6], [64, 6], [52, 12], [64, 12]].forEach(([x, y]) => z.decor.push({ type: 'brazier', x, y }));
  [[36, 49], [32, 41], [40, 41], [26, 35], [47, 35], [54, 26], [56, 19], [60, 19]].forEach(([x, y]) => z.lantern(x, y, 'b4'));
  z.decor.push({ type: 'campfire', x: 37, y: 45 }, { type: 'tent', x: 39, y: 42 }, { type: 'tent', x: 31, y: 43 });
  z.lantern(34, 46); z.lantern(40, 46);
  z.npcs.push({ id: 'kael', x: 35.5, y: 43.4 });
  const S = (type, x, y) => z.spawns.push({ type, x, y });
  S('frostwolf', 12, 42); S('frostwolf', 14, 43); S('frostwolf', 11, 40);
  S('frostwolf', 60, 42); S('frostwolf', 62, 43); S('frostwolf', 59, 40);
  S('frostwolf', 23, 31); S('frostwolf', 25, 33); S('frostwolf', 50, 30); S('frostwolf', 52, 32);
  S('frostcaller', 12, 10); S('frostcaller', 15, 8); S('rimewraith', 10, 13); S('rimewraith', 14, 12);
  S('frostcaller', 28, 13); S('rimewraith', 30, 11); S('frostcaller', 19, 18); S('rimewraith', 26, 20);
  S('golem', 55, 22); S('golem', 60, 22);
  S('wyrm', 58, 9);
  const r = mulberry32(91);
  for (let i = 0; i < 4; i++) { const [x, y] = z.randomOpen(r, 13, 21, 26, 30, [T.ICE]); z.pickups.push({ id: 'em' + i, item: 'ember', x, y }); }
  for (let i = 4; i < 7; i++) { const [x, y] = z.randomOpen(r, 6, 6, 44, 46, [T.GRASS, T.DGRASS]); z.pickups.push({ id: 'em' + i, item: 'ember', x, y }); }
  z.portals.push({ x: 33, y: 51, w: 6, h: 1, to: 'town', entry: 'north', label: 'Lanternhold', push: [0, -48] });
  z.entries = { south: [36, 48.6] };
  z.waystone = { x: 32, y: 47, need: 'b4' };
  return z;
}

const ZONES = {};
function initZones() { ZONES.town = buildTown(); ZONES.brightfield = buildBrightfield(); ZONES.murkfen = buildMurkfen(); ZONES.keep = buildKeep(); ZONES.frostspire = buildFrostspire(); }

/* ---------- Collision & pathing ---------- */
function circleHitsSolid(z, x, y, r) {
  const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE), y0 = Math.floor((y - r) / TILE), y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!z.solid(tx, ty)) continue;
    const cx = clamp(x, tx * TILE, tx * TILE + TILE), cy = clamp(y, ty * TILE, ty * TILE + TILE);
    if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
  }
  return false;
}
function moveEnt(e, dx, dy) {
  const z = G.zone, r = e.r * 0.8;
  if (dx && !circleHitsSolid(z, e.x + dx, e.y, r)) e.x += dx; else if (dx) e.blockedX = true;
  if (dy && !circleHitsSolid(z, e.x, e.y + dy, r)) e.y += dy; else if (dy) e.blockedY = true;
}
function lineClear(ax, ay, bx, by, r = 6) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 10);
  for (let i = 1; i < n; i++) { const u = i / n; if (circleHitsSolid(G.zone, lerp(ax, bx, u), lerp(ay, by, u), r)) return false; }
  return true;
}
function findPath(ax, ay, bx, by, maxN = 6000) {
  const z = G.zone, w = z.w;
  let sx = Math.floor(ax / TILE), sy = Math.floor(ay / TILE), gx = Math.floor(bx / TILE), gy = Math.floor(by / TILE);
  if (z.solid(gx, gy)) { // nudge goal to a nearby open tile
    let best = null, bd = 1e9;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (!z.solid(gx + i, gy + j)) { const d = i * i + j * j; if (d < bd) { bd = d; best = [gx + i, gy + j]; } }
    if (!best) return null; [gx, gy] = best;
  }
  const prev = new Int32Array(z.w * z.h).fill(-1), start = sy * w + sx, goal = gy * w + gx;
  const q = [start]; prev[start] = start; let n = 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  while (q.length && n < maxN) {
    const cur = q.shift(); n++;
    if (cur === goal) break;
    const cx = cur % w, cy = (cur / w) | 0;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (z.solid(nx, ny)) continue;
      if (dx && dy && (z.solid(cx + dx, cy) || z.solid(cx, cy + dy))) continue;
      const ni = ny * w + nx; if (prev[ni] !== -1) continue;
      prev[ni] = cur; q.push(ni);
    }
  }
  if (prev[goal] === -1) return null;
  const pts = []; let c = goal;
  while (c !== start) { pts.push([(c % w + .5) * TILE, (((c / w) | 0) + .5) * TILE]); c = prev[c]; }
  pts.reverse();
  // string-pull
  const out = []; let ox = ax, oy = ay, i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !lineClear(ox, oy, pts[j][0], pts[j][1], 9)) j--;
    out.push(pts[j]); [ox, oy] = pts[j]; i = j + 1;
  }
  return out;
}

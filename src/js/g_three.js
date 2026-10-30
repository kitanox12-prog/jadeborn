/* ===================== 3D RENDERER (Three.js) =====================
   Replaces the pixel renderer. Simulation stays in pixel space (x,y in px);
   3D space maps X = x / TILE, Z = y / TILE, Y = height in tiles. */
var R3 = null;
var S3 = { frame: 0, dist: 16, ents: new Map(), cur: null, focus: { x: 0, z: 0 } };
var GEO = {}, MATC = {};
function r3() { if (!R3) R3 = init3D(); return R3; }

function geo(key, make) { return GEO[key] || (GEO[key] = make()); }
function gBox(w, h, d) { return geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)); }
function gSph(r, ws = 14, hs = 10) { return geo(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)); }
function gCyl(rt, rb, h, seg = 12, open = false) { return geo(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)); }
function gCap(r, l, seg = 6) { return geo(`k${r},${l},${seg}`, () => new THREE.CapsuleGeometry(r, l, 4, seg * 2)); }
function gCone(r, h, seg = 8) { return geo(`o${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)); }
function gIco(r, d = 0) { return geo(`i${r},${d}`, () => new THREE.IcosahedronGeometry(r, d)); }
function gTor(r, t, rs = 8, ts = 24, arc = Math.PI * 2) { return geo(`t${r},${t},${rs},${ts},${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc)); }
function sMat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (MATC[k] && !o.unique) return MATC[k];
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .85, metalness: 0 }, o));
  delete m.unique;
  if (!o.unique) MATC[k] = m;
  return m;
}
function uMat(color, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .8, metalness: 0 }, o)); }
function mesh(g, m, x = 0, y = 0, z = 0, parent) { const ms = new THREE.Mesh(g, m); ms.position.set(x, y, z); ms.castShadow = true; ms.receiveShadow = true; if (parent) parent.add(ms); return ms; }

function makeGlowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeFlameTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 92, 2, 32, 80, 60);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(62, 70, 52, 104); g.quadraticCurveTo(32, 128, 12, 104); g.quadraticCurveTo(2, 70, 32, 4); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glow(color, size, parent, y = 0, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: r3().glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1); s.position.y = y; if (parent) parent.add(s); return s;
}
function flame(color, w, h, parent, y = 0) {
  const m = new THREE.SpriteMaterial({ map: r3().flameTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const s = new THREE.Sprite(m); s.scale.set(w, h, 1); s.position.y = y + h * .35; s.userData.base = [w, h]; if (parent) parent.add(s); return s;
}

function init3D() {
  const canvas = document.createElement('canvas'); canvas.id = 'gl';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block';
  document.body.insertBefore(canvas, document.body.firstChild);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.useLegacyLights = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TOUCH_UI ? 1.5 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, .5, 140);
  const hemi = new THREE.HemisphereLight(0x8899cc, 0x221a14, .6); scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xaabbff, .5);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 90 });
  moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.04;
  scene.add(moon); scene.add(moon.target);
  const pool = []; for (let i = 0; i < 10; i++) { const l = new THREE.PointLight(0xffaa55, 0, 7, 1.4); scene.add(l); pool.push(l); }
  const heroL = { orhun: new THREE.PointLight(0xffd0a0, .55, 5.5, 1.3), handan: new THREE.PointLight(0x70ffd0, .9, 6.5, 1.3) };
  scene.add(heroL.orhun); scene.add(heroL.handan);
  const fxRoot = new THREE.Group(); scene.add(fxRoot);
  const entRoot = new THREE.Group(); scene.add(entRoot);
  const R = { renderer, scene, camera, hemi, moon, pool, heroL, fxRoot, entRoot, glowTex: null, flameTex: null };
  R3 = R;
  R.glowTex = makeGlowTex(); R.flameTex = makeFlameTex();
  // particles
  const MAXP = 700;
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXP * 3), 3));
  pg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAXP * 3), 3));
  const pm = new THREE.PointsMaterial({ size: .22, map: R.glowTex, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, sizeAttenuation: true });
  R.points = new THREE.Points(pg, pm); R.points.frustumCulled = false; scene.add(R.points); R.MAXP = MAXP;
  R.ray = new THREE.Raycaster(); R.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  window.addEventListener('resize', () => { renderer.setSize(window.innerWidth, window.innerHeight, false); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); });
  cv.addEventListener('wheel', e => { e.preventDefault(); S3.dist = clamp(S3.dist + Math.sign(e.deltaY) * 1.2, 9, 24); }, { passive: false });
  return R;
}

/* ---------- Zone ambience ---------- */
const AMB = {
  town:        { fog: 0x111a33, near: 22, far: 52, sky: 0x6a7ab8, gnd: 0x2a2018, hI: .62, moon: 0xb8c4ff, mI: .55, exp: 1.25 },
  brightfield: { fog: 0x1d1a3c, near: 20, far: 50, sky: 0x8a7ab0, gnd: 0x2a2a18, hI: .7, moon: 0xd0c0ff, mI: .6, exp: 1.2 },
  murkfen:     { fog: 0x10241f, near: 11, far: 34, sky: 0x4a7a6a, gnd: 0x141a12, hI: .55, moon: 0xa8f0d0, mI: .38, exp: 1.25 },
  keep:        { fog: 0x140b22, near: 16, far: 42, sky: 0x6a5a9a, gnd: 0x1a1422, hI: .62, moon: 0xb090ff, mI: .3, exp: 1.3 },
};

/* ---------- Zone construction ---------- */
function renderZone(z) {
  z.base = true;
  const mm = document.createElement('canvas'); mm.width = z.w; mm.height = z.h;
  const m = mm.getContext('2d');
  for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) { m.fillStyle = MM_COL[z.get(x, y)]; m.fillRect(x, y, 1, 1); }
  z.mini = mm;
}
const TCOL = {
  meadow: { [T.GRASS]: '#3f6236', [T.DGRASS]: '#33522f', [T.PATH]: '#7a6444', [T.PLAZA]: '#5d5b66', [T.MARSH]: '#34463a', [T.FLOOR]: '#3a3742', [T.WATER]: '#24384a', [T.DEEP]: '#18283a', [T.BRIDGE]: '#24384a', [T.TREE]: '#36572f', [T.ROCK]: '#3f6236', [T.WALL]: '#3a3742', [T.ROOF]: '#4a4640', [T.VOID]: '#060608', [T.GATE]: '#3a3742' },
  marsh: { [T.GRASS]: '#33473a', [T.DGRASS]: '#2b3d31', [T.PATH]: '#5a5038', [T.PLAZA]: '#4a5048', [T.MARSH]: '#2c3a33', [T.WATER]: '#1c3036', [T.DEEP]: '#132428', [T.BRIDGE]: '#1c3036', [T.TREE]: '#28382c', [T.ROCK]: '#2b3d31' },
  keep: { [T.FLOOR]: '#3b3843', [T.DGRASS]: '#343c30', [T.ROCK]: '#3b3843', [T.WALL]: '#2a2730', [T.GATE]: '#3b3843', [T.PLAZA]: '#4a4654' },
};
function tileColor(z, t) { const pal = TCOL[z.style === 'town' ? 'meadow' : z.style] || TCOL.meadow; return pal[t] || TCOL.meadow[t] || '#333'; }

function build3DZone(z) {
  const R = r3();
  const root = new THREE.Group();
  const info = { root, lanterns: [], fires: [], beacons: {}, pickups: {}, gates: [], water: null, lights: [] };
  const rng = mulberry32(z.seed * 7 + 3);
  const isWater = t => t === T.WATER || t === T.DEEP || t === T.BRIDGE;
  // ground
  const W1 = z.w + 1, H1 = z.h + 1;
  const pos = new Float32Array(W1 * H1 * 3), col = new Float32Array(W1 * H1 * 3), idx = [];
  const tmp = new THREE.Color(), acc = new THREE.Color();
  for (let j = 0; j < H1; j++) for (let i = 0; i < W1; i++) {
    const ts = [z.get(i - 1, j - 1), z.get(i, j - 1), z.get(i - 1, j), z.get(i, j)];
    let r = 0, g = 0, b = 0, wcount = 0, deep = 0, marsh = 0, voids = 0;
    for (const t of ts) { tmp.set(tileColor(z, t)); r += tmp.r; g += tmp.g; b += tmp.b; if (isWater(t)) wcount++; if (t === T.DEEP) deep++; if (t === T.MARSH) marsh++; if (t === T.VOID) voids++; }
    const n = (hash2(i, j, z.seed) - .5) * .06;
    acc.setRGB(r / 4 + n, g / 4 + n * 1.2, b / 4 + n);
    let y = (fbm(i * .3, j * .3, z.seed) - .5) * .12;
    if (wcount >= 2) y = -.42 - deep * .08; else if (wcount === 1) y = -.12;
    else if (marsh >= 2) y = -.05;
    if (z.style === 'keep') y = 0;
    const k = (j * W1 + i) * 3;
    pos[k] = i; pos[k + 1] = y; pos[k + 2] = j; col[k] = acc.r; col[k + 1] = acc.g; col[k + 2] = acc.b;
  }
  for (let j = 0; j < z.h; j++) for (let i = 0; i < z.w; i++) { const a = j * W1 + i, b = a + 1, c = a + W1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gg.setAttribute('color', new THREE.BufferAttribute(col, 3)); gg.setIndex(idx); gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }));
  ground.receiveShadow = true; root.add(ground);
  // skirt under the map so edges don't show the void
  const skirt = new THREE.Mesh(new THREE.PlaneGeometry(z.w + 80, z.h + 80), new THREE.MeshBasicMaterial({ color: AMB[z.id].fog }));
  skirt.rotation.x = -Math.PI / 2; skirt.position.set(z.w / 2, -.7, z.h / 2); root.add(skirt);
  // water
  let hasWater = false; for (let i = 0; i < z.g.length; i++) if (isWater(z.g[i])) { hasWater = true; break; }
  if (hasWater) {
    const wm = new THREE.MeshStandardMaterial({ color: z.style === 'marsh' ? 0x1e4a44 : 0x2a5a80, roughness: .12, metalness: .25, transparent: true, opacity: .82, emissive: z.style === 'marsh' ? 0x0a2a22 : 0x0a1a30, emissiveIntensity: .6 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(z.w, z.h), wm); water.rotation.x = -Math.PI / 2; water.position.set(z.w / 2, -.16, z.h / 2); water.receiveShadow = true; root.add(water); info.water = water;
  }
  // instancing helpers
  const inst = (g, m, list, shadow = true) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(g, m, list.length);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Sv = new THREE.Vector3(), P = new THREE.Vector3(), C = new THREE.Color();
    list.forEach((o, i) => { E.set(o.rx || 0, o.ry || 0, o.rz || 0); Q.setFromEuler(E); P.set(o.x, o.y, o.z); Sv.set(o.sx || o.s || 1, o.sy || o.s || 1, o.sz || o.s || 1); M.compose(P, Q, Sv); im.setMatrixAt(i, M); if (o.c) { C.set(o.c); im.setColorAt(i, C); } });
    im.castShadow = shadow; im.receiveShadow = true; root.add(im); return im;
  };
  const trunks = [], crowns = [], pines = [], deadT = [], branches = [], rocks = [], tufts = [], flowers = [], walls = [], wallsIn = [], planks = [], pillars = [];
  const greens = ['#2c5a2c', '#356b33', '#3f7a3a', '#2a4f2e', '#4a8040'];
  for (let ty = 0; ty < z.h; ty++) for (let tx = 0; tx < z.w; tx++) {
    const t = z.get(tx, ty), cx = tx + .5, cz = ty + .5, hr = hash2(tx, ty, z.seed + 5);
    const jx = (hash2(tx, ty, 91) - .5) * .4, jz = (hash2(tx, ty, 92) - .5) * .4;
    if (t === T.TREE) {
      if (z.canopy === 'dead') {
        const h = 1.6 + hr * 1.2;
        deadT.push({ x: cx + jx, y: h / 2, z: cz + jz, sy: h, c: '#3a3028' });
        for (let k = 0; k < 3; k++) { const a = hr * 6 + k * 2.1; branches.push({ x: cx + jx + Math.cos(a) * .25, y: h * (.55 + k * .12), z: cz + jz + Math.sin(a) * .25, rz: Math.cos(a) * .9, rx: Math.sin(a) * .9, sy: .7 + k * .1, c: '#3a3028' }); }
        if (hr > .4) crowns.push({ x: cx + jx, y: h * .9, z: cz + jz, s: .45 + hr * .25, c: '#2a3a2c' });
      } else if (hr > .72) {
        trunks.push({ x: cx + jx, y: .35, z: cz + jz, sy: .7, c: '#4a3222' });
        const s = .8 + hash2(tx, ty, 7) * .4;
        for (let k = 0; k < 3; k++) pines.push({ x: cx + jx, y: .9 + k * .55 * s, z: cz + jz, s: s * (1 - k * .22), c: k % 2 ? '#24503a' : '#2a5c40' });
      } else {
        const s = .85 + hash2(tx, ty, 8) * .45;
        trunks.push({ x: cx + jx, y: .5, z: cz + jz, sy: 1, c: '#4a3222' });
        crowns.push({ x: cx + jx, y: 1.45 * s + .2, z: cz + jz, s, sy: s * .85, c: greens[Math.floor(hash2(tx, ty, 9) * greens.length)] });
        if (hash2(tx, ty, 10) > .4) crowns.push({ x: cx + jx + .28, y: 1.25 * s + .2, z: cz + jz + .15, s: s * .7, c: greens[Math.floor(hash2(tx, ty, 11) * greens.length)] });
      }
    } else if (t === T.ROCK) {
      if (z.style === 'keep') pillars.push({ x: cx, y: 1.3, z: cz, sy: 2.6, c: '#4a4652' });
      else rocks.push({ x: cx + jx * .5, y: .22, z: cz + jz * .5, s: .5 + hr * .35, sy: .4 + hr * .3, ry: hr * 6, c: z.style === 'marsh' ? '#4a5048' : '#6a6a72' });
    } else if (t === T.WALL && z.style === 'keep') {
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const n = z.get(tx + dx, ty + dy); return n !== T.WALL && n !== T.VOID; });
      const c = ['#55506a', '#4c4760', '#5a5470'][Math.floor(hr * 3)];
      (edge ? walls : wallsIn).push({ x: cx, y: 1.2, z: cz, sy: 2.4 + (edge ? hr * .3 : 0), c });
    } else if (t === T.BRIDGE) {
      const vert = isWater(z.get(tx - 1, ty)) && isWater(z.get(tx + 1, ty));
      for (let k = 0; k < 4; k++) planks.push({ x: vert ? cx : tx + .125 + k * .25, y: .02, z: vert ? ty + .125 + k * .25 : cz, sx: vert ? 1.02 : .22, sz: vert ? .22 : 1.02, sy: 1, c: k % 2 ? '#6b4a2b' : '#7a5530' });
    } else if ((t === T.GRASS || t === T.DGRASS) && z.style !== 'keep') {
      if (hr > .45) for (let k = 0; k < 2; k++) tufts.push({ x: tx + hash2(tx * 3 + k, ty, 21), y: .08, z: ty + hash2(tx, ty * 3 + k, 22), s: .7 + hash2(tx + k, ty, 23) * .6, ry: hr * 6, c: z.style === 'marsh' ? '#3a5236' : (t === T.DGRASS ? '#3a5a32' : '#4a7a3c') });
      if (hash2(tx, ty, 24) > .93 && z.style !== 'marsh') flowers.push({ x: tx + .3 + hash2(tx, ty, 25) * .4, y: .12, z: ty + .3 + hash2(tx, ty, 26) * .4, s: 1, c: ['#e8d36a', '#e08aa8', '#a9c8f0', '#f4f0e0'][Math.floor(hash2(tx, ty, 27) * 4)] });
    } else if (t === T.MARSH && hr > .7) {
      tufts.push({ x: tx + hash2(tx, ty, 28), y: .1, z: ty + hash2(tx, ty, 29), s: 1.3, sy: 1.8, ry: hr * 6, c: '#4a5a32' });
    }
  }
  const white = sMat('#ffffff', { roughness: .9 });
  inst(gCyl(.1, .15, 1, 7), white, trunks);
  inst(gIco(.6, 1), sMat('#ffffff', { roughness: .9, flatShading: true }), crowns);
  inst(gCone(.55, .85, 7), sMat('#ffffff', { roughness: .9, flatShading: true }), pines);
  inst(gCyl(.07, .14, 1, 6), white, deadT);
  inst(gCyl(.025, .05, 1, 5), white, branches);
  inst(gDodeca(), sMat('#ffffff', { roughness: .95, flatShading: true }), rocks);
  inst(gBox(1, 1, 1), sMat('#ffffff', { roughness: .95 }), walls);
  inst(gBox(1, 1, 1), sMat('#ffffff', { roughness: .95 }), wallsIn, false);
  inst(gCyl(.32, .38, 1, 10), sMat('#ffffff', { roughness: .9 }), pillars);
  inst(gBox(1, .06, 1), sMat('#ffffff', { roughness: .9 }), planks);
  inst(gCone(.07, .25, 3), sMat('#ffffff', { roughness: 1, flatShading: true }), tufts, false);
  inst(gSph(.045, 6, 4), sMat('#ffffff', { roughness: .6, emissive: 0x222222 }), flowers, false);
  // houses
  for (const h of z.houses) buildHouse(root, h);
  // gates
  for (let ty = 0; ty < z.h; ty++) for (let tx = 0; tx < z.w; tx++) if (z.get(tx, ty) === T.GATE) {
    const gr = new THREE.Group(); gr.position.set(tx + .5, 0, ty + .5);
    for (let k = 0; k < 5; k++) mesh(gCyl(.035, .035, 2.4, 6), sMat('#4a4048', { metalness: .6, roughness: .4 }), 0, 1.2, -.4 + k * .2, gr);
    mesh(gBox(.12, .12, 1), sMat('#4a4048', { metalness: .6 }), 0, 2.3, 0, gr); mesh(gBox(.12, .12, 1), sMat('#4a4048', { metalness: .6 }), 0, .9, 0, gr);
    const rune = glow(0xb07cff, 1.2, gr, 1.4, .7); gr.userData.rune = rune;
    root.add(gr); info.gates.push(gr);
  }
  // decor
  for (const d of z.decor) buildDecor(root, d, info, z);
  // beacons
  for (const b of z.beacons) {
    const gr = new THREE.Group(); gr.position.set(b.x + .5, 0, b.y + .5);
    const stone = sMat('#6a6674', { roughness: .8 }), dark = sMat('#3a3742');
    mesh(gCyl(.75, .9, .3, 10), stone, 0, .15, 0, gr); mesh(gCyl(.32, .42, 1.3, 8), stone, 0, .95, 0, gr);
    mesh(gCyl(.62, .3, .35, 12), dark, 0, 1.75, 0, gr);
    mesh(gTor(.6, .06, 6, 20), sMat(b.first ? '#b8902a' : '#8a8494', { metalness: b.first ? .7 : .2, roughness: .4 }), 0, 1.92, 0, gr).rotation.x = Math.PI / 2;
    if (b.first) for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .78; mesh(gBox(.18, 1.6, .18), sMat('#5a5466'), Math.cos(a) * 1.15, .8, Math.sin(a) * 1.15, gr); }
    const ember = glow(0x8a5ad0, .7, gr, 1.95, .8);
    const fl = [flame(0x2aff9a, .9, 1.6, gr, 1.9), flame(0x9affd8, .6, 1.2, gr, 1.9), flame(0xfff0c0, .35, .7, gr, 1.9)];
    const halo = glow(0x66ffcc, 3.2, gr, 2.6, .55);
    gr.userData = { ember, fl, halo };
    root.add(gr); info.beacons[b.id] = gr;
  }
  // pickups
  for (const p of z.pickups) {
    const gr = new THREE.Group(); gr.position.set(p.x + .5, 0, p.y + .5);
    const inner = new THREE.Group(); gr.add(inner);
    if (p.item === 'moonpetal') {
      mesh(gCyl(.015, .015, .4, 4), sMat('#3a6a3a'), 0, .2, 0, inner);
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const pt = mesh(gSph(.07, 8, 6), sMat('#dde8ff', { emissive: 0x8899ff, emissiveIntensity: .7 }), Math.cos(a) * .09, .42, Math.sin(a) * .09, inner); pt.scale.set(1, .4, 1.6); pt.rotation.y = -a; }
      mesh(gSph(.04, 8, 6), sMat('#ffe9a0', { emissive: 0xffcc66, emissiveIntensity: 1 }), 0, .45, 0, inner);
      glow(0xa8c0ff, 1.1, inner, .45, .8);
    } else if (p.item === 'token') {
      const c = mesh(gCyl(.16, .16, .04, 16), sMat('#e0a64e', { metalness: .8, roughness: .3, emissive: 0x5a3a10 }), 0, .7, 0, inner); c.rotation.x = Math.PI / 2;
      mesh(gBox(.06, .12, .06), sMat('#fff2c0', { emissive: 0xffd080, emissiveIntensity: 1 }), 0, .7, .03, inner);
      glow(0xffcc66, 1.1, inner, .7, .7);
    } else {
      const c = mesh(new THREE.OctahedronGeometry(.18, 0), sMat('#46c495', { emissive: 0x2aff9a, emissiveIntensity: .9, roughness: .2, metalness: .3, flatShading: true }), 0, .8, 0, inner); c.scale.set(.8, 1.6, .8);
      glow(0x46ffb0, 1.5, inner, .8, .9);
    }
    gr.userData.inner = inner; root.add(gr); info.pickups[p.id] = gr;
  }
  z.g3 = info;
}
function gDodeca() { return geo('dodeca', () => new THREE.DodecahedronGeometry(.6, 0)); }

function buildHouse(root, h) {
  const gr = new THREE.Group();
  const W = h.w, D = h.h, H = 1.9;
  gr.position.set(h.x + W / 2, 0, h.y + D / 2);
  const plaster = sMat('#b9a98c', { roughness: .95 }), timber = sMat('#4a3424', { roughness: .9 }), roofM = sMat('#6e3028', { roughness: .85, flatShading: true });
  const body = mesh(new THREE.BoxGeometry(W - .1, H, D - .1), plaster, 0, H / 2, 0, gr);
  // stone base
  mesh(new THREE.BoxGeometry(W, .35, D), sMat('#5a5660'), 0, .175, 0, gr);
  // timber frame
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(gBox(.16, H, .16), timber, sx * (W / 2 - .08), H / 2, sz * (D / 2 - .08), gr);
  for (let k = 1; k < Math.floor(W / 2); k++) mesh(gBox(.12, H, .06), timber, -W / 2 + k * 2, H / 2, D / 2 - .02, gr);
  mesh(new THREE.BoxGeometry(W, .12, .08), timber, 0, H - .06, D / 2 - .02, gr);
  mesh(new THREE.BoxGeometry(W, .12, .08), timber, 0, 1.0, D / 2 - .02, gr);
  // gable roof (prism)
  const rise = 1.5, ov = .35;
  const sh = new THREE.Shape(); sh.moveTo(-D / 2 - ov, 0); sh.lineTo(D / 2 + ov, 0); sh.lineTo(0, rise); sh.lineTo(-D / 2 - ov, 0);
  const rg = new THREE.ExtrudeGeometry(sh, { depth: W + ov * 2, bevelEnabled: false }); rg.rotateY(-Math.PI / 2); rg.translate(W / 2 + ov, 0, 0);
  const roof = mesh(rg, roofM, 0, H, 0, gr);
  // ridge beam & chimney
  mesh(new THREE.BoxGeometry(W + ov * 2 + .1, .14, .14), timber, 0, H + rise + .02, 0, gr);
  mesh(gBox(.45, 1.2, .45), sMat('#6a6470'), W / 2 - 1.2, H + rise * .6, -D / 6, gr);
  // door & windows (south face, +z)
  const door = mesh(gBox(.75, 1.25, .08), sMat('#3a2416'), -W / 2 + Math.floor(W / 2) + .5 - W / 2 + W / 2 - (W / 2 - Math.floor(W / 2) - .5), .62, D / 2 + .02, gr);
  door.position.x = (Math.floor(W / 2) + .5) - W / 2;
  mesh(gSph(.04, 6, 4), sMat('#e0a64e', { metalness: .8 }), door.position.x + .22, .62, D / 2 + .08, gr);
  const winM = sMat('#ffcf7a', { emissive: 0xffaa44, emissiveIntensity: 1.1 });
  for (const wx of [-W / 2 + 1.5, W / 2 - 1.5]) {
    mesh(gBox(.7, .6, .05), winM, wx, 1.25, D / 2 + .03, gr);
    mesh(gBox(.06, .6, .07), timber, wx, 1.25, D / 2 + .05, gr); mesh(gBox(.7, .06, .07), timber, wx, 1.25, D / 2 + .05, gr);
    glow(0xffaa44, 1.4, gr, 1.25).position.set(wx, 1.25, D / 2 + .2);
  }
  root.add(gr);
}

function buildDecor(root, d, info, z) {
  const X = d.x + .5, Z = d.y + .5;
  const gr = new THREE.Group(); gr.position.set(X, 0, Z);
  switch (d.type) {
    case 'lantern': {
      const iron = sMat('#2a2624', { metalness: .4, roughness: .6 });
      mesh(gCyl(.05, .07, 1.7, 6), iron, 0, .85, 0, gr);
      mesh(gBox(.4, .05, .05), iron, .15, 1.65, 0, gr);
      const lampM = uMat('#ffcf7a', { emissive: 0xffaa44, emissiveIntensity: 1.2 });
      mesh(gBox(.18, .24, .18), lampM, .3, 1.48, 0, gr).castShadow = false;
      mesh(gBox(.24, .05, .24), iron, .3, 1.62, 0, gr);
      const gl = glow(0xffaa44, 1.4, gr, 1.48); gl.position.x = .3;
      info.lanterns.push({ g: gr, lampM, gl, beacon: d.beacon, x: X + .3, z: Z, y: 1.48 });
      break; }
    case 'brazier': {
      const iron = sMat('#3a3036', { metalness: .4 });
      for (let k = 0; k < 3; k++) { const a = k * 2.1; mesh(gCyl(.03, .03, .8, 5), iron, Math.cos(a) * .18, .4, Math.sin(a) * .18, gr); }
      mesh(gCyl(.32, .18, .22, 10), iron, 0, .85, 0, gr);
      const f1 = flame(0xff8a2a, .6, .9, gr, .9), f2 = flame(0xffd27a, .35, .55, gr, .9); glow(0xff8a3a, 1.8, gr, 1.2, .8);
      info.fires.push({ fl: [f1, f2], x: X, z: Z, y: 1.3, col: 0xff8a3a, r: 7, i: 1.3 });
      break; }
    case 'campfire': {
      for (let k = 0; k < 5; k++) { const lg = mesh(gCyl(.05, .05, .6, 6), sMat('#4a3220'), 0, .08, 0, gr); lg.rotation.z = Math.PI / 2; lg.rotation.y = k * 1.25; }
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; mesh(gDodeca(), sMat('#5a5860', { flatShading: true }), Math.cos(a) * .45, .06, Math.sin(a) * .45, gr).scale.setScalar(.18); }
      const f1 = flame(0xff7a2a, .8, 1.2, gr, .1), f2 = flame(0xffd27a, .45, .8, gr, .1); glow(0xff8a3a, 2.4, gr, .5, .8);
      info.fires.push({ fl: [f1, f2], x: X, z: Z, y: .8, col: 0xff8a3a, r: 9, i: 1.6 });
      break; }
    case 'statue': {
      const st = sMat('#7a7a84', { roughness: .9 });
      mesh(gBox(.8, .5, .8), st, 0, .25, 0, gr); mesh(gCap(.2, .8), st, 0, 1.15, 0, gr); mesh(gSph(.17), st, 0, 1.8, 0, gr);
      const arm = mesh(gCyl(.05, .05, .9, 6), st, .25, 1.6, 0, gr); arm.rotation.z = -.4;
      mesh(gBox(.06, 1.2, .06), st, .45, 1.9, 0, gr);
      mesh(gSph(.12, 6, 4), sMat('#4a6a3a'), -.2, .55, .3, gr);
      break; }
    case 'tent': {
      const t = mesh(gCone(1.3, 1.6, 4), sMat('#6a5638', { flatShading: true }), .5, .8, 0, gr); t.rotation.y = Math.PI / 4;
      mesh(gBox(.5, .8, .05), sMat('#2a2014'), .5, .4, .9, gr);
      break; }
    case 'throne': {
      const st = sMat('#2e2638'), pur = sMat('#5a2a7a'), gold = sMat('#b8902a', { metalness: .7, roughness: .35 });
      mesh(gBox(2.2, .4, 1.6), st, .5, .2, .3, gr); mesh(gBox(1.4, .5, 1), pur, .5, .65, .4, gr); mesh(gBox(1.6, 2.6, .35), st, .5, 1.5, -.2, gr);
      mesh(gBox(1.1, 1.8, .1), pur, .5, 1.5, 0, gr); for (const sx of [-.3, 1.3]) { mesh(gBox(.25, .9, 1), st, sx, .75, .4, gr); mesh(gCone(.12, .4, 6), gold, sx, 2.95, -.2, gr); }
      break; }
    case 'stall': {
      const wood = sMat('#5a3a22');
      mesh(gBox(2, .7, .9), wood, .5, .35, .2, gr);
      for (const sx of [-.45, 1.45]) mesh(gCyl(.04, .04, 1.8, 5), wood, sx, .9, -.2, gr);
      for (let k = 0; k < 6; k++) mesh(gBox(.36, .06, 1.2), sMat(k % 2 ? '#a83232' : '#e2d6b0'), -.4 + k * .36, 1.8, .1, gr).rotation.x = .25;
      mesh(gBox(.5, .06, .1), sMat('#b0b6c0', { metalness: .8, roughness: .3 }), 0, .74, .2, gr);
      mesh(gBox(.08, .5, .08), sMat('#b0b6c0', { metalness: .8, roughness: .3 }), .6, .95, .2, gr);
      mesh(gCyl(.1, .1, .25, 8), sMat('#c9573a', { emissive: 0x5a1a0a }), 1.1, .82, .2, gr);
      break; }
    case 'herbs': {
      const wood = sMat('#5a3a22');
      mesh(gBox(1.8, .5, .7), wood, .3, .25, .2, gr);
      for (let k = 0; k < 5; k++) mesh(gIco(.17, 0), sMat(k % 2 ? '#4a8a3a' : '#5a9a48', { flatShading: true }), -.4 + k * .35, .6, .2, gr);
      mesh(gSph(.05, 6, 4), sMat('#e8d36a', { emissive: 0x554400 }), -.2, .78, .25, gr); mesh(gSph(.05, 6, 4), sMat('#e08aa8', { emissive: 0x441122 }), .5, .78, .25, gr);
      break; }
    case 'banner': {
      mesh(gCyl(.04, .05, 2.6, 6), sMat('#2a2420', { metalness: .3 }), 0, 1.3, 0, gr);
      const cloth = mesh(new THREE.PlaneGeometry(.6, 1.1), sMat('#8a2a24', { side: THREE.DoubleSide }), .32, 2.0, 0, gr);
      mesh(gCyl(.13, .13, .02, 14), sMat('#e0a64e', { metalness: .6, emissive: 0x3a2400 }), .32, 2.15, .02, gr).rotation.x = Math.PI / 2;
      gr.userData.cloth = cloth; info.banners = (info.banners || []).concat(cloth);
      break; }
    case 'fountain': {
      const st = sMat('#6e6c78', { roughness: .8 });
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const s = mesh(gBox(1.25, .45, .25), st, Math.cos(a) * 1.55, .1, Math.sin(a) * 1.55, gr); s.rotation.y = -a + Math.PI / 2; }
      mesh(gCyl(.18, .26, 1.2, 8), st, 0, .5, 0, gr); mesh(gCyl(.55, .2, .2, 12), st, 0, 1.1, 0, gr);
      const wtr = mesh(gCyl(1.5, 1.5, .05, 24), sMat('#24506e', { roughness: .1, metalness: .3, transparent: true, opacity: .85, emissive: 0x061828 }), 0, .02, 0, gr);
      glow(0x88ccff, 1.4, gr, 1.3, .5);
      break; }
    default: return;
  }
  root.add(gr);
}

/* ---------- Character models ---------- */
function look3D(key) {
  if (key === 'orhun') return { skin: '#e3b28c', hair: '#4a2e1e', hairStyle: 'wavy', beard: 'goatee', shirt: '#25262f', pants: '#2a2a33', boots: '#3a2618', pauldron: '#7a808c', belt: '#5a3a22', buckle: '#e0a64e', weapon: 'sword', offhand: 'buckler', smile: 'grin' };
  if (key === 'handan') return { skin: '#f0caa6', hair: '#141419', hairStyle: 'long', shirt: '#1e1e26', pants: '#1e1e26', boots: '#241a14', robe: true, trim: '#2aa878', belt: '#2a2a33', buckle: '#46c495', weapon: 'staff', necklace: true, smile: 'soft', blush: true };
  const L = NPCS[key].look;
  return { skin: L.skin, hair: L.hair, hairStyle: L.hood ? 'hood' : (key === 'sela' || key === 'ayla' ? 'long' : 'short'), hood: L.hood, beard: L.beard ? 'full' : null, shirt: L.robe, pants: L.robe, boots: '#2a1c12', robe: true, trim: '#00000000', belt: L.apron ? '#3a2a1a' : '#2a2016', buckle: '#9a7a3a', weapon: L.staff ? 'staff' : null, apron: L.apron, ghost: L.ghost, smile: 'soft' };
}
function makeHumanoid(key) {
  const L = look3D(key);
  const ghost = L.ghost;
  const mo = ghost ? { transparent: true, opacity: .62, emissive: 0x3a8a70, emissiveIntensity: .7 } : {};
  const M = c => uMat(c, Object.assign({ roughness: .8 }, mo));
  const skin = M(L.skin), cloth = M(L.shirt), pants = M(L.pants), boots = M(L.boots), hairM = M(L.hair);
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const hipL = new THREE.Group(), hipR = new THREE.Group(); hipL.position.set(-.1, .62, 0); hipR.position.set(.1, .62, 0); body.add(hipL, hipR);
  for (const hp of [hipL, hipR]) { mesh(gCap(.075, .34), pants, 0, -.25, 0, hp); mesh(gBox(.14, .12, .22), boots, 0, -.55, .03, hp); }
  const torso = mesh(gCyl(.2, .165, .5, 12), cloth, 0, .87, 0, body);
  if (L.robe) {
    mesh(gCyl(.18, .32, .64, 14), cloth, 0, .48, 0, body);
    if (L.trim && L.trim.length === 7) mesh(gTor(.31, .022, 6, 24), M(L.trim), 0, .18, 0, body).rotation.x = Math.PI / 2;
  }
  if (L.apron) mesh(gBox(.3, .6, .03), M('#6a4a2a'), 0, .7, .2, body);
  mesh(gCyl(.178, .178, .07, 12), M(L.belt), 0, .64, 0, body);
  mesh(gBox(.08, .07, .03), uMat(L.buckle, { metalness: .7, roughness: .35 }), 0, .64, .18, body);
  if (key === 'orhun') { // open collar
    mesh(gBox(.1, .12, .02), skin, 0, 1.04, .175, body).rotation.x = -.15;
  }
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-.26, 1.05, 0); armR.position.set(.26, 1.05, 0); body.add(armL, armR);
  for (const a of [armL, armR]) { mesh(gCap(.065, .28), cloth, 0, -.2, 0, a); mesh(gSph(.065, 8, 6), skin, 0, -.42, 0, a); }
  if (L.pauldron) for (const sx of [-1, 1]) { const p = mesh(gSph(.12, 10, 8), uMat(L.pauldron, { metalness: .65, roughness: .35 }), sx * .25, 1.08, 0, body); p.scale.set(1.1, .65, 1.1); }
  mesh(gCyl(.06, .07, .12, 8), skin, 0, 1.14, 0, body);
  const head = new THREE.Group(); head.position.y = 1.34; body.add(head);
  const hs = mesh(gSph(.2, 18, 14), skin, 0, 0, 0, head); hs.scale.set(1, 1.06, 1);
  const eyeM = uMat('#1a120e', { roughness: .3 });
  if (!(L.hairStyle === 'hood' && false)) {
    for (const sx of [-1, 1]) {
      const e = mesh(gSph(.027, 8, 6), eyeM, sx * .072, .02, .178, head); e.castShadow = false;
      if (L.smile === 'grin') { const br = mesh(gBox(.07, .016, .02), hairM, sx * .072, .075, .185, head); br.rotation.z = sx * -.15; }
      else { const lash = mesh(gBox(.06, .012, .015), eyeM, sx * .074, .042, .182, head); lash.rotation.z = sx * .2; }
    }
    if (L.smile === 'grin') { mesh(gBox(.1, .03, .02), uMat('#f6f0e6'), 0, -.095, .19, head); mesh(gBox(.13, .012, .02), uMat('#7a3a2a'), 0, -.077, .188, head); }
    else mesh(gBox(.06, .016, .02), uMat('#c06a68'), 0, -.095, .19, head);
    if (L.blush) for (const sx of [-1, 1]) { const b = mesh(gSph(.03, 8, 6), uMat('#ee9a90', { transparent: true, opacity: .55 }), sx * .11, -.035, .16, head); b.scale.set(1.3, .7, .4); b.castShadow = false; }
  }
  const cap = (r, f = .5) => mesh(geo(`cap${r},${f}`, () => new THREE.SphereGeometry(r, 18, 12, 0, Math.PI * 2, 0, Math.PI * f)), hairM, 0, .02, -.01, head);
  if (L.hairStyle === 'wavy') {
    cap(.218, .48);
    const pts = [[0, .19, .02], [-.1, .17, .06], [.1, .17, .06], [-.15, .12, -.06], [.15, .12, -.06], [0, .16, -.12], [-.08, .1, .15], [.09, .11, .14], [0, .2, -.04], [-.18, .02, -.05], [.18, .02, -.05], [0, .05, -.18]];
    pts.forEach(([x, y, zz], i) => mesh(gSph(.075 + (i % 3) * .012, 8, 6), hairM, x, y, zz, head));
    for (const sx of [-1, 1]) mesh(gBox(.04, .1, .06), hairM, sx * .19, -.04, .03, head);
  } else if (L.hairStyle === 'long') {
    cap(.224, .55);
    mesh(gBox(.36, .085, .07), hairM, 0, .11, .16, head);
    mesh(gBox(.42, .66, .1), hairM, 0, -.2, -.14, head);
    for (const sx of [-1, 1]) mesh(gBox(.085, .52, .13), hairM, sx * .195, -.15, .03, head);
  } else if (L.hairStyle === 'hood') {
    const hood = mesh(gSph(.25, 14, 10), M(L.hood), 0, .03, -.04, head); hood.scale.set(1, 1.05, 1.05);
    hs.position.z = .04;
  } else { cap(.215, .45); }
  if (L.beard === 'goatee') {
    const gt = mesh(gSph(.055, 8, 6), hairM, 0, -.16, .155, head); gt.scale.set(1.2, 1.1, .8);
    mesh(gBox(.13, .025, .03), hairM, 0, -.065, .188, head);
    const st = mesh(gSph(.2, 16, 10, 0), uMat(L.hair, { transparent: true, opacity: .28 }), 0, -.02, .006, head); st.scale.set(1.01, 1.07, 1.01); st.castShadow = false;
  }
  if (L.beard === 'full') { const b = mesh(gSph(.15, 10, 8), hairM, 0, -.12, .1, head); b.scale.set(1.1, 1, .8); }
  if (L.necklace) {
    const n = mesh(gTor(.12, .014, 6, 20), uMat('#46c495', { emissive: 0x1aa070, emissiveIntensity: .8, metalness: .3, roughness: .3 }), 0, 1.1, .02, body); n.rotation.x = Math.PI / 2 + .35;
    mesh(new THREE.OctahedronGeometry(.04, 0), uMat('#7dffc8', { emissive: 0x3affb0, emissiveIntensity: 1.3 }), 0, 1.02, .16, body);
    glow(0x46ffb0, .45, body, 1.02).position.z = .18;
  }
  let weapon = null, tip = null;
  if (L.weapon === 'sword') {
    weapon = new THREE.Group(); weapon.position.y = -.42; armR.add(weapon);
    const steel = uMat('#d8dee8', { metalness: .9, roughness: .22 });
    mesh(gCyl(.022, .022, .16, 6), uMat('#4a3020'), 0, 0, 0, weapon);
    mesh(gBox(.22, .035, .05), uMat('#e0a64e', { metalness: .8, roughness: .3 }), 0, .09, 0, weapon);
    mesh(gBox(.05, .72, .014), steel, 0, .46, 0, weapon);
    mesh(gSph(.03, 6, 4), uMat('#e0a64e', { metalness: .8 }), 0, -.09, 0, weapon);
    weapon.rotation.x = 1.15;
  }
  if (L.offhand === 'buckler') {
    const bk = new THREE.Group(); bk.position.set(-.07, -.3, .05); armL.add(bk);
    const disc = mesh(gCyl(.17, .17, .04, 18), uMat('#4a3020', { roughness: .7 }), 0, 0, 0, bk); disc.rotation.z = Math.PI / 2;
    const rim = mesh(gTor(.17, .022, 6, 22), uMat('#e0a64e', { metalness: .8, roughness: .3 }), 0, 0, 0, bk); rim.rotation.y = Math.PI / 2;
    const boss = mesh(gSph(.05, 8, 6), uMat('#e8c070', { metalness: .9, roughness: .25 }), -.03, 0, 0, bk);
  }
  if (L.weapon === 'staff') {
    weapon = new THREE.Group(); weapon.position.y = -.42; armR.add(weapon);
    mesh(gCyl(.025, .03, 1.55, 6), uMat('#6b4a2b', { roughness: .7 }), 0, .28, 0, weapon);
    const prong = uMat('#2b7d5f', { metalness: .5, roughness: .4 });
    for (let k = 0; k < 3; k++) { const pr = mesh(gCyl(.012, .012, .2, 4), prong, Math.cos(k * 2.1) * .05, 1.1, Math.sin(k * 2.1) * .05, weapon); pr.rotation.z = Math.cos(k * 2.1) * .3; pr.rotation.x = -Math.sin(k * 2.1) * .3; }
    tip = mesh(gIco(.075, 0), uMat(ghost ? '#c9f5df' : '#7dffc8', { emissive: 0x2affa0, emissiveIntensity: 1.4, roughness: .2, flatShading: true }), 0, 1.13, 0, weapon);
    glow(0x46ffb0, .8, weapon, 1.13);
  }
  if (ghost) root.add(glow(0x8ad8c0, 2.4, null, 1.0, .35));
  root.traverse(o => { if (o.isMesh && ghost) o.castShadow = false; });
  return { g: root, body, hipL, hipR, armL, armR, head, weapon, tip, kind: 'human', key, yaw: 0, h: 1.75 };
}
function makeFox3D() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const fur = uMat('#46c495', { emissive: 0x1a8a60, emissiveIntensity: .6, transparent: true, opacity: .92, roughness: .5 });
  const pale = uMat('#d8fff0', { emissive: 0x6affc8, emissiveIntensity: .6 });
  const tor = mesh(gCap(.11, .28), fur, 0, .3, 0, body); tor.rotation.x = Math.PI / 2;
  const head = new THREE.Group(); head.position.set(0, .42, .24); body.add(head);
  mesh(gSph(.1, 10, 8), fur, 0, 0, 0, head);
  const sn = mesh(gCone(.05, .14, 6), pale, 0, -.02, .12, head); sn.rotation.x = Math.PI / 2;
  for (const sx of [-1, 1]) mesh(gCone(.04, .12, 4), fur, sx * .06, .1, -.01, head);
  for (const sx of [-1, 1]) mesh(gSph(.016, 6, 4), uMat('#0a1a14'), sx * .045, .025, .085, head);
  const tail = new THREE.Group(); tail.position.set(0, .34, -.2); body.add(tail);
  const tl = mesh(gCap(.07, .22), fur, 0, .1, -.1, tail); tl.rotation.x = -.8;
  mesh(gSph(.065, 8, 6), pale, 0, .22, -.2, tail);
  const legs = [];
  for (const [x, z] of [[-.06, .12], [.06, .12], [-.06, -.12], [.06, -.12]]) { const lg = new THREE.Group(); lg.position.set(x, .22, z); body.add(lg); mesh(gCyl(.025, .02, .22, 5), fur, 0, -.11, 0, lg); legs.push(lg); }
  glow(0x46ffb0, 1.4, root, .35, .45);
  root.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { g: root, body, legs, tail, kind: 'fox', yaw: 0, h: .6 };
}

/* ---------- Foe models ---------- */
function makeFoe3D(f) {
  const d = f.def, ty = d.draw, sc = (d.scale || 1);
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mats = [];
  const M = (c, o = {}) => { const m = uMat(c, o); mats.push(m); return m; };
  const eyes = (col, pts, r = .03) => { const em = M(col, { emissive: col, emissiveIntensity: 2 }); for (const p of pts) mesh(gSph(r, 6, 4), em, p[0], p[1], p[2], p[3] || body).castShadow = false; };
  const legs = [];
  const leg = (x, y, z, len, r, m, parent = body) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); mesh(gCyl(r, r * .8, len, 6), m, 0, -len / 2, 0, g); legs.push(g); return g; };
  let h = 1, extra = {};
  switch (ty) {
    case 'wolf': {
      const fur = M('#3c3c48', { roughness: .9 }), dark = M('#2a2a33');
      const t = mesh(gCap(.17, .42), fur, 0, .48, 0, body); t.rotation.x = Math.PI / 2;
      const hd = new THREE.Group(); hd.position.set(0, .62, .4); body.add(hd);
      mesh(gSph(.15, 10, 8), fur, 0, 0, 0, hd);
      mesh(gBox(.12, .1, .2), dark, 0, -.04, .16, hd);
      for (const sx of [-1, 1]) mesh(gCone(.05, .14, 4), fur, sx * .08, .14, -.02, hd);
      eyes('#c58aff', [[-.06, .03, .12, hd], [.06, .03, .12, hd]], .025);
      const tl = mesh(gCone(.07, .4, 6), fur, 0, .55, -.42, body); tl.rotation.x = -2.2; extra.tail = tl;
      for (const [x, z] of [[-.1, .22], [.1, .22], [-.1, -.22], [.1, -.22]]) leg(x, .4, z, .4, .04, dark);
      mesh(gBox(.06, .04, .3), M('#7a3aa8', { emissive: 0x5a1a8a, emissiveIntensity: .8 }), 0, .66, 0, body);
      if (d.elite) mesh(gBox(.2, .05, .45), M('#c9a060', { metalness: .6 }), 0, .66, -.05, body);
      h = .8; break; }
    case 'sprite': {
      const g = M('#3e7a2e', { flatShading: true, roughness: .7 });
      const core = new THREE.Group(); core.position.y = .95; body.add(core);
      mesh(gIco(.22, 0), g, 0, 0, 0, core);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, b = (k % 3 - 1) * .7; const sp = mesh(gCone(.04, .2, 4), M('#6a9a3a'), Math.cos(a) * .22 * Math.cos(b), Math.sin(b) * .22, Math.sin(a) * .22 * Math.cos(b), core); sp.lookAt(new THREE.Vector3(0, 0, 0)); sp.rotateX(-Math.PI / 2); }
      eyes('#ff5a3a', [[-.07, .03, .19, core], [.07, .03, .19, core]], .03);
      glow(0x9be36a, .9, core, 0, .35); extra.core = core; h = 1.3; break; }
    case 'boar': {
      const hide = M('#5a3a26', { roughness: .95 }), moss = M('#3e5e2a', { flatShading: true }), tusk = M('#eee4c8', { roughness: .4 });
      const t = mesh(gSph(.55, 14, 10), hide, 0, .75, 0, body); t.scale.set(.85, .7, 1.2);
      for (let k = 0; k < 8; k++) mesh(gIco(.16, 0), moss, Math.sin(k) * .2, 1.12 + Math.cos(k * 2) * .05, -.5 + k * .14, body);
      const hd = new THREE.Group(); hd.position.set(0, .75, .62); body.add(hd); extra.head = hd;
      mesh(gSph(.3, 12, 8), hide, 0, 0, 0, hd).scale.set(1, .9, 1.1);
      mesh(gCyl(.14, .16, .2, 10), M('#4a2e1e'), 0, -.05, .32, hd).rotation.x = Math.PI / 2;
      for (const sx of [-1, 1]) { const tk = mesh(gCone(.05, .32, 6), tusk, sx * .14, -.04, .32, hd); tk.rotation.x = -.6; tk.rotation.z = sx * .4; }
      eyes('#ff7a3a', [[-.14, .1, .24, hd], [.14, .1, .24, hd]], .035);
      for (const [x, z] of [[-.28, .4], [.28, .4], [-.28, -.4], [.28, -.4]]) leg(x, .5, z, .5, .09, M('#3a2418'));
      h = 1.5; break; }
    case 'lurker': {
      const sl = M('#2e5236', { roughness: .4, metalness: .1 });
      const b = mesh(gSph(.42, 14, 10, 0), sl, 0, .15, 0, body); b.scale.set(1, .75, 1); extra.blob = b;
      mesh(gSph(.2, 10, 8), M('#3a6640', { roughness: .4 }), -.1, .4, -.05, body);
      eyes('#e8ff6a', [[.1, .35, .32], [.24, .3, .26]], .045);
      for (let k = 0; k < 5; k++) { const r = mesh(gCyl(.02, .04, .4, 4), M('#4a3a24'), Math.cos(k) * .3, .3, Math.sin(k * 1.7) * .3, body); r.rotation.z = Math.cos(k) * .6; }
      h = .8; break; }
    case 'wisp': {
      const core = new THREE.Group(); core.position.y = 1.1; body.add(core);
      mesh(gSph(.13, 12, 10), M('#e8fff4', { emissive: 0xb8ffd8, emissiveIntensity: 2 }), 0, 0, 0, core).castShadow = false;
      glow(0xb8ffd8, 1.6, core, 0, .9); glow(0xb8ffd8, .7, core, -.25, .5); glow(0xb8ffd8, .4, core, -.45, .35);
      extra.core = core; h = 1.3; break; }
    case 'spider': {
      const ch = M('#22202a', { roughness: .5 });
      mesh(gSph(.28, 12, 8), ch, 0, .4, -.18, body).scale.set(1, .8, 1.2);
      mesh(gSph(.16, 10, 8), M('#2e2a36'), 0, .38, .18, body);
      mesh(gBox(.1, .02, .26), M('#8a2a5a', { emissive: 0x4a0a2a }), 0, .62, -.2, body);
      eyes('#ff3a5a', [[-.05, .44, .32], [.05, .44, .32], [-.09, .4, .3], [.09, .4, .3]], .022);
      for (let k = 0; k < 8; k++) { const sx = k < 4 ? -1 : 1, i = k % 4; const g = new THREE.Group(); g.position.set(sx * .12, .4, .2 - i * .14); body.add(g); const l1 = mesh(gCyl(.018, .018, .45, 4), ch, sx * .2, .05, 0, g); l1.rotation.z = sx * -1.1; const l2 = mesh(gCyl(.015, .012, .45, 4), ch, sx * .42, -.2, 0, g); l2.rotation.z = sx * .4; legs.push(g); }
      h = .7; break; }
    case 'witch': {
      const rb = M('#1e2a20', { roughness: .9 });
      mesh(gCone(.42, 1.3, 10), rb, 0, .65, 0, body);
      mesh(gCyl(.2, .3, .1, 10), M('#2e4a30'), 0, .95, 0, body);
      mesh(gSph(.17, 12, 10), M('#9ab89a'), 0, 1.38, .02, body);
      mesh(gCyl(.38, .38, .03, 16), rb, 0, 1.5, 0, body);
      const hat = mesh(gCone(.2, .65, 10), rb, 0, 1.82, -.05, body); hat.rotation.x = -.25;
      eyes('#7dff9a', [[-.06, 1.4, .17], [.06, 1.4, .17]], .03);
      const st = new THREE.Group(); st.position.set(.38, 0, .1); body.add(st);
      mesh(gCyl(.025, .03, 1.9, 6), M('#4a3020'), 0, .95, 0, st);
      mesh(gSph(.09, 10, 8), M('#7dff9a', { emissive: 0x3aff6a, emissiveIntensity: 2 }), 0, 1.95, 0, st);
      glow(0x7dff9a, 1.6, st, 1.95, .9);
      h = 2.1; break; }
    case 'knight': case 'king': {
      const K = ty === 'king';
      const arm = M(K ? '#2e2640' : '#3e3e4a', { metalness: .7, roughness: .35 }), dark = M('#1c1c24', { metalness: .4 });
      const s = K ? 1.35 : 1; body.scale.setScalar(s);
      for (const sx of [-1, 1]) leg(sx * .1, .6, 0, .58, .07, dark);
      mesh(gBox(.46, .55, .3), arm, 0, .9, 0, body);
      mesh(gBox(.36, .14, .26), M(K ? '#4a2a6a' : '#3a2a4a'), 0, .65, 0, body);
      for (const sx of [-1, 1]) { const p = mesh(gSph(.14, 10, 8), arm, sx * .3, 1.15, 0, body); p.scale.set(1.2, .7, 1.1); }
      const hm = mesh(gBox(.3, .32, .3), arm, 0, 1.4, 0, body);
      mesh(gBox(.22, .04, .02), M('#c58aff', { emissive: 0xa060ff, emissiveIntensity: 2.2 }), 0, 1.42, .155, body);
      mesh(gBox(.04, .2, .3), arm, 0, 1.6, 0, body);
      const ar = new THREE.Group(); ar.position.set(.34, 1.1, 0); body.add(ar); extra.arm = ar;
      mesh(gCap(.07, .3), arm, 0, -.2, 0, ar);
      const sw = new THREE.Group(); sw.position.y = -.42; ar.add(sw);
      mesh(gBox(.07, .95, .02), M(K ? '#c58aff' : '#a8aec0', { metalness: .9, roughness: .2, emissive: K ? 0x5a2a9a : 0x000000 }), 0, .5, 0, sw);
      mesh(gBox(.24, .04, .05), M('#6a5a2a', { metalness: .6 }), 0, .03, 0, sw); sw.rotation.x = 1.2;
      const al = new THREE.Group(); al.position.set(-.34, 1.1, 0); body.add(al); mesh(gCap(.07, .3), arm, 0, -.2, 0, al);
      if (K) {
        const gold = M('#c9a030', { metalness: .9, roughness: .25, emissive: 0x3a2a00 });
        mesh(gTor(.16, .03, 6, 16), gold, 0, 1.6, 0, body).rotation.x = Math.PI / 2;
        for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; mesh(gCone(.035, .14, 4), gold, Math.cos(a) * .16, 1.68, Math.sin(a) * .16, body); }
        const cape = mesh(new THREE.PlaneGeometry(.6, 1.1), M('#3a1a5a', { side: THREE.DoubleSide }), 0, .75, -.18, body); cape.rotation.x = .12; extra.cape = cape;
        glow(0xa060ff, 3.2, body, 1.0, .35);
      }
      h = K ? 2.4 : 1.75; break; }
    case 'archer': {
      const cl = M('#2a2436', { roughness: .9 });
      for (const sx of [-1, 1]) leg(sx * .08, .5, 0, .48, .05, M('#1e1a26'));
      mesh(gCone(.28, .85, 8), cl, 0, .95, 0, body);
      mesh(gCone(.17, .38, 8), M('#1a1622'), 0, 1.45, 0, body);
      mesh(gSph(.12, 8, 6), M('#0a0812'), 0, 1.33, .04, body);
      eyes('#c9a0ff', [[-.04, 1.34, .14], [.04, 1.34, .14]], .02);
      const bow = mesh(gTor(.38, .018, 4, 16, Math.PI), M('#5a4a3a'), .3, 1.0, .15, body); bow.rotation.z = -Math.PI / 2; bow.rotation.y = .3;
      h = 1.6; break; }
    case 'wraith': {
      const cl = M('#2a1e46', { transparent: true, opacity: .82, emissive: 0x1a0a3a, emissiveIntensity: .6 });
      const c = mesh(gCone(.36, 1.35, 10, true), cl, 0, .95, 0, body); c.rotation.x = Math.PI;
      mesh(gSph(.2, 10, 8), cl, 0, 1.55, 0, body);
      mesh(gSph(.12, 8, 6), M('#06040a'), 0, 1.53, .1, body);
      eyes('#ffcf6a', [[-.04, 1.55, .19], [.05, 1.55, .19]], .025);
      const ln = new THREE.Group(); ln.position.set(.32, 1.0, .15); body.add(ln);
      mesh(gBox(.1, .14, .1), M('#e0a64e', { emissive: 0xffaa44, emissiveIntensity: 1.5 }), 0, 0, 0, ln); glow(0xffaa44, .9, ln, 0, .8);
      body.position.y = .25; h = 1.9; break; }
    case 'orb': {
      const core = new THREE.Group(); core.position.y = .7; body.add(core);
      mesh(gSph(.2, 14, 10), M('#5a2a9a', { emissive: 0x7a3ae8, emissiveIntensity: 1.6, roughness: .3 }), 0, 0, 0, core).castShadow = false;
      glow(0xb07cff, 1.6, core, 0, .9); extra.core = core; h = 1; break; }
  }
  root.scale.setScalar(sc * (ty === 'knight' || ty === 'king' ? 1 : 1));
  return Object.assign({ g: root, body, legs, mats, kind: 'foe', yaw: 0, h: h * sc }, extra);
}

/* ---------- Registry ---------- */
function regGet(obj, make) {
  let m = S3.ents.get(obj);
  if (!m) { m = make(); S3.ents.set(obj, m); (m.parent || r3().entRoot).add(m.g); }
  m.seen = S3.frame; return m;
}
function regSweep() {
  for (const [k, m] of S3.ents) if (m.seen !== S3.frame) { if (m.g.parent) m.g.parent.remove(m.g); if (m.mats) for (const x of m.mats) x.dispose(); S3.ents.delete(k); }
}
function yawToward(m, dx, dz, dt, speed = 12) {
  if (Math.abs(dx) + Math.abs(dz) < 1e-4) return;
  const target = Math.atan2(dx, dz);
  let d = target - m.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
  m.yaw += d * Math.min(1, dt * speed); m.g.rotation.y = m.yaw;
}
function placeEnt(m, e) { m.g.position.set(e.x / TILE, groundY(e.x / TILE, e.y / TILE), e.y / TILE); }
function groundY(X, Z) { const z = G.zone, t = z.get(Math.floor(X), Math.floor(Z)); if (t === T.MARSH) return -.04; if (t === T.BRIDGE) return .05; return 0; }

/* ---------- Animate units ---------- */
function animHuman(m, e, dt, t) {
  const px = m.px === undefined ? e.x : m.px, pz = m.pz === undefined ? e.y : m.pz;
  const vx = e.x - px, vz = e.y - pz; m.px = e.x; m.pz = e.y;
  const moving = e.moving && Math.hypot(vx, vz) > .05;
  if (moving) yawToward(m, vx, vz, dt);
  else { const tg = e.hero ? (e === ctrlHero() && G.target && G.target.team === 'foe' && !G.target.dead ? G.target : e.target) : null; if (tg && !tg.dead && tg.team === 'foe' && (G.inCombat || e.swingT > 0)) yawToward(m, tg.x - e.x, tg.y - e.y, dt, 8); }
  if (e.dead) { m.body.rotation.x = lerp(m.body.rotation.x, -Math.PI / 2, dt * 6); m.body.position.y = lerp(m.body.position.y, .12, dt * 6); return; }
  m.body.rotation.x = lerp(m.body.rotation.x, 0, dt * 8); m.body.position.y = 0;
  m.ph = (m.ph || 0) + dt * (moving ? 11 : 0);
  const sw = moving ? Math.sin(m.ph) : 0;
  m.hipL.rotation.x = sw * .65; m.hipR.rotation.x = -sw * .65;
  m.body.position.y = moving ? Math.abs(Math.cos(m.ph)) * .05 : Math.sin(t * 2 + (m.key === 'handan' ? 1 : 0)) * .01;
  let aL = -sw * .5, aR = sw * .5, aRz = 0;
  if (e.swingT > 0) {
    const u = 1 - e.swingT / (e.key === 'handan' ? .3 : .25);
    if (e.key === 'handan' || (m.weapon && m.tip)) { aR = -1.6 * Math.sin(u * Math.PI); }
    else { aR = -2.2 + u * 3.0; aRz = -.4; m.body.rotation.y = Math.sin(u * Math.PI) * .25; }
  } else m.body.rotation.y = 0;
  if (e.dash) { aR = -1.2; aL = -1.2; m.body.rotation.x = .35; }
  m.armL.rotation.x = aL; m.armR.rotation.x = aR; m.armR.rotation.z = aRz;
  if (m.tip && m.weapon) m.weapon.rotation.x = -aR * .8;
  m.head.rotation.y = Math.sin(t * .7 + (e.x || 0)) * .08;
}
function animFoe(m, f, dt, t) {
  const vx = f.x - (m.px ?? f.x), vz = f.y - (m.pz ?? f.y); m.px = f.x; m.pz = f.y;
  if (f.moving && Math.hypot(vx, vz) > .02) yawToward(m, vx, vz, dt, 8);
  else { const tg = f.aggro ? foeTarget(f) : null; if (tg) yawToward(m, tg.x - f.x, tg.y - f.y, dt, 6); }
  m.ph = (m.ph || 0) + dt * (f.moving ? 12 : 0);
  m.legs.forEach((l, i) => l.rotation.x = f.moving ? Math.sin(m.ph + i * Math.PI * (m.legs.length === 8 ? .5 : 1)) * .55 : 0);
  if (m.core) m.core.position.y = (f.def.draw === 'orb' ? .7 : f.def.draw === 'sprite' ? .95 : 1.1) + Math.sin(t * 3 + f.t) * .1, m.core.rotation.y += dt * 1.5;
  if (m.blob) { const s = 1 + Math.sin(t * 4 + f.t) * .06; m.blob.scale.set(s, .75 / s, s); }
  if (m.tail) m.tail.rotation.z = Math.sin(t * 6) * .3;
  if (m.cape) m.cape.rotation.x = .12 + Math.sin(t * 2) * .06 + (f.moving ? .25 : 0);
  if (m.arm) m.arm.rotation.x = f.swing > 0 ? -2.0 + (1 - f.swing) * 2.6 : (f.bs && f.bs.cast ? -2.4 : 0);
  m.body.rotation.x = f.swing > 0 && !m.arm ? Math.sin(f.swing * Math.PI) * .25 : 0;
  if (f.def.draw === 'wraith' || f.def.draw === 'witch') m.body.position.y = (f.def.draw === 'wraith' ? .25 : 0) + Math.sin(t * 2 + f.t) * .05;
  if (f.enraged) m.g.scale.setScalar((f.def.scale || 1) * (1 + Math.sin(t * 10) * .015));
  // flash, evade, death
  const em = f.flash > 0 ? .8 : 0;
  for (const mt of m.mats) { if (mt.userData.e0 === undefined) { mt.userData.e0 = mt.emissiveIntensity; mt.userData.c0 = mt.emissive.getHex(); } if (em) { mt.emissive.setHex(0xffffff); mt.emissiveIntensity = em; } else { mt.emissive.setHex(mt.userData.c0); mt.emissiveIntensity = mt.userData.e0; } }
  if (f.dead) { const u = Math.min(1, f.deathT / 1.1); m.g.scale.setScalar((f.def.scale || 1) * (1 - u * .6)); m.g.position.y -= u * .5; m.body.rotation.z = u * 1.4; }
  m.g.visible = true;
  for (const mt of m.mats) { const want = f.evade ? .45 : 1; if (want < 1 || mt.userData.tr) { mt.transparent = true; mt.userData.tr = true; mt.opacity = want; } }
}
function animFox(m, e, dt, t) {
  const vx = e.x - (m.px ?? e.x), vz = e.y - (m.pz ?? e.y); m.px = e.x; m.pz = e.y;
  const moving = e.moving && Math.hypot(vx, vz) > .05;
  if (moving) yawToward(m, vx, vz, dt);
  m.ph = (m.ph || 0) + dt * (moving ? 16 : 0);
  m.legs.forEach((l, i) => l.rotation.x = moving ? Math.sin(m.ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * .7 : 0);
  m.tail.rotation.y = Math.sin(t * 4) * .4;
  m.body.position.y = moving ? Math.abs(Math.sin(m.ph)) * .05 : Math.sin(t * 2) * .01;
}

/* ---------- Main 3D render ---------- */
var _v3 = null;
function toScreen(x, y, h) {
  const R = r3(); if (!_v3) _v3 = new THREE.Vector3();
  _v3.set(x / TILE, h, y / TILE).project(R.camera);
  return { x: (_v3.x + 1) / 2 * W, y: (1 - _v3.y) / 2 * H, vis: _v3.z < 1 && _v3.z > -1 };
}
function screenToWorld(ev) {
  const R = r3();
  const ndc = new THREE.Vector2(ev.clientX / W * 2 - 1, -(ev.clientY / H) * 2 + 1);
  R.ray.setFromCamera(ndc, R.camera);
  const hit = new THREE.Vector3();
  if (!R.ray.ray.intersectPlane(R.plane, hit)) return { x: S3.focus.x * TILE, y: S3.focus.z * TILE, sx: ev.clientX, sy: ev.clientY };
  return { x: hit.x * TILE, y: hit.z * TILE, sx: ev.clientX, sy: ev.clientY };
}
function unitHeight(e) { const m = S3.ents.get(e); return m ? m.h : 1.6; }
function hitFoe(p) {
  if (p.sx === undefined) return null;
  let best = null, bd = 1e9;
  for (const f of G.foes) {
    if (f.dead) continue;
    const hh = unitHeight(f), a = toScreen(f.x, f.y, hh * .5), b = toScreen(f.x + TILE, f.y, hh * .5);
    const ppu = Math.hypot(b.x - a.x, b.y - a.y);
    const rx = Math.max(TOUCH_UI ? 34 : 18, (f.r / TILE) * ppu * 1.2 + ppu * .25), ry = Math.max(rx, hh * ppu * .6);
    const dx = (p.sx - a.x) / rx, dy = (p.sy - a.y) / ry, d = dx * dx + dy * dy;
    if (d < 1 && d < bd) { bd = d; best = f; }
  }
  return best;
}

function render(dt) {
  const R = r3(); S3.frame++;
  const z = G.zone; if (!z) return;
  const t = performance.now() / 1000;
  if (S3.cur !== z) {
    if (S3.cur && S3.cur.g3) R.scene.remove(S3.cur.g3.root);
    if (!z.g3) build3DZone(z);
    R.scene.add(z.g3.root); S3.cur = z;
    for (const [k, m] of S3.ents) { if (m.g.parent) m.g.parent.remove(m.g); } S3.ents.clear();
  }
  const A = AMB[z.id];
  let lift = 0;
  if ((z.id === 'brightfield' && G.beacons.b1) || (z.id === 'murkfen' && G.beacons.b2)) lift = .18;
  if (z.id === 'keep' && G.beacons.b3) lift = .45;
  const ecl = G.eclipse ? -.25 : 0;
  R.scene.fog = R.scene.fog || new THREE.Fog(A.fog, A.near, A.far);
  R.scene.fog.color.setHex(A.fog); R.scene.fog.near = A.near * (1 + lift); R.scene.fog.far = A.far * (1 + lift * .6) * (G.eclipse ? .75 : 1);
  R.scene.background = R.scene.fog.color;
  R.hemi.color.setHex(A.sky); R.hemi.groundColor.setHex(A.gnd); R.hemi.intensity = A.hI * (1 + lift + ecl);
  R.moon.color.setHex(A.moon); R.moon.intensity = A.mI * (1 + lift + ecl);
  R.renderer.toneMappingExposure = A.exp;
  // camera
  const fov = R.camera.fov * Math.PI / 180, aspect = W / H;
  const D = S3.dist * (W < 820 ? 1.15 : 1);
  const visW = 2 * D * Math.tan(fov / 2) * aspect;
  ZOOM = W / (visW * TILE);
  const fx = (G.cam.x + W / ZOOM / 2) / TILE, fz = (G.cam.y + H / ZOOM / 2) / TILE;
  S3.focus.x = fx; S3.focus.z = fz;
  const pitch = 58 * Math.PI / 180;
  const shx = (Math.random() - .5) * G.shake * .02, shy = (Math.random() - .5) * G.shake * .02;
  R.camera.position.set(fx + shx, D * Math.sin(pitch) + shy, fz + D * Math.cos(pitch) * .95);
  R.camera.lookAt(fx, 0, fz - .6);
  R.camera.aspect = aspect; R.camera.updateProjectionMatrix();
  R.moon.position.set(fx - 12, 24, fz + 8); R.moon.target.position.set(fx, 0, fz);
  // zone dynamic bits
  const zi = z.g3;
  if (zi.water) zi.water.material.emissiveIntensity = .5 + Math.sin(t * 1.3) * .12;
  for (const gte of zi.gates) { gte.visible = !G.gateOpen; if (gte.userData.rune) gte.userData.rune.material.opacity = .5 + Math.sin(t * 3) * .25; }
  if (zi.banners) for (const c of zi.banners) c.rotation.y = Math.sin(t * 1.6 + c.position.x) * .15;
  const lightsList = [];
  for (const L of zi.lanterns) {
    const on = !L.beacon || G.beacons[L.beacon];
    L.lampM.emissiveIntensity = on ? 1.2 + Math.sin(t * 9 + L.x) * .1 : .15;
    L.lampM.color.set(on ? '#ffcf7a' : '#6a5a8a'); L.lampM.emissive.setHex(on ? 0xffaa44 : 0x4a2a7a);
    L.gl.material.opacity = on ? .9 : .25; L.gl.material.color.setHex(on ? 0xffaa44 : 0x7a5aa8);
    if (on) lightsList.push({ x: L.x, y: L.y, z: L.z, col: 0xffb060, r: 7, i: 1.15 + Math.sin(t * 11 + L.x) * .06 });
  }
  for (const F of zi.fires) { F.fl.forEach((s, i) => { const [w, h] = s.userData.base; const k = 1 + Math.sin(t * (13 + i * 4) + F.x) * .12; s.scale.set(w * (2 - k), h * k, 1); }); lightsList.push({ x: F.x, y: F.y, z: F.z, col: F.col, r: F.r, i: F.i + Math.sin(t * 13 + F.x) * .15 }); }
  for (const b of z.beacons) {
    const o = zi.beacons[b.id], lit = !!G.beacons[b.id];
    o.userData.ember.visible = !lit; o.userData.halo.visible = lit;
    o.userData.fl.forEach((s, i) => { s.visible = lit; const [w, h] = s.userData.base; const k = 1 + Math.sin(t * (8 + i * 3)) * .1; s.scale.set(w * (2 - k), h * k, 1); });
    if (lit) lightsList.push({ x: b.x + .5, y: 2.6, z: b.y + .5, col: 0x66ffcc, r: 18, i: 2.4, pri: true });
    else o.userData.ember.material.opacity = .5 + Math.sin(t * 2) * .3;
  }
  for (const p of z.pickups) {
    const o = zi.pickups[p.id], on = !G.picked[p.id] && pickupActive(p);
    o.visible = on;
    if (on) { o.userData.inner.position.y = Math.sin(t * 3 + p.x) * .08; o.userData.inner.rotation.y += dt * 1.4; }
  }
  // units
  for (const h of heroes()) { const m = regGet(h, () => makeHumanoid(h.key)); placeEnt(m, h); animHuman(m, h, dt, t); m.g.visible = true; }
  const fox = P.fox;
  if (!fox.dead && !P.handan.dead) { const m = regGet(fox, makeFox3D); placeEnt(m, fox); animFox(m, fox, dt, t); }
  for (const n of G.npcs) {
    const m = regGet(n, () => makeHumanoid(n.id)); placeEnt(m, n);
    const c = ctrlHero(); if (dist(n, c) < 4 * TILE) yawToward(m, c.x - n.x, c.y - n.y, dt, 4); else if (m.yaw === 0) { m.g.rotation.y = 0; }
    m.body.position.y = NPCS[n.id].look.ghost ? .15 + Math.sin(t * 2) * .06 : Math.sin(t * 1.5 + n.x) * .008;
    if (NPCS[n.id].look.ghost) lightsList.push({ x: n.x / TILE, y: 1.4, z: n.y / TILE, col: 0x8ad8c0, r: 6, i: 1 });
  }
  for (const f of G.foes) {
    const m = regGet(f, () => makeFoe3D(f)); placeEnt(m, f); animFoe(m, f, dt, t);
    if (f.def.light && !f.dead) lightsList.push({ x: f.x / TILE, y: 1.2, z: f.y / TILE, col: new THREE.Color(f.def.light).getHex(), r: f.def.boss ? 8 : 4.5, i: f.def.boss ? 1.6 : 1 });
  }
  // hero lights
  const ho = P.orhun, hh = P.handan, mh = S3.ents.get(hh);
  R.heroL.orhun.position.set(ho.x / TILE, 2.2, ho.y / TILE + .3); R.heroL.orhun.intensity = ho.dead ? 0 : .5;
  if (mh && mh.tip) { const v = new THREE.Vector3(); mh.tip.getWorldPosition(v); R.heroL.handan.position.copy(v); } else R.heroL.handan.position.set(hh.x / TILE, 2, hh.y / TILE);
  R.heroL.handan.intensity = hh.dead ? 0 : .95 + Math.sin(t * 3) * .08;
  // fx meshes
  drawFx3D(R, dt, t, lightsList);
  // point light pool
  lightsList.sort((a, b) => (b.pri ? 1 : 0) - (a.pri ? 1 : 0) || (Math.hypot(a.x - fx, a.z - fz) - Math.hypot(b.x - fx, b.z - fz)));
  R.pool.forEach((l, i) => { const s = lightsList[i]; if (s && Math.hypot(s.x - fx, s.z - fz) < 30) { l.position.set(s.x, s.y, s.z); l.color.setHex(s.col); l.distance = s.r; l.intensity = s.i; } else l.intensity = 0; });
  regSweep();
  R.renderer.render(R.scene, R.camera);
  drawOverlay(dt, t);
}

var _fxMat = {};
function fxMesh(obj, make) { return regGet(obj, () => { const m = make(); m.parent = r3().fxRoot; return m; }); }
function ringMat(color, op = 1) { return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }); }
function drawFx3D(R, dt, t, lightsList) {
  const flat = g => { g.rotation.x = -Math.PI / 2; return g; };
  // telegraphs
  for (const tl of G.teles) {
    const m = fxMesh(tl, () => {
      const g = new THREE.Group();
      const col = new THREE.Color(tl.col).getHex();
      const ring = flat(new THREE.Mesh(new THREE.RingGeometry(.94, 1, 56), ringMat(col, .95)));
      const fill = flat(new THREE.Mesh(new THREE.CircleGeometry(1, 48), ringMat(col, .14)));
      const prog = flat(new THREE.Mesh(new THREE.CircleGeometry(1, 48), ringMat(col, .3)));
      g.add(ring, fill, prog); return { g, prog, mats: [ring.material, fill.material, prog.material] };
    });
    const r = tl.r / TILE; m.g.position.set(tl.x / TILE, .06, tl.y / TILE); m.g.scale.set(r, 1, r);
    const u = tl.t / tl.dur; m.prog.scale.set(Math.max(.01, u), Math.max(.01, u), 1);
  }
  for (const p of G.pools) {
    const m = fxMesh(p, () => { const g = new THREE.Group(); const d = flat(new THREE.Mesh(new THREE.CircleGeometry(1, 40), ringMat(0x46c850, .35))); const r2 = flat(new THREE.Mesh(new THREE.RingGeometry(.9, 1, 40), ringMat(0x9aff8a, .6))); g.add(d, r2); g.add(glow(0x7aff6a, 2, null, .3, .35)); return { g, d, mats: [d.material, r2.material] }; });
    const r = p.r / TILE, a = Math.min(1, p.t * 3, (p.dur - p.t) * 2);
    m.g.position.set(p.x / TILE, .05, p.y / TILE); m.g.scale.set(r, 1, r); m.d.material.opacity = .35 * a;
    lightsList.push({ x: p.x / TILE, y: .6, z: p.y / TILE, col: 0x5aff6a, r: 3.5, i: .7 * a });
  }
  // target rings
  const ringFor = (key, e, col) => {
    if (!e || e.dead) return;
    const m = fxMesh(key, () => { const rg = flat(new THREE.Mesh(new THREE.RingGeometry(.86, 1, 40, 1, 0, Math.PI * 1.7), ringMat(col, .9))); const g = new THREE.Group(); g.add(rg); return { g, rg, mats: [rg.material] }; });
    const r = ((e.r || 10) + 8) / TILE; m.g.position.set(e.x / TILE, .07, e.y / TILE); m.g.scale.set(r, 1, r); m.g.rotation.y = t * 1.5; m.rg.material.color.setHex(col);
  };
  if (G.target && !G.target.dead) ringFor('tgt', G.target, G.target.team === 'foe' ? (G.target.aggro ? 0xff5a4a : 0xffd86a) : 0x7dffb0);
  if (G.coop && P.handan.target) ringFor('tgt2', P.handan.target, 0x46c495);
  for (const h of (G.coop ? heroes() : [ctrlHero()])) if (!h.dead) {
    const m = fxMesh('sel' + h.key, () => { const rg = flat(new THREE.Mesh(new THREE.RingGeometry(.3, .36, 32), ringMat(h.key === 'orhun' ? 0xe0a64e : 0x46c495, .7))); const g = new THREE.Group(); g.add(rg); return { g, mats: [rg.material] }; });
    m.g.position.set(h.x / TILE, .05, h.y / TILE);
  }
  if (G.moveTo && !G.moveTo.npc && !G.moveTo.foe) { const m = fxMesh('mv', () => { const rg = flat(new THREE.Mesh(new THREE.RingGeometry(.15, .22, 20), ringMat(0xffffff, .6))); const g = new THREE.Group(); g.add(rg); return { g, mats: [rg.material] }; }); m.g.position.set(G.moveTo.x / TILE, .05, G.moveTo.y / TILE); }
  // shields
  for (const h of heroes()) {
    const ward = h.buffs.some(b => b.id === 'ward'), iron = h.buffs.some(b => b.id === 'ironhide');
    if (!h.dead && (ward || iron)) {
      const m = fxMesh('sh' + h.key, () => { const s = new THREE.Mesh(gSph(.6, 20, 14), new THREE.MeshBasicMaterial({ color: 0x8affe0, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending })); const g = new THREE.Group(); g.add(s); return { g, s, mats: [s.material] }; });
      m.g.position.set(h.x / TILE, .8, h.y / TILE); m.g.scale.set(1, 1.5, 1); m.s.material.color.setHex(ward ? 0x8affe0 : 0x9fc3ee); m.s.material.opacity = .12 + Math.sin(t * 4) * .04;
    }
  }
  // projectiles
  for (const p of G.proj) {
    const m = fxMesh(p, () => { const g = new THREE.Group(); const c = new THREE.Color(p.col).getHex(); const s = new THREE.Mesh(gSph(.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); g.add(s); g.add(glow(c, .9, null, 0, 1)); return { g, mats: [s.material] }; });
    m.g.position.set(p.x / TILE, 1.05, (p.y + 20) / TILE);
    lightsList.push({ x: p.x / TILE, y: 1, z: (p.y + 20) / TILE, col: new THREE.Color(p.col).getHex(), r: 3, i: .8 });
  }
  // rings / slashes / vines
  for (const f of G.fx) {
    const u = f.t / f.dur;
    if (f.k === 'ring') {
      const m = fxMesh(f, () => { const rg = flat(new THREE.Mesh(new THREE.RingGeometry(.88, 1, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(f.col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))); const g = new THREE.Group(); g.add(rg); return { g, rg, mats: [rg.material] }; });
      const r = f.r / TILE * (.3 + u * .7); m.g.position.set(f.x / TILE, .15, f.y / TILE); m.g.scale.set(r, 1, r); m.rg.material.opacity = (1 - u) * .6;
      if (f.r > 60) lightsList.push({ x: f.x / TILE, y: 1.5, z: f.y / TILE, col: new THREE.Color(f.col).getHex(), r: f.r / TILE * 2, i: 1.2 * (1 - u), pri: true });
    } else if (f.k === 'slash' || f.k === 'spin') {
      const m = fxMesh(f, () => { const rg = flat(new THREE.Mesh(new THREE.RingGeometry(.75, 1, 24, 1, 0, f.k === 'spin' ? Math.PI * 1.6 : Math.PI * .7), new THREE.MeshBasicMaterial({ color: f.big ? 0xffb08a : 0xf4f6ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))); const g = new THREE.Group(); g.add(rg); return { g, rg, mats: [rg.material] }; });
      const r = f.k === 'spin' ? f.r / TILE : (f.big ? .8 : .55);
      m.g.position.set(f.x / TILE, f.k === 'spin' ? .7 : 1.0, (f.y + (f.k === 'spin' ? 14 : 16)) / TILE); m.g.scale.set(r, 1, r); m.g.rotation.y = (f.a || 0) + u * 5; m.rg.material.opacity = 1 - u;
    } else if (f.k === 'vines' && f.e && !f.e.dead) {
      const m = fxMesh(f, () => { const g = new THREE.Group(); const mt = new THREE.MeshStandardMaterial({ color: 0x5a9a3a, roughness: .8 }); for (let k = 0; k < 6; k++) { const v = new THREE.Mesh(gCone(.05, .55, 4), mt); const a = k / 6 * Math.PI * 2; v.position.set(Math.cos(a) * .32, .2, Math.sin(a) * .32); v.rotation.z = Math.cos(a) * -.5; v.rotation.x = Math.sin(a) * .5; g.add(v); } return { g, mats: [mt] }; });
      m.g.position.set(f.e.x / TILE, 0, f.e.y / TILE); const s = Math.min(1, f.t * 5, (f.dur - f.t) * 2); m.g.scale.set(1, s, 1);
    }
  }
  // particles
  const pos = R.points.geometry.attributes.position.array, col = R.points.geometry.attributes.color.array;
  let n = 0; const C = new THREE.Color();
  for (const f of G.fx) {
    if (f.k !== 'p' || n >= R.MAXP) continue;
    const a = 1 - f.t / f.dur;
    pos[n * 3] = f.x / TILE; pos[n * 3 + 1] = .8 + (f.y0 === undefined ? (f.y0 = f.y, 0) : (f.y0 - f.y) / TILE * 1.1); pos[n * 3 + 2] = f.y0 / TILE + .3;
    C.set(f.col); col[n * 3] = C.r * a; col[n * 3 + 1] = C.g * a; col[n * 3 + 2] = C.b * a; n++;
  }
  R.points.geometry.setDrawRange(0, n);
  R.points.geometry.attributes.position.needsUpdate = true; R.points.geometry.attributes.color.needsUpdate = true;
}

/* ---------- 2D overlay (names, numbers, bubbles) ---------- */
function drawOverlay(dt, t) {
  const g = ctx; g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
  if (!G.started) { const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); return; }
  const c = ctrlHero();
  for (const f of G.foes) {
    if (f.dead || f.def.boss || !(f.aggro || f === G.target || f === P.handan.target)) continue;
    const hh = unitHeight(f), s = toScreen(f.x, f.y, hh + .35); if (!s.vis) continue;
    const w = f.def.elite ? 50 : 38;
    g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(s.x - w / 2 - 1, s.y - 1, w + 2, 6);
    g.fillStyle = f.aggro ? '#d23a2c' : '#c0a040'; g.fillRect(s.x - w / 2, s.y, w * f.hp / f.maxHp, 4);
    if (f.def.elite) { g.strokeStyle = '#e0a64e'; g.lineWidth = 1; g.strokeRect(s.x - w / 2 - 1.5, s.y - 1.5, w + 3, 7); }
    if (f === G.target) textOutlined(g, f.name, s.x, s.y - 5, '#ffd8c8', 12);
    if (f.buffs.some(b => b.mods && b.mods.stun)) textOutlined(g, '✦ ✦', s.x, s.y - 18, '#ffe6a8', 12);
  }
  for (const f of G.foes) if (!f.dead && f.bs && f.bs.cast) {
    const cst = f.bs.cast, s = toScreen(f.x, f.y, unitHeight(f) + .8), w = 90;
    g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(s.x - w / 2 - 1, s.y - 1, w + 2, 8); g.fillStyle = '#e0a64e'; g.fillRect(s.x - w / 2, s.y, w * (1 - cst.t / cst.dur), 6);
    textOutlined(g, cst.name, s.x, s.y - 5, '#ffd86a', 13);
  }
  if (G.inCombat) for (const h of heroes()) { if (h.dead) continue; const s = toScreen(h.x, h.y, 2.05), w = 34; g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(s.x - w / 2 - 1, s.y - 1, w + 2, 5); g.fillStyle = h.hp / h.maxHp < .35 ? '#e2705e' : '#5fc35a'; g.fillRect(s.x - w / 2, s.y, w * h.hp / h.maxHp, 3); }
  if (G.coop) for (const h of heroes()) if (!h.dead) { const s = toScreen(h.x, h.y, G.inCombat ? 2.4 : 2.1); textOutlined(g, h.key === 'orhun' ? 'P1' : 'P2', s.x, s.y, h.key === 'orhun' ? '#e0a64e' : '#46c495', 11); }
  for (const n of G.npcs) {
    const m = npcMarker(n.id); if (!m) continue;
    const s = toScreen(n.x, n.y, 2.35 + Math.sin(t * 3) * .07);
    g.font = '700 26px "Almendra", serif'; g.textAlign = 'center';
    g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(m.ch, s.x, s.y);
    g.fillStyle = m.col; g.shadowColor = m.col; g.shadowBlur = 10; g.fillText(m.ch, s.x, s.y); g.shadowBlur = 0;
  }
  const nb = nearestBeacon();
  if (nb && !G.beacons[nb.id] && G.bossDead[{ b1: 'gnarl', b2: 'witch', b3: 'king' }[nb.id]]) { const s = toScreen((nb.x + .5) * TILE, (nb.y + .5) * TILE, 3); textOutlined(g, 'Press E to relight the beacon', s.x, s.y, '#c9f5df', 14); }
  const nn = nearestNpc();
  if (nn && !G.dialog) { const s = toScreen(nn.x, nn.y, -.1); textOutlined(g, 'E  Talk to ' + NPCS[nn.id].name, s.x, s.y + 16, '#f2e6c8', 12); }
  for (const b of G.barks) {
    b.t += dt; if (b.e.dead) continue;
    const a = Math.min(1, b.t * 4, (b.dur - b.t) * 3), s = toScreen(b.e.x, b.e.y, 2.5);
    g.globalAlpha = a; g.font = '500 13px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
    const txt = b.text.length > 40 ? b.text.slice(0, 39) + '…' : b.text;
    const w = Math.min(260, g.measureText(txt).width + 18);
    g.fillStyle = 'rgba(12,14,20,.92)'; g.strokeStyle = b.e.key === 'orhun' ? '#e0a64e' : '#46c495'; g.lineWidth = 1;
    roundRect(g, s.x - w / 2, s.y - 17, w, 24, 6); g.fill(); g.stroke();
    g.fillStyle = '#f2ead6'; g.fillText(txt, s.x, s.y); g.globalAlpha = 1;
  }
  G.barks = G.barks.filter(b => b.t < b.dur);
  for (const tx of G.texts) {
    if (tx.y0 === undefined) tx.y0 = tx.y;
    const rise = (tx.y0 - tx.y) / TILE;
    const s = toScreen(tx.x, tx.y0 + 40, 1.6 + rise * .9);
    const a = 1 - Math.max(0, (tx.t - tx.dur * .6) / (tx.dur * .4));
    g.globalAlpha = a; g.font = `800 ${Math.round(14 * tx.size)}px "Alegreya Sans", sans-serif`; g.textAlign = 'center';
    g.lineWidth = 3.5; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(tx.text, s.x, s.y); g.fillStyle = tx.col; g.fillText(tx.text, s.x, s.y);
    g.globalAlpha = 1;
  }
  for (const f of G.fx) if (f.k === 'flash') { g.fillStyle = `rgba(200,255,230,${.45 * (1 - f.t / f.dur)})`; g.fillRect(0, 0, W, H); }
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  if (!c.dead && c.hp / c.maxHp < .3) { const a = .25 + Math.sin(t * 6) * .1; const lg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .7); lg.addColorStop(0, 'rgba(120,0,0,0)'); lg.addColorStop(1, `rgba(150,10,0,${a})`); g.fillStyle = lg; g.fillRect(0, 0, W, H); }
}

/* ---------- Portraits rendered from the 3D models ---------- */
var PORT = {};
function renderModelImage(who, full) {
  const key = who + (full ? ':full' : ':head');
  if (PORT[key]) return PORT[key];
  const R = r3();
  const SZ = full ? [256, 384] : [256, 256];
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xc8d0ff, 0x302820, 1.0));
  const key1 = new THREE.DirectionalLight(0xffe8d0, 1.1); key1.position.set(2, 3, 4); sc.add(key1);
  const rim = new THREE.DirectionalLight(who === 'handan' ? 0x66ffcc : 0xffb060, .9); rim.position.set(-3, 2, -2); sc.add(rim);
  let m, hgt;
  if (FOES[who]) { m = makeFoe3D({ def: FOES[who], x: 0, y: 0, t: 0 }); hgt = m.h; m.g.scale.setScalar(1); hgt = m.h / (FOES[who].scale || 1); }
  else { m = makeHumanoid(who); hgt = 1.75; }
  sc.add(m.g);
  if (m.armR) { m.armR.rotation.x = full ? -.15 : 0; }
  const cam = new THREE.PerspectiveCamera(full ? 30 : 26, SZ[0] / SZ[1], .1, 50);
  if (full) { cam.position.set(.9, hgt * .62, 4.2); cam.lookAt(0, hgt * .5, 0); }
  else if (FOES[who]) { cam.position.set(.5, hgt * .75, hgt * 1.25 + .6); cam.lookAt(0, hgt * .62, 0); }
  else { cam.position.set(.35, 1.4, 1.35); cam.lookAt(0, 1.3, 0); }
  m.g.rotation.y = full ? .25 : .3;
  const rt = new THREE.WebGLRenderTarget(SZ[0], SZ[1], { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const prevBg = sc.background; sc.background = null;
  R.renderer.setRenderTarget(rt); R.renderer.setClearColor(0x000000, 0); R.renderer.clear();
  R.renderer.render(sc, cam);
  const buf = new Uint8Array(SZ[0] * SZ[1] * 4);
  R.renderer.readRenderTargetPixels(rt, 0, 0, SZ[0], SZ[1], buf);
  R.renderer.setRenderTarget(null); R.renderer.setClearColor(0x000000, 1);
  rt.dispose();
  const out = document.createElement('canvas'); out.width = SZ[0]; out.height = SZ[1];
  const og = out.getContext('2d'), id = og.createImageData(SZ[0], SZ[1]);
  for (let y = 0; y < SZ[1]; y++) id.data.set(buf.subarray((SZ[1] - 1 - y) * SZ[0] * 4, (SZ[1] - y) * SZ[0] * 4), y * SZ[0] * 4);
  og.putImageData(id, 0, 0);
  PORT[key] = out; return out;
}
function drawPortrait(canvas, who) {
  const g = canvas.getContext('2d'); const w = canvas.width, h = canvas.height;
  const grd = g.createRadialGradient(w / 2, h * .62, 2, w / 2, h * .62, w * .75);
  grd.addColorStop(0, who === 'handan' ? '#1d5a48' : who === 'orhun' ? '#5a3e1a' : FOES[who] ? '#4a1a2a' : '#2e2e44'); grd.addColorStop(1, '#0b0e14');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  try { const img = renderModelImage(who, false); g.imageSmoothingEnabled = true; g.drawImage(img, 0, 0, w, h); } catch (e) { console.error(e); }
}
function drawTitleHeroes() {
  for (const [id, k] of [['tOrhun', 'orhun'], ['tHandan', 'handan']]) {
    const c = $(id); c.width = 192; c.height = 288; const g = c.getContext('2d'); g.clearRect(0, 0, 192, 288);
    try { g.drawImage(renderModelImage(k, true), 0, 0, 192, 288); } catch (e) { console.error(e); }
  }
}

/* ===================== WARDROBE, POSES, PHOTO MODE and the STARLIT GLADE =====================
   Appearance options for both heroes and Lumen (2D + 3D), couple poses usable anywhere out of combat,
   a photo mode that saves pictures, and a peaceful zone south of Lanternhold with things to do together. */

/* ---------- Wardrobe data ---------- */
const WARD_KEY = 'jadeborn_wardrobe';
const WARD_DEF = { orhun: { hair: 'wavy', hairC: 0, beard: 'goatee', skin: 0, dye: -1, accent: -1, cape: -1, head: 'none' }, handan: { hair: 'long', hairC: 0, skin: 0, dye: -1, accent: -1, cape: -1, head: 'none' }, fox: { v: 0 }, unlocked: {} };
let WARD = (() => { const s = load(WARD_KEY) || {}; const o = JSON.parse(JSON.stringify(WARD_DEF)); for (const k in o) Object.assign(o[k], s[k] || {}); return o; })();
const HAIR_STYLES = { orhun: [['wavy', 'Wavy'], ['short', 'Short'], ['long', 'Long'], ['hood', 'Hooded']], handan: [['long', 'Long'], ['short', 'Short'], ['hood', 'Hooded']] };
const HAIR_COLS = { orhun: ['#4a2e1e', '#141419', '#7a4a26', '#a0582a', '#c8a060', '#b8b8c0'], handan: ['#121218', '#4a2e1e', '#7a3a24', '#c8a060', '#5a3a6a', '#d8d8e0'] };
const SKIN_SHIFT = [0, 16, -16, -34];
const DYES = ['#7a2a24', '#24406a', '#2a5a3a', '#5a3a6a', '#d8d0c0', '#1a1a20', '#8a6a2a', '#2a6a6a'];
const ACCENTS = ['#e0a64e', '#cfd6e0', '#46c495', '#c0587a', '#7a9ad8', '#b07ae8'];
const HEADWEAR = { orhun: [['none', 'None'], ['circlet', 'Circlet'], ['band', 'Headband']], handan: [['none', 'None'], ['flowers', 'Flower crown'], ['circlet', 'Circlet']] };
const FOX_VARIANTS = [['Jade', 0], ['Ember', -133], ['Frost', 42], ['Dusk', 112], ['Gold', -113], ['Rose', 177]];
function wardSave() { store(WARD_KEY, WARD); wardBust(); }
function wardHash(key) { const s = JSON.stringify(WARD[key]); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
function wardApply(key, L) {
  const w = WARD[key]; if (!w) return L;
  const o = Object.assign({}, L);
  o.hairStyle = w.hair;
  if (w.hair === 'hood') o.hood = w.cape >= 0 ? shade(DYES[w.cape], -10) : w.dye >= 0 ? shade(DYES[w.dye], -20) : key === 'orhun' ? '#3a3226' : '#1e3a32';
  if (w.hairC) { o.hair = HAIR_COLS[key][w.hairC]; o.hairHi = shade(o.hair, 30); }
  if (key === 'orhun') { o.beard = w.beard === 'none' ? null : w.beard; if (o.beard) o.beardC = shade(o.hair || L.hair, 10); }
  if (w.skin) { o.skin = shade(L.skin, SKIN_SHIFT[w.skin]); if (L.shade) o.shade = shade(L.shade, SKIN_SHIFT[w.skin]); }
  if (w.dye >= 0) { o.shirt = DYES[w.dye]; o.shirtHi = shade(DYES[w.dye], 18); if (key === 'handan') o.pants = DYES[w.dye]; }
  if (w.accent >= 0) { const a = ACCENTS[w.accent]; if (key === 'orhun') o.pauldron = a; else o.trim = a; o.buckle = a; }
  o.cape = w.cape >= 0 ? DYES[w.cape] : null;
  o.headwear = w.head !== 'none' ? w.head : null;
  return o;
}
function wardBust() {
  for (const h of [P.orhun, P.handan]) if (h) { h._wl = null; }
  if (typeof S3 !== 'undefined' && S3.ents) for (const k of [P.fox, 'mount']) { const m = S3.ents.get(k); if (m) { if (m.g.parent) m.g.parent.remove(m.g); S3.ents.delete(k); } }
  if (typeof PORT !== 'undefined') for (const k of ['orhun', 'handan']) { delete PORT[k + ':full']; delete PORT[k + ':head']; }
  try { renderParty && $('party').children.length && [...$('party').children].forEach((d, i) => drawPortrait(d.querySelector('canvas'), i ? 'handan' : 'orhun')); } catch (e) { }
}

/* 2D: looks, capes and headwear */
const _hl7 = heroLook;
heroLook = function (h) {
  const base = _hl7(h), ws = wardHash(h.key);
  if (h._wl && h._wlBase === base && h._wlSig === ws) return h._wl;
  const L = wardApply(h.key, base); L.sig = base.sig + '~' + ws;
  h._wl = L; h._wlBase = base; h._wlSig = ws; return L;
};
const _hs7 = heroSprite;
heroSprite = function (key, look, dir, frame) {
  if (!look || (!look.cape && !look.headwear)) return _hs7(key, look, dir, frame);
  const ck = 'W' + key + dir + frame;
  if (spriteCache.has(ck)) return spriteCache.get(ck);
  const base = _hs7(key, look, dir, frame);
  const c = document.createElement('canvas'); c.width = 20; c.height = 26; const g = c.getContext('2d');
  const p = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x + 2, y + 1, w, h); };
  if (look.cape) { const cc = look.cape, cd = shade(cc, -28); if (dir === 1) { p(cc, 5, 9, 8, 12); p(cd, 5, 19, 8, 2); } else if (dir === 2) { p(cc, 3, 9, 3, 11); p(cd, 3, 18, 3, 2); } else { p(cd, 4, 10, 1, 9); p(cd, 13, 10, 1, 9); } }
  g.drawImage(base, 0, 0);
  if (look.headwear === 'flowers') { const fl = ['#f4a0c0', '#fff2b0', '#a8d8ff', '#f4a0c0', '#c8f0a0']; p('#4a8a3a', 5, 1, 8, 1); for (let i = 0; i < 5; i++) p(fl[i], 5 + i * 2 - (i > 3 ? 1 : 0), 0); }
  else if (look.headwear === 'circlet') { p('#e0a64e', 5, 2, 8, 1); p('#7dffc8', 9, 2); }
  else if (look.headwear === 'band') { p('#8a2a24', 5, 2, 8, 1); if (dir !== 0) p('#8a2a24', 4, 3, 1, 3); }
  spriteCache.set(ck, c); return c;
};
const _fox7 = drawFox;
drawFox = function (g, e) { const v = FOX_VARIANTS[WARD.fox.v] || FOX_VARIANTS[0]; if (!v[1]) return _fox7(g, e); g.save(); g.filter = `hue-rotate(${v[1]}deg)`; _fox7(g, e); g.restore(); };

/* 3D: looks, capes, headwear, fox colours */
if (typeof look3D === 'function') {
  const _l3 = look3D;
  look3D = function (key) { const L = _l3(key); return key === 'orhun' || key === 'handan' ? wardApply(key, L) : L; };
  const _hg3 = heroGear3D;
  heroGear3D = function (h) { const g = _hg3(h); g.sig += '~' + wardHash(h.key); return g; };
  const _mh3 = makeHumanoid;
  makeHumanoid = function (key, gear) {
    const w = WARD[key];
    if (w && gear) { gear = { ...gear }; if (w.dye >= 0) gear.tint = null; if (w.accent >= 0) gear.ar = -1; }
    const m = _mh3(key, gear);
    if (!w) return m;
    const mats = m.mats || (m.mats = []);
    if (w.cape >= 0) { const cm = uMat(DYES[w.cape], { roughness: .85, side: THREE.DoubleSide }); mats.push(cm); const cape = mesh(gBox(.44, .78, .025), cm, 0, .72, -.2, m.body); cape.rotation.x = .12; m.cape3 = cape; }
    const head = m.head;
    if (head && w.head === 'circlet') { const t = mesh(gTor(.165, .018, 6, 20), uMat('#e0a64e', { metalness: .8, roughness: .3 }), 0, .09, 0, head); t.rotation.x = Math.PI / 2; mesh(gSph(.025, 8, 6), uMat('#7dffc8', { emissive: 0x2affa0, emissiveIntensity: 1.2 }), 0, .09, .17, head); }
    if (head && w.head === 'band') { const t = mesh(gTor(.17, .025, 6, 20), uMat('#8a2a24'), 0, .07, 0, head); t.rotation.x = Math.PI / 2; }
    if (head && w.head === 'flowers') { const fl = ['#f4a0c0', '#fff2b0', '#a8d8ff', '#f4a0c0', '#c8f0a0', '#ffb0d0', '#fff2b0', '#a8d8ff']; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; mesh(gSph(.035, 8, 6), uMat(fl[i], { emissive: fl[i], emissiveIntensity: .25 }), Math.cos(a) * .17, .11, Math.sin(a) * .17, head).castShadow = false; } }
    return m;
  };
  const _fx3 = makeFox3D;
  makeFox3D = function () {
    const m = _fx3(), v = FOX_VARIANTS[WARD.fox.v] || FOX_VARIANTS[0];
    if (v[1]) m.g.traverse(o => { if (o.material && !o.material.userData.wv) { o.material = o.material.clone(); o.material.userData.wv = 1; o.material.color.offsetHSL(v[1] / 360, 0, 0); if (o.material.emissive) o.material.emissive.offsetHSL(v[1] / 360, 0, 0); } });
    return m;
  };
}

/* ---------- Wardrobe window ---------- */
let wardTab = 'orhun';
function openWardrobe() {
  let w = $('winWardrobe'); if (!w) { w = document.createElement('div'); w.id = 'winWardrobe'; w.className = 'win'; document.body.appendChild(w); }
  w.hidden = false; refreshWardrobe();
}
function refreshWardrobe() {
  const w = $('winWardrobe'); if (!w || w.hidden) return;
  const k = wardTab, o = WARD[k];
  const sw = (field, list, cur, none) => `${none ? `<button class="wsw none ${cur < 0 ? 'on' : ''}" data-f="${field}" data-v="-1">${none}</button>` : ''}${list.map((c, i) => `<button class="wsw ${cur === i ? 'on' : ''}" data-f="${field}" data-v="${i}" style="background:${c}" aria-label="colour ${i + 1}"></button>`).join('')}`;
  const opts = (field, list, cur) => list.map(([v, n]) => `<button class="btn ${cur === v ? 'on' : ''}" data-f="${field}" data-s="${v}">${n}</button>`).join('');
  let body = '';
  if (k === 'fox') body = `<div class="wrow"><b>Lumen's colour</b><div class="wopts">${FOX_VARIANTS.map(([n], i) => `<button class="btn ${WARD.fox.v === i ? 'on' : ''}" data-f="fv" data-v="${i}">${n}</button>`).join('')}</div></div>`;
  else body = `
    <div class="wrow"><b>Hair</b><div class="wopts">${opts('hair', HAIR_STYLES[k], o.hair)}</div></div>
    <div class="wrow"><b>Hair colour</b><div class="wopts">${sw('hairC', HAIR_COLS[k], o.hairC)}</div></div>
    ${k === 'orhun' ? `<div class="wrow"><b>Beard</b><div class="wopts">${opts('beard', [['goatee', 'Goatee'], ['full', 'Full'], ['none', 'Clean']], o.beard)}</div></div>` : ''}
    <div class="wrow"><b>Skin tone</b><div class="wopts">${sw('skin', SKIN_SHIFT.map(s => shade(LOOKS[k].skin, s)), o.skin)}</div></div>
    <div class="wrow"><b>Outfit dye</b><div class="wopts">${sw('dye', DYES, o.dye, 'Armour')}</div></div>
    <div class="wrow"><b>Accents</b><div class="wopts">${sw('accent', ACCENTS, o.accent, 'Armour')}</div></div>
    <div class="wrow"><b>Cape</b><div class="wopts">${sw('cape', DYES, o.cape, 'None')}</div></div>
    <div class="wrow"><b>Headwear</b><div class="wopts">${opts('head', HEADWEAR[k].filter(([v]) => v !== 'flowers' || WARD.unlocked.flowers), o.head)}${k === 'handan' && !WARD.unlocked.flowers ? '<span class="whint">Pick flowers in the Starlit Glade for a flower crown</span>' : ''}</div></div>`;
  w.innerHTML = `<h2>Wardrobe <button class="x" data-close="winWardrobe" aria-label="Close">×</button></h2>
    <div class="ctabs">${[['orhun', 'Orhun'], ['handan', 'Handan'], ['fox', 'Lumen']].map(([v, n]) => `<button class="btn ${k === v ? 'on' : ''}" data-wt="${v}">${n}</button>`).join('')}</div>
    <div class="wgrid"><div class="wprev"><canvas id="wardPrev" width="240" height="320"></canvas><button class="btn" id="wardReset">Reset</button></div><div class="wbody">${body}</div></div>`;
  w.querySelectorAll('[data-wt]').forEach(b => b.onclick = () => { wardTab = b.dataset.wt; refreshWardrobe(); });
  w.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
    const f = b.dataset.f;
    if (f === 'fv') WARD.fox.v = +b.dataset.v;
    else if (b.dataset.s !== undefined) WARD[k][f] = b.dataset.s;
    else WARD[k][f] = +b.dataset.v;
    if (f === 'hairC' || f === 'skin') WARD[k][f] = Math.max(0, WARD[k][f]);
    sfx('ui'); wardSave(); refreshWardrobe();
  });
  $('wardReset').onclick = () => { if (k === 'fox') WARD.fox = { v: 0 }; else WARD[k] = JSON.parse(JSON.stringify(WARD_DEF[k])); wardSave(); refreshWardrobe(); };
  drawWardPreview($('wardPrev'), k);
}
function drawWardPreview(c, k) {
  const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  const grd = g.createRadialGradient(120, 200, 10, 120, 200, 170); grd.addColorStop(0, k === 'handan' ? '#1b4a3c' : k === 'orhun' ? '#4a3418' : '#173a30'); grd.addColorStop(1, '#0b0e14'); g.fillStyle = grd; g.fillRect(0, 0, c.width, c.height);
  if (k === 'fox') { g.save(); g.translate(120, 230); g.scale(6, 6); drawFox(g, { x: 0, y: 0, t: performance.now() / 1000, face: 1, moving: false }); g.restore(); return; }
  if (typeof renderModelImage === 'function' && typeof THREE !== 'undefined') { try { const img = renderModelImage(k, true); g.drawImage(img, 0, 0, c.width, c.height); return; } catch (e) { } }
  const L = wardApply(k, heroLook(P[k]));
  g.imageSmoothingEnabled = false;
  g.drawImage(heroSprite(k + 'prev' + wardHash(k), L, 0, 0), 2, 0, 16, 25, 72, 40, 96, 150 * 1.6);
}

/* ---------- Couple poses ---------- */
const POSES = { hug: 'Hug', hands: 'Hold hands', sit: 'Sit together', dance: 'Dance', wave: 'Wave', stargaze: 'Stargaze' };
function startPose(type, at, dirOverride) {
  if (G.inCombat) { toast('Not in the middle of a fight!'); return; }
  if (G.mounted) mountToggle();
  const o = P.orhun, h = P.handan; if (o.dead || h.dead) return;
  const c = at || { x: (o.x + h.x) / 2, y: (o.y + h.y) / 2 };
  const gap = { hug: 7, hands: 12, sit: 13, dance: 18, wave: 14, stargaze: 12 }[type] || 12;
  o.x = c.x - gap; o.y = c.y; h.x = c.x + gap; h.y = c.y;
  G.pose = { type, x: c.x, y: c.y, t: 0, heartT: .3, dir: dirOverride };
  G.moveTo = null; o.moving = h.moving = false;
  if (type === 'stargaze') { banner('Stargazing', 'Make a wish'); }
  const lines = POSE_LINES[type]; if (lines) { const l = pick(lines); setTimeout(() => { if (G.pose) bark(l[0], l[1]); }, 700); }
}
const POSE_LINES = {
  hug: [['handan', 'Stay a little longer.'], ['orhun', 'I could stand here all night.'], ['handan', 'You smell like campfire. I like it.']],
  hands: [['orhun', 'Your hands are always cold.'], ['handan', 'That is why I keep yours.']],
  sit: [['handan', 'It is so quiet here.'], ['orhun', 'Best seat in all of Velmara.'], ['handan', 'Tell me something nobody else knows.']],
  dance: [['orhun', 'I warned you, I only know one dance.'], ['handan', 'Then we will dance it forever.']],
  wave: [['orhun', 'Smile for the lantern!'], ['handan', 'Hello, whoever is watching!']],
  stargaze: [['handan', 'That one is ours. The bright one, next to the small one.'], ['orhun', 'Did you see that? A falling star. Make a wish.'], ['handan', 'I already have everything I wished for.']],
};
function endPose() { if (!G.pose) return; G.pose = null; for (const h of [P.orhun, P.handan]) { h.swingT = 0; } }
const _hai7 = heroAI; heroAI = function (h, dt) { if (G.pose) { h.moving = false; return; } return _hai7(h, dt); };
function poseTick(dt) {
  const ps = G.pose; if (!ps) return;
  const v = inputVec(1);
  if (G.inCombat || v[0] || v[1] || G.moveTo || P.orhun.dead || P.handan.dead) { endPose(); return; }
  ps.t += dt;
  const o = P.orhun, h = P.handan;
  for (const x of [o, h]) x.moving = false;
  if (ps.type === 'hug') { o.dir = h.dir = 2; o.face = 1; h.face = -1; }
  else if (ps.type === 'hands' || ps.type === 'wave') { o.dir = h.dir = 0; if (ps.type === 'wave' && Math.floor(ps.t * 2) % 2 === 0) { o.swingT = .2; h.swingT = .2; } }
  else if (ps.type === 'sit' || ps.type === 'stargaze') { o.dir = h.dir = ps.dir !== undefined ? ps.dir : 0; }
  else if (ps.type === 'dance') { const k = Math.floor(ps.t * 2.5); o.dir = h.dir = 2; o.face = k % 2 ? 1 : -1; h.face = -o.face; o.x = ps.x - 18 + Math.sin(ps.t * 3) * 6; h.x = ps.x + 18 - Math.sin(ps.t * 3) * 6; o.y = h.y = ps.y + Math.cos(ps.t * 3) * 4; }
  ps.heartT -= dt;
  if (ps.heartT <= 0 && ps.type !== 'wave') { ps.heartT = ps.type === 'hug' ? .7 : 1.4; svHearts(ps.x, ps.y - 46, 1); }
  if (ps.type === 'stargaze' && Math.random() < dt * .6) for (let i = 0; i < 10; i++) G.fx.push({ k: 'p', x: G.cam.x + W / ZOOM * (.2 + Math.random() * .6) + i * 6, y: G.cam.y + 40 + i * 3, vx: 120, vy: 20, col: i ? '#dfe6ff' : '#ffffff', t: -i * .02, dur: .7, sz: 3 - i * .2 });
}
// 2D: seated heroes sit a little lower
const _dh7 = drawHero;
drawHero = function (g, h) { if (G.pose && (G.pose.type === 'sit') && !h.dead) { h.y += 6; _dh7(g, h); h.y -= 6; return; } _dh7(g, h); };
// 3D pose animation
if (typeof animHuman === 'function') {
  const _ah7 = animHuman;
  animHuman = function (m, e, dt, t) {
    _ah7(m, e, dt, t);
    const ps = G.pose; if (!ps || !e.hero || e.dead) return;
    const other = e === P.orhun ? P.handan : P.orhun, inner = e === P.orhun ? 1 : -1;
    const face = (x, z) => { m.yaw = Math.atan2(x, z); m.g.rotation.y = m.yaw; };
    m.hipL.rotation.z = m.hipR.rotation.z = 0; m.armL.rotation.z = m.armR.rotation.z = 0;
    if (ps.type === 'hug') { face(other.x - e.x, other.y - e.y); m.armL.rotation.x = m.armR.rotation.x = -1.35; m.armL.rotation.z = .55; m.armR.rotation.z = -.55; m.head.rotation.z = inner * .2; }
    else if (ps.type === 'hands') { face(0, 1); (inner > 0 ? m.armR : m.armL).rotation.z = inner * .45; }
    else if (ps.type === 'sit') { face(ps.dir === 1 ? 0 : 0, ps.dir === 1 ? -1 : 1); m.hipL.rotation.x = m.hipR.rotation.x = -1.45; m.body.position.y = -.3; m.armL.rotation.x = m.armR.rotation.x = -.35; m.head.rotation.z = inner * .12; }
    else if (ps.type === 'dance') { face(other.x - e.x, other.y - e.y); m.body.rotation.y = Math.sin(t * 3) * .5; m.armL.rotation.x = -2.4 + Math.sin(t * 6) * .3; m.armR.rotation.x = -2.4 - Math.sin(t * 6) * .3; m.body.position.y = Math.abs(Math.sin(t * 6)) * .06; }
    else if (ps.type === 'wave') { face(0, 1); m.armR.rotation.x = -2.7; m.armR.rotation.z = Math.sin(t * 9) * .45; }
    else if (ps.type === 'stargaze') { face(0, ps.dir === 1 ? -1 : 1); m.head.rotation.x = -.55; (inner > 0 ? m.armR : m.armL).rotation.z = inner * .4; }
  };
}

/* ---------- Photo mode ---------- */
const PH_FILTERS = [['None', null], ['Warm', [1.08, 1.0, .88]], ['Cool', [.92, 1.0, 1.1]], ['Mono', 'mono'], ['Sepia', 'sepia'], ['Dream', 'dream']];
let photoFilter = 0, photoFrame = true, photoZoom0 = null;
const PHOTOS = [];
function photoOn() {
  if (G.photo) return;
  G.photo = true; closeWindows && closeWindows();
  document.documentElement.classList.add('photo');
  photoZoom0 = typeof S3 !== 'undefined' && S3.dist ? S3.dist : ZOOM;
  let bar = $('photoBar'); if (!bar) { bar = document.createElement('div'); bar.id = 'photoBar'; document.body.appendChild(bar); }
  bar.hidden = false; photoBarHtml();
}
function photoBarHtml() {
  const bar = $('photoBar');
  bar.innerHTML = `<div class="pbRow">${Object.entries(POSES).map(([k, n]) => `<button class="btn ${G.pose && G.pose.type === k ? 'on' : ''}" data-pose="${k}">${n}</button>`).join('')}</div>
    <div class="pbRow"><button class="btn" data-z="-1">Zoom +</button><button class="btn" data-z="1">Zoom −</button><button class="btn" id="pbFilter">Filter: ${PH_FILTERS[photoFilter][0]}</button><button class="btn ${photoFrame ? 'on' : ''}" id="pbFrame">Frame</button><button class="btn primary" id="pbShot">📷 Take photo</button><button class="btn" id="pbExit">Exit</button></div>`;
  bar.querySelectorAll('[data-pose]').forEach(b => b.onclick = () => { const k = b.dataset.pose; if (G.pose && G.pose.type === k) endPose(); else startPose(k); photoBarHtml(); });
  bar.querySelectorAll('[data-z]').forEach(b => b.onclick = () => photoZoom(+b.dataset.z));
  $('pbFilter').onclick = () => { photoFilter = (photoFilter + 1) % PH_FILTERS.length; photoBarHtml(); };
  $('pbFrame').onclick = () => { photoFrame = !photoFrame; photoBarHtml(); };
  $('pbShot').onclick = () => takePhoto();
  $('pbExit').onclick = () => photoOff();
}
function photoZoom(d) {
  if (typeof S3 !== 'undefined' && S3.dist) S3.dist = clamp(S3.dist + d * 1.5, 4.5, 24);
  else ZOOM = clamp(ZOOM - d * .2, .6, 2.6);
}
function photoOff() {
  G.photo = false; document.documentElement.classList.remove('photo');
  if ($('photoBar')) $('photoBar').hidden = true;
  if (typeof S3 !== 'undefined' && S3.dist) S3.dist = photoZoom0 || 16; else ZOOM = (W < 820 || H < 520) ? .78 : 1;
}
function takePhoto() {
  try { render(0); } catch (e) { }
  const src = (typeof r3 === 'function' && typeof THREE !== 'undefined') ? r3().renderer.domElement : cv;
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
  const g = out.getContext('2d'); g.drawImage(src, 0, 0);
  const f = PH_FILTERS[photoFilter][1];
  if (f) {
    const id = g.getImageData(0, 0, out.width, out.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], gg = d[i + 1], b = d[i + 2];
      if (Array.isArray(f)) { r *= f[0]; gg *= f[1]; b *= f[2]; }
      else if (f === 'mono') { r = gg = b = r * .3 + gg * .59 + b * .11; }
      else if (f === 'sepia') { const rr = r * .393 + gg * .769 + b * .189, g2 = r * .349 + gg * .686 + b * .168, b2 = r * .272 + gg * .534 + b * .131; r = rr; gg = g2; b = b2; }
      else if (f === 'dream') { r = r * .9 + 40; gg = gg * .85 + 22; b = b * .9 + 45; }
      d[i] = Math.min(255, r); d[i + 1] = Math.min(255, gg); d[i + 2] = Math.min(255, b);
    }
    g.putImageData(id, 0, 0);
  }
  if (photoFrame) {
    const s = out.width / 1000;
    g.strokeStyle = 'rgba(236,226,201,.85)'; g.lineWidth = 10 * s; g.strokeRect(14 * s, 14 * s, out.width - 28 * s, out.height - 28 * s);
    const vg = g.createRadialGradient(out.width / 2, out.height / 2, out.height * .35, out.width / 2, out.height / 2, out.height * .85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = vg; g.fillRect(0, 0, out.width, out.height);
    g.font = `italic ${Math.round(26 * s)}px "Almendra", Georgia, serif`; g.textAlign = 'right'; g.fillStyle = 'rgba(255,240,210,.92)'; g.shadowColor = '#000'; g.shadowBlur = 8 * s;
    g.fillText(`Orhun & Handan · ${G.zone ? G.zone.name : ''} · ${new Date().toLocaleDateString()}`, out.width - 34 * s, out.height - 36 * s); g.shadowBlur = 0;
    g.font = `${Math.round(20 * s)}px serif`; g.textAlign = 'left'; g.fillText('♥', 34 * s, out.height - 36 * s);
  }
  const url = out.toDataURL('image/jpeg', .9);
  PHOTOS.unshift(url); if (PHOTOS.length > 6) PHOTOS.pop();
  sfx('pickup'); showPhoto(url, out);
}
function showPhoto(url, canvas) {
  let w = $('photoWin'); if (!w) { w = document.createElement('div'); w.id = 'photoWin'; w.className = 'win'; document.body.appendChild(w); }
  w.hidden = false;
  w.innerHTML = `<h2>Photo <button class="x" id="phClose" aria-label="Close">×</button></h2><img src="${url}" alt="Photo of Orhun and Handan"><div class="phBtns"><a class="btn primary" id="phSave" download="jadeborn-${Date.now()}.jpg" href="${url}">Save</a>${navigator.share ? '<button class="btn" id="phShare">Share</button>' : ''}</div><div class="whint">On iPhone, press and hold the photo to add it to Photos.</div>`;
  $('phClose').onclick = () => { w.hidden = true; };
  if ($('phShare')) $('phShare').onclick = () => canvas.toBlob(b => { const file = new File([b], 'jadeborn.jpg', { type: 'image/jpeg' }); navigator.share({ files: [file], title: 'Jadeborn' }).catch(() => { }); }, 'image/jpeg', .9);
}

/* ---------- The Starlit Glade ---------- */
const SPOT_INFO = {
  bench: { label: 'Sit on the bench', pose: 'sit' }, picnic: { label: 'Have a picnic', pose: 'sit' }, dock: { label: 'Sit by the water', pose: 'sit', dir: 1 },
  fire: { label: 'Warm up by the fire', pose: 'sit' }, dance: { label: 'Dance under the lanterns', pose: 'dance' }, scope: { label: 'Look at the stars', pose: 'stargaze', dir: 1 },
  flowers: { label: 'Pick flowers', act: 'flowers' }, swingtree: { label: 'Hug under the old tree', pose: 'hug' },
};
function buildGlade() {
  const z = new Zone('glade', 'Starlit Glade', 56, 44, { seed: 211, dark: .42, tint: '#121040', style: 'meadow', canopy: 'oak' });
  z.fill(T.GRASS);
  z.scatter(T.DGRASS, (x, y) => fbm(x * .13, y * .13, 212) > .56);
  z.border(3, T.TREE, [[26, 41, 4, 3]]);
  for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) { const d = Math.hypot((x - 28) / 11, (y - 12) / 6.5) + (fbm(x * .3, y * .3, 213) - .5) * .35; if (d < 1) z.set(x, y, d < .55 ? T.DEEP : T.WATER); }
  z.path([[28, 43], [28, 34], [28, 26], [24, 21]], 3, T.PATH, .5);
  z.path([[24, 21], [24, 13]], 2, T.PATH, 0);
  z.path([[28, 30], [14, 30], [11, 25]], 2); z.path([[28, 30], [42, 28], [45, 22]], 2);
  z.circle(28, 30, 4.5, T.PLAZA);
  z.scatter(T.TREE, (x, y, t) => (t === T.GRASS || t === T.DGRASS) && hash2(x, y, 214) > .955 && Math.hypot(x - 28, y - 30) > 7 && y > 20);
  z.set(40, 34, T.TREE);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; z.lantern(Math.round(28 + Math.cos(a) * 5.6), Math.round(30 + Math.sin(a) * 4.6)); }
  [[22, 22], [26, 22], [44, 24], [14, 28]].forEach(([x, y]) => z.lantern(x, y));
  z.decor.push({ type: 'campfire', x: 11, y: 25 }, { type: 'tent', x: 7, y: 21 });
  z.spots = [
    { type: 'bench', x: 41.5, y: 23.5 }, { type: 'picnic', x: 16.5, y: 34 }, { type: 'dock', x: 24.5, y: 13.6 }, { type: 'fire', x: 12, y: 27.2 },
    { type: 'dance', x: 28.5, y: 30.5 }, { type: 'scope', x: 46, y: 19.5 }, { type: 'flowers', x: 36.5, y: 37 }, { type: 'swingtree', x: 40.5, y: 36.2 },
  ];
  for (const sp of z.spots) if (sp.type !== 'dock' && sp.type !== 'swingtree') z.circle(sp.x, sp.y, 1.8, T.GRASS, [T.TREE, T.ROCK]);
  z.portals.push({ x: 26, y: 43, w: 4, h: 1, to: 'town', entry: 'south', label: 'Lanternhold', push: [0, -48] });
  z.entries = { south: [28.5, 40.6] };
  z.waystone = { x: 31, y: 39 };
  return z;
}
const _iz7 = initZones;
initZones = function () {
  _iz7(); ZONES.glade = buildGlade();
  if (typeof AMB !== 'undefined') AMB.glade = { fog: 0x14123a, near: 20, far: 52, sky: 0x8a90d8, gnd: 0x1e2028, hI: .7, moon: 0xd8d8ff, mI: .62, exp: 1.25 };
};
TRAVEL_ORDER.push('glade');
function nearestSpot(h = ctrlHero()) { const z = G.zone; if (!z || !z.spots || !h) return null; let best = null, bd = 1.7 * TILE; for (const s of z.spots) { const d = Math.hypot((s.x) * TILE - h.x, (s.y) * TILE - h.y); if (d < bd) { bd = d; best = s; } } return best; }
function useSpot(s) {
  const info = SPOT_INFO[s.type];
  if (info.act === 'flowers') {
    svHearts(s.x * TILE, s.y * TILE - 30, 6); sparkle({ x: s.x * TILE, y: s.y * TILE }, '#f4a0c0');
    if (!WARD.unlocked.flowers) { WARD.unlocked.flowers = true; if (WARD.handan.head === 'none') WARD.handan.head = 'flowers'; wardSave(); toast('Orhun weaves Handan a <b>flower crown</b>! (Wardrobe)'); playDialog([{ who: 'orhun', text: 'Hold still. There. Now you look like the queen of this whole glade.' }, { who: 'handan', text: 'Only of the glade?' }, { who: 'orhun', text: 'Of everything. Obviously.' }]); }
    else bark('handan', pick(['These smell like summer.', 'One for you, one for me.', 'Lumen keeps eating them.']));
    return;
  }
  startPose(info.pose, { x: s.x * TILE, y: s.y * TILE }, info.dir);
}
window.extraUseLabel = () => { if (G.pose) return ''; const s = nearestSpot(); return s ? SPOT_INFO[s.type].label : ''; };
const _int7 = interact;
interact = function (h) { if (G.mode !== 'survivor' && !G.dialog && !nearestNpc(undefined, h)) { const s = nearestSpot(h); if (s) { useSpot(s); return; } } return _int7(h); };
// 2D spot art and prompt
EXTRA_DRAW.push((g, t, ds) => {
  const z = G.zone; if (!z || !z.spots) return;
  for (const s of z.spots) {
    const X = s.x * TILE, Y = s.y * TILE;
    if (s.type === 'bench') ds.push({ y: Y - 4, f: () => { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X - 20, Y - 2, 40, 5); g.fillStyle = '#5a3a22'; g.fillRect(X - 19, Y - 22, 38, 6); g.fillRect(X - 17, Y - 10, 3, 9); g.fillRect(X + 14, Y - 10, 3, 9); g.fillStyle = '#7a5230'; g.fillRect(X - 20, Y - 12, 40, 5); } });
    else if (s.type === 'picnic') ds.push({ y: Y - 30, f: () => { for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#c8403a' : '#f2e6d0'; g.fillRect(X - 24 + i * 8, Y - 14 + j * 7, 8, 7); } g.fillStyle = '#8a5a2a'; g.fillRect(X + 12, Y - 24, 12, 9); g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.beginPath(); g.arc(X + 18, Y - 24, 5, Math.PI, 0); g.stroke(); } });
    else if (s.type === 'scope') ds.push({ y: Y, f: () => { g.strokeStyle = '#4a3a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(X, Y - 12); g.lineTo(X - 7, Y + 2); g.moveTo(X, Y - 12); g.lineTo(X + 7, Y + 2); g.moveTo(X, Y - 12); g.lineTo(X, Y + 3); g.stroke(); g.save(); g.translate(X, Y - 14); g.rotate(-.6); g.fillStyle = '#b08a3a'; g.fillRect(-10, -3, 22, 6); g.fillStyle = '#e8d08a'; g.fillRect(10, -3, 3, 6); g.restore(); } });
    else if (s.type === 'flowers') ds.push({ y: Y - 10, f: () => { const fl = ['#f4a0c0', '#fff2b0', '#a8d8ff', '#ffffff', '#ffb0d0']; for (let i = 0; i < 16; i++) { const a = hash2(i, 1, 9) * 6.28, r = hash2(i, 2, 9) * 22; g.fillStyle = '#3a6a2a'; g.fillRect(X + Math.cos(a) * r, Y + Math.sin(a) * r * .5 - 2, 1, 4); g.fillStyle = fl[i % 5]; g.beginPath(); g.arc(X + Math.cos(a) * r, Y + Math.sin(a) * r * .5 - 3 + Math.sin(t * 2 + i) * .6, 2.4, 0, 7); g.fill(); } } });
  }
});
EXTRA_TOP.push((g, t) => {
  if (G.photo || G.dialog || G.pose) return;
  const s = nearestSpot(); if (!s) return;
  textOutlined(g, (TOUCH_UI ? '' : 'E  ') + SPOT_INFO[s.type].label, s.x * TILE, s.y * TILE + 26, '#f2e6c8', 12);
});
EXTRA_TOP.push((g, t) => {
  const z = G.zone; if (!z || z.id !== 'glade') return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const x = G.cam.x + ((hash2(i, 1, 5) * W / ZOOM + t * 12 * (hash2(i, 2, 5) - .5) * 4) % (W / ZOOM)), y = G.cam.y + ((hash2(i, 3, 5) * H / ZOOM + Math.sin(t * .7 + i) * 20) % (H / ZOOM)); const a = .35 + Math.sin(t * 3 + i * 1.7) * .35; g.fillStyle = `rgba(220,255,140,${Math.max(0, a)})`; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
  g.restore();
});
// 3D: spot props, fireflies, prompts
if (typeof build3DZone === 'function') {
  const _b3z7 = build3DZone;
  build3DZone = function (z) {
    _b3z7(z);
    if (!z.spots || !z.g3) return;
    const wood = sMat('#6a4428', { roughness: .9 }), dark = sMat('#4a2e1a');
    for (const s of z.spots) {
      const gr = new THREE.Group(); gr.position.set(s.x, 0, s.y); z.g3.root.add(gr);
      if (s.type === 'bench') { mesh(gBox(1.3, .08, .4), wood, 0, .42, 0, gr); mesh(gBox(1.3, .35, .06), wood, 0, .72, -.2, gr); for (const sx of [-.55, .55]) mesh(gBox(.08, .42, .36), dark, sx, .21, 0, gr); }
      else if (s.type === 'picnic') { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) mesh(gBox(.4, .02, .4), sMat((i + j) % 2 ? '#c8403a' : '#f2e6d0'), -.6 + i * .4, .02, -.4 + j * .4, gr).castShadow = false; mesh(gBox(.36, .26, .26), sMat('#8a5a2a'), .7, .14, -.3, gr); }
      else if (s.type === 'scope') { for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const l = mesh(gCyl(.02, .02, .9, 5), dark, Math.cos(a) * .18, .42, Math.sin(a) * .18, gr); l.rotation.z = Math.cos(a) * .35; l.rotation.x = -Math.sin(a) * .35; } const tube = mesh(gCyl(.07, .1, .8, 10), sMat('#b08a3a', { metalness: .7, roughness: .3 }), 0, 1, 0, gr); tube.rotation.x = -.9; }
      else if (s.type === 'flowers') { const fl = ['#f4a0c0', '#fff2b0', '#a8d8ff', '#ffffff', '#ffb0d0']; for (let i = 0; i < 22; i++) { const a = hash2(i, 1, 9) * 6.28, r = hash2(i, 2, 9) * .8; mesh(gSph(.06, 6, 4), sMat(fl[i % 5], { emissive: fl[i % 5], emissiveIntensity: .35 }), Math.cos(a) * r, .14, Math.sin(a) * r, gr).castShadow = false; } }
      else if (s.type === 'swingtree') { const rope = sMat('#c8b080'); for (const sx of [-.3, .3]) mesh(gCyl(.012, .012, 1.6, 4), rope, sx, 1.45, .6, gr); mesh(gBox(.75, .06, .25), wood, 0, .65, .6, gr); }
    }
  };
}
EXTRA_3D.push((R, dt, t) => {
  if (!G.zone || G.zone.id !== 'glade') { if (R.fireflies) R.fireflies.visible = false; return; }
  if (!R.fireflies) { const n = 70, pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); R.fireflies = new THREE.Points(pg, new THREE.PointsMaterial({ size: .16, map: R.glowTex, color: 0xdfff8a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); R.fireflies.frustumCulled = false; R.scene.add(R.fireflies); }
  const f = R.fireflies; f.visible = true; const a = f.geometry.attributes.position.array;
  for (let i = 0; i < a.length / 3; i++) { a[i * 3] = 6 + hash2(i, 1, 7) * 44 + Math.sin(t * .4 + i) * 1.5; a[i * 3 + 1] = .4 + hash2(i, 2, 7) * 2.2 + Math.sin(t * 1.3 + i * 2) * .3; a[i * 3 + 2] = 18 + hash2(i, 3, 7) * 22 + Math.cos(t * .5 + i) * 1.5; }
  f.geometry.attributes.position.needsUpdate = true; f.material.opacity = .65 + Math.sin(t * 2) * .2;
});
EXTRA_OVERLAY.push((g, t) => {
  if (G.photo || G.dialog || G.pose) return;
  const s = nearestSpot(); if (!s) return;
  const p = toScreen(s.x * TILE, s.y * TILE, -.1); textOutlined(g, (TOUCH_UI ? '' : 'E  ') + SPOT_INFO[s.type].label, p.x, p.y + 16, '#f2e6c8', 12);
});

/* ---------- Update, menu, keys, styles ---------- */
const _upd7 = update;
update = function (dt) { _upd7(dt); if (G.mode !== 'survivor' && G.started && !G.paused && !G.dialog) poseTick(dt); };
addMenuItemLater(() => {
  addMenuItem({ id: 'wardrobe', order: 20, label: 'Wardrobe', icon: MI('<path d="M8 3l4 3 4-3 4 4-3 3v11H7V10L4 7z"/>'), fn: () => openWardrobe() });
  addMenuItem({ id: 'poses', order: 21, label: 'Poses', icon: MI('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'), fn: () => openPoses() });
  addMenuItem({ id: 'photo', order: 22, label: 'Photo mode', icon: MI('<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l2-3h4l2 3"/>'), fn: () => photoOn() });
  addMenuItem({ id: 'glade', order: 23, label: 'Starlit Glade', icon: MI('<path d="M12 3l1.8 3.7 4 .6-2.9 2.8.7 4L12 12.2 8.4 14.1l.7-4L6.2 7.3l4-.6z"/><path d="M4 21c3-3 13-3 16 0"/>'), fn: () => { if (G.inCombat) { toast('Not in the middle of a fight!'); return; } travelStart ? travelStart('glade') : enterZone('glade', 'south'); } });
});
function addMenuItemLater(fn) { if (typeof addMenuItem === 'function') { try { fn(); return; } catch (e) { } } setTimeout(() => addMenuItemLater(fn), 50); }
function openPoses() {
  let w = $('winPoses'); if (!w) { w = document.createElement('div'); w.id = 'winPoses'; w.className = 'win'; document.body.appendChild(w); }
  w.hidden = false;
  w.innerHTML = `<h2>Poses <button class="x" data-close="winPoses" aria-label="Close">×</button></h2><div class="gmGrid">${Object.entries(POSES).map(([k, n]) => `<button class="gmItem" data-pz="${k}"><span style="font-size:22px">${{ hug: '🤗', hands: '🤝', sit: '🪑', dance: '💃', wave: '👋', stargaze: '🌠' }[k]}</span><span>${n}</span></button>`).join('')}</div><div class="whint">Move to stop. Poses work anywhere outside a fight. Photo mode hides the interface.</div>`;
  w.querySelectorAll('[data-pz]').forEach(b => b.onclick = () => { w.hidden = true; startPose(b.dataset.pz); });
}
const _okp7 = onKeyPress;
onKeyPress = function (k, e) {
  if (G.mode !== 'survivor' && G.started && !G.dialog) {
    if (G.photo && k === 'escape') { photoOff(); return; }
    if (k === 'o') { const w = $('winWardrobe'); if (w && !w.hidden) w.hidden = true; else openWardrobe(); return; }
    if (k === 'p' && !G.coop) { if (G.photo) takePhoto(); else photoOn(); return; }
    if (k === 'g' && !G.coop) { openPoses(); return; }
  }
  return _okp7(k, e);
};
const _aw7 = anyWindowOpen; anyWindowOpen = function () { return _aw7() || ['winWardrobe', 'winPoses', 'photoWin'].some(id => $(id) && !$(id).hidden); };
const _cw7 = closeWindows; closeWindows = function () { let any = _cw7(); for (const id of ['winWardrobe', 'winPoses', 'photoWin']) if ($(id) && !$(id).hidden) { $(id).hidden = true; any = true; } return any; };
(function () {
  const st = document.createElement('style');
  st.textContent = `#winWardrobe{width:640px}.wgrid{display:grid;grid-template-columns:200px 1fr;gap:14px}.wprev{display:flex;flex-direction:column;gap:8px;align-items:center}.wprev canvas{width:190px;height:253px;border:1px solid var(--edge);border-radius:6px;image-rendering:pixelated}
  .wrow{display:grid;grid-template-columns:96px 1fr;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)}.wrow b{font-size:13px;color:#cfc8b6;font-weight:600}
  .wopts{display:flex;flex-wrap:wrap;gap:5px;align-items:center}.wopts .btn{padding:4px 9px;font-size:12px;text-transform:none;letter-spacing:0}.wopts .btn.on{border-color:var(--jade);background:#14231e}
  .wsw{width:26px;height:26px;border-radius:50%;border:2px solid #000;cursor:pointer;box-shadow:0 0 0 1px rgba(255,255,255,.15)}.wsw.on{box-shadow:0 0 0 2px var(--jade),0 0 8px var(--jade)}.wsw.none{width:auto;border-radius:13px;padding:0 9px;background:#1d2430;color:var(--parch);font:600 11px var(--body)}
  .whint{font-size:11.5px;color:var(--mute);margin-top:6px}
  #winPoses{width:420px}
  .photo #hud,.photo #toast,.photo #banner,.photo #joyBase,.photo #joyHint,.photo #tUse{display:none!important}
  #photoBar{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:30;display:flex;flex-direction:column;gap:6px;align-items:center;padding:8px;background:rgba(10,12,18,.72);border:1px solid var(--edge);border-radius:10px;max-width:calc(100vw - 24px)}
  .pbRow{display:flex;gap:5px;flex-wrap:wrap;justify-content:center}.pbRow .btn{padding:6px 10px;font-size:12px}.pbRow .btn.on{border-color:var(--jade)}
  #photoWin{width:min(760px,calc(100vw - 24px))}#photoWin img{width:100%;border-radius:6px;display:block}.phBtns{display:flex;gap:8px;margin-top:10px}
  @media (max-width:820px){#winWardrobe{width:auto}.wgrid{grid-template-columns:1fr}.wprev{flex-direction:row}.wprev canvas{width:96px;height:128px}}
  @media (max-height:520px){.wrow{padding:3px 0}.wsw{width:24px;height:24px}}`;
  document.head.appendChild(st);
})();
const _enter7 = enterZone;
enterZone = function (id, entryKey, pos) { G.pose = null; _enter7(id, entryKey, pos); if (id === 'glade' && G.mode !== 'survivor') { banner('Starlit Glade', 'A quiet place for two'); if (!G.seenBanter.glade) { G.seenBanter.glade = true; setTimeout(() => playDialog([{ who: 'handan', text: 'Oh... fireflies. Hundreds of them.' }, { who: 'orhun', text: 'No wolves, no Hollow, no quests. Just us.' }, { who: 'handan', text: 'Then let us stay a while.' }]), 900); } } };

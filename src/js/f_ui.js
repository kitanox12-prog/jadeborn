/* ===================== RENDER ===================== */
const ovCv = document.createElement('canvas'), octx = ovCv.getContext('2d');
G.barks = [];
function bark(who, text) { const e = P[who] || ctrlHero(); G.barks = G.barks.filter(b => b.e !== e); G.barks.push({ e, text, t: 0, dur: 3.4 }); }

function render(dt) {
  const g = ctx;
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.imageSmoothingEnabled = false;
  g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
  if (!G.zone) return;
  const z = G.zone, vw = W / ZOOM, vh = H / ZOOM;
  const shx = (Math.random() - .5) * G.shake, shy = (Math.random() - .5) * G.shake;
  const cx = Math.round(G.cam.x + shx), cy = Math.round(G.cam.y + shy);
  g.save(); g.scale(ZOOM, ZOOM); g.translate(-cx, -cy);
  const x0 = Math.max(0, cx), y0 = Math.max(0, cy), x1 = Math.min(z.w * TILE, cx + vw), y1 = Math.min(z.h * TILE, cy + vh);
  if (x1 > x0 && y1 > y0) g.drawImage(z.base, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  const t = performance.now() / 1000;
  const inView = (x, y, m = 80) => x > cx - m && x < cx + vw + m && y > cy - m && y < cy + vh + m;

  // water glints
  // pools
  for (const p of G.pools) {
    const a = Math.min(1, p.t * 3, (p.dur - p.t) * 2);
    g.fillStyle = p.ally ? `rgba(255,210,120,${.2 * a})` : `rgba(70,200,80,${.28 * a})`; g.beginPath(); g.ellipse(p.x, p.y, p.r, p.r * .7, 0, 0, 7); g.fill();
    g.fillStyle = `rgba(160,255,140,${.5 * a})`;
    for (let i = 0; i < 5; i++) { const ang = i * 1.3 + t; const rr = ((t * .7 + i * .2) % 1) * p.r * .8; g.beginPath(); g.arc(p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr * .7, 2 + (i % 2), 0, 7); g.fill(); }
  }
  // telegraphs
  for (const tl of G.teles) {
    const u = tl.t / tl.dur;
    g.strokeStyle = tl.col; g.lineWidth = 2; g.globalAlpha = .9;
    g.beginPath(); g.ellipse(tl.x, tl.y, tl.r, tl.r * .72, 0, 0, 7); g.stroke();
    g.fillStyle = tl.col; g.globalAlpha = .14; g.fill();
    g.globalAlpha = .32; g.beginPath(); g.ellipse(tl.x, tl.y, tl.r * u, tl.r * .72 * u, 0, 0, 7); g.fill();
    g.globalAlpha = 1;
  }
  // pickups
  for (const p of z.pickups) {
    if (G.picked[p.id] || !pickupActive(p)) continue;
    const X = (p.x + .5) * TILE, Y = (p.y + .5) * TILE, bob = Math.sin(t * 3 + p.x) * 2;
    g.fillStyle = 'rgba(200,255,230,.18)'; g.beginPath(); g.ellipse(X, Y + 4, 14, 6, 0, 0, 7); g.fill();
    if (p.item === 'moonpetal') { g.fillStyle = '#3a6a3a'; g.fillRect(X - 1, Y - 6, 2, 10); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + t * .3; g.fillStyle = '#d8e8ff'; g.beginPath(); g.ellipse(X + Math.cos(a) * 5, Y - 9 + Math.sin(a) * 4 + bob, 3.5, 2.2, a, 0, 7); g.fill(); } g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(X, Y - 9 + bob, 2, 0, 7); g.fill(); }
    else if (p.item === 'ember') { g.fillStyle = 'rgba(160,210,240,.55)'; g.beginPath(); g.moveTo(X - 9, Y + 2); g.lineTo(X - 6, Y - 14 + bob); g.lineTo(X + 7, Y - 16 + bob); g.lineTo(X + 10, Y + 2); g.closePath(); g.fill(); g.fillStyle = '#ff9a3a'; g.shadowColor = '#ffaa44'; g.shadowBlur = 10; g.beginPath(); g.arc(X, Y - 6 + bob, 4, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff2c0'; g.fillRect(X - 1, Y - 8 + bob, 2, 2); }
    else if (p.item === 'token') { g.fillStyle = '#e0a64e'; g.beginPath(); g.arc(X, Y - 8 + bob, 6, 0, 7); g.fill(); g.fillStyle = '#7a5420'; g.fillRect(X - 2, Y - 11 + bob, 4, 6); g.fillStyle = '#fff2c0'; g.fillRect(X - 1, Y - 10 + bob, 2, 2); }
    else { g.fillStyle = '#46c495'; g.beginPath(); g.moveTo(X, Y - 22 + bob); g.lineTo(X + 7, Y - 8 + bob); g.lineTo(X, Y + 2 + bob); g.lineTo(X - 7, Y - 8 + bob); g.closePath(); g.fill(); g.fillStyle = '#c9f5df'; g.beginPath(); g.moveTo(X, Y - 20 + bob); g.lineTo(X + 3, Y - 9 + bob); g.lineTo(X, Y - 4 + bob); g.closePath(); g.fill(); }
    textOutlined(g, '!', X, Y - 34 + bob, '#ffd86a', 18);
  }
  // target ring
  const tg = G.target;
  if (tg && !tg.dead) {
    const rr = (tg.r || 10) + 6;
    g.strokeStyle = tg.team === 'foe' ? (tg.aggro ? '#ff5a4a' : '#ffd86a') : '#7dffb0'; g.lineWidth = 2;
    g.setLineDash([6, 4]); g.lineDashOffset = -t * 20; g.beginPath(); g.ellipse(tg.x, tg.y + 1, rr, rr * .45, 0, 0, 7); g.stroke(); g.setLineDash([]);
  }
  const c = ctrlHero();
  for (const hh of (G.coop ? heroes() : [c])) if (!hh.dead) { g.strokeStyle = hh.key === 'orhun' ? 'rgba(224,166,78,.55)' : 'rgba(70,196,149,.55)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(hh.x, hh.y + 1, 14, 6, 0, 0, 7); g.stroke(); }
  const t2 = P.handan.target;
  if (G.coop && t2 && !t2.dead && t2.team === 'foe') { const rr = (t2.r || 10) + 10; g.strokeStyle = '#46c495'; g.lineWidth = 2; g.setLineDash([3, 5]); g.lineDashOffset = t * 20; g.beginPath(); g.ellipse(t2.x, t2.y + 1, rr, rr * .45, 0, 0, 7); g.stroke(); g.setLineDash([]); }
  if (G.moveTo && !G.moveTo.npc && !G.moveTo.foe) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(G.moveTo.x, G.moveTo.y, 8, 3.5, 0, 0, 7); g.stroke(); }

  if (G.mode === 'survivor') svRender2D(g, t, 0);
  // drawables
  const ds = [];
  for (const b of z.beacons) ds.push({ y: (b.y + .5) * TILE + 8, f: () => drawBeacon(g, b, t) });
  for (const n of G.npcs) if (inView(n.x, n.y)) ds.push({ y: n.y, f: () => drawNpc(g, n, t) });
  for (const f of G.foes) if (inView(f.x, f.y, 120)) ds.push({ y: f.y, f: () => drawFoe(g, f) });
  if (G.mounted) { const d = ctrlHero(); ds.push({ y: d.y, f: () => drawMount(g, d) }); }
  else {
    for (const h of heroes()) ds.push({ y: h.y, f: () => drawHero(g, h) });
    if (!P.fox.dead && !P.handan.dead) ds.push({ y: P.fox.y, f: () => drawFox(g, P.fox) });
  }
  if (z.waystone && waystoneOpen(z.id)) { const X = (z.waystone.x + .5) * TILE, Y = z.waystone.y * TILE; ds.push({ y: Y + 24, f: () => { g.fillStyle = `rgba(125,255,200,${.55 + Math.sin(t * 3) * .25})`; g.fillRect(X - 2, Y - 8, 4, 12); g.fillRect(X - 4, Y - 4, 8, 3); g.fillStyle = 'rgba(125,255,200,.18)'; g.beginPath(); g.ellipse(X, Y + 26, 18, 7, 0, 0, 7); g.fill(); } }); }
  for (const d of z.decor) if (d.type === 'lantern' || d.type === 'brazier' || d.type === 'campfire') { }
  for (const fn of EXTRA_DRAW) fn(g, t, ds);
  ds.sort((a, b) => a.y - b.y); for (const d of ds) d.f();

  // projectiles
  for (const p of G.proj) { g.fillStyle = p.col; g.shadowColor = p.col; g.shadowBlur = 10; g.beginPath(); g.arc(p.x, p.y, p.size, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x, p.y, p.size * .4, 0, 7); g.fill(); }
  // fx
  for (const f of G.fx) {
    if (f.t < 0 && f.k !== 'heart') continue;
    const u = f.t / f.dur;
    if (f.k === 'zap') { drawZap(g, f, u); continue; }
    if (f.k === 'p') { g.globalAlpha = 1 - u; g.fillStyle = f.col; g.fillRect(f.x - f.sz / 2, f.y - f.sz / 2, f.sz, f.sz); }
    else if (f.k === 'ring') { g.globalAlpha = 1 - u; g.strokeStyle = f.col; g.lineWidth = 3 * (1 - u) + 1; g.beginPath(); g.ellipse(f.x, f.y, f.r * (.3 + u * .7), f.r * (.3 + u * .7) * .7, 0, 0, 7); g.stroke(); }
    else if (f.k === 'slash') { g.globalAlpha = 1 - u; g.strokeStyle = f.big ? '#ffb08a' : '#f4f6ff'; g.lineWidth = f.big ? 4 : 2.5; g.beginPath(); g.arc(f.x, f.y, f.big ? 22 : 15, f.a + u * 2, f.a + u * 2 + 1.6); g.stroke(); }
    else if (f.k === 'spin') { g.globalAlpha = (1 - u) * .8; g.strokeStyle = f.col; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(f.x, f.y, f.r * (.5 + i * .2), u * 9 + i * 2, u * 9 + i * 2 + 2.2); g.stroke(); } }
    else if (f.k === 'heart') { if (f.t < 0) continue; const s2 = (f.s || 1) * (1 + Math.min(1, f.t * 6) * .3); drawHeart(g, f.x, f.y - u * 34, 13 * s2, `rgba(255,${110 + 40 * (1 - u)},150,${1 - u * u})`); }
    else if (f.k === 'vines' && f.e && !f.e.dead) { g.globalAlpha = Math.min(1, (f.dur - f.t) * 2); g.strokeStyle = '#6aa04a'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const a = i * 1.25 + f.t; g.beginPath(); g.moveTo(f.e.x + Math.cos(a) * 14, f.e.y + 2); g.quadraticCurveTo(f.e.x + Math.cos(a) * 18, f.e.y - 14, f.e.x + Math.cos(a + 1) * 6, f.e.y - 18 - (i % 2) * 6); g.stroke(); } }
    g.globalAlpha = 1;
  }
  // canopy overlay with see-through holes
  if (ovCv.width !== Math.ceil(vw) || ovCv.height !== Math.ceil(vh)) { ovCv.width = Math.ceil(vw); ovCv.height = Math.ceil(vh); }
  octx.clearRect(0, 0, ovCv.width, ovCv.height);
  if (x1 > x0 && y1 > y0) octx.drawImage(z.over, x0, y0, x1 - x0, y1 - y0, x0 - cx, y0 - cy, x1 - x0, y1 - y0);
  octx.globalCompositeOperation = 'destination-out';
  for (const h of partyAll()) { if (h.dead) continue; const gr = octx.createRadialGradient(h.x - cx, h.y - cy - 18, 8, h.x - cx, h.y - cy - 18, 46); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); octx.fillStyle = gr; octx.fillRect(h.x - cx - 50, h.y - cy - 70, 100, 100); }
  octx.globalCompositeOperation = 'source-over';
  g.drawImage(ovCv, cx, cy);

  // bars above units
  for (const f of G.foes) {
    if (f.dead || !inView(f.x, f.y) || f.def.boss || f.svHorde) continue;
    if (!(f.aggro || f === G.target)) continue;
    const top = f.y - 34 * (f.def.scale || 1) - 8, w = f.def.elite ? 44 : 32;
    g.fillStyle = '#000'; g.fillRect(f.x - w / 2 - 1, top - 1, w + 2, 6);
    g.fillStyle = f.aggro ? '#c8372a' : '#b89a3a'; g.fillRect(f.x - w / 2, top, w * f.hp / f.maxHp, 4);
    if (f.def.elite) { g.strokeStyle = '#e0a64e'; g.lineWidth = 1; g.strokeRect(f.x - w / 2 - 1.5, top - 1.5, w + 3, 7); }
    if (f === G.target) { g.font = '600 11px "Alegreya Sans", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(f.name, f.x + 1, top - 4); g.fillStyle = '#ffd8c8'; g.fillText(f.name, f.x, top - 5); }
  }
  if (G.inCombat) for (const h of heroes()) { if (h.dead) continue; const w = 30, top = h.y - 60; g.fillStyle = '#000'; g.fillRect(h.x - w / 2 - 1, top - 1, w + 2, 5); g.fillStyle = h.hp / h.maxHp < .35 ? '#e2705e' : '#5fc35a'; g.fillRect(h.x - w / 2, top, w * h.hp / h.maxHp, 3); }

  // lighting
  renderLights(g, z, cx, cy, t);
  if (G.mode === 'survivor') svRender2D(g, t, 1);
  for (const fn of EXTRA_TOP) fn(g, t);
  if (G.coop) for (const hh of heroes()) if (!hh.dead) textOutlined(g, hh.key === 'orhun' ? 'P1' : 'P2', hh.x, hh.y - (G.inCombat ? 66 : 56), hh.key === 'orhun' ? '#e0a64e' : '#46c495', 11);

  // NPC quest markers (drawn above darkness)
  for (const n of G.npcs) {
    const m = npcMarker(n.id); if (!m) continue;
    const y = n.y - 62 + Math.sin(t * 3) * 3;
    g.font = '700 22px "Almendra", serif'; g.textAlign = 'center';
    g.fillStyle = '#000'; g.fillText(m.ch, n.x + 1, y + 1);
    g.fillStyle = m.col; g.shadowColor = m.col; g.shadowBlur = 8; g.fillText(m.ch, n.x, y); g.shadowBlur = 0;
  }
  // beacon prompt
  const nb = nearestBeacon();
  if (nb && !G.beacons[nb.id] && G.bossDead[BEACON_BOSS[nb.id]]) { textOutlined(g, 'Press E to relight the beacon', (nb.x + .5) * TILE, nb.y * TILE - 50, '#c9f5df', 13); }
  const nn = nearestNpc();
  if (nn && !G.dialog) textOutlined(g, 'E  Talk to ' + NPCS[nn.id].name, nn.x, nn.y + 22, '#f2e6c8', 12);
  // barks
  for (const b of G.barks) {
    b.t += dt; if (b.e.dead) continue;
    const a = Math.min(1, b.t * 4, (b.dur - b.t) * 3);
    g.globalAlpha = a; g.font = '500 13px "Alegreya Sans", sans-serif'; g.textAlign = 'center';
    const w = Math.min(220, g.measureText(b.text).width + 16), x = b.e.x, y = b.e.y - 78;
    g.fillStyle = 'rgba(12,14,20,.9)'; g.strokeStyle = b.e.key === 'orhun' ? '#e0a64e' : '#46c495'; g.lineWidth = 1;
    roundRect(g, x - w / 2, y - 16, w, 22, 5); g.fill(); g.stroke();
    g.fillStyle = '#f2ead6'; g.fillText(b.text.length > 34 ? b.text.slice(0, 33) + '…' : b.text, x, y);
    g.globalAlpha = 1;
  }
  G.barks = G.barks.filter(b => b.t < b.dur);
  // floating text
  for (const tx of G.texts) {
    const a = 1 - Math.max(0, (tx.t - tx.dur * .6) / (tx.dur * .4));
    g.globalAlpha = a; g.font = `800 ${Math.round(13 * tx.size)}px "Alegreya Sans", sans-serif`; g.textAlign = 'center';
    g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(tx.text, tx.x, tx.y); g.fillStyle = tx.col; g.fillText(tx.text, tx.x, tx.y);
    g.globalAlpha = 1;
  }
  g.restore();
  for (const f of G.fx) if (f.k === 'flash') { g.fillStyle = `rgba(200,255,230,${.5 * (1 - f.t / f.dur)})`; g.fillRect(0, 0, W, H); }
  // vignette
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  // low hp edge
  if (!c.dead && c.hp / c.maxHp < .3) { const a = .25 + Math.sin(t * 6) * .1; const lg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .7); lg.addColorStop(0, 'rgba(120,0,0,0)'); lg.addColorStop(1, `rgba(150,10,0,${a})`); g.fillStyle = lg; g.fillRect(0, 0, W, H); }
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function textOutlined(g, s, x, y, col, size) { g.font = `700 ${size}px "Alegreya Sans", sans-serif`; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); }

function zapPts(f, n = 7) { const pts = []; for (let i = 0; i <= n; i++) { const k = i / n, j = f.straight || i === 0 || i === n ? 0 : (hash2(i, Math.floor(f.seed * 10 + f.t * 30), 3) - .5) * 18; const dx = f.x2 - f.x1, dy = f.y2 - f.y1, l = Math.hypot(dx, dy) || 1; pts.push([f.x1 + dx * k - dy / l * j, f.y1 + dy * k + dx / l * j]); } return pts; }
function drawZap(g, f, u) {
  const pts = zapPts(f); g.save(); g.globalAlpha = 1 - u; g.strokeStyle = f.col; g.lineWidth = f.straight ? 4 : 3; g.shadowColor = f.col; g.shadowBlur = 10; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.2; g.shadowBlur = 0; g.stroke(); g.restore();
}
function drawHeart(g, x, y, r, col) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x, y + r * .9);
  g.bezierCurveTo(x - r * 1.3, y - r * .1, x - r * .7, y - r * 1.1, x, y - r * .35);
  g.bezierCurveTo(x + r * .7, y - r * 1.1, x + r * 1.3, y - r * .1, x, y + r * .9); g.fill();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x - r * .38, y - r * .38, r * .18, 0, 7); g.fill();
}
function drawMount(g, d) {
  const face = d.face || 1, f = P.fox, bob = d.moving ? Math.abs(Math.sin(d.t * 9)) * 2 : 0;
  const fx = { x: 0, y: 0, t: f.t || d.t, face, moving: d.moving };
  g.save(); g.translate(d.x, d.y + 4); g.scale(4.3, 4.3); drawFox(g, fx); g.restore();
  const lh = heroLook(P.handan), lo = heroLook(P.orhun);
  drawHumanoid(g, 'handan' + lh.sig, lh, d.x - 12 * face, d.y - 30 - bob, 2, 0, face < 0);
  drawHumanoid(g, 'orhun' + lo.sig, lo, d.x + 6 * face, d.y - 28 - bob, 2, 0, face < 0);
  // Lumen's head and tail tip in front of the riders
  g.save(); g.translate(d.x + 34 * face, d.y - 43 - bob * .5); g.fillStyle = '#46c495'; g.beginPath(); g.ellipse(0, 0, 18, 15, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-10 * face, -10); g.lineTo(-6 * face, -30); g.lineTo(2 * face, -12); g.fill(); g.beginPath(); g.moveTo(2 * face, -12); g.lineTo(10 * face, -28); g.lineTo(12 * face, -8); g.fill();
  g.fillStyle = '#c9f5df'; g.fillRect(8 * face - (face < 0 ? 12 : 0), 2, 12, 7); g.fillStyle = '#0a1a14'; g.fillRect(4 * face - 3, -5, 6, 6); g.fillRect(18 * face - 2, 5, 4, 4); g.restore();
}
const WT_LOOK = { sword: 'sword', greataxe: 'axe', spear: 'spear', twinblades: 'twin', staff: 'staff', orb: 'orb', wand: 'wand', tome: 'tome' };
function heroLook(h) {
  const eq = G.equip[h.key] || {}, wt = heroWeapon(h), ar = eq.armor, base = LOOKS[h.key];
  const tint = ar && ar.tint, sig = wt + (tint || '') + (eq.trinket ? eq.trinket.rarity : '');
  if (h._lookSig === sig && h._look) return h._look;
  const L = Object.assign({}, base, { weapon: WT_LOOK[wt], offhand: wt === 'sword' ? 'buckler' : null, sig });
  if (tint) { L.shirt = tint; L.shirtHi = shade(tint, 18); if (h.key === 'handan') L.pants = tint; }
  if (ar && h.key === 'orhun') L.pauldron = ['#6a707c', '#6a8070', '#6a80a8', '#9a7ab8'][ar.rarity] || L.pauldron;
  if (ar && h.key === 'handan') L.trim = ['#2a9a72', '#3aaa5a', '#4a8ae0', '#b07ae8'][ar.rarity] || L.trim;
  h._lookSig = sig; h._look = L; return L;
}
function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); const c = v => Math.max(0, Math.min(255, v + amt)); return '#' + ((c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, '0'); }
function drawHero(g, h) {
  if (h.dead) { g.save(); g.globalAlpha = .7; g.translate(h.x, h.y); g.rotate(1.57 * (h.face || 1)); drawHumanoid(g, h.key, LOOKS[h.key], 0, 10, 2, 0, false, .6); g.restore(); return; }
  const frame = h.swingT > 0 ? 3 : h.moving ? (Math.floor(h.t * 8) % 2 ? 1 : 2) : 0;
  const dir = h.dir || 0;
  if (h.buffs.some(b => b.id === 'ward')) { g.fillStyle = 'rgba(138,255,224,.14)'; g.strokeStyle = 'rgba(138,255,224,.55)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(h.x, h.y - 22, 20, 28, 0, 0, 7); g.fill(); g.stroke(); }
  if (h.buffs.some(b => b.id === 'ironhide')) { g.strokeStyle = 'rgba(159,195,238,.8)'; g.lineWidth = 2; g.beginPath(); g.ellipse(h.x, h.y - 22, 18, 26, 0, 0, 7); g.stroke(); }
  if (h.flash) g.filter = 'brightness(1.8) saturate(.5)';
  if (h.iframes > 0) { g.save(); g.globalAlpha = h.key === 'handan' ? .35 : .7; }
  const gl = heroLook(h);
  drawHumanoid(g, h.key + gl.sig, gl, h.x, h.y, dir, frame, dir === 2 && h.face < 0);
  if (h.iframes > 0) g.restore();
  g.filter = 'none';
  if (h.buffs.some(b => b.mods && b.mods.root)) { g.strokeStyle = '#6aa04a'; g.lineWidth = 2; g.beginPath(); g.ellipse(h.x, h.y, 12, 5, 0, 0, 7); g.stroke(); }
}
// Recolour a foe without canvas filters (slow on phones): draw offscreen, then wash it with the tint colour.
const TCV = document.createElement('canvas'); TCV.width = 256; TCV.height = 224; const tcx = TCV.getContext('2d');
function drawTintedFoe(g, f) {
  tcx.setTransform(1, 0, 0, 1, 0, 0); tcx.globalCompositeOperation = 'source-over'; tcx.globalAlpha = 1; tcx.clearRect(0, 0, 256, 224);
  drawFoeShape(tcx, f, 128, 180);
  tcx.globalCompositeOperation = 'source-atop';
  if (f.def.tint) { tcx.globalAlpha = f.def.tint.a * .8; tcx.fillStyle = f.def.tint.c; tcx.fillRect(0, 0, 256, 224); }
  if (f.flash) { tcx.globalAlpha = .55; tcx.fillStyle = '#ffffff'; tcx.fillRect(0, 0, 256, 224); }
  tcx.globalAlpha = 1; tcx.globalCompositeOperation = 'source-over';
  g.drawImage(TCV, f.x - 128, f.y - 180);
}
function drawFoe(g, f) {
  const a = f.dead ? Math.max(0, 1 - f.deathT) : (f.evade ? .6 : 1);
  g.save(); g.globalAlpha = a;
  f.moving = f.moving && !f.dead;
  if (f.def.tint || (f.flash && f.def.boss)) drawTintedFoe(g, f);
  else { if (f.flash) g.filter = 'brightness(2.2)'; drawFoeShape(g, f, f.x, f.y); g.filter = 'none'; }
  if (f.buffs.some(b => b.mods && b.mods.stun)) { for (let i = 0; i < 3; i++) { const ang = f.t * 5 + i * 2.1; g.fillStyle = '#ffe6a8'; g.fillRect(f.x + Math.cos(ang) * 10 - 1.5, f.y - 36 * (f.def.scale || 1) + Math.sin(ang) * 3, 3, 3); } }
  if (f.bs && f.bs.cast) { const c = f.bs.cast, w = 60, top = f.y - 14 - f.r * 2.6; g.fillStyle = '#000'; g.fillRect(f.x - w / 2 - 1, top - 1, w + 2, 7); g.fillStyle = '#e0a64e'; g.fillRect(f.x - w / 2, top, w * (1 - c.t / c.dur), 5); textOutlined(g, c.name, f.x, top - 4, '#ffd86a', 12); }
  g.restore();
}
function drawNpc(g, n, t) {
  const L = npcLook(n.id);
  if (L.ghost) { g.save(); g.fillStyle = 'rgba(138,216,192,.15)'; g.beginPath(); g.ellipse(n.x, n.y - 24, 24, 34, 0, 0, 7); g.fill(); g.restore(); }
  const facing = dist(n, ctrlHero()) < 3 * TILE ? (ctrlHero().y < n.y - 10 ? 1 : 0) : 0;
  drawHumanoid(g, n.id, L, n.x, n.y + (L.ghost ? Math.sin(t * 2) * 2 - 4 : 0), facing, 0, false, L.ghost ? .78 : 1);
}
function drawBeacon(g, b, t) {
  const X = (b.x + .5) * TILE, Y = (b.y + .5) * TILE, lit = G.beacons[b.id];
  g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(X, Y + 8, 22, 8, 0, 0, 7); g.fill();
  g.fillStyle = '#4a4652'; g.fillRect(X - 16, Y - 4, 32, 12); g.fillStyle = '#5c5866'; g.fillRect(X - 10, Y - 40, 20, 38); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(X - 10, Y - 40, 5, 38);
  g.fillStyle = '#6a6474'; g.fillRect(X - 18, Y - 48, 36, 9); g.fillStyle = '#2a2830'; g.fillRect(X - 14, Y - 46, 28, 4);
  if (b.first) { g.fillStyle = '#9a7a3a'; g.fillRect(X - 20, Y - 50, 4, 10); g.fillRect(X + 16, Y - 50, 4, 10); }
  if (lit) {
    for (let i = 0; i < 3; i++) { const h = 26 + Math.sin(t * 9 + i * 2) * 5 - i * 6; g.fillStyle = ['#2aa878', '#7dffc8', '#fff8d8'][i]; g.beginPath(); g.moveTo(X - 12 + i * 4, Y - 48); g.quadraticCurveTo(X + Math.sin(t * 7 + i) * 4, Y - 48 - h * 1.4, X + 12 - i * 4, Y - 48); g.fill(); }
  } else {
    g.fillStyle = 'rgba(120,90,160,.5)'; g.beginPath(); g.arc(X, Y - 50, 4 + Math.sin(t * 2) * 1, 0, 7); g.fill();
  }
}
function npcMarker(id) {
  for (const q of QUESTS) if (qTurnin(q) === id && G.q[q.id] && G.q[q.id].st === 'ready' && !q.final) return { ch: '?', col: '#ffd86a' };
  for (const q of QUESTS) if (q.giver === id && qState(q.id) === 'avail') return { ch: '!', col: '#ffd86a' };
  for (const q of QUESTS) if (q.giver === id && G.q[q.id] && G.q[q.id].st === 'active') return { ch: '?', col: '#9a978e' };
  if (NPCS[id].vendor) return { ch: '$', col: '#f2c75c' };
  return null;
}

function renderLights(g, z, cx, cy, t) {
  let dark = z.dark;
  if (z.id === 'brightfield' && G.beacons.b1) dark -= .12;
  if (z.id === 'murkfen' && G.beacons.b2) dark -= .12;
  if (z.id === 'keep' && G.beacons.b3) dark -= .3;
  if (z.id === 'frostspire' && G.beacons.b4) dark -= .18;
  if (G.eclipse) dark += .18;
  if (G.blizzard) dark += .1;
  dark = clamp(dark, .05, .92);
  const lw = lightCv.width, lh = lightCv.height, s = ZOOM / 2;
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, lw, lh);
  lctx.fillStyle = z.tint; lctx.globalAlpha = dark; lctx.fillRect(0, 0, lw, lh); lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'destination-out';
  const L = (x, y, r, a = 1) => {
    const sx = (x - cx) * s, sy = (y - cy) * s, sr = r * s;
    if (sx < -sr || sy < -sr || sx > lw + sr || sy > lh + sr) return;
    const gr = lctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.55, `rgba(0,0,0,${a * .55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = gr; lctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  };
  for (const h of partyAll()) if (!h.dead) L(h.x, h.y - 16, h.key === 'handan' ? 175 : h.pet ? 70 : 150, .9);
  const glows = [];
  for (const d of z.decor) {
    const X = (d.x + .5) * TILE;
    if (d.type === 'lantern') { const on = !d.beacon || G.beacons[d.beacon]; const fl = 1 + Math.sin(t * 7 + d.x) * .04; if (on) { L(X, d.y * TILE - 6, 150 * fl, .95); glows.push([X, d.y * TILE - 6, '#ffb04a', 1]); } else glows.push([X, d.y * TILE - 6, '#7a5aa8', .3]); }
    if (d.type === 'brazier') { L(X, d.y * TILE + 10, 140, .9); glows.push([X, d.y * TILE + 8, '#ff9a3a', 1.2, 'fire']); }
    if (d.type === 'campfire') { L(X, d.y * TILE + 16, 190, 1); glows.push([X, d.y * TILE + 16, '#ff9a3a', 1.6, 'fire']); }
    if (d.type === 'window') { L(X + 4, d.y * TILE + 14, 60, .6); }
  }
  if (z.waystone && waystoneOpen(z.id)) L((z.waystone.x + .5) * TILE, z.waystone.y * TILE, 110, .8);
  for (const b of z.beacons) { if (G.beacons[b.id]) L((b.x + .5) * TILE, b.y * TILE - 30, 420, 1); else L((b.x + .5) * TILE, b.y * TILE - 30, 50, .4); }
  for (const f of G.foes) if (!f.dead && f.def.light) L(f.x, f.y - 20, f.def.boss ? 160 : 90, .8);
  for (const p of G.proj) L(p.x, p.y, 50, .6);
  for (const p of z.pickups) if (!G.picked[p.id] && pickupActive(p)) L((p.x + .5) * TILE, (p.y + .5) * TILE - 6, 60, .7);
  for (const n of G.npcs) if (npcLook(n.id).ghost) L(n.x, n.y - 20, 120, .8);
  for (const f of G.fx) if (f.k === 'ring' && f.r > 60) L(f.x, f.y, f.r * 1.5, 1 - f.t / f.dur);
  lctx.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.drawImage(lightCv, 0, 0, W, H);
  if (z.snow) {
    const n = G.blizzard ? 260 : 130, sp = G.blizzard ? 2.4 : 1;
    g.fillStyle = 'rgba(240,248,255,.8)';
    for (let i = 0; i < n; i++) { const a = hash2(i, 1, 7), b2 = hash2(i, 2, 7), sz = 1 + hash2(i, 3, 7) * 2.2; const x = ((a * (W + 80) + t * (14 + 30 * b2) * sp - cx * .3 + Math.sin(t * .8 + i) * 12) % (W + 80) + W + 80) % (W + 80) - 40; const y = ((b2 * (H + 40) + t * (34 + 40 * a) * sp - cy * .3) % (H + 40) + H + 40) % (H + 40) - 20; g.fillRect(x, y, sz, sz); }
    if (G.blizzard) { g.fillStyle = 'rgba(200,225,255,.12)'; g.fillRect(0, 0, W, H); }
  }
  if (z.fog) {
    g.globalAlpha = .12; g.fillStyle = '#9ac8b0';
    for (let i = 0; i < 6; i++) { const fx = ((i * 260 + t * 14 - cx * .6) % (W + 400)) - 200, fy = ((i * 170 - cy * .6) % (H + 200) + H + 200) % (H + 200) - 100; g.beginPath(); g.ellipse(fx, fy, 260, 50, 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  g.restore();
  // flame glows (additive)
  g.globalCompositeOperation = 'lighter';
  for (const [x, y, col, a, kind] of glows) {
    if (x < cx - 60 || x > cx + W / ZOOM + 60 || y < cy - 60 || y > cy + H / ZOOM + 60) continue;
    const gr = g.createRadialGradient(x, y, 0, x, y, 34 * a);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = .35 * a; g.fillStyle = gr; g.fillRect(x - 40 * a, y - 40 * a, 80 * a, 80 * a);
    g.globalAlpha = 1;
    if (a >= 1 || kind) { const fh = (kind ? 10 : 6) + Math.sin(t * 13 + x) * 2; g.fillStyle = '#ffd27a'; g.beginPath(); g.moveTo(x - 3.5, y + 2); g.quadraticCurveTo(x, y - fh * 1.6, x + 3.5, y + 2); g.fill(); g.fillStyle = '#fff6d8'; g.fillRect(x - 1, y - 2, 2, 3); }
  }
  g.globalCompositeOperation = 'source-over';
}

/* ---------- Minimap ---------- */
const mmc = $('minimap'), mctx = mmc.getContext('2d');
function renderMinimap() {
  const z = G.zone; if (!z) return;
  const s = Math.min(mmc.width / z.w, mmc.height / z.h), ox = (mmc.width - z.w * s) / 2, oy = (mmc.height - z.h * s) / 2;
  mctx.fillStyle = '#05060a'; mctx.fillRect(0, 0, mmc.width, mmc.height);
  mctx.imageSmoothingEnabled = false; mctx.drawImage(z.mini, ox, oy, z.w * s, z.h * s);
  mctx.fillStyle = 'rgba(0,0,10,.25)'; mctx.fillRect(0, 0, mmc.width, mmc.height);
  const dot = (x, y, col, r = 2) => { mctx.fillStyle = col; mctx.beginPath(); mctx.arc(ox + x / TILE * s, oy + y / TILE * s, r, 0, 7); mctx.fill(); };
  for (const p of z.portals) { mctx.fillStyle = (p.req && !p.req()) ? '#7a5aa8' : '#c9f5df'; mctx.fillRect(ox + p.x * s - 1, oy + p.y * s, Math.max(2, p.w * s), p.h * s); }
  for (const b of z.beacons) dot((b.x + .5) * TILE, (b.y + .5) * TILE, G.beacons[b.id] ? '#7dffc8' : '#8a6ab0', 3);
  for (const p of z.pickups) if (!G.picked[p.id] && pickupActive(p)) dot((p.x + .5) * TILE, (p.y + .5) * TILE, '#7dffc8', 1.8);
  for (const f of G.foes) if (!f.dead) dot(f.x, f.y, f.def.boss ? '#ff3a2a' : f.aggro ? '#ff6a5a' : '#a83a30', f.def.boss ? 3 : 1.5);
  for (const n of G.npcs) { const m = npcMarker(n.id); dot(n.x, n.y, m && m.ch !== '$' ? '#ffd86a' : '#d8d0b8', 2.2); }
  for (const h of heroes()) if (!h.dead) dot(h.x, h.y, h.key === 'orhun' ? '#e0a64e' : '#46c495', h === ctrlHero() ? 3 : 2.2);
  const vw = W / ZOOM, vh = H / ZOOM;
  mctx.strokeStyle = 'rgba(255,255,255,.35)'; mctx.lineWidth = 1; mctx.strokeRect(ox + G.cam.x / TILE * s, oy + G.cam.y / TILE * s, vw / TILE * s, vh / TILE * s);
}

/* ===================== HUD / DOM UI ===================== */
const tip = $('tip');
function showTip(html, ev) { tip.innerHTML = html; tip.hidden = false; moveTip(ev); }
function moveTip(ev) { const r = tip.getBoundingClientRect(); let x = ev.clientX + 14, y = ev.clientY - r.height - 10; if (x + r.width > innerWidth - 8) x = innerWidth - r.width - 8; if (y < 8) y = ev.clientY + 18; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
function hideTip() { tip.hidden = true; }
function bindTip(el, fn) { el._tipFn = fn; el.addEventListener('mouseenter', e => { if (!TOUCH_UI) showTip(fn(), e); }); el.addEventListener('mousemove', moveTip); el.addEventListener('mouseleave', hideTip); }

let unitEls = {};
function renderParty() {
  const wrap = $('party');
  if (!wrap.children.length) {
    for (const k of ['orhun', 'handan']) {
      const d = document.createElement('div'); d.className = 'unit frame';
      d.innerHTML = `<canvas width="44" height="44"></canvas><div class="meta"><div class="nm"><span>${HERO[k].name}</span><small class="lv"></small></div><div class="bar hp"><s></s><i></i><b></b></div><div class="bar thin ${k === 'orhun' ? 'rage' : 'mana'}"><i></i></div><div class="buffs"></div></div><div class="dead" hidden>Fallen</div>`;
      wrap.appendChild(d);
      drawPortrait(d.querySelector('canvas'), k);
      d.addEventListener('click', () => { if (G.ctrl !== k) { G.target = P[k]; G.autoAtk = false; } else G.target = P[k]; });
      d.addEventListener('dblclick', () => { if (G.ctrl !== k) swapHero(); });
      unitEls[k] = { root: d, lv: d.querySelector('.lv'), hp: d.querySelector('.hp i'), hpb: d.querySelector('.hp b'), hpbar: d.querySelector('.hp'), ab: d.querySelector('.hp s'), res: d.querySelector('.rage i, .mana i'), buffs: d.querySelector('.buffs'), dead: d.querySelector('.dead') };
    }
  }
  for (const k of ['orhun', 'handan']) unitEls[k].root.classList.toggle('active', G.coop || G.ctrl === k);
}
function buffHtml(e) { return e.buffs.filter(b => b.name).map(b => `<div class="buff" style="background:${b.col || '#ccc'}" title="${b.name}">${Math.ceil(b.t)}</div>`).join(''); }
let hudT = 0;
function updateHUD(dt) {
  hudT -= dt; if (hudT > 0) return; hudT = .08;
  for (const k of ['orhun', 'handan']) {
    const h = P[k], u = unitEls[k]; if (!u) continue;
    u.lv.textContent = `Lv ${G.level} ${HERO[k].title}`;
    const p = h.hp / h.maxHp; u.hp.style.width = (p * 100) + '%'; u.hpb.textContent = `${Math.ceil(h.hp)} / ${h.maxHp}`; u.hpbar.classList.toggle('low', p < .35);
    const ab = h.buffs.reduce((s, b) => s + (b.absorb > 0 ? b.absorb : 0), 0); u.ab.style.width = Math.min(100, ab / h.maxHp * 100) + '%';
    u.res.style.width = (h.res / h.resMax * 100) + '%';
    const bh = buffHtml(h); if (u.buffs._h !== bh) { u.buffs.innerHTML = bh; u.buffs._h = bh; }
    u.dead.hidden = !h.dead;
  }
  // target
  const t = G.target, tf = $('target');
  if (t && !t.dead) {
    tf.hidden = false;
    $('tName').textContent = t.name;
    $('tLvl').textContent = t.team === 'foe' ? (t.def.boss ? 'Boss' : `Lv ${t.def.lvl}${t.def.elite ? ' Elite' : ''}`) : 'Ally';
    tf.className = 'frame' + (t.team === 'foe' && t.def.boss ? ' boss' : t.team === 'foe' && t.def.elite ? ' elite' : '');
    $('tHp').querySelector('i').style.width = (t.hp / t.maxHp * 100) + '%';
    $('tHp').querySelector('b').textContent = `${Math.ceil(t.hp)} / ${t.maxHp}` + (t.team === 'foe' && t.bs && t.bs.cast ? `  ·  casting ${t.bs.cast.name}` : '');
    const bh = buffHtml(t); const tb = $('tBuffs'); if (tb._h !== bh) { tb.innerHTML = bh; tb._h = bh; }
  } else tf.hidden = true;
  // action bar
  slotEls.forEach(s => {
    if (s.dodge) { const hh = P[s.key], cd = hh.cds.dodge || 0; s.cdn.textContent = cd > 0 ? Math.ceil(cd) : ''; s.cd.style.setProperty('--p', (cd / DODGE[s.key].cd * 100) + '%'); return; }
    if (s.pot) { s.cdn.textContent = G.potCd > 0 ? Math.ceil(G.potCd) : ''; s.cd.style.setProperty('--p', (G.potCd / 20 * 100) + '%'); s.cost.textContent = '×' + G.potions; return; }
    const h = P[s.key], a = ABIL[s.key][s.i]; if (!a) return;
    const locked = G.level < a.lvl;
    s.el.classList.toggle('locked', locked);
    const cd = h.cds[a.id] || 0, total = Math.max(a.cd + (a.cdMod ? a.cdMod(h) : 0), .01);
    const gcdP = h.gcd > 0 && cd <= 0 ? h.gcd / GCD : 0;
    s.cd.style.setProperty('--p', (Math.max(cd / total, gcdP) * 100) + '%');
    s.cdn.textContent = cd > 0 ? (cd < 10 ? cd.toFixed(1) : Math.ceil(cd)) : '';
    s.el.classList.toggle('oom', h.res < acost(h, a));
  });
  const gp = Math.floor(G.gauge);
  $('gauge').querySelector('i').style.width = gp + '%'; $('gauge').classList.toggle('full', gp >= 100);
  $('gaugeLbl').textContent = gp >= 100 ? 'Lantern ready · F' : `Lantern ${gp}%`;
  $('xpbar').querySelector('i').style.width = (G.level >= MAX_LVL ? 100 : G.xp / XP_NEED[G.level] * 100) + '%';
  $('xpbar').title = G.level >= MAX_LVL ? 'Max level' : `Experience ${G.xp} / ${XP_NEED[G.level]}`;
}

let slotEls = [];
const P2KEYS = ['U', 'I', 'O', 'J', 'K', 'L'];
function buildActionBar() {
  const bar = $('bar'); bar.innerHTML = ''; slotEls = [];
  const list = G.coop ? ['orhun', 'handan'] : [G.ctrl];
  list.forEach((key, gi) => {
    if (gi) { const sep = document.createElement('div'); sep.style.cssText = 'width:2px;background:var(--edge);margin:0 4px;align-self:stretch'; bar.appendChild(sep); }
    const h = P[key];
    ABIL[key].forEach((a, i) => {
      const label = G.coop && key === 'handan' ? P2KEYS[i] : String(i + 1);
      const el = document.createElement('div'); el.className = 'slot'; el.dataset.lv = 'Lv ' + a.lvl;
      el.innerHTML = `<canvas width="48" height="48"></canvas><div class="cd"></div><div class="cdn"></div><span class="key">${label}</span><span class="cost" style="color:${key === 'orhun' ? '#ff9a7a' : '#8ac0ff'}">${a.cost || ''}</span>`;
      drawIcon(el.querySelector('canvas'), a.icon);
      el.addEventListener('click', () => { if (TOUCH_UI) return; SND.init(); useAbility(P[key], i); });
      bindTip(el, () => `<div class="t">${a.name}</div><div class="s">${HERO[key].name} · ${a.cost ? a.cost + (key === 'orhun' ? ' rage' : ' mana') + ' · ' : (a.gain ? 'Generates ' + a.gain + ' rage · ' : '')}${a.cd ? a.cd + (a.cdMod ? a.cdMod(h) : 0) + 's cooldown' : 'No cooldown'}${a.range ? ' · ' + a.range + ' yd' : ''}</div><div style="margin-top:4px">${a.desc(P[key])}</div>${G.level < a.lvl ? `<div class="bd" style="margin-top:4px">Unlocks at level ${a.lvl}</div>` : ''}`);
      bar.appendChild(el);
      slotEls.push({ el, cd: el.querySelector('.cd'), cdn: el.querySelector('.cdn'), cost: el.querySelector('.cost'), key, i });
    });
    const pe = document.createElement('div'); pe.className = 'slot pot';
    pe.innerHTML = `<canvas width="48" height="48"></canvas><div class="cd"></div><div class="cdn"></div><span class="key">${G.coop && key === 'handan' ? 'N' : 'R'}</span><span class="cost" style="color:#ffb0a0"></span>`;
    drawIcon(pe.querySelector('canvas'), { bg: '#3a1414', fg: '#ff8a7a', s: 'potion' });
    pe.addEventListener('click', () => { if (TOUCH_UI) return; drinkPotion(G.coop ? P[key] : ctrlHero()); });
    bindTip(pe, () => `<div class="t">Healing Draught</div><div class="s">${G.potions} carried · 20s shared cooldown</div><div style="margin-top:4px">Restores 45% of the drinking hero's health. Sela and Dorrak supply them.</div>`);
    bar.appendChild(pe);
    slotEls.push({ el: pe, cd: pe.querySelector('.cd'), cdn: pe.querySelector('.cdn'), cost: pe.querySelector('.cost'), key, pot: true });
    const de = document.createElement('div'); de.className = 'slot dodge';
    de.innerHTML = `<canvas width="48" height="48"></canvas><div class="cd"></div><div class="cdn"></div><span class="key">${G.coop ? (key === 'handan' ? 'R⇧' : 'L⇧') : '⇧'}</span>`;
    drawIcon(de.querySelector('canvas'), { bg: key === 'orhun' ? '#3a2a14' : '#0f3a30', fg: key === 'orhun' ? '#ffd9a0' : '#9ff5d0', s: key === 'orhun' ? 'roll' : 'blink' });
    de.addEventListener('click', () => { if (TOUCH_UI) return; dodge(G.coop ? P[key] : ctrlHero()); });
    bindTip(de, () => `<div class="t">${DODGE[key].name}</div><div class="s">${HERO[key].name} · ${DODGE[key].cd}s cooldown · Shift</div><div style="margin-top:4px">${key === 'orhun' ? 'Roll a few yards in the direction you are moving. Attacks pass through you while rolling.' : 'Step through the jade a few yards away. Attacks pass through you for a moment.'} Also breaks roots and chills.</div>`);
    bar.appendChild(de);
    slotEls.push({ el: de, cd: de.querySelector('.cd'), cdn: de.querySelector('.cdn'), cost: null, key, dodge: true, i: 'dodge' });
  });
}
function flashSlot(i, key) { const s = slotEls.find(x => !x.pot && x.key === key && x.i === i); if (!s) return; s.el.classList.add('flash'); setTimeout(() => s.el.classList.remove('flash'), 150); }

function renderTracker() {
  const el = $('tracker');
  const act = QUESTS.filter(q => G.q[q.id] && (G.q[q.id].st === 'active' || G.q[q.id].st === 'ready'));
  if (!act.length) {
    const next = QUESTS.find(q => qState(q.id) === 'avail');
    el.innerHTML = next ? `<div class="q"><h4>Next step</h4><div class="o">Speak with ${NPCS[next.giver].name}${next.zone ? '' : ''}</div></div>` : '';
    return;
  }
  el.innerHTML = act.slice(0, 4).map(q => {
    const s = G.q[q.id];
    if (s.st === 'ready') return `<div class="q"><h4>${q.name}</h4><div class="o done">Return to ${NPCS[qTurnin(q)].name}</div></div>`;
    return `<div class="q"><h4>${q.name}</h4>${q.obj.map((o, i) => `<div class="o ${s.prog[i] >= o.n ? 'done' : ''}">${o.label}: ${Math.min(s.prog[i], o.n)}/${o.n}</div>`).join('')}<div class="o" style="color:#8a877e;font-size:11px">${q.zone}</div></div>`;
  }).join('');
}

const toastEl = $('toast');
function toast(html) { const d = document.createElement('div'); d.innerHTML = html; toastEl.appendChild(d); while (toastEl.children.length > 4) toastEl.removeChild(toastEl.firstChild); setTimeout(() => d.remove(), 3400); }
let bannerT;
function banner(title, sub) { const b = $('banner'); b.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`; b.style.opacity = 1; clearTimeout(bannerT); bannerT = setTimeout(() => b.style.opacity = 0, 2600); }

/* ---------- Dialogue ---------- */
function speakerInfo(who) {
  if (who === 'orhun' || who === 'handan') return { name: HERO[who].name, portrait: who };
  if (NPCS[who]) return { name: NPCS[who].name, portrait: who };
  if (FOES[who]) return { name: FOES[who].name, portrait: who };
  return { name: '', portrait: null };
}
function playDialog(lines, onEnd) {
  if (G.dialog) { G.dialog.lines.push(...lines); if (onEnd) { const prev = G.dialog.onEnd; G.dialog.onEnd = () => { prev && prev(); onEnd(); }; } return; }
  G.dialog = { lines, i: 0, onEnd };
  showDialogLine();
}
function showDialogLine() {
  const d = G.dialog, l = d.lines[d.i];
  const el = $('dialog'); el.hidden = false;
  const info = speakerInfo(l.who);
  $('dlgWho').textContent = info.name || '';
  $('dlgWho').style.color = l.who === 'handan' ? '#46c495' : l.who === 'orhun' ? '#e0a64e' : FOES[l.who] ? '#ff7a6a' : '#e0a64e';
  $('dlgTxt').innerHTML = l.text;
  const pc = $('dlgPortrait');
  if (info.portrait) { pc.hidden = false; drawPortrait(pc, info.portrait); } else { pc.hidden = false; const g = pc.getContext('2d'); g.fillStyle = '#0b0e14'; g.fillRect(0, 0, 84, 84); g.fillStyle = '#46c495'; g.beginPath(); g.moveTo(42, 14); g.lineTo(56, 42); g.lineTo(42, 70); g.lineTo(28, 42); g.closePath(); g.fill(); g.fillStyle = '#c9f5df'; g.beginPath(); g.moveTo(42, 22); g.lineTo(48, 42); g.lineTo(42, 58); g.closePath(); g.fill(); }
  const acts = $('dlgActs'); acts.innerHTML = '';
  if (l.actions) {
    for (const a of l.actions) { const b = document.createElement('button'); b.className = 'btn' + (a.primary ? ' primary' : ''); b.textContent = a.label; b.addEventListener('click', ev => { ev.stopPropagation(); sfx('ui'); closeDialog(); a.fn && a.fn(); }); acts.appendChild(b); }
    $('dlgMore').hidden = true;
  } else $('dlgMore').hidden = false;
  $('dlgMore').textContent = d.i < d.lines.length - 1 ? 'Click or press Space to continue' : 'Click or press Space to close';
}
function advanceDialog() {
  const d = G.dialog; if (!d) return;
  if (d.lines[d.i].actions) return;
  sfx('ui');
  d.i++;
  if (d.i >= d.lines.length) closeDialog(); else showDialogLine();
}
function closeDialog() { const d = G.dialog; G.dialog = null; $('dialog').hidden = true; if (d && d.onEnd) d.onEnd(); }
$('dialog').addEventListener('click', advanceDialog);

function talkTo(n) {
  const id = n.id; const npc = NPCS[id];
  const ready = QUESTS.find(q => qTurnin(q) === id && G.q[q.id] && G.q[q.id].st === 'ready');
  if (ready) { playDialog([{ who: id, text: ready.done }], () => turnIn(ready)); return; }
  const avail = QUESTS.find(q => q.giver === id && qState(q.id) === 'avail');
  if (avail) {
    playDialog([{ who: id, text: `<b>${avail.name}</b><br>${avail.text}<br><span style="color:#9a978e;font-size:13px">Reward: ${avail.xp} xp · ${avail.gold}g${avail.item ? ' · ' + RARITY[avail.item].toLocaleLowerCase(document.documentElement.lang || 'en') + ' gear' : ''}${avail.potions ? ' · ' + avail.potions + ' draughts' : ''}</span>`,
      actions: [{ label: 'Accept', primary: true, fn: () => acceptQuest(avail) }, { label: 'Not now' }].concat(npc.vendor ? [{ label: 'Trade', fn: () => openChar(true) }] : []) }]);
    return;
  }
  const active = QUESTS.find(q => q.giver === id && G.q[q.id] && G.q[q.id].st === 'active');
  const line = active ? `${active.name}: ${active.obj.map((o, i) => `${o.label} ${Math.min(G.q[active.id].prog[i], o.n)}/${o.n}`).join(', ')}. ${pick(NPC_TALK[id])}` : pick(NPC_TALK[id]);
  playDialog([{ who: id, text: line, actions: npc.vendor ? [{ label: 'Trade', primary: true, fn: () => openChar(true) }, { label: 'Goodbye' }] : (id === 'sela' ? [{ label: 'Buy a draught (12g)', primary: true, fn: () => buyPotion() }, { label: 'Goodbye' }] : null) }]);
}
function buyPotion() { if (G.gold < 12) { toast('Not enough gold.'); sfx('deny'); return; } G.gold -= 12; G.potions++; sfx('coin'); toast('Bought a Healing Draught.'); refreshCharWin(); }

/* ---------- Character / bags / vendor ---------- */
let vendorMode = false;
function rollVendor() { G.vendorStock = [randomItem(G.level + 1, 1), randomItem(G.level + 1, 2), randomItem(G.level, 1)].map(it => ({ ...it, price: Math.round(it.value * 3.2) })); }
function itemTip(it, who) {
  const st = it.stats, lines = [];
  if (st.atk) lines.push(`+${st.atk} ${it.owner === 'handan' ? 'Spell Power' : 'Attack'}`);
  if (st.def) lines.push(`+${st.def} Armor`);
  if (st.hp) lines.push(`+${st.hp} Health`);
  if (st.crit) lines.push(`+${(st.crit * 100).toFixed(1)}% Critical`);
  const owner = it.owner === 'any' ? 'Either hero' : HERO[it.owner].name;
  let cmp = '';
  const tgtHero = it.owner === 'any' ? (who || G.ctrl) : it.owner;
  const cur = G.equip[tgtHero][it.slot];
  if (cur && cur !== it) {
    const diff = k => (it.stats[k] || 0) - (cur.stats[k] || 0);
    const parts = [['atk', 'Atk'], ['def', 'Armor'], ['hp', 'Health'], ['crit', 'Crit']].map(([k, n]) => { const d = diff(k); if (!d) return ''; const v = k === 'crit' ? (d * 100).toFixed(1) + '%' : d; return `<span class="${d > 0 ? 'g' : 'bd'}">${d > 0 ? '+' : ''}${v} ${n}</span>`; }).filter(Boolean);
    if (parts.length) cmp = `<div class="s" style="margin-top:4px">vs equipped: ${parts.join(' · ')}</div>`;
  }
  return `<div class="t c${it.rarity}">${it.name}</div><div class="s">${RARITY[it.rarity]} ${it.wtype ? WPROF[it.wtype].name.toLocaleLowerCase(document.documentElement.lang || 'en') : it.slot} · ${owner} · item level ${it.ilvl}</div>${it.wtype ? `<div class="s" style="color:#cfc8b6">${WPROF[it.wtype].desc}</div>` : ''}<div style="margin-top:4px">${lines.join('<br>')}</div>${cmp}<div class="s" style="margin-top:4px">${vendorMode ? 'Click to sell for ' + it.value + 'g' : 'Click to equip'} · sells for ${it.value}g</div>`;
}
function equipItem(it, who) {
  const key = it.owner === 'any' ? who : it.owner;
  const cur = G.equip[key][it.slot];
  G.inv = G.inv.filter(x => x !== it);
  if (cur) G.inv.push(cur);
  G.equip[key][it.slot] = it;
  recalcStats(); sfx('ui'); refreshCharWin();
}
function unequip(key, slot) { const it = G.equip[key][slot]; if (!it) return; if (G.inv.length >= 999) { toast('Bags are full.'); return; } G.equip[key][slot] = null; G.inv.push(it); recalcStats(); refreshCharWin(); }
function openChar(vendor = false) { vendorMode = vendor; $('winChar').hidden = false; refreshCharWin(); }
function refreshCharWin() {
  const w = $('winChar'); if (w.hidden) return;
  hideTip();
  const col = key => {
    const h = P[key], eq = G.equip[key];
    return `<div class="charcol"><h3>${HERO[key].name} <span style="color:#9a978e;font-size:13px;font-family:var(--body)">· ${HERO[key].title}, ${HERO[key].age}</span></h3>
      <div class="stats"><span>Health</span><b>${h.maxHp}</b><span>${key === 'orhun' ? 'Attack' : 'Spell Power'}</span><b>${Math.round(h.atk)}</b><span>Armor</span><b>${Math.round(h.def)}</b><span>Critical</span><b>${(h.crit * 100).toFixed(1)}%</b><span>${key === 'orhun' ? 'Rage' : 'Mana'}</span><b>${h.resMax}</b></div>
      <div class="eqrow">${['weapon', 'armor', 'trinket'].map(s => `<div class="eq ${eq[s] ? 'r' + eq[s].rarity : ''}" data-eq="${key}:${s}">${eq[s] ? '<canvas width="36" height="36"></canvas>' : ''}<span class="lab">${s}</span></div>`).join('')}</div>
      <div style="font-size:12px;color:#9a978e">Talents: ${Object.keys(G.talents[key]).map(id => { for (const lv in TALENTS) for (const tt of TALENTS[lv][key]) if (tt[0] === id) return tt[1]; return id; }).join(', ') || 'none yet'}</div></div>`;
  };
  const stock = vendorMode ? `<div style="margin-top:12px;border-top:1px solid var(--edge);padding-top:10px"><h3>Dorrak's wares</h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button class="btn" data-buy="pot">Healing Draught · 12g</button>
      ${G.vendorStock.map((it, i) => `<button class="btn" data-buy="${i}" style="display:flex;gap:6px;align-items:center"><span class="c${it.rarity}">${it.name}</span> · ${it.price}g</button>`).join('')}
    </div><div style="font-size:12px;color:#9a978e;margin-top:6px">Click an item in your bags to sell it.</div></div>` : '';
  w.innerHTML = `<h2>Party &amp; bags <span style="display:flex;gap:10px;align-items:center"><span class="gold">${G.gold}g</span><button class="x" data-close="winChar" aria-label="Close">×</button></span></h2>
    <div class="chargrid">${col('orhun')}${col('handan')}</div>
    <div class="bag">${Array.from({ length: Math.max(24, Math.ceil((G.inv.length + 1) / 8) * 8) }, (_, i) => { const it = G.inv[i]; return `<div class="bagslot ${it ? 'r' + it.rarity : ''}" data-bag="${i}">${it ? '<canvas width="36" height="36"></canvas>' : ''}</div>`; }).join('')}</div>
    <div style="font-size:12px;color:#9a978e;margin-top:6px">${G.potions} Healing Draughts · Trinkets go to the hero you are playing (${HERO[G.ctrl].name}).</div>${stock}`;
  w.querySelectorAll('[data-eq]').forEach(el => {
    const [key, s] = el.dataset.eq.split(':'); const it = G.equip[key][s];
    if (it) { drawItemIcon(el.querySelector('canvas'), it); bindTip(el, () => itemTip(it, key) + '<div class="s">Click to unequip</div>'); el.addEventListener('click', () => unequip(key, s)); }
  });
  w.querySelectorAll('[data-bag]').forEach(el => {
    const it = G.inv[+el.dataset.bag]; if (!it) return;
    drawItemIcon(el.querySelector('canvas'), it);
    bindTip(el, () => itemTip(it));
    el.addEventListener('click', () => { if (vendorMode) { G.inv = G.inv.filter(x => x !== it); G.gold += it.value; sfx('coin'); refreshCharWin(); } else equipItem(it, G.ctrl); });
  });
  w.querySelectorAll('[data-buy]').forEach(el => {
    const v = el.dataset.buy;
    if (v !== 'pot') bindTip(el, () => itemTip(G.vendorStock[+v]));
    el.addEventListener('click', () => {
      if (v === 'pot') return buyPotion();
      const it = G.vendorStock[+v]; if (!it) return;
      if (G.gold < it.price) { toast('Not enough gold.'); sfx('deny'); return; }
      if (G.inv.length >= 999) { toast('Bags are full.'); return; }
      G.gold -= it.price; G.vendorStock.splice(+v, 1); const { price, ...rest } = it; G.inv.push(rest); sfx('coin'); refreshCharWin();
    });
  });
}

/* ---------- Quest log ---------- */
let selQuest = null;
function openQuests() { $('winQuests').hidden = false; refreshQuests(); }
function refreshQuests() {
  const w = $('winQuests');
  const known = QUESTS.filter(q => G.q[q.id]);
  if (!selQuest || !G.q[selQuest]) selQuest = (known.find(q => G.q[q.id].st !== 'done') || known[0] || {}).id;
  const q = QUESTS.find(x => x.id === selQuest);
  w.innerHTML = `<h2>Quest log <button class="x" data-close="winQuests" aria-label="Close">×</button></h2>
    <div class="qlist"><div class="qitems">${known.length ? known.map(k => `<div class="qitem ${G.q[k.id].st === 'done' ? 'done' : ''} ${k.id === selQuest ? 'sel' : ''}" data-q="${k.id}">${k.name}${G.q[k.id].st === 'ready' ? '<span class="st">✓</span>' : ''}</div>`).join('') : '<div style="color:#9a978e">No quests yet. Look for a gold ! above someone\'s head.</div>'}</div>
    <div class="qdesc">${q ? `<h3>${q.name}</h3><div style="color:#9a978e;font-size:12px;margin-bottom:6px">${NPCS[q.giver].name} · ${q.zone}</div><p>${q.text}</p>${q.obj.map((o, i) => `<div class="o">${G.q[q.id].prog[i] >= o.n ? '✓' : '·'} ${o.label}: ${Math.min(G.q[q.id].prog[i], o.n)}/${o.n}</div>`).join('')}<p style="color:#9a978e">Reward: ${q.xp} xp · ${q.gold}g${q.item ? ' · ' + RARITY[q.item].toLocaleLowerCase(document.documentElement.lang || 'en') + ' gear' : ''}</p>` : ''}</div></div>`;
  w.querySelectorAll('[data-q]').forEach(el => el.addEventListener('click', () => { selQuest = el.dataset.q; refreshQuests(); }));
}

/* ---------- Talents ---------- */
let talentSel = {};
function openTalent(lv) {
  G.pendingTalent = null; G.paused = true; talentSel = {};
  const w = $('talent'); w.hidden = false;
  const draw = () => {
    w.innerHTML = `<h2>Level ${lv} talents</h2><p style="margin:0 0 12px;color:#cfc8b6">Choose one talent for each hero. Choices are permanent.</p>
    ${['orhun', 'handan'].map(k => `<h3 style="color:${k === 'orhun' ? '#e0a64e' : '#46c495'}">${HERO[k].name}</h3><div class="tpick">${TALENTS[lv][k].map(([id, n, d]) => `<div class="tcard ${talentSel[k] === id ? 'sel' : ''}" data-k="${k}" data-id="${id}" tabindex="0"><b>${n}</b><span>${d}</span></div>`).join('')}</div>`).join('')}
    <div style="display:flex;justify-content:flex-end"><button class="btn primary" id="tConfirm" ${talentSel.orhun && talentSel.handan ? '' : 'disabled style="opacity:.5"'}>Confirm</button></div>`;
    w.querySelectorAll('.tcard').forEach(el => el.addEventListener('click', () => { talentSel[el.dataset.k] = el.dataset.id; sfx('ui'); draw(); }));
    const b = $('tConfirm'); b.addEventListener('click', () => {
      if (!(talentSel.orhun && talentSel.handan)) return;
      G.talents.orhun[talentSel.orhun] = true; G.talents.handan[talentSel.handan] = true; G.talentPicks[lv] = true;
      recalcStats(); w.hidden = true; G.paused = false; sfx('quest'); toast('Talents learned.'); buildActionBar(); saveGame(true);
    });
  };
  draw();
}

/* ---------- Ending ---------- */
function showEnding() {
  G.ended = true;
  playDialog([
    { who: 'narrator', text: 'The First Lantern catches. Jade fire climbs the throne hall, and across Velmara every dark lantern answers at once.' },
    { who: 'ayla', text: 'Two hundred years I waited for that light. Thank you, both of you. I can rest now.' },
    { who: 'orhun', text: 'We did it. Handan, look at the windows. The whole valley is lit.' },
    { who: 'handan', text: 'We walked out together. Just like you said.' },
    { who: 'orhun', text: 'Just like we said.' },
  ], () => {
    const w = $('ending'); w.hidden = false;
    w.innerHTML = `<h2 style="justify-content:center">The Ember Road is lit</h2>
      <p>Orhun and Handan relit all three beacons and broke the Hollow King. Lanternhold will see morning.</p>
      ${G.q.q16 && G.q.q16.st === 'done' ? '' : '<p style="color:#9fdcff">But a cold wind is blowing down from the north. When you are ready, return to Lanternhold. Chapter II awaits.</p>'}
      <p style="color:#9a978e">Level ${G.level} · ${G.kills} Hollow defeated · ${G.gold} gold carried</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button class="btn primary" id="endStay">Keep exploring</button><button class="btn" id="endNew">Start a new journey</button></div>`;
    $('endStay').onclick = () => { w.hidden = true; };
    $('endNew').onclick = () => { w.hidden = true; newGame(); };
  });
}
function showEnding2() {
  G.ended = true;
  playDialog([
    { who: 'narrator', text: 'The Forge of the First Flame roars back to life. Far below, every lantern in Velmara burns a little brighter, and by morning the north road is green again.' },
    { who: 'kael', text: 'Twenty years I watched that chimney. I never thought I would see smoke from it again.' },
    { who: 'handan', text: 'The pendant is warm. It feels finished, like it was waiting for this the whole time.' },
    { who: 'orhun', text: 'So what now? There are no more beacons left to light.' },
    { who: 'handan', text: 'Now we walk home. Slowly. Together.' },
  ], () => {
    const w = $('ending'); w.hidden = false;
    w.innerHTML = `<h2 style="justify-content:center">The First Flame burns</h2>
      <p>Orhun and Handan relit the Forge of the First Flame and broke Vyrmhal, the Cold Crown. The lanterns of Velmara will not go dark again.</p>
      <p style="color:#9a978e">Level ${G.level} · ${G.kills} foes defeated · ${G.gold} gold carried</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button class="btn primary" id="endStay">Keep exploring</button><button class="btn" id="endNew">Start a new journey</button></div>`;
    $('endStay').onclick = () => { w.hidden = true; };
    $('endNew').onclick = () => { w.hidden = true; newGame(); };
  });
}

/* ---------- Save / load ---------- */
const SAVE_KEY = 'jadeborn_ember_road_v1';
function serialize() {
  const c = ctrlHero();
  return { v: 1, zone: G.zone ? G.zone.id : 'town', pos: [c.x, c.y], ctrl: G.ctrl, level: G.level, xp: G.xp, gold: G.gold, inv: G.inv, equip: G.equip, potions: G.potions, q: G.q, beacons: G.beacons,
    bossDead: G.bossDead, talents: G.talents, talentPicks: G.talentPicks, picked: G.picked, gauge: G.gauge, vendorStock: G.vendorStock, seen: G.seenBanter, gate: G.gateOpen, frostGate: !!G.frostGate, loadout: G.loadout, autoSkills: G.autoSkills, boons: G.boons, boonStacks: G.boonStacks, boonLog: G.boonLog, pendingBoons: G.pendingBoons, kills: G.kills, ended: G.ended,
    hp: { orhun: P.orhun.hp, handan: P.handan.hp }, coop: G.coop };
}
function saveGame(silent) { if (!G.started) return; const ok = store(SAVE_KEY, serialize()); if (!silent) toast(ok ? 'Journey saved.' : 'Saving is blocked in this browser.'); }
function resetState() {
  Object.assign(G, { ctrl: 'orhun', coop: G.coop, level: 1, xp: 0, gold: 15, inv: [], potions: 3, potCd: 0, gauge: 0, equip: { orhun: {}, handan: {} }, q: {}, beacons: {}, bossDead: {}, talents: { orhun: {}, handan: {} }, talentPicks: {}, picked: {}, gateOpen: false, frostGate: false, blizzard: false, eclipse: false, target: null, loadout: { orhun: DEFAULT_LOADOUT.orhun.slice(), handan: DEFAULT_LOADOUT.handan.slice() }, autoSkills: { orhun: {}, handan: {} }, boons: {}, boonStacks: {}, boonLog: [], pendingBoons: 0, boonOffer: null, seenBanter: {}, wipeT: 0, kills: 0, ended: false, pendingTalent: null, dialog: null });
  P.orhun = makeHero('orhun'); P.handan = makeHero('handan'); P.fox = makeFox();
  syncLoadout();
  recalcStats();
  for (const h of heroes()) h.hp = h.maxHp; P.handan.res = P.handan.resMax; P.fox.hp = P.fox.maxHp;
}
function loadState(d) {
  resetState();
  Object.assign(G, { ctrl: d.ctrl || 'orhun', level: d.level, xp: d.xp, gold: d.gold, inv: d.inv || [], equip: d.equip || { orhun: {}, handan: {} }, potions: d.potions, q: d.q || {}, beacons: d.beacons || {}, bossDead: d.bossDead || {},
    talents: d.talents || { orhun: {}, handan: {} }, talentPicks: d.talentPicks || {}, picked: d.picked || {}, gauge: d.gauge || 0, vendorStock: d.vendorStock || [], seenBanter: d.seen || {}, gateOpen: !!d.gate, frostGate: !!d.frostGate, kills: d.kills || 0, loadout: d.loadout || { orhun: DEFAULT_LOADOUT.orhun.slice(), handan: DEFAULT_LOADOUT.handan.slice() }, autoSkills: d.autoSkills || { orhun: {}, handan: {} }, boons: d.boons || {}, boonStacks: d.boonStacks || {}, boonLog: d.boonLog || [], pendingBoons: d.pendingBoons || 0, ended: !!d.ended, coop: !!d.coop });
  syncLoadout();
  recalcStats();
  for (const h of heroes()) h.hp = h.maxHp; P.handan.res = P.handan.resMax;
  for (const lv in TALENTS) if (G.level >= +lv && !G.talentPicks[lv]) { G.pendingTalent = +lv; break; }
  enterZone(d.zone || 'town', null, d.pos);
}

/* ---------- Input wiring ---------- */
function anyWindowOpen() { return ['winChar', 'winQuests', 'help', 'talent', 'ending', 'winTravel', 'boonWin'].some(id => $(id) && !$(id).hidden); }
function closeWindows() { let any = false; for (const id of ['winChar', 'winQuests', 'help', 'winTravel']) if ($(id) && !$(id).hidden) { $(id).hidden = true; any = true; } hideTip(); vendorMode = false; return any; }
function onKeyPress(k, e) {
  if (!G.started) { if (k === 'enter') { ($('bContinue').hidden ? $('bNew') : $('bContinue')).click(); } return; }
  SND.init();
  if (!$('talent').hidden || ($('boonWin') && !$('boonWin').hidden)) return;
  if (G.dialog) { if (k === ' ' || k === 'e' || k === 'enter') advanceDialog(); if (k === 'escape' && !G.dialog.lines[G.dialog.i].actions) closeDialog(); return; }
  if (G.coop) {
    const h2 = P.handan, code = e && e.code || '';
    const np = code.match(/^Numpad([1-6])$/);
    const p2i = np ? +np[1] - 1 : ['u', 'i', 'o', 'j', 'k', 'l'].indexOf(k);
    if (p2i >= 0) { useAbility(h2, p2i); return; }
    if (k === 'enter' || code === 'NumpadEnter') { interact(h2); return; }
    if (k === 'p' || code === 'Numpad0') { cycleTarget(h2); return; }
    if (k === 'n') { drinkPotion(h2); return; }
    if (k === 'm') { lanternburst(h2); return; }
    if (k === 'shift') { dodge(code === 'ShiftRight' ? h2 : P.orhun); return; }
    if (k === 'r') { drinkPotion(P.orhun); return; }
    if (k === 'e' || k === ' ') { interact(P.orhun); return; }
    if (k === 'f') { lanternburst(P.orhun); return; }
  }
  switch (k) {
    case 'x': if ($('winQuests').hidden) openQuests(); else $('winQuests').hidden = true; break;
    case 'escape': if (!closeWindows()) { G.target = null; G.autoAtk = false; } break;
    case '1': case '2': case '3': case '4': case '5': case '6': useAbility(ctrlHero(), +k - 1); break;
    case 'q': swapHero(); break;
    case 'shift': dodge(ctrlHero()); break;
    case 't': if ($('winTravel').hidden) openTravel(); else $('winTravel').hidden = true; break;
    case 'k': if ($('winChar').hidden || charTab !== 'skills') { charTab = 'skills'; openChar(false); } else { $('winChar').hidden = true; hideTip(); } break;
    case 'v': mountToggle(); break;
    case 'z': setAutoCast(!G.autoCast); break;
    case 'tab': cycleTarget(); break;
    case 'f': lanternburst(); break;
    case 'r': drinkPotion(); break;
    case 'e': case ' ': interact(); break;
    case 'c': case 'i': case 'b': if ($('winChar').hidden) openChar(false); else { $('winChar').hidden = true; hideTip(); } break;
    case 'l': case 'j': if ($('winQuests').hidden) openQuests(); else $('winQuests').hidden = true; break;
    case 'h': $('help').hidden = !$('help').hidden; break;
    case 'm': $('bSound').click(); break;
  }
}
function screenToWorld(ev) { return { x: ev.clientX / ZOOM + G.cam.x, y: ev.clientY / ZOOM + G.cam.y }; }
function hitFoe(p) { let best = null, bd = 1e9; for (const f of G.foes) { if (f.dead) continue; const sc = f.def.scale || 1, top = f.y - (f.def.boss ? 70 : 40 * sc); if (Math.abs(p.x - f.x) < f.r + (TOUCH_UI ? 24 : 12) && p.y > top - (TOUCH_UI ? 10 : 0) && p.y < f.y + (TOUCH_UI ? 20 : 10)) { const d = Math.abs(p.x - f.x) + Math.abs(p.y - (f.y - 15)); if (d < bd) { bd = d; best = f; } } } return best; }
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', ev => {
  if (!G.started || G.dialog || G.paused) return;
  SND.init();
  if (anyWindowOpen() && !$('talent').hidden) return;
  const p = screenToWorld(ev);
  const f = hitFoe(p);
  if (f) { G.target = f; G.autoAtk = true; const c = ctrlHero(); if (dist(c, f) - f.r - c.r > weaponReach(c)) G.moveTo = { foe: f }; return; }
  for (const n of G.npcs) if (Math.abs(p.x - n.x) < (TOUCH_UI ? 28 : 16) && p.y > n.y - 56 && p.y < n.y + (TOUCH_UI ? 20 : 8)) { if (dist(n, ctrlHero()) < 1.8 * TILE) talkTo(n); else G.moveTo = { npc: n }; return; }
  for (const h of heroes()) if (!h.dead && Math.abs(p.x - h.x) < 14 && p.y > h.y - 48 && p.y < h.y + 6) { G.target = h; G.autoAtk = false; return; }
  for (const b of G.zone.beacons) { const X = (b.x + .5) * TILE, Y = (b.y + .5) * TILE; if (Math.abs(p.x - X) < 22 && p.y > Y - 60 && p.y < Y + 10) { if (nearestBeacon()) { interact(); return; } } }
  if (TOUCH_UI && window.joyStart && ev.clientX < W * .5 && joyStart(ev)) return;
  G.moveTo = { x: p.x, y: p.y };
});
cv.addEventListener('pointermove', ev => { if (!G.started) return; const p = screenToWorld(ev); cv.style.cursor = hitFoe(p) ? 'pointer' : 'crosshair'; });
document.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) { $(c.dataset.close).hidden = true; hideTip(); vendorMode = false; } });
$('bChar').onclick = () => { SND.init(); $('winChar').hidden ? openChar(false) : ($('winChar').hidden = true); };
$('bQuest').onclick = () => { $('winQuests').hidden ? openQuests() : ($('winQuests').hidden = true); };
$('bHelp').onclick = () => { $('help').hidden = !$('help').hidden; };
$('bHelp2').onclick = () => { $('help').hidden = !$('help').hidden; };
$('bSave').onclick = () => saveGame(false);
$('bSound').onclick = () => { SND.init(); const on = SND.toggle(); $('bSound').textContent = 'Sound: ' + (on ? 'on' : 'off'); };
$('swapBtn').onclick = () => swapHero();
function setCoop(on) {
  G.coop = on; G.ctrl = 'orhun'; G.moveTo = null;
  store('jadeborn_coop', on);
  $('bPlayers').textContent = on ? 'Players: 2 · shared keyboard' : 'Players: 1';
  $('bCoop').textContent = on ? 'Co-op: on' : 'Co-op: off';
  for (const el of document.querySelectorAll('.coopOnly')) el.hidden = !on;
  if (G.started) { buildActionBar(); renderParty(); toast(on ? 'Two-player mode: P1 Orhun (WASD, 1–6), P2 Handan (arrows, U I O J K L).' : 'Single-player mode. Q swaps heroes.'); }
}
$('bPlayers').onclick = () => { sfx('ui'); setCoop(!G.coop); };
$('bCoop').onclick = () => { SND.init(); setCoop(!G.coop); };
$('gauge').onclick = () => lanternburst();

/* ---------- Boot ---------- */
function fixReachability() {
  for (const z of Object.values(ZONES)) {
    const reach = new Uint8Array(z.w * z.h);
    const e = Object.values(z.entries)[0];
    const q = [[Math.floor(e[0]), Math.floor(e[1])]];
    const open = (x, y) => { const t = z.get(x, y); return t === T.GATE || !SOLID.has(t); };
    reach[q[0][1] * z.w + q[0][0]] = 1;
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= z.w || ny >= z.h) continue; const i = ny * z.w + nx; if (reach[i] || !open(nx, ny)) continue; reach[i] = 1; q.push([nx, ny]); } }
    const ok = (x, y) => { x = Math.floor(x); y = Math.floor(y); if (x < 1 || y < 1 || x >= z.w - 1 || y >= z.h - 1) return false; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (!reach[(y + dy) * z.w + x + dx]) return false; return true; };
    const fix = o => { if (ok(o.x, o.y)) return; for (let r = 1; r < 14; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue; if (ok(o.x + i, o.y + j)) { o.x = Math.floor(o.x) + i; o.y = Math.floor(o.y) + j; return; } } };
    z.spawns.forEach(fix); z.pickups.forEach(fix);
  }
}
function drawTitleHeroes() {
  for (const [id, k] of [['tOrhun', 'orhun'], ['tHandan', 'handan']]) { const c = $(id), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height); g.drawImage(heroSprite(k, LOOKS[k], 0, 0), 2, 0, 16, 25, 0, 0, 96, 150); }
}
function startPlaying() {
  $('title').hidden = true; $('hud').hidden = false; G.started = true;
  renderParty(); buildActionBar(); renderTracker();
}
function newGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  resetState(); rollVendor();
  enterZone('town', 'start');
  startPlaying();
  G.seenBanter.Lanternhold = true;
  setTimeout(() => playDialog(BANTER.intro.map(([w, t]) => ({ who: w, text: t }))), 600);
  saveGame(true);
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  try { update(dt); render(dt); if (G.started) { updateHUD(dt); renderMinimap(); } }
  catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
function boot(data) {
  initZones(); fixReachability();
  resetState();
  drawTitleHeroes();
  setCoop(!!load('jadeborn_coop'));
  const saved = (data && data.v) ? data : load(SAVE_KEY);
  if (saved && saved.v === 1) { $('bContinue').hidden = false; $('bContinue').onclick = () => { SND.init(); const co = G.coop; loadState(saved); G.coop = co; startPlaying(); }; }
  $('bNew').onclick = () => { SND.init(); newGame(); };
  // background scene behind the title
  enterZone('town', 'start'); $('banner').style.opacity = 0;
  if (data && data.v && data.resume) { loadState(data); startPlaying(); }
  requestAnimationFrame(frame);
}

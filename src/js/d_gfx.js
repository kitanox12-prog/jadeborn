/* ===================== GRAPHICS ===================== */
const PAL = {
  snow:   { grass: ['#d6e0ec', '#dce6f1', '#d0dbe8', '#e2eaf4'], dg: ['#c2cfdf', '#c8d4e4', '#bcc9db'], blade: '#aebdd0', flower: ['#ffffff', '#a9d4ff'], path: ['#a6b1c2', '#9fabbd', '#adb8c9'], pebble: '#8994a8' },
  meadow: { grass: ['#2c4a2b', '#31502e', '#294527', '#355631'], dg: ['#223a24', '#264028', '#1f3622'], blade: '#4c7a3e', flower: ['#e8d36a', '#d97a9a', '#a9c8f0', '#f4f0e0'], path: ['#6b5538', '#644f34', '#735b3c'], pebble: '#8a7658' },
  town:   { grass: ['#2c4a2b', '#31502e', '#294527', '#355631'], dg: ['#223a24', '#264028', '#1f3622'], blade: '#4c7a3e', flower: ['#e8d36a', '#d97a9a', '#f4f0e0'], path: ['#6b5538', '#644f34', '#735b3c'], pebble: '#8a7658' },
  marsh:  { grass: ['#26352a', '#2a3a2e', '#233127'], dg: ['#1e2c24', '#213027', '#1b2821'], blade: '#3f5a3a', flower: ['#b8e6c8', '#8a9a7a'], path: ['#4e4434', '#4a4030', '#544838'], pebble: '#6a6050' },
  keep:   { grass: ['#2a2e2a', '#2e322c'], dg: ['#262a24', '#2a2e26', '#232622'], blade: '#4a5440', flower: ['#9a8aa8'], path: ['#3a3640', '#37333c'], pebble: '#55505c' },
};

function renderZone(z) {
  const pw = z.w * TILE, ph = z.h * TILE;
  const base = document.createElement('canvas'); base.width = pw; base.height = ph;
  const over = document.createElement('canvas'); over.width = pw; over.height = ph;
  const g = base.getContext('2d'), o = over.getContext('2d');
  const P = PAL[z.style];
  const h = (x, y, s) => hash2(x, y, s + z.seed);
  const px = (c, x, y, w = 2, hh = 2) => { g.fillStyle = c; g.fillRect(x, y, w, hh); };
  const isT = (x, y, ...ts) => ts.includes(z.get(x, y));
  for (let ty = 0; ty < z.h; ty++) for (let tx = 0; tx < z.w; tx++) {
    const t = z.get(tx, ty), X = tx * TILE, Y = ty * TILE;
    const ground = (arr) => {
      g.fillStyle = arr[Math.floor(h(tx, ty, 1) * arr.length)]; g.fillRect(X, Y, TILE, TILE);
      for (let i = 0; i < 7; i++) px(arr[Math.floor(h(tx * 7 + i, ty, 2) * arr.length)], X + Math.floor(h(tx, ty * 9 + i, 3) * 15) * 2, Y + Math.floor(h(tx * 3 + i, ty, 4) * 15) * 2, 4, 4);
      for (let i = 0; i < 5; i++) px(P.blade, X + Math.floor(h(tx, ty + i * 31, 5) * 16) * 2, Y + Math.floor(h(tx + i * 17, ty, 6) * 16) * 2, 2, 4);
    };
    switch (t) {
      case T.GRASS: case T.TREE: case T.ROCK: ground(P.grass);
        if (t === T.GRASS && h(tx, ty, 9) > .9) for (let i = 0; i < 3; i++) px(P.flower[Math.floor(h(tx + i, ty, 10) * P.flower.length)], X + 4 + Math.floor(h(tx, ty + i, 11) * 12) * 2, Y + 4 + Math.floor(h(tx + i, ty, 12) * 12) * 2, 3, 3);
        break;
      case T.DGRASS: ground(P.dg);
        if (z.style === 'marsh' && h(tx, ty, 13) > .8) { g.fillStyle = '#3d4a2c'; g.fillRect(X + 10, Y + 8, 2, 12); g.fillRect(X + 14, Y + 6, 2, 14); g.fillStyle = '#5a4a2a'; g.fillRect(X + 13, Y + 4, 4, 5); }
        break;
      case T.PATH: ground(P.path);
        for (let i = 0; i < 4; i++) px(P.pebble, X + Math.floor(h(tx + i, ty, 14) * 14) * 2 + 2, Y + Math.floor(h(tx, ty + i, 15) * 14) * 2 + 2, 3, 2);
        break;
      case T.MARSH: ground(['#2a3a30', '#2c3d31', '#28372e']);
        g.fillStyle = 'rgba(30,60,70,.55)'; g.beginPath(); g.ellipse(X + 8 + h(tx, ty, 16) * 16, Y + 10 + h(tx, ty, 17) * 12, 6 + h(tx, ty, 18) * 6, 3 + h(tx, ty, 19) * 3, 0, 0, 7); g.fill();
        break;
      case T.PLAZA: {
        g.fillStyle = z.style === 'marsh' ? '#3e463e' : '#4f4c56'; g.fillRect(X, Y, TILE, TILE);
        g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(X, Y + 15, TILE, 2); g.fillRect(X + (ty % 2 ? 8 : 24), Y, 2, 15); g.fillRect(X + (ty % 2 ? 24 : 8), Y + 17, 2, 15);
        g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(X + 2, Y + 2, 12, 2);
        if (h(tx, ty, 20) > .7) { g.fillStyle = 'rgba(70,110,60,.5)'; g.fillRect(X + h(tx, ty, 21) * 26, Y + 14, 6, 3); }
        break; }
      case T.FLOOR: {
        g.fillStyle = ['#2a2830', '#2d2a33', '#27252d'][Math.floor(h(tx, ty, 22) * 3)]; g.fillRect(X, Y, TILE, TILE);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X, Y, TILE, 1); g.fillRect(X, Y, 1, TILE);
        g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(X + 1, Y + 1, TILE - 2, 1);
        if (h(tx, ty, 23) > .85) { g.strokeStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.moveTo(X + 6, Y + 8); g.lineTo(X + 14, Y + 16); g.lineTo(X + 12, Y + 26); g.stroke(); }
        break; }
      case T.ICE: {
        g.fillStyle = ['#9cc6de', '#a4cce2', '#96c0da'][Math.floor(h(tx, ty, 60) * 3)]; g.fillRect(X, Y, TILE, TILE);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(X + h(tx, ty, 61) * 20, Y + 6 + h(tx, ty, 62) * 18, 10 + h(tx, ty, 63) * 10, 2);
        if (h(tx, ty, 64) > .7) { g.strokeStyle = 'rgba(60,110,150,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X + 4, Y + 6 + h(tx, ty, 65) * 20); g.lineTo(X + 16, Y + 14); g.lineTo(X + 28, Y + 8 + h(tx, ty, 66) * 18); g.stroke(); }
        if (!isT(tx, ty - 1, T.ICE)) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(X, Y, TILE, 2); }
        break; }
      case T.WATER: case T.DEEP: {
        g.fillStyle = t === T.DEEP ? '#0f2638' : (z.style === 'marsh' ? '#1a3438' : '#1b3a52'); g.fillRect(X, Y, TILE, TILE);
        g.fillStyle = 'rgba(120,180,220,.12)';
        for (let i = 0; i < 2; i++) g.fillRect(X + Math.floor(h(tx, ty + i, 24) * 10) * 2, Y + 6 + i * 14, 8 + h(tx, ty, 25) * 8, 2);
        g.fillStyle = 'rgba(150,200,220,.35)';
        if (!SOLID.has(z.get(tx, ty - 1)) && z.get(tx, ty - 1) !== T.BRIDGE) g.fillRect(X, Y, TILE, 3);
        g.fillStyle = 'rgba(0,0,0,.25)';
        if (!SOLID.has(z.get(tx, ty + 1))) g.fillRect(X, Y + TILE - 3, TILE, 3);
        break; }
      case T.BRIDGE: {
        const wet = isT(tx, ty - 1, T.WATER, T.DEEP) || isT(tx, ty + 1, T.WATER, T.DEEP);
        g.fillStyle = z.style === 'marsh' ? '#1a3438' : '#1b3a52'; g.fillRect(X, Y, TILE, TILE);
        const vert = isT(tx - 1, ty, T.WATER, T.DEEP) || isT(tx + 1, ty, T.WATER, T.DEEP);
        g.fillStyle = '#6b4a2b';
        for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#6b4a2b' : '#77532f'; if (vert && !wet) g.fillRect(X, Y + i * 8, TILE, 7); else g.fillRect(X + i * 8, Y, 7, TILE); }
        g.fillStyle = 'rgba(0,0,0,.3)'; if (vert && !wet) { g.fillRect(X, Y, 3, TILE); g.fillRect(X + TILE - 3, Y, 3, TILE); } else { g.fillRect(X, Y, TILE, 3); g.fillRect(X, Y + TILE - 3, TILE, 3); }
        break; }
      case T.WALL: {
        if (z.style === 'town') {
          g.fillStyle = '#8c7b62'; g.fillRect(X, Y, TILE, TILE);
          g.fillStyle = '#4a3424'; g.fillRect(X, Y, TILE, 4); g.fillRect(X, Y + TILE - 3, TILE, 3);
          if ((tx + ty) % 3 === 0) g.fillRect(X + 14, Y, 4, TILE);
          g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(X, Y + 4, TILE, 3);
        } else {
          const below = z.get(tx, ty + 1) !== T.WALL;
          g.fillStyle = below ? '#3e3a48' : '#1c1a22'; g.fillRect(X, Y, TILE, TILE);
          if (below) {
            g.fillStyle = 'rgba(0,0,0,.35)';
            for (let r = 0; r < 4; r++) { g.fillRect(X, Y + r * 8 + 7, TILE, 1); g.fillRect(X + ((r % 2) ? 4 : 18) + (tx % 2) * 6, Y + r * 8, 1, 8); }
            g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(X, Y, TILE, 2);
          } else {
            g.fillStyle = '#25222c'; g.fillRect(X + 2, Y + 2, TILE - 4, TILE - 4);
          }
        }
        break; }
      case T.ROOF: {
        g.fillStyle = '#5a2c26'; g.fillRect(X, Y, TILE, TILE);
        for (let r = 0; r < 4; r++) { g.fillStyle = r % 2 ? '#4e2520' : '#62322a'; for (let c = 0; c < 4; c++) g.fillRect(X + c * 8 + (r % 2) * 4, Y + r * 8, 7, 7); }
        if (z.get(tx, ty - 1) !== T.ROOF) { g.fillStyle = '#7a4434'; g.fillRect(X, Y, TILE, 4); }
        if (z.get(tx - 1, ty) !== T.ROOF) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X, Y, 3, TILE); }
        if (z.get(tx + 1, ty) !== T.ROOF) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X + TILE - 3, Y, 3, TILE); }
        break; }
      case T.GATE: { g.fillStyle = '#2a2830'; g.fillRect(X, Y, TILE, TILE); break; }
      case T.VOID: g.fillStyle = '#05060a'; g.fillRect(X, Y, TILE, TILE); break;
    }
    // soft edges between grass and path
    if ((t === T.GRASS || t === T.DGRASS) && (isT(tx + 1, ty, T.PATH) || isT(tx - 1, ty, T.PATH) || isT(tx, ty + 1, T.PATH) || isT(tx, ty - 1, T.PATH))) {
      for (let i = 0; i < 6; i++) px(P.path[0], X + Math.floor(h(tx + i, ty, 40) * 15) * 2, Y + Math.floor(h(tx, ty + i, 41) * 15) * 2, 3, 3);
    }
    if (t === T.TREE) {
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X + 16, Y + 26, 14, 6, 0, 0, 7); g.fill();
      g.fillStyle = z.canopy === 'dead' ? '#3a3028' : '#4a3222'; g.fillRect(X + 12, Y + 8, 8, 20);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X + 17, Y + 8, 3, 20);
      drawCanopy(o, X + 16, Y + 6, z.canopy, h(tx, ty, 50), h(tx, ty, 51));
    }
    if (t === T.ROCK) {
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X + 16, Y + 26, 13, 5, 0, 0, 7); g.fill();
      g.fillStyle = z.style === 'keep' ? '#4a4652' : z.style === 'snow' ? '#6a7484' : '#5f6068'; g.beginPath(); g.moveTo(X + 4, Y + 26); g.lineTo(X + 7, Y + 10); g.lineTo(X + 16, Y + 4); g.lineTo(X + 26, Y + 9); g.lineTo(X + 29, Y + 26); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(X + 8, Y + 12); g.lineTo(X + 16, Y + 6); g.lineTo(X + 18, Y + 14); g.closePath(); g.fill();
      if (z.style === 'snow') { g.fillStyle = '#eef4fb'; g.beginPath(); g.moveTo(X + 7, Y + 11); g.lineTo(X + 16, Y + 4); g.lineTo(X + 26, Y + 9); g.lineTo(X + 22, Y + 13); g.lineTo(X + 14, Y + 10); g.lineTo(X + 10, Y + 14); g.closePath(); g.fill(); }
      if (z.style === 'keep') { g.fillStyle = '#35323c'; g.fillRect(X + 8, Y - 14, 16, 26); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(X + 8, Y - 14, 4, 26); }
    }
  }
  // static decor
  for (const d of z.decor) {
    const X = d.x * TILE, Y = d.y * TILE;
    switch (d.type) {
      case 'door': g.fillStyle = '#3a2416'; g.fillRect(X + 8, Y + 2, 16, 30); g.fillStyle = '#2a180e'; g.fillRect(X + 15, Y + 2, 2, 30); g.fillStyle = '#e0a64e'; g.fillRect(X + 19, Y + 16, 3, 3); break;
      case 'window': g.fillStyle = '#2a1c12'; g.fillRect(X + 8, Y + 6, 16, 14); g.fillStyle = '#f0b860'; g.fillRect(X + 10, Y + 8, 12, 10); g.fillStyle = '#2a1c12'; g.fillRect(X + 15, Y + 8, 2, 10); g.fillRect(X + 10, Y + 12, 12, 2); break;
      case 'lantern': g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X + 16, Y + 28, 6, 3, 0, 0, 7); g.fill(); g.fillStyle = '#2a2420'; g.fillRect(X + 14, Y - 6, 4, 34); g.fillStyle = '#3a322a'; g.fillRect(X + 10, Y - 10, 12, 4); break;
      case 'brazier': g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X + 16, Y + 28, 9, 4, 0, 0, 7); g.fill(); g.fillStyle = '#3a3036'; g.fillRect(X + 9, Y + 12, 14, 6); g.fillRect(X + 14, Y + 18, 4, 10); g.fillRect(X + 10, Y + 26, 12, 3); break;
      case 'statue': g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X + 16, Y + 28, 10, 4, 0, 0, 7); g.fill(); g.fillStyle = '#6a6a72'; g.fillRect(X + 8, Y + 18, 16, 10); g.fillRect(X + 11, Y - 6, 10, 24); g.fillRect(X + 12, Y - 14, 8, 8); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(X + 11, Y - 6, 3, 24); g.fillStyle = 'rgba(80,120,60,.6)'; g.fillRect(X + 18, Y + 4, 4, 6); break;
      case 'tent': g.fillStyle = '#5a4a32'; g.beginPath(); g.moveTo(X - 8, Y + 30); g.lineTo(X + 16, Y - 6); g.lineTo(X + 40, Y + 30); g.closePath(); g.fill(); g.fillStyle = '#2a2014'; g.beginPath(); g.moveTo(X + 10, Y + 30); g.lineTo(X + 16, Y + 12); g.lineTo(X + 22, Y + 30); g.closePath(); g.fill(); break;
      case 'campfire': g.fillStyle = '#4a3a2a'; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.fillRect(X + 16 + Math.cos(a) * 9 - 3, Y + 18 + Math.sin(a) * 5 - 2, 6, 4); } break;
      case 'throne': g.fillStyle = '#2a2232'; g.fillRect(X - 6, Y - 10, 44, 40); g.fillStyle = '#3e3248'; g.fillRect(X - 2, Y - 6, 36, 34); g.fillStyle = '#6a3a8a'; g.fillRect(X + 4, Y + 6, 24, 22); g.fillStyle = '#9a7a3a'; g.fillRect(X - 6, Y - 14, 6, 8); g.fillRect(X + 32, Y - 14, 6, 8); break;
      case 'stall': g.fillStyle = '#5a3a22'; g.fillRect(X - 6, Y + 6, 44, 18); g.fillStyle = '#8a2c2c'; for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#8a2c2c' : '#d8c8a0'; g.fillRect(X - 6 + i * 7.3, Y - 8, 7.3, 10); } g.fillStyle = '#9aa0aa'; g.fillRect(X, Y + 8, 10, 3); g.fillRect(X + 16, Y + 6, 3, 12); g.fillStyle = '#c9573a'; g.fillRect(X + 26, Y + 9, 6, 8); break;
      case 'herbs': g.fillStyle = '#5a3a22'; g.fillRect(X - 4, Y + 8, 40, 14); g.fillStyle = '#4a8a3a'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(X + i * 8, Y + 8, 5, 0, 7); g.fill(); } g.fillStyle = '#e8d36a'; g.fillRect(X + 6, Y + 4, 3, 3); g.fillStyle = '#d97a9a'; g.fillRect(X + 22, Y + 5, 3, 3); break;
      case 'banner': g.fillStyle = '#2a2420'; g.fillRect(X + 14, Y - 18, 3, 40); g.fillStyle = '#7a2a24'; g.fillRect(X + 17, Y - 16, 14, 22); g.fillStyle = '#e0a64e'; g.beginPath(); g.arc(X + 24, Y - 6, 4, 0, 7); g.fill(); break;
      case 'fountain': g.fillStyle = '#5a5862'; g.fillRect(X - 34, Y - 34, 100, 6); g.fillRect(X - 34, Y + 28, 100, 6); g.fillRect(X - 34, Y - 34, 6, 68); g.fillRect(X + 60, Y - 34, 6, 68); g.fillStyle = '#6e6c78'; g.fillRect(X + 10, Y + 8, 12, 14); g.fillRect(X + 13, Y - 6, 6, 16); break;
    }
  }
  if (z.waystone) {
    const X = z.waystone.x * TILE, Y = z.waystone.y * TILE;
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(X + 16, Y + 28, 13, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#5a5866'; g.fillRect(X + 6, Y + 20, 20, 8);
    g.fillStyle = '#6e6c7a'; g.beginPath(); g.moveTo(X + 9, Y + 22); g.lineTo(X + 12, Y - 18); g.lineTo(X + 16, Y - 24); g.lineTo(X + 20, Y - 18); g.lineTo(X + 23, Y + 22); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(X + 12, Y - 16, 3, 36);
    g.fillStyle = '#2a2830'; g.fillRect(X + 14, Y - 8, 4, 12); g.fillRect(X + 12, Y - 4, 8, 3);
  }
  // minimap
  const mm = document.createElement('canvas'); mm.width = z.w; mm.height = z.h;
  const m = mm.getContext('2d');
  for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) { m.fillStyle = MM_COL[z.get(x, y)]; m.fillRect(x, y, 1, 1); }
  z.base = base; z.over = over; z.mini = mm;
}

function drawCanopy(o, cx, cy, kind, a, b) {
  if (kind === 'pine') {
    o.fillStyle = 'rgba(0,0,0,.25)'; o.beginPath(); o.ellipse(cx + 3, cy + 16, 15, 6, 0, 0, 7); o.fill();
    const tiers = [[18, 16, 0], [14, 13, -11], [10, 10, -21], [6, 7, -29]];
    tiers.forEach(([w, h2, dy], i) => {
      o.fillStyle = i % 2 ? '#1e4234' : '#244c3c'; o.beginPath(); o.moveTo(cx - w, cy + dy + h2 * .55); o.lineTo(cx, cy + dy - h2 * .7); o.lineTo(cx + w, cy + dy + h2 * .55); o.closePath(); o.fill();
      o.fillStyle = '#eef4fb'; o.beginPath(); o.moveTo(cx - w * .9, cy + dy + h2 * .45); o.lineTo(cx - w * .2, cy + dy + h2 * .15 - a * 3); o.lineTo(cx + w * .5, cy + dy + h2 * .35); o.lineTo(cx + w * .9, cy + dy + h2 * .5); o.lineTo(cx + w * .6, cy + dy + h2 * .62); o.lineTo(cx - w * .7, cy + dy + h2 * .62); o.closePath(); o.fill();
    });
    o.fillStyle = '#ffffff'; o.beginPath(); o.moveTo(cx - 3, cy - 30); o.lineTo(cx, cy - 36); o.lineTo(cx + 3, cy - 30); o.closePath(); o.fill();
    return;
  }
  if (kind === 'dead') {
    o.strokeStyle = '#3a3028'; o.lineWidth = 3; o.lineCap = 'round';
    o.beginPath(); o.moveTo(cx, cy + 6); o.lineTo(cx - 10 - a * 6, cy - 10); o.moveTo(cx, cy + 4); o.lineTo(cx + 12 + b * 5, cy - 8); o.moveTo(cx, cy + 6); o.lineTo(cx + 2, cy - 18); o.stroke();
    o.lineWidth = 2; o.beginPath(); o.moveTo(cx - 8, cy - 6); o.lineTo(cx - 16, cy - 12); o.moveTo(cx + 9, cy - 4); o.lineTo(cx + 18, cy - 2); o.stroke();
    o.fillStyle = 'rgba(40,60,44,.75)';
    for (let i = 0; i < 4; i++) { o.beginPath(); o.arc(cx + (hash2(i, a * 99 | 0, 3) - .5) * 30, cy - 8 + (hash2(i, b * 99 | 0, 4) - .5) * 16, 4 + hash2(i, 1, a * 50 | 0) * 4, 0, 7); o.fill(); }
    return;
  }
  const cols = ['#1f3b20', '#25472a', '#2d5532', '#3a6a3a'];
  const R = 17 + a * 4;
  o.fillStyle = 'rgba(0,0,0,.25)'; o.beginPath(); o.arc(cx + 2, cy + 4, R, 0, 7); o.fill();
  for (let i = 0; i < 4; i++) {
    o.fillStyle = cols[i];
    for (let k = 0; k < 4; k++) {
      const ang = k * 1.6 + a * 6 + i, rr = (R - i * 4) * .55;
      o.beginPath(); o.arc(cx + Math.cos(ang) * rr * .6 - i * 2, cy + Math.sin(ang) * rr * .5 - i * 2.5, R - i * 4.2, 0, 7); o.fill();
    }
  }
  o.fillStyle = 'rgba(160,210,120,.18)'; o.beginPath(); o.arc(cx - 6, cy - 8, 5, 0, 7); o.fill();
}

/* ---------- Pixel humanoids (16x24 grid) ---------- */
const LOOKS = {
  orhun: { skin: '#e2b08a', shade: '#c18e68', hair: '#4a2e1e', hairHi: '#6e4630', hairStyle: 'wavy', beard: 'goatee', beardC: '#55382a', smile: 'grin',
    shirt: '#1d1e26', shirtHi: '#2c2e38', pants: '#2a2a33', boots: '#3a2618', pauldron: '#6a707c', belt: '#5a3a22', buckle: '#e0a64e', weapon: 'sword', offhand: 'buckler', collar: true },
  handan: { skin: '#efc8a3', shade: '#d6a986', hair: '#121218', hairHi: '#2c2c3a', hairStyle: 'long', smile: 'soft', robe: true,
    shirt: '#19191f', shirtHi: '#26262e', pants: '#19191f', boots: '#241a14', trim: '#2a9a72', belt: '#2a2a33', buckle: '#46c495', weapon: 'staff', necklace: true, blush: true },
};
function npcLook(id) {
  const L = NPCS[id].look;
  return { skin: L.skin, shade: '#b8906c', hair: L.hair, hairHi: L.hair, hairStyle: L.hood ? 'hood' : (id === 'sela' || id === 'ayla' ? 'long' : 'short'), hood: L.hood, beard: L.beard ? 'full' : null, beardC: L.hair, smile: 'soft',
    shirt: L.robe, shirtHi: L.robe, pants: L.robe, boots: '#2a1c12', robe: true, trim: '#00000033', belt: L.apron ? '#3a2a1a' : '#2a2016', buckle: '#9a7a3a', weapon: L.staff ? 'staff' : null, apron: L.apron, ghost: L.ghost };
}

const spriteCache = new Map();
function heroSprite(key, look, dir, frame) {
  const ck = key + dir + frame;
  if (spriteCache.has(ck)) return spriteCache.get(ck);
  const c = document.createElement('canvas'); c.width = 20; c.height = 26;
  const g = c.getContext('2d');
  const p = (col, x, y, w = 1, h = 1) => { if (!col) return; g.fillStyle = col; g.fillRect(x + 2, y + 1, w, h); };
  const L = look;
  const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  const atk = frame === 3;
  const O = '#0a0a0e';
  if (dir === 0 || dir === 1) {
    const front = dir === 0;
    // legs/boots
    if (L.robe) {
      p(L.boots, 5, 21 + (step > 0 ? -1 : 0), 2, 2); p(L.boots, 9, 21 + (step < 0 ? -1 : 0), 2, 2);
    } else {
      p(L.pants, 5, 17, 2, 4 + (step > 0 ? -1 : 0)); p(L.pants, 9, 17, 2, 4 + (step < 0 ? -1 : 0));
      p(L.boots, 5, 21 + (step > 0 ? -1 : 0), 2, 2); p(L.boots, 9, 21 + (step < 0 ? -1 : 0), 2, 2);
    }
    // back weapon when facing up
    if (!front && L.weapon === 'staff') { p('#6b4a2b', 13, 2, 1, 19); p('#7dffc8', 12, 0, 3, 2); }
    if (!front && (L.weapon === 'axe' || L.weapon === 'spear')) { p('#6b4a2b', 2, 2, 1, 16); p(L.weapon === 'axe' ? '#cfd6e0' : '#e8eef8', 1, 1, 3, L.weapon === 'axe' ? 4 : 2); }
    if (!front && L.weapon === 'twin') { p('#cfd6e0', 2, 8, 1, 8); p('#cfd6e0', 13, 8, 1, 8); }
    if (!front && L.weapon === 'sword') { p('#cfd6e0', 2, 6 + (atk ? -3 : 0), 1, 10); p('#e0a64e', 1, 15 + (atk ? -3 : 0), 3, 1); }
    // torso
    if (L.robe) { p(L.shirt, 4, 10, 8, 7); p(L.shirt, 3, 16, 10, 5); p(L.trim, 3, 20, 10, 1); p(L.shirtHi, 5, 10, 2, 6); }
    else { p(L.shirt, 4, 10, 8, 7); p(L.shirtHi, 5, 11, 1, 5); }
    if (L.apron && front) p('#6a4a2a', 5, 12, 6, 8);
    p(L.belt, 4, 16, 8, 1); if (front) p(L.buckle, 7, 16, 2, 1);
    // arms
    const armY = atk ? 9 : 10;
    p(L.shirt, 3, armY + (step > 0 ? 1 : 0), 1, 6); p(L.shirt, 12, armY + (step < 0 ? 1 : 0), 1, 6);
    p(L.skin, 3, armY + 6 + (step > 0 ? 1 : 0), 1, 1); p(L.skin, 12, armY + 6 + (step < 0 ? 1 : 0), 1, 1);
    if (L.pauldron) { p(L.pauldron, 2, 10, 3, 2); p(L.pauldron, 11, 10, 3, 2); p('#9aa0ac', 2, 10, 3, 1); p('#9aa0ac', 11, 10, 3, 1); }
    // neck/head
    p(L.skin, 7, 9, 2, 1);
    if (front && L.collar) { p(L.skin, 7, 10, 2, 1); p(L.skin, 7, 11, 1, 1); }
    if (front) {
      p(L.skin, 5, 3, 6, 6); p(L.shade, 5, 8, 6, 1); p(L.skin, 4, 5, 1, 2); p(L.skin, 11, 5, 1, 2);
      // eyes
      if (L.smile === 'grin') { p('#2a1a12', 6, 5, 1, 1); p('#2a1a12', 9, 5, 1, 1); p(L.hair, 6, 4, 1, 1); p(L.hair, 9, 4, 1, 1); }
      else { p('#1a1210', 6, 5, 1, 1); p('#1a1210', 9, 5, 1, 1); p('#3a2a20', 5, 5, 1, 1); p('#3a2a20', 10, 5, 1, 1); }
      if (L.blush) { p('#e6a294', 5, 6, 1, 1); p('#e6a294', 10, 6, 1, 1); }
      // mouth
      if (L.smile === 'grin') { p('#f4efe6', 7, 7, 2, 1); p('#7a3a2a', 6, 7, 1, 1); p('#7a3a2a', 9, 7, 1, 1); }
      else p('#b86a62', 7, 7, 2, 1);
      if (L.beard === 'goatee') { p(L.beardC, 6, 6, 4, 1); p(L.beardC, 7, 8, 2, 2); p('rgba(80,50,35,.45)', 5, 7, 1, 2); p('rgba(80,50,35,.45)', 10, 7, 1, 2); }
      if (L.beard === 'full') { p(L.beardC, 5, 7, 6, 3); p(L.beardC, 6, 10, 4, 1); p(L.skin, 7, 7, 2, 1); }
      if (L.necklace) { p('#46c495', 6, 10, 1, 1); p('#2b7d5f', 7, 11, 1, 1); p('#7dffc8', 8, 11, 1, 1); p('#46c495', 9, 10, 1, 1); }
    }
    // hair
    if (L.hairStyle === 'wavy') {
      p(L.hair, 5, 0, 6, 1); p(L.hair, 4, 1, 8, 2); p(L.hairHi, 6, 1, 3, 1); p(L.hair, 3, 2, 1, 2); p(L.hair, 12, 2, 1, 1);
      if (front) { p(L.hair, 4, 3, 2, 1); p(L.hair, 9, 3, 3, 1); p(L.hair, 4, 4, 1, 1); p(L.hair, 11, 4, 1, 1); p(L.hairHi, 10, 3, 1, 1); }
      else { p(L.hair, 4, 3, 8, 5); p(L.hairHi, 6, 3, 3, 2); p(L.hair, 5, 8, 6, 1); }
    } else if (L.hairStyle === 'long') {
      p(L.hair, 5, 0, 6, 1); p(L.hair, 4, 1, 8, 2); p(L.hairHi, 6, 1, 3, 1);
      if (front) { p(L.hair, 5, 3, 6, 1); p(L.hair, 3, 2, 2, 12); p(L.hair, 11, 2, 2, 12); p(L.hairHi, 3, 4, 1, 6); }
      else { p(L.hair, 3, 2, 10, 13); p(L.hairHi, 6, 2, 3, 8); p(L.hair, 4, 15, 8, 1); }
    } else if (L.hairStyle === 'hood') {
      p(L.hood, 4, 0, 8, 3); p(L.hood, 3, 2, 2, 8); p(L.hood, 11, 2, 2, 8); if (!front) p(L.hood, 4, 3, 8, 7);
    } else {
      p(L.hair, 5, 0, 6, 1); p(L.hair, 4, 1, 8, 2); if (!front) p(L.hair, 4, 3, 8, 5); else { p(L.hair, 4, 3, 1, 2); p(L.hair, 11, 3, 1, 2); }
    }
    // front weapons
    if (front && L.weapon === 'sword') { const y0 = atk ? 3 : 7; p('#cfd6e0', 1, y0, 1, 9); p('#ffffff', 1, y0, 1, 2); p('#e0a64e', 0, y0 + 9, 3, 1); p('#5a3a22', 1, y0 + 10, 1, 2); }
    if (front && L.weapon === 'axe') { const y0 = atk ? 1 : 5; p('#6b4a2b', 1, y0, 1, 13); p('#cfd6e0', -1, y0, 3, 4); p('#ffffff', -1, y0, 1, 2); p('#9aa0aa', 2, y0 + 1, 1, 2); }
    if (front && L.weapon === 'spear') { const y0 = atk ? -1 : 2; p('#6b4a2b', 1, y0 + 2, 1, 18); p('#e8eef8', 1, y0, 1, 3); p('#e8eef8', 0, y0 + 1, 3, 1); p(L.trim2 || '#c9573a', 1, y0 + 3, 1, 1); }
    if (front && L.weapon === 'twin') { const y0 = atk ? 4 : 8; p('#cfd6e0', 1, y0, 1, 7); p('#e0a64e', 0, y0 + 7, 3, 1); p('#cfd6e0', 14, y0 + (atk ? 3 : 0), 1, 7); p('#e0a64e', 13, y0 + 7 + (atk ? 3 : 0), 3, 1); }
    if (front && L.weapon === 'orb') { const fy = atk ? 6 : 9; p('#1a5a6a', 13, fy, 3, 3); p('#9fe8ff', 14, fy, 2, 2); p('#ffffff', 14, fy, 1, 1); }
    if (front && L.weapon === 'wand') { p('#6b4a2b', 13, 12 + (atk ? -3 : 0), 1, 5); p('#c9ffe6', 13, 11 + (atk ? -3 : 0), 1, 1); }
    if (front && L.weapon === 'tome') { p('#5a2a6a', 12, 12, 4, 5); p('#f0e6d0', 13, 13, 2, 3); p('#d8b8ff', 14, 12, 1, 1); }
    if (front && L.offhand === 'buckler') { p('#e0a64e', 12, 12, 4, 4); p('#4a3020', 13, 13, 2, 2); p('#ffe7b0', 13, 12, 1, 1); }
    if (front && L.weapon === 'staff') { p('#6b4a2b', 13, 3 + (atk ? -2 : 0), 1, 19); p('#2b7d5f', 12, 1 + (atk ? -2 : 0), 3, 3); p('#7dffc8', 13, 1 + (atk ? -2 : 0), 1, 1); }
  } else {
    // side view (facing right)
    const lx = step > 0 ? 1 : step < 0 ? -1 : 0;
    if (L.robe) { p(L.boots, 6 + lx, 21, 2, 2); p(L.boots, 8 - lx, 21, 2, 2); }
    else { p(L.pants, 6 + lx, 17, 2, 4); p(L.pants, 8 - lx, 17, 2, 4); p(L.boots, 6 + lx, 21, 3, 2); p(L.boots, 8 - lx, 21, 3, 2); }
    if (L.robe) { p(L.shirt, 5, 10, 6, 7); p(L.shirt, 4, 16, 8, 5); p(L.trim, 4, 20, 8, 1); }
    else p(L.shirt, 5, 10, 6, 7);
    if (L.apron) p('#6a4a2a', 9, 11, 2, 8);
    p(L.belt, 5, 16, 6, 1);
    if (L.offhand === 'buckler') { p('#e0a64e', 4, 11, 2, 5); p('#4a3020', 4, 12, 1, 3); }
    if (L.pauldron) { p(L.pauldron, 6, 10, 4, 2); p('#9aa0ac', 6, 10, 4, 1); }
    // head
    p(L.skin, 7, 3, 5, 6); p(L.skin, 12, 5, 1, 2); p(L.shade, 7, 8, 5, 1); p(L.skin, 8, 9, 2, 1);
    p(L.smile === 'grin' ? '#2a1a12' : '#1a1210', 10, 5, 1, 1);
    if (L.smile === 'grin') { p('#f4efe6', 10, 7, 2, 1); } else p('#b86a62', 11, 7, 1, 1);
    if (L.blush) p('#e6a294', 10, 6, 1, 1);
    if (L.beard === 'goatee') { p(L.beardC, 10, 6, 2, 1); p(L.beardC, 10, 8, 2, 2); p('rgba(80,50,35,.45)', 8, 7, 2, 2); }
    if (L.beard === 'full') { p(L.beardC, 8, 7, 5, 3); }
    if (L.necklace) { p('#46c495', 9, 10, 2, 1); p('#7dffc8', 10, 11, 1, 1); }
    if (L.hairStyle === 'wavy') { p(L.hair, 6, 0, 6, 1); p(L.hair, 5, 1, 8, 2); p(L.hair, 5, 3, 3, 4); p(L.hair, 11, 3, 1, 1); p(L.hairHi, 7, 1, 3, 1); p(L.hair, 4, 2, 1, 2); }
    else if (L.hairStyle === 'long') { p(L.hair, 6, 0, 6, 1); p(L.hair, 5, 1, 8, 2); p(L.hair, 4, 3, 4, 12); p(L.hair, 10, 3, 3, 1); p(L.hairHi, 7, 1, 3, 1); p(L.hairHi, 5, 4, 1, 7); }
    else if (L.hairStyle === 'hood') { p(L.hood, 5, 0, 8, 3); p(L.hood, 4, 2, 4, 9); }
    else { p(L.hair, 6, 0, 6, 1); p(L.hair, 5, 1, 8, 2); p(L.hair, 5, 3, 3, 3); }
    // arm + weapon
    const ax = atk ? 11 : 8 + (step > 0 ? 1 : step < 0 ? -1 : 0);
    p(L.shirt, ax, 10, 2, 5); p(L.skin, ax + (atk ? 1 : 0), 15, 2, 1);
    if (L.weapon === 'sword') { if (atk) { p('#cfd6e0', 13, 13, 6, 1); p('#ffffff', 17, 13, 2, 1); p('#e0a64e', 12, 12, 1, 3); } else { p('#cfd6e0', ax + 1, 6, 1, 9); p('#e0a64e', ax, 15, 3, 1); } }
    if (L.weapon === 'axe') { if (atk) { p('#6b4a2b', 12, 12, 7, 1); p('#cfd6e0', 17, 9, 3, 4); } else { p('#6b4a2b', ax + 1, 3, 1, 13); p('#cfd6e0', ax + 1, 2, 3, 4); } }
    if (L.weapon === 'spear') { if (atk) { p('#6b4a2b', 9, 13, 10, 1); p('#e8eef8', 19, 12, 2, 3); } else { p('#6b4a2b', ax + 1, 0, 1, 20); p('#e8eef8', ax + 1, -2, 1, 2); } }
    if (L.weapon === 'twin') { if (atk) { p('#cfd6e0', 13, 12, 5, 1); p('#cfd6e0', 13, 15, 5, 1); } else { p('#cfd6e0', ax + 1, 8, 1, 7); } }
    if (L.weapon === 'orb') { p('#9fe8ff', atk ? 15 : ax + 2, atk ? 9 : 11, 3, 3); }
    if (L.weapon === 'wand') { p('#6b4a2b', atk ? 13 : ax + 1, atk ? 12 : 13, atk ? 4 : 1, atk ? 1 : 4); p('#c9ffe6', atk ? 17 : ax + 1, atk ? 12 : 12, 1, 1); }
    if (L.weapon === 'tome') { p('#5a2a6a', 5, 12, 3, 4); p('#f0e6d0', 6, 13, 1, 2); }
    if (L.weapon === 'staff') { const sx = atk ? 13 : ax + 1; p('#6b4a2b', sx, 2, 1, 20); p('#2b7d5f', sx - 1, 0, 3, 3); p('#7dffc8', sx, 0, 1, 1); }
  }
  // outline pass
  const id = g.getImageData(0, 0, 20, 26), d = id.data, out = new Uint8ClampedArray(d);
  for (let y = 0; y < 26; y++) for (let x = 0; x < 20; x++) {
    const i = (y * 20 + x) * 4; if (d[i + 3]) continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < 20 && yy < 26 && d[(yy * 20 + xx) * 4 + 3] > 200; });
    if (n) { out[i] = 10; out[i + 1] = 10; out[i + 2] = 14; out[i + 3] = 200; }
  }
  g.putImageData(new ImageData(out, 20, 26), 0, 0);
  spriteCache.set(ck, c);
  return c;
}

function drawHumanoid(g, key, look, x, y, dir, frame, flip, alpha = 1) {
  const s = heroSprite(key, look, dir, frame);
  g.save(); g.globalAlpha = alpha;
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, y + 2, 11, 4, 0, 0, 7); g.fill();
  g.imageSmoothingEnabled = false;
  if (flip) { g.translate(x, 0); g.scale(-1, 1); g.drawImage(s, -20, y - 50, 40, 52); }
  else g.drawImage(s, x - 20, y - 50, 40, 52);
  g.restore();
}

function drawPortrait(canvas, who) {
  const g = canvas.getContext('2d'); g.clearRect(0, 0, canvas.width, canvas.height);
  g.imageSmoothingEnabled = false;
  const grd = g.createRadialGradient(canvas.width / 2, canvas.height * .6, 4, canvas.width / 2, canvas.height * .6, canvas.width * .7);
  grd.addColorStop(0, who === 'handan' ? '#1b4a3c' : who === 'orhun' ? '#4a3418' : '#2a2a3a'); grd.addColorStop(1, '#0b0e14');
  g.fillStyle = grd; g.fillRect(0, 0, canvas.width, canvas.height);
  if (FOES[who]) { // foe portrait
    g.save(); g.translate(canvas.width / 2, canvas.height * .72); const s = canvas.width / 70; g.scale(s, s);
    drawFoeShape(g, { type: who, def: FOES[who], t: 0, face: 1, anim: 0, hp: 1, maxHp: 1 }, 0, 0); g.restore();
    if (FOES[who].tint) { g.save(); g.globalCompositeOperation = 'color'; g.globalAlpha = FOES[who].tint.a * .7; g.fillStyle = FOES[who].tint.c; g.fillRect(0, 0, canvas.width, canvas.height); g.restore(); }
    return;
  }
  const look = LOOKS[who] || npcLook(who);
  const s = heroSprite(who, look, 0, 0);
  const sc = canvas.width / 13;
  g.drawImage(s, 2, 0, 16, 14, (canvas.width - 16 * sc) / 2, canvas.height * .06, 16 * sc, 14 * sc);
}

/* ---------- Foes ---------- */
function drawFoeShape(g, e, x, y) {
  const t = e.t || 0, ty = e.def.draw, sc = e.def.scale || 1, f = e.face || 1;
  const bob = Math.sin(t * 8) * (e.moving ? 1.5 : .5);
  g.save(); g.translate(x, y); g.scale(sc * f, sc);
  const shadow = (w, h) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 2, w, h, 0, 0, 7); g.fill(); };
  const eyeGlow = (ex, ey, col = '#c58aff', r = 1.6) => { g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 6; g.fillRect(ex - r / 2, ey - r / 2, r, r); g.shadowBlur = 0; };
  switch (ty) {
    case 'wolf': {
      shadow(14, 4);
      const leg = e.moving ? Math.sin(t * 14) * 3 : 0;
      g.fillStyle = '#2a2a30';
      g.fillRect(-9 + leg, -6, 3, 8); g.fillRect(6 - leg, -6, 3, 8); g.fillRect(-5 - leg, -6, 3, 8); g.fillRect(3 + leg, -6, 3, 8);
      g.fillStyle = '#3a3a44'; g.beginPath(); g.ellipse(0, -10 + bob * .3, 12, 6, 0, 0, 7); g.fill();
      g.fillStyle = '#4a4a56'; g.beginPath(); g.ellipse(-2, -13 + bob * .3, 8, 3, 0, 0, 7); g.fill();
      g.fillStyle = '#3a3a44'; g.beginPath(); g.moveTo(-12, -11); g.lineTo(-20, -16 + Math.sin(t * 6) * 2); g.lineTo(-13, -8); g.fill();
      g.fillStyle = '#44444f'; g.beginPath(); g.ellipse(12, -14, 6, 5, 0, 0, 7); g.fill(); g.fillRect(14, -14, 7, 4);
      g.beginPath(); g.moveTo(9, -18); g.lineTo(11, -24); g.lineTo(13, -18); g.fill(); g.beginPath(); g.moveTo(13, -18); g.lineTo(15, -23); g.lineTo(16, -17); g.fill();
      g.fillStyle = '#7a3aa8'; g.globalAlpha = .5; g.fillRect(-6, -16, 2, 2); g.fillRect(2, -15, 2, 2); g.globalAlpha = 1;
      eyeGlow(15, -15);
      if (e.def.elite) { g.fillStyle = '#c9a060'; g.fillRect(-8, -16, 10, 2); }
      break; }
    case 'sprite': {
      const fy = -18 + Math.sin(t * 4) * 3;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 2, 8, 3, 0, 0, 7); g.fill();
      g.fillStyle = '#3a6a2a'; g.beginPath(); g.arc(0, fy, 8, 0, 7); g.fill();
      g.strokeStyle = '#5a8a3a'; g.lineWidth = 2;
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + t; g.beginPath(); g.moveTo(Math.cos(a) * 7, fy + Math.sin(a) * 7); g.lineTo(Math.cos(a) * 12, fy + Math.sin(a) * 12); g.stroke(); }
      g.fillStyle = '#9be36a'; g.beginPath(); g.arc(-2, fy - 3, 3, 0, 7); g.fill();
      eyeGlow(-3, fy, '#ff5a3a'); eyeGlow(3, fy, '#ff5a3a');
      break; }
    case 'boar': {
      shadow(30, 8);
      const leg = e.moving ? Math.sin(t * 10) * 4 : 0;
      g.fillStyle = '#3a2418';
      g.fillRect(-20 + leg, -10, 7, 12); g.fillRect(12 - leg, -10, 7, 12); g.fillRect(-10 - leg, -10, 7, 12); g.fillRect(4 + leg, -10, 7, 12);
      g.fillStyle = '#5a3a26'; g.beginPath(); g.ellipse(0, -22 + bob, 26, 15, 0, 0, 7); g.fill();
      g.fillStyle = '#3a5a2a'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(-16 + i * 5, -34 + bob + Math.sin(i) * 2, 5, 0, 7); g.fill(); }
      g.fillStyle = '#6a4a30'; g.beginPath(); g.ellipse(22, -20 + bob, 12, 11, 0, 0, 7); g.fill();
      g.fillStyle = '#4a2e1e'; g.fillRect(30, -18 + bob, 6, 8);
      g.fillStyle = '#eee4c8'; g.beginPath(); g.moveTo(28, -12 + bob); g.lineTo(38, -24 + bob); g.lineTo(31, -11 + bob); g.fill(); g.beginPath(); g.moveTo(24, -12 + bob); g.lineTo(30, -22 + bob); g.lineTo(27, -11 + bob); g.fill();
      eyeGlow(25, -24 + bob, '#ff7a3a', 3);
      if (e.enraged) { g.fillStyle = 'rgba(255,60,30,.25)'; g.beginPath(); g.ellipse(0, -22, 34, 22, 0, 0, 7); g.fill(); }
      break; }
    case 'lurker': {
      shadow(14, 4);
      const sq = 1 + Math.sin(t * 5) * .06;
      g.fillStyle = '#2a4a32'; g.beginPath(); g.ellipse(0, -10, 13 * sq, 11 / sq, 0, Math.PI, 0); g.lineTo(13, 0); g.lineTo(-13, 0); g.fill();
      g.fillStyle = '#3a5e3e'; g.beginPath(); g.ellipse(-3, -14, 6, 4, 0, 0, 7); g.fill();
      g.fillStyle = '#1e3424'; for (let i = 0; i < 4; i++) g.fillRect(-10 + i * 6, -2, 3, 3 + Math.sin(t * 6 + i) * 1.5);
      g.strokeStyle = '#4a3a24'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-6, -18); g.quadraticCurveTo(-10, -26, -4, -28); g.stroke();
      eyeGlow(4, -13, '#e8ff6a', 2.2); eyeGlow(9, -12, '#e8ff6a', 2);
      break; }
    case 'wisp': {
      const fy = -20 + Math.sin(t * 3) * 4;
      g.fillStyle = 'rgba(184,255,216,.12)'; g.beginPath(); g.arc(0, fy, 16, 0, 7); g.fill();
      g.fillStyle = 'rgba(184,255,216,.35)'; g.beginPath(); g.arc(0, fy, 9, 0, 7); g.fill();
      g.fillStyle = '#e8fff4'; g.beginPath(); g.arc(0, fy, 5, 0, 7); g.fill();
      for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(184,255,216,${.4 - i * .09})`; g.beginPath(); g.arc(-Math.sin(t * 3 + i) * 3 - i * 4 * (e.moving ? 1 : .3), fy + 6 + i * 4, 4 - i * .7, 0, 7); g.fill(); }
      break; }
    case 'spider': {
      shadow(14, 4);
      g.strokeStyle = '#18161c'; g.lineWidth = 2;
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const w = e.moving ? Math.sin(t * 16 + i * 1.5) * 2 : 0; g.beginPath(); g.moveTo(-2 + i * 2, -8); g.lineTo(-10 + i * 6 + w, -14 * (i % 2 ? 1 : .8)); g.lineTo(-12 + i * 7 + w * s, 0); g.stroke(); }
      g.fillStyle = '#22202a'; g.beginPath(); g.ellipse(-6, -10, 9, 7, 0, 0, 7); g.fill();
      g.fillStyle = '#2e2a36'; g.beginPath(); g.ellipse(6, -9, 5, 4, 0, 0, 7); g.fill();
      g.fillStyle = '#6a2a4a'; g.fillRect(-9, -13, 5, 2); g.fillRect(-7, -15, 2, 6);
      eyeGlow(9, -10, '#ff3a5a', 1.6); eyeGlow(7, -11, '#ff3a5a', 1.4);
      break; }
    case 'witch': {
      shadow(14, 4);
      const fy = Math.sin(t * 2) * 2;
      g.fillStyle = '#1e2a20'; g.beginPath(); g.moveTo(-12, 0); g.lineTo(-6, -26 + fy); g.lineTo(6, -26 + fy); g.lineTo(12, 0); g.fill();
      g.fillStyle = '#2e4a30'; g.fillRect(-7, -20 + fy, 14, 3);
      g.fillStyle = '#9ab89a'; g.fillRect(-4, -32 + fy, 8, 7);
      g.fillStyle = '#1a2a1c'; g.beginPath(); g.moveTo(-10, -31 + fy); g.lineTo(10, -31 + fy); g.lineTo(2, -50 + fy); g.lineTo(-1, -40 + fy); g.fill();
      g.fillStyle = '#3a5a32'; g.fillRect(-11, -32 + fy, 22, 2);
      eyeGlow(1, -29 + fy, '#7dff9a', 2); eyeGlow(-2, -29 + fy, '#7dff9a', 2);
      g.strokeStyle = '#4a3020'; g.lineWidth = 2; g.beginPath(); g.moveTo(12, 2); g.lineTo(14, -36 + fy); g.stroke();
      g.fillStyle = '#7dff9a'; g.shadowColor = '#7dff9a'; g.shadowBlur = 12; g.beginPath(); g.arc(14, -38 + fy, 4, 0, 7); g.fill(); g.shadowBlur = 0;
      g.fillStyle = 'rgba(40,70,40,.7)'; for (let i = 0; i < 5; i++) g.fillRect(-10 + i * 5, -2 + Math.sin(t * 3 + i) * 2, 2, 5);
      break; }
    case 'knight': case 'king': {
      const K = ty === 'king';
      shadow(K ? 22 : 12, K ? 6 : 4);
      const s = K ? 1.7 : 1; g.scale(s, s);
      const leg = e.moving ? Math.sin(t * 10) * 2 : 0;
      g.fillStyle = '#22222a'; g.fillRect(-5 + leg, -10, 4, 10); g.fillRect(1 - leg, -10, 4, 10);
      g.fillStyle = K ? '#2a2236' : '#34343e'; g.fillRect(-8, -26, 16, 17);
      g.fillStyle = K ? '#3e3250' : '#4a4a56'; g.fillRect(-10, -27, 6, 5); g.fillRect(4, -27, 6, 5);
      g.fillStyle = K ? '#4a2a6a' : '#3a2a4a'; g.fillRect(-7, -14, 14, 4);
      g.fillStyle = K ? '#2a2236' : '#3e3e4a'; g.fillRect(-6, -37, 12, 11);
      g.fillStyle = '#0a0a10'; g.fillRect(-4, -33, 9, 3);
      eyeGlow(-1, -32, '#c58aff', 2); eyeGlow(3, -32, '#c58aff', 2);
      if (K) { g.fillStyle = '#b8902a'; g.fillRect(-7, -41, 14, 4); g.fillRect(-7, -45, 3, 4); g.fillRect(-1.5, -46, 3, 5); g.fillRect(4, -45, 3, 4); g.fillStyle = '#c58aff'; g.fillRect(-1, -44, 2, 2); }
      const sw = e.swing > 0 ? (1 - e.swing) * 2.2 - 1 : 0;
      g.save(); g.translate(9, -18); g.rotate(-1.2 + sw * 1.4);
      g.fillStyle = '#8a8a9a'; g.fillRect(-1.5, -24, 3, 24); g.fillStyle = K ? '#c58aff' : '#aab0c0'; g.fillRect(-1.5, -24, 3, 6);
      g.fillStyle = '#6a5a2a'; g.fillRect(-4, -1, 8, 2); g.restore();
      if (K) { g.fillStyle = 'rgba(80,40,120,.5)'; g.beginPath(); g.moveTo(-8, -26); g.lineTo(-14, 0); g.lineTo(14, 0); g.lineTo(8, -26); g.fill(); }
      break; }
    case 'archer': {
      shadow(11, 4);
      const leg = e.moving ? Math.sin(t * 10) * 2 : 0;
      g.fillStyle = '#1e1a26'; g.fillRect(-4 + leg, -9, 3, 9); g.fillRect(1 - leg, -9, 3, 9);
      g.fillStyle = '#2a2436'; g.beginPath(); g.moveTo(-7, -8); g.lineTo(-5, -26); g.lineTo(5, -26); g.lineTo(7, -8); g.fill();
      g.fillStyle = '#1a1622'; g.beginPath(); g.moveTo(-6, -24); g.lineTo(0, -36); g.lineTo(6, -24); g.fill();
      eyeGlow(1, -27, '#c9a0ff', 1.6); eyeGlow(3, -27, '#c9a0ff', 1.6);
      g.strokeStyle = '#5a4a3a'; g.lineWidth = 2; g.beginPath(); g.arc(7, -18, 10, -1.3, 1.3); g.stroke();
      g.strokeStyle = 'rgba(220,220,240,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(9, -28); g.lineTo(9 - (e.swing > 0 ? 4 : 0), -18); g.lineTo(9, -8); g.stroke();
      break; }
    case 'wraith': {
      const fy = Math.sin(t * 3) * 3;
      g.fillStyle = 'rgba(30,20,50,.35)'; g.beginPath(); g.ellipse(0, 2, 10, 3, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(40,30,70,.8)';
      g.beginPath(); g.moveTo(-9, -30 + fy); g.quadraticCurveTo(0, -42 + fy, 9, -30 + fy); g.lineTo(11, -6 + fy);
      for (let i = 0; i < 5; i++) g.lineTo(11 - i * 5.5, (i % 2 ? -2 : -8) + fy + Math.sin(t * 6 + i) * 2);
      g.closePath(); g.fill();
      g.fillStyle = '#0a0812'; g.beginPath(); g.ellipse(1, -28 + fy, 5, 6, 0, 0, 7); g.fill();
      eyeGlow(-1, -29 + fy, '#ffcf6a', 2); eyeGlow(3, -29 + fy, '#ffcf6a', 2);
      g.fillStyle = '#e0a64e'; g.shadowColor = '#e0a64e'; g.shadowBlur = 8; g.fillRect(8, -16 + fy, 4, 5); g.shadowBlur = 0;
      break; }
    case 'golem': {
      shadow(18, 5);
      const leg = e.moving ? Math.sin(t * 7) * 3 : 0;
      const ice = '#9cc4e0', icel = '#cde6f6', iced = '#6a92b4';
      g.fillStyle = iced; g.fillRect(-12 + leg, -14, 9, 14); g.fillRect(3 - leg, -14, 9, 14);
      g.fillStyle = ice; g.beginPath(); g.moveTo(-17, -12); g.lineTo(-20, -34); g.lineTo(-8, -46); g.lineTo(10, -46); g.lineTo(20, -32); g.lineTo(16, -12); g.closePath(); g.fill();
      g.fillStyle = icel; g.beginPath(); g.moveTo(-16, -32); g.lineTo(-8, -44); g.lineTo(2, -44); g.lineTo(-6, -30); g.closePath(); g.fill();
      g.fillStyle = iced; g.fillRect(-7, -56, 14, 11); g.fillStyle = icel; g.fillRect(-7, -56, 6, 4);
      eyeGlow(-3, -51, '#7ec8ff', 2.4); eyeGlow(3, -51, '#7ec8ff', 2.4);
      g.fillStyle = '#7ec8ff'; g.shadowColor = '#7ec8ff'; g.shadowBlur = 12; g.beginPath(); g.arc(0, -30, 4.5, 0, 7); g.fill(); g.shadowBlur = 0;
      const sw = e.swing > 0 ? (1 - e.swing) : 0;
      g.save(); g.translate(17, -38); g.rotate(-.3 + sw * 1.6); g.fillStyle = ice; g.fillRect(-4, 0, 10, 24); g.fillStyle = icel; g.fillRect(-6, 20, 14, 10); g.restore();
      g.save(); g.translate(-17, -38); g.rotate(.3); g.fillStyle = iced; g.fillRect(-6, 0, 10, 24); g.fillRect(-8, 20, 14, 10); g.restore();
      g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 3; i++) g.fillRect(-12 + i * 9, -40 + (i % 2) * 6, 2, 6);
      break; }
    case 'wyrm': {
      shadow(42, 10);
      const fl = Math.sin(t * 3) * (e.moving ? 1 : .5), body = '#a8c4dc', dark = '#5a7894', pale = '#e2f0fb';
      const leg = e.moving ? Math.sin(t * 6) * 4 : 0;
      g.fillStyle = dark; g.fillRect(-22 + leg, -16, 8, 16); g.fillRect(10 - leg, -16, 8, 16); g.fillRect(-12 - leg, -14, 7, 14); g.fillRect(18 + leg, -14, 7, 14);
      // tail
      g.strokeStyle = body; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(-26, -24); g.quadraticCurveTo(-46, -20 + fl * 4, -58, -8 + fl * 6); g.stroke();
      g.strokeStyle = pale; g.lineWidth = 3; g.beginPath(); g.moveTo(-58, -8 + fl * 6); g.lineTo(-66, -4 + fl * 6); g.stroke();
      // far wing
      g.fillStyle = 'rgba(90,120,150,.85)'; g.beginPath(); g.moveTo(-4, -40); g.lineTo(-30, -78 - fl * 10); g.lineTo(-40, -52 - fl * 4); g.lineTo(-22, -46); g.closePath(); g.fill();
      // body
      g.fillStyle = body; g.beginPath(); g.ellipse(0, -28, 30, 15, 0, 0, 7); g.fill();
      g.fillStyle = pale; g.beginPath(); g.ellipse(4, -21, 22, 6, 0, 0, 7); g.fill();
      for (let i = 0; i < 5; i++) { g.fillStyle = pale; g.beginPath(); g.moveTo(-20 + i * 9, -40); g.lineTo(-16 + i * 9, -50); g.lineTo(-12 + i * 9, -40); g.closePath(); g.fill(); }
      // neck + head
      g.strokeStyle = body; g.lineWidth = 11; g.beginPath(); g.moveTo(22, -34); g.quadraticCurveTo(34, -52, 38, -64 + fl * 2); g.stroke();
      g.fillStyle = body; g.beginPath(); g.ellipse(44, -66 + fl * 2, 12, 8, -.2, 0, 7); g.fill();
      g.fillStyle = dark; g.beginPath(); g.moveTo(50, -64 + fl * 2); g.lineTo(62, -60 + fl * 2); g.lineTo(52, -58 + fl * 2); g.closePath(); g.fill();
      g.fillStyle = pale; g.beginPath(); g.moveTo(38, -72 + fl * 2); g.lineTo(28, -88 + fl * 2); g.lineTo(42, -74 + fl * 2); g.closePath(); g.fill(); g.beginPath(); g.moveTo(43, -73 + fl * 2); g.lineTo(38, -90 + fl * 2); g.lineTo(47, -72 + fl * 2); g.closePath(); g.fill();
      eyeGlow(47, -68 + fl * 2, '#9fdcff', 3);
      if (e.bs && e.bs.cast && e.bs.cast.name === 'Frost Breath') { g.fillStyle = 'rgba(190,230,255,.6)'; g.beginPath(); g.arc(60, -60, 5 + Math.random() * 3, 0, 7); g.fill(); }
      // near wing
      g.fillStyle = 'rgba(150,185,215,.92)'; g.beginPath(); g.moveTo(4, -38); g.lineTo(-16, -92 - fl * 12); g.lineTo(-30, -60 - fl * 6); g.lineTo(-10, -44); g.closePath(); g.fill();
      g.strokeStyle = dark; g.lineWidth = 2; g.beginPath(); g.moveTo(4, -38); g.lineTo(-16, -92 - fl * 12); g.stroke();
      break; }
    case 'orb': {
      const r = 9 + Math.sin(t * 6) * 1.5;
      g.fillStyle = 'rgba(150,90,230,.25)'; g.beginPath(); g.arc(0, -14, r + 6, 0, 7); g.fill();
      g.fillStyle = '#5a2a9a'; g.beginPath(); g.arc(0, -14, r, 0, 7); g.fill();
      g.fillStyle = '#c58aff'; g.beginPath(); g.arc(-2, -16, r * .4, 0, 7); g.fill();
      break; }
  }
  g.restore();
}

/* ---------- NPC / fox ---------- */
function drawFox(g, e) {
  const t = e.t, x = e.x, y = e.y, f = e.face || 1;
  g.save(); g.translate(x, y); g.scale(f, 1);
  g.fillStyle = 'rgba(70,196,149,.18)'; g.beginPath(); g.ellipse(0, -6, 16, 10, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 2, 9, 3, 0, 0, 7); g.fill();
  const leg = e.moving ? Math.sin(t * 16) * 2 : 0;
  g.fillStyle = '#2b9a72'; g.fillRect(-5 + leg, -4, 2, 5); g.fillRect(3 - leg, -4, 2, 5);
  g.fillStyle = '#46c495'; g.beginPath(); g.ellipse(0, -7, 8, 4.5, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-7, -8); g.quadraticCurveTo(-16, -14 + Math.sin(t * 5) * 3, -14, -4); g.quadraticCurveTo(-10, -5, -7, -6); g.fill();
  g.fillStyle = '#c9f5df'; g.beginPath(); g.arc(-14, -6 + Math.sin(t * 5) * 1.5, 2.5, 0, 7); g.fill();
  g.fillStyle = '#46c495'; g.beginPath(); g.ellipse(8, -11, 4.5, 4, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(6, -14); g.lineTo(7, -19); g.lineTo(9, -14); g.fill(); g.beginPath(); g.moveTo(9, -14); g.lineTo(11, -18); g.lineTo(11.5, -13); g.fill();
  g.fillStyle = '#c9f5df'; g.fillRect(10, -10, 3, 2);
  g.fillStyle = '#0a1a14'; g.fillRect(9, -12, 1.5, 1.5); g.fillRect(12.5, -10, 1, 1);
  g.restore();
}

/* ---------- Icons ---------- */
function drawIcon(c, spec) {
  const g = c.getContext('2d'), W2 = c.width, H2 = c.height, s = W2 / 48;
  const grd = g.createLinearGradient(0, 0, W2, H2); grd.addColorStop(0, spec.bg); grd.addColorStop(1, '#0a0c10');
  g.fillStyle = grd; g.fillRect(0, 0, W2, H2);
  g.save(); g.scale(s, s); g.strokeStyle = spec.fg; g.fillStyle = spec.fg; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
  const L = (pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };
  switch (spec.s) {
    case 'sword': L([12, 36, 36, 12]); L([9, 29, 19, 39]); L([10, 38, 6, 42]); g.fillRect(33, 9, 6, 6); break;
    case 'roar': g.beginPath(); g.arc(18, 24, 8, -1, 1); g.stroke(); g.beginPath(); g.arc(18, 24, 15, -.9, .9); g.stroke(); g.beginPath(); g.arc(18, 24, 22, -.8, .8); g.stroke(); g.beginPath(); g.arc(12, 24, 5, 0, 7); g.fill(); break;
    case 'whirl': for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(24, 24, 7 + i * 6, i * 2, i * 2 + 3.6); g.stroke(); } break;
    case 'shield': g.beginPath(); g.moveTo(24, 8); g.lineTo(38, 13); g.lineTo(36, 28); g.lineTo(24, 40); g.lineTo(12, 28); g.lineTo(10, 13); g.closePath(); g.stroke(); L([24, 14, 24, 32]); break;
    case 'axe': L([14, 38, 34, 14]); g.beginPath(); g.moveTo(30, 8); g.quadraticCurveTo(44, 12, 40, 24); g.lineTo(28, 16); g.closePath(); g.fill(); break;
    case 'charge': L([8, 24, 32, 24]); L([24, 14, 36, 24, 24, 34]); L([8, 16, 18, 16]); L([8, 32, 18, 32]); break;
    case 'bolt': g.beginPath(); g.arc(30, 18, 7, 0, 7); g.fill(); g.globalAlpha = .6; L([24, 24, 10, 38]); g.globalAlpha = .35; L([22, 20, 8, 30]); break;
    case 'root': L([24, 40, 24, 20]); L([24, 28, 14, 18]); L([24, 24, 34, 14]); L([14, 40, 34, 40]); g.beginPath(); g.arc(14, 18, 3, 0, 7); g.fill(); g.beginPath(); g.arc(34, 14, 3, 0, 7); g.fill(); break;
    case 'heal': g.fillRect(20, 10, 8, 28); g.fillRect(10, 20, 28, 8); break;
    case 'hex': g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 - 1.57; g.lineTo(24 + Math.cos(a) * 14, 24 + Math.sin(a) * 14); } g.closePath(); g.stroke(); g.beginPath(); g.arc(24, 24, 4, 0, 7); g.fill(); break;
    case 'ward': g.beginPath(); g.arc(24, 24, 14, 0, 7); g.stroke(); g.globalAlpha = .35; g.beginPath(); g.arc(24, 24, 14, 0, 7); g.fill(); g.globalAlpha = 1; g.beginPath(); g.moveTo(24, 14); g.lineTo(30, 24); g.lineTo(24, 34); g.lineTo(18, 24); g.closePath(); g.fill(); break;
    case 'fire': g.beginPath(); g.moveTo(24, 6); g.quadraticCurveTo(38, 22, 32, 36); g.quadraticCurveTo(24, 44, 16, 36); g.quadraticCurveTo(10, 22, 24, 6); g.fill(); g.fillStyle = '#fff2c0'; g.beginPath(); g.moveTo(24, 20); g.quadraticCurveTo(30, 30, 24, 38); g.quadraticCurveTo(18, 30, 24, 20); g.fill(); break;
    case 'roll': g.beginPath(); g.arc(22, 24, 11, .6, 5.4); g.stroke(); L([30, 12, 33, 19, 26, 20]); L([8, 34, 16, 34]); L([6, 28, 12, 28]); break;
    case 'blink': g.globalAlpha = .4; g.beginPath(); g.arc(14, 26, 6, 0, 7); g.stroke(); g.globalAlpha = 1; g.beginPath(); g.moveTo(34, 12); g.lineTo(40, 24); g.lineTo(34, 36); g.lineTo(28, 24); g.closePath(); g.fill(); L([16, 26, 26, 24]); break;
    case 'wave': g.beginPath(); g.arc(16, 24, 14, -1.1, 1.1); g.stroke(); g.globalAlpha = .5; g.beginPath(); g.arc(24, 24, 14, -1.1, 1.1); g.stroke(); g.globalAlpha = .25; g.beginPath(); g.arc(32, 24, 14, -1.1, 1.1); g.stroke(); g.globalAlpha = 1; break;
    case 'frenzy': g.beginPath(); g.moveTo(24, 6); g.quadraticCurveTo(36, 22, 30, 34); g.quadraticCurveTo(24, 42, 18, 34); g.quadraticCurveTo(12, 22, 24, 6); g.fill(); g.fillStyle = '#2a0808'; g.fillRect(19, 22, 3, 3); g.fillRect(26, 22, 3, 3); break;
    case 'oath': g.beginPath(); g.moveTo(24, 8); g.lineTo(36, 13); g.lineTo(34, 28); g.lineTo(24, 38); g.lineTo(14, 28); g.lineTo(12, 13); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(24, 30); g.bezierCurveTo(16, 24, 18, 16, 24, 21); g.bezierCurveTo(30, 16, 32, 24, 24, 30); g.fill(); break;
    case 'quake': L([6, 36, 42, 36]); L([24, 36, 20, 28, 26, 22, 22, 14]); L([14, 36, 10, 30]); L([34, 36, 38, 30]); g.beginPath(); g.arc(24, 10, 4, 0, 7); g.fill(); break;
    case 'dance': for (let i = 0; i < 3; i++) L([10 + i * 10, 38, 18 + i * 10, 10]); break;
    case 'banner': L([14, 40, 14, 8]); g.beginPath(); g.moveTo(15, 9); g.lineTo(36, 13); g.lineTo(30, 19); g.lineTo(36, 25); g.lineTo(15, 25); g.closePath(); g.fill(); break;
    case 'barrage': for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(14 + i * 7, 34 - i * 7, 3.5, 0, 7); g.fill(); } break;
    case 'renew': g.beginPath(); g.arc(24, 24, 13, .4, 5.6); g.stroke(); L([33, 12, 37, 17, 31, 19]); g.fillRect(21, 16, 6, 16); g.fillRect(16, 21, 16, 6); break;
    case 'chain': L([12, 8, 22, 20, 16, 24, 30, 40]); L([30, 40, 34, 30]); break;
    case 'nova': for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; L([24, 24, 24 + Math.cos(a) * 16, 24 + Math.sin(a) * 16]); } g.beginPath(); g.arc(24, 24, 5, 0, 7); g.fill(); break;
    case 'haste': g.beginPath(); g.arc(24, 24, 14, 0, 7); g.stroke(); L([24, 24, 24, 14]); L([24, 24, 32, 28]); L([6, 12, 2, 12]); L([6, 20, 0, 20]); break;
    case 'meteor': g.beginPath(); g.arc(30, 30, 9, 0, 7); g.fill(); g.globalAlpha = .5; L([24, 24, 8, 8]); L([28, 20, 16, 6]); L([20, 28, 6, 16]); g.globalAlpha = 1; break;
    case 'potion': g.fillStyle = '#c9c0b0'; g.fillRect(20, 8, 8, 8); g.fillStyle = '#d4503f'; g.beginPath(); g.arc(24, 30, 12, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(20, 26, 3, 0, 7); g.fill(); break;
  }
  g.restore();
  g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; g.strokeRect(1, 1, W2 - 2, H2 - 2);
}

function drawItemIcon(c, it) {
  const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  g.save(); g.scale(c.width / 36, c.height / 36); g.imageSmoothingEnabled = false;
  const col = RCOL[it.rarity || 0];
  const k = it.kind || it.slot;
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (k === 'weapon' && it.wtype === 'greataxe') { g.strokeStyle = '#7a5a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 32); g.lineTo(24, 6); g.stroke(); g.fillStyle = '#cfd6e0'; g.beginPath(); g.moveTo(20, 4); g.quadraticCurveTo(34, 8, 30, 20); g.lineTo(22, 14); g.closePath(); g.fill(); g.fillStyle = col; g.fillRect(16, 14, 4, 3); }
  else if (k === 'weapon' && it.wtype === 'spear') { g.strokeStyle = '#7a5a3a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(6, 32); g.lineTo(28, 8); g.stroke(); g.fillStyle = '#e8eef8'; g.beginPath(); g.moveTo(32, 3); g.lineTo(26, 8); g.lineTo(30, 12); g.closePath(); g.fill(); g.fillStyle = col; g.fillRect(24, 11, 3, 3); }
  else if (k === 'weapon' && it.wtype === 'twinblades') { g.strokeStyle = '#cfd6e0'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(6, 28); g.lineTo(22, 6); g.moveTo(30, 28); g.lineTo(14, 6); g.stroke(); g.strokeStyle = col; g.beginPath(); g.moveTo(4, 24); g.lineTo(10, 30); g.moveTo(32, 24); g.lineTo(26, 30); g.stroke(); }
  else if (k === 'weapon' && it.wtype === 'orb') { g.fillStyle = '#3a2a1a'; g.fillRect(12, 26, 12, 4); g.fillStyle = col; g.beginPath(); g.arc(18, 17, 9, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(13, 11, 4, 4); }
  else if (k === 'weapon' && it.wtype === 'wand') { g.strokeStyle = '#7a5a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 30); g.lineTo(24, 12); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(25, 10, 4, 0, 7); g.fill(); }
  else if (k === 'weapon' && it.wtype === 'tome') { g.fillStyle = '#4a2a5a'; g.fillRect(7, 8, 22, 22); g.fillStyle = '#f0e6d0'; g.fillRect(9, 10, 18, 2); g.fillStyle = col; g.beginPath(); g.arc(18, 20, 4, 0, 7); g.fill(); }
  else if (k === 'weapon' && it.owner === 'orhun') { g.strokeStyle = '#cfd6e0'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 28); g.lineTo(28, 8); g.stroke(); g.strokeStyle = col; g.beginPath(); g.moveTo(6, 22); g.lineTo(14, 30); g.stroke(); g.strokeStyle = '#5a3a22'; g.beginPath(); g.moveTo(8, 28); g.lineTo(5, 31); g.stroke(); }
  else if (k === 'weapon') { g.strokeStyle = '#7a5a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 32); g.lineTo(24, 10); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(26, 8, 5, 0, 7); g.fill(); }
  else if (k === 'armor') { g.fillStyle = it.owner === 'orhun' ? '#6a707c' : '#2a2a38'; g.beginPath(); g.moveTo(8, 8); g.lineTo(14, 6); g.lineTo(22, 6); g.lineTo(28, 8); g.lineTo(30, 16); g.lineTo(25, 16); g.lineTo(25, 30); g.lineTo(11, 30); g.lineTo(11, 16); g.lineTo(6, 16); g.closePath(); g.fill(); g.fillStyle = col; g.fillRect(11, 22, 14, 2); }
  else if (k === 'trinket') { g.strokeStyle = '#d9b860'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 6); g.quadraticCurveTo(18, 18, 26, 6); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(18, 22, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(15, 19, 2, 2); }
  else if (k === 'potion') { g.fillStyle = '#c9c0b0'; g.fillRect(15, 4, 6, 6); g.fillStyle = '#d4503f'; g.beginPath(); g.arc(18, 22, 10, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(13, 18, 3, 3); }
  g.restore();
}

/* ===================== TRAVEL, MOUNT, AUTO-CAST, HEARTS ===================== */
const TRAVEL_ORDER = ['town', 'brightfield', 'murkfen', 'keep', 'frostspire'];
const BEACON_ZONE_NAME = { b1: 'Brightfield', b2: 'Murkfen', b3: 'the Hollow Keep', b4: 'Frostspire' };
function waystoneOpen(id) { const w = ZONES[id].waystone; return !!w && (!w.need || !!G.beacons[w.need]); }
function travelStart(id) {
  const c = ctrlHero();
  if (!waystoneOpen(id)) { toast('That waystone is still dark.'); sfx('deny'); return; }
  if (G.inCombat) { toast('You cannot travel while in combat.'); sfx('deny'); return; }
  if (c.dead) return;
  if (G.mounted) dismount(true);
  closeWindows();
  G.travel = { to: id, t: 0, dur: 2, x: c.x, y: c.y, hp: c.hp };
  sfx('cast');
}
function travelTick(dt) {
  const tr = G.travel; if (!tr) return;
  const c = ctrlHero();
  tr.t += dt;
  if (Math.random() < .5) G.fx.push({ k: 'p', x: c.x + rnd(-14, 14), y: c.y - rnd(0, 30), vx: 0, vy: -60, col: '#7dffc8', t: 0, dur: .6, sz: 3 });
  if (G.inCombat || c.dead || Math.hypot(c.x - tr.x, c.y - tr.y) > 8 || c.hp < tr.hp) { G.travel = null; toast('Travel interrupted.'); return; }
  if (tr.t >= tr.dur) {
    const id = tr.to, w = ZONES[id].waystone; G.travel = null;
    sfx('tele'); burstFx(c.x, c.y - 20, 50, '#7dffc8', 20);
    fadeTo(() => { enterZone(id, null, [(w.x + .5) * TILE, (w.y + 1.7) * TILE]); saveGame(true); });
  }
}
function openTravel() {
  const w = $('winTravel');
  w.innerHTML = `<h2>Waystones <button class="x" data-close="winTravel" aria-label="Close">×</button></h2>
    <p style="margin:0 0 10px;color:#cfc8b6;max-width:52ch">Channel for 2 seconds to travel to a waystone you have woken. Each zone's waystone wakes when you relight its beacon. Lanternhold's is always open.</p>
    <div class="travelList">${TRAVEL_ORDER.map(id => { const z = ZONES[id], open = waystoneOpen(id), here = G.zone && G.zone.id === id, need = z.waystone.need;
      return `<button class="btn ${open ? 'primary' : ''}" data-tr="${id}" ${open ? '' : 'disabled'}><b>${z.name}</b><span>${open ? (here ? 'You are here' : 'Travel') : 'Relight the beacon of ' + BEACON_ZONE_NAME[need]}</span></button>`; }).join('')}</div>`;
  w.hidden = false;
  w.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => travelStart(b.dataset.tr));
}

/* ---------- Riding Lumen ---------- */
function mountToggle() {
  if (G.mounted) { dismount(); return; }
  if (G.mountCast) return;
  if (P.handan.dead || P.orhun.dead) { toast('Both heroes must be standing to ride Lumen.'); sfx('deny'); return; }
  if (G.inCombat) { toast('Lumen will not carry you into a fight.'); sfx('deny'); return; }
  G.travel = null;
  G.mountCast = { t: 0, dur: 1.3 };
  P.handan.swingT = 1.3; P.handan.face = P.fox.x >= P.handan.x ? 1 : -1;
  ring(P.fox.x, P.fox.y, 46, '#46c495'); sfx('cast');
}
function mountUp() {
  G.mounted = true;
  const d = ctrlHero();
  for (const h of heroes()) { h.buffs = h.buffs.filter(b => b.id !== 'mounted'); h.buffs.push({ id: 'mounted', dur: 1e9, t: 1e9, tick: 1, mods: { speed: 1.9 } }); h.path = null; }
  P.fox.x = d.x; P.fox.y = d.y;
  burstFx(d.x, d.y - 16, 50, '#7dffc8', 26); sfx('heal');
  floatText(d.x, d.y - 80, 'Lumen grows!', '#c9f5df', 1.1);
}
function dismount(quiet) {
  if (!G.mounted) return;
  G.mounted = false;
  for (const h of heroes()) h.buffs = h.buffs.filter(b => b.id !== 'mounted');
  const d = ctrlHero(), o = otherHero();
  o.x = d.x - 24; o.y = d.y + 10; P.fox.x = d.x + 14; P.fox.y = d.y + 18;
  if (!quiet) { sparkle(P.fox, '#7dffc8'); sfx('ui'); }
}
function mountTick(dt) {
  if (G.mountCast) {
    const mc = G.mountCast; mc.t += dt; P.handan.swingT = Math.max(P.handan.swingT, .2);
    if (Math.random() < .7) G.fx.push({ k: 'p', x: P.fox.x + rnd(-24, 24), y: P.fox.y - rnd(0, 20), vx: 0, vy: -50, col: Math.random() < .5 ? '#7dffc8' : '#fff2b0', t: 0, dur: .7, sz: 3 });
    if (G.inCombat || P.handan.dead) G.mountCast = null;
    else if (mc.t >= mc.dur) { G.mountCast = null; mountUp(); }
  }
  if (G.mounted) {
    if (G.inCombat || P.orhun.dead || P.handan.dead) { dismount(); return; }
    const d = ctrlHero(), o = otherHero();
    o.x = d.x; o.y = d.y; o.dir = d.dir; o.face = d.face; o.moving = d.moving; o.path = null;
    P.fox.x = d.x; P.fox.y = d.y; P.fox.face = d.face; P.fox.moving = d.moving;
  }
}

/* ---------- Auto-cast (only in combat) ---------- */
G.autoCast = !!load('jadeborn_auto');
function setAutoCast(on) {
  G.autoCast = on; store('jadeborn_auto', on);
  for (const id of ['bAuto', 'mAuto']) { const b = $(id); if (b) b.textContent = 'Auto-cast: ' + (on ? 'on' : 'off'); }
  toast(on ? 'Auto-cast on: abilities fire by themselves during fights.' : 'Auto-cast off.');
}
function autoCast(h) {
  if (h.dead || h.dash || h.gcd > 0 || has(h, 'stun')) return;
  const eng = engagedFoes(); if (!eng.length) return;
  const ok = i => G.level >= ABIL[h.key][i].lvl && abilityReady(h, ABIL[h.key][i]) === 'ok';
  const use = (i, t) => useAbility(h, i, t, true);
  const mine = h === ctrlHero() ? G.target : h.target;
  if (h.key === 'orhun') {
    const t = (mine && mine.team === 'foe' && !mine.dead) ? mine : eng.slice().sort((a, b) => dist(a, h) - dist(b, h))[0];
    if (!t) return;
    const d = dist(h, t) - t.r - h.r;
    if (eng.some(f => { const ft = foeTarget(f); return ft && ft !== P.orhun && dist(f, h) < 5 * TILE; }) && ok(1)) return use(1);
    if (h.hp / h.maxHp < .45 && ok(3)) return use(3);
    if (d < 2 * TILE) {
      if (h.res >= 40 && (t.hp / t.maxHp < .3 || h.res >= 75) && ok(4)) return use(4, t);
      if (foesNear(h, 2.3 * TILE).length >= 2 && ok(2)) return use(2);
      if (ok(0)) return use(0, t);
    } else if (d > 3 * TILE && d < 8 * TILE && ok(5)) return use(5, t);
  } else {
    const lo = heroes().filter(x => !x.dead).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (lo && lo.hp / lo.maxHp < .62 && ok(2)) return use(2, lo);
    if (!P.orhun.dead && eng.some(f => foeTarget(f) === P.orhun) && !P.orhun.buffs.some(b => b.id === 'ward') && ok(4)) return use(4, P.orhun);
    const close = eng.find(f => foeTarget(f) === h && dist(f, h) < 3 * TILE && !f.def.boss && !has(f, 'root'));
    if (close && ok(1)) return use(1, close);
    let t = (mine && mine.team === 'foe' && !mine.dead) ? mine : (P.orhun.target && !P.orhun.target.dead ? P.orhun.target : null);
    if (!t) t = eng.slice().sort((a, b) => dist(a, h) - dist(b, h))[0];
    if (!t || dist(h, t) - t.r > 8 * TILE || !lineClear(h.x, h.y - 10, t.x, t.y - 10, 3)) return;
    const reserve = h.res > h.resMax * .3;
    if (foesNearPt(t.x, t.y, 2.5 * TILE).length >= 3 && reserve && ok(5)) return use(5, t);
    if (reserve && t.maxHp > 100 && t.hp / t.maxHp > .3 && !t.buffs.some(b => b.id === 'wither') && ok(3)) return use(3, t);
    if (h.res > h.resMax * .22 && ok(0)) return use(0, t);
  }
}

/* ---------- Hearts when Handan heals Orhun ---------- */
const _heal0 = heal;
heal = function (src, tgt, amt, quiet) {
  const real = _heal0(src, tgt, amt, quiet);
  if (real > 0 && src && src.key === 'handan' && tgt && tgt.key === 'orhun' && (!quiet || amt > tgt.maxHp * .2) && G.t - (G.lastHeart || -9) > .45) {
    G.lastHeart = G.t;
    G.fx.push({ k: 'heart', x: tgt.x, y: tgt.y - 46, bx: tgt.x, by: tgt.y, h: 2.15, t: 0, dur: 1.5, s: 1 });
    for (let i = 0; i < 4; i++) { const ox = rnd(-18, 18); G.fx.push({ k: 'heart', x: tgt.x + ox, y: tgt.y - rnd(20, 40), bx: tgt.x + ox, by: tgt.y + rnd(-6, 6), h: 1.3 + Math.random() * .6, t: -i * .08, dur: 1 + Math.random() * .4, s: .45 }); }
  }
  return real;
};

/* ---------- Hooks into the simulation ---------- */
const _dd0 = dealDamage;
dealDamage = function (src, tgt, amt, o) { if (G.mounted && tgt && tgt.hero) dismount(); return _dd0(src, tgt, amt, o); };
const _ua0 = useAbility;
useAbility = function (h, idx, explicit, quiet) { if (G.mounted) dismount(true); if (G.mountCast) G.mountCast = null; return _ua0(h, idx, explicit, quiet); };
const _dodge0 = dodge;
dodge = function (h, dx, dy) { if (G.mounted) dismount(true); return _dodge0(h, dx, dy); };
const _hai0 = heroAI;
heroAI = function (h, dt) { if (G.mounted || G.mountCast) { h.moving = false; return; } return _hai0(h, dt); };
const _fox0 = foxTick;
foxTick = function (f, dt) { if (G.mounted) { f.t += dt; return; } if (G.mountCast) { f.t += dt; f.moving = false; return; } return _fox0(f, dt); };
const _upd0 = update;
update = function (dt) {
  _upd0(dt);
  if (G.paused || G.dialog || !G.started) return;
  travelTick(dt); mountTick(dt);
  if (G.autoCast && G.inCombat && !G.mounted) { autoCast(ctrlHero()); if (G.coop) autoCast(P.handan); }
  updateChannelBar();
};
function updateChannelBar() {
  const el = $('chan'); if (!el) return;
  const a = G.travel ? { n: 'Travelling to ' + ZONES[G.travel.to].name, p: G.travel.t / G.travel.dur } : G.mountCast ? { n: 'Handan conjures Lumen', p: G.mountCast.t / G.mountCast.dur } : null;
  el.hidden = !a; if (a) { el.querySelector('span').textContent = a.n; el.querySelector('i').style.width = Math.min(100, a.p * 100) + '%'; }
}

/* ---------- UI wiring ---------- */
(function () {
  const st = document.createElement('style');
  st.textContent = `#winTravel{width:460px}.travelList{display:flex;flex-direction:column;gap:6px}.travelList .btn{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;font-size:13px;text-transform:none;letter-spacing:0;text-align:left}.travelList .btn b{font-family:var(--display);font-size:16px;font-weight:400}.travelList .btn span{font-size:12px;color:#cfc8b6}.travelList .btn[disabled]{opacity:.5;cursor:default}
  #chan{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom,0px));width:260px;z-index:15;padding:6px 10px;display:flex;flex-direction:column;gap:4px;pointer-events:none;text-align:center;font:600 12px var(--body);color:#c9f5df}
  #chan .bar{height:8px}#chan .bar i{background:linear-gradient(90deg,#2b7d5f,#7dffc8)}`;
  document.head.appendChild(st);
  const tw = document.createElement('div'); tw.id = 'winTravel'; tw.className = 'win'; tw.hidden = true; document.body.appendChild(tw);
  const ch = document.createElement('div'); ch.id = 'chan'; ch.className = 'frame'; ch.hidden = true; ch.innerHTML = '<span></span><div class="bar"><i style="width:0"></i></div>'; document.body.appendChild(ch);
  const mm = document.querySelector('.mmbtns');
  const tb = document.createElement('button'); tb.className = 'btn'; tb.id = 'bTravel'; tb.title = 'Waystones (T)'; tb.innerHTML = 'Travel<kbd>T</kbd>'; tb.onclick = () => { SND.init(); $('winTravel').hidden ? openTravel() : ($('winTravel').hidden = true); };
  mm.insertBefore(tb, $('bHelp'));
  const menu = $('menu');
  const ab = document.createElement('button'); ab.className = 'btn'; ab.id = 'bAuto'; ab.textContent = 'Auto-cast: ' + (G.autoCast ? 'on' : 'off'); ab.title = 'Z'; ab.onclick = () => setAutoCast(!G.autoCast);
  const mb = document.createElement('button'); mb.className = 'btn'; mb.id = 'bMount'; mb.textContent = 'Ride Lumen'; mb.title = 'V'; mb.onclick = () => { SND.init(); mountToggle(); };
  menu.insertBefore(mb, menu.firstChild); menu.insertBefore(ab, menu.firstChild);
})();

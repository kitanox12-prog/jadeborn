/* ===================== POLISH: respawns, bags, loot, readability ===================== */
const JB_VERSION = '1.4';

/* ---------- Foes return to their posts, so quests never need a map re-entry ---------- */
const RESPAWN_T = 40, RESPAWN_ELITE_T = 75;
const _enter5 = enterZone;
enterZone = function (id, entryKey, pos) {
  _enter5(id, entryKey, pos);
  if (G.mode === 'survivor') return;
  G.spDead = {};
  const z = G.zone;
  for (const f of G.foes) { const i = z.spawns.findIndex(s => s.type === f.type && (s.x + .5) * TILE === f.home.x && (s.y + .5) * TILE === f.home.y); if (i >= 0) f.sp = i; }
  // spawns already empty (for example a boss that is dead) count as dead long ago
  z.spawns.forEach((s, i) => { if (!G.foes.some(f => f.sp === i) && !FOES[s.type].boss) G.spDead[i] = -1e9; });
};
const _kill5 = kill;
kill = function (e, src) { _kill5(e, src); if (G.mode !== 'survivor' && e.team === 'foe' && e.sp !== undefined && G.spDead) G.spDead[e.sp] = G.t; };
function respawnTick() {
  const z = G.zone; if (!z || !G.spDead) return;
  const hs = heroes().filter(h => !h.dead); if (!hs.length) return;
  for (const k in G.spDead) {
    const i = +k, s = z.spawns[i]; if (!s) { delete G.spDead[k]; continue; }
    const d = FOES[s.type]; if (d.boss) { delete G.spDead[k]; continue; }
    if (G.t - G.spDead[k] < (d.elite ? RESPAWN_ELITE_T : RESPAWN_T)) continue;
    const x = (s.x + .5) * TILE, y = (s.y + .5) * TILE;
    if (hs.some(h => Math.hypot(h.x - x, h.y - y) < 9 * TILE)) continue;
    if (G.foes.some(f => f.sp === i && !f.dead)) { delete G.spDead[k]; continue; }
    const f = makeFoe(s.type, s.x, s.y); f.sp = i; G.foes.push(f); delete G.spDead[k];
  }
}
// accepting a kill quest wakes up its targets quickly if the area was already cleared
const _accept5 = acceptQuest;
acceptQuest = function (q) {
  _accept5(q);
  if (!G.spDead || !G.zone) return;
  for (const o of q.obj) if (o.t === 'kill') G.zone.spawns.forEach((s, i) => { if (o.e.includes(s.type) && G.spDead[i] !== undefined) G.spDead[i] = Math.min(G.spDead[i], G.t - (FOES[s.type].elite ? RESPAWN_ELITE_T : RESPAWN_T) + 6); });
};

/* ---------- Passive lantern, respawns ---------- */
let _rsT = 0;
const _upd5 = update;
update = function (dt) {
  _upd5(dt);
  if (G.mode === 'survivor' || !G.started || G.paused || G.dialog) return;
  G.gauge = Math.min(100, G.gauge + dt * (G.inCombat ? .55 : .2) * (1 + B('lantern') / 100));
  _rsT -= dt; if (_rsT <= 0) { _rsT = 1; respawnTick(); }
};

/* ---------- Loot: trinkets for both heroes, smarter equipping ---------- */
ITEM_NAMES.orhun.trinket = ['Warband Token', 'Iron Signet', 'Duelist\'s Charm', 'Oathband', 'Wolf-Tooth Pendant'];
ITEM_NAMES.handan.trinket = ['Jade Charm', 'Moonstone Band', 'Lantern Locket', 'Spellbound Ring', 'Starlit Brooch'];
randomItem = function (ilvl, rarity) {
  const slot = pick(['weapon', 'armor', 'weapon', 'armor', 'trinket', 'trinket']);
  return makeItem(slot, pick(['orhun', 'handan']), ilvl, rarity);
};
const SCORE_W = { orhun: { atk: 1, def: .7, hp: .12, crit: 250 }, handan: { atk: 1.15, def: .45, hp: .09, crit: 250 } };
function itemScore(it, key) { if (!it) return -1; const w = SCORE_W[key], s = it.stats; return (s.atk || 0) * w.atk + (s.def || 0) * w.def + (s.hp || 0) * w.hp + (s.crit || 0) * w.crit; }
function upgradeFor(it) {
  if (!it || !it.slot) return null;
  const keys = it.owner === 'any' ? ['orhun', 'handan'] : [it.owner];
  let best = null, gain = 0;
  for (const k of keys) { const cur = G.equip[k][it.slot]; const g = cur ? itemScore(it, k) - itemScore(cur, k) : itemScore(it, k) + 1; if (g > gain + .5) { gain = g; best = k; } }
  return best;
}
const _equip5 = equipItem;
equipItem = function (it, who) { if (it.owner === 'any') who = upgradeFor(it) || who; return _equip5(it, who); };

/* ---------- Bags: no limit, upgrade glow, sorting ---------- */
const _rcw5 = refreshCharWin;
refreshCharWin = function () {
  _rcw5();
  const w = $('winChar'); if (!w || w.hidden) return;
  const best = {};
  for (const it of G.inv) { const k = upgradeFor(it); if (!k) continue; const key = k + it.slot, sc = itemScore(it, k); if (!best[key] || sc > best[key].sc) best[key] = { it, sc }; }
  const bestSet = new Set(Object.values(best).map(b => b.it));
  w.querySelectorAll('[data-bag]').forEach(el => { const it = G.inv[+el.dataset.bag]; const k = upgradeFor(it); if (k) { el.classList.add(bestSet.has(it) ? 'up' : 'up2'); el.dataset.for = k[0].toUpperCase(); } });
  w.querySelectorAll('.skcard[data-sk]').forEach(el => { if (el.querySelector('.skcat')) return; const id = el.dataset.sk.split(':')[1], c = skillCat(id), b = el.querySelector('b') || el; const sp = document.createElement('span'); sp.className = 'skcat ' + c; sp.textContent = c === 'sup' ? 'Support' : 'Attack'; b.appendChild(sp); });
  const bag = w.querySelector('.bag');
  if (bag && !w.querySelector('#bagTools')) {
    const t = document.createElement('div'); t.id = 'bagTools';
    const ups = Object.keys(best).length;
    t.innerHTML = `<span>${G.inv.length} items${ups ? ` · <b style="color:#7dff8a">${ups} best upgrade${ups > 1 ? 's' : ''} glowing</b>` : ''}</span><button class="btn" id="bagSort">Sort</button>${vendorMode ? '<button class="btn" id="bagSellWorse">Sell non-upgrades</button>' : ''}`;
    bag.parentNode.insertBefore(t, bag);
    $('bagSort').onclick = () => { const ord = { weapon: 0, armor: 1, trinket: 2 }; G.inv.sort((a, b) => (upgradeFor(b) ? 1 : 0) - (upgradeFor(a) ? 1 : 0) || (a.owner > b.owner ? 1 : a.owner < b.owner ? -1 : 0) || ord[a.slot] - ord[b.slot] || b.rarity - a.rarity || b.ilvl - a.ilvl); sfx('ui'); refreshCharWin(); };
    if ($('bagSellWorse')) $('bagSellWorse').onclick = () => { let g = 0; G.inv = G.inv.filter(it => { if (upgradeFor(it) || it.rarity >= 3) return true; g += it.value; return false; }); G.gold += g; sfx('coin'); toast(`Sold for ${g}g`); refreshCharWin(); };
  }
};
(function () {
  const st = document.createElement('style');
  st.textContent = `.bag{max-height:236px;overflow-y:auto;padding-right:4px}
  .bagslot.up{box-shadow:0 0 0 2px #5fdc6c,0 0 12px rgba(95,220,108,.7);animation:upglow 1.6s ease-in-out infinite}
  .bagslot.up2::before,.bagslot.up::before{content:'▲ ' attr(data-for);position:absolute;left:2px;top:0;font-size:10px;font-weight:900;color:#7dff8a;text-shadow:0 1px 2px #000;z-index:1}
  @keyframes upglow{50%{box-shadow:0 0 0 2px #9affa8,0 0 18px rgba(125,255,138,.95)}}
  #bagTools{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:12.5px;color:#cfc8b6}#bagTools span{margin-right:auto}#bagTools .btn{padding:4px 10px;font-size:12px}
  .skcat{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:1px 6px;border-radius:3px;margin-left:6px}
  .skcat.atk{background:#4a1a12;color:#ffb08a}.skcat.sup{background:#123a2c;color:#8affc8}`;
  document.head.appendChild(st);
})();

/* ---------- Skill colours: attacks are ember red, heals / buffs / defence are jade green ---------- */
const SUPPORT_SKILLS = new Set(['roar', 'ironhide', 'frenzy', 'oath', 'banner', 'mend', 'ward', 'renewal', 'haste']);
const SKILL_COLS = { atk: { bg: '#4a1a12', fg: '#ffb08a' }, sup: { bg: '#123a2c', fg: '#8affc8' } };
function skillCat(id) { return SUPPORT_SKILLS.has(id) ? 'sup' : 'atk'; }
for (const k of ['orhun', 'handan']) for (const a of SKILL_POOL[k]) { a.cat = skillCat(a.id); a.icon = { ...a.icon, ...SKILL_COLS[a.cat] }; }

/* ---------- Lumen: visible pounces ---------- */
const _deal5 = dealDamage;
dealDamage = function (src, tgt, amt, o = {}) {
  const r = _deal5(src, tgt, amt, o);
  if (src && src.pet && !o.dot && tgt && r > 0) {
    zap(src.x, src.y - 10, tgt.x, tgt.y - 14, '#7dffc8', true);
    G.fx.push({ k: 'ring', x: tgt.x, y: tgt.y - 10, r: 22, col: '#7dffc8', t: 0, dur: .3 });
    for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28; G.fx.push({ k: 'p', x: tgt.x, y: tgt.y - 14, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 - 30, col: i % 2 ? '#7dffc8' : '#e8fff6', t: 0, dur: .35, sz: 3 }); }
    src.pounce = .22; src.swingT = .22;
  }
  return r;
};
const _fox5 = foxTick;
foxTick = function (f, dt) { _fox5(f, dt); if (f.pounce > 0) f.pounce = Math.max(0, f.pounce - dt); };

/* ---------- Service worker: always revalidate pages ---------- */

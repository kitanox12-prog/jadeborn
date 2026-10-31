/* ===================== GAME MENU (desktop + phone) and the compact phone HUD =====================
   One menu sheet that every feature registers into with addMenuItem, so phones reach everything:
   bags, skills, boons, quests, travel, mount, auto-cast, wardrobe, leisure, language, changelog ... */
const MENU_ITEMS = [];
function addMenuItem(o) { MENU_ITEMS.push(o); MENU_ITEMS.sort((a, b) => (a.order || 50) - (b.order || 50)); }
const MI = (path) => `<svg viewBox="0 0 24 24">${path}</svg>`;
addMenuItem({ id: 'bags', order: 10, label: 'Bags', icon: MI('<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'), fn: () => { charTab = 'gear'; openChar(false); } });
addMenuItem({ id: 'skills', order: 11, label: 'Skills', icon: MI('<path d="M5 19L19 5M14 5h5v5"/><circle cx="7" cy="7" r="2"/>'), fn: () => { charTab = 'skills'; openChar(false); } });
addMenuItem({ id: 'boons', order: 12, label: 'Boons', icon: MI('<path d="M12 3l2.6 5.6L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.4-.7z"/>'), fn: () => { charTab = 'boons'; openChar(false); } });
addMenuItem({ id: 'quests', order: 13, label: 'Quests', icon: MI('<path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>'), fn: () => openQuests() });
addMenuItem({ id: 'travel', order: 14, label: 'Travel', icon: MI('<path d="M12 2l3 7-3 13-3-13z"/><circle cx="12" cy="9" r="1.5"/>'), fn: () => openTravel() });
addMenuItem({ id: 'mount', order: 15, label: 'Ride Lumen', icon: MI('<path d="M4 15c2-4 6-6 10-6l3-3 1 4c2 1 3 3 3 5"/><path d="M6 15v4M10 15v4M15 15v4M19 15v3"/>'), fn: () => mountToggle(), state: () => G.mounted ? 'on' : '' });
addMenuItem({ id: 'auto', order: 16, label: 'Auto-cast', icon: MI('<path d="M12 3a9 9 0 1 0 9 9"/><path d="M21 3v6h-6"/><path d="M12 8v4l3 2"/>'), fn: () => setAutoCast(!G.autoCast), state: () => G.autoCast ? 'on' : '' });
addMenuItem({ id: 'sound', order: 80, label: 'Sound', icon: MI('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/>'), fn: () => { SND.init(); const on = SND.toggle(); $('bSound').textContent = 'Sound: ' + (on ? 'on' : 'off'); }, state: () => SND.on ? 'on' : '' });
addMenuItem({ id: 'save', order: 81, label: 'Save', icon: MI('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>'), fn: () => saveGame(false) });
addMenuItem({ id: 'help', order: 90, label: 'Controls', icon: MI('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01"/>'), fn: () => { $('help').hidden = false; } });
if (window.JB_ALT) addMenuItem({ id: 'gfx', order: 92, label: window.JB_ALT.label, icon: MI('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/>'), fn: () => { try { if (G.started) saveGame(true); localStorage.setItem('jadeborn_gfx', JB_ALT.pref); } catch (e) { } location.href = JB_ALT.href; } });
addMenuItem({ id: 'title', order: 99, label: 'Title screen', icon: MI('<path d="M3 11l9-7 9 7v9H3z"/><path d="M10 20v-6h4v6"/>'), fn: () => { saveGame(true); location.reload(); } });

function openGameMenu() {
  const w = $('gameMenu');
  if (!w.hidden) { w.hidden = true; return; }
  closeWindows && closeWindows();
  w.hidden = false;
  w.innerHTML = `<h2>Menu <button class="x" id="gmClose" aria-label="Close">×</button></h2>
    <div class="gmGrid">${MENU_ITEMS.filter(m => !m.when || m.when()).map(m => `<button class="gmItem ${m.state && m.state() === 'on' ? 'on' : ''}" data-mi="${m.id}">${m.icon}<span>${m.label}</span></button>`).join('')}</div>
    <div class="gmFoot">Jadeborn ${typeof JB_VERSION !== 'undefined' ? 'v' + JB_VERSION : ''}</div>`;
  $('gmClose').onclick = () => { w.hidden = true; };
  w.querySelectorAll('[data-mi]').forEach(b => b.onclick = () => { const m = MENU_ITEMS.find(x => x.id === b.dataset.mi); SND.init(); sfx('ui'); w.hidden = true; m.fn(); });
}

(function () {
  const w = document.createElement('div'); w.id = 'gameMenu'; w.className = 'win'; w.hidden = true; document.body.appendChild(w);
  const st = document.createElement('style');
  st.textContent = `#gameMenu{width:560px;z-index:30}.gmGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}
  .gmItem{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:1px solid var(--edge);border-radius:8px;background:linear-gradient(180deg,#1d2430,#121720);color:var(--parch);font:600 13px var(--body);cursor:pointer}
  .gmItem svg{width:26px;height:26px;stroke:var(--brass);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .gmItem:hover{border-color:var(--brass)}.gmItem.on{border-color:var(--jade);box-shadow:inset 0 0 0 1px var(--jade)}.gmItem.on svg{stroke:var(--jade)}
  .gmFoot{margin-top:10px;font-size:11px;color:var(--mute);text-align:right}
  #bMenu{font-weight:800}
  /* ---- phone HUD: smaller, quieter, out of the way ---- */
  .touch #party{transform:scale(.6)}
  .touch #target{transform:translateX(-50%) scale(.82);transform-origin:top center;width:240px}
  .touch #mmwrap{transform:scale(.6);transform-origin:top right;padding:4px}
  .touch #mmwrap #minimap{display:none}.touch #mmwrap.mapOpen #minimap{display:block}
  .touch #zonename{cursor:pointer;font-size:16px}
  .touch .mmbtns .btn:not(#bMenu){display:none}
  .touch .mmbtns #bMenu{flex:1;font-size:15px;padding:8px 12px}
  .touch #tracker{top:calc(84px + env(safe-area-inset-top,0px));left:max(10px,env(safe-area-inset-left,0px));width:172px;gap:4px;pointer-events:auto;background:rgba(10,12,18,.42);border-radius:6px;padding:5px 7px}
  .touch #tracker:empty{display:none}
  .touch #tracker h4{font-size:12px}.touch #tracker .o{font-size:10.5px}
  .touch #tracker:not(.open) .q:nth-child(n+2){display:none}
  .touch #tracker:not(.open)[data-more]::after{content:attr(data-more);font-size:10px;color:var(--brass)}
  .touch #toast{top:auto;bottom:calc(max(10px,env(safe-area-inset-bottom,0px)) + 8px);left:50%;max-width:34vw}
  .touch #toast div{font-size:11.5px;padding:3px 9px;line-height:1.3}
  .touch #toast div:nth-last-child(n+3){display:none}
  .touch #banner{font-size:30px;top:14%}.touch #banner small{font-size:10px;letter-spacing:.22em}
  .touch #bar{grid-template-columns:repeat(4,52px);grid-template-rows:repeat(2,52px);gap:6px;padding:6px}
  .touch #bar .slot,.touch #tUtil .slot{width:52px;height:52px}
  .touch #bar #tLantern{width:52px;height:52px}
  .touch #tUtil{right:calc(max(14px,env(safe-area-inset-right,0px)) + 246px);gap:6px}
  .touch #tUtil .tbtn,.touch #tUtil .slot{width:46px!important;height:46px!important}
  .touch #tUse{bottom:calc(max(12px,env(safe-area-inset-bottom,0px)) + 136px)}
  .touch #joyHint{width:84px;height:84px}
  .touch #tMore{display:none!important}.touch #bMore{display:none!important}
  #title .row{flex-wrap:wrap;justify-content:center}
  #verTag{position:fixed;right:10px;bottom:8px;font-size:11px;color:var(--mute);z-index:41;pointer-events:none}`;
  document.head.appendChild(st);
  const b = document.createElement('button'); b.className = 'btn'; b.id = 'bMenu'; b.title = 'Menu (Esc)'; b.textContent = '☰';
  document.querySelector('.mmbtns').appendChild(b);
  b.onclick = ev => { ev.stopPropagation(); SND.init(); openGameMenu(); };
  $('zonename').addEventListener('click', () => { if (TOUCH_UI) $('mmwrap').classList.toggle('mapOpen'); });
  $('tracker').addEventListener('click', () => { if (TOUCH_UI) $('tracker').classList.toggle('open'); });
  const v = document.createElement('div'); v.id = 'verTag'; v.textContent = 'v' + JB_VERSION; $('title').appendChild(v);
})();
const _rt6 = renderTracker;
renderTracker = function () { _rt6(); const el = $('tracker'), n = el.querySelectorAll('.q').length; if (n > 1) el.dataset.more = `+${n - 1} more · tap`; else delete el.dataset.more; };
const _aw6 = anyWindowOpen; anyWindowOpen = function () { return _aw6() || !$('gameMenu').hidden; };
const _cw6 = closeWindows; closeWindows = function () { const any = _cw6(); if (!$('gameMenu').hidden) { $('gameMenu').hidden = true; return true; } return any; };
const _okp6 = onKeyPress;
onKeyPress = function (k, e) {
  if (G.mode !== 'survivor' && G.started && !G.dialog && k === 'escape' && !anyWindowOpen() && !G.target) { openGameMenu(); return; }
  return _okp6(k, e);
};

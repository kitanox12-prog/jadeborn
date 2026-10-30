/* ===================== TOUCH / PHONE CONTROLS ===================== */
(function () {
  const coarse = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints > 0 && 'ontouchstart' in window);
  // graphics switch (only present in the installable build)
  const alt = window.JB_ALT;
  function switchGfx() { try { if (G.started) saveGame(true); localStorage.setItem('jadeborn_gfx', alt.pref); } catch (e) { } location.href = alt.href; }
  if (alt) {
    const row = document.querySelector('#title .row');
    const b = document.createElement('button'); b.className = 'btn'; b.id = 'bGfx'; b.textContent = alt.label; b.onclick = switchGfx;
    row.appendChild(b);
  }
  if (!coarse) return;
  TOUCH_UI = true;
  document.documentElement.classList.add('touch');

  const css = `
  .touch canvas#game{touch-action:none}
  .touch #bottom{left:0;right:0;transform:none;bottom:0;pointer-events:none}
  .touch #gaugeRow,.touch #menu,.touch #log,.touch #swapBtn,.touch #bCoop,.touch #bPlayers,.touch #title .keys{display:none!important}
  .touch #xpbar{position:fixed;left:0;right:0;bottom:0;width:auto;height:3px;border:0;border-radius:0;pointer-events:none}
  .touch #bar{position:fixed;right:max(14px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));display:grid;grid-template-columns:repeat(3,58px);grid-template-rows:repeat(2,58px);gap:8px;padding:8px;background:rgba(15,19,27,.5);border-radius:14px;pointer-events:auto}
  .touch #bar > div:not(.slot){display:none}
  .touch #bar .slot,.touch #tUtil .slot{width:58px;height:58px;border-radius:50%;border:2px solid #000;box-shadow:0 2px 8px rgba(0,0,0,.5),inset 0 0 0 1px rgba(224,166,78,.25)}
  .touch #bar .slot .key,.touch #tUtil .slot .key{display:none}
  .touch #bar .slot .cost{right:50%;transform:translateX(50%);bottom:2px}
  .touch #bar .slot[data-pos="0"]{grid-column:3;grid-row:2;box-shadow:0 0 0 2px rgba(224,166,78,.6),0 2px 10px rgba(0,0,0,.6)}
  .touch #bar .slot[data-pos="1"]{grid-column:2;grid-row:2}
  .touch #bar .slot[data-pos="2"]{grid-column:1;grid-row:2}
  .touch #bar .slot[data-pos="3"]{grid-column:3;grid-row:1}
  .touch #bar .slot[data-pos="4"]{grid-column:2;grid-row:1}
  .touch #bar .slot[data-pos="5"]{grid-column:1;grid-row:1}
  .touch .slot.press{transform:scale(.9);filter:brightness(1.3)}
  .touch .slot.locked::after{font-size:12px;border-radius:50%}
  #tUtil{position:fixed;right:calc(max(14px,env(safe-area-inset-right,0px)) + 216px);bottom:max(12px,env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:auto}
  #tUtil .slot{width:50px!important;height:50px!important}
  .tbtn{width:50px;height:50px;border-radius:50%;border:2px solid #000;background:radial-gradient(circle at 50% 35%,#2a3242,#141922);color:var(--parch);font:700 11px var(--body);letter-spacing:.04em;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.5),inset 0 0 0 1px rgba(224,166,78,.25);position:relative;overflow:hidden;padding:0;cursor:pointer}
  .tbtn:active{transform:scale(.9)}
  .tbtn svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  #tLantern{color:#c9f5df}
  #tLantern i{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,#2b7d5f,#46c495);opacity:.75;display:block}
  #tLantern svg{position:relative}
  #tLantern.full{box-shadow:0 0 16px #46c495,0 0 0 2px #c9f5df}
  #tUse{position:fixed;right:calc(max(14px,env(safe-area-inset-right,0px)) + 8px);bottom:calc(max(12px,env(safe-area-inset-bottom,0px)) + 150px);min-width:110px;height:44px;border-radius:22px;border:2px solid var(--brass);background:linear-gradient(180deg,#7a5420,#4e3412);color:#fff3da;font:800 14px var(--body);letter-spacing:.06em;text-transform:uppercase;pointer-events:auto;box-shadow:0 0 14px rgba(224,166,78,.45)}
  #tUse:active{transform:scale(.94)}
  #joyBase{position:fixed;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:2px solid rgba(236,226,201,.35);background:radial-gradient(circle,rgba(236,226,201,.08),rgba(236,226,201,.02));pointer-events:none;z-index:6}
  #joyKnob{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:radial-gradient(circle at 40% 35%,rgba(255,240,210,.55),rgba(224,166,78,.35));border:2px solid rgba(255,240,210,.6)}
  #joyHint{position:fixed;left:calc(max(16px,env(safe-area-inset-left,0px)) + 30px);bottom:calc(max(16px,env(safe-area-inset-bottom,0px)) + 30px);width:96px;height:96px;border-radius:50%;border:2px dashed rgba(236,226,201,.22);display:grid;place-items:center;color:rgba(236,226,201,.4);font:700 10px var(--body);letter-spacing:.12em;text-transform:uppercase;pointer-events:none;text-align:center}
  #tMore{position:fixed;top:calc(env(safe-area-inset-top,0px) + 150px);right:max(12px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;gap:6px;padding:10px;z-index:22;pointer-events:auto;min-width:170px}
  #tMore .btn{font-size:13px;padding:9px 12px;text-align:left}
  .touch #party{transform:scale(.78);transform-origin:top left}
  .touch #mmwrap{transform:scale(.72);transform-origin:top right}
  .touch #tracker{left:max(12px,env(safe-area-inset-left,0px));right:auto;top:calc(112px + env(safe-area-inset-top,0px));width:200px}
  .touch #tracker h4{font-size:13px}.touch #tracker .o{font-size:11.5px}
  .touch #target{top:calc(8px + env(safe-area-inset-top,0px));bottom:auto;width:230px}
  .touch #dialog{bottom:max(10px,env(safe-area-inset-bottom,0px));width:min(620px,calc(100vw - 32px));padding:10px 12px;gap:10px}
  .touch #dialog .txt{font-size:14.5px}.touch #dialog canvas{width:64px;height:64px}
  .touch .win{max-height:calc(100vh - 24px);touch-action:pan-y;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
  .touch .win h2{font-size:19px}
  .touch #toast{top:calc(56px + env(safe-area-inset-top,0px))}
  .touch #banner{top:16%}
  #rotate{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;background:rgba(6,8,12,.94);text-align:center;color:var(--parch)}
  #rotate svg{width:64px;height:64px;stroke:var(--brass);fill:none;stroke-width:1.6}
  #rotate b{font-family:var(--display);font-size:24px;font-weight:400}
  #rotate p{margin:0;color:#cfc8b6;max-width:30ch;line-height:1.5}
  #iosHint{font-size:12.5px;color:#cfc8b6;max-width:46ch;line-height:1.5;border:1px solid var(--edge);border-radius:6px;padding:8px 12px;background:rgba(17,21,29,.7)}
  #touchKeys{font-size:12px;color:var(--mute)}
  @media (max-height:520px){
    .touch #title{gap:10px;overflow:auto;justify-content:flex-start;padding-block:max(10px,env(safe-area-inset-top,0px))}
    .touch #title > :first-child{margin-top:auto}
    .touch #title > :last-child{margin-bottom:auto}
    .touch #title p{display:none}
    .touch #title .heroes{gap:16px}
    .touch #title .heroes canvas{width:60px!important;height:90px!important}
    .touch #title h1{font-size:46px}
    .touch #title h1 em{margin-top:6px}
    .touch #title .btn{padding:9px 14px;font-size:13px}
  }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const hud = $('hud');
  const svg = p => `<svg viewBox="0 0 24 24">${p}</svg>`;
  // utility column
  const util = document.createElement('div'); util.id = 'tUtil';
  util.innerHTML = `<button class="tbtn" id="tSwap" aria-label="Swap hero">${svg('<path d="M4 8h13l-3-3M20 16H7l3 3"/>')}</button>
    <button class="tbtn" id="tTarget" aria-label="Next target">${svg('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>')}</button>
    <button class="tbtn" id="tLantern" aria-label="Lanternburst"><i></i>${svg('<path d="M9 3h6M10 3v2M14 3v2M7 7h10l-1 11H8L7 7zM9 21h6"/><path d="M12 10c1.5 1.6 1.5 3.6 0 5c-1.5-1.4-1.5-3.4 0-5z"/>')}</button>`;
  hud.appendChild(util);
  const use = document.createElement('button'); use.id = 'tUse'; use.hidden = true; use.textContent = 'Talk'; hud.appendChild(use);
  const hint = document.createElement('div'); hint.id = 'joyHint'; hint.textContent = 'Move'; hud.appendChild(hint);
  const base = document.createElement('div'); base.id = 'joyBase'; base.hidden = true; base.innerHTML = '<div id="joyKnob"></div>'; document.body.appendChild(base);
  const knob = base.firstChild;
  // more menu in the minimap panel
  const more = document.createElement('button'); more.className = 'btn'; more.id = 'bMore'; more.textContent = '⋯'; more.setAttribute('aria-label', 'More');
  document.querySelector('.mmbtns').appendChild(more);
  $('bHelp').hidden = true;
  const pop = document.createElement('div'); pop.id = 'tMore'; pop.className = 'win'; pop.style.cssText = 'left:auto;transform:none;'; pop.hidden = true;
  pop.innerHTML = `<button class="btn" id="mSound">Sound: on</button><button class="btn" id="mSave">Save journey</button><button class="btn" id="mHelp">How to play</button>${alt ? `<button class="btn" id="mGfx">${alt.label}</button>` : ''}`;
  document.body.appendChild(pop);

  function audioResume() { try { if (SND.ctx && SND.ctx.state !== 'running') SND.ctx.resume(); } catch (e) { } }
  window.addEventListener('pointerdown', () => { audioResume(); }, true);
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());

  const tap = (el, fn) => el.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); SND.init(); fn(); });
  tap($('tSwap'), () => swapHero());
  tap($('tTarget'), () => { cycleTarget(); if (G.target) G.autoAtk = true; sfx('ui'); });
  tap($('tLantern'), () => lanternburst());
  tap(use, () => interact());
  more.onclick = ev => { ev.stopPropagation(); pop.hidden = !pop.hidden; $('mSound').textContent = 'Sound: ' + (SND.on ? 'on' : 'off'); };
  $('mSound').onclick = () => { SND.init(); const on = SND.toggle(); $('mSound').textContent = 'Sound: ' + (on ? 'on' : 'off'); $('bSound').textContent = 'Sound: ' + (on ? 'on' : 'off'); };
  $('mSave').onclick = () => { saveGame(false); pop.hidden = true; };
  $('mHelp').onclick = () => { pop.hidden = true; $('help').hidden = false; };
  if (alt) $('mGfx').onclick = switchGfx;
  document.addEventListener('pointerdown', ev => { if (!pop.hidden && !pop.contains(ev.target) && ev.target !== more) pop.hidden = true; });

  // joystick
  window.JOY = { active: false, id: null, ox: 0, oy: 0, vx: 0, vy: 0, mag: 0 };
  const JR = 56;
  window.joyStart = function (ev) {
    if (JOY.active || ev.pointerType === 'mouse') return false;
    Object.assign(JOY, { active: true, id: ev.pointerId, ox: ev.clientX, oy: ev.clientY, vx: 0, vy: 0, mag: 0 });
    base.hidden = false; base.style.left = ev.clientX + 'px'; base.style.top = ev.clientY + 'px'; knob.style.transform = 'translate(0,0)';
    hint.hidden = true; G.moveTo = null;
    return true;
  };
  window.addEventListener('pointermove', ev => {
    if (!JOY.active || ev.pointerId !== JOY.id) return;
    let dx = ev.clientX - JOY.ox, dy = ev.clientY - JOY.oy; const d = Math.hypot(dx, dy);
    if (d > JR) { JOY.ox += dx * (1 - JR / d); JOY.oy += dy * (1 - JR / d); dx = ev.clientX - JOY.ox; dy = ev.clientY - JOY.oy; base.style.left = JOY.ox + 'px'; base.style.top = JOY.oy + 'px'; }
    JOY.vx = dx / JR; JOY.vy = dy / JR; JOY.mag = Math.min(1, Math.hypot(dx, dy) / JR);
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  }, { passive: true });
  const joyEnd = ev => { if (JOY.active && ev.pointerId === JOY.id) { JOY.active = false; JOY.vx = JOY.vy = JOY.mag = 0; base.hidden = true; } };
  window.addEventListener('pointerup', joyEnd); window.addEventListener('pointercancel', joyEnd);

  // action bar: tap to cast, hold to read
  const _bab = buildActionBar;
  buildActionBar = function () {
    _bab();
    const old = util.querySelector('.slot'); if (old) old.remove();
    for (const s of slotEls) {
      const el = s.el; el.dataset.pos = s.pot ? 'pot' : String(s.i);
      if (s.pot) util.appendChild(el);
      let timer = null, tipped = false, pid = null;
      el.addEventListener('pointerdown', ev => {
        ev.preventDefault(); ev.stopPropagation(); SND.init();
        pid = ev.pointerId; tipped = false; el.classList.add('press');
        clearTimeout(timer);
        timer = setTimeout(() => { tipped = true; if (el._tipFn) { const r = el.getBoundingClientRect(); showTip(el._tipFn(), { clientX: r.left - 20, clientY: r.top - 4 }); } }, 420);
      });
      const end = (ev, cancel) => {
        if (ev.pointerId !== pid) return;
        clearTimeout(timer); el.classList.remove('press'); pid = null;
        if (tipped) { hideTip(); return; }
        if (cancel) return;
        if (s.pot) drinkPotion(ctrlHero()); else useAbility(ctrlHero(), s.i);
      };
      el.addEventListener('pointerup', ev => end(ev, false));
      el.addEventListener('pointercancel', ev => end(ev, true));
    }
  };

  // HUD extras
  const _uh = updateHUD;
  let lastUse = '';
  updateHUD = function (dt) {
    _uh(dt);
    const gp = Math.floor(G.gauge), lb = $('tLantern');
    lb.querySelector('i').style.height = gp + '%'; lb.classList.toggle('full', gp >= 100);
    let label = '';
    if (!G.dialog && G.started) {
      const n = nearestNpc();
      if (n) label = NPCS[n.id].vendor ? 'Talk · Trade' : 'Talk';
      else { const b = nearestBeacon(); if (b && !G.beacons[b.id] && G.bossDead[{ b1: 'gnarl', b2: 'witch', b3: 'king' }[b.id]]) label = 'Relight'; }
    }
    if (label !== lastUse) { lastUse = label; use.hidden = !label; use.textContent = label; }
    $('tSwap').style.opacity = otherHero().dead ? .35 : 1;
  };

  // one phone, one player
  const _sc = setCoop;
  setCoop = function () { _sc(false); };

  // tap-twice for items in bags / vendor
  let armed = null;
  document.addEventListener('click', ev => {
    const el = ev.target.closest && ev.target.closest('[data-bag],[data-eq],[data-buy]');
    if (!el || !el._tipFn) { if (armed) { armed = null; hideTip(); } return; }
    if (armed !== el) {
      armed = el; const r = el.getBoundingClientRect();
      showTip(el._tipFn() + '<div class="s" style="margin-top:6px;color:#e0a64e">Tap again to confirm</div>', { clientX: r.left, clientY: r.top - 4 });
      ev.stopPropagation(); ev.preventDefault(); return;
    }
    armed = null; hideTip();
  }, true);

  // help text for touch
  const help = $('help');
  help.innerHTML = `<h2>How to play <button class="x" data-close="help" aria-label="Close">×</button></h2>
  <table>
    <tr><td>Move</td><td>Put your left thumb anywhere on the left half of the screen and slide.</td></tr>
    <tr><td>Target</td><td>Tap an enemy to target it. Orhun walks over and attacks. Tap open ground on the right half to walk there.</td></tr>
    <tr><td>Abilities</td><td>The six round buttons on the right. The corner one is your main attack. Hold any button to read what it does.</td></tr>
    <tr><td>Side buttons</td><td>Swap hero · Next target · Lanternburst (when the jade fills) · Healing Draught.</td></tr>
    <tr><td>Talk / Relight</td><td>A gold button appears when you stand near someone or a beacon. You can also tap people directly.</td></tr>
    <tr><td>Menus</td><td>Bags, Quests and ⋯ (sound, save, help) sit under the map. In bags, tap an item once to read it, tap again to equip or sell.</td></tr>
    <tr><td>Roles</td><td><b>Orhun</b> holds enemies with Sunder and Challenging Roar and hits hard. <b>Handan</b> casts from range, roots, and heals with Mending Light and Jade Ward. The hero you are not playing fights on their own.</td></tr>
    <tr><td>Red circles</td><td>Boss attacks wind up as red circles on the ground. Step out before they fill.</td></tr>
  </table>`;

  // title screen
  const keysEl = document.querySelector('#title .keys');
  const tk = document.createElement('div'); tk.id = 'touchKeys'; tk.textContent = 'Left thumb moves · Tap enemies · Right buttons cast · Hold a button to read it';
  keysEl.after(tk);
  const standalone = navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || (window.matchMedia && matchMedia('(display-mode: fullscreen)').matches);
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS && !standalone && alt) {
    const ih = document.createElement('div'); ih.id = 'iosHint';
    ih.innerHTML = 'For full screen: tap <b>Share</b> in Safari, then <b>Add to Home Screen</b>. Open Jadeborn from its icon.';
    tk.after(ih);
  }

  // portrait warning
  const rot = document.createElement('div'); rot.id = 'rotate'; rot.hidden = true;
  rot.innerHTML = `<svg viewBox="0 0 64 64"><rect x="20" y="8" width="24" height="44" rx="4"/><path d="M50 30a20 20 0 0 1-8 18M46 48l-4 0 0-4"/></svg><b>Turn your phone sideways</b><p>Jadeborn plays best in landscape, with the stick on the left and your abilities on the right.</p><button class="btn" id="rotOk">Play in portrait anyway</button>`;
  document.body.appendChild(rot);
  let rotOk = false;
  $('rotOk').onclick = () => { rotOk = true; rot.hidden = true; };
  const checkRot = () => { rot.hidden = rotOk || !(window.innerHeight > window.innerWidth); };
  window.addEventListener('resize', checkRot); window.addEventListener('orientationchange', () => setTimeout(checkRot, 200)); checkRot();

  // keep the screen awake while playing
  let lock = null;
  const wake = async () => { try { if (navigator.wakeLock && !lock && document.visibilityState === 'visible') { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) { lock = null; } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && G.started) wake(); else if (document.visibilityState === 'hidden' && G.started) saveGame(true); });
  window.addEventListener('pointerdown', () => { if (G.started) wake(); }, { passive: true });
})();

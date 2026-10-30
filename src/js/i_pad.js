/* ===================== GAMEPADS (1–2 controllers) ===================== */
(function () {
  const prev = [[], []], DZ = .22;
  const down = (pad, i) => { const b = pad.buttons[i]; return !!(b && (b.pressed || b.value > .5)); };
  const heroFor = pi => G.coop ? (pi === 0 ? P.orhun : P.handan) : ctrlHero();
  function act(pi, edge) {
    if (!G.started) { if (edge(0) || edge(9)) { SND.init(); const c = $('bContinue'); (c.hidden ? $('bNew') : c).click(); } return; }
    if (!$('talent').hidden) return;
    if (G.dialog) {
      const l = G.dialog.lines[G.dialog.i];
      if (edge(0) || edge(9)) { if (l.actions) { const b = document.querySelector('#dlgActs .btn.primary') || document.querySelector('#dlgActs .btn'); if (b) b.click(); } else advanceDialog(); }
      else if (edge(1) && l.actions) { const bs = document.querySelectorAll('#dlgActs .btn'); if (bs.length) bs[bs.length - 1].click(); }
      return;
    }
    if (!$('ending').hidden) { if (edge(0) && $('endStay')) $('endStay').click(); return; }
    if (edge(1) && anyWindowOpen()) { closeWindows(); return; }
    const h = heroFor(pi);
    for (let i = 0; i < 6; i++) if (edge(i)) { SND.init(); useAbility(h, i); }
    if (edge(6)) drinkPotion(h);
    if (edge(7)) dodge(h, PADV[pi][0], PADV[pi][1]);
    if (edge(8) && !G.coop) swapHero();
    if (edge(9) || edge(12)) interact(h);
    if (edge(13)) lanternburst(h);
    if (edge(14) || edge(15)) { cycleTarget(h); if (h === ctrlHero() && G.target) G.autoAtk = true; }
  }
  function poll() {
    PADV[0] = [0, 0]; PADV[1] = [0, 0];
    if (!navigator.getGamepads) return;
    const list = Array.from(navigator.getGamepads()).filter(p => p && p.connected).slice(0, 2);
    list.forEach((pad, pi) => {
      const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
      PADV[pi] = [Math.abs(ax) > DZ ? ax : 0, Math.abs(ay) > DZ ? ay : 0];
      const now = pad.buttons.map((b, i) => down(pad, i)), was = prev[pi]; prev[pi] = now;
      act(pi, i => now[i] && !was[i]);
    });
  }
  const _upd = update;
  update = function (dt) { try { poll(); } catch (e) { console.error(e); } _upd(dt); };
  window.addEventListener('gamepadconnected', e => { try { toast(`Controller ${e.gamepad.index + 1} connected`); } catch (x) { } });
})();

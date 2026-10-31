// Dumps the English content (quests, banter, NPC talk, ...) to en_content.json. Needs a local server on :8765 serving the repo root.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.addInitScript(() => localStorage.setItem('jadeborn_lang', 'en')); await p.goto('http://localhost:8765/pixel.html'); await p.waitForTimeout(1200);
const d = await p.evaluate(() => {
  const sk = s => String(s).replace(/\d+(?:[.,]\d+)?/g, '#');
  const o = {};
  o.quests = QUESTS.map(q => ({ id: q.id, name: q.name, text: q.text, done: q.done, labels: q.obj.map(x => x.label), zone: q.zone }));
  o.banter = BANTER; o.talk = NPC_TALK;
  o.npcTitles = Object.fromEntries(Object.entries(NPCS).map(([k, v]) => [k, v.title]));
  o.foes = Object.fromEntries(Object.entries(FOES).map(([k, v]) => [k, v.name]));
  resetState(); G.level = 30; recalcStats();
  o.skills = Object.fromEntries([...SKILL_POOL.orhun, ...SKILL_POOL.handan].map(a => { let d = ''; try { d = a.desc(P[SKILL_POOL.orhun.includes(a) ? 'orhun' : 'handan']); } catch (e) { d = 'ERR ' + e.message; } return [a.id, [a.name, sk(d), a.school || (SKILL_META[a.id] || {}).school]]; }));
  o.boons = BOONS.map(b => [b.id, b.n, sk(b.d(5)), b.who]);
  o.talents = Object.fromEntries(Object.entries(TALENTS).map(([lv, t]) => [lv, { orhun: t.orhun.map(x => [x[0], x[1], x[2]]), handan: t.handan.map(x => [x[0], x[1], x[2]]) }]));
  o.items = ITEM_NAMES; o.wprof = Object.fromEntries(Object.entries(WPROF).map(([k, v]) => [k, [v.name, v.desc]]));
  o.svw = Object.fromEntries(Object.entries(SVW).map(([k, v]) => [k, [v.name, v.evoName || '', [...new Set([1, 2, 3, 4, 5, 6, 7].map(L => sk(v.d(L))))]]]));
  o.svp = Object.fromEntries(Object.entries(SVP).map(([k, v]) => [k, [v.name, sk(v.d(2))]]));
  o.forge = SV_FORGE.map(f => [f.id, f.name, sk(f.d(2)), sk(f.d(1))]);
  o.stages = SV_STAGES.map(s => [s.name, s.blurb]);
  o.misc = { rarity: RARITY, hero: Object.fromEntries(Object.entries(HERO).map(([k, v]) => [k, v.title])), poses: POSES, spots: Object.fromEntries(Object.entries(SPOT_INFO).map(([k, v]) => [k, v.label])), menu: MENU_ITEMS.map(m => m.label), acts: ACT_DEFS.map(a => [a.name, a.sub, a.beaconName]) };
  return o; });
require('fs').writeFileSync(__dirname + '/en_content.json', JSON.stringify(d, null, 1)); console.log(require('fs').statSync(__dirname + '/en_content.json').size); await b.close(); })();

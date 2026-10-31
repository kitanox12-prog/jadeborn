# Jadeborn: The Ember Road

A browser action RPG starring Orhun (Duelist, off-tank) and Handan (Loreweaver, ranged damage + heals), with Lumen the spirit fox. Plays on desktop (keyboard + mouse, optional same-keyboard 2-player) and on phones as an installable web app (touch controls). Hosted on GitHub Pages from this repo's root.

## Build and deploy
- Edit only files under `src/`. Then run `./build.sh` — it writes `index.html` (3D), `pixel.html` (pixel art), `sw.js` (new cache version every build), manifest and icons to the repo root.
- Commit both `src/` and the built files, push to `main`. GitHub Pages serves the root; phones pick up the new build next time the app is opened (service worker is network-first for pages).
- No npm install needed. Three.js r158 is vendored in `src/vendor/` and inlined into `index.html`.

## Code layout (`src/js`, concatenated in this order into one script)
- `a_core.js` — helpers, canvas, input, synthesized audio (`SND`), `TOUCH_UI` flag.
- `b_data.js` — all content: hero stats, abilities (`ABIL`), talents, enemies (`FOES`), NPCs, quests, dialogue/banter, item names. Most content additions happen here.
- `c_world.js` — tile maps per zone (`buildTown`, `buildBrightfield`, `buildMurkfen`, `buildKeep`, `buildFrostspire`), waystones, per-zone gates (`gateOpenFor`), collision, pathfinding.
- `d_gfx.js` — pixel-art renderer (tiles, sprites, icons). Overridden in 3D by `g_three.js`.
- `e_game.js` — simulation: combat, threat, AI for the off-hero, fox and enemies, boss mechanics, XP/loot/quests, zone travel, co-op movement.
- `e2_qol.js` — waystone travel, riding Lumen (mount), auto-cast, hearts on Handan→Orhun heals. Wraps `update`, `heal`, `dealDamage`, `useAbility`, `dodge`, `heroAI`, `foxTick`.
- `e3_progress.js` — skill pools (`SKILL_POOL`, 12 per hero, schools), per-skill AI (`SKILL_META`, used by `aiCast` for the companion and auto-cast), loadouts (`G.loadout` → `ABIL` via `syncLoadout`), per-level boons (`BOONS`, `G.boons`, read with `B(id)`), weapon types in loot, Skills/Boons tabs.
- `f_ui.js` — 2D render loop, HUD, dialogue, bags/vendor, quest log, talents, save/load (`localStorage` key `jadeborn_ember_road_v1`, shared by both builds), keyboard/mouse input, boot helpers.
- `e4_acts.js` — Acts III–V (loaded after f_ui): Emberwood (Elder Brannoc, boss Morrowthorn, beacon b5), Glasswater Vale (Captain Ysolde, boss Thalassar, b6), the Starless Crown (Seer Maelis, final boss Nyxara, b7, `showEnding3`). Adds foes/NPCs/quests q17–q34/banter, zone builders, styles `autumn`/`ruins`/`void` (PAL, TCOL, AMB), per-zone gates in `G.zgates` (saved), boss ticks via a `bossTick` wrapper, treant art for 2D and 3D.
- `e5_polish.js` — foe respawns (`respawnTick`, kill quests never need a re-entry), unlimited bags + best-upgrade glow (`upgradeFor`, `itemScore`), per-hero trinkets, attack/support skill colours (`SUPPORT_SKILLS`), visible Lumen bites, passive lantern gain.
- `e6_leisure.js` — wardrobe (`WARD`, localStorage `jadeborn_wardrobe`, applied via `heroLook`/`look3D`/`makeHumanoid` wrappers), couple poses (`G.pose`), photo mode (`photoOn`, `takePhoto`), the Starlit Glade zone (south of town) with interaction spots.
- `e7_acts2.js` — Acts VI–X from data (`ACT_DEFS`, template `actZone`), bosses on a data-driven kit (`BOSS_KITS`, `kitTick`), beacons b8–b12, true ending `showEnding4`; styles desert/jungle/volcanic/sky/crimson.
- `g_three.js` — 3D build only: Three.js scene, procedural low-poly models for heroes/NPCs/foes, lighting, effects, overlay text; redefines `render`, `renderZone`, `drawPortrait`, `hitFoe`, `screenToWorld`.
- `s_survivor.js` — Lantern Dreams (survivor / bullet-hell mode, `G.mode = 'survivor'`): 4 stages (`SV_STAGES`), auto-firing skills (`SVW`, 6 per hero, evolutions at level 7 with a matching relic), relics (`SVP`), XP gems, elites/chests, boss at 15:00, Lantern Forge meta upgrades (localStorage `jadeborn_survivor_meta`). Endless arena = 40x40 wrapping pattern tiled 3x3 with `svRecenter`. Rendering: cached 2D foe sprites + tiled `drawImage`; 3D instanced horde (`svRender3D`, foes flagged `svHorde`). Wraps `update`, `kill`, `heroes`, `recalcStats`, `onKeyPress`, `useAbility` and friends; never saves the story.
- `h_touch.js` — phone layer (active only on coarse pointers): joystick, round ability buttons (tap to cast, hold for tooltip), Talk/Relight button, rotate hint, tap-twice for items.
- `h2_menu.js` — the ☰ game menu (`addMenuItem` registry used by every feature) and the compact phone HUD.
- `i_pad.js` — Gamepad API (1–2 controllers), wraps `update`.
- `z_boot.js` — starts the game.
- Simulation units are pixels (32 px = 1 tile); 3D maps x/32 → X, y/32 → Z.

## Story so far
- Chapter I (q1–q10): Brightfield → Murkfen → Hollow Keep, beacons b1–b3, bosses Gnarlback, Mirethal, the Hollow King.
- Chapter II (q11–q16): north road from Lanternhold → Frostspire Pass (Warden Kael), beacon b4 (Forge of the First Flame), boss Vyrmhal the Cold Crown.
- Act III (q17–q22, levels ~17–22): west road from Lanternhold → Emberwood. Act IV (q23–q28, ~23–27): Glasswater Vale. Act V (q29–q34, ~28–32): the Starless Crown, final ending. XP_NEED grows 9% per level after 14.
- Acts VI–X (q35–q64, levels ~33–50): Brightfield south road → Sunscar Dunes → Thornveil → Cindermaw Caldera → Skyreach Spires → the Dawnless Gate; final boss Umbrath, first sunrise (world brighter after b12).
- Render hooks for modules: `EXTRA_DRAW`, `EXTRA_TOP` (2D), `EXTRA_3D`, `EXTRA_OVERLAY` (3D), declared in a_core.
- Survivor balance knobs: `svHpCurve`/`svAtkCurve` (stage `mult` steepens them), `svNeed` (run XP), spawn cap in `svSpawnTick`. Test with a headless bot that calls `update(1/30)` in a loop (see the session's sv1.js).
- Level cap 50 (`XP_NEED`); talents at 3–15, a boon choice every level. Weapon types: Orhun sword/greataxe/spear/twinblades, Handan staff/orb/wand/tome (`WPROF` in e_game.js).

## Conventions
- In-game text is English. NPC/pet names are generic fantasy names (not Turkish).
- Keep the game a single self-contained page per build; no external runtime requests except Google Fonts (with fallbacks).
- After changes, sanity-check both builds load without console errors (e.g. headless Chromium; use SwiftShader flags for the 3D build).

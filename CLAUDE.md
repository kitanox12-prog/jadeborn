# Jadeborn: The Ember Road

A browser action RPG starring Orhun (Duelist, off-tank) and Handan (Loreweaver, ranged damage + heals), with Lumen the spirit fox. Plays on desktop (keyboard + mouse, optional same-keyboard 2-player) and on phones as an installable web app (touch controls). Hosted on GitHub Pages from this repo's root.

## Build and deploy
- Edit only files under `src/`. Then run `./build.sh` — it writes `index.html` (3D), `pixel.html` (pixel art), `sw.js` (new cache version every build), manifest and icons to the repo root.
- Commit both `src/` and the built files, push to `main`. GitHub Pages serves the root; phones pick up the new build next time the app is opened (service worker is network-first for pages).
- No npm install needed. Three.js r158 is vendored in `src/vendor/` and inlined into `index.html`.

## Code layout (`src/js`, concatenated in this order into one script)
- `a_core.js` — helpers, canvas, input, synthesized audio (`SND`), `TOUCH_UI` flag.
- `b_data.js` — all content: hero stats, abilities (`ABIL`), talents, enemies (`FOES`), NPCs, quests, dialogue/banter, item names. Most content additions happen here.
- `c_world.js` — tile maps per zone (`buildTown`, `buildBrightfield`, `buildMurkfen`, `buildKeep`), collision, pathfinding.
- `d_gfx.js` — pixel-art renderer (tiles, sprites, icons). Overridden in 3D by `g_three.js`.
- `e_game.js` — simulation: combat, threat, AI for the off-hero, fox and enemies, boss mechanics, XP/loot/quests, zone travel, co-op movement.
- `f_ui.js` — 2D render loop, HUD, dialogue, bags/vendor, quest log, talents, save/load (`localStorage` key `jadeborn_ember_road_v1`, shared by both builds), keyboard/mouse input, boot helpers.
- `g_three.js` — 3D build only: Three.js scene, procedural low-poly models for heroes/NPCs/foes, lighting, effects, overlay text; redefines `render`, `renderZone`, `drawPortrait`, `hitFoe`, `screenToWorld`.
- `h_touch.js` — phone layer (active only on coarse pointers): joystick, round ability buttons (tap to cast, hold for tooltip), Talk/Relight button, rotate hint, tap-twice for items.
- `z_boot.js` — starts the game.
- Simulation units are pixels (32 px = 1 tile); 3D maps x/32 → X, y/32 → Z.

## Conventions
- In-game text is English. NPC/pet names are generic fantasy names (not Turkish).
- Keep the game a single self-contained page per build; no external runtime requests except Google Fonts (with fallbacks).
- After changes, sanity-check both builds load without console errors (e.g. headless Chromium; use SwiftShader flags for the 3D build).

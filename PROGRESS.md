# Progress — Coconut Coast

## Spec (approved)

**Done**
- `SPEC.md` written: game overview, controls and movement feel, Sun Meter, worlds, enemies, level format, screens, art and audio direction, architecture, 12 build phases, tests and working rules.

- Draft 2, at the user's request: a 16-bit look instead of 8-bit. The resolution is 480 × 270; the sprites are bigger and hand-shaded (Pip is 24 × 32), with per-sprite palettes, colour cycling, see-through water and light, and 4 to 5 parallax layers. The synth has 8 voices with echo. The art pass is split into two phases (5 and 5b), with a sprite viewer for checking the art.

- Spec approved with the defaults in section 12.
- Art source decided: the user will try an AI image generator using `ART_PROMPTS.md`; art drawn in code is the fallback for each asset. Gameplay phases use plain boxes, so art never blocks them.

**Waiting for**
- A GitHub repository: this session can't create one, so the user creates an empty private repo `coconut-coast`, then it gets attached and pushed.

## Phase 0 – Project setup

**Done**
- Vite + TypeScript project, a fixed 60 Hz loop, and a 480 × 270 screen. Scaling uses whole numbers on big screens (×4 at 1080p) and fills the screen on phones.
- Keyboard and gamepad input mapped to actions (move, jump, run, pause), and a debug overlay (`?debug=1` or the backtick key).
- **Art switch:**
  - Every asset has a code-drawn version (the default).
  - An external PNG in `public/art/` with the asset's name and exact size replaces it when the art option is EXTERNAL (T key or `?art=external`, saved).
  - Missing, broken or wrong-size files fall back to code, asset by asset, and magenta turns see-through.
  - A small Vite plugin lists the files in `public/art`, so the game never asks for files that aren't there.
- Test room: a stand-in box with a face (24 × 32) that walks (100 px/s) and runs (180 px/s, hold X or Shift).
- **Tests:** 12 unit tests (loop, input, scaling, art) and 1 browser test (moves the box, switches art, no console errors). Checked by hand with a test PNG: the external sprite replaces the box, with its magenta background removed.
- CI workflow for the tests (it runs once the GitHub repo exists).

**Known issues / notes**
- `@playwright/test` is pinned to 1.63 to match the browser installed in this environment.
- Art switching is on the T key until the Options screen exists (Phase 8).

**Next:** Phase 1, movement and jumping.

## Phase 1 – Movement and jumping

**Done**
- **Movement logic** (`src/actors/pip-physics.ts`), with no drawing:
  - Walking (100 px/s) and running (180 px/s with Run held) with speed-up and slow-down.
  - A skid when you push the other way at speed.
  - Less control in the air.
- **Jumping:** higher the longer you hold (a tap is about 1 tile, a hold 4, a hold at full run 5). Falling is heavier than rising, and Pip bumps into walls and ceilings.
- **Forgiving timing:** a jump still works for 0.08 s after leaving an edge, and a press up to 0.1 s before landing is remembered.
- **Movement lab:** a floor with a 4-tile gap (fall in and you start again), a 2-tile block, a ledge 3.5 tiles up, height marks, a dotted trail of the last jump, and its height in tiles.
- **Stand-in sprite:** 6 frames (stand, step, rise stretched, fall, skid leaning, land squashed). `hero.png` for external art is now 144 × 32.
- **Tests:** 23 unit tests (11 new: speeds, skid, walls, tap and hold heights, run bonus, fall speed, ceilings, coyote time, jump buffer) and the browser test now also jumps.

- **Fix after play-testing:** the highest jump was 4.82 tiles instead of 5 (and 3.83 instead of 4 standing), because the game moves in 60 steps a second and the take-off speeds came from the smooth formula. `tuning.ts` now sets the heights directly (`JUMP_HEIGHT` 64 px, `RUN_JUMP_HEIGHT` 80 px), the game works out the exact take-off speed, and the tests check the heights to within 1 px. Full height needs full running speed, which takes about 0.5 s (60 px) of running.

**Tuning most likely to need a change** (`PIP` in `tuning.ts`):
- `JUMP_HEIGHT`, `RUN_JUMP_HEIGHT` and `GRAVITY`: how high and how floaty (higher gravity with the same height = a quicker, snappier jump).
- `FALL_GRAVITY_SCALE`: how quickly Pip comes down.
- `DECEL`: how suddenly Pip stops.
- `JUMP_CUT`: how small a tap-jump is.

**Next:** Phase 2, tiles and camera.

## Phase 2 – Tiles and camera

**Done**
- **Levels as text maps** (`src/world/levels/`): `#` ground, `=` one-way platform, `P` start, `F` end flag. Each map is checked when it loads (row widths, one start, no unknown letters), with clear error messages.
- **Tile collision:** walls, floors and ceilings. The level edges act as walls, and below the level is open, so gaps are pits.
- **One-way platforms:** jump up through them and land on top. Down + Jump drops through; on solid ground, Down + Jump is a normal jump.
- **Camera:**
  - A 64 px dead zone in the middle, and it looks 80 px ahead while running.
  - Up and down, it stays on the last ground Pip stood on, so jumps don't bob the screen; it follows a very high jump, and a fall straight away.
  - It eases into place and stops at the level edges.
- **Test level `0-1`** (128 × 20 tiles):
  - A start run-up and three pits.
  - A block, a step, and a plateau with a floating block.
  - Stacked one-way platforms up to a high route over a wide pit.
  - A low one-way step, a low ceiling, and the end flag.
- Falling in a pit puts Pip back at the start (a fall counter shows until lives exist). The height marks stay at the start.
- **Tests:** 36 unit tests (12 new: reading levels and their errors, edges and pits, walls, floors and ceilings, no slipping through floors at top speed, one-way platforms and dropping through, and the camera's start, edges, dead zone, look-ahead and no bobbing). The browser test now runs right and checks the camera scrolls.

**Tuning most likely to need a change** (`CAMERA` in `tuning.ts`):
- `DEAD_ZONE_W`: how far Pip moves before the camera follows.
- `LOOK_AHEAD`: how far ahead it looks when running.
- `EASE`: how snappy it is.
- `FEET_LINE`: how low on the screen Pip stands.

**Notes**
- No slopes in v1 (decided at the Phase 2 plan; they can be added later if a world needs them).
- The start area was widened by 8 tiles so the camera has room to start moving before the first pit.

**Next:** Phase 3, enemies and stomping.

## Phase 3 – Enemies and stomping

**Done**
- **Three enemies** (code-drawn placeholders, 4 frames each, matching the sizes in `ART_PROMPTS.md`):
  - **Crab** (`c`): walks and turns at walls and ledges; can be stomped.
  - **Urchin** (`u`): sits still with its spikes pulsing; landing on it hurts.
  - **Gull** (`g`): glides, swoops in a curve towards Pip when close, then climbs back; can be stomped.
- **Stomp or hurt:**
  - Landing on top (with a 6 px grace) squashes an enemy. Pip bounces up, higher with Jump held so stomps can chain, and landing on two at once gets both.
  - Any other touch is a hit.
- **Death:** Pip pops up and spins off the screen, then comes back at the last checkpoint with every enemy reset. Falling in a pit works the same way.
- **Checkpoints** (`C`): the flag goes up when you pass it.
- **Spikes** (`^`): hurt from any side, with fair 2 px edges.
- **Waking up:** enemies only start moving within 64 px of the screen.
- **Debug:** I (with the overlay open) makes Pip invincible.
- **Test level:** five crabs, an urchin, a gull over the wide pit, a checkpoint halfway, and spikes under the low ceiling.
- **Tests:** 49 unit tests (13 new: crab walls, ledges and falling; the gull's swoop; stomp versus hurt with grace; the urchin; bounce height; spikes; death and respawn at the checkpoint with enemies reset; walking into a crab versus stomping it; waking near the screen). The browser test now also checks that walking into a crab counts a death.

- **Fix after play-testing ("the bird is very fast"):** the gull dived about 11 tiles and back in 1.1 s, peaking near 500 px/s, with no warning. 2.0 s then felt too slow, so `GULL.SWOOP_TIME` is now 1.5 s (peak about 370 px/s, sideways about 160 px/s, just under Pip's run). There's also a new 0.4 s warning (`GULL.WARNING`): it hovers and flaps fast before diving, aiming where Pip was when the warning started, so moving dodges it. A test keeps the dive between about 250 and 420 px/s.

**Tuning most likely to need a change** (`COMBAT`, `CRAB`, `GULL` in `tuning.ts`):
- `STOMP_GRACE`: how forgiving stomps are.
- `STOMP_BOUNCE_HELD`: the chain bounce height.
- `GULL.TRIGGER` and `GULL.SWOOP_TIME`: how early and how fast gulls swoop.
- `CRAB.SPEED`.

**Next:** Phase 4, items and forms (fruit, crates, Mango, Slingshot, Starfruit, Sun Meter, lives, HUD).

## Phase 4 – Items and forms

**Done**
- **Items:**
  - Fruit (`*`), drawn as bananas, berries and pineapples in turn; all score the same.
  - Sun Coins (`$`), three per level.
  - Crates holding a Mango (`M`), a Slingshot (`S`), a Starfruit (`T`) or a burst of 5 fruit (`B`). Hit one from below, or land on it hard as Big Pip; the item pops out on top and the crate turns empty.
  - Cracked stone (`%`): small Pip bumps it, and Big Pip breaks it.
- **Forms:**
  - Small; Big (Mango, 36 px tall); Sling (Slingshot, Big as well).
  - Each hit goes back one step, with 1.5 s of blinking. Pip grows upwards, and waits if there's no room.
  - **Seed pods:** tap Run as Sling Pip. They fly in an arc, skip off the ground twice, pop on walls, at most two at once, and defeat every enemy, even the urchin.
  - **Starfruit:** 8 s when anything Pip touches is defeated; the glow slows when it's about to run out.
- **Sun Meter:** a full meter lasts 45 s and each fruit refills an eighth. When it's empty, Pip loses a life; it blinks when low. `?relaxed=1` turns it off and keeps Pip's form after a lost life (until the Options screen in Phase 8).
- **Lives and score:**
  - 3 lives, and an extra life every 100 fruit.
  - Fruit 10, coins 1000, and stomps 100/200/400/800 in a chain, then an extra life. Seed pod and Starfruit defeats are worth 100.
  - **Game over:** a GAME OVER card, then the level starts again (until the world map in Phase 8).
- **Display:** lives, score, fruit, three coin slots and the Sun Meter along the top. The level name shows for a moment at the start.
- **Art:** an items sheet (8 icons of 16 × 16, `items.png`) and a tall stand-in for Big Pip (24 × 40, `pip-big.png`), both drop-in compatible with `ART_PROMPTS.md`. The Sling form shows a green band.
- **Test level:** fruit trails, all four crates, a cracked-stone pocket hiding a Sun Coin over the plateau (the floating block moved up a tile so Big Pip fits under it), and coins over the high route and on the low ceiling.
- **Code:** the level scene was split into rules (`level-scene.ts`) and drawing (`level-draw.ts`) to keep files small.
- **Tests:** 74 unit tests (24 new: fruit, coins, extra lives, the stomp chain, the Sun Meter and Relaxed mode, forms and blinking, Starfruit, crates and fruit bursts, cracked stone, seed pod arcs, bounces, walls and the two-at-once limit, pods beating the urchin, Starfruit and Big hits in play, game over, Sun running out, and the test level's contents and Big-sized gaps). The browser test now checks fruit, score and lives.

**Fix after play-testing:** holding Shift to run and tapping X to throw did nothing, because both keys are Run and the second press wasn't counted while Shift was held. Now every new key press counts, even when another key for the same action is already down.

**Controls review** (after "there is some clunkiness"):
- **Throw has its own button:** C, or B/X on a pad. Starting a run used to fire a pod. Run is Shift/X, or RB/RT on a pad, and never throws.
- **Pad stick:** Down needs a firm, mostly downward push (`GAMEPAD.STICK_VERTICAL`), so a slightly tilted run no longer turns Jump into a drop-through.
- **Corner nudge:** a head clipping a ceiling corner by 4 px or less slides past it.
- **Bounce bug fixed:** a stomp bounce right after leaving a ledge no longer allows a second jump.
- **Air control:** braking and turning in the air are as strong as on the ground (`AIR_BRAKE` 1.0); speeding up stays at 65%.
- **Jump peak:** half gravity near the top while Jump is held (`APEX_SPEED` 60 px/s, `APEX_GRAVITY_SCALE` 0.5). The heights stay exact, because `jumpSpeedFor` steps the same rule.
- 7 new tests: separate Run and Throw on keyboard and pad, the stick tilt, both kinds of corner, air braking, and the bounce bug.

**Found while building:** seed pods launched from Big Pip's chest flew over low enemies like the urchin, and only came down near the end of their flight. Now they skip along the ground twice (`SEED.BOUNCES`, `SEED.BOUNCE_KEEP`).

**Tuning most likely to need a change:**
- `RUN.SUN_FULL_TIME` and `RUN.SUN_PER_FRUIT`: how much pressure the Sun Meter puts on.
- `SEED.SPEED_X`, `SEED.SPEED_Y` and `SEED.BOUNCES`: the shot's range.
- `FORMS.STARFRUIT_TIME`.
- `ITEMS.BIG_STOMP_SPEED`: how hard Big Pip must land to open a crate.

**Next:** Phase 5, art pass part 1 (palette system, sprite viewer, Pip's real animation set, Palm Beach tiles with auto-tiling).

## Phase 5 – Art pass, part 1

**Done**
- **Palette system** (`gfx/art/palettes.ts`): every sprite has at most 16 colours (checked by a test), and outlines are never pure black. Whole-sheet palette swaps give the white hit flash and the gold/cyan Starfruit shimmer, which replace the old glow box.
- **Pip's real look** (an original design: courier with a satchel, a sun badge, a short orange bandana, a blue vest, khaki shorts and red sneakers):
  - A hand-drawn head with a blink frame, plus shaded body parts placed by a pose table (`gfx/art/code/pip/`).
  - 37 frames: idle 4, bored 4, walk 8, run 8, skid, rise, the turn at the top, fall 2, land, duck, throw 2, hurt, victory 2, death.
  - Three sheets: small (24 × 32), Big (24 × 40, longer body) and Sling (Big with the slingshot in hand).
- **Animation picker** (`actors/pip-anim.ts`): walk and run go by distance, so feet don't slide. Bored starts after 5 s. The jump-peak frame shows below 70 px/s; throw and hurt show briefly; victory at the flag; the death frame during the spin.
- **Ducking:** Down on the ground ducks. Pip can't walk ducked, and the box shrinks (20 px small, 26 px Big, so Big Pip fits under a 2-tile gap). Pip stays ducked under a low ceiling until there's room.
- **Palm Beach tiles:**
  - Auto-tiled ground: grass tops with blades, lit left edges, shaded right edges and undersides, rounded corners, shadowed inner corners, and 4 sand variations.
  - A tile sheet (`tiles-beach.png`, 8 tiles): crate, empty crate, cracked stone, coral spikes, and plank ends.
- **Sprite viewer** (`?sprites=1`): every sheet with an animation preview at 3×, all frames at 2×, the palette, and whether it shows code or external art, plus a ground page demonstrating the auto-tiles.
- `ART_PROMPTS.md` has the exact frame table for Pip's sheets. The old box stand-in is gone.
- **Tests:** 97 unit tests (14 new: palette limits, variants, Pip's sheet sizes and animations, the animation picker, ground auto-tiles, ducking) and 2 browser tests (the level, and the sprite viewer paging through every sheet).

- **Fix after play-testing ("sprites during jump don't look great"):** the rise and top-of-jump frames kept both feet on the ground (they read as a squat or a lunge), and the fall raised both arms straight up (standing, arms up, with an arm over the face). Now the rise pushes off with the front knee up and the back leg trailing, the top of the jump is a tuck with the feet clear of the ground, and the fall reaches down with the arms out and the face visible. The falling bandana streams back instead of sticking up like a horn.

**Known issues / notes**
- Code-assembled art is clean and consistent, but simpler than hand-painted art. Any sheet can be replaced by an external PNG, and the viewer shows both versions.
- Enemies, items, backgrounds and water are still Phase 4 art; they come in Phase 5b.
- Ground tiles are code-only for now. An external tile layout comes with the cleanup tool in Phase 5b.

**Next:** Phase 5b, art pass part 2 (parallax backgrounds, colour cycling, see-through water, particles, enemy sprites, and the cleanup tool for generated images).

## Phase 5b – Art pass, part 2

**Done**
- **Parallax backgrounds** (original scenery, each a sheet that an external PNG can replace):
  - A dithered sky with a sun (fixed).
  - Far islands and sea (10%), with wave glints cycling colour over 3 frames.
  - Drifting clouds (20%).
  - A row of swaying palms and dunes (40%, 3 frames).
  - Sparse foreground palms passing in front of Pip (120%), never over the display.
  - The big layers are only built when first used.
- **Sea water** (`~`): see-through (Pip shows through it), and the surface ripples by colour cycling. Sinking 6 px in costs a life, with a splash. The test level's wide pit is now sea.
- **Particles** (repeatable, capped at 220):
  - Dust when skidding and on hard landings.
  - Splashes, and sparkles on fruit and coins.
  - A burst when anything is collected, and stone chips when Big Pip breaks cracked stone.
  - Enemies show a hit frame, then pop into little stars (replacing the dark squash box).
- **Game feel:**
  - A 0.05 s freeze on each stomp.
  - A small screen shake on big impacts (Big Pip breaking stone or slamming a crate).
  - After-images at full running speed.
  - `?calm=1` turns off the shake and the white flash, and slows the Starfruit shimmer.
- **Enemy art redrawn:** the crab with a 6-frame walk, the urchin with 4 pulse frames, and the gull with a 6-frame flap and a dive pose (shown while swooping). Each has a hit frame, and the sizes are unchanged.
- **Cleanup tool** (`?art-tool=1`):
  - Pick a raw generated image and the target sheet. It finds the background from the border and the figures on it, and picks a pixel size that fits the frame (or yours).
  - Each game pixel takes the most common colour in its cell, so blurred edges drop out. Colours are cut down to 16 or fewer, and the frames are lined up bottom-centred.
  - It shows the result next to the code-drawn version, and saves the PNG with the right file name. Nothing is uploaded.
- `ART_PROMPTS.md`: the enemy frame counts, background sizes, two new background prompts, and how to use the tool.
- **Tests:** 115 unit tests (18 new: particles, parallax wrapping, colour cycling, the new sheets, water, the stomp freeze and pop, shake on and off in calm mode, after-images, and every cleanup step on made-up images) and 3 browser tests (the level, the sprite viewer, and the cleanup tool turning a made-up image into a sheet).

**Known issues / notes**
- The cleanup tool expects separate figures with gaps on a plain background. Figures that touch become one, and very blurry images may need a manual pixel size.
- External tile sheets for the auto-tiled ground aren't supported yet (code-only); the other tiles, sprites and every background layer can be replaced.

**Next:** Phase 6, audio (the synth with echo, sound effects, the Palm Beach tune).

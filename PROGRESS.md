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

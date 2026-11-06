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

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

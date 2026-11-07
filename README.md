# Coconut Coast

A 16-bit-style island platformer for the browser (work in progress). All characters, levels, art and music are original.

- Design and rules: [`SPEC.md`](SPEC.md). Progress per phase: [`PROGRESS.md`](PROGRESS.md).
- Prompts for making sprites with an image generator: [`ART_PROMPTS.md`](ART_PROMPTS.md).
- Art cleanup tool: open the game with `?art-tool=1` to turn an image from an image generator into a game sheet (nothing is uploaded).
- Sprite viewer: open the game with `?sprites=1` to see every sheet, animation and palette (← → sheet, ↑ ↓ animation, T code/external).

## Running it

Install Node.js (LTS), then in this folder:

```bash
npm install
```

```bash
npm run dev
```

Open the address it prints (usually http://localhost:5173). `npm test` runs the unit tests; `npm run test:e2e` runs the browser test.

## Art: drawn in code, or your own sprites

Every sprite is drawn in code by default. To use your own art instead, put a PNG in `public/art/` named after the asset (for example `pip.png`: 37 frames of 24 × 32 side by side, in the order listed in `ART_PROMPTS.md`), at the exact size listed in `src/gfx/art/assets.ts`, then press **T** in the game (or open the game with `?art=external`). Any asset without a fitting file keeps its code-drawn version. Pure magenta (#FF00FF) becomes see-through.

**Controls:** move with the arrows or A/D, jump with Space, Z, W or ↑ (hold for higher), run by holding Shift or X, throw seed pods with C (Sling Pip), duck with Down or S, mute with M. Down + Jump drops through wooden platforms. Sound starts after your first key press or tap (browsers require that). On a gamepad: stick or d-pad to move, A to jump, RB/RT to run, B or X to throw, Start to pause.

Debug overlay: add `?debug=1` to the address, or press the backtick key (then I for invincible). `?relaxed=1` turns off the Sun Meter; `?calm=1` turns off screen shake and flashing.

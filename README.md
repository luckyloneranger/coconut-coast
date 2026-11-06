# Coconut Coast

A 16-bit-style island platformer for the browser (work in progress). All characters, levels, art and music are original.

- Design and rules: [`SPEC.md`](SPEC.md). Progress per phase: [`PROGRESS.md`](PROGRESS.md).
- Prompts for making sprites with an image generator: [`ART_PROMPTS.md`](ART_PROMPTS.md).

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

Every sprite is drawn in code by default. To use your own art instead, put a PNG in `public/art/` named after the asset (for example `hero.png`), at the exact size listed in `src/gfx/art/assets.ts`, then press **T** in the game (or open the game with `?art=external`). Any asset without a fitting file keeps its code-drawn version. Pure magenta (#FF00FF) becomes see-through.

Debug overlay: add `?debug=1` to the address, or press the backtick key.

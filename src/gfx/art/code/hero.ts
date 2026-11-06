// Phase 0 stand-in for Pip: a shaded box with a face, drawn in code.
// Two frames: standing and a little bounce for moving.

import type { PixelMap } from '../pixels';

const PALETTE = {
  o: '#3a1e3a', // outline (deep plum, never pure black)
  b: '#e8743a', // body
  l: '#ffa860', // body light (top left)
  d: '#b04a2a', // body shade (bottom right)
  w: '#fff6e8', // eye white
  k: '#2a1a2a', // pupil
};

const STAND = [
  '........................',
  '........................',
  '...oooooooooooooooooo...',
  '..ollllllllllllllllbbo..',
  '..ollbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbwwwbbwwwbbbdo..',
  '..olbbbbbwkwbbwkwbbbdo..',
  '..olbbbbbwkwbbwkwbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbboooobbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..olbbbbbbbbbbbbbbbbdo..',
  '..obbbbbbbbbbbbbbbbbdo..',
  '..oddddddddddddddddddo..',
  '...oooooooooooooooooo...',
  '.....ooo........ooo.....',
  '.....ooo........ooo.....',
  '........................',
];

/** The step frame: the body one pixel lower, feet apart. */
const STEP = [STAND[0], ...STAND.slice(0, 29), '....ooo..........ooo....', '....ooo..........ooo....'];

export const HERO_FRAMES: readonly PixelMap[] = [
  { rows: STAND, palette: PALETTE },
  { rows: STEP, palette: PALETTE },
];

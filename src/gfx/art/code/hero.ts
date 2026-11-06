// Stand-in for Pip until the art pass: a shaded box with a face, drawn in code.
// The frames are made by one function so squash, stretch and lean stay consistent.

import type { PixelMap } from '../pixels';

const PALETTE = {
  o: '#3a1e3a', // outline (deep plum, never pure black)
  b: '#e8743a', // body
  l: '#ffa860', // body light (top left)
  d: '#b04a2a', // body shade (bottom right)
  w: '#fff6e8', // eye white
  k: '#2a1a2a', // pupil
};

const W = 24;
const FEET_ROWS = 2; // the feet are the bottom two rows

interface BoxShape {
  bodyW: number; // px, including the outline
  bodyH: number; // px, including the outline
  lean: number; // px the top shifts sideways (negative = back)
  feetApart: boolean;
}

/** Draw the box creature into a 24 x H map (32 small, 40 Big), standing on the bottom edge. */
export function boxFrame(shape: BoxShape, H = 32): PixelMap {
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  const bottom = H - FEET_ROWS - 1; // the body's bottom outline row
  const top = bottom - shape.bodyH + 1;
  const left0 = Math.floor((W - shape.bodyW) / 2);
  const set = (x: number, y: number, ch: string) => {
    if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = ch;
  };
  for (let y = top; y <= bottom; y++) {
    const shift = Math.round((shape.lean * (bottom - y)) / Math.max(1, shape.bodyH - 1));
    const left = left0 + shift;
    const right = left + shape.bodyW - 1;
    for (let x = left; x <= right; x++) {
      const edge = y === top || y === bottom || x === left || x === right;
      const corner = (y === top || y === bottom) && (x === left || x === right);
      if (corner) continue; // rounded corners
      let ch = 'b';
      if (edge) ch = 'o';
      else if (y === top + 1 || x === left + 1) ch = 'l';
      else if (y === bottom - 1 || x === right - 1) ch = 'd';
      set(x, y, ch);
    }
    // Face: eyes a quarter of the way down, mouth below them.
    const eyeY = top + Math.max(2, Math.floor(shape.bodyH / 4));
    if (y === eyeY || y === eyeY + 1 || y === eyeY + 2) {
      const mid = left + Math.floor(shape.bodyW / 2);
      for (const ex of [mid - 4, mid + 1]) {
        set(ex, y, 'w');
        set(ex + 1, y, y === eyeY ? 'w' : 'k');
        set(ex + 2, y, 'w');
      }
    }
    if (y === eyeY + 5) {
      const mid = left + Math.floor(shape.bodyW / 2);
      for (let x = mid - 2; x < mid + 2; x++) set(x, y, 'o');
    }
  }
  // Feet.
  const mid = Math.floor(W / 2);
  const feet = shape.feetApart ? [mid - 8, mid + 5] : [mid - 6, mid + 3];
  for (let y = H - FEET_ROWS; y < H; y++) for (const fx of feet) for (let x = fx; x < fx + 3; x++) set(x, y, 'o');
  return { rows: grid.map((r) => r.join('')), palette: PALETTE };
}

/** Big Pip's stand-in: the same six poses, 8 px taller (24 x 40). */
export const HERO_BIG_FRAMES: readonly PixelMap[] = [
  boxFrame({ bodyW: 20, bodyH: 36, lean: 0, feetApart: false }, 40),
  boxFrame({ bodyW: 20, bodyH: 35, lean: 0, feetApart: true }, 40),
  boxFrame({ bodyW: 16, bodyH: 38, lean: 0, feetApart: false }, 40),
  boxFrame({ bodyW: 20, bodyH: 35, lean: 0, feetApart: true }, 40),
  boxFrame({ bodyW: 20, bodyH: 35, lean: -3, feetApart: true }, 40),
  boxFrame({ bodyW: 24, bodyH: 29, lean: 0, feetApart: true }, 40),
];

/** Frame order matches HERO_FRAME in assets.ts. */
export const HERO_FRAMES: readonly PixelMap[] = [
  boxFrame({ bodyW: 20, bodyH: 28, lean: 0, feetApart: false }), // stand
  boxFrame({ bodyW: 20, bodyH: 27, lean: 0, feetApart: true }), // step
  boxFrame({ bodyW: 16, bodyH: 30, lean: 0, feetApart: false }), // rise: stretched tall
  boxFrame({ bodyW: 20, bodyH: 27, lean: 0, feetApart: true }), // fall
  boxFrame({ bodyW: 20, bodyH: 27, lean: -3, feetApart: true }), // skid: leaning back
  boxFrame({ bodyW: 24, bodyH: 22, lean: 0, feetApart: true }), // land: squashed wide
];

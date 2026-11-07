// Palm Beach tiles, drawn in code (original designs). Ground is auto-tiled:
// each ground tile looks at its neighbours and draws the matching grass top,
// edges, corners and inner corners, with a few sand variations.

import type { PixelMap } from '../pixels';
import { PixelGrid } from './draw';

const GROUND_PAL = {
  o: '#4a2c1c', // outline
  a: '#f0d08a', // sand
  A: '#fbe7b0', // sand, lit edge
  b: '#d2a862', // sand, shade
  B: '#a87a44', // sand, deep shade
  p: '#c09a6a', // pebbles
  G: '#9be06a', // grass, lit
  g: '#5cb84a', // grass
  d: '#2e7a3a', // grass, dark blades
};

/** Which neighbours are ground too: N, E, S, W, and the two upper corners (for inner corners). */
export interface GroundNeighbours {
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
  nw: boolean;
  ne: boolean;
}

/** A small, stable number from a tile position (picks the sand variation). */
export function tileHash(tx: number, ty: number): number {
  let h = (tx * 374761393 + ty * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return h >>> 0;
}

/** One ground tile for these neighbours and sand variation (0-3). */
export function groundTile(nb: GroundNeighbours, variant: number): PixelMap {
  const g = new PixelGrid(16, 16);
  g.rect(0, 0, 16, 16, 'a');
  // Sand texture: a few darker grains and pebbles, different per variation.
  for (let i = 0; i < 9; i++) {
    const h = tileHash(variant * 31 + i, i * 7 + variant);
    const x = h % 16;
    const y = (h >>> 8) % 16;
    g.set(x, y, i % 4 === 0 ? 'p' : 'b');
  }
  if (!nb.s) {
    g.rect(0, 14, 16, 1, 'B'); // the underside, in shade
    g.rect(0, 15, 16, 1, 'o');
  }
  if (!nb.w) {
    g.rect(0, 0, 1, 16, 'o');
    g.rect(1, 0, 1, 16, 'A'); // lit from the left
  }
  if (!nb.e) {
    g.rect(15, 0, 1, 16, 'o');
    g.rect(14, 0, 1, 16, 'b');
  }
  if (!nb.n) {
    // Grass on top: a lit edge, then blades hanging into the sand.
    g.rect(0, 0, 16, 1, 'o');
    g.rect(0, 1, 16, 1, 'G');
    g.rect(0, 2, 16, 2, 'g');
    for (let x = 0; x < 16; x++) {
      const len = (tileHash(x + variant * 5, 3) % 3) + (x % 3 === 0 ? 1 : 0);
      for (let y = 0; y < len; y++) g.set(x, 4 + y, y === len - 1 ? 'd' : 'g');
    }
    // Round the grass over open sides.
    if (!nb.w) {
      g.set(0, 0, '.');
      g.set(0, 1, 'o');
      g.rect(1, 1, 1, 4, 'g');
    }
    if (!nb.e) {
      g.set(15, 0, '.');
      g.set(15, 1, 'o');
      g.rect(14, 1, 1, 4, 'g');
    }
  }
  // Inner corners: where this tile's top meets a higher neighbour, a little shadow in the nook.
  if (nb.n && nb.w && !nb.nw) {
    g.set(0, 0, 'B');
    g.set(1, 0, 'b');
    g.set(0, 1, 'b');
  }
  if (nb.n && nb.e && !nb.ne) {
    g.set(15, 0, 'B');
    g.set(14, 0, 'b');
    g.set(15, 1, 'b');
  }
  if (!nb.s && !nb.w) g.set(0, 15, '.');
  if (!nb.s && !nb.e) g.set(15, 15, '.');
  return g.toMap(GROUND_PAL);
}

const PROP_PAL = {
  o: '#3a2418', // outline
  w: '#9a5a2a', // wood
  W: '#d0904a', // wood, lit
  k: '#5a3418', // wood, dark
  y: '#f8d84a', // sun stamp
  s: '#9a96a8', // stone
  S: '#c8c4d4', // stone, lit
  t: '#5e5a6e', // stone, dark / cracks
  c: '#f06a8a', // coral
  C: '#ffb0c4', // coral, lit
  e: '#a8a090', // empty crate, faded wood
  E: '#c8c0ac', // empty crate, lit
};

function crate(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(0, 0, 16, 16, 'o');
  g.rect(1, 1, 14, 14, 'w');
  g.rect(1, 1, 14, 1, 'W');
  g.rect(1, 1, 1, 14, 'W');
  g.rect(1, 5, 14, 1, 'k'); // planks
  g.rect(1, 10, 14, 1, 'k');
  g.ellipse(8, 8, 2.5, 2.5, 'y'); // the sun stamp
  for (const [x, y] of [[8, 3], [8, 13], [3, 8], [13, 8]]) g.set(x, y, 'y');
  return g;
}

function usedCrate(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(0, 0, 16, 16, 'o');
  g.rect(1, 1, 14, 14, 'e');
  g.rect(1, 1, 14, 1, 'E');
  g.rect(1, 5, 14, 1, 'k');
  g.rect(1, 10, 14, 1, 'k');
  return g;
}

function cracked(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(0, 0, 16, 16, 'o');
  g.rect(1, 1, 14, 14, 's');
  g.rect(1, 1, 14, 2, 'S');
  g.rect(1, 1, 1, 14, 'S');
  for (const [x, y] of [[5, 3], [5, 4], [6, 5], [6, 6], [7, 7], [8, 7], [9, 8], [9, 9], [10, 10], [10, 11], [4, 9], [5, 10], [3, 11]]) g.set(x, y, 't');
  return g;
}

function spikes(): PixelGrid {
  const g = new PixelGrid(16, 16);
  for (let i = 0; i < 3; i++) {
    const cx = 3 + i * 5;
    for (let h = 0; h < 10; h++) {
      const half = Math.max(0, Math.floor((9 - h) / 3));
      g.rect(cx - half, 15 - h, half * 2 + 1, 1, h > 6 ? 'C' : 'c');
    }
  }
  g.outline('o');
  return g;
}

/** A plank platform piece: 'left', 'mid', 'right' or 'one' (a single tile). */
function plank(end: 'left' | 'mid' | 'right' | 'one'): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(0, 1, 16, 4, 'w');
  g.rect(0, 1, 16, 1, 'W');
  for (const x of [5, 11]) g.set(x, 3, 'k'); // nails / plank joins
  if (end === 'left' || end === 'one') g.rect(2, 5, 2, 4, 'k'); // supports at the ends
  if (end === 'right' || end === 'one') g.rect(12, 5, 2, 4, 'k');
  g.outline('o');
  if (end === 'mid' || end === 'right') {
    for (let y = 0; y < 16; y++) if (g.get(0, y) === 'o' && y > 0 && y < 6) g.set(0, y, 'w');
  }
  if (end === 'mid' || end === 'left') {
    for (let y = 0; y < 16; y++) if (g.get(15, y) === 'o' && y > 0 && y < 6) g.set(15, y, 'w');
  }
  return g;
}

/** The beach tile sheet, in BEACH_TILE order. */
export const BEACH_TILES: readonly PixelMap[] = [crate(), usedCrate(), cracked(), spikes(), plank('left'), plank('mid'), plank('right'), plank('one')].map((g) => g.toMap(PROP_PAL));
export const BEACH_TILE = { crate: 0, used: 1, cracked: 2, spikes: 3, plankLeft: 4, plankMid: 5, plankRight: 6, plankOne: 7 } as const;

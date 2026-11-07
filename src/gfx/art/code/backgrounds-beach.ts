// Palm Beach background layers, drawn in code (original scenery): the sky,
// far islands over a calm sea, clouds, a row of palms and dunes, and an
// occasional palm that passes in front of Pip. Each is a sheet, so an external
// PNG can replace it like any sprite.

import type { PixelMap } from '../pixels';
import { PixelGrid } from './draw';
import { tileHash } from './tiles-beach';

export const BG_W = 512; // px, the scrolling layers repeat every 512 px

/** Sky: a smooth top-to-bottom blend (dithered between shades) with a warm sun. 480 x 270, fixed. */
export function skyLayer(): PixelMap {
  const shades = ['1', '2', '3', '4', '5', '6'];
  const g = new PixelGrid(480, 270);
  for (let y = 0; y < 270; y++) {
    const t = Math.min(0.999, y / 200) * (shades.length - 1);
    const i = Math.floor(t);
    const frac = t - i;
    for (let x = 0; x < 480; x++) {
      // Ordered dither: a 4x4 pattern decides which of the two nearest shades this pixel takes.
      const threshold = BAYER[(y & 3) * 4 + (x & 3)] / 16;
      g.set(x, y, shades[frac > threshold ? Math.min(i + 1, shades.length - 1) : i]);
    }
  }
  g.ellipse(380, 70, 22, 22, 'g'); // sun glow
  g.ellipse(380, 70, 15, 15, 's');
  g.ellipse(376, 66, 9, 9, 'S');
  return g.toMap({ '1': '#2c5cc8', '2': '#3a78dc', '3': '#4c94ea', '4': '#68b0f2', '5': '#8ccaf6', '6': '#b8e4f8', g: '#ffe8a0', s: '#fff2b0', S: '#fffbe0' });
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Far islands and the sea, 512 x 100; 3 frames whose wave glints rotate colour (colour cycling). */
export function farLayer(): PixelMap[] {
  const base = new PixelGrid(BG_W, 100);
  // Sea along the bottom 34 rows.
  base.rect(0, 66, BG_W, 34, 'b');
  base.rect(0, 66, BG_W, 2, 'B');
  base.rect(0, 86, BG_W, 14, 'd');
  // Islands: soft hills in two greens with a sandy rim.
  const islands = [
    [60, 30, 66],
    [200, 46, 66],
    [330, 26, 66],
    [450, 38, 66],
  ];
  for (const [cx, w, bottom] of islands) {
    base.ellipse(cx, bottom, w, 18 + (w % 7), 'G');
    base.ellipse(cx - w * 0.2, bottom - 4, w * 0.6, 14, 'g');
    base.rect(cx - w, bottom - 1, w * 2, 2, 'a');
  }
  base.rect(0, 67, BG_W, 33, 'b'); // re-cover the island bottoms with sea
  base.rect(0, 66, BG_W, 1, 'B');
  base.rect(0, 86, BG_W, 14, 'd');
  // Wave glints in three cycling colour slots (1, 2, 3).
  for (let i = 0; i < 70; i++) {
    const h = tileHash(i, 7);
    const x = h % BG_W;
    const y = 70 + ((h >>> 9) % 28);
    const slot = String((i % 3) + 1);
    base.rect(x, y, 3 + (h % 4), 1, slot);
  }
  const map = base.toMap({});
  const sea = { b: '#3e8ed8', B: '#8cd0f0', d: '#2e6cb8', G: '#4e9a6a', g: '#6ab878', a: '#e8d49a' };
  const glints = ['#ffffff', '#a8e4ff', '#3e8ed8']; // bright, dim, gone
  return [0, 1, 2].map((f) => ({
    rows: map.rows,
    palette: { ...sea, '1': glints[f % 3], '2': glints[(f + 1) % 3], '3': glints[(f + 2) % 3] },
  }));
}

/** Clouds, 512 x 60: puffy shapes with lit tops and shaded bottoms. */
export function cloudLayer(): PixelMap {
  const g = new PixelGrid(BG_W, 60);
  const clouds = [
    [40, 20, 1],
    [170, 34, 0.8],
    [300, 16, 1.2],
    [420, 38, 0.7],
  ];
  for (const [cx, cy, s] of clouds) {
    g.ellipse(cx, cy + 6 * s, 26 * s, 9 * s, 'c');
    g.ellipse(cx - 10 * s, cy, 12 * s, 10 * s, 'w');
    g.ellipse(cx + 8 * s, cy - 2 * s, 14 * s, 12 * s, 'w');
    g.ellipse(cx, cy + 9 * s, 24 * s, 4 * s, 'c');
  }
  return g.toMap({ w: '#ffffff', c: '#d4e6f6' });
}

/** A palm tree drawn into a grid: a curved trunk and fronds (sway shifts the tips). */
function palm(g: PixelGrid, x: number, ground: number, height: number, lean: number, sway: number): void {
  for (let i = 0; i < height; i++) {
    const t = i / height;
    const px = x + Math.round(lean * t * t);
    g.rect(px, ground - i, 4, 1, i % 4 === 0 ? 'k' : 't'); // ringed trunk
    g.set(px, ground - i, 'T');
  }
  const topX = x + lean + 2;
  const topY = ground - height;
  for (let f = 0; f < 6; f++) {
    const dir = f < 3 ? -1 : 1;
    const spread = (f % 3) * 0.35 + 0.25;
    for (let j = 0; j < 14; j++) {
      const fx = topX + dir * j;
      const fy = topY + Math.round((j * j * spread) / 14) - 2 + (j > 9 ? sway * dir : 0);
      g.rect(fx, fy, 1, 2, j > 10 ? 'f' : 'F');
    }
  }
  g.ellipse(topX, topY + 1, 3, 2, 'n'); // coconuts
}

/** The mid layer, 512 x 120: dunes and a row of palms; 3 sway frames. */
export function midLayer(): PixelMap[] {
  return [0, 1, 2].map((frame) => {
    const sway = [0, 1, 0][frame] - (frame === 2 ? 1 : 0);
    const g = new PixelGrid(BG_W, 120);
    // Dunes along the bottom.
    for (let x = 0; x < BG_W; x++) {
      const h = 18 + Math.round(Math.sin((x / BG_W) * Math.PI * 6) * 6 + Math.sin((x / BG_W) * Math.PI * 14) * 3);
      g.rect(x, 120 - h, 1, h, 'd');
      g.set(x, 120 - h, 'D');
    }
    const trees = [
      [30, 70, 10],
      [120, 85, -12],
      [210, 64, 8],
      [300, 90, 14],
      [395, 72, -9],
      [470, 80, 6],
    ];
    for (const [x, h, lean] of trees) palm(g, x, 104, h, lean, sway);
    return g.toMap({ d: '#e2c47e', D: '#f4dc9c', t: '#8a5a32', T: '#b07a46', k: '#6a4224', F: '#3e9a4a', f: '#2a7a3a', n: '#7a4a24' });
  });
}

/** A foreground palm passing in front of Pip, 64 x 200: a dark trunk and fronds at the top. */
export function frontLayer(): PixelMap {
  const g = new PixelGrid(64, 200);
  for (let y = 40; y < 200; y++) {
    const x = 26 + Math.round(Math.sin(y / 40) * 3);
    g.rect(x, y, 8, 1, y % 7 === 0 ? 'k' : 't');
    g.set(x, y, 'T');
  }
  for (let f = 0; f < 7; f++) {
    const a = -Math.PI * 0.95 + (f / 6) * Math.PI * 0.9;
    for (let j = 0; j < 30; j++) {
      const x = 30 + Math.cos(a) * j;
      const y = 40 + Math.sin(a) * j * 0.5 + (j * j) / 40;
      g.rect(Math.round(x), Math.round(y), 2, 3, j > 22 ? 'f' : 'F');
    }
  }
  return g.toMap({ t: '#4a3020', T: '#6a4628', k: '#2e1c12', F: '#1e5a2a', f: '#164620' });
}

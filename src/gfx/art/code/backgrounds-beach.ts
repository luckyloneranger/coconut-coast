// Palm Beach background layers, drawn in code (original scenery): the sky,
// far islands over a calm sea, clouds, a row of palms and dunes, and an
// occasional palm that passes in front of Pip. Each is a sheet, so an external
// PNG can replace it like any sprite.

import type { PixelMap } from '../pixels';
import { PixelGrid } from './draw';
import { tileHash } from './tiles-beach';
import { drawBush, drawGrass, drawPalm } from './palm';

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

/** One distant island: layered hills lit from the left with dithered shade on the right, tiny palm silhouettes on the ridge, and a line of surf. */
function island(g: PixelGrid, cx: number, w: number, h: number, seed: number): void {
  const shore = 66;
  // Main hill and a smaller one in front, a little lighter.
  for (let x = Math.round(cx - w); x <= cx + w; x++) {
    const t = (x - cx) / w;
    const top = Math.round(shore - h * Math.sqrt(Math.max(0, 1 - t * t)) * (0.85 + 0.15 * Math.sin(t * 5 + seed)));
    for (let y = top; y < shore; y++) {
      const shade = t > 0.25 && (x + y) % 2 === 0 ? 'h' : t > 0.55 ? 'h' : 'g';
      g.set(x, y, y === top ? 'G' : shade);
    }
  }
  const fx = cx - w * 0.35;
  const fw = w * 0.55;
  for (let x = Math.round(fx - fw); x <= fx + fw; x++) {
    const t = (x - fx) / fw;
    const top = Math.round(shore - h * 0.55 * Math.sqrt(Math.max(0, 1 - t * t)));
    for (let y = top; y < shore; y++) g.set(x, y, y === top ? 'G' : t < -0.2 ? 'G' : 'g');
  }
  // Palm silhouettes on the ridge.
  for (let i = 0; i < 3; i++) {
    const px = Math.round(cx - w * 0.3 + i * w * 0.28 + (seed % 3));
    let top = shore;
    while (top > 0 && g.get(px, top - 1) !== '.') top--;
    g.rect(px, top - 6, 1, 6, 'p');
    for (const [dx, dy] of [[-2, -6], [-1, -7], [1, -7], [2, -6], [-3, -5], [3, -5]]) g.set(px + dx, top + dy, 'p');
  }
  // Sandy beach and surf at the waterline.
  g.rect(Math.round(cx - w), shore - 1, Math.round(w * 2), 1, 'a');
  for (let x = Math.round(cx - w - 2); x <= cx + w + 2; x++) if ((x + seed) % 3 !== 0) g.set(x, shore, 'f');
}

/** Far islands and the sea, 512 x 100; 3 frames whose wave glints rotate colour (colour cycling). */
export function farLayer(): PixelMap[] {
  const base = new PixelGrid(BG_W, 100);
  // Sea: lighter near the horizon, deeper toward us, blended with dithered rows.
  for (let y = 66; y < 100; y++) {
    for (let x = 0; x < BG_W; x++) {
      const t = (y - 66) / 34;
      const deep = t > 0.6 || (t > 0.35 && (x + y) % 2 === 0);
      base.set(x, y, y < 68 ? 'B' : deep ? 'd' : 'b');
    }
  }
  island(base, 70, 46, 26, 1);
  island(base, 230, 30, 16, 2);
  island(base, 360, 58, 32, 3);
  island(base, 470, 22, 12, 4);
  // Wave glints in three cycling colour slots (1, 2, 3).
  for (let i = 0; i < 80; i++) {
    const h = tileHash(i, 7);
    const x = h % BG_W;
    const y = 69 + ((h >>> 9) % 29);
    if (base.get(x, y) === 'f') continue;
    base.rect(x, y, 2 + (h % 4) + Math.floor((y - 69) / 8), 1, String((i % 3) + 1));
  }
  const map = base.toMap({});
  const colours = { b: '#3e8ed8', B: '#a8dcf4', d: '#2e6cb8', G: '#7cc890', g: '#529e6e', h: '#3e7e5e', a: '#ecdcaa', f: '#ffffff', p: '#2e5e48' };
  const glints = ['#ffffff', '#a8e4ff', '#3e8ed8']; // bright, dim, gone
  return [0, 1, 2].map((f) => ({
    rows: map.rows,
    palette: { ...colours, '1': glints[f % 3], '2': glints[(f + 1) % 3], '3': glints[(f + 2) % 3] },
  }));
}

/** Clouds, 512 x 60: puffy heaps with lit tops, a soft blue middle and a flat shaded base. */
export function cloudLayer(): PixelMap {
  const g = new PixelGrid(BG_W, 60);
  const clouds = [
    [40, 22, 1],
    [170, 34, 0.75],
    [300, 18, 1.2],
    [420, 38, 0.65],
  ];
  for (const [cx, cy, sc] of clouds) {
    const puffs = [[-16, 4, 9], [-6, -2, 12], [7, -4, 13], [18, 3, 9], [0, 5, 14]];
    for (const [dx, dy, r] of puffs) g.ellipse(cx + dx * sc, cy + dy * sc, r * sc, r * sc * 0.8, 'c');
    for (const [dx, dy, r] of puffs) g.ellipse(cx + dx * sc - 1, cy + dy * sc - 2, r * sc * 0.8, r * sc * 0.6, 'w');
    for (const [dx, dy, r] of puffs.slice(1, 3)) g.ellipse(cx + dx * sc - 3, cy + dy * sc - 5 * sc, r * sc * 0.4, r * sc * 0.3, 'W');
    // A flat, shaded base.
    const base = Math.round(cy + 8 * sc);
    for (let x = Math.round(cx - 26 * sc); x <= cx + 28 * sc; x++) {
      for (let y = base; y < base + 6 * sc; y++) if (g.get(x, y) !== '.') g.set(x, y, y === base ? 'c' : 'C');
    }
  }
  return g.toMap({ W: '#ffffff', w: '#f2f6fc', c: '#d4e4f4', C: '#b8cee8' });
}

/** Shared letters for palm layers: trunk T t k K, leaves G g d D, coconuts n N, sand s S z. */
const NEAR_PALM_COLOURS = {
  T: '#c8915a', t: '#9a6638', k: '#6e4426', K: '#4a2c18',
  G: '#8ad86a', g: '#4cae4a', d: '#2e7c3c', D: '#1c5430',
  n: '#7a4a22', N: '#b07a44',
  s: '#ecd28e', S: '#f8e6b4', z: '#cfae6c',
};
/** The far row: the same letters in hazier, bluer colours (further away). */
const FAR_PALM_COLOURS = {
  T: '#a8a888', t: '#8c8a78', k: '#76766c', K: '#646460',
  G: '#8cc4a0', g: '#6aa88e', d: '#5a9282', D: '#4c7e78',
  n: '#6e6e66', N: '#8a8a7a',
  s: '#d8d0a8', S: '#e6dfbc', z: '#c4bc98',
};

/** Rolling dunes along the bottom of a layer: lit crests, a shaded underside. */
function dunes(g: PixelGrid, h: number, base: number, waves: number[], seed: number): void {
  for (let x = 0; x < BG_W; x++) {
    let top = base;
    waves.forEach((amp, i) => (top -= Math.round(Math.sin((x / BG_W) * Math.PI * 2 * (i + 2) + seed * (i + 1)) * amp)));
    g.rect(x, top, 1, h - top, 's');
    g.set(x, top, 'S');
    g.set(x, top + 1, 'S');
    if ((x + seed) % 7 === 0) g.set(x, top + 4 + (x % 5), 'z'); // ripples in the sand
  }
}

/** The far row of palms, 512 x 110: small and hazy, for depth; 3 sway frames. */
export function midFarLayer(): PixelMap[] {
  return [0, 1, 2].map((frame) => {
    const sway = [0, 1, -1][frame];
    const g = new PixelGrid(BG_W, 110);
    const trees = [
      [20, 44, 6], [75, 36, -4], [118, 50, 7], [190, 40, -6], [236, 46, 4],
      [300, 38, 6], [352, 52, -7], [410, 42, 5], [462, 48, -5], [500, 36, 4],
    ];
    for (const [x, h, lean] of trees) drawPalm(g, { x, ground: 98, height: h, lean, baseW: 3, topW: 2, frondLen: 17, sway, fronds: 7 });
    dunes(g, 110, 100, [2, 1], 1.3);
    return g.toMap(FAR_PALM_COLOURS);
  });
}

/** The near palm row, 512 x 150: full palms with bushes and beach grass on rolling dunes; 3 sway frames. */
export function midLayer(): PixelMap[] {
  return [0, 1, 2].map((frame) => {
    const sway = [0, 1, -1][frame];
    const g = new PixelGrid(BG_W, 150);
    const trees = [
      [40, 92, 18, 5],
      [150, 104, -16, 6],
      [262, 84, 14, 5],
      [370, 110, 20, 6],
      [460, 88, -14, 5],
    ];
    for (const [x, h, lean, w] of trees) drawPalm(g, { x, ground: 136, height: h, lean, baseW: w, topW: 3, frondLen: 34, sway, fronds: 9 });
    dunes(g, 150, 138, [3, 2], 0.4);
    // Bushes and grass round the trunks and between them, anchoring the palms in the sand.
    const bushes = [[30, 26, 10], [168, 30, 12], [250, 22, 9], [330, 18, 8], [388, 34, 12], [490, 24, 10]];
    bushes.forEach(([x, w, h], i) => drawBush(g, x, 140, w, h, i * 3));
    for (let x = 10; x < BG_W; x += 23) drawGrass(g, x + ((x * 7) % 9), 141, 6 + (x % 4));
    return g.toMap(NEAR_PALM_COLOURS);
  });
}

/** A big foreground palm passing in front of Pip, 120 x 240: darker (in shadow, close to the camera). */
export function frontLayer(): PixelMap {
  const g = new PixelGrid(120, 240);
  drawPalm(g, { x: 64, ground: 239, height: 180, lean: -16, baseW: 12, topW: 7, frondLen: 60, sway: 0, fronds: 9 });
  return g.toMap({
    T: '#5a4030', t: '#43301f', k: '#2e2016', K: '#1e140e',
    G: '#2e6a3a', g: '#22522e', d: '#183e24', D: '#102c1a',
    n: '#3a2414', N: '#5a3a22',
  });
}

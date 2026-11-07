// A palm tree painter (original design), used by the background layers.
// The trunk is a smooth, tapering curve with lit and shaded sides and curved
// growth rings; the crown is a fan of drooping fronds, each with leaflets
// either side; darker fronds behind, lighter ones in front; coconuts under it.
//
// Palette letters it uses (the caller supplies the colours):
//   trunk: T lit, t base, k shade, K ring/edge
//   leaves: G lit, g base, d shade, D darkest (back fronds, undersides)
//   coconuts: n base, N lit

import type { PixelGrid } from './draw';

export interface PalmShape {
  x: number; // px, base of the trunk (centre)
  ground: number; // px, where the trunk meets the ground
  height: number; // px, trunk length
  lean: number; // px the top shifts sideways
  baseW: number; // px, trunk width at the bottom
  topW: number; // px, trunk width at the top
  frondLen: number; // px, length of a frond
  sway: number; // -1 to 1: the fronds swing a little with the breeze
  fronds?: number; // how many fronds (7 by default)
}

/** Where the trunk's centre is `t` of the way up (0 = base, 1 = top). */
function trunkX(p: PalmShape, t: number): number {
  return p.x + p.lean * t * t; // curves more near the top
}

export function drawPalm(g: PixelGrid, p: PalmShape): void {
  drawTrunk(g, p);
  drawCrown(g, p);
}

function drawTrunk(g: PixelGrid, p: PalmShape): void {
  const ringGap = Math.max(3, Math.round(p.baseW * 0.7));
  for (let row = 0; row <= p.height; row++) {
    const t = row / p.height;
    const w = Math.max(2, Math.round(p.baseW + (p.topW - p.baseW) * t));
    const left = Math.round(trunkX(p, t) - w / 2);
    const y = p.ground - row;
    const ring = row % ringGap;
    for (let i = 0; i < w; i++) {
      let ch = 't';
      if (i === 0 || i === w - 1) ch = 'K'; // edges
      else if (i === 1 || (i === 2 && w > 6)) ch = 'T'; // lit from the left
      else if (i >= w - 3) ch = 'k'; // shaded on the right
      // Growth rings, curving down at the middle (a "smile"), so the trunk looks round.
      const middle = i > w * 0.3 && i < w * 0.7;
      if ((ring === 0 && !middle) || (ring === 1 && middle)) ch = i === 1 ? 'k' : 'K';
      g.set(left + i, y, ch);
    }
  }
  // A flared, rooted base.
  const left = Math.round(p.x - p.baseW / 2);
  g.rect(left - 1, p.ground - 1, p.baseW + 2, 2, 'k');
  g.set(left - 2, p.ground, 'K');
  g.set(left + p.baseW + 1, p.ground, 'K');
}

function drawCrown(g: PixelGrid, p: PalmShape): void {
  const topX = trunkX(p, 1);
  const topY = p.ground - p.height;
  // A fountain of fronds: they leave the crown upward and outward, then arch
  // down under their own weight. Back fronds (shorter, darker) first.
  const L = p.frondLen;
  const sw = p.sway * 5;
  const back = [
    { a: 100 + sw, len: L * 0.7 },
    { a: 62 + sw, len: L * 0.8 },
    { a: 138 + sw, len: L * 0.8 },
  ];
  const front = [
    { a: 18 + sw, len: L },
    { a: 162 + sw, len: L },
    { a: 40 + sw, len: L * 0.95 },
    { a: 140 + sw, len: L * 0.95 },
    { a: -8 + sw, len: L * 0.8 },
    { a: 188 + sw, len: L * 0.8 },
  ].slice(0, Math.max(4, (p.fronds ?? 7) - 3));
  for (const f of back) frond(g, topX, topY, f.a, f.len, true);
  for (const f of front) frond(g, topX, topY, f.a, f.len, false);
  coconuts(g, topX, topY + 3, p.topW); // hanging just under the crown, in front
  // The heart of the crown, where the fronds meet.
  g.ellipse(topX, topY, Math.max(2, p.topW * 0.7), 1.5, 'd');
  g.set(Math.round(topX) - 1, topY - 1, 'G');
}

/**
 * One frond: a spine leaving the crown at angle `deg` (0 = right, 90 = up),
 * arching down toward the tip, with leaflets hanging below it like a curtain
 * (long and in shade) and short lit ones along the top.
 */
function frond(g: PixelGrid, x0: number, y0: number, deg: number, len: number, back: boolean): void {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = -Math.sin(a);
  // Arch: steeper fronds rise more before bending; flat ones droop sooner.
  const droop = 1.05 - 0.35 * Math.max(0, -dy);
  const steps = Math.ceil(len * 2);
  let last = '';
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const x = x0 + dx * s * len;
    const y = y0 + dy * s * len + droop * s * s * len;
    const tx = dx;
    const ty = dy + 2 * droop * s;
    const tl = Math.hypot(tx, ty) || 1;
    const ux = tx / tl;
    // Leaflets every couple of pixels, longest near the middle of the frond.
    const along = s * len;
    if (Math.round(along) % 2 === 0 && s > 0.12 && s < 0.97) {
      const size = len * 0.34 * Math.sin(Math.PI * Math.min(1, (s - 0.05) * 1.08));
      // Hanging leaflets: mostly straight down, swept a little toward the tip.
      const hx = ux * 0.45;
      const hy = 1;
      const hl = Math.hypot(hx, hy);
      for (let k = 1; k <= size; k++) {
        const ch = back ? (k > size * 0.6 ? 'D' : 'd') : k > size * 0.65 ? 'D' : k > size * 0.3 ? 'd' : 'g';
        g.set(x + (hx / hl) * k, y + (hy / hl) * k, ch);
      }
      // Short lit leaflets standing up along the top edge.
      const up = size * 0.35;
      for (let k = 1; k <= up; k++) g.set(x + ux * 0.6 * k, y - k * 0.8, back ? 'd' : 'G');
    }
    if (s > 0.95) break; // no bare spine sticking out past the leaves
    const key = `${Math.round(x)},${Math.round(y)}`;
    if (key !== last) {
      g.set(x, y, back ? 'd' : 'G');
      if (s < 0.6) g.set(x, y + 1, back ? 'D' : 'g'); // thicker toward the crown
      last = key;
    }
  }
}

function coconuts(g: PixelGrid, x: number, y: number, size: number): void {
  const r = Math.max(1.5, size * 0.35);
  for (const [ox, oy] of [[-r, 0], [r, 0], [0, r * 0.9]]) {
    g.ellipse(x + ox, y + oy, r, r, 'n');
    g.set(Math.round(x + ox - r * 0.4), Math.round(y + oy - r * 0.4), 'N');
  }
}

/** A leafy bush: overlapping clumps, lit on top, dark underneath, with a ragged leafy edge. */
export function drawBush(g: PixelGrid, x: number, ground: number, w: number, h: number, seed: number): void {
  const clumps = Math.max(2, Math.round(w / 8));
  for (let i = 0; i < clumps; i++) {
    const cx = x - w / 2 + (i + 0.5) * (w / clumps);
    const r = h * (0.55 + 0.25 * Math.sin(seed + i * 2.1));
    g.ellipse(cx, ground - r * 0.9, w / clumps / 1.4 + 1, r, 'd');
  }
  for (let i = 0; i < clumps; i++) {
    const cx = x - w / 2 + (i + 0.5) * (w / clumps);
    const r = h * (0.5 + 0.25 * Math.sin(seed + i * 2.1));
    g.ellipse(cx - 1, ground - r * 1.05, w / clumps / 1.8, r * 0.75, 'g');
    g.ellipse(cx - 2, ground - r * 1.35, w / clumps / 3, r * 0.35, 'G'); // lit tops
  }
  // Ragged leaf tips along the top edge.
  for (let xx = Math.round(x - w / 2); xx < x + w / 2; xx += 2) {
    for (let yy = ground - h * 2; yy < ground; yy++) {
      if (g.get(xx, yy) !== '.') {
        g.set(xx, yy - 1, (xx + seed) % 4 === 0 ? 'G' : 'g');
        break;
      }
    }
  }
  g.rect(Math.round(x - w / 2), ground - 1, Math.round(w), 1, 'D'); // shadow line on the ground
}

/** A tuft of beach grass: a few thin blades curving away from the middle. */
export function drawGrass(g: PixelGrid, x: number, ground: number, h: number): void {
  for (let b = -2; b <= 2; b++) {
    const len = h - Math.abs(b);
    for (let k = 0; k < len; k++) g.set(x + b * (k / len) * 2 + b * 0.3, ground - k, k > len * 0.6 ? 'G' : 'g');
  }
}

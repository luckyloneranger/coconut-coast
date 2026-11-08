// Small pieces of art for the display and the level (original designs):
// a spinning Sun Coin, the checkpoint and goal flags with the sun emblem,
// and icons for the display (Pip's head, the sun, a fruit).

import type { PixelMap } from '../pixels';
import { PixelGrid } from './draw';
import { PIP_PALETTE } from './pip/palette';

const COIN_PAL = { o: '#6a3a10', a: '#f0a030', y: '#ffd84a', Y: '#fff2a0', k: '#7a4a14', w: '#ffffff' };

/** The Sun Coin turning: 6 frames, the face narrowing to an edge and back. */
export const COIN_FRAMES: readonly PixelMap[] = [1, 0.75, 0.4, 0.15, 0.4, 0.75].map((wScale, f) => {
  const g = new PixelGrid(16, 16);
  const rx = Math.max(1, 6 * wScale);
  g.ellipse(8, 8, rx, 6, 'a');
  if (rx > 2) g.ellipse(8, 8, rx * 0.75, 4.5, 'y');
  if (rx > 3) {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      g.set(8 + Math.cos(ang) * rx * 0.55, 8 + Math.sin(ang) * 3.3, 'a'); // the sun's rays
    }
    g.ellipse(8, 8, rx * 0.3, 1.8, 'Y');
    g.set(8 - Math.round(rx * 0.15), 8, 'k'); // a little face
    g.set(8 + Math.round(rx * 0.15), 8, 'k');
  }
  g.set(8 - Math.round(rx * 0.5), 4, 'w'); // a glint
  if (f === 0) g.set(9, 3, 'w');
  g.outline('o');
  return g.toMap(COIN_PAL);
});

const FLAG_PAL = { o: '#2a1a14', p: '#c8c4d4', P: '#ffffff', q: '#8a86a0', r: '#e85a3a', R: '#ff9a6a', y: '#ffd84a', Y: '#fff2a0', g: '#5ccc6a', G: '#a8f0a0', b: '#8a5226' };

/** A flag on a 32 x 64 pole, waving (frame 0-2). `kind`: the checkpoint down, raised, or the goal flag. */
function flag(kind: 'cpDown' | 'cpUp' | 'goal', wave: number): PixelMap {
  const g = new PixelGrid(32, 64);
  const poleTop = kind === 'goal' ? 2 : 14;
  g.rect(4, poleTop, 2, 62 - poleTop, 'p');
  g.rect(4, poleTop, 1, 62 - poleTop, 'P');
  g.ellipse(5, poleTop - 1, 2, 2, 'y'); // a gold knob on top
  g.rect(1, 61, 8, 3, 'b'); // a little wooden base
  const cloth = kind === 'cpUp' ? 'g' : kind === 'goal' ? 'r' : 'p';
  const lit = kind === 'cpUp' ? 'G' : kind === 'goal' ? 'R' : 'P';
  const flagTop = kind === 'cpDown' ? 44 : poleTop + 2;
  const w = kind === 'goal' ? 24 : 16;
  const h = kind === 'goal' ? 16 : 11;
  for (let x = 0; x < w; x++) {
    const ripple = Math.round(Math.sin(x / 4 + wave * 2.1) * (x / w) * 2);
    for (let y = 0; y < h; y++) g.set(6 + x, flagTop + y + ripple, y < 2 ? lit : cloth);
  }
  if (kind !== 'cpDown') {
    // The sun emblem.
    const cx = 6 + Math.round(w / 2);
    const cy = flagTop + Math.round(h / 2) + Math.round(Math.sin(w / 8 + wave * 2.1));
    g.ellipse(cx, cy, 3, 3, 'y');
    g.set(cx - 1, cy - 1, 'Y');
    for (const [dx, dy] of [[0, -5], [0, 5], [-5, 0], [5, 0]]) g.set(cx + dx, cy + dy, 'y');
  }
  g.outline('o');
  return g.toMap(FLAG_PAL);
}

/** Frames: checkpoint down 0-2, checkpoint raised 3-5, goal flag 6-8 (each waving over 3). */
export const FLAG_FRAMES: readonly PixelMap[] = (['cpDown', 'cpUp', 'goal'] as const).flatMap((k) => [0, 1, 2].map((w) => flag(k, w)));
export const FLAG_FRAME = { cpDown: 0, cpUp: 3, goal: 6 } as const;

/** Icons for the display, 12 x 12: Pip's head, the sun, a heart for lives... */
const ICON_PAL = {
  o: PIP_PALETTE.o, h: PIP_PALETTE.h, r: PIP_PALETTE.r, R: PIP_PALETTE.R, s: PIP_PALETTE.s, S: PIP_PALETTE.S, z: PIP_PALETTE.z,
  Y: '#fff2a0', a: '#f0a030', y: '#ffd84a',
};
function pipHead(): PixelMap {
  const g = new PixelGrid(12, 12);
  const head = ['..hhhhh...', '.hhhhhhhh.', 'rRRRRRRRr.', 'hhsSSSSSs.', 'hsSSSSoSs.', 'hsSSSSoSSs', 'hssSSSSSs.', '.ssSSSzs..', '..sssss...'];
  head.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== '.') g.set(x + 1, y + 2, row[x]);
  });
  g.outline('o');
  return g.toMap(ICON_PAL);
}
function sunIcon(): PixelMap {
  const g = new PixelGrid(12, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.set(6 + Math.cos(a) * 5, 6 + Math.sin(a) * 5, 'a');
  }
  g.ellipse(6, 6, 3.4, 3.4, 'y');
  g.set(5, 5, 'Y');
  g.outline('o');
  return g.toMap(ICON_PAL);
}
export const ICON_FRAMES: readonly PixelMap[] = [pipHead(), sunIcon()];
export const ICON = { pip: 0, sun: 1 } as const;

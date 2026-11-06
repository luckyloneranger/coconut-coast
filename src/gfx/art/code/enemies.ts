// Placeholder enemy sprites drawn in code (original designs), 4 frames each.
// Sizes match ART_PROMPTS.md, so generated art can replace them one for one.

import type { PixelMap } from '../pixels';
import { PixelGrid } from './draw';

/** Snapper crab, 24 x 16: claws open and close, legs shuffle. */
export const CRAB_FRAMES: readonly PixelMap[] = [0, 1, 2, 3].map((f) => {
  const g = new PixelGrid(24, 16);
  const step = f % 2;
  const clawUp = f < 2 ? 0 : 1;
  for (let i = 0; i < 3; i++) {
    g.rect(5 + i * 2 + (step ? 1 : 0), 13, 1, 2, 'd'); // legs, left
    g.rect(16 + i * 2 - (step ? 1 : 0), 13, 1, 2, 'd'); // legs, right
  }
  g.ellipse(11.5, 10, 7, 4, 'r'); // shell
  g.ellipse(10, 8.5, 4, 1.5, 'l'); // shine on top
  g.ellipse(3, 6 - clawUp, 2.5, 2, 'r'); // claws
  g.ellipse(20, 6 - clawUp, 2.5, 2, 'r');
  g.set(3, 5 - clawUp, '.'); // the claw's open notch
  g.set(20, 5 - clawUp, '.');
  g.rect(9, 3, 1, 3, 'd'); // eye stalks
  g.rect(14, 3, 1, 3, 'd');
  g.rect(8, 2, 2, 2, 'w'); // eyes
  g.rect(13, 2, 2, 2, 'w');
  g.set(9, 3, 'k');
  g.set(14, 3, 'k');
  g.outline('o');
  return g.toMap({ o: '#4a1420', r: '#e04838', l: '#ff8a6a', d: '#a02a2a', w: '#fff6e8', k: '#1e1018' });
});

/** Spiny urchin, 16 x 16: the spikes pulse in and out. */
export const URCHIN_FRAMES: readonly PixelMap[] = [0, 1, 2, 3].map((f) => {
  const g = new PixelGrid(16, 16);
  const reach = [6.5, 7.5, 6.5, 5.5][f];
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2 + (f % 2 ? 0.13 : 0);
    for (let r = 4; r <= reach; r += 0.5) g.set(8 + Math.cos(ang) * r, 9 + Math.sin(ang) * r * 0.85, 's');
  }
  g.ellipse(8, 9.5, 4.5, 4, 'p');
  g.ellipse(7, 8, 2, 1.5, 'l');
  g.set(6, 10, 'k');
  g.set(10, 10, 'k');
  g.outline('o');
  return g.toMap({ o: '#2a1238', p: '#8a4cc8', l: '#c09aec', s: '#e8d8ff', k: '#1a0a24' });
});

/** Gull, 24 x 20: wings flap up, level, down, level. */
export const GULL_FRAMES: readonly PixelMap[] = [0, 1, 2, 3].map((f) => {
  const g = new PixelGrid(24, 20);
  const wing = [-5, 0, 4, 0][f];
  g.ellipse(12, 11, 7, 3, 'w'); // body
  g.ellipse(5, 9, 3, 2.5, 'w'); // head (facing left)
  g.rect(1, 9, 2, 1, 'y'); // beak
  g.set(4, 8, 'k'); // eye, with a cross brow above it
  g.set(3, 7, 'k');
  g.rect(18, 10, 4, 2, 'g'); // tail
  for (let i = 0; i < 9; i++) {
    const y = 10 + Math.round((wing * (i + 1)) / 9); // wing slopes from the body out to the tip
    g.rect(9 + i, y - 1, 1, 2, i > 5 ? 'd' : 'g');
  }
  g.rect(10, 14, 1, 2, 'y'); // feet tucked
  g.rect(13, 14, 1, 2, 'y');
  g.outline('o');
  return g.toMap({ o: '#2a2a3a', w: '#f4f4f0', g: '#a8b0c0', d: '#6a7488', y: '#f0b030', k: '#1a1a24' });
});

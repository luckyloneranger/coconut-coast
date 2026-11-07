// Enemy sprites drawn in code (original designs), shaded from the top left.
// Sizes match ART_PROMPTS.md. Each sheet ends with a "hit" frame shown just
// before the enemy pops. Crab: walk 0-5, hit 6. Urchin: pulse 0-3, hit 4.
// Gull: flap 0-5, dive 6, hit 7.

import type { PixelMap } from '../pixels';
import { PixelGrid } from './draw';

export const ENEMY_FRAME = {
  crab: { walk: 6, hit: 6 },
  urchin: { pulse: 4, hit: 4 },
  gull: { flap: 6, dive: 6, hit: 7 },
} as const;

const CRAB_PAL = { o: '#4a1420', r: '#d8402e', R: '#ff7a5a', d: '#962626', D: '#6a1a1e', w: '#fff6e8', k: '#1e1018', y: '#f8c070' };

/** Snapper crab, 24 x 16. `hit`: eyes shut, claws flung up. */
function crab(step: number, hit = false): PixelMap {
  const g = new PixelGrid(24, 16);
  const legPhase = step % 3;
  for (let i = 0; i < 3; i++) {
    const lx = 5 + i * 2 + (legPhase === i ? 1 : 0);
    const rx = 18 - i * 2 - (legPhase === (i + 1) % 3 ? 1 : 0);
    g.rect(lx, 12, 1, 3, 'D'); // legs, left
    g.rect(rx, 12, 1, 3, 'D'); // legs, right
  }
  g.ellipse(11.5, 10, 7.5, 4, 'r'); // shell
  g.ellipse(11.5, 11.5, 7, 2, 'd'); // shaded underside
  g.ellipse(9.5, 8.5, 4, 1.5, 'R'); // lit top
  g.set(7, 9, 'y');
  g.set(15, 9, 'y'); // shell spots
  const clawUp = hit ? 3 : step % 2;
  for (const [cx, side] of [[3, -1], [20, 1]] as const) {
    g.ellipse(cx, 6 - clawUp, 2.5, 2, 'r');
    g.set(cx - side, 5 - clawUp, 'R');
    g.set(cx, 5 - clawUp - (step % 2 ? 0 : 1), '.'); // the claw's notch opens and closes
    g.rect(cx + (side < 0 ? 1 : -1), 8 - clawUp, 1, 2 + clawUp, 'd'); // arm
  }
  g.rect(9, 3, 1, 3, 'd'); // eye stalks
  g.rect(14, 3, 1, 3, 'd');
  if (hit) {
    for (const ex of [8, 13]) {
      g.set(ex, 2, 'k');
      g.set(ex + 1, 3, 'k'); // X eyes
      g.set(ex + 1, 2, 'w');
      g.set(ex, 3, 'w');
    }
  } else {
    g.rect(8, 2, 2, 2, 'w');
    g.rect(13, 2, 2, 2, 'w');
    g.set(9, 3, 'k');
    g.set(14, 3, 'k');
  }
  g.outline('o');
  return g.toMap(CRAB_PAL);
}

const URCHIN_PAL = { o: '#2a1238', p: '#7a3cb8', P: '#a86ce0', d: '#4e2280', s: '#e8d8ff', S: '#ffffff', k: '#1a0a24' };

/** Spiny urchin, 16 x 16: spines pulse in and out; `hit`: spines droop. */
function urchin(f: number, hit = false): PixelMap {
  const g = new PixelGrid(16, 16);
  const reach = hit ? 5 : [6.5, 7.5, 6.5, 5.5][f];
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2 + (f % 2 ? 0.13 : 0);
    for (let r = 4; r <= reach; r += 0.5) g.set(8 + Math.cos(ang) * r, 9 + Math.sin(ang) * r * 0.85, r > reach - 1 ? 'S' : 's');
  }
  g.ellipse(8, 9.5, 4.5, 4, 'p');
  g.ellipse(8, 11, 4, 2, 'd');
  g.ellipse(6.5, 8, 2, 1.5, 'P');
  if (hit) {
    g.rect(5, 10, 2, 1, 'k');
    g.rect(9, 10, 2, 1, 'k');
  } else {
    g.set(6, 10, 'k');
    g.set(10, 10, 'k');
  }
  g.outline('o');
  return g.toMap(URCHIN_PAL);
}

const GULL_PAL = { o: '#2a2a3a', w: '#f4f4f0', W: '#ffffff', g: '#a8b0c0', d: '#6a7488', y: '#f0b030', Y: '#ffd870', k: '#1a1a24' };

/** Gull, 24 x 20, facing left. `wing`: wing tip height (-6 up to +5 down). `dive`: tucked, beak down. */
function gull(wing: number, mode: 'fly' | 'dive' | 'hit' = 'fly'): PixelMap {
  const g = new PixelGrid(24, 20);
  const tilt = mode === 'dive' ? 2 : 0;
  g.ellipse(12, 11 + tilt, 7, 3, 'w'); // body
  g.ellipse(12, 12.5 + tilt, 6, 1.5, 'g'); // shaded belly
  g.ellipse(5, 9 + tilt * 2, 3, 2.5, 'w'); // head
  g.set(4, 8 + tilt * 2, 'W');
  g.rect(1, 9 + tilt * 2 + (mode === 'dive' ? 1 : 0), 2, 1, 'y'); // beak
  g.set(1, 10 + tilt * 2, 'Y');
  if (mode === 'hit') {
    g.set(4, 8, 'k');
    g.set(5, 9, 'k');
  } else {
    g.set(4, 8 + tilt * 2, 'k'); // eye
    g.set(3, 7 + tilt * 2, 'k'); // a cross brow
  }
  g.rect(18, 10 + tilt, 4, 2, 'g'); // tail
  g.set(21, 10 + tilt, 'd');
  const w = mode === 'dive' ? -3 : mode === 'hit' ? -6 : wing;
  for (let i = 0; i < 9; i++) {
    const y = 10 + tilt + Math.round((w * (i + 1)) / 9);
    g.rect(9 + i, y - 1, 1, 2, i > 5 ? 'd' : 'g');
    if (i < 5) g.set(9 + i, y - 1, 'w'); // lit leading edge
  }
  if (mode !== 'dive') {
    g.rect(10, 14 + tilt, 1, 2, 'y'); // feet tucked
    g.rect(13, 14 + tilt, 1, 2, 'y');
  }
  g.outline('o');
  return g.toMap(GULL_PAL);
}

export const CRAB_FRAMES: readonly PixelMap[] = [...[0, 1, 2, 3, 4, 5].map((i) => crab(i)), crab(0, true)];
export const URCHIN_FRAMES: readonly PixelMap[] = [...[0, 1, 2, 3].map((i) => urchin(i)), urchin(0, true)];
export const GULL_FRAMES: readonly PixelMap[] = [...[-6, -3, 0, 4, 1, -3].map((w) => gull(w)), gull(0, 'dive'), gull(0, 'hit')];

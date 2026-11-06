// Placeholder item icons drawn in code (original designs), 16 x 16 each, in the
// order of ITEM_FRAME: banana, berry, pineapple, mango, slingshot, starfruit,
// Sun Coin, crate. Matches prompt 4 in ART_PROMPTS.md (items.png).

import type { PixelMap } from '../pixels';
import { PixelGrid } from './draw';

const PAL = {
  o: '#3a2418', // outline
  y: '#f8d84a', // yellow
  Y: '#fff2a0', // yellow light
  g: '#5cb84a', // leaf green
  G: '#2e7a3a', // leaf dark
  r: '#d83a5a', // berry red
  R: '#ff8aa0', // berry light
  a: '#f0a030', // orange (pineapple, mango)
  A: '#ffd080', // orange light
  b: '#9a5a2a', // wood
  B: '#d0904a', // wood light
  s: '#e8e0c8', // band / string
  k: '#2a1a10', // dark detail
};

function banana(): PixelGrid {
  const g = new PixelGrid(16, 16);
  for (let i = 0; i < 10; i++) {
    const x = 3 + i;
    const y = 11 - Math.round(Math.sin((i / 9) * Math.PI) * 4);
    g.rect(x, y - 1, 1, 3, 'y');
    g.set(x, y - 1, 'Y');
  }
  g.rect(12, 5, 2, 2, 'G'); // stalk
  return g;
}

function berry(): PixelGrid {
  const g = new PixelGrid(16, 16);
  for (const [cx, cy] of [[6, 10], [10, 10], [8, 7], [8, 12]]) g.ellipse(cx, cy, 2.4, 2.4, 'r');
  for (const [cx, cy] of [[5, 9], [9, 9], [7, 6]]) g.set(cx, cy, 'R');
  g.rect(7, 2, 2, 3, 'G');
  g.rect(9, 3, 3, 1, 'g');
  return g;
}

function pineapple(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.ellipse(8, 10.5, 4, 4.5, 'a');
  for (let y = 7; y < 15; y += 2) for (let x = 5 + (y % 4 === 1 ? 1 : 0); x < 12; x += 2) g.set(x, y, 'A');
  for (const [x, h] of [[6, 3], [8, 5], [10, 3]]) g.rect(x, 6 - h, 1, h, 'g');
  g.rect(7, 3, 3, 2, 'G');
  return g;
}

function mango(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.ellipse(8, 9.5, 5, 4.5, 'a');
  g.ellipse(10, 11, 2.5, 2, 'r'); // blush
  g.ellipse(6, 7.5, 1.5, 1, 'A'); // shine
  g.rect(8, 3, 1, 2, 'G');
  g.rect(9, 3, 3, 2, 'g'); // leaf
  return g;
}

function slingshot(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(7, 9, 2, 6, 'b'); // handle
  for (let i = 0; i < 5; i++) {
    g.set(6 - i, 8 - i, 'b'); // left arm
    g.set(9 + i, 8 - i, 'b');
    g.set(7 - i, 8 - i, 'B');
    g.set(10 + i, 8 - i, 'B');
  }
  g.rect(3, 5, 10, 1, 's'); // band
  g.rect(7, 4, 2, 2, 'k'); // pouch
  return g;
}

function starfruit(): PixelGrid {
  const g = new PixelGrid(16, 16);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    for (let r = 0; r <= 6; r += 0.5) g.set(8 + Math.cos(a) * r, 8.5 + Math.sin(a) * r, r < 3 ? 'Y' : 'y');
  }
  g.ellipse(8, 8.5, 3, 3, 'y');
  g.set(7, 7, 'Y');
  g.set(2, 2, 'Y'); // sparkles
  g.set(13, 3, 'Y');
  return g;
}

function coin(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.ellipse(8, 8, 6, 6, 'a');
  g.ellipse(8, 8, 4.5, 4.5, 'y');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.set(8 + Math.cos(a) * 3.5, 8 + Math.sin(a) * 3.5, 'A'); // the sun's rays
  }
  g.ellipse(8, 8, 2, 2, 'Y');
  g.set(7, 8, 'k'); // a little sun face
  g.set(9, 8, 'k');
  return g;
}

function crate(): PixelGrid {
  const g = new PixelGrid(16, 16);
  g.rect(1, 1, 14, 14, 'b');
  g.rect(1, 1, 14, 1, 'B');
  g.rect(1, 1, 1, 14, 'B');
  g.rect(1, 5, 14, 1, 'k'); // planks
  g.rect(1, 10, 14, 1, 'k');
  g.ellipse(8, 8, 2.5, 2.5, 'y'); // the sun stamp
  for (const [x, y] of [[8, 4], [8, 12], [4, 8], [12, 8]]) g.set(x, y, 'y');
  return g;
}

export const ITEM_ICONS: readonly PixelMap[] = [banana, berry, pineapple, mango, slingshot, starfruit, coin, crate].map((draw) => {
  const g = draw();
  g.outline('o');
  return g.toMap(PAL);
});

// The display along the top: Pip's head and lives, the score, fruit, the three
// Sun Coins (faint until found) and the framed Sun Meter.

import type { Renderer } from '../core/renderer';
import type { RunState } from '../game/run-state';
import { RUN } from '../game/tuning';
import { ITEM_FRAME } from '../actors/items';
import { ICON } from '../gfx/art/code/ui-art';
import type { ArtLibrary } from '../gfx/art/library';
import { UI } from '../gfx/palette';

const BAR_H = 22; // px
const BAR_TOP = '#2a2048';
const BAR_BOTTOM = '#1a1430';
const EDGE = '#5a4a8a';
const METER_W = 92; // px
const SUN = '#ffb030';
const SUN_LIGHT = '#ffe070';
const SUN_LOW = '#ff5a4a';
const FRAME = '#0e0a1c';

export function drawHud(r: Renderer, run: RunState, art: ArtLibrary, coinsInLevel: number, time: number): void {
  // A two-tone bar with a light edge underneath.
  r.rect(0, 0, r.width, BAR_H / 2, BAR_TOP);
  r.rect(0, BAR_H / 2, r.width, BAR_H / 2, BAR_BOTTOM);
  r.rect(0, BAR_H, r.width, 1, EDGE);
  r.rect(0, BAR_H + 1, r.width, 1, FRAME);
  const items = art.sheet('items');
  const icons = art.sheet('icons');
  const coin = art.sheet('coin');

  // Lives.
  r.sprite(icons, ICON.pip, 6, 5);
  r.textShadow(`x${run.lives}`, 20, 7, UI.WHITE);

  // Score.
  r.textShadow(String(run.score).padStart(7, '0'), 64, 7, UI.YELLOW);

  // Fruit.
  r.sprite(items, ITEM_FRAME.banana, 140, 3);
  r.textShadow(`x${String(run.fruit).padStart(2, '0')}`, 157, 7, UI.WHITE);

  // Sun Coins: each slot shows a faint coin until it's found, then a bright, gently turning one.
  for (let i = 0; i < coinsInLevel; i++) {
    const x = 206 + i * 17;
    if (run.coins.has(i)) r.sprite(coin, Math.floor(time * 8 + i * 2) % coin.frames, x, 3);
    else r.withAlpha(0.25, () => r.sprite(coin, 0, x, 3));
  }

  if (run.relaxed) {
    r.textShadow('RELAXED', r.width - 6, 7, UI.GREY, 'right');
    return;
  }
  // The Sun Meter: a sun icon, then a framed bar with a shine; it flashes red when low.
  const x = r.width - METER_W - 8;
  r.sprite(icons, ICON.sun, x - 16, 5);
  r.rect(x - 2, 5, METER_W + 4, 12, FRAME);
  r.rect(x - 1, 6, METER_W + 2, 10, '#3a2a18');
  const low = run.sun < RUN.SUN_LOW;
  const w = Math.round(METER_W * run.sun);
  if (w > 0) {
    const flash = low && Math.floor(time * 4) % 2 === 0;
    r.rect(x, 7, w, 8, flash ? SUN_LOW : SUN);
    r.rect(x, 7, w, 2, flash ? '#ffb0a0' : SUN_LIGHT); // the shine on top
    r.rect(x, 13, w, 2, flash ? '#c03a30' : '#e08a20'); // shade underneath
  }
  for (let m = 1; m < 4; m++) r.rect(x + Math.round((METER_W * m) / 4), 7, 1, 8, FRAME); // quarter marks
}

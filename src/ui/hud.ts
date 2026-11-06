// The display along the top: lives, score, fruit, the three Sun Coins and the Sun Meter.

import type { Renderer } from '../core/renderer';
import type { RunState } from '../game/run-state';
import { RUN } from '../game/tuning';
import { ITEM_FRAME } from '../actors/items';
import type { ArtLibrary } from '../gfx/art/library';
import { UI } from '../gfx/palette';

const BAR_H = 20; // px, height of the dark strip
const METER_W = 96; // px
const SUN = '#ffb030';
const SUN_LIGHT = '#ffe070';

export function drawHud(r: Renderer, run: RunState, art: ArtLibrary, coinsInLevel: number, time: number): void {
  r.rect(0, 0, r.width, BAR_H, UI.INK);
  r.rect(0, BAR_H, r.width, 1, UI.BLACK);
  const items = art.sheet('items');

  r.text(`PIP x${run.lives}`, 6, 6, UI.WHITE);
  r.text(String(run.score).padStart(7, '0'), 90, 6, UI.YELLOW);

  r.sprite(items, ITEM_FRAME.banana, 168, 2);
  r.text(`x${run.fruit}`, 186, 6, UI.WHITE);

  for (let i = 0; i < coinsInLevel; i++) {
    const x = 240 + i * 18;
    if (run.coins.has(i)) r.sprite(items, ITEM_FRAME.coin, x, 2);
    else r.rect(x + 4, 6, 8, 8, UI.GREY); // an empty slot
  }

  if (run.relaxed) {
    r.text('RELAXED', r.width - 6, 6, UI.GREY, 'right');
    return;
  }
  // The Sun Meter: blinks when low.
  const x = r.width - METER_W - 8;
  r.text('SUN', x - 30, 6, UI.WHITE);
  r.rect(x - 1, 5, METER_W + 2, 10, UI.BLACK);
  const low = run.sun < RUN.SUN_LOW;
  const show = !low || Math.floor(time * 4) % 2 === 0;
  if (show) {
    const w = Math.round(METER_W * run.sun);
    r.rect(x, 6, w, 8, SUN);
    r.rect(x, 6, w, 2, SUN_LIGHT);
  }
}

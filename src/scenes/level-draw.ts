// Drawing for a level: tiles, crates, items, enemies, Pip, the display and the
// GAME OVER card. Reads the scene's state; changes nothing.

import type { Renderer } from '../core/renderer';
import { ITEM_FRAME } from '../actors/items';
import type { PipPose } from '../actors/pip-physics';
import { HERO_FRAME } from '../gfx/art/assets';
import { UI } from '../gfx/palette';
import { FORMS, PIP } from '../game/tuning';
import { TILE } from '../world/tiles';
import { drawHud } from '../ui/hud';
import type { LevelScene } from './level-scene';

const PLANK = '#a8683a';
const PLANK_LIGHT = '#d8985a';
const CORAL = '#f06a8a';
const CORAL_LIGHT = '#ffb0c4';
const STONE = '#9a96a8';
const STONE_DARK = '#5e5a6e';
const USED = '#7a5a3a';
const USED_DARK = '#4a3424';
const SEED = '#6a3a1a';
const SLING_BAND = '#3ec060';
const STAR_GLOW = '#fff2a0';
const POLE_H = 3 * TILE; // px, checkpoint post height

export function drawLevel(r: Renderer, s: LevelScene): void {
  const cx = Math.round(s.camera.x);
  const cy = Math.round(s.camera.y);
  // Sky: fixed bands for now (parallax backgrounds come with the art).
  r.rect(0, 0, r.width, 90, UI.SKY_TOP);
  r.rect(0, 90, r.width, 80, UI.SKY_MID);
  r.rect(0, 170, r.width, r.height - 170, UI.SKY_LOW);
  drawTiles(r, s, cx, cy);
  drawStartMarks(r, s, cx, cy);
  drawCheckpoints(r, s, cx, cy);
  drawFlag(r, s, cx, cy);
  drawItems(r, s, cx, cy);
  drawEnemies(r, s, cx, cy);
  for (const pod of s.pods) r.rect(pod.x - 2 - cx, pod.y - 2 - cy, 4, 4, SEED);
  drawPip(r, s, cx, cy);

  drawHud(r, s.run, s.art, s.level.coins.length, s.time);
  if (s.invincible) r.text('INVINCIBLE (DEBUG)', r.width - 8, 26, UI.YELLOW, 'right');
  if (s.showName) r.text(s.level.name, r.width / 2, 40, UI.WHITE, 'center', 2);
  if (s.finished) r.text('END FLAG REACHED!', r.width / 2, 40, UI.YELLOW, 'center', 2);
  if (s.gameOver > 0) {
    r.rect(0, 100, r.width, 60, UI.INK);
    r.text('GAME OVER', r.width / 2, 116, UI.WHITE, 'center', 3);
  }
}

function drawPip(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const p = s.pip;
  const f = s.form;
  // Blinking after a hit (and while debug-invincible): skip every other moment.
  const blinking = f.blink > 0 || s.invincible;
  if (blinking && Math.floor(s.time * 12) % 2 === 0) return;
  const sheet = s.art.sheet(p.h > PIP.HEIGHT ? 'heroBig' : 'hero');
  const x = p.feetX - sheet.frameW / 2 - cx;
  const y = p.feetY - sheet.frameH - cy;
  if (f.star > 0) {
    // Starfruit: a flickering glow, slowing down as it runs out.
    const rate = f.star < FORMS.STARFRUIT_ENDING ? 6 : 16;
    if (Math.floor(s.time * rate) % 2 === 0) r.rect(x + 1, y + 1, sheet.frameW - 2, sheet.frameH - 1, STAR_GLOW);
  }
  const frame = s.dying > 0 ? HERO_FRAME.rise : frameFor(s, p.pose);
  r.sprite(sheet, frame, x, y, p.facingLeft, s.dying > 0);
  if (f.canThrow && s.dying <= 0) r.rect(x + 4, y + Math.round(sheet.frameH * 0.55), sheet.frameW - 8, 2, SLING_BAND);
}

function frameFor(s: LevelScene, pose: PipPose): number {
  if (pose === 'walk' || pose === 'run') return Math.floor(s.pip.stride / PIP.STRIDE) % 2 ? HERO_FRAME.step : HERO_FRAME.stand;
  return HERO_FRAME[pose];
}

function drawItems(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const sheet = s.art.sheet('items');
  for (const it of s.items) {
    const bob = it.moving ? 0 : Math.round(Math.sin(s.time * 3 + it.x * 0.05) * 1.5);
    const x = it.x - sheet.frameW / 2 - cx;
    if (x < -sheet.frameW || x > r.width) continue;
    r.sprite(sheet, it.frame, x, it.y - sheet.frameH / 2 - cy + bob);
  }
}

function drawEnemies(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  for (const e of s.enemies) {
    if (e.defeated) continue;
    const sheet = s.art.sheet(e.kind);
    const x = e.x + e.w / 2 - sheet.frameW / 2 - cx;
    if (x < -sheet.frameW || x > r.width) continue;
    if (e.squash > 0) {
      r.rect(x + 2, e.y + e.h - 4 - cy, sheet.frameW - 4, 4, UI.INK); // squashed flat
      continue;
    }
    r.sprite(sheet, e.frame, x, e.y + e.h - sheet.frameH - cy, !e.facingLeft);
  }
}

/** Only the tiles on screen. */
function drawTiles(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const L = s.level;
  const items = s.art.sheet('items');
  const tx0 = Math.floor(cx / TILE);
  const ty0 = Math.floor(cy / TILE);
  for (let ty = ty0; ty <= ty0 + Math.ceil(r.height / TILE); ty++) {
    for (let tx = tx0; tx <= tx0 + Math.ceil(r.width / TILE); tx++) {
      if (tx < 0 || tx >= L.cols) continue;
      const t = L.tileAt(tx, ty);
      const x = tx * TILE - cx;
      const y = ty * TILE - cy;
      switch (t) {
        case 'air':
          break;
        case 'oneway':
          r.rect(x, y, TILE, 5, PLANK);
          r.rect(x, y, TILE, 1, PLANK_LIGHT);
          r.rect(x + 2, y + 5, 2, 3, PLANK); // little supports
          r.rect(x + TILE - 4, y + 5, 2, 3, PLANK);
          break;
        case 'spikes':
          for (let i = 0; i < 3; i++) {
            const px = x + 2 + i * 4;
            for (let h = 0; h < 10; h++) r.rect(px + Math.floor(h / 3), y + TILE - 1 - h, Math.max(1, 4 - Math.floor((2 * h) / 3)), 1, h > 6 ? CORAL_LIGHT : CORAL);
          }
          break;
        case 'crate':
          r.sprite(items, ITEM_FRAME.crate, x, y);
          break;
        case 'used':
          r.rect(x, y, TILE, TILE, USED_DARK);
          r.rect(x + 1, y + 1, TILE - 2, TILE - 2, USED);
          break;
        case 'cracked':
          r.rect(x, y, TILE, TILE, STONE);
          r.rect(x, y + TILE - 2, TILE, 2, STONE_DARK);
          r.rect(x + 4, y + 2, 1, 5, STONE_DARK); // the cracks
          r.rect(x + 5, y + 7, 4, 1, STONE_DARK);
          r.rect(x + 9, y + 7, 1, 6, STONE_DARK);
          break;
        case 'ground':
          r.rect(x, y, TILE, TILE, UI.SAND);
          if (L.tileAt(tx, ty - 1) !== 'ground') {
            r.rect(x, y, TILE, 4, UI.GRASS);
            r.rect(x, y + 4, TILE, 2, UI.GRASS_DARK);
          }
          break;
      }
    }
  }
}

/** Height marks at 1 to 5 tiles above the start, to judge jumps. */
function drawStartMarks(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const st = s.level.start;
  for (let n = 1; n <= 5; n++) {
    const y = st.y - n * TILE - cy;
    r.rect(st.x - 40 - cx, y, 10, 1, UI.WHITE);
    r.text(String(n), st.x - 28 - cx, y - 4, UI.WHITE);
  }
}

/** A post with a flag: down until passed, then up. */
function drawCheckpoints(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  s.level.checkpoints.forEach((c, i) => {
    const x = c.x - cx;
    const y = c.y - cy;
    const up = i < s.checkpointsReached;
    r.rect(x, y - POLE_H, 2, POLE_H, UI.GREY);
    r.rect(x + 2, up ? y - POLE_H : y - 12, 10, 7, up ? UI.GREEN : UI.WHITE);
  });
}

function drawFlag(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const f = s.level.flag;
  if (!f) return;
  const x = f.x - cx;
  const y = f.y - cy;
  r.rect(x, y - 4 * TILE, 2, 4 * TILE, UI.WHITE);
  r.rect(x + 2, y - 4 * TILE, 14, 9, s.finished ? UI.GREEN : UI.YELLOW);
}

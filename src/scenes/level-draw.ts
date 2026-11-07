// Drawing for a level: tiles, crates, items, enemies, Pip, the display and the
// GAME OVER card. Reads the scene's state; changes nothing.

import type { Renderer } from '../core/renderer';
import { BEACH_TILE } from '../gfx/art/code/tiles-beach';
import { GroundTiles } from '../gfx/art/ground-tiles';
import type { Variant } from '../gfx/art/palettes';
import { UI } from '../gfx/palette';
import { FORMS } from '../game/tuning';
import { TILE } from '../world/tiles';
import { drawHud } from '../ui/hud';
import type { LevelScene } from './level-scene';

const SEED = '#6a3a1a';
const ground = new GroundTiles();
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
  if ((f.blink > 0 || s.invincible) && !s.anim.flashing && Math.floor(s.time * 12) % 2 === 0) return;
  // The white flash on a hit; the Starfruit shimmer (slower as it runs out).
  let variant: Variant = 'normal';
  if (s.anim.flashing) variant = 'flash';
  else if (f.star > 0) variant = Math.floor(s.time * (f.star < FORMS.STARFRUIT_ENDING ? 6 : 16)) % 2 ? 'starA' : 'starB';
  const sheet = s.art.sheet(f.canThrow ? 'pipSling' : f.big ? 'pipBig' : 'pip', variant);
  const x = p.feetX - sheet.frameW / 2 - cx;
  const y = p.feetY - sheet.frameH - cy;
  r.sprite(sheet, s.anim.frame(s.animState), x, y, p.facingLeft, s.dying > 0);
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

/** Only the tiles on screen. Ground is auto-tiled from its neighbours. */
function drawTiles(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const L = s.level;
  const sheet = s.art.sheet('tilesBeach');
  const isGround = (tx: number, ty: number) => L.tileAt(tx, ty) === 'ground' || ty >= L.rowsCount; // the ground carries on below the level
  const isPlank = (tx: number, ty: number) => L.tileAt(tx, ty) === 'oneway';
  const tx0 = Math.floor(cx / TILE);
  const ty0 = Math.floor(cy / TILE);
  for (let ty = ty0; ty <= ty0 + Math.ceil(r.height / TILE); ty++) {
    for (let tx = tx0; tx <= tx0 + Math.ceil(r.width / TILE); tx++) {
      if (tx < 0 || tx >= L.cols) continue;
      const x = tx * TILE - cx;
      const y = ty * TILE - cy;
      switch (L.tileAt(tx, ty)) {
        case 'ground':
          r.image(
            ground.get(
              {
                n: isGround(tx, ty - 1),
                e: isGround(tx + 1, ty) || tx + 1 >= L.cols,
                s: isGround(tx, ty + 1),
                w: isGround(tx - 1, ty) || tx === 0,
                nw: isGround(tx - 1, ty - 1),
                ne: isGround(tx + 1, ty - 1),
              },
              tx,
              ty,
            ),
            x,
            y,
          );
          break;
        case 'oneway': {
          const left = isPlank(tx - 1, ty);
          const right = isPlank(tx + 1, ty);
          const piece = left && right ? 'plankMid' : left ? 'plankRight' : right ? 'plankLeft' : 'plankOne';
          r.sprite(sheet, BEACH_TILE[piece], x, y);
          break;
        }
        case 'spikes':
          r.sprite(sheet, BEACH_TILE.spikes, x, y);
          break;
        case 'crate':
          r.sprite(sheet, BEACH_TILE.crate, x, y);
          break;
        case 'used':
          r.sprite(sheet, BEACH_TILE.used, x, y);
          break;
        case 'cracked':
          r.sprite(sheet, BEACH_TILE.cracked, x, y);
          break;
        case 'air':
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

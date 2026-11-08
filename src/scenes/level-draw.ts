// Drawing for a level: tiles, crates, items, enemies, Pip, the display and the
// GAME OVER card. Reads the scene's state; changes nothing.

import type { Renderer } from '../core/renderer';
import { BEACH_TILE, decorFor } from '../gfx/art/code/tiles-beach';
import { GroundTiles } from '../gfx/art/ground-tiles';
import type { Variant } from '../gfx/art/palettes';
import { UI } from '../gfx/palette';
import { FLAG_FRAME } from '../gfx/art/code/ui-art';
import { POPUP_TIME } from './level-scene';
import { FORMS, FX, PARALLAX, WATER } from '../game/tuning';
import { ENEMY_FRAME } from '../gfx/art/code/enemies';
import { cycleIndex, layerStart } from '../gfx/fx/parallax';
import { TILE } from '../world/tiles';
import { drawHud } from '../ui/hud';
import type { LevelScene } from './level-scene';

const SEED = '#6a3a1a';
const ground = new GroundTiles();

const WATER_SHADES = ['#3e8ed8', '#5aa8ec', '#8cd0f0', '#5aa8ec']; // the rippling surface cycles through these
const WATER_BODY = '#2e6cb8';

export function drawLevel(r: Renderer, s: LevelScene): void {
  // Screen shake: a small, quickly changing offset.
  const shakeX = s.shake > 0 ? Math.round(Math.sin(s.time * 90) * FX.SHAKE_SIZE) : 0;
  const shakeY = s.shake > 0 ? Math.round(Math.cos(s.time * 70) * FX.SHAKE_SIZE) : 0;
  const cx = Math.round(s.camera.x) + shakeX;
  const cy = Math.round(s.camera.y) + shakeY;
  drawBackground(r, s, cx, cy);
  drawTiles(r, s, cx, cy);
  drawCheckpoints(r, s, cx, cy);
  drawFlag(r, s, cx, cy);
  drawShadows(r, s, cx, cy);
  drawItems(r, s, cx, cy);
  drawEnemies(r, s, cx, cy);
  for (const pod of s.pods) drawSeed(r, pod.x - cx, pod.y - cy, s.time);
  drawAfterImages(r, s, cx, cy);
  drawPip(r, s, cx, cy);
  drawParticles(r, s, cx, cy);
  drawWater(r, s, cx, cy);
  drawFront(r, s, cx, cy);

  drawHud(r, s.run, s.art, s.level.coins.length, s.time);
  if (s.invincible) r.text('INVINCIBLE (DEBUG)', r.width - 8, 26, UI.YELLOW, 'right');
  drawPopups(r, s, cx, cy);
  if (s.showName) drawNameCard(r, s);
  if (s.finished) drawClearBanner(r, s);
  if (s.gameOver > 0) {
    r.rect(0, 100, r.width, 60, UI.INK);
    r.text('GAME OVER', r.width / 2, 116, UI.WHITE, 'center', 3);
  }
}

/** Sky, far islands and sea, clouds and the palm row, each scrolling at its own speed. */
function drawBackground(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  r.sprite(s.art.sheet('bgSky'), 0, 0, 0);
  const far = s.art.sheet('bgFar');
  const farFrame = Math.floor(s.time * 3) % far.frames; // wave glints cycle colour
  const farY = 128 - Math.round(cy * 0.1);
  for (let x = layerStart(cx, PARALLAX.FAR, far.frameW); x < r.width; x += far.frameW) r.sprite(far, farFrame, x, farY);
  const clouds = s.art.sheet('bgClouds');
  const cloudY = 22 - Math.round(cy * 0.05);
  for (let x = layerStart(cx, PARALLAX.CLOUDS, clouds.frameW, s.time * PARALLAX.CLOUD_DRIFT); x < r.width; x += clouds.frameW) r.sprite(clouds, 0, x, cloudY);
  // The hazy far row of palms stands on a strip of beach in front of the sea.
  const midFar = s.art.sheet('bgMidFar');
  const swayFar = Math.floor(s.time / PARALLAX.SWAY_TIME + 1) % midFar.frames;
  const midFarY = farY + 4;
  for (let x = layerStart(cx, PARALLAX.MID_FAR, midFar.frameW); x < r.width; x += midFar.frameW) r.sprite(midFar, swayFar, x, midFarY);
  // The near palm row: its dunes tuck just under the play ground, so the trunks rise above it.
  const mid = s.art.sheet('bgMid');
  const sway = Math.floor(s.time / PARALLAX.SWAY_TIME) % mid.frames;
  const midY = 126 - Math.round(cy * 0.6);
  for (let x = layerStart(cx, PARALLAX.MID, mid.frameW); x < r.width; x += mid.frameW) r.sprite(mid, sway, x, midY);
}

/** Now and then a palm passes in front of everything (but never over the display at the top). */
function drawFront(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const front = s.art.sheet('bgFront');
  const first = Math.floor((cx * PARALLAX.FRONT) / PARALLAX.FRONT_EVERY) - 1;
  for (let i = first; i <= first + 3; i++) {
    const x = i * PARALLAX.FRONT_EVERY + PARALLAX.FRONT_EVERY / 2 - cx * PARALLAX.FRONT;
    if (x < -front.frameW || x > r.width) continue;
    r.withAlpha(PARALLAX.FRONT_ALPHA, () => r.sprite(front, 0, x, r.height - front.frameH + 30 - Math.round(cy * 0.2)));
  }
}

/** Sea water over everything in it, see-through, with a rippling surface. */
function drawWater(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const L = s.level;
  const tx0 = Math.floor(cx / TILE);
  const ty0 = Math.floor(cy / TILE);
  r.withAlpha(WATER.ALPHA, () => {
    for (let ty = ty0; ty <= ty0 + Math.ceil(r.height / TILE); ty++) {
      for (let tx = tx0; tx <= tx0 + Math.ceil(r.width / TILE); tx++) {
        if (L.tileAt(tx, ty) !== 'water') continue;
        const x = tx * TILE - cx;
        const y = ty * TILE - cy;
        r.rect(x, y, TILE, TILE, WATER_BODY);
        if (L.tileAt(tx, ty - 1) === 'water') continue;
        // The surface: colour bands that step round (colour cycling), so it looks like it ripples.
        for (let band = 0; band < 4; band++) {
          for (let seg = 0; seg < 4; seg++) {
            const c = WATER_SHADES[cycleIndex(band + seg + tx, s.time, WATER.CYCLE_SPEED, WATER_SHADES.length)];
            r.rect(x + seg * 4, y + band, 4, 1, c);
          }
        }
      }
    }
  });
}

function drawAfterImages(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  if (!s.afterImages.length) return;
  const f = s.form;
  const sheet = s.art.sheet(f.canThrow ? 'pipSling' : f.big ? 'pipBig' : 'pip');
  for (const a of s.afterImages) {
    const fade = 0.35 * (1 - a.age / (FX.AFTERIMAGES * FX.AFTERIMAGE_GAP));
    r.withAlpha(fade, () => r.sprite(sheet, a.frame, a.x - sheet.frameW / 2 - cx, a.y - sheet.frameH - cy, a.flip));
  }
}

function drawParticles(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  for (const p of s.particles.list) {
    const size = p.kind === 'dust' ? (p.age < p.life * 0.5 ? 3 : 2) : p.kind === 'sparkle' ? 1 : 2;
    const x = Math.round(p.x - cx);
    const y = Math.round(p.y - cy);
    if (p.kind === 'sparkle' || p.kind === 'star') {
      // A little plus shape.
      r.rect(x - 1, y, 3, 1, p.colour);
      r.rect(x, y - 1, 1, 3, p.colour);
    } else {
      r.rect(x, y, size, size, p.colour);
    }
  }
}

function drawPip(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const p = s.pip;
  const f = s.form;
  // Blinking after a hit (and while debug-invincible): skip every other moment.
  if ((f.blink > 0 || s.invincible) && !s.anim.flashing && Math.floor(s.time * 12) % 2 === 0) return;
  // The white flash on a hit; the Starfruit shimmer (slower as it runs out).
  let variant: Variant = 'normal';
  // Calm mode: no white flash, and a slow shimmer.
  if (s.anim.flashing && !s.calm) variant = 'flash';
  else if (f.star > 0) variant = Math.floor(s.time * (s.calm ? 2 : f.star < FORMS.STARFRUIT_ENDING ? 6 : 16)) % 2 ? 'starA' : 'starB';
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
    if (it.kind === 'coin') {
      const coin = s.art.sheet('coin');
      r.sprite(coin, Math.floor(s.time * 10 + it.index * 2) % coin.frames, x, it.y - coin.frameH / 2 - cy + bob);
    } else {
      r.sprite(sheet, it.frame, x, it.y - sheet.frameH / 2 - cy + bob);
    }
  }
}

function drawEnemies(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  for (const e of s.enemies) {
    if (e.defeated) continue;
    const sheet = s.art.sheet(e.kind);
    const x = e.x + e.w / 2 - sheet.frameW / 2 - cx;
    if (x < -sheet.frameW || x > r.width) continue;
    const frame = e.squash > 0 ? ENEMY_FRAME[e.kind].hit : e.frame; // the hit face, just before it pops
    r.sprite(sheet, frame, x, e.y + e.h - sheet.frameH - cy, !e.facingLeft);
  }
}

/** Only the tiles on screen. Ground is auto-tiled from its neighbours. */
function drawTiles(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const L = s.level;
  const sheet = s.art.sheet('tilesBeach');
  const decor = s.art.sheet('decorBeach');
  const isGround = (tx: number, ty: number) => L.tileAt(tx, ty) === 'ground' || ty >= L.rowsCount; // the ground carries on below the level
  const isPlank = (tx: number, ty: number) => L.tileAt(tx, ty) === 'oneway';
  // Inside a pit: nothing solid below (it keeps going down), and ground at this height on both sides close by.
  const groundNear = (tx: number, ty: number, dir: number) => {
    for (let k = 1; k <= 8; k++) if (L.tileAt(tx + dir * k, ty) === 'ground') return true;
    return false;
  };
  const isPitBack = (tx: number, ty: number): boolean => {
    const t = L.tileAt(tx, ty);
    if (t !== 'air' && t !== 'water') return false;
    if (L.isFloor(tx, ty + 1) || L.tileAt(tx, ty + 1) === 'spikes') return false;
    return groundNear(tx, ty, -1) && groundNear(tx, ty, 1) && ty >= surfaceRow(tx);
  };
  // The ground's top near this column (so back walls only start where the ground does).
  const surfaceRow = (tx: number): number => {
    let best = L.rowsCount;
    for (const dx of [-1, 1]) {
      for (let k = 1; k <= 8; k++) {
        const col = tx + dx * k;
        if (col < 0 || col >= L.cols) break;
        let top = -1;
        for (let row = 0; row < L.rowsCount; row++) if (L.tileAt(col, row) === 'ground') {
          top = row;
          break;
        }
        if (top >= 0) {
          best = Math.min(best, Math.max(top, 0));
          break;
        }
      }
    }
    return best;
  };
  const tx0 = Math.floor(cx / TILE);
  const ty0 = Math.floor(cy / TILE);
  for (let ty = ty0; ty <= ty0 + Math.ceil(r.height / TILE); ty++) {
    for (let tx = tx0; tx <= tx0 + Math.ceil(r.width / TILE); tx++) {
      if (tx < 0 || tx >= L.cols) continue;
      const x = tx * TILE - cx;
      const y = ty * TILE - cy;
      switch (L.tileAt(tx, ty)) {
        case 'ground':
          // A tuft, flower or shell on some of the tiles with open air above.
          if (!isGround(tx, ty - 1) && L.tileAt(tx, ty - 1) === 'air') {
            const d = decorFor(tx, ty);
            if (d !== null) r.sprite(decor, d, x, y - 8);
          }
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
        case 'water': // water itself is drawn over everything later, see-through
          if (isPitBack(tx, ty)) r.image(ground.back(tx, ty, !isPitBack(tx, ty - 1)), x, y);
          break;
      }
    }
  }
}

/** Checkpoint posts: the flag waits low and grey, then flies high and green once passed. */
function drawCheckpoints(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const sheet = s.art.sheet('flags');
  const wave = Math.floor(s.time * 6) % 3;
  s.level.checkpoints.forEach((c, i) => {
    const up = i < s.checkpointsReached;
    r.sprite(sheet, (up ? FLAG_FRAME.cpUp : FLAG_FRAME.cpDown) + wave, c.x - 5 - cx, c.y - sheet.frameH - cy);
  });
}

/** The goal flag, waving. */
function drawFlag(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const f = s.level.flag;
  if (!f) return;
  const sheet = s.art.sheet('flags');
  r.sprite(sheet, FLAG_FRAME.goal + (Math.floor(s.time * 6) % 3), f.x - 5 - cx, f.y - sheet.frameH - cy);
}

/** Soft shadows on the ground under Pip, enemies and items (smaller and fainter the higher they are). */
function drawShadows(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  const L = s.level;
  const shadow = (x: number, feet: number, w: number) => {
    const col = Math.floor(x / TILE);
    let row = Math.floor((feet - 1) / TILE);
    // Find the ground below (within 4 tiles).
    for (let k = 0; k < 5 && !L.isFloor(col, row); k++) row++;
    if (!L.isFloor(col, row)) return;
    const ground = row * TILE;
    const lift = Math.max(0, ground - feet);
    const scale = Math.max(0.3, 1 - lift / 70);
    const half = Math.round((w / 2) * scale);
    r.withAlpha(0.28 * scale, () => {
      r.rect(x - half - cx, ground - 1 - cy, half * 2, 2, UI.INK);
      r.rect(x - half + 2 - cx, ground + 1 - cy, half * 2 - 4, 1, UI.INK);
    });
  };
  if (s.dying <= 0) shadow(s.pip.feetX, s.pip.feetY, 16);
  for (const e of s.enemies) if (!e.defeated && e.kind !== 'gull') shadow(e.x + e.w / 2, e.y + e.h, e.w);
  for (const e of s.enemies) if (!e.defeated && e.kind === 'gull') shadow(e.x + e.w / 2, e.y + e.h, e.w * 0.8);
  for (const it of s.items) shadow(it.x, it.y + 6, 10);
}

/** A seed pod: a round brown seed with a highlight, tumbling. */
function drawSeed(r: Renderer, x: number, y: number, time: number): void {
  r.rect(x - 2, y - 3, 4, 6, SEED);
  r.rect(x - 3, y - 2, 6, 4, SEED);
  const spin = Math.floor(time * 16) % 4;
  r.rect(x - 1 + (spin === 1 || spin === 2 ? 1 : 0), y - 2 + (spin >= 2 ? 1 : 0), 1, 1, '#d8a060');
}

/** Scores floating up from where they were earned, fading at the end. */
function drawPopups(r: Renderer, s: LevelScene, cx: number, cy: number): void {
  for (const pop of s.popups) {
    const fade = pop.age > POPUP_TIME * 0.6 ? 1 - (pop.age - POPUP_TIME * 0.6) / (POPUP_TIME * 0.4) : 1;
    const colour = pop.text === '1UP' ? UI.GREEN : pop.text.length >= 4 ? UI.YELLOW : UI.WHITE;
    r.withAlpha(Math.max(0, fade), () => r.textShadow(pop.text, pop.x - cx, pop.y - cy, colour, 'center'));
  }
}

/** The level's name on a ribbon at the start, sliding away at the end. */
function drawNameCard(r: Renderer, s: LevelScene): void {
  const fadeOut = Math.max(0, s.time - 2) / 0.5;
  const y = 44 - Math.round(fadeOut * 60);
  const w = Math.max(200, s.level.name.length * 16 + 40);
  const x = Math.round(r.width / 2 - w / 2);
  r.withAlpha(0.85, () => {
    r.rect(x, y, w, 40, '#1a1430');
    r.rect(x, y, w, 2, '#5a4a8a');
    r.rect(x, y + 38, w, 2, '#5a4a8a');
  });
  r.textShadow(s.level.name, r.width / 2, y + 8, UI.YELLOW, 'center', 2, UI.INK, true);
  r.textShadow('REACH THE FLAG!', r.width / 2, y + 27, UI.WHITE, 'center');
}

/** At the flag: a banner with how the level went. */
function drawClearBanner(r: Renderer, s: LevelScene): void {
  const slide = Math.min(1, s.clearTime / 0.3);
  const y = Math.round(-50 + slide * 92);
  r.withAlpha(0.85, () => {
    r.rect(0, y, r.width, 46, '#1a1430');
    r.rect(0, y, r.width, 2, UI.YELLOW);
    r.rect(0, y + 44, r.width, 2, UI.YELLOW);
  });
  r.textShadow('COURSE CLEAR!', r.width / 2, y + 7, UI.YELLOW, 'center', 2, UI.INK, true);
  const coins = `${s.run.coins.size}/${s.level.coins.length}`;
  r.textShadow(`FRUIT ${s.run.fruit}   SUN COINS ${coins}   SCORE ${s.run.score}`, r.width / 2, y + 30, UI.WHITE, 'center');
}

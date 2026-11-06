// Plays one level: Pip, the tiles, the camera, enemies, spikes, checkpoints
// and the end flag. Lives, items and score join in Phase 4.

import type { InputSnapshot } from '../core/input';
import type { Renderer } from '../core/renderer';
import type { Scene } from '../core/scene';
import { touchEnemy, touchesHazard } from '../actors/combat';
import { readControls } from '../actors/controls';
import type { Enemy } from '../actors/enemies/enemy';
import { makeEnemy } from '../actors/enemies';
import { PipPhysics, type PipPose } from '../actors/pip-physics';
import { HERO_FRAME } from '../gfx/art/assets';
import type { ArtLibrary } from '../gfx/art/library';
import { COMBAT, LEVEL, PIP } from '../game/tuning';
import { UI } from '../gfx/palette';
import { Camera } from '../world/camera';
import { Level, type LevelSource, type Spot } from '../world/level';
import { TILE } from '../world/tiles';

const PLANK = '#a8683a';
const PLANK_LIGHT = '#d8985a';
const CORAL = '#f06a8a';
const CORAL_LIGHT = '#ffb0c4';
const FLAG_REACH = 12; // px: touching the flag pole this close counts
const POLE_H = 3 * TILE; // px, checkpoint post height

export class LevelScene implements Scene {
  readonly name = 'LEVEL';
  readonly level: Level;
  readonly pip: PipPhysics;
  readonly camera: Camera;
  readonly enemies: Enemy[];
  /** Has Pip reached the end flag? */
  finished = false;
  /** Times Pip has been hit or fallen (until lives exist in Phase 4). */
  deaths = 0;
  /** Where Pip comes back: the start, then the last checkpoint passed. */
  respawn: Spot;
  /** How many checkpoints are passed (they're in order, left to right). */
  checkpointsReached = 0;
  /** s left of the death spin (0 = alive). */
  dying = 0;
  /** Debug: hits and spikes do nothing (I key with the overlay open). */
  invincible = false;

  constructor(
    src: LevelSource,
    private readonly art: ArtLibrary,
    private readonly onArtToggle: () => void,
    viewW = 480,
    viewH = 270,
    private readonly debugOpen: () => boolean = () => false,
  ) {
    this.level = new Level(src);
    this.respawn = this.level.start;
    this.pip = new PipPhysics(0, 0);
    this.enemies = this.level.enemies.map((e) => makeEnemy(e.kind, e));
    this.placeAt(this.respawn);
    this.camera = new Camera(viewW, viewH, this.level.widthPx, this.level.heightPx, this.pip);
  }

  private placeAt(spot: Spot): void {
    const p = this.pip;
    p.x = spot.x - PIP.WIDTH / 2;
    p.y = spot.y - PIP.HEIGHT;
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
  }

  update(dt: number, input: InputSnapshot): void {
    if (input.justPressed('ART_TOGGLE')) this.onArtToggle();
    if (this.debugOpen() && input.justPressed('DEBUG_INVINCIBLE')) this.invincible = !this.invincible;
    if (this.dying > 0) {
      this.updateDeath(dt);
      return;
    }
    const p = this.pip;
    const feetBefore = p.feetY;
    const controls = readControls(input);
    const { solids, oneWays } = this.level.boxesNear(p.box);
    p.update(dt, controls, solids, oneWays);
    if (p.y > this.level.heightPx + LEVEL.FALL_BELOW) {
      this.comeBack(); // fell in a pit
      return;
    }
    this.updateEnemies(dt, feetBefore, controls.jumpHeld);
    if (this.dying > 0) return;
    if (!this.invincible && touchesHazard(p.box, this.level.hazardsNear(p.box))) {
      this.die();
      return;
    }
    this.passCheckpoints();
    const flag = this.level.flag;
    if (flag && !this.finished && Math.abs(p.feetX - flag.x) < FLAG_REACH && p.feetY > flag.y - 4 * TILE) this.finished = true;
    this.camera.update(dt, p);
  }

  /** Wake enemies near the screen, move them, then see if Pip stomps or gets hit. */
  private updateEnemies(dt: number, feetBefore: number, jumpHeld: boolean): void {
    const p = this.pip;
    const left = this.camera.x - COMBAT.WAKE_MARGIN;
    const right = this.camera.x + this.camera.viewW + COMBAT.WAKE_MARGIN;
    for (const e of this.enemies) {
      if (!e.awake && e.x + e.w > left && e.x < right) e.awake = true;
      if (e.awake) e.update(dt, { level: this.level, pipX: p.feetX, pipY: p.feetY });
    }
    let bounced = false;
    for (const e of this.enemies) {
      if (!e.awake || !e.active) continue;
      const touch = touchEnemy(p.box, p.vy, feetBefore, e.box, e.stompable);
      if (touch === 'stomp' || (touch === 'hurt' && bounced)) {
        // Landing on two at once counts for both.
        e.stomp(COMBAT.SQUASH_TIME);
        bounced = true;
      } else if (touch === 'hurt' && !this.invincible) {
        this.die();
        return;
      }
    }
    if (bounced) p.bounce(jumpHeld);
  }

  private passCheckpoints(): void {
    const cps = this.level.checkpoints;
    while (this.checkpointsReached < cps.length && this.pip.feetX >= cps[this.checkpointsReached].x) {
      this.respawn = cps[this.checkpointsReached];
      this.checkpointsReached++;
    }
  }

  /** Hit: Pip pops up and spins off the bottom of the screen, then comes back. */
  die(): void {
    this.dying = COMBAT.DEATH_TIME;
    this.pip.vx = 0;
    this.pip.vy = -COMBAT.DEATH_POP;
  }

  private updateDeath(dt: number): void {
    // No collisions while spinning: Pip falls straight through everything.
    const p = this.pip;
    p.vy += COMBAT.DEATH_GRAVITY * dt;
    p.y += p.vy * dt;
    this.dying -= dt;
    if (this.dying <= 0) this.comeBack();
  }

  /** Back at the last checkpoint, with every enemy back in its place. */
  private comeBack(): void {
    this.deaths++;
    this.dying = 0;
    this.placeAt(this.respawn);
    for (const e of this.enemies) e.reset();
    this.camera.snapTo(this.pip);
  }

  render(r: Renderer): void {
    const cx = Math.round(this.camera.x);
    const cy = Math.round(this.camera.y);
    // Sky: fixed bands for now (parallax backgrounds come with the art).
    r.rect(0, 0, r.width, 90, UI.SKY_TOP);
    r.rect(0, 90, r.width, 80, UI.SKY_MID);
    r.rect(0, 170, r.width, r.height - 170, UI.SKY_LOW);
    this.drawTiles(r, cx, cy);
    this.drawStartMarks(r, cx, cy);
    this.drawCheckpoints(r, cx, cy);
    this.drawFlag(r, cx, cy);
    this.drawEnemies(r, cx, cy);

    const p = this.pip;
    const sheet = this.art.sheet('hero');
    const blink = this.invincible && Math.floor(performance.now() / 100) % 2 === 0;
    if (!blink) {
      const frame = this.dying > 0 ? HERO_FRAME.rise : this.frameFor(p.pose);
      r.sprite(sheet, frame, p.feetX - sheet.frameW / 2 - cx, p.feetY - sheet.frameH - cy, p.facingLeft, this.dying > 0);
    }

    r.text(this.level.name, 8, 8, UI.WHITE);
    r.text(`DEATHS ${this.deaths}`, r.width - 8, 8, UI.WHITE, 'right');
    if (this.invincible) r.text('INVINCIBLE (DEBUG)', r.width - 8, 20, UI.YELLOW, 'right');
    if (this.finished) r.text('END FLAG REACHED!', r.width / 2, 40, UI.YELLOW, 'center', 2);
  }

  private drawEnemies(r: Renderer, cx: number, cy: number): void {
    for (const e of this.enemies) {
      if (e.defeated) continue;
      const sheet = this.art.sheet(e.kind);
      const x = e.x + e.w / 2 - sheet.frameW / 2 - cx;
      const y = e.y + e.h - sheet.frameH - cy;
      if (x < -sheet.frameW || x > r.width) continue;
      if (e.squash > 0) {
        // Squashed flat: just the bottom few rows, then gone.
        r.rect(x + 2, e.y + e.h - 4 - cy, sheet.frameW - 4, 4, UI.INK);
        continue;
      }
      r.sprite(sheet, e.frame, x, y, !e.facingLeft);
    }
  }

  /** Only the tiles on screen. Ground gets a grass edge where there's air above it. */
  private drawTiles(r: Renderer, cx: number, cy: number): void {
    const L = this.level;
    const tx0 = Math.floor(cx / TILE);
    const ty0 = Math.floor(cy / TILE);
    for (let ty = ty0; ty <= ty0 + Math.ceil(r.height / TILE); ty++) {
      for (let tx = tx0; tx <= tx0 + Math.ceil(r.width / TILE); tx++) {
        if (tx < 0 || tx >= L.cols) continue;
        const t = L.tileAt(tx, ty);
        if (t === 'air') continue;
        const x = tx * TILE - cx;
        const y = ty * TILE - cy;
        if (t === 'oneway') {
          r.rect(x, y, TILE, 5, PLANK);
          r.rect(x, y, TILE, 1, PLANK_LIGHT);
          r.rect(x + 2, y + 5, 2, 3, PLANK); // little supports
          r.rect(x + TILE - 4, y + 5, 2, 3, PLANK);
          continue;
        }
        if (t === 'spikes') {
          // Three coral points.
          for (let i = 0; i < 3; i++) {
            const px = x + 2 + i * 4;
            for (let h = 0; h < 10; h++) r.rect(px + Math.floor(h / 3), y + TILE - 1 - h, Math.max(1, 4 - Math.floor((2 * h) / 3)), 1, h > 6 ? CORAL_LIGHT : CORAL);
          }
          continue;
        }
        r.rect(x, y, TILE, TILE, UI.SAND);
        if (L.tileAt(tx, ty - 1) !== 'ground') {
          r.rect(x, y, TILE, 4, UI.GRASS);
          r.rect(x, y + 4, TILE, 2, UI.GRASS_DARK);
        }
      }
    }
  }

  /** Height marks at 1 to 5 tiles above the start, to judge jumps. */
  private drawStartMarks(r: Renderer, cx: number, cy: number): void {
    const s = this.level.start;
    for (let n = 1; n <= 5; n++) {
      const y = s.y - n * TILE - cy;
      r.rect(s.x - 40 - cx, y, 10, 1, UI.WHITE);
      r.text(String(n), s.x - 28 - cx, y - 4, UI.WHITE);
    }
  }

  /** A post with a flag: down until passed, then up. */
  private drawCheckpoints(r: Renderer, cx: number, cy: number): void {
    this.level.checkpoints.forEach((c, i) => {
      const x = c.x - cx;
      const y = c.y - cy;
      const up = i < this.checkpointsReached;
      r.rect(x, y - POLE_H, 2, POLE_H, UI.GREY);
      r.rect(x + 2, up ? y - POLE_H : y - 12, 10, 7, up ? UI.GREEN : UI.WHITE);
    });
  }

  private drawFlag(r: Renderer, cx: number, cy: number): void {
    const f = this.level.flag;
    if (!f) return;
    const x = f.x - cx;
    const y = f.y - cy;
    r.rect(x, y - 4 * TILE, 2, 4 * TILE, UI.WHITE);
    r.rect(x + 2, y - 4 * TILE, 14, 9, this.finished ? UI.GREEN : UI.YELLOW);
  }

  private frameFor(pose: PipPose): number {
    if (pose === 'walk' || pose === 'run') return Math.floor(this.pip.stride / PIP.STRIDE) % 2 ? HERO_FRAME.step : HERO_FRAME.stand;
    return HERO_FRAME[pose];
  }

  debugLines(): string[] {
    const p = this.pip;
    return [
      `X ${p.x.toFixed(1)}`,
      `Y ${p.y.toFixed(1)}`,
      `ART ${this.art.source}`,
      `HERO ${this.art.sheet('hero').from}`,
      `CAM ${this.camera.x.toFixed(0)} ${this.camera.y.toFixed(0)}`,
      `VX ${p.vx.toFixed(0)} VY ${p.vy.toFixed(0)}`,
      `POSE ${p.pose}${p.onGround ? ' GROUND' : ''}`,
      `DEATHS ${this.deaths}`,
      `ENEMIES ${this.enemies.filter((e) => !e.defeated).length}/${this.enemies.length}`,
    ];
  }
}

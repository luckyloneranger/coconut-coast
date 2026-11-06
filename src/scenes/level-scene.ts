// Plays one level: Pip and Pip's forms, tiles and crates, enemies, items,
// seed pods, spikes, checkpoints, the Sun Meter, lives and the end flag.
// Drawing lives in level-draw.ts.

import type { InputSnapshot } from '../core/input';
import type { Renderer } from '../core/renderer';
import type { Scene } from '../core/scene';
import { touchEnemy, touchesHazard } from '../actors/combat';
import { readControls } from '../actors/controls';
import type { Enemy } from '../actors/enemies/enemy';
import { makeEnemy } from '../actors/enemies';
import { Item, crateContents, placedItems } from '../actors/items';
import { PipForm } from '../actors/pip-form';
import { PipPhysics } from '../actors/pip-physics';
import { SeedPod, canFire } from '../actors/seed-pod';
import { overlaps } from '../actors/solids';
import type { ArtLibrary } from '../gfx/art/library';
import { RunState } from '../game/run-state';
import { COMBAT, ITEMS, LEVEL, PIP, RUN } from '../game/tuning';
import { Camera } from '../world/camera';
import { Level, type LevelSource, type Spot } from '../world/level';
import { TILE } from '../world/tiles';
import { drawLevel } from './level-draw';

const FLAG_REACH = 12; // px: touching the flag pole this close counts
const GAME_OVER_TIME = 3; // s the GAME OVER card shows before the level starts again
const NAME_TIME = 2.5; // s the level name shows at the start

export interface LevelOptions {
  viewW?: number; // px
  viewH?: number;
  /** Is the debug overlay open? (Unlocks the invincibility key.) */
  debugOpen?: () => boolean;
  /** No Sun Meter, and Pip keeps the form after losing a life. */
  relaxed?: boolean;
}

export class LevelScene implements Scene {
  readonly name = 'LEVEL';
  level!: Level;
  readonly pip = new PipPhysics(0, 0);
  readonly form = new PipForm();
  run!: RunState;
  camera!: Camera;
  enemies: Enemy[] = [];
  items: Item[] = [];
  pods: SeedPod[] = [];
  /** Has Pip reached the end flag? */
  finished = false;
  /** Lives lost so far (for the debug overlay and tests). */
  deaths = 0;
  /** Where Pip comes back: the start, then the last checkpoint passed. */
  respawn!: Spot;
  /** How many checkpoints are passed (they're in order, left to right). */
  checkpointsReached = 0;
  /** s left of the death spin (0 = alive). */
  dying = 0;
  /** s left of the GAME OVER card (0 = not showing). */
  gameOver = 0;
  /** Debug: hits, spikes and the Sun Meter do nothing (I key with the overlay open). */
  invincible = false;
  /** s since the level (re)started, for animation. */
  time = 0;
  private fruitLooks = 0;
  private readonly viewW: number;
  private readonly viewH: number;
  private readonly debugOpen: () => boolean;
  readonly relaxed: boolean;

  constructor(
    private readonly src: LevelSource,
    readonly art: ArtLibrary,
    private readonly onArtToggle: () => void,
    opts: LevelOptions = {},
  ) {
    this.viewW = opts.viewW ?? 480;
    this.viewH = opts.viewH ?? 270;
    this.debugOpen = opts.debugOpen ?? (() => false);
    this.relaxed = opts.relaxed ?? false;
    this.restartLevel();
  }

  /** Start (or, after GAME OVER, restart) the level from scratch. */
  restartLevel(): void {
    this.level = new Level(this.src);
    this.run = new RunState(this.relaxed);
    this.respawn = this.level.start;
    this.checkpointsReached = 0;
    this.finished = false;
    this.dying = 0;
    this.gameOver = 0;
    this.time = 0;
    this.enemies = this.level.enemies.map((e) => makeEnemy(e.kind, e));
    this.items = placedItems(this.level);
    this.fruitLooks = this.items.length;
    this.pods = [];
    this.form.respawn(false);
    this.pip.h = PIP.HEIGHT;
    this.placeAt(this.respawn);
    this.camera = new Camera(this.viewW, this.viewH, this.level.widthPx, this.level.heightPx, this.pip);
  }

  private placeAt(spot: Spot): void {
    const p = this.pip;
    p.x = spot.x - PIP.WIDTH / 2;
    p.y = spot.y - p.h;
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
  }

  update(dt: number, input: InputSnapshot): void {
    this.time += dt;
    if (input.justPressed('ART_TOGGLE')) this.onArtToggle();
    if (this.debugOpen() && input.justPressed('DEBUG_INVINCIBLE')) this.invincible = !this.invincible;
    if (this.gameOver > 0) {
      this.gameOver -= dt;
      if (this.gameOver <= 0) this.restartLevel();
      return;
    }
    if (this.dying > 0) {
      this.updateDeath(dt);
      return;
    }
    const p = this.pip;
    this.form.update(dt);
    const feetBefore = p.feetY;
    const controls = readControls(input);
    const near = this.level.boxesNear(p.box);
    p.update(dt, controls, near.solids, near.oneWays);
    // Grow or shrink to match the form (growing waits for room above).
    const wantH = this.form.big ? PIP.BIG_HEIGHT : PIP.HEIGHT;
    if (p.h !== wantH) p.setHeight(wantH, this.level.boxesNear(p.box).solids);
    this.hitBlocks();
    if (p.y > this.level.heightPx + LEVEL.FALL_BELOW) {
      this.die(); // fell in a pit
      return;
    }
    if (p.onGround) this.run.landed();
    if (this.form.canThrow && input.justPressed('THROW') && canFire(this.pods)) {
      this.pods.push(new SeedPod(p.feetX, p.y + p.h * 0.5, p.facingLeft));
    }
    this.updatePods(dt);
    this.updateEnemies(dt, feetBefore, controls.jumpHeld);
    if (this.dying > 0) return;
    if (!this.invincible && touchesHazard(p.box, this.level.hazardsNear(p.box))) {
      this.die(); // spikes cost a life whatever the form
      return;
    }
    this.updateItems(dt);
    if (!this.invincible && !this.finished && this.run.drain(dt)) {
      this.die(); // the Sun Meter ran out
      return;
    }
    this.passCheckpoints();
    const flag = this.level.flag;
    if (flag && !this.finished && Math.abs(p.feetX - flag.x) < FLAG_REACH && p.feetY > flag.y - 4 * TILE) this.finished = true;
    this.camera.update(dt, p);
  }

  /** Crates and cracked stone react to a head-butt; Big Pip landing hard on a crate opens it too. */
  private hitBlocks(): void {
    const p = this.pip;
    const hits = p.bumped.map((b) => ({ tx: b.x / TILE, ty: b.y / TILE }));
    if (p.landedOn && this.form.big && p.landedOn.speed >= ITEMS.BIG_STOMP_SPEED) {
      hits.push({ tx: p.landedOn.box.x / TILE, ty: p.landedOn.box.y / TILE });
    }
    for (const { tx, ty } of hits) {
      const tile = this.level.tileAt(tx, ty);
      if (tile === 'crate') {
        const item = this.level.openCrate(tx, ty);
        if (item) {
          const out = crateContents(item, tx, ty, this.fruitLooks);
          this.fruitLooks += out.length;
          this.items.push(...out);
        }
      } else if (tile === 'cracked' && this.form.big && p.bumped.some((b) => b.x === tx * TILE && b.y === ty * TILE)) {
        this.level.setTile(tx, ty, 'air');
      }
    }
  }

  private updatePods(dt: number): void {
    for (const pod of this.pods) {
      pod.update(dt, this.level);
      if (pod.gone) continue;
      for (const e of this.enemies) {
        if (e.awake && e.active && overlaps(pod.box, e.box)) {
          e.stomp(COMBAT.SQUASH_TIME); // a pod defeats every kind, even the urchin
          this.run.score += RUN.STOMP_CHAIN[0];
          pod.gone = true;
          break;
        }
      }
    }
    this.pods = this.pods.filter((pod) => !pod.gone);
  }

  /** Wake enemies near the screen, move them, then stomps and hits. */
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
      if (touch === 'none') continue;
      if (touch === 'stomp' || bounced) {
        // Landing on two at once counts for both.
        e.stomp(COMBAT.SQUASH_TIME);
        this.run.stomped();
        bounced = true;
      } else if (this.form.star > 0) {
        e.stomp(COMBAT.SQUASH_TIME); // Starfruit: anything touched is defeated
        this.run.score += RUN.STOMP_CHAIN[0];
      } else if (!this.invincible && this.form.hit() === 'dead') {
        this.die();
        return;
      }
    }
    if (bounced) p.bounce(jumpHeld);
  }

  private updateItems(dt: number): void {
    for (const it of this.items) {
      it.update(dt, this.level);
      if (!it.touches(this.pip.box)) continue;
      it.collected = true;
      switch (it.kind) {
        case 'fruit':
          this.run.addFruit();
          break;
        case 'coin':
          this.run.addCoin(it.index);
          break;
        case 'mango':
          this.form.eatMango();
          break;
        case 'slingshot':
          this.form.takeSlingshot();
          break;
        case 'starfruit':
          this.form.eatStarfruit();
          break;
      }
    }
    this.items = this.items.filter((it) => !it.collected);
  }

  private passCheckpoints(): void {
    const cps = this.level.checkpoints;
    while (this.checkpointsReached < cps.length && this.pip.feetX >= cps[this.checkpointsReached].x) {
      this.respawn = cps[this.checkpointsReached];
      this.checkpointsReached++;
    }
  }

  /** Lose a life: Pip pops up and spins off the bottom of the screen first. */
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

  /** Back at the last checkpoint with every enemy in its place, or GAME OVER. */
  private comeBack(): void {
    this.deaths++;
    this.dying = 0;
    if (this.run.loseLife()) {
      this.gameOver = GAME_OVER_TIME;
      return;
    }
    this.form.respawn(this.relaxed);
    this.pip.h = this.form.big ? PIP.BIG_HEIGHT : PIP.HEIGHT;
    this.placeAt(this.respawn);
    for (const e of this.enemies) e.reset();
    this.pods = [];
    this.camera.snapTo(this.pip);
  }

  /** Show the level name for a moment at the start. */
  get showName(): boolean {
    return this.time < NAME_TIME;
  }

  render(r: Renderer): void {
    drawLevel(r, this);
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
      `LIVES ${this.run.lives}`,
      `SCORE ${this.run.score}`,
      `FRUIT ${this.run.fruit}`,
      `FORM ${this.form.form}${this.form.star > 0 ? ' STAR' : ''}`,
      `SUN ${this.run.sun.toFixed(2)}`,
      `ENEMIES ${this.enemies.filter((e) => !e.defeated).length}/${this.enemies.length}`,
    ];
  }
}

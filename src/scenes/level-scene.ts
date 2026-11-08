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
import { PipAnimator } from '../actors/pip-anim';
import { SeedPod, canFire } from '../actors/seed-pod';
import { overlaps } from '../actors/solids';
import type { ArtLibrary } from '../gfx/art/library';
import { RunState } from '../game/run-state';
import { COMBAT, FX, ITEMS, LEVEL, PIP, RUN, WATER } from '../game/tuning';
import { Particles } from '../gfx/fx/particles';
import { SILENT, type SoundSink } from '../audio/sfx';
import type { SongName } from '../audio/songs';
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
  /** Less screen shake and flashing (Options later; ?calm=1 for now). */
  calm?: boolean;
  /** Where sound events go (the audio system); silent in tests. */
  sound?: SoundSink;
}

/** A score that floats up from where it was earned ("+10", "200", "1UP"). */
export interface Popup {
  x: number; // px, in the level
  y: number;
  text: string;
  age: number; // s
}
export const POPUP_TIME = 0.8; // s a score popup lasts

/** A faint copy of Pip left behind when running fast. */
export interface AfterImage {
  x: number; // feet, px
  y: number;
  frame: number;
  flip: boolean;
  age: number; // s
}

export class LevelScene implements Scene {
  readonly name = 'LEVEL';
  level!: Level;
  readonly pip = new PipPhysics(0, 0);
  readonly form = new PipForm();
  readonly anim = new PipAnimator();
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
  readonly particles = new Particles();
  afterImages: AfterImage[] = [];
  popups: Popup[] = [];
  /** s since the end flag was reached (for the celebration). */
  clearTime = 0;
  /** s left of the stomp freeze (the game holds still for punch). */
  freeze = 0;
  /** s left of screen shake. */
  shake = 0;
  private fruitLooks = 0;
  private dustTimer = 0;
  private afterTimer = 0;
  private wasOnGround = false;
  private fallSpeed = 0;
  readonly calm: boolean;
  private readonly sound: SoundSink;
  private sunWarned = false;
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
    this.calm = opts.calm ?? false;
    this.sound = opts.sound ?? SILENT;
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
    this.particles.clear();
    this.afterImages = [];
    this.popups = [];
    this.clearTime = 0;
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
    this.particles.update(dt);
    for (const pop of this.popups) {
      pop.age += dt;
      pop.y -= 30 * dt; // floats up
    }
    this.popups = this.popups.filter((pop) => pop.age < POPUP_TIME);
    if (this.finished) this.celebrate(dt);
    if (this.freeze > 0) {
      this.freeze -= dt; // the stomp freeze: everything holds still for a moment
      return;
    }
    this.shake = Math.max(0, this.shake - dt);
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
    this.wasOnGround = p.onGround;
    this.fallSpeed = p.vy;
    const controls = readControls(input);
    const near = this.level.boxesNear(p.box);
    p.update(dt, controls, near.solids, near.oneWays);
    // Grow or shrink to match the form (growing waits for room above).
    // Height follows the form and ducking; standing up (or growing) waits for room above.
    const standH = this.form.big ? PIP.BIG_HEIGHT : PIP.HEIGHT;
    const duckH = this.form.big ? PIP.BIG_DUCK_HEIGHT : PIP.DUCK_HEIGHT;
    const wantH = controls.down && p.onGround ? duckH : standH;
    if (p.h !== wantH) p.setHeight(wantH, this.level.boxesNear(p.box).solids);
    p.forceDuck = p.onGround && p.h < standH && !controls.down;
    this.hitBlocks();
    if (p.y > this.level.heightPx + LEVEL.FALL_BELOW) {
      this.die(); // fell in a pit
      return;
    }
    if (this.level.waterAt(p.feetX, p.feetY - WATER.SINK)) {
      // Into the sea: a big splash at the surface, and a life lost.
      this.particles.splash(p.feetX, Math.floor((p.feetY - WATER.SINK) / TILE) * TILE);
      this.sound({ kind: 'splash' });
      this.die();
      return;
    }
    this.kickDust(dt);
    if (p.onGround) this.run.landed();
    if (this.form.canThrow && input.justPressed('THROW') && canFire(this.pods)) {
      this.anim.throwNow();
      this.sound({ kind: 'throw' });
      this.pods.push(new SeedPod(p.feetX, p.y + p.h * 0.5, p.facingLeft));
    }
    this.updatePods(dt);
    this.updateEnemies(dt, feetBefore, controls.jumpHeld);
    if (this.dying > 0) return;
    // Spikes cost a life whatever the form, except during a Starfruit (then they're safe to cross).
    if (!this.invincible && this.form.star <= 0 && touchesHazard(p.box, this.level.hazardsNear(p.box))) {
      this.die();
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
    this.soundCues();
    this.camera.update(dt, p);
    this.animate(dt);
    this.trackAfterImages(dt);
    this.sparkleItems(dt);
  }

  /** Dust when skidding, and when landing hard. */
  /** Jumps, the low-Sun warning and extra lives, worked out from what changed this step. */
  private lastLives = 0;
  private soundCues(): void {
    const p = this.pip;
    if (this.wasOnGround && !p.onGround && p.vy < -150) this.sound({ kind: 'jump', big: this.form.big });
    const low = !this.relaxed && this.run.sun < RUN.SUN_LOW;
    if (low && !this.sunWarned) this.sound({ kind: 'sunLow' });
    this.sunWarned = low;
    if (this.lastLives && this.run.lives > this.lastLives) {
      this.sound({ kind: 'extraLife' });
      this.popup(p.feetX, p.y - 8, '1UP');
    }
    this.lastLives = this.run.lives;
  }

  /** The music for this moment: the Starfruit theme while invincible, jingles at the end, otherwise the level's tune. */
  get song(): SongName | null {
    if (this.gameOver > 0) return 'gameOver';
    if (this.dying > 0) return 'loseLife';
    if (this.finished) return 'levelClear';
    if (this.form.star > 0) return 'starfruit';
    return 'palmBeach';
  }

  private kickDust(dt: number): void {
    const p = this.pip;
    this.dustTimer -= dt;
    if (p.skidding && this.dustTimer <= 0) {
      this.particles.dust(p.feetX, p.feetY, 2, Math.sign(p.vx));
      this.dustTimer = FX.DUST_EVERY;
    }
    if (p.onGround && !this.wasOnGround && this.fallSpeed > FX.LAND_DUST_SPEED) this.particles.dust(p.feetX, p.feetY, 6);
  }

  /** Float a score up from a spot in the level. */
  popup(x: number, y: number, text: string): void {
    this.popups.push({ x, y, text, age: 0 });
  }

  /** At the end flag: bursts of colour round Pip now and then, for a couple of seconds. */
  private celebrate(dt: number): void {
    const before = this.clearTime;
    this.clearTime += dt;
    const colours = ['#ffd84a', '#5ccc6a', '#ff8ab0', '#7ad0ff', '#ffffff'];
    for (let k = 0; k < 4; k++) {
      const at = k * 0.35;
      if (before < at && this.clearTime >= at) {
        const x = this.pip.feetX + (k % 2 ? 40 : -40);
        this.particles.burst(x, this.pip.y - 20 - k * 8, colours[k % colours.length], 14);
        this.particles.pop(x, this.pip.y - 20);
      }
    }
  }

  /** Faint copies of Pip trail behind at full running speed. */
  private trackAfterImages(dt: number): void {
    const p = this.pip;
    for (const a of this.afterImages) a.age += dt;
    this.afterImages = this.afterImages.filter((a) => a.age < FX.AFTERIMAGES * FX.AFTERIMAGE_GAP);
    this.afterTimer -= dt;
    if (Math.abs(p.vx) >= FX.AFTERIMAGE_SPEED && this.afterTimer <= 0) {
      this.afterImages.push({ x: p.feetX, y: p.feetY, frame: this.anim.frame(this.animState), flip: p.facingLeft, age: 0 });
      this.afterTimer = FX.AFTERIMAGE_GAP;
    }
  }

  /** Now and then a twinkle on each fruit and coin. */
  private sparkleItems(dt: number): void {
    for (const it of this.items) {
      if (!it.moving && this.particles.random() < dt / FX.SPARKLE_EVERY) this.particles.sparkle(it.x, it.y);
    }
  }

  /** Defeat an enemy: it shows its hit frame, then pops into little stars. */
  private defeat(e: Enemy): void {
    e.stomp(COMBAT.SQUASH_TIME);
    this.particles.pop(e.x + e.w / 2, e.y + e.h / 2);
  }

  /** A big impact: the screen shakes a little (not in calm mode). */
  private bigImpact(): void {
    if (!this.calm) this.shake = FX.SHAKE_TIME;
  }

  /** Feed Pip's state to the animation picker. */
  private animate(dt: number): void {
    this.anim.update(dt, this.animState);
  }

  /** What the animation picker needs (also used when drawing). */
  get animState() {
    const p = this.pip;
    return {
      onGround: p.onGround,
      vx: p.vx,
      vy: p.vy,
      skidding: p.skidding,
      ducking: p.ducking,
      sinceLanding: p.sinceLanding,
      stride: p.stride,
      dying: this.dying > 0,
      won: this.finished,
    };
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
        this.sound({ kind: 'crate' });
        if (item && p.landedOn) this.bigImpact(); // Big Pip slammed down on it
        if (item) {
          const out = crateContents(item, tx, ty, this.fruitLooks);
          this.fruitLooks += out.length;
          this.items.push(...out);
        }
      } else if (tile === 'cracked' && this.form.big && p.bumped.some((b) => b.x === tx * TILE && b.y === ty * TILE)) {
        this.level.setTile(tx, ty, 'air');
        this.particles.burst(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#9a96a8', 10); // stone chips
        this.sound({ kind: 'stone' });
        this.bigImpact();
      }
    }
  }

  private updatePods(dt: number): void {
    for (const pod of this.pods) {
      pod.update(dt, this.level);
      if (pod.gone) continue;
      for (const e of this.enemies) {
        if (e.awake && e.active && overlaps(pod.box, e.box)) {
          this.defeat(e); // a pod defeats every kind, even the urchin
          this.run.score += RUN.STOMP_CHAIN[0];
          this.popup(e.x + e.w / 2, e.y, String(RUN.STOMP_CHAIN[0]));
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
        this.defeat(e);
        const points = this.run.stomped();
        this.popup(e.x + e.w / 2, e.y, points ? String(points) : '1UP');
        this.sound({ kind: 'stomp', chain: this.run.chain });
        bounced = true;
        this.freeze = FX.STOMP_FREEZE;
      } else if (this.form.star > 0) {
        this.defeat(e); // Starfruit: anything touched is defeated
        this.run.score += RUN.STOMP_CHAIN[0];
        this.popup(e.x + e.w / 2, e.y, String(RUN.STOMP_CHAIN[0]));
      } else if (!this.invincible) {
        const result = this.form.hit();
        if (result === 'shrunk') {
          this.anim.hurtNow();
          this.sound({ kind: 'hurt' });
        }
        if (result === 'dead') {
          this.die();
          return;
        }
      }
    }
    if (bounced) p.bounce(jumpHeld);
  }

  private updateItems(dt: number): void {
    for (const it of this.items) {
      it.update(dt, this.level);
      if (!it.touches(this.pip.box)) continue;
      it.collected = true;
      this.particles.burst(it.x, it.y, it.kind === 'coin' ? '#ffd040' : '#fff2b0', it.kind === 'fruit' ? 6 : 12);
      switch (it.kind) {
        case 'fruit':
          this.run.addFruit();
          this.popup(it.x, it.y - 6, `+${RUN.FRUIT_POINTS}`);
          this.sound({ kind: 'fruit' });
          break;
        case 'coin':
          this.run.addCoin(it.index);
          this.popup(it.x, it.y - 6, String(RUN.COIN_POINTS));
          this.sound({ kind: 'coin' });
          break;
        case 'mango':
          this.form.eatMango();
          this.sound({ kind: 'powerUp' });
          break;
        case 'slingshot':
          this.form.takeSlingshot();
          this.sound({ kind: 'powerUp' });
          break;
        case 'starfruit':
          this.form.eatStarfruit();
          this.sound({ kind: 'starfruit' });
          break;
      }
    }
    this.items = this.items.filter((it) => !it.collected);
  }

  private passCheckpoints(): void {
    const cps = this.level.checkpoints;
    while (this.checkpointsReached < cps.length && this.pip.feetX >= cps[this.checkpointsReached].x) {
      this.respawn = cps[this.checkpointsReached];
      this.sound({ kind: 'checkpoint' });
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
    this.anim.update(dt, this.animState);
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
    this.afterImages = [];
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
      `HERO ${this.art.sheet('pip').from}`,
      `ANIM ${this.anim.anim}`,
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

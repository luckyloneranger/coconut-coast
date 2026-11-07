// Pip's movement as plain logic: controls and solid boxes in, position and
// state out. No drawing here, so every rule can be unit-tested.

import { COMBAT, LOOP, PIP } from '../game/tuning';
import type { PipControls } from './controls';
import { overlaps, type Box } from './solids';

export type PipPose = 'stand' | 'walk' | 'run' | 'skid' | 'rise' | 'fall' | 'land';

export class PipPhysics {
  x: number; // px, left of the collision box
  y: number; // px, top of the collision box
  vx = 0; // px/s
  vy = 0; // px/s, down is positive
  onGround = false;
  facingLeft = false;
  skidding = false;
  /** s left in which a jump still works after leaving the ground. */
  coyote = 0;
  /** s left in which an early jump press is remembered. */
  buffer = 0;
  /** s since landing (for the squash). */
  sinceLanding = 1;
  /** px walked, for the stride animation. */
  stride = 0;
  /** Rising from a jump that Jump is still holding up (letting go cuts it short). */
  private rising = false;
  /** s left of falling through one-way platforms (after Down + Jump). */
  dropping = 0;
  /** Crouched low (Down on the ground): can't walk, and the scene makes the collision box shorter. */
  ducking = false;
  /** Set by the scene when there's no room to stand up: stay ducked even with Down let go. */
  forceDuck = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /** px, the collision box height: PIP.HEIGHT small, PIP.BIG_HEIGHT when Big. */
  h: number = PIP.HEIGHT;
  /** Solid boxes Pip's head hit from below this step (crates, cracked stone). */
  bumped: Box[] = [];
  /** The solid box Pip landed on this step, and how fast Pip was falling (px/s). */
  landedOn: { box: Box; speed: number } | null = null;

  get box(): Box {
    return { x: this.x, y: this.y, w: PIP.WIDTH, h: this.h };
  }

  /**
   * Change height (grow or shrink) keeping the feet where they are. Growing
   * waits if there's no room above; returns whether the change happened.
   */
  setHeight(h: number, solids: readonly Box[]): boolean {
    const grown = { x: this.x, y: this.feetY - h, w: PIP.WIDTH, h };
    if (h > this.h && solids.some((s) => overlaps(grown, s))) return false;
    this.y = grown.y;
    this.h = h;
    return true;
  }

  /** Feet position (bottom centre), handy for drawing. */
  get feetX(): number {
    return this.x + PIP.WIDTH / 2;
  }
  get feetY(): number {
    return this.y + this.h;
  }

  /** `oneWays`: platforms you can jump up through and land on (only their top counts). */
  update(dt: number, c: PipControls, solids: readonly Box[], oneWays: readonly Box[] = []): void {
    this.dropping = Math.max(0, this.dropping - dt);
    this.bumped = [];
    this.landedOn = null;
    this.ducking = this.onGround && (c.down || this.forceDuck);
    this.steer(dt, c);
    this.jump(dt, c, solids, oneWays);
    this.fall(dt, c);
    this.moveX(dt, solids);
    this.moveY(dt, solids, oneWays);
    this.sinceLanding += dt;
    if (this.onGround) this.stride += Math.abs(this.vx) * dt;
  }

  /** Speed up, slow down or skid along the ground. In the air, speeding up is weaker but braking isn't. */
  private steer(dt: number, c: PipControls): void {
    // Ducking on the ground: no walking, just slide to a stop.
    const dir = this.ducking ? 0 : (c.right ? 1 : 0) - (c.left ? 1 : 0);
    const grip = this.onGround ? 1 : PIP.AIR_CONTROL;
    const brake = this.onGround ? 1 : PIP.AIR_BRAKE;
    const top = c.run ? PIP.RUN_SPEED : PIP.WALK_SPEED;
    this.skidding = false;
    if (dir === 0) {
      this.vx = approach(this.vx, 0, PIP.DECEL * brake * dt);
      return;
    }
    this.facingLeft = dir < 0;
    if (this.vx !== 0 && Math.sign(this.vx) !== dir) {
      // Pushing against your own speed: brake hard (a skid if fast, on the ground).
      this.skidding = this.onGround && Math.abs(this.vx) > PIP.SKID_MIN_SPEED;
      this.vx = approach(this.vx, 0, PIP.SKID_DECEL * brake * dt);
      return;
    }
    const speed = Math.abs(this.vx);
    if (speed > top) {
      this.vx = approach(this.vx, dir * top, PIP.DECEL * brake * dt); // let go of Run: ease back to walking
    } else {
      const accel = speed < PIP.WALK_SPEED ? PIP.ACCEL : PIP.RUN_ACCEL;
      this.vx = approach(this.vx, dir * top, accel * grip * dt);
    }
  }

  /**
   * Jump if the button was pressed recently and Pip is on (or just off) the
   * ground. Down + Jump on a one-way platform drops through it instead.
   */
  private jump(dt: number, c: PipControls, solids: readonly Box[], oneWays: readonly Box[]): void {
    if (c.down && c.jumpPressed && this.onGround && this.standingOnlyOnOneWay(solids, oneWays)) {
      this.dropping = PIP.DROP_THROUGH_TIME;
      this.onGround = false;
      this.buffer = 0;
      this.coyote = 0;
      return;
    }
    this.buffer = c.jumpPressed ? PIP.JUMP_BUFFER : Math.max(0, this.buffer - dt);
    this.coyote = this.onGround ? PIP.COYOTE_TIME : Math.max(0, this.coyote - dt);
    if (this.buffer <= 0 || this.coyote <= 0) return;
    const runShare = clamp01((Math.abs(this.vx) - PIP.WALK_SPEED) / (PIP.RUN_SPEED - PIP.WALK_SPEED));
    this.vy = -(WALK_JUMP_SPEED + (RUN_JUMP_SPEED - WALK_JUMP_SPEED) * runShare);
    this.onGround = false;
    this.rising = true;
    this.buffer = 0;
    this.coyote = 0;
  }

  /** Gravity, heavier on the way down; letting go of Jump while rising cuts the jump short. */
  private fall(dt: number, c: PipControls): void {
    if (this.rising && (this.vy >= 0 || !c.jumpHeld)) {
      if (this.vy < 0) this.vy *= PIP.JUMP_CUT;
      this.rising = false;
    }
    if (this.onGround) return;
    this.vy = Math.min(this.vy + gravityFor(this.vy, this.rising) * dt, PIP.MAX_FALL_SPEED);
  }

  private moveX(dt: number, solids: readonly Box[]): void {
    this.x += this.vx * dt;
    for (const s of solids) {
      if (!overlaps(this.box, s)) continue;
      this.x = this.vx > 0 ? s.x - PIP.WIDTH : s.x + s.w;
      this.vx = 0;
    }
  }

  private moveY(dt: number, solids: readonly Box[], oneWays: readonly Box[]): void {
    const wasOnGround = this.onGround;
    const feetBefore = this.feetY;
    this.y += this.vy * dt;
    this.onGround = false;
    // One-way platforms only stop you coming down onto their top from above.
    if (this.vy >= 0 && this.dropping <= 0) {
      for (const o of oneWays) {
        if (this.x < o.x + o.w && this.x + PIP.WIDTH > o.x && feetBefore <= o.y && this.feetY > o.y) {
          this.y = o.y - this.h;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }
    for (const s of solids) {
      if (!overlaps(this.box, s)) continue;
      if (this.vy >= 0) {
        this.y = s.y - this.h;
        if (!wasOnGround) this.landedOn = { box: s, speed: this.vy };
        this.onGround = true;
      } else {
        // Bumped a ceiling. If only a corner of the head clipped it, slide past instead.
        const nudge = this.cornerNudge(s, solids);
        if (nudge !== 0) {
          this.x += nudge;
          continue;
        }
        this.y = s.y + s.h;
        this.rising = false;
        this.bumped.push(s);
      }
      this.vy = 0;
    }
    // Standing still on the ground: check there's still something under the feet.
    if (!this.onGround && this.vy === 0) {
      const probe = { ...this.box, y: this.y + 1 };
      this.onGround = solids.some((s) => overlaps(probe, s)) || (this.dropping <= 0 && this.onTopOf(oneWays));
    }
    if (this.onGround && !wasOnGround) this.sinceLanding = 0;
  }

  /** How far to slide sideways to clear a ceiling block clipped by at most CORNER_NUDGE px (0 = it's a real bump). */
  private cornerNudge(s: Box, solids: readonly Box[]): number {
    const overlapLeft = s.x + s.w - this.x; // block sticks into Pip's left side by this much
    const overlapRight = this.x + PIP.WIDTH - s.x; // ...or into the right side
    let shift = 0;
    if (overlapLeft > 0 && overlapLeft <= PIP.CORNER_NUDGE) shift = overlapLeft;
    else if (overlapRight > 0 && overlapRight <= PIP.CORNER_NUDGE) shift = -overlapRight;
    if (shift === 0) return 0;
    const moved = { ...this.box, x: this.x + shift };
    return solids.some((o) => overlaps(moved, o)) ? 0 : shift;
  }

  /** Are the feet exactly on top of one of these platforms? */
  private onTopOf(platforms: readonly Box[]): boolean {
    return platforms.some((o) => this.x < o.x + o.w && this.x + PIP.WIDTH > o.x && Math.abs(this.feetY - o.y) < 0.01);
  }

  /** On a one-way platform with no solid ground under the feet (so dropping through is allowed). */
  private standingOnlyOnOneWay(solids: readonly Box[], oneWays: readonly Box[]): boolean {
    const probe = { ...this.box, y: this.y + 1 };
    return this.onTopOf(oneWays) && !solids.some((s) => overlaps(probe, s));
  }

  /** Bounce up off a stomped enemy: higher with Jump held (so stomps can chain). */
  bounce(jumpHeld: boolean): void {
    this.vy = -(jumpHeld ? STOMP_BOUNCE_HELD_SPEED : STOMP_BOUNCE_SPEED);
    this.onGround = false;
    this.rising = jumpHeld; // letting go during a held bounce cuts it short, like a jump
    this.coyote = 0; // no late jump off a bounce (it was a second jump)
    this.buffer = 0;
  }

  /** Which picture to show (drawing only). */
  get pose(): PipPose {
    if (!this.onGround) return this.vy < 0 ? 'rise' : 'fall';
    if (this.sinceLanding < PIP.LAND_SQUASH_TIME) return 'land';
    if (this.skidding) return 'skid';
    const speed = Math.abs(this.vx);
    if (speed < 1) return 'stand';
    return speed > PIP.WALK_SPEED + 1 ? 'run' : 'walk';
  }
}

/**
 * The take-off speed (px/s) that rises exactly `height` px with Jump held,
 * for the game's fixed 60 steps a second. The smooth formula (v² = 2gh)
 * comes up about 4% short with steps, so this counts the steps instead.
 */
export function jumpSpeedFor(height: number, held = true, dt = 1 / LOOP.STEPS_PER_SECOND): number {
  // Step it exactly like update(): gravity (with the hang near the top when held), then move.
  const rise = (v: number) => {
    let h = 0;
    let vy = -v;
    for (;;) {
      vy += gravityFor(vy, held) * dt;
      if (vy >= 0) return h;
      h -= vy * dt;
    }
  };
  let lo = 0;
  let hi = Math.sqrt(2 * PIP.GRAVITY * height) * 2;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (rise(mid) < height) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * Gravity at vertical speed `vy` (down is positive): heavier falling; lighter
 * for a moment at the top of a jump while Jump is still held (a little hang).
 */
function gravityFor(vy: number, risingHeld: boolean): number {
  if (vy >= 0) return PIP.GRAVITY * PIP.FALL_GRAVITY_SCALE;
  if (risingHeld && -vy < PIP.APEX_SPEED) return PIP.GRAVITY * PIP.APEX_GRAVITY_SCALE;
  return PIP.GRAVITY;
}

const WALK_JUMP_SPEED = jumpSpeedFor(PIP.JUMP_HEIGHT);
const STOMP_BOUNCE_SPEED = jumpSpeedFor(COMBAT.STOMP_BOUNCE, false);
const STOMP_BOUNCE_HELD_SPEED = jumpSpeedFor(COMBAT.STOMP_BOUNCE_HELD);
const RUN_JUMP_SPEED = jumpSpeedFor(PIP.RUN_JUMP_HEIGHT);

/** Move `value` toward `target` by at most `step`. */
export function approach(value: number, target: number, step: number): number {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

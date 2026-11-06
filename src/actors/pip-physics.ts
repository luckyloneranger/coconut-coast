// Pip's movement as plain logic: controls and solid boxes in, position and
// state out. No drawing here, so every rule can be unit-tested.

import { PIP } from '../game/tuning';
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

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get box(): Box {
    return { x: this.x, y: this.y, w: PIP.WIDTH, h: PIP.HEIGHT };
  }

  /** Feet position (bottom centre), handy for drawing. */
  get feetX(): number {
    return this.x + PIP.WIDTH / 2;
  }
  get feetY(): number {
    return this.y + PIP.HEIGHT;
  }

  update(dt: number, c: PipControls, solids: readonly Box[]): void {
    this.steer(dt, c);
    this.jump(dt, c);
    this.fall(dt, c);
    this.moveX(dt, solids);
    this.moveY(dt, solids);
    this.sinceLanding += dt;
    if (this.onGround) this.stride += Math.abs(this.vx) * dt;
  }

  /** Speed up, slow down or skid along the ground (less grip in the air). */
  private steer(dt: number, c: PipControls): void {
    const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    const grip = this.onGround ? 1 : PIP.AIR_CONTROL;
    const top = c.run ? PIP.RUN_SPEED : PIP.WALK_SPEED;
    this.skidding = false;
    if (dir === 0) {
      this.vx = approach(this.vx, 0, PIP.DECEL * grip * dt);
      return;
    }
    this.facingLeft = dir < 0;
    if (this.vx !== 0 && Math.sign(this.vx) !== dir) {
      // Pushing against your own speed: brake hard (a skid if fast, on the ground).
      this.skidding = this.onGround && Math.abs(this.vx) > PIP.SKID_MIN_SPEED;
      this.vx = approach(this.vx, 0, PIP.SKID_DECEL * grip * dt);
      return;
    }
    const speed = Math.abs(this.vx);
    if (speed > top) {
      this.vx = approach(this.vx, dir * top, PIP.DECEL * grip * dt); // let go of Run: ease back to walking
    } else {
      const accel = speed < PIP.WALK_SPEED ? PIP.ACCEL : PIP.RUN_ACCEL;
      this.vx = approach(this.vx, dir * top, accel * grip * dt);
    }
  }

  /** Jump if the button was pressed recently and Pip is on (or just off) the ground. */
  private jump(dt: number, c: PipControls): void {
    this.buffer = c.jumpPressed ? PIP.JUMP_BUFFER : Math.max(0, this.buffer - dt);
    this.coyote = this.onGround ? PIP.COYOTE_TIME : Math.max(0, this.coyote - dt);
    if (this.buffer <= 0 || this.coyote <= 0) return;
    const runShare = clamp01((Math.abs(this.vx) - PIP.WALK_SPEED) / (PIP.RUN_SPEED - PIP.WALK_SPEED));
    this.vy = -(PIP.JUMP_SPEED + PIP.RUN_JUMP_BONUS * runShare);
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
    const g = this.vy < 0 ? PIP.GRAVITY : PIP.GRAVITY * PIP.FALL_GRAVITY_SCALE;
    this.vy = Math.min(this.vy + g * dt, PIP.MAX_FALL_SPEED);
  }

  private moveX(dt: number, solids: readonly Box[]): void {
    this.x += this.vx * dt;
    for (const s of solids) {
      if (!overlaps(this.box, s)) continue;
      this.x = this.vx > 0 ? s.x - PIP.WIDTH : s.x + s.w;
      this.vx = 0;
    }
  }

  private moveY(dt: number, solids: readonly Box[]): void {
    const wasOnGround = this.onGround;
    this.y += this.vy * dt;
    this.onGround = false;
    for (const s of solids) {
      if (!overlaps(this.box, s)) continue;
      if (this.vy >= 0) {
        this.y = s.y - PIP.HEIGHT;
        this.onGround = true;
      } else {
        this.y = s.y + s.h; // bumped a ceiling
        this.rising = false;
      }
      this.vy = 0;
    }
    // Standing still on the ground: check there's still something under the feet.
    if (!this.onGround && this.vy === 0) {
      const probe = { ...this.box, y: this.y + 1 };
      this.onGround = solids.some((s) => overlaps(probe, s));
    }
    if (this.onGround && !wasOnGround) this.sinceLanding = 0;
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

/** Move `value` toward `target` by at most `step`. */
export function approach(value: number, target: number, step: number): number {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

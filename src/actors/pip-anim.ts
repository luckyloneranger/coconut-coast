// Picks Pip's animation frame from what Pip is doing. Plain logic with its own
// timers (how long Pip has stood still, a throw or hit just now), so it can be tested.

import { ANIM } from '../game/tuning';
import { PIP_FRAMES, type PipAnim } from '../gfx/art/code/pip';

/** What the picker needs to know each step. */
export interface AnimInput {
  onGround: boolean;
  vx: number;
  vy: number;
  skidding: boolean;
  ducking: boolean;
  /** s since landing (the squash shows just after). */
  sinceLanding: number;
  /** px walked so far (walk and run frames go by distance, so feet don't slide). */
  stride: number;
  dying: boolean;
  won: boolean;
}

export class PipAnimator {
  /** s spent standing still (for the bored animation). */
  idleTime = 0;
  /** s since the last throw / hit (large = long ago). */
  sinceThrow = 99;
  sinceHurt = 99;
  /** s since this animation started (for looping ones). */
  private animTime = 0;
  private current: PipAnim = 'idle';

  throwNow(): void {
    this.sinceThrow = 0;
  }

  hurtNow(): void {
    this.sinceHurt = 0;
  }

  /** Should the sprite show the white hit flash right now? */
  get flashing(): boolean {
    return this.sinceHurt < ANIM.FLASH_TIME;
  }

  update(dt: number, s: AnimInput): void {
    this.sinceThrow += dt;
    this.sinceHurt += dt;
    const still = s.onGround && Math.abs(s.vx) < 1 && !s.ducking;
    this.idleTime = still ? this.idleTime + dt : 0;
    const next = this.pick(s);
    this.animTime = next === this.current ? this.animTime + dt : 0;
    this.current = next;
  }

  get anim(): PipAnim {
    return this.current;
  }

  private pick(s: AnimInput): PipAnim {
    if (s.dying) return 'death';
    if (s.won) return 'victory';
    if (this.sinceHurt < ANIM.HURT_TIME) return 'hurt';
    if (this.sinceThrow < ANIM.THROW_TIME) return 'throw';
    if (!s.onGround) {
      if (Math.abs(s.vy) < ANIM.APEX_SPEED) return 'apex';
      return s.vy < 0 ? 'rise' : 'fall';
    }
    if (s.ducking) return 'duck';
    if (s.sinceLanding < 0.08) return 'land';
    if (s.skidding) return 'skid';
    const speed = Math.abs(s.vx);
    if (speed >= 1) return speed > 101 ? 'run' : 'walk';
    return this.idleTime > ANIM.BORED_AFTER ? 'bored' : 'idle';
  }

  /** The frame number in Pip's sheet. */
  frame(s: AnimInput): number {
    const a = PIP_FRAMES[this.current];
    let i = 0;
    if (this.current === 'walk') i = Math.floor(s.stride / ANIM.WALK_STRIDE);
    else if (this.current === 'run') i = Math.floor(s.stride / ANIM.RUN_STRIDE);
    else if (this.current === 'throw') i = this.sinceThrow < ANIM.THROW_TIME / 2 ? 0 : 1;
    else if (a.fps > 0) i = Math.floor(this.animTime * a.fps);
    return a.start + (i % a.count);
  }
}

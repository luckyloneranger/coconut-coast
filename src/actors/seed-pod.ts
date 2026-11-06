// A seed pod fired from the Slingshot: flies in an arc, skips off the ground a
// couple of times (so it can hit low enemies like the urchin), and pops on walls.

import { SEED } from '../game/tuning';
import type { Level } from '../world/level';
import { TILE } from '../world/tiles';
import type { Box } from './solids';

export class SeedPod {
  x: number; // px, centre
  y: number;
  vx: number;
  vy = SEED.SPEED_Y;
  age = 0;
  gone = false;
  /** Skips off the ground left. */
  bounces = SEED.BOUNCES;

  constructor(x: number, y: number, facingLeft: boolean) {
    this.x = x;
    this.y = y;
    this.vx = facingLeft ? -SEED.SPEED_X : SEED.SPEED_X;
  }

  get box(): Box {
    return { x: this.x - SEED.SIZE / 2, y: this.y - SEED.SIZE / 2, w: SEED.SIZE, h: SEED.SIZE };
  }

  update(dt: number, level: Level): void {
    if (this.gone) return;
    this.age += dt;
    this.vy += SEED.GRAVITY * dt;
    this.x += this.vx * dt;
    const half = SEED.SIZE / 2;
    // Walls (or the edge of the level) pop it.
    if (level.isSolid(Math.floor((this.x + Math.sign(this.vx) * half) / TILE), Math.floor(this.y / TILE))) {
      this.gone = true;
      return;
    }
    const nextY = this.y + this.vy * dt;
    const row = Math.floor((nextY + half) / TILE);
    if (this.vy > 0 && level.isFloor(Math.floor(this.x / TILE), row) && this.y + half <= row * TILE) {
      // Hit the ground: skip back up, or pop if out of bounces.
      if (this.bounces <= 0) {
        this.gone = true;
        return;
      }
      this.bounces--;
      this.y = row * TILE - half;
      this.vy = -this.vy * SEED.BOUNCE_KEEP;
    } else {
      this.y = nextY;
    }
    if (this.age > SEED.LIFE || this.y > level.heightPx) this.gone = true;
  }
}

/** Can Pip fire another pod? (At most two on screen.) */
export function canFire(pods: readonly SeedPod[]): boolean {
  return pods.filter((p) => !p.gone).length < SEED.MAX_ON_SCREEN;
}

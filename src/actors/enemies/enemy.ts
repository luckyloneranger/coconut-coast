// What every enemy has in common. Each kind adds its own movement in update().

import type { Box } from '../solids';
import type { Level, Spot } from '../../world/level';
import type { EnemyKind } from '../../world/tiles';

/** What an enemy can see each step. */
export interface EnemyContext {
  level: Level;
  /** Pip's feet. */
  pipX: number;
  pipY: number;
}

export abstract class Enemy {
  abstract readonly kind: EnemyKind;
  /** Can Pip defeat it by landing on top? */
  abstract readonly stompable: boolean;
  x = 0; // px, left of the collision box
  y = 0; // px, top
  abstract readonly w: number;
  abstract readonly h: number;
  /** Starts moving once near the screen, then keeps going. */
  awake = false;
  /** Gone for good (until Pip comes back after a death). */
  defeated = false;
  /** s left of the squashed look after a stomp (0 = not squashed). */
  squash = 0;
  facingLeft = true;
  /** s, for animation. */
  protected time = 0;

  constructor(readonly home: Spot) {}

  get box(): Box {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  /** Does it still hurt or block (alive and not mid-squash)? */
  get active(): boolean {
    return !this.defeated && this.squash <= 0;
  }

  /** Back to the starting place, asleep. */
  reset(): void {
    this.x = this.home.x - this.w / 2;
    this.y = this.home.y - this.h;
    this.awake = false;
    this.defeated = false;
    this.squash = 0;
    this.facingLeft = true;
    this.time = 0;
    this.onReset();
  }

  /** Squash it (a stomp); it disappears when the squash is over. */
  stomp(squashTime: number): void {
    this.squash = squashTime;
  }

  update(dt: number, ctx: EnemyContext): void {
    if (this.defeated) return;
    if (this.squash > 0) {
      this.squash -= dt;
      if (this.squash <= 0) this.defeated = true;
      return;
    }
    this.time += dt;
    this.move(dt, ctx);
  }

  /** The animation frame to draw (0-3). */
  abstract get frame(): number;
  protected abstract move(dt: number, ctx: EnemyContext): void;
  protected onReset(): void {}
}

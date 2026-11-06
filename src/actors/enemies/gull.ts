// Gull: glides back and forth up high. When Pip comes close underneath, it
// swoops down in a curve to where Pip was, then climbs back up and carries on.

import { GULL } from '../../game/tuning';
import { Enemy, type EnemyContext } from './enemy';

export class Gull extends Enemy {
  readonly kind = 'gull' as const;
  readonly stompable = true;
  readonly w = GULL.WIDTH;
  readonly h = GULL.HEIGHT;
  /** Centre of the glide, px (it moves after each swoop). */
  private centreX = 0;
  private flyY = 0;
  /** s into the current swoop (-1 = gliding). */
  swoopT = -1;
  private swoopFrom = { x: 0, y: 0 };
  private swoopTo = { x: 0, y: 0 };
  private cooldown = 0;

  protected onReset(): void {
    this.centreX = this.x;
    this.flyY = this.y;
    this.swoopT = -1;
    this.cooldown = 0;
  }

  get frame(): number {
    return Math.floor(this.time / GULL.FRAME_TIME) % 4;
  }

  get swooping(): boolean {
    return this.swoopT >= 0;
  }

  protected move(dt: number, ctx: EnemyContext): void {
    if (this.swoopT >= 0) {
      this.swoopT += dt;
      const t = Math.min(1, this.swoopT / GULL.SWOOP_TIME);
      // Straight across, dipping down to Pip's height halfway (a smooth curve).
      this.x = this.swoopFrom.x + (this.swoopTo.x - this.swoopFrom.x) * t;
      this.y = this.flyY + (this.swoopTo.y - this.flyY) * Math.sin(Math.PI * t);
      if (t >= 1) {
        this.swoopT = -1;
        this.cooldown = GULL.COOLDOWN;
        this.centreX = this.x;
        this.y = this.flyY;
      }
      return;
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    // Glide back and forth around the centre.
    const dir = this.facingLeft ? -1 : 1;
    this.x += dir * GULL.PATROL_SPEED * dt;
    if (this.x < this.centreX - GULL.PATROL) this.facingLeft = false;
    if (this.x > this.centreX + GULL.PATROL) this.facingLeft = true;

    const midX = this.x + this.w / 2;
    const below = ctx.pipY > this.y + this.h;
    if (this.cooldown <= 0 && below && Math.abs(ctx.pipX - midX) < GULL.TRIGGER) {
      // Swoop through the spot where Pip is now, ending as far past it as it started.
      this.swoopT = 0;
      this.swoopFrom = { x: this.x, y: this.y };
      const targetX = ctx.pipX - this.w / 2;
      this.swoopTo = { x: this.x + 2 * (targetX - this.x), y: ctx.pipY - this.h };
      this.facingLeft = targetX < this.x;
    }
  }
}

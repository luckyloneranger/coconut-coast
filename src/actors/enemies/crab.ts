// Snapper crab: walks back and forth, turning at walls and at ledges.

import { CRAB } from '../../game/tuning';
import { TILE } from '../../world/tiles';
import { Enemy, type EnemyContext } from './enemy';

export class Crab extends Enemy {
  readonly kind = 'crab' as const;
  readonly stompable = true;
  readonly w = CRAB.WIDTH;
  readonly h = CRAB.HEIGHT;
  private vy = 0;

  protected onReset(): void {
    this.vy = 0;
  }

  get frame(): number {
    return Math.floor(this.time / CRAB.FRAME_TIME) % 6; // the 6-frame walk
  }

  protected move(dt: number, { level }: EnemyContext): void {
    const dir = this.facingLeft ? -1 : 1;
    const midCol = Math.floor((this.x + this.w / 2) / TILE);
    // Standing exactly on a floor tile? Otherwise fall until it lands on one.
    const feet = this.y + this.h;
    const onGround = feet % TILE === 0 && level.isFloor(midCol, feet / TILE);
    if (!onGround) {
      this.vy += CRAB.GRAVITY * dt;
      const newFeet = feet + this.vy * dt;
      const landRow = Math.floor(newFeet / TILE);
      if (level.isFloor(midCol, landRow) && feet <= landRow * TILE) {
        this.y = landRow * TILE - this.h;
        this.vy = 0;
      } else {
        this.y = newFeet - this.h;
      }
      return;
    }
    // Walk; turn at a wall ahead, or at a ledge (no floor under the front edge).
    const nextX = this.x + dir * CRAB.SPEED * dt;
    const frontCol = Math.floor((dir < 0 ? nextX : nextX + this.w) / TILE);
    const wall = level.isSolid(frontCol, feet / TILE - 1);
    const ledge = !level.isFloor(frontCol, feet / TILE);
    if (wall || ledge) this.facingLeft = !this.facingLeft;
    else this.x = nextX;
  }
}

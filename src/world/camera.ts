// The camera: which part of the level is on screen. Plain logic, no drawing.
// Sideways it has a dead zone and looks ahead when running; up and down it
// stays on the ground Pip last stood on, so jumping doesn't bob the screen.

import { approach } from '../actors/pip-physics';
import { CAMERA, PIP } from '../game/tuning';

/** What the camera needs to know about Pip. */
export interface CameraTarget {
  feetX: number;
  feetY: number;
  onGround: boolean;
  vx: number;
}

export class Camera {
  x = 0; // px, left edge of the view in the level
  y = 0; // px, top edge
  /** px the view currently leads Pip by (negative = to the left). */
  lookAhead = 0;
  private targetX = 0;
  private targetY = 0;
  /** Feet height of the last ground Pip stood on. */
  private groundY: number;

  constructor(
    readonly viewW: number,
    readonly viewH: number,
    private readonly levelW: number,
    private readonly levelH: number,
    t: CameraTarget,
  ) {
    this.groundY = t.feetY;
    this.snapTo(t);
  }

  /** Jump straight to Pip (at the start, and after a fall). */
  snapTo(t: CameraTarget): void {
    this.lookAhead = 0;
    this.groundY = t.feetY;
    this.targetX = this.clampX(t.feetX - this.viewW / 2);
    this.targetY = this.clampY(t.feetY - CAMERA.FEET_LINE * this.viewH);
    this.x = this.targetX;
    this.y = this.targetY;
  }

  update(dt: number, t: CameraTarget): void {
    // Look ahead only while running (above walking speed), more the faster.
    const runShare = Math.min(1, Math.max(0, (Math.abs(t.vx) - PIP.WALK_SPEED) / (PIP.RUN_SPEED - PIP.WALK_SPEED)));
    this.lookAhead = approach(this.lookAhead, Math.sign(t.vx) * CAMERA.LOOK_AHEAD * runShare, CAMERA.LOOK_AHEAD_RATE * dt);

    // Sideways: move only when the focus point leaves the dead zone.
    const focus = t.feetX + this.lookAhead;
    const centre = this.targetX + this.viewW / 2;
    const half = CAMERA.DEAD_ZONE_W / 2;
    if (focus > centre + half) this.targetX = focus - half - this.viewW / 2;
    else if (focus < centre - half) this.targetX = focus + half - this.viewW / 2;
    this.targetX = this.clampX(this.targetX);

    // Up and down: sit on the last ground, unless a jump goes very high.
    if (t.onGround) this.groundY = t.feetY;
    let ty = this.groundY - CAMERA.FEET_LINE * this.viewH;
    if (t.feetY < ty + CAMERA.TOP_MARGIN * this.viewH) ty = t.feetY - CAMERA.TOP_MARGIN * this.viewH;
    this.targetY = this.clampY(ty);

    // Ease toward the targets.
    const k = Math.min(1, CAMERA.EASE * dt);
    this.x += (this.targetX - this.x) * k;
    this.y += (this.targetY - this.y) * k;
    // A fall is followed straight away, so Pip never drops out of view mid-level.
    const lowest = t.feetY - CAMERA.BOTTOM_MARGIN * this.viewH;
    if (this.y < lowest) this.y = this.clampY(lowest);
  }

  private clampX(x: number): number {
    return Math.min(Math.max(0, x), Math.max(0, this.levelW - this.viewW));
  }
  private clampY(y: number): number {
    return Math.min(Math.max(0, y), Math.max(0, this.levelH - this.viewH));
  }
}

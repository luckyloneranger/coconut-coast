// Phase 1 movement lab: one screen with a floor, a gap, two blocks and height
// marks, to tune how Pip walks, runs and jumps. Real levels come in Phase 2.

import type { InputSnapshot } from '../core/input';
import type { Renderer } from '../core/renderer';
import type { Scene } from '../core/scene';
import { readControls } from '../actors/controls';
import { PipPhysics, type PipPose } from '../actors/pip-physics';
import type { Box } from '../actors/solids';
import { HERO_FRAME } from '../gfx/art/assets';
import type { ArtLibrary } from '../gfx/art/library';
import { LAB, PIP } from '../game/tuning';
import { UI } from '../gfx/palette';

const TILE = 16; // px
const GAP = { from: 288, to: 352 }; // px, the hole in the floor (4 tiles)
/** The floor either side of the gap, a 2-tile block and a ledge over the far side. */
export const LAB_SOLIDS: readonly Box[] = [
  { x: -16, y: LAB.FLOOR_Y, w: GAP.from + 16, h: 40 },
  { x: GAP.to, y: LAB.FLOOR_Y, w: 480 - GAP.to + 16, h: 40 },
  { x: 160, y: LAB.FLOOR_Y - 2 * TILE, w: 3 * TILE, h: 2 * TILE },
  { x: 384, y: LAB.FLOOR_Y - 4 * TILE + 8, w: 4 * TILE, h: 8 }, // a thin ledge 3.5 tiles up
  { x: -16, y: 0, w: 16, h: 270 }, // screen edges
  { x: 480, y: 0, w: 16, h: 270 },
];
const TRAIL_MAX = 90; // dots kept from the last jump
const TRAIL_EVERY = 2; // steps between trail dots

export class TestRoomScene implements Scene {
  readonly name = 'TEST ROOM';
  readonly pip = new PipPhysics(LAB.START_X, LAB.FLOOR_Y - PIP.HEIGHT);
  private trail: { x: number; y: number }[] = [];
  private steps = 0;
  /** Highest point of the last jump, in tiles above where it started. */
  private peak = 0;
  private jumpStartY = 0;

  constructor(
    private readonly art: ArtLibrary,
    private readonly onArtToggle: () => void,
  ) {}

  update(dt: number, input: InputSnapshot): void {
    if (input.justPressed('ART_TOGGLE')) this.onArtToggle();
    const p = this.pip;
    const wasOnGround = p.onGround;
    p.update(dt, readControls(input), LAB_SOLIDS);
    this.steps++;
    if (wasOnGround && !p.onGround) {
      // Left the ground: start a new trail.
      this.trail = [];
      this.jumpStartY = p.feetY;
      this.peak = 0;
    }
    if (!p.onGround) {
      this.peak = Math.max(this.peak, (this.jumpStartY - p.feetY) / TILE);
      if (this.steps % TRAIL_EVERY === 0 && this.trail.length < TRAIL_MAX) this.trail.push({ x: p.feetX, y: p.feetY });
    }
    if (p.y > LAB.FALL_LIMIT) this.respawn();
  }

  private respawn(): void {
    const p = this.pip;
    p.x = LAB.START_X;
    p.y = LAB.FLOOR_Y - PIP.HEIGHT;
    p.vx = 0;
    p.vy = 0;
  }

  render(r: Renderer): void {
    r.rect(0, 0, r.width, 90, UI.SKY_TOP);
    r.rect(0, 90, r.width, 80, UI.SKY_MID);
    r.rect(0, 170, r.width, r.height - 170, UI.SKY_LOW);
    for (const s of LAB_SOLIDS) this.drawSolid(r, s);
    this.drawHeightMarks(r);
    for (const d of this.trail) r.rect(d.x, d.y - 1, 1, 1, UI.WHITE);

    const p = this.pip;
    const sheet = this.art.sheet('hero');
    r.sprite(sheet, this.frameFor(p.pose), p.feetX - sheet.frameW / 2, p.feetY - sheet.frameH, p.facingLeft);

    r.text('PHASE 1 MOVEMENT LAB', r.width / 2, 10, UI.WHITE, 'center');
    r.text('MOVE: ARROWS / A D   RUN: HOLD X / SHIFT   JUMP: SPACE / Z', r.width / 2, 24, UI.YELLOW, 'center');
    r.text('HOLD JUMP TO GO HIGHER', r.width / 2, 38, UI.YELLOW, 'center');
    const ext = this.art.externalReady;
    const art = this.art.source === 'code' ? 'CODE' : `EXTERNAL (${ext} FILE${ext === 1 ? '' : 'S'})`;
    r.text(`LAST JUMP: ${this.peak.toFixed(1)} TILES   ART: ${art} (T)`, r.width / 2, 52, UI.WHITE, 'center');
  }

  private frameFor(pose: PipPose): number {
    switch (pose) {
      case 'walk':
      case 'run':
        return Math.floor(this.pip.stride / PIP.STRIDE) % 2 ? HERO_FRAME.step : HERO_FRAME.stand;
      default:
        return HERO_FRAME[pose === 'stand' ? 'stand' : pose];
    }
  }

  /** Ground blocks: grass on top, sand below. */
  private drawSolid(r: Renderer, s: Box): void {
    if (s.x >= 480 || s.x + s.w <= 0) return;
    r.rect(s.x, s.y, s.w, s.h, UI.SAND);
    r.rect(s.x, s.y + s.h - 2, s.w, 2, UI.SAND_DARK);
    r.rect(s.x, s.y, s.w, Math.min(4, s.h), UI.GRASS);
    if (s.h > 6) r.rect(s.x, s.y + 4, s.w, 2, UI.GRASS_DARK);
  }

  /** Ticks at 1 to 5 tiles above the floor, at the left edge. */
  private drawHeightMarks(r: Renderer): void {
    for (let n = 1; n <= 5; n++) {
      const y = LAB.FLOOR_Y - n * TILE;
      r.rect(4, y, 10, 1, UI.WHITE);
      r.text(String(n), 16, y - 4, UI.WHITE);
    }
  }

  debugLines(): string[] {
    const p = this.pip;
    return [
      `X ${p.x.toFixed(1)}`,
      `Y ${p.y.toFixed(1)}`,
      `ART ${this.art.source}`,
      `HERO ${this.art.sheet('hero').from}`,
      `VX ${p.vx.toFixed(0)} VY ${p.vy.toFixed(0)}`,
      `POSE ${p.pose}${p.onGround ? ' GROUND' : ''}`,
      `PEAK ${this.peak.toFixed(2)}`,
    ];
  }
}

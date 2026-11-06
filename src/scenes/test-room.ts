// Phase 0: a box you can walk and run with, on a plain floor, to prove the
// loop, input, scaling and art switch work. Pip's real movement is Phase 1.

import type { InputSnapshot } from '../core/input';
import type { Renderer } from '../core/renderer';
import type { Scene } from '../core/scene';
import type { ArtLibrary } from '../gfx/art/library';
import { TEST_BOX } from '../game/tuning';
import { UI } from '../gfx/palette';

const STEP_EVERY = 0.15; // s between the box's two frames while moving

export class TestRoomScene implements Scene {
  readonly name = 'TEST ROOM';
  x = 228; // px, left edge of the box
  speed = 0; // px/s, signed
  private facingLeft = false;
  private time = 0;

  constructor(
    private readonly art: ArtLibrary,
    private readonly onArtToggle: () => void,
  ) {}

  update(dt: number, input: InputSnapshot): void {
    this.time += dt;
    if (input.justPressed('ART_TOGGLE')) this.onArtToggle();
    const dir = (input.isDown('RIGHT') ? 1 : 0) - (input.isDown('LEFT') ? 1 : 0);
    const top = input.isDown('RUN') ? TEST_BOX.RUN_SPEED : TEST_BOX.WALK_SPEED;
    this.speed = dir * top;
    if (dir !== 0) this.facingLeft = dir < 0;
    const sheet = this.art.sheet('hero');
    this.x = Math.min(Math.max(0, this.x + this.speed * dt), 480 - sheet.frameW);
  }

  render(r: Renderer): void {
    // Sky in three bands, sand floor with a grass edge.
    r.rect(0, 0, r.width, 90, UI.SKY_TOP);
    r.rect(0, 90, r.width, 80, UI.SKY_MID);
    r.rect(0, 170, r.width, TEST_BOX.FLOOR_Y - 170, UI.SKY_LOW);
    r.rect(0, TEST_BOX.FLOOR_Y, r.width, 4, UI.GRASS);
    r.rect(0, TEST_BOX.FLOOR_Y + 4, r.width, 2, UI.GRASS_DARK);
    r.rect(0, TEST_BOX.FLOOR_Y + 6, r.width, r.height - TEST_BOX.FLOOR_Y - 6, UI.SAND);

    const sheet = this.art.sheet('hero');
    const moving = this.speed !== 0;
    const frame = moving ? Math.floor(this.time / STEP_EVERY) % 2 : 0;
    r.sprite(sheet, frame, this.x, TEST_BOX.FLOOR_Y - sheet.frameH, this.facingLeft);

    r.text('COCONUT COAST - PHASE 0 TEST ROOM', r.width / 2, 16, UI.WHITE, 'center');
    r.text('MOVE: ARROWS / A D   RUN: HOLD X OR SHIFT', r.width / 2, 34, UI.YELLOW, 'center');
    const ext = this.art.externalReady;
    const art = this.art.source === 'code' ? 'CODE' : `EXTERNAL (${ext} FILE${ext === 1 ? '' : 'S'})`;
    r.text(`ART: ${art}   T: SWITCH`, r.width / 2, 52, UI.WHITE, 'center');
    r.text(`HERO DRAWN FROM: ${sheet.from.toUpperCase()}`, r.width / 2, 250, UI.INK, 'center');
  }

  debugLines(): string[] {
    return [`X ${this.x.toFixed(1)}`, `SPEED ${this.speed}`, `ART ${this.art.source}`, `HERO ${this.art.sheet('hero').from}`];
  }
}

// Plays one level: Pip, the tiles, the camera and the end flag. Enemies,
// items, lives and checkpoints join in later phases.

import type { InputSnapshot } from '../core/input';
import type { Renderer } from '../core/renderer';
import type { Scene } from '../core/scene';
import { readControls } from '../actors/controls';
import { PipPhysics, type PipPose } from '../actors/pip-physics';
import { HERO_FRAME } from '../gfx/art/assets';
import type { ArtLibrary } from '../gfx/art/library';
import { LEVEL, PIP } from '../game/tuning';
import { UI } from '../gfx/palette';
import { Camera } from '../world/camera';
import { Level, type LevelSource } from '../world/level';
import { TILE } from '../world/tiles';

const PLANK = '#a8683a';
const PLANK_LIGHT = '#d8985a';
const FLAG_REACH = 12; // px: touching the flag pole this close counts

export class LevelScene implements Scene {
  readonly name = 'LEVEL';
  readonly level: Level;
  readonly pip: PipPhysics;
  readonly camera: Camera;
  /** Has Pip reached the end flag? */
  finished = false;
  /** How many times Pip has fallen (shown until lives exist). */
  falls = 0;

  constructor(
    src: LevelSource,
    private readonly art: ArtLibrary,
    private readonly onArtToggle: () => void,
    viewW = 480,
    viewH = 270,
  ) {
    this.level = new Level(src);
    this.pip = new PipPhysics(0, 0);
    this.placeAtStart();
    this.camera = new Camera(viewW, viewH, this.level.widthPx, this.level.heightPx, this.pip);
  }

  private placeAtStart(): void {
    const p = this.pip;
    p.x = this.level.start.x - PIP.WIDTH / 2;
    p.y = this.level.start.y - PIP.HEIGHT;
    p.vx = 0;
    p.vy = 0;
  }

  update(dt: number, input: InputSnapshot): void {
    if (input.justPressed('ART_TOGGLE')) this.onArtToggle();
    const p = this.pip;
    const { solids, oneWays } = this.level.boxesNear(p.box);
    p.update(dt, readControls(input), solids, oneWays);
    if (p.y > this.level.heightPx + LEVEL.FALL_BELOW) {
      // Fell in a pit: back to the start (checkpoints and lives come in Phase 3).
      this.falls++;
      this.placeAtStart();
      this.camera.snapTo(p);
      return;
    }
    const flag = this.level.flag;
    if (flag && !this.finished && Math.abs(p.feetX - flag.x) < FLAG_REACH && p.feetY > flag.y - 4 * TILE) this.finished = true;
    this.camera.update(dt, p);
  }

  render(r: Renderer): void {
    const cx = Math.round(this.camera.x);
    const cy = Math.round(this.camera.y);
    // Sky: fixed bands for now (parallax backgrounds come with the art).
    r.rect(0, 0, r.width, 90, UI.SKY_TOP);
    r.rect(0, 90, r.width, 80, UI.SKY_MID);
    r.rect(0, 170, r.width, r.height - 170, UI.SKY_LOW);
    this.drawTiles(r, cx, cy);
    this.drawStartMarks(r, cx, cy);
    this.drawFlag(r, cx, cy);

    const p = this.pip;
    const sheet = this.art.sheet('hero');
    r.sprite(sheet, this.frameFor(p.pose), p.feetX - sheet.frameW / 2 - cx, p.feetY - sheet.frameH - cy, p.facingLeft);

    r.text(this.level.name, 8, 8, UI.WHITE);
    r.text(`FALLS ${this.falls}`, r.width - 8, 8, UI.WHITE, 'right');
    if (this.finished) r.text('END FLAG REACHED!', r.width / 2, 40, UI.YELLOW, 'center', 2);
  }

  /** Only the tiles on screen. Ground gets a grass edge where there's air above it. */
  private drawTiles(r: Renderer, cx: number, cy: number): void {
    const L = this.level;
    const tx0 = Math.floor(cx / TILE);
    const ty0 = Math.floor(cy / TILE);
    for (let ty = ty0; ty <= ty0 + Math.ceil(r.height / TILE); ty++) {
      for (let tx = tx0; tx <= tx0 + Math.ceil(r.width / TILE); tx++) {
        if (tx < 0 || tx >= L.cols) continue;
        const t = L.tileAt(tx, ty);
        if (t === 'air') continue;
        const x = tx * TILE - cx;
        const y = ty * TILE - cy;
        if (t === 'oneway') {
          r.rect(x, y, TILE, 5, PLANK);
          r.rect(x, y, TILE, 1, PLANK_LIGHT);
          r.rect(x + 2, y + 5, 2, 3, PLANK); // little supports
          r.rect(x + TILE - 4, y + 5, 2, 3, PLANK);
          continue;
        }
        r.rect(x, y, TILE, TILE, UI.SAND);
        if (L.tileAt(tx, ty - 1) !== 'ground') {
          r.rect(x, y, TILE, 4, UI.GRASS);
          r.rect(x, y + 4, TILE, 2, UI.GRASS_DARK);
        }
      }
    }
  }

  /** Height marks at 1 to 5 tiles above the start, to judge jumps. */
  private drawStartMarks(r: Renderer, cx: number, cy: number): void {
    const s = this.level.start;
    for (let n = 1; n <= 5; n++) {
      const y = s.y - n * TILE - cy;
      r.rect(s.x - 40 - cx, y, 10, 1, UI.WHITE);
      r.text(String(n), s.x - 28 - cx, y - 4, UI.WHITE);
    }
  }

  private drawFlag(r: Renderer, cx: number, cy: number): void {
    const f = this.level.flag;
    if (!f) return;
    const x = f.x - cx;
    const y = f.y - cy;
    r.rect(x, y - 4 * TILE, 2, 4 * TILE, UI.WHITE);
    r.rect(x + 2, y - 4 * TILE, 14, 9, this.finished ? UI.GREEN : UI.YELLOW);
  }

  private frameFor(pose: PipPose): number {
    if (pose === 'walk' || pose === 'run') return Math.floor(this.pip.stride / PIP.STRIDE) % 2 ? HERO_FRAME.step : HERO_FRAME.stand;
    return HERO_FRAME[pose];
  }

  debugLines(): string[] {
    const p = this.pip;
    return [
      `X ${p.x.toFixed(1)}`,
      `Y ${p.y.toFixed(1)}`,
      `ART ${this.art.source}`,
      `HERO ${this.art.sheet('hero').from}`,
      `CAM ${this.camera.x.toFixed(0)} ${this.camera.y.toFixed(0)}`,
      `VX ${p.vx.toFixed(0)} VY ${p.vy.toFixed(0)}`,
      `POSE ${p.pose}${p.onGround ? ' GROUND' : ''}`,
    ];
  }
}

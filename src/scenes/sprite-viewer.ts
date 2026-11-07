// The sprite viewer (?sprites=1): every sheet with its frames, an animation
// preview, its palette, and where it comes from (code or an external PNG), so
// art can be checked without playing. ← → change sheet, ↑ ↓ change animation,
// T switches between code-drawn and external art.

import type { InputSnapshot } from '../core/input';
import type { Renderer } from '../core/renderer';
import type { Scene } from '../core/scene';
import { ASSETS, ASSET_IDS, type AssetId } from '../gfx/art/assets';
import type { ArtLibrary } from '../gfx/art/library';
import { PIP_FRAMES, type PipAnim } from '../gfx/art/code/pip';
import { GroundTiles } from '../gfx/art/ground-tiles';
import { UI } from '../gfx/palette';

const PIP_SHEETS: readonly AssetId[] = ['pip', 'pipBig', 'pipSling'];
const PREVIEW_FPS = 8; // frames a second for sheets without named animations
const GROUND_PAGE = 'ground (auto-tiles)';
/** A little patch of ground to show the auto-tiling: steps, an overhang, a pillar. */
const GROUND_SAMPLE = ['........#...', '..###...#...', '.#####..#..#', '#######.####', '############'];

export class SpriteViewerScene implements Scene {
  readonly name = 'SPRITES';
  page = 0;
  private animIndex = 0;
  private time = 0;
  private readonly ground = new GroundTiles();

  constructor(
    private readonly art: ArtLibrary,
    private readonly onArtToggle: () => void,
  ) {}

  private get pages(): string[] {
    return [...ASSET_IDS, GROUND_PAGE];
  }

  update(dt: number, input: InputSnapshot): void {
    this.time += dt;
    const n = this.pages.length;
    if (input.justPressed('RIGHT')) this.page = (this.page + 1) % n;
    if (input.justPressed('LEFT')) this.page = (this.page + n - 1) % n;
    const anims = Object.keys(PIP_FRAMES) as PipAnim[];
    if (input.justPressed('DOWN')) this.animIndex = (this.animIndex + 1) % anims.length;
    if (input.justPressed('UP')) this.animIndex = (this.animIndex + anims.length - 1) % anims.length;
    if (input.justPressed('ART_TOGGLE')) this.onArtToggle();
  }

  render(r: Renderer): void {
    r.clear('#283048');
    const name = this.pages[this.page];
    r.text(`SPRITE VIEWER  ${this.page + 1}/${this.pages.length}  < > SHEET   T: ART ${this.art.source.toUpperCase()}`, 6, 6, UI.WHITE);
    if (name === GROUND_PAGE) {
      this.drawGround(r);
      return;
    }
    const id = name as AssetId;
    const spec = ASSETS[id];
    const sheet = this.art.sheet(id);
    const status = this.art.status.get(id);
    r.text(`${id.toUpperCase()}  ${spec.frameW}x${spec.frameH}  ${spec.frames} FRAMES  FILE ${spec.file}`, 6, 20, UI.YELLOW);
    r.text(`SHOWING: ${sheet.from.toUpperCase()}   EXTERNAL FILE: ${String(status).toUpperCase()}`, 6, 32, UI.GREY);

    // The animation preview, 3x.
    let first = 0;
    let count = spec.frames;
    let fps = PREVIEW_FPS;
    if (PIP_SHEETS.includes(id)) {
      const anims = Object.keys(PIP_FRAMES) as PipAnim[];
      const a = anims[this.animIndex];
      first = PIP_FRAMES[a].start;
      count = PIP_FRAMES[a].count;
      fps = PIP_FRAMES[a].fps || PREVIEW_FPS;
      r.text(`ANIM ${a.toUpperCase()} (UP/DOWN)`, 6, 44, UI.WHITE);
    }
    const frame = first + (Math.floor(this.time * fps) % count);
    r.rect(6, 56, spec.frameW * 3 + 8, spec.frameH * 3 + 8, '#3a4460');
    r.spriteScaled(sheet, frame, 10, 60, 3);

    // Every frame, 2x, wrapping across the screen.
    const scale = 2;
    const left = spec.frameW * 3 + 24;
    const perRow = Math.max(1, Math.floor((r.width - left - 6) / (spec.frameW * scale + 2)));
    for (let i = 0; i < spec.frames; i++) {
      const x = left + (i % perRow) * (spec.frameW * scale + 2);
      const y = 56 + Math.floor(i / perRow) * (spec.frameH * scale + 2);
      if (y + spec.frameH * scale > r.height - 36) break; // leave room for the palette
      r.spriteScaled(sheet, i, x, y, scale);
    }

    // The palette of the code-drawn version.
    const palette = Object.entries(spec.code[0].palette);
    palette.forEach(([ch, colour], i) => {
      r.rect(6 + i * 14, r.height - 20, 12, 12, colour);
      r.text(ch, 8 + i * 14, r.height - 32, UI.WHITE);
    });
  }

  private drawGround(r: Renderer): void {
    r.text('GROUND: EACH TILE PICKS ITS EDGES FROM ITS NEIGHBOURS', 6, 20, UI.YELLOW);
    const isGround = (x: number, y: number) => y >= GROUND_SAMPLE.length || (GROUND_SAMPLE[y]?.[x] ?? '.') === '#';
    GROUND_SAMPLE.forEach((row, ty) => {
      for (let tx = 0; tx < row.length; tx++) {
        if (row[tx] !== '#') continue;
        const nb = {
          n: isGround(tx, ty - 1),
          e: isGround(tx + 1, ty),
          s: isGround(tx, ty + 1),
          w: isGround(tx - 1, ty),
          nw: isGround(tx - 1, ty - 1),
          ne: isGround(tx + 1, ty - 1),
        };
        r.image(this.ground.get(nb, tx, ty), 20 + tx * 32, 50 + ty * 32, 2);
      }
    });
  }

  debugLines(): string[] {
    return [`PAGE ${this.pages[this.page]}`];
  }
}

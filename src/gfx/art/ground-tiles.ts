// Ground tile pictures, built on first use for each combination of
// neighbours and sand variation, then reused.

import { groundTile, tileHash, type GroundNeighbours } from './code/tiles-beach';
import { mapPixels } from './pixels';

const VARIANTS = 4; // sand variations

export class GroundTiles {
  private readonly cache = new Map<string, HTMLCanvasElement>();
  private readonly backs: HTMLCanvasElement[] = [];

  /**
   * The back wall of a pit: the same sand, in shadow, so a gap reads as a hole
   * in the ground (not a window onto the far beach). `top`: the first row, with
   * a darker lip where the shadow falls.
   */
  back(tx: number, ty: number, top: boolean): HTMLCanvasElement {
    const i = (tileHash(tx, ty) % VARIANTS) * 2 + (top ? 1 : 0);
    if (!this.backs[i]) {
      const c = document.createElement('canvas');
      c.width = 16;
      c.height = 16;
      const ctx = c.getContext('2d')!;
      for (const p of mapPixels(groundTile({ n: true, e: true, s: true, w: true, nw: true, ne: true }, Math.floor(i / 2)))) {
        ctx.fillStyle = p.colour;
        ctx.fillRect(p.x, p.y, 1, 1);
      }
      ctx.fillStyle = 'rgba(40, 20, 30, 0.55)'; // in shadow
      ctx.fillRect(0, 0, 16, 16);
      if (top) {
        ctx.fillStyle = 'rgba(30, 14, 22, 0.45)';
        ctx.fillRect(0, 0, 16, 5);
      }
      this.backs[i] = c;
    }
    return this.backs[i];
  }

  /** The picture for the ground tile at (tx, ty) with these neighbours. */
  get(nb: GroundNeighbours, tx: number, ty: number): HTMLCanvasElement {
    const variant = tileHash(tx, ty) % VARIANTS;
    const key = `${+nb.n}${+nb.e}${+nb.s}${+nb.w}${+nb.nw}${+nb.ne}${variant}`;
    let c = this.cache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = 16;
      c.height = 16;
      const ctx = c.getContext('2d')!;
      for (const p of mapPixels(groundTile(nb, variant))) {
        ctx.fillStyle = p.colour;
        ctx.fillRect(p.x, p.y, 1, 1);
      }
      this.cache.set(key, c);
    }
    return c;
  }
}

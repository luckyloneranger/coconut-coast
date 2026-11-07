// Ground tile pictures, built on first use for each combination of
// neighbours and sand variation, then reused.

import { groundTile, tileHash, type GroundNeighbours } from './code/tiles-beach';
import { mapPixels } from './pixels';

const VARIANTS = 4; // sand variations

export class GroundTiles {
  private readonly cache = new Map<string, HTMLCanvasElement>();

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

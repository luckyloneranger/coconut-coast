// A tiny pixel canvas for building code-drawn sprites out of simple shapes.

import type { PixelMap } from '../pixels';

export class PixelGrid {
  private readonly cells: string[][];
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.cells = Array.from({ length: h }, () => Array<string>(w).fill('.'));
  }
  set(x: number, y: number, ch: string): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.cells[y][x] = ch;
  }
  get(x: number, y: number): string {
    return this.cells[y]?.[x] ?? '.';
  }
  rect(x: number, y: number, w: number, h: number, ch: string): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ch);
  }
  /** A filled ellipse centred at (cx, cy) with radii rx, ry. */
  ellipse(cx: number, cy: number, rx: number, ry: number, ch: string): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.set(x, y, ch);
      }
    }
  }
  /** Draw `outline` round every filled pixel that touches empty space (a 1 px border). */
  outline(ch: string): void {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) !== '.') continue;
        const near = [this.get(x - 1, y), this.get(x + 1, y), this.get(x, y - 1), this.get(x, y + 1)];
        if (near.some((c) => c !== '.' && c !== ch)) add.push([x, y]);
      }
    }
    for (const [x, y] of add) this.set(x, y, ch);
  }
  toMap(palette: Record<string, string>): PixelMap {
    return { rows: this.cells.map((r) => r.join('')), palette };
  }
}

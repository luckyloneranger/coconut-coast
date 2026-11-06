// Reads a level's text map into a tile grid, checking it first so a typo gives
// a clear message instead of a broken level.

import type { Box } from '../actors/solids';
import { LEGEND, TILE, type TileKind } from './tiles';

export interface LevelSource {
  name: string; // e.g. "0-1 TEST LEVEL"
  rows: readonly string[];
}

export class Level {
  readonly name: string;
  readonly cols: number;
  readonly rowsCount: number;
  private readonly grid: TileKind[];
  /** Pip's starting feet position (px). */
  readonly start: { x: number; y: number };
  /** The end flag's foot (px), if the level has one. */
  readonly flag: { x: number; y: number } | null;

  constructor(src: LevelSource) {
    const problems = checkLevel(src);
    if (problems.length) throw new Error(`Level "${src.name}": ${problems.join('; ')}`);
    this.name = src.name;
    this.rowsCount = src.rows.length;
    this.cols = src.rows[0].length;
    this.grid = [];
    let start = { x: 0, y: 0 };
    let flag: { x: number; y: number } | null = null;
    src.rows.forEach((row, ty) => {
      for (let tx = 0; tx < row.length; tx++) {
        const entry = LEGEND[row[tx]];
        this.grid.push(entry.tile);
        const foot = { x: tx * TILE + TILE / 2, y: (ty + 1) * TILE };
        if (entry.marker === 'start') start = foot;
        if (entry.marker === 'flag') flag = foot;
      }
    });
    this.start = start;
    this.flag = flag;
  }

  get widthPx(): number {
    return this.cols * TILE;
  }
  get heightPx(): number {
    return this.rowsCount * TILE;
  }

  /** The tile at a grid position. Past the left or right edge is a wall; above or below is open air (pits). */
  tileAt(tx: number, ty: number): TileKind {
    if (tx < 0 || tx >= this.cols) return 'ground';
    if (ty < 0 || ty >= this.rowsCount) return 'air';
    return this.grid[ty * this.cols + tx];
  }

  /** Solid tiles and one-way tops near an area (px), as boxes for the collision code. */
  boxesNear(area: Box): { solids: Box[]; oneWays: Box[] } {
    const solids: Box[] = [];
    const oneWays: Box[] = [];
    const tx0 = Math.floor(area.x / TILE) - 1;
    const tx1 = Math.floor((area.x + area.w) / TILE) + 1;
    const ty0 = Math.floor(area.y / TILE) - 1;
    const ty1 = Math.floor((area.y + area.h) / TILE) + 1;
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = this.tileAt(tx, ty);
        if (t === 'ground') solids.push({ x: tx * TILE, y: ty * TILE, w: TILE, h: TILE });
        else if (t === 'oneway') oneWays.push({ x: tx * TILE, y: ty * TILE, w: TILE, h: TILE });
      }
    }
    return { solids, oneWays };
  }
}

/** Everything wrong with a level's text map (empty when it's fine). */
export function checkLevel(src: LevelSource): string[] {
  const problems: string[] = [];
  if (src.rows.length === 0) return ['it has no rows'];
  const width = src.rows[0].length;
  let starts = 0;
  let flags = 0;
  src.rows.forEach((row, y) => {
    if (row.length !== width) problems.push(`row ${y + 1} is ${row.length} wide, not ${width}`);
    for (let x = 0; x < row.length; x++) {
      const entry = LEGEND[row[x]];
      if (!entry) problems.push(`unknown letter '${row[x]}' at column ${x + 1}, row ${y + 1}`);
      else if (entry.marker === 'start') starts++;
      else if (entry.marker === 'flag') flags++;
    }
  });
  if (starts !== 1) problems.push(`it needs exactly one start (P), found ${starts}`);
  if (flags > 1) problems.push(`it has ${flags} end flags (F); one at most`);
  return problems;
}

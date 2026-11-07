// Reads a level's text map into a tile grid, checking it first so a typo gives
// a clear message instead of a broken level.

import type { Box } from '../actors/solids';
import { ENEMY_MARKERS, LEGEND, SOLID_TILES, TILE, type CrateItem, type EnemyKind, type TileKind } from './tiles';

/** A spot in the level, in px: feet position (bottom centre of a tile). */
export interface Spot {
  x: number;
  y: number;
}

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
  /** Checkpoint posts, left to right. */
  readonly checkpoints: Spot[] = [];
  /** Where each enemy starts. */
  readonly enemies: (Spot & { kind: EnemyKind })[] = [];
  /** Fruit and Sun Coin spots (the centre of their tile, px). */
  readonly fruit: Spot[] = [];
  readonly coins: Spot[] = [];
  /** What each unopened crate holds, by tile index. */
  private readonly crates = new Map<number, CrateItem>();

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
        if (entry.marker === 'checkpoint') this.checkpoints.push(foot);
        if (entry.marker === 'fruit') this.fruit.push({ x: foot.x, y: foot.y - TILE / 2 });
        if (entry.marker === 'coin') this.coins.push({ x: foot.x, y: foot.y - TILE / 2 });
        if (entry.crate) this.crates.set(ty * this.cols + tx, entry.crate);
        if (entry.marker && (ENEMY_MARKERS as readonly string[]).includes(entry.marker)) this.enemies.push({ ...foot, kind: entry.marker as EnemyKind });
      }
    });
    this.start = start;
    this.flag = flag;
    this.checkpoints.sort((a, b) => a.x - b.x);
  }

  /** Is this tile solid (ground, a crate, cracked stone)? */
  isSolid(tx: number, ty: number): boolean {
    return SOLID_TILES.has(this.tileAt(tx, ty));
  }

  /** Is this tile something you stand on (solid or a one-way top)? */
  isFloor(tx: number, ty: number): boolean {
    return this.isSolid(tx, ty) || this.tileAt(tx, ty) === 'oneway';
  }

  /** Is there sea water at this point (px)? */
  waterAt(x: number, y: number): boolean {
    return this.tileAt(Math.floor(x / TILE), Math.floor(y / TILE)) === 'water';
  }

  /** Change a tile (a crate opening, cracked stone breaking). */
  setTile(tx: number, ty: number, kind: TileKind): void {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rowsCount) return;
    this.grid[ty * this.cols + tx] = kind;
  }

  /** Open a crate: it becomes an empty crate, and its item is returned (once). */
  openCrate(tx: number, ty: number): CrateItem | null {
    const i = ty * this.cols + tx;
    const item = this.crates.get(i);
    if (this.tileAt(tx, ty) !== 'crate' || !item) return null;
    this.crates.delete(i);
    this.setTile(tx, ty, 'used');
    return item;
  }

  /** Spike tiles near an area, as their sharp part (the lower 10 px, slightly narrower). */
  hazardsNear(area: Box): Box[] {
    const out: Box[] = [];
    const tx0 = Math.floor(area.x / TILE) - 1;
    const tx1 = Math.floor((area.x + area.w) / TILE) + 1;
    const ty0 = Math.floor(area.y / TILE) - 1;
    const ty1 = Math.floor((area.y + area.h) / TILE) + 1;
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (this.tileAt(tx, ty) === 'spikes') out.push({ x: tx * TILE + SPIKE_INSET, y: ty * TILE + TILE - SPIKE_HEIGHT, w: TILE - 2 * SPIKE_INSET, h: SPIKE_HEIGHT });
      }
    }
    return out;
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
        if (SOLID_TILES.has(t)) solids.push({ x: tx * TILE, y: ty * TILE, w: TILE, h: TILE });
        else if (t === 'oneway') oneWays.push({ x: tx * TILE, y: ty * TILE, w: TILE, h: TILE });
      }
    }
    return { solids, oneWays };
  }
}

const SPIKE_HEIGHT = 10; // px of a spike tile that hurts (its points)
const SPIKE_INSET = 2; // px trimmed from each side, so brushing the edge is fair

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

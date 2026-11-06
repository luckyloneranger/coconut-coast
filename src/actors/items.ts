// Things Pip collects: fruit and Sun Coins placed in the level, and items that
// pop up out of crates (power-ups and bursts of fruit). Plain logic.

import { ITEMS } from '../game/tuning';
import type { Level } from '../world/level';
import { TILE, type CrateItem } from '../world/tiles';
import { overlaps, type Box } from './solids';

export type ItemKind = 'fruit' | 'coin' | 'mango' | 'slingshot' | 'starfruit';

/** Where each item's picture sits in the items sheet (matches ART_PROMPTS.md). */
export const ITEM_FRAME = { banana: 0, berry: 1, pineapple: 2, mango: 3, slingshot: 4, starfruit: 5, coin: 6, crate: 7 } as const;
const FRUIT_LOOKS = ['banana', 'berry', 'pineapple'] as const;

const SIZE = 12; // px, collection box of an item

export class Item {
  x: number; // px, centre
  y: number; // px, centre
  vx = 0;
  vy = 0;
  collected = false;
  /** Still flying out of a crate (falls until it lands on something). */
  moving = false;

  constructor(
    readonly kind: ItemKind,
    x: number,
    y: number,
    /** For fruit: which look (banana, berry, pineapple); for coins: which of the three. */
    readonly index = 0,
  ) {
    this.x = x;
    this.y = y;
  }

  get box(): Box {
    const r = SIZE / 2 + ITEMS.PICKUP_REACH;
    return { x: this.x - r, y: this.y - r, w: r * 2, h: r * 2 };
  }

  /** The picture to draw from the items sheet. */
  get frame(): number {
    if (this.kind === 'fruit') return ITEM_FRAME[FRUIT_LOOKS[this.index % FRUIT_LOOKS.length]];
    return ITEM_FRAME[this.kind];
  }

  /** Popped items arc up and settle on whatever is below them. */
  update(dt: number, level: Level): void {
    if (!this.moving) return;
    this.vy += ITEMS.POP_GRAVITY * dt;
    this.x += this.vx * dt;
    const nextY = this.y + this.vy * dt;
    const below = Math.floor((nextY + SIZE / 2) / TILE);
    const col = Math.floor(this.x / TILE);
    if (this.vy > 0 && level.isFloor(col, below) && this.y + SIZE / 2 <= below * TILE) {
      this.y = below * TILE - SIZE / 2;
      this.vx = 0;
      this.vy = 0;
      this.moving = false;
      return;
    }
    if (level.isSolid(Math.floor((this.x + Math.sign(this.vx) * SIZE / 2) / TILE), Math.floor(this.y / TILE))) this.vx = 0;
    this.y = nextY;
  }

  touches(pip: Box): boolean {
    return !this.collected && overlaps(pip, this.box);
  }
}

/** Fruit and coins as placed in the level map. */
export function placedItems(level: Level): Item[] {
  return [
    ...level.fruit.map((s, i) => new Item('fruit', s.x, s.y, i)),
    ...level.coins.map((s, i) => new Item('coin', s.x, s.y, i)),
  ];
}

/** What comes out of an opened crate at tile (tx, ty), popping up above it. */
export function crateContents(item: CrateItem, tx: number, ty: number, fruitIndex: number): Item[] {
  const x = tx * TILE + TILE / 2;
  const y = ty * TILE - SIZE / 2;
  const pop = (it: Item, vx = 0) => {
    it.moving = true;
    it.vy = -ITEMS.POP_SPEED;
    it.vx = vx;
    return it;
  };
  if (item !== 'fruitBurst') return [pop(new Item(item, x, y))];
  const n = ITEMS.BURST_FRUIT;
  return Array.from({ length: n }, (_, i) => pop(new Item('fruit', x, y, fruitIndex + i), ((i - (n - 1) / 2) / ((n - 1) / 2)) * ITEMS.BURST_SPREAD));
}

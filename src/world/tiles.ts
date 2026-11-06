// The kinds of tile and the letters that stand for them in a level's text map.

export const TILE = 16; // px, a tile is 16 x 16

export type TileKind = 'air' | 'ground' | 'oneway';

/** Things placed in a level that aren't tiles (more come with enemies and items). */
export type MarkerKind = 'start' | 'flag';

/** Every letter a level may use. */
export const LEGEND: Readonly<Record<string, { tile: TileKind; marker?: MarkerKind }>> = {
  '.': { tile: 'air' },
  '#': { tile: 'ground' },
  '=': { tile: 'oneway' }, // jump up through it, land on top
  P: { tile: 'air', marker: 'start' }, // where Pip starts (feet on the tile below)
  F: { tile: 'air', marker: 'flag' }, // the end flag (the goal hut replaces it in Phase 7)
};

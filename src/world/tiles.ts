// The kinds of tile and the letters that stand for them in a level's text map.

export const TILE = 16; // px, a tile is 16 x 16

export type TileKind = 'air' | 'ground' | 'oneway' | 'spikes';

/** Things placed in a level that aren't tiles (more come with enemies and items). */
export type MarkerKind = 'start' | 'flag' | 'checkpoint' | 'crab' | 'urchin' | 'gull';

/** Markers that are enemies. */
export const ENEMY_MARKERS = ['crab', 'urchin', 'gull'] as const;
export type EnemyKind = (typeof ENEMY_MARKERS)[number];

/** Every letter a level may use. */
export const LEGEND: Readonly<Record<string, { tile: TileKind; marker?: MarkerKind }>> = {
  '.': { tile: 'air' },
  '#': { tile: 'ground' },
  '=': { tile: 'oneway' }, // jump up through it, land on top
  P: { tile: 'air', marker: 'start' }, // where Pip starts (feet on the tile below)
  F: { tile: 'air', marker: 'flag' }, // the end flag (the goal hut replaces it in Phase 7)
  C: { tile: 'air', marker: 'checkpoint' }, // checkpoint post: come back here after a fall or a hit
  '^': { tile: 'spikes' }, // sharp coral: hurts from any side
  c: { tile: 'air', marker: 'crab' }, // snapper crab (feet on the tile below)
  u: { tile: 'air', marker: 'urchin' }, // spiny urchin
  g: { tile: 'air', marker: 'gull' }, // gull (flies at this height)
};

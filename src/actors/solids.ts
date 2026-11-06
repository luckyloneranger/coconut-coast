// Solid boxes Pip stands on and bumps into. Phase 2 swaps these for level tiles;
// the collision rule stays the same: move along x and push out, then along y.

export interface Box {
  x: number; // px, left
  y: number; // px, top
  w: number;
  h: number;
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

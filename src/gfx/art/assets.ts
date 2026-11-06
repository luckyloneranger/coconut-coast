// The list of every sprite sheet in the game. Each one has a code-drawn
// version (the default) and may have an external PNG in public/art with the
// same name. An external sheet must have the same frame size and count.

import type { PixelMap } from './pixels';
import { HERO_FRAMES } from './code/hero';

export interface AssetSpec {
  /** File name in public/art for the external version. */
  file: string;
  frameW: number; // px
  frameH: number; // px
  frames: number; // laid out left to right in one row
  /** The code-drawn version, one map per frame. */
  code: readonly PixelMap[];
}

export const ASSETS = {
  // A stand-in box for Pip until the art pass. Frames in HERO_FRAME order.
  hero: { file: 'hero.png', frameW: 24, frameH: 32, frames: 6, code: HERO_FRAMES },
} satisfies Record<string, AssetSpec>;

/** Where each picture sits in the hero sheet (left to right). */
export const HERO_FRAME = { stand: 0, step: 1, rise: 2, fall: 3, skid: 4, land: 5 } as const;

export type AssetId = keyof typeof ASSETS;
export const ASSET_IDS = Object.keys(ASSETS) as AssetId[];

/** Does an external image of w x h px fit this asset's frames exactly? */
export function sheetFits(spec: AssetSpec, w: number, h: number): boolean {
  return w === spec.frameW * spec.frames && h === spec.frameH;
}

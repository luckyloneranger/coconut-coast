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
  // Phase 0: a stand-in box for Pip (the real Pip sprites come with the art pass).
  hero: { file: 'hero.png', frameW: 24, frameH: 32, frames: 2, code: HERO_FRAMES },
} satisfies Record<string, AssetSpec>;

export type AssetId = keyof typeof ASSETS;
export const ASSET_IDS = Object.keys(ASSETS) as AssetId[];

/** Does an external image of w x h px fit this asset's frames exactly? */
export function sheetFits(spec: AssetSpec, w: number, h: number): boolean {
  return w === spec.frameW * spec.frames && h === spec.frameH;
}

// The list of every sprite sheet in the game. Each one has a code-drawn
// version (the default) and may have an external PNG in public/art with the
// same name. An external sheet must have the same frame size and count.

import type { PixelMap } from './pixels';
import { PIP_BIG_FRAMES, PIP_FRAME_COUNT, PIP_SLING_FRAMES, PIP_SMALL_FRAMES } from './code/pip';
import { BEACH_TILES } from './code/tiles-beach';
import { cloudLayer, farLayer, frontLayer, midLayer, skyLayer } from './code/backgrounds-beach';
import { ITEM_ICONS } from './code/items';
import { CRAB_FRAMES, GULL_FRAMES, URCHIN_FRAMES } from './code/enemies';

export interface AssetSpec {
  /** File name in public/art for the external version. */
  file: string;
  frameW: number; // px
  frameH: number; // px
  frames: number; // laid out left to right in one row
  /** The code-drawn version, one map per frame. */
  code: readonly PixelMap[];
}

/** An asset whose code-drawn frames are only built when first asked for (big background layers). */
function lazy(spec: Omit<AssetSpec, 'code'>, build: () => readonly PixelMap[]): AssetSpec {
  let frames: readonly PixelMap[] | null = null;
  return Object.defineProperty({ ...spec }, 'code', { get: () => (frames ??= build()), enumerable: true }) as AssetSpec;
}

export const ASSETS = {
  // Pip: every animation in one row, in the order of PIP_FRAMES (see ART_PROMPTS.md for the table).
  pip: { file: 'pip.png', frameW: 24, frameH: 32, frames: PIP_FRAME_COUNT, code: PIP_SMALL_FRAMES },
  pipBig: { file: 'pip-big.png', frameW: 24, frameH: 40, frames: PIP_FRAME_COUNT, code: PIP_BIG_FRAMES },
  pipSling: { file: 'pip-sling.png', frameW: 24, frameH: 40, frames: PIP_FRAME_COUNT, code: PIP_SLING_FRAMES },
  tilesBeach: { file: 'tiles-beach.png', frameW: 16, frameH: 16, frames: 8, code: BEACH_TILES },
  // Palm Beach background layers (see ART_PROMPTS.md for sizes). The far sea and mid palms have 3 frames each.
  bgSky: lazy({ file: 'bg-beach-sky.png', frameW: 480, frameH: 270, frames: 1 }, () => [skyLayer()]),
  bgFar: lazy({ file: 'bg-beach-far.png', frameW: 512, frameH: 100, frames: 3 }, farLayer),
  bgClouds: lazy({ file: 'bg-beach-clouds.png', frameW: 512, frameH: 60, frames: 1 }, () => [cloudLayer()]),
  bgMid: lazy({ file: 'bg-beach-near.png', frameW: 512, frameH: 120, frames: 3 }, midLayer),
  bgFront: lazy({ file: 'bg-beach-front.png', frameW: 64, frameH: 200, frames: 1 }, () => [frontLayer()]),
  items: { file: 'items.png', frameW: 16, frameH: 16, frames: 8, code: ITEM_ICONS },
  crab: { file: 'enemy-crab.png', frameW: 24, frameH: 16, frames: 7, code: CRAB_FRAMES },
  urchin: { file: 'enemy-urchin.png', frameW: 16, frameH: 16, frames: 5, code: URCHIN_FRAMES },
  gull: { file: 'enemy-gull.png', frameW: 24, frameH: 20, frames: 8, code: GULL_FRAMES },
} satisfies Record<string, AssetSpec>;

export type AssetId = keyof typeof ASSETS;
export const ASSET_IDS = Object.keys(ASSETS) as AssetId[];

/** Does an external image of w x h px fit this asset's frames exactly? */
export function sheetFits(spec: AssetSpec, w: number, h: number): boolean {
  return w === spec.frameW * spec.frames && h === spec.frameH;
}

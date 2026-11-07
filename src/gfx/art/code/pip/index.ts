// Pip's three sheets: small, Big, and Big with the slingshot (Sling form).

import type { PixelMap } from '../../pixels';
import { BIG_BODY, SMALL_BODY, buildPip } from './build';
import { ALL_PIP_POSES } from './poses';

export const PIP_SMALL_FRAMES: readonly PixelMap[] = ALL_PIP_POSES.map((p) => buildPip(p, SMALL_BODY));
export const PIP_BIG_FRAMES: readonly PixelMap[] = ALL_PIP_POSES.map((p) => buildPip(p, BIG_BODY));
export const PIP_SLING_FRAMES: readonly PixelMap[] = ALL_PIP_POSES.map((p) => buildPip({ ...p, sling: true }, BIG_BODY));
export { PIP_FRAMES, PIP_FRAME_COUNT, type PipAnim } from './poses';

// The stomp-or-hurt rule, as plain logic.

import { COMBAT } from '../game/tuning';
import { overlaps, type Box } from './solids';

export type Touch = 'none' | 'stomp' | 'hurt';

/**
 * What happens when Pip meets an enemy this step. A stomp needs Pip falling
 * and the feet to have been above the enemy's top (with a little grace) at
 * the start of the step; anything else that overlaps hurts.
 */
export function touchEnemy(pip: Box, pipVy: number, feetBefore: number, enemy: Box, stompable: boolean): Touch {
  if (!overlaps(pip, enemy)) return 'none';
  const fromAbove = pipVy > 0 && feetBefore <= enemy.y + COMBAT.STOMP_GRACE;
  return stompable && fromAbove ? 'stomp' : 'hurt';
}

/** Does Pip touch any of these hazards (spikes)? */
export function touchesHazard(pip: Box, hazards: readonly Box[]): boolean {
  return hazards.some((h) => overlaps(pip, h));
}

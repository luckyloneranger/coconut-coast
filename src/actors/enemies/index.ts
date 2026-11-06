import type { Spot } from '../../world/level';
import type { EnemyKind } from '../../world/tiles';
import { Crab } from './crab';
import type { Enemy } from './enemy';
import { Gull } from './gull';
import { Urchin } from './urchin';

/** Make the right enemy for a map letter, in its starting place. */
export function makeEnemy(kind: EnemyKind, home: Spot): Enemy {
  const e = kind === 'crab' ? new Crab(home) : kind === 'urchin' ? new Urchin(home) : new Gull(home);
  e.reset();
  return e;
}

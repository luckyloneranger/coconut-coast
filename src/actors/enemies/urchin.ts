// Spiny urchin: sits still with its spikes pulsing. Spikes on top, so it can't be stomped.

import { URCHIN } from '../../game/tuning';
import { Enemy } from './enemy';

export class Urchin extends Enemy {
  readonly kind = 'urchin' as const;
  readonly stompable = false;
  readonly w = URCHIN.SIZE;
  readonly h = URCHIN.SIZE;

  get frame(): number {
    return Math.floor(this.time / URCHIN.FRAME_TIME) % 4;
  }

  protected move(): void {}
}

// Pip's form (small, Big, Sling) and the timers that protect Pip: the blink
// after a hit and the Starfruit. Plain logic, no drawing.

import { FORMS } from '../game/tuning';

export type Form = 'small' | 'big' | 'sling';

/** What a hit does. */
export type HitResult = 'nothing' | 'shrunk' | 'dead';

export class PipForm {
  form: Form = 'small';
  /** s left of blinking after a hit (can't be hurt). */
  blink = 0;
  /** s left of Starfruit invincibility. */
  star = 0;

  get big(): boolean {
    return this.form !== 'small';
  }

  get canThrow(): boolean {
    return this.form === 'sling';
  }

  /** Can enemies and spikes hurt Pip right now? */
  get safe(): boolean {
    return this.blink > 0 || this.star > 0;
  }

  update(dt: number): void {
    this.blink = Math.max(0, this.blink - dt);
    this.star = Math.max(0, this.star - dt);
  }

  /** A Mango makes small Pip Big (no change if already Big or Sling). */
  eatMango(): void {
    if (this.form === 'small') this.form = 'big';
  }

  /** The Slingshot: Sling form (Big as well). */
  takeSlingshot(): void {
    this.form = 'sling';
  }

  eatStarfruit(): void {
    this.star = FORMS.STARFRUIT_TIME;
  }

  /** An enemy hit: each hit goes back one step (Sling -> Big -> small -> out). */
  hit(): HitResult {
    if (this.safe) return 'nothing';
    if (this.form === 'small') return 'dead';
    this.form = this.form === 'sling' ? 'big' : 'small';
    this.blink = FORMS.HURT_BLINK;
    return 'shrunk';
  }

  /** After losing a life: small again (Relaxed mode keeps the form). */
  respawn(keepForm: boolean): void {
    if (!keepForm) this.form = 'small';
    this.blink = 0;
    this.star = 0;
  }
}

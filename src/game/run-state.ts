// Lives, score, fruit, Sun Coins, the stomp chain and the Sun Meter: plain
// numbers and rules, no drawing, so they can be unit-tested.

import { RUN } from './tuning';

export class RunState {
  lives = RUN.START_LIVES;
  score = 0;
  fruit = 0;
  /** Which of the level's Sun Coins are collected (by index). */
  coins = new Set<number>();
  /** Stomps in a row without touching the ground. */
  chain = 0;
  /** 0 (empty) to 1 (full). */
  sun = 1;

  /** `relaxed`: no Sun Meter (Options → Relaxed mode, or ?relaxed=1 for now). */
  constructor(readonly relaxed = false) {}

  /** A piece of fruit: points, Sun Meter, and an extra life every 100. */
  addFruit(): void {
    this.fruit++;
    this.score += RUN.FRUIT_POINTS;
    this.sun = Math.min(1, this.sun + RUN.SUN_PER_FRUIT);
    if (this.fruit % RUN.FRUIT_FOR_LIFE === 0) this.lives++;
  }

  addCoin(index: number): void {
    if (this.coins.has(index)) return;
    this.coins.add(index);
    this.score += RUN.COIN_POINTS;
  }

  /** A stomp: worth more each time in a row; after the last value, an extra life. Returns the points (0 = extra life). */
  stomped(): number {
    const values = RUN.STOMP_CHAIN;
    const i = this.chain++;
    if (i < values.length) {
      this.score += values[i];
      return values[i];
    }
    this.lives++;
    return 0;
  }

  /** Pip touched the ground: the stomp chain starts again. */
  landed(): void {
    this.chain = 0;
  }

  /** Drain the Sun Meter. Returns true when it has just run out. */
  drain(dt: number): boolean {
    if (this.relaxed || this.sun <= 0) return false;
    this.sun = Math.max(0, this.sun - dt / RUN.SUN_FULL_TIME);
    return this.sun === 0;
  }

  /** Lose a life (the meter refills for the next try). Returns true if that was the last one. */
  loseLife(): boolean {
    this.lives--;
    this.sun = 1;
    this.chain = 0;
    return this.lives <= 0;
  }
}

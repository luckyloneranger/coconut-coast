// Particles: dust, splashes, sparkles, bursts and the little stars when an
// enemy pops. Plain data and an update step, so it can be tested; drawing is
// a few small rectangles each.

import { FX } from '../../game/tuning';

export type ParticleKind = 'dust' | 'splash' | 'sparkle' | 'star' | 'burst';

export interface Particle {
  kind: ParticleKind;
  x: number; // px, in the level
  y: number;
  vx: number; // px/s
  vy: number;
  age: number; // s
  life: number; // s it lasts
  colour: string;
}

/** Gravity and drag per kind (px/s², share of speed kept per second). */
const MOTION: Record<ParticleKind, { gravity: number; drag: number }> = {
  dust: { gravity: -20, drag: 0.05 }, // puffs drift up and slow quickly
  splash: { gravity: 600, drag: 0.6 },
  sparkle: { gravity: 0, drag: 1 },
  star: { gravity: 400, drag: 0.5 },
  burst: { gravity: 0, drag: 0.1 },
};

export class Particles {
  readonly list: Particle[] = [];
  /** A tiny repeatable random number source, so tests and replays match. */
  private seed = 12345;

  /** 0 to 1, repeatable. */
  random(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  add(kind: ParticleKind, x: number, y: number, vx: number, vy: number, life: number, colour: string): void {
    this.list.push({ kind, x, y, vx, vy, age: 0, life, colour });
    if (this.list.length > FX.MAX_PARTICLES) this.list.splice(0, this.list.length - FX.MAX_PARTICLES);
  }

  update(dt: number): void {
    for (const p of this.list) {
      const m = MOTION[p.kind];
      p.age += dt;
      p.vy += m.gravity * dt;
      const keep = Math.pow(m.drag, dt);
      p.vx *= keep;
      if (p.kind !== 'splash' && p.kind !== 'star') p.vy *= keep;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].age >= this.list[i].life) this.list.splice(i, 1);
  }

  clear(): void {
    this.list.length = 0;
  }

  // ------------------------------------------------ ready-made effects

  /** A puff of dust at Pip's feet (skids, landings). */
  dust(x: number, y: number, count = 3, dir = 0): void {
    for (let i = 0; i < count; i++) this.add('dust', x + (this.random() - 0.5) * 8, y - 1, dir * 20 + (this.random() - 0.5) * 40, -10 - this.random() * 20, 0.35 + this.random() * 0.2, '#fff2d0');
  }

  /** Droplets thrown up where something hits the water. */
  splash(x: number, y: number, count = 14): void {
    for (let i = 0; i < count; i++) this.add('splash', x + (this.random() - 0.5) * 10, y, (this.random() - 0.5) * 140, -120 - this.random() * 160, 0.8, this.random() < 0.5 ? '#ffffff' : '#9ae4ff');
  }

  /** A twinkle on a collectible. */
  sparkle(x: number, y: number): void {
    this.add('sparkle', x + (this.random() - 0.5) * 12, y + (this.random() - 0.5) * 12, 0, 0, 0.3, '#fffbe0');
  }

  /** A ring of bits flying out when something is collected. */
  burst(x: number, y: number, colour: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.add('burst', x, y, Math.cos(a) * 90, Math.sin(a) * 90, 0.3, colour);
    }
  }

  /** Little stars popping out of a defeated enemy. */
  pop(x: number, y: number): void {
    for (let i = 0; i < 6; i++) this.add('star', x, y, (this.random() - 0.5) * 160, -100 - this.random() * 120, 0.7, i % 2 ? '#ffe070' : '#ffffff');
  }
}

// Sound effects: what the game announces, and the short recipe each plays.

import { noteFreq } from './notes';
import type { Synth } from './synth';

/** Everything the game can announce for a sound. */
export type SoundEvent =
  | { kind: 'jump'; big: boolean }
  | { kind: 'stomp'; chain: number }
  | { kind: 'fruit' }
  | { kind: 'coin' }
  | { kind: 'powerUp' }
  | { kind: 'starfruit' }
  | { kind: 'hurt' }
  | { kind: 'crate' }
  | { kind: 'stone' }
  | { kind: 'throw' }
  | { kind: 'checkpoint' }
  | { kind: 'extraLife' }
  | { kind: 'splash' }
  | { kind: 'sunLow' };

export type SoundSink = (e: SoundEvent) => void;
export const SILENT: SoundSink = () => {};

/** Play an effect now. */
export function playSfx(synth: Synth, e: SoundEvent): void {
  const t = synth.ctx.currentTime + 0.01;
  const notes = (list: [string, number, number][], inst: 'marimba' | 'steel' | 'brass' = 'marimba', vel = 0.7) => {
    for (const [n, at, len] of list) synth.play(inst, noteFreq(n), t + at, len, vel, 'sfx');
  };
  switch (e.kind) {
    case 'jump':
      synth.sweep(t, 0.16, e.big ? 180 : 260, e.big ? 420 : 620, 0.7);
      break;
    case 'stomp': {
      // A springy boing that climbs with each stomp in a chain, over a soft thud.
      const lift = Math.pow(2, Math.min(e.chain, 6) / 6);
      synth.sweep(t, 0.18, 300 * lift, 900 * lift, 0.8, 'triangle');
      synth.play('kick', 90, t, 0.1, 0.6, 'sfx');
      break;
    }
    case 'fruit':
      notes([['E6', 0, 0.08], ['A6', 0.05, 0.15]], 'marimba', 0.55);
      break;
    case 'coin':
      notes([['B5', 0, 0.1], ['E6', 0.06, 0.1], ['B6', 0.12, 0.35]], 'steel', 0.7);
      break;
    case 'powerUp':
      notes([['C5', 0, 0.08], ['E5', 0.06, 0.08], ['G5', 0.12, 0.08], ['C6', 0.18, 0.08], ['E6', 0.24, 0.08], ['G6', 0.3, 0.3]], 'marimba', 0.65);
      break;
    case 'starfruit':
      for (let i = 0; i < 10; i++) synth.play('steel', noteFreq('C6') * Math.pow(2, i / 5), t + i * 0.035, 0.2, 0.5, 'sfx');
      break;
    case 'hurt':
      synth.sweep(t, 0.35, 520, 140, 0.7, 'sawtooth');
      synth.sweep(t + 0.05, 0.3, 500, 150, 0.4, 'square');
      break;
    case 'crate':
      synth.play('conga', 180, t, 0.12, 0.8, 'sfx');
      synth.noiseBurst(t, 0.08, 0.25, 900);
      break;
    case 'stone':
      synth.noiseBurst(t, 0.3, 0.6, 2200);
      synth.play('kick', 70, t, 0.2, 0.7, 'sfx');
      break;
    case 'throw':
      synth.noiseBurst(t, 0.09, 0.3, 4000, 'bandpass');
      synth.sweep(t, 0.08, 800, 1400, 0.25, 'triangle');
      break;
    case 'checkpoint':
      notes([['G5', 0, 0.1], ['C6', 0.1, 0.1], ['E6', 0.2, 0.3]], 'brass', 0.55);
      break;
    case 'extraLife':
      notes([['E5', 0, 0.1], ['G5', 0.1, 0.1], ['E6', 0.2, 0.1], ['C6', 0.3, 0.1], ['D6', 0.4, 0.1], ['G6', 0.5, 0.4]], 'steel', 0.7);
      break;
    case 'splash':
      synth.noiseBurst(t, 0.6, 0.6, 1600);
      synth.noiseBurst(t + 0.08, 0.4, 0.3, 3000, 'bandpass');
      break;
    case 'sunLow':
      notes([['A5', 0, 0.12], ['A5', 0.25, 0.12]], 'marimba', 0.4);
      break;
  }
}

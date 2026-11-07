// The synthesiser (Web Audio): 8 voices, FM and wave instruments, a noise drum
// kit, and a shared echo and reverb (the 16-bit room sound). Everything is
// generated in code: no sound files.

import { VoicePool } from './voices';
import type { Instrument } from './sequencer';

export type Bus = 'music' | 'sfx';

export class Synth {
  readonly ctx: AudioContext;
  readonly music: GainNode;
  readonly sfx: GainNode;
  private readonly master: GainNode;
  private readonly echoIn: GainNode;
  private readonly reverbIn: GainNode;
  private readonly noise: AudioBuffer;
  readonly voices = new VoicePool();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.music = ctx.createGain();
    this.sfx = ctx.createGain();
    this.music.connect(this.master);
    this.sfx.connect(this.master);

    // Echo: a delay feeding back into itself, softened each time round.
    this.echoIn = ctx.createGain();
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.43; // a dotted eighth at the Palm Beach tempo
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 2400;
    this.echoIn.connect(delay);
    delay.connect(soften);
    soften.connect(feedback);
    feedback.connect(delay);
    soften.connect(this.master);

    // Reverb: a short burst of fading noise as the "room".
    this.reverbIn = ctx.createGain();
    const reverb = ctx.createConvolver();
    reverb.buffer = this.roomImpulse(1.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    this.reverbIn.connect(reverb);
    reverb.connect(wet);
    wet.connect(this.master);

    this.noise = this.makeNoise(1);
  }

  setVolumes(music: number, sfx: number, muted: boolean): void {
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.02);
    this.music.gain.setTargetAtTime(music, now, 0.05);
    this.sfx.gain.setTargetAtTime(sfx, now, 0.02);
  }

  /** Play one note on an instrument at audio time `t` for `dur` seconds. */
  play(inst: Instrument, freq: number, t: number, dur: number, vel: number, bus: Bus = 'music'): void {
    const out = this.ctx.createGain();
    out.gain.value = 0;
    out.connect(bus === 'music' ? this.music : this.sfx);
    // A little echo and reverb on everything; more on the melody.
    const send = (amount: number, to: GainNode) => {
      const g = this.ctx.createGain();
      g.gain.value = amount;
      out.connect(g);
      g.connect(to);
    };
    const echo = inst === 'steel' ? 0.28 : inst === 'marimba' || inst === 'brass' ? 0.16 : bus === 'sfx' ? 0.08 : 0;
    if (echo) send(echo, this.echoIn);
    send(inst === 'kick' || inst === 'bass' ? 0.05 : 0.18, this.reverbIn);
    const end = this.voice(inst, freq, t, dur, vel, out);
    this.voices.take(t, end, () => out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01));
  }

  /** Build the sound for one instrument; returns when it has died away. */
  private voice(inst: Instrument, f: number, t: number, dur: number, vel: number, out: GainNode): number {
    const ctx = this.ctx;
    const env = (attack: number, decay: number, peak = vel) => {
      out.gain.setValueAtTime(0, t);
      out.gain.linearRampToValueAtTime(peak, t + attack);
      out.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
      return t + attack + decay;
    };
    const osc = (type: OscillatorType, freq: number, stop: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.start(t);
      o.stop(stop + 0.05);
      return o;
    };
    /** Frequency modulation: a modulator at `ratio` x the pitch bends the carrier; `index` = brightness. */
    const fm = (ratio: number, index: number, indexDecay: number, stop: number) => {
      const carrier = osc('sine', f, stop);
      const mod = osc('sine', f * ratio, stop);
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(f * index, t);
      depth.gain.exponentialRampToValueAtTime(f * 0.01 + 0.01, t + indexDecay);
      mod.connect(depth);
      depth.connect(carrier.frequency);
      carrier.connect(out);
    };
    switch (inst) {
      case 'steel': {
        const end = env(0.004, Math.max(0.5, dur * 1.4), vel * 0.55);
        fm(3.5, 2.2, 0.25, end); // bell-like steel drum
        return end;
      }
      case 'marimba': {
        const end = env(0.002, 0.32, vel * 0.5);
        fm(4, 1.6, 0.06, end); // a woody knock, quickly mellowing
        return end;
      }
      case 'bass': {
        const end = env(0.005, Math.max(0.25, dur * 0.9), vel * 0.7);
        const o = osc('square', f, end);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1200, t); // a pluck: bright, then round
        lp.frequency.exponentialRampToValueAtTime(220, t + 0.2);
        o.connect(lp);
        lp.connect(out);
        return end;
      }
      case 'pad': {
        out.gain.setValueAtTime(0, t);
        out.gain.linearRampToValueAtTime(vel * 0.16, t + 0.35);
        out.gain.setValueAtTime(vel * 0.16, t + dur);
        out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
        const end = t + dur + 0.6;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1400;
        for (const detune of [-7, 7]) {
          const o = osc('sawtooth', f, end);
          o.detune.value = detune; // two slightly apart: a warm chorus
          o.connect(lp);
        }
        lp.connect(out);
        return end;
      }
      case 'brass': {
        out.gain.setValueAtTime(0, t);
        out.gain.linearRampToValueAtTime(vel * 0.35, t + 0.03);
        out.gain.setValueAtTime(vel * 0.3, t + dur * 0.8);
        out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
        const end = t + dur + 0.15;
        const o = osc('sawtooth', f, end);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(600, t);
        lp.frequency.linearRampToValueAtTime(2600, t + 0.05); // the brassy "blat" opening up
        lp.frequency.linearRampToValueAtTime(1600, t + 0.2);
        o.connect(lp);
        lp.connect(out);
        return end;
      }
      case 'kick': {
        const end = env(0.002, 0.28, vel * 0.9);
        const o = osc('sine', 120, end);
        o.frequency.setValueAtTime(130, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        o.connect(out);
        return end;
      }
      case 'conga': {
        const end = env(0.002, 0.2, vel * 0.6);
        const o = osc('sine', f, end);
        o.frequency.setValueAtTime(f * 1.4, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
        o.connect(out);
        return end;
      }
      case 'snare':
      case 'shaker': {
        const end = env(0.001, inst === 'snare' ? 0.16 : 0.045, vel * (inst === 'snare' ? 0.55 : 0.3));
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = inst === 'snare' ? 'bandpass' : 'highpass';
        filter.frequency.value = inst === 'snare' ? 1800 : 7000;
        src.connect(filter);
        filter.connect(out);
        src.start(t, Math.random() * 0.5);
        src.stop(end + 0.05);
        if (inst === 'snare') osc('triangle', 190, end).connect(out); // the drum body under the rattle
        return end;
      }
    }
  }

  /** A burst of filtered noise (splashes, stone breaking). */
  noiseBurst(t: number, dur: number, vel: number, freq: number, type: BiquadFilterType = 'lowpass', bus: Bus = 'sfx'): void {
    const out = this.ctx.createGain();
    out.connect(bus === 'music' ? this.music : this.sfx);
    out.gain.setValueAtTime(vel, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.3), t + dur);
    src.connect(f);
    f.connect(out);
    src.start(t);
    src.stop(t + dur + 0.05);
    this.voices.take(t, t + dur, () => out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01));
  }

  /** A pitch sweep (jumps, hits): an oscillator gliding from one pitch to another. */
  sweep(t: number, dur: number, from: number, to: number, vel: number, type: OscillatorType = 'square', bus: Bus = 'sfx'): void {
    const out = this.ctx.createGain();
    out.connect(bus === 'music' ? this.music : this.sfx);
    out.gain.setValueAtTime(vel * 0.3, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200; // take the harsh edge off square waves
    o.connect(lp);
    lp.connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
    this.voices.take(t, t + dur, () => out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01));
  }

  /** A soft, never-ending wash of waves (noise, low-passed, slowly swelling). Returns a stop function. */
  waves(level: number): () => void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.makeNoise(4);
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const swell = this.ctx.createGain();
    swell.gain.value = level * 0.5;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.12; // a wave every 8 seconds or so
    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.value = level * 0.45;
    lfo.connect(lfoDepth);
    lfoDepth.connect(swell.gain);
    src.connect(lp);
    lp.connect(swell);
    swell.connect(this.music);
    src.start();
    lfo.start();
    return () => {
      swell.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      src.stop(this.ctx.currentTime + 1.5);
      lfo.stop(this.ctx.currentTime + 1.5);
    };
  }

  private makeNoise(seconds: number): AudioBuffer {
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * seconds), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private roomImpulse(seconds: number): AudioBuffer {
    const rate = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(2, Math.floor(rate * seconds), rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    }
    return buf;
  }
}

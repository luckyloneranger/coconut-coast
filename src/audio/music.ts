// Plays a song on the synth, scheduling notes a little ahead of time so the
// rhythm stays steady even when a frame is slow.

import { noteFreq, stepSeconds } from './notes';
import { notesBetween, songSteps, type Song } from './sequencer';
import type { Bus, Synth } from './synth';

const LOOKAHEAD = 0.15; // s of music scheduled ahead of the audio clock

export class MusicPlayer {
  private song: Song | null = null;
  private startTime = 0; // audio clock when the song began
  private scheduledTo = 0; // steps scheduled so far

  constructor(
    private readonly synth: Synth,
    private readonly bus: Bus = 'music',
  ) {}

  get playing(): Song | null {
    return this.song;
  }

  /** Has a song that doesn't loop played to the end? */
  get finished(): boolean {
    if (!this.song || this.song.loop) return false;
    return this.synth.ctx.currentTime > this.startTime + songSteps(this.song) * stepSeconds(this.song.bpm) + 0.5;
  }

  play(song: Song | null): void {
    if (song === this.song) return;
    this.song = song;
    this.startTime = this.synth.ctx.currentTime + 0.05;
    this.scheduledTo = 0;
  }

  /** Call often (every frame): schedules the notes due in the next moment. */
  tick(): void {
    const song = this.song;
    if (!song) return;
    const step = stepSeconds(song.bpm);
    const until = (this.synth.ctx.currentTime + LOOKAHEAD - this.startTime) / step;
    if (until <= this.scheduledTo) return;
    for (const { track, note, at } of notesBetween(song, this.scheduledTo, until)) {
      const t = this.startTime + at * step;
      if (t < this.synth.ctx.currentTime - 0.02) continue; // too late (the tab was asleep): skip it
      this.synth.play(track.instrument, noteFreq(note.note), t, note.len * step, note.vel, this.bus);
    }
    this.scheduledTo = until;
  }
}

// Building blocks for arranging songs from a list of chords: a plucked bass
// line, held pad chords, off-beat marimba stabs and an island drum groove.

import { STEPS_PER_BAR, type NoteEvent } from '../sequencer';
import { transpose } from '../notes';

/** A chord as its root note (in octave 3) and its type. */
export interface Chord {
  root: string; // e.g. "F3"
  minor?: boolean;
}

function triad(c: Chord): [string, string, string] {
  return [c.root, transpose(c.root, c.minor ? 3 : 4), transpose(c.root, 7)];
}

/** Bass: root, a skip to the fifth, the octave, then a walk toward the next chord. */
export function bassLine(chords: Chord[], vel = 0.85): NoteEvent[] {
  return chords.flatMap((c, i) => {
    const at = i * STEPS_PER_BAR;
    const root = transpose(c.root, -12);
    const next = chords[(i + 1) % chords.length];
    const toNext = transpose(next.root, -13); // a half step below the next root
    return [
      { step: at, note: root, len: 3, vel },
      { step: at + 4, note: transpose(root, 7), len: 2, vel: vel * 0.8 },
      { step: at + 6, note: transpose(root, 12), len: 2, vel: vel * 0.7 },
      { step: at + 10, note: root, len: 2, vel: vel * 0.9 },
      { step: at + 12, note: transpose(root, 7), len: 2, vel: vel * 0.8 },
      { step: at + 14, note: toNext, len: 2, vel: vel * 0.7 },
    ];
  });
}

/** Pad: the chord held for the whole bar, an octave up, quietly. */
export function padChords(chords: Chord[], vel = 0.35): NoteEvent[] {
  return chords.flatMap((c, i) => triad(c).map((n) => ({ step: i * STEPS_PER_BAR, note: transpose(n, 12), len: STEPS_PER_BAR, vel })));
}

/** Marimba: little chord stabs on the off-beats (the island lilt). */
export function offbeatStabs(chords: Chord[], vel = 0.45): NoteEvent[] {
  return chords.flatMap((c, i) => {
    const [a, b, d] = triad(c).map((n) => transpose(n, 24));
    return [2, 6, 10, 14].flatMap((s, k) => [
      { step: i * STEPS_PER_BAR + s, note: k % 2 ? b : a, len: 1, vel },
      { step: i * STEPS_PER_BAR + s, note: d, len: 1, vel: vel * 0.7 },
    ]);
  });
}

/** Drums for `bars` bars: kick on 1 and the "and" of 3, snare on 2 and 4, a soft shaker, a hand drum. */
export function islandGroove(barsCount: number): { kick: NoteEvent[]; snare: NoteEvent[]; shaker: NoteEvent[]; conga: NoteEvent[] } {
  const kick: NoteEvent[] = [];
  const snare: NoteEvent[] = [];
  const shaker: NoteEvent[] = [];
  const conga: NoteEvent[] = [];
  for (let b = 0; b < barsCount; b++) {
    const at = b * STEPS_PER_BAR;
    kick.push({ step: at, note: 'C2', len: 2, vel: 0.9 }, { step: at + 10, note: 'C2', len: 2, vel: 0.7 });
    snare.push({ step: at + 4, note: 'C3', len: 2, vel: 0.5 }, { step: at + 12, note: 'C3', len: 2, vel: 0.55 });
    for (let s = 0; s < 16; s += 2) shaker.push({ step: at + s + 1, note: 'C6', len: 1, vel: s % 4 === 0 ? 0.35 : 0.22 });
    conga.push({ step: at + 7, note: 'D4', len: 1, vel: 0.5 }, { step: at + 15, note: 'A3', len: 1, vel: 0.45 });
    if (b % 4 === 3) conga.push({ step: at + 13, note: 'D4', len: 1, vel: 0.4 }, { step: at + 14, note: 'D4', len: 1, vel: 0.45 }); // a little fill
  }
  return { kick, snare, shaker, conga };
}

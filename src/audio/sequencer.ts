// Songs as data, and which notes fall in a stretch of time. Plain logic; the
// player in music.ts turns these into sounds a little ahead of time.

export type Instrument = 'steel' | 'marimba' | 'bass' | 'pad' | 'brass' | 'kick' | 'snare' | 'shaker' | 'conga';

export const INSTRUMENTS: readonly Instrument[] = ['steel', 'marimba', 'bass', 'pad', 'brass', 'kick', 'snare', 'shaker', 'conga'];

/** One note: when (in sixteenth steps from the start), what, how long, how loud. */
export interface NoteEvent {
  step: number;
  note: string; // e.g. "C5" (drums ignore the pitch)
  len: number; // steps
  vel: number; // 0-1
}

export interface Track {
  instrument: Instrument;
  notes: NoteEvent[];
}

export interface Song {
  name: string;
  bpm: number;
  bars: number; // 16 steps each
  loop: boolean;
  tracks: Track[];
}

export const STEPS_PER_BAR = 16;

/**
 * Read a line of notes like "C5:2 E5:2 -:4" (note:length in steps, "-" = rest)
 * into events starting at `startStep`. Returns the events and the steps used.
 */
export function parseLine(line: string, startStep = 0, vel = 0.8): { notes: NoteEvent[]; steps: number } {
  const notes: NoteEvent[] = [];
  let step = startStep;
  for (const token of line.trim().split(/\s+/)) {
    const [note, lenText] = token.split(':');
    const len = Number(lenText);
    if (!len) throw new Error(`Bad note "${token}"`);
    if (note !== '-') notes.push({ step, note, len, vel });
    step += len;
  }
  return { notes, steps: step - startStep };
}

/** Bars of notes, one string per bar; each bar must add up to 16 steps. */
export function bars(lines: string[], vel = 0.8, firstBar = 0): NoteEvent[] {
  return lines.flatMap((line, i) => {
    const { notes, steps } = parseLine(line, (firstBar + i) * STEPS_PER_BAR, vel);
    if (steps !== STEPS_PER_BAR) throw new Error(`Bar ${firstBar + i + 1} is ${steps} steps, not 16: "${line}"`);
    return notes;
  });
}

/** The song's length in steps. */
export function songSteps(song: Song): number {
  return song.bars * STEPS_PER_BAR;
}

/**
 * Every note that starts at or after step `from` and before step `to`
 * (steps counted from when the song began; a looping song repeats). Each
 * comes with its absolute step, so the player knows exactly when to play it.
 */
export function notesBetween(song: Song, from: number, to: number): { track: Track; note: NoteEvent; at: number }[] {
  const out: { track: Track; note: NoteEvent; at: number }[] = [];
  const length = songSteps(song);
  const firstLoop = Math.floor(from / length);
  const lastLoop = song.loop ? Math.floor((to - 1e-9) / length) : 0;
  for (let loop = Math.max(0, firstLoop); loop <= lastLoop; loop++) {
    for (const track of song.tracks) {
      for (const note of track.notes) {
        const at = loop * length + note.step;
        if (at >= from && at < to) out.push({ track, note, at });
      }
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

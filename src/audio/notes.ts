// Note names to frequencies, and the song timing maths. Plain functions.

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "A4" -> 440 Hz; "Bb5", "F#3" work too. */
export function noteFreq(name: string): number {
  const m = /^([A-G])(b|#)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`Not a note: ${name}`);
  const semis = SEMITONES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (semis - 69) / 12); // MIDI 69 = A4
}

/** Seconds per sixteenth-note step at a tempo (beats per minute). */
export function stepSeconds(bpm: number): number {
  return 60 / bpm / 4;
}

/** Move a note up or down by semitones ("C4" + 7 = "G4"), using flats. */
export function transpose(name: string, semitones: number): string {
  const m = /^([A-G])(b|#)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`Not a note: ${name}`);
  const midi = SEMITONES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12 + semitones;
  const names = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  return `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

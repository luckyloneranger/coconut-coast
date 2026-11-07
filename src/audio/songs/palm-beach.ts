// "Palm Beach": World 1's theme. An original, laid-back steel-drum melody in
// F major over a plucked bass, soft chords, off-beat marimba and an island
// groove. Form: A (8 bars), B (8 bars), A again; about 55 s, then it loops.

import { bars, type Song } from '../sequencer';
import { bassLine, islandGroove, offbeatStabs, padChords, type Chord } from './parts';

const F: Chord = { root: 'F3' };
const Dm: Chord = { root: 'D3', minor: true };
const Bb: Chord = { root: 'Bb2' };
const C: Chord = { root: 'C3' };
const Am: Chord = { root: 'A2', minor: true };
const Gm: Chord = { root: 'G2', minor: true };

const A_CHORDS = [F, Dm, Bb, C, F, Am, Bb, C];
const B_CHORDS = [Gm, C, F, Dm, Gm, Bb, C, C];
const CHORDS = [...A_CHORDS, ...B_CHORDS, ...A_CHORDS];

const A_TUNE = [
  'C5:2 F5:2 A5:3 G5:1 F5:2 A5:2 C6:4',
  'D6:3 C6:1 A5:2 F5:2 A5:4 -:4',
  'Bb5:2 D6:2 F6:3 D6:1 C6:2 Bb5:2 A5:4',
  'G5:3 A5:1 Bb5:2 A5:2 G5:2 E5:2 C5:4',
  'C5:2 F5:2 A5:3 G5:1 F5:2 C6:2 F6:4',
  'E6:3 D6:1 C6:2 A5:2 E5:4 -:4',
  'D6:2 C6:2 Bb5:2 A5:2 G5:2 Bb5:2 D6:4',
  'C6:6 Bb5:2 A5:2 G5:2 -:4',
];
const B_TUNE = [
  '-:2 G5:2 Bb5:2 D6:2 C6:3 Bb5:1 A5:4',
  'G5:3 E5:1 G5:2 C6:2 Bb5:4 -:4',
  '-:2 A5:2 C6:2 F6:2 E6:3 D6:1 C6:4',
  'A5:3 F5:1 A5:2 D6:2 C6:4 -:4',
  'Bb5:2 A5:2 G5:2 Bb5:2 D6:4 C6:2 Bb5:2',
  'D6:2 F6:2 D6:2 Bb5:2 C6:4 D6:4',
  'E6:4 D6:2 C6:2 Bb5:2 A5:2 G5:4',
  'C6:2 -:2 C6:1 D6:1 E6:2 G6:4 -:4',
];

const groove = islandGroove(CHORDS.length);

export const PALM_BEACH: Song = {
  name: 'Palm Beach',
  bpm: 104,
  bars: CHORDS.length,
  loop: true,
  tracks: [
    { instrument: 'steel', notes: bars([...A_TUNE, ...B_TUNE, ...A_TUNE], 0.75) },
    { instrument: 'bass', notes: bassLine(CHORDS) },
    { instrument: 'pad', notes: padChords(CHORDS) },
    { instrument: 'marimba', notes: offbeatStabs(CHORDS) },
    { instrument: 'kick', notes: groove.kick },
    { instrument: 'snare', notes: groove.snare },
    { instrument: 'shaker', notes: groove.shaker },
    { instrument: 'conga', notes: groove.conga },
  ],
};

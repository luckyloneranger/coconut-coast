// Short pieces (all original): the Starfruit theme (a bouncy loop while
// invincible), the level-clear jingle, the game-over phrase and the
// losing-a-life phrase.

import { bars, type Song } from '../sequencer';
import { bassLine, islandGroove, type Chord } from './parts';

const STAR_CHORDS: Chord[] = [{ root: 'C3' }, { root: 'F3' }, { root: 'G3' }, { root: 'C3' }];
const starGroove = islandGroove(4);

export const STARFRUIT: Song = {
  name: 'Starfruit',
  bpm: 152,
  bars: 4,
  loop: true,
  tracks: [
    {
      instrument: 'marimba',
      notes: bars(
        [
          'C6:1 E6:1 G6:1 C7:1 G6:1 E6:1 C6:1 E6:1 G6:1 C7:1 E7:2 C7:2 G6:2',
          'C6:1 F6:1 A6:1 C7:1 A6:1 F6:1 C6:1 F6:1 A6:1 C7:1 F7:2 C7:2 A6:2',
          'D6:1 G6:1 B6:1 D7:1 B6:1 G6:1 D6:1 G6:1 B6:1 D7:1 G7:2 D7:2 B6:2',
          'C7:2 G6:1 E6:1 C6:2 E6:1 G6:1 C7:4 -:4',
        ],
        0.6,
      ),
    },
    { instrument: 'brass', notes: bars(['C5:4 -:4 E5:2 G5:2 -:4', 'F5:4 -:4 A5:2 C6:2 -:4', 'G5:4 -:4 B5:2 D6:2 -:4', 'C6:6 -:10'], 0.5) },
    { instrument: 'bass', notes: bassLine(STAR_CHORDS, 0.8) },
    { instrument: 'kick', notes: starGroove.kick },
    { instrument: 'snare', notes: starGroove.snare },
    { instrument: 'shaker', notes: starGroove.shaker },
  ],
};

export const LEVEL_CLEAR: Song = {
  name: 'Level clear',
  bpm: 132,
  bars: 2,
  loop: false,
  tracks: [
    { instrument: 'brass', notes: bars(['C5:2 E5:2 G5:2 C6:4 A5:2 C6:4', 'D6:2 C6:2 D6:2 F6:2 E6:8'], 0.7) },
    { instrument: 'marimba', notes: bars(['G5:2 C6:2 E6:2 G6:4 F6:2 A6:4', 'B6:2 A6:2 B6:2 D7:2 C7:8'], 0.45) },
    { instrument: 'bass', notes: bars(['C3:6 -:2 F2:6 -:2', 'G2:6 -:2 C3:8'], 0.8) },
    { instrument: 'kick', notes: bars(['C2:4 C2:4 C2:4 C2:4', 'C2:4 C2:4 C2:8'], 0.8) },
  ],
};

export const GAME_OVER: Song = {
  name: 'Game over',
  bpm: 84,
  bars: 2,
  loop: false,
  tracks: [
    { instrument: 'steel', notes: bars(['G5:4 E5:4 D5:4 C5:4', 'D5:2 C5:2 A4:4 C5:8'], 0.6) },
    { instrument: 'pad', notes: bars(['C4:8 A3:8', 'F3:8 C4:8'], 0.3) },
    { instrument: 'bass', notes: bars(['C3:8 A2:8', 'F2:8 C2:8'], 0.7) },
  ],
};

export const LOSE_LIFE: Song = {
  name: 'Lose a life',
  bpm: 160,
  bars: 1,
  loop: false,
  tracks: [{ instrument: 'marimba', notes: bars(['E6:2 D6:2 B5:2 G5:2 E5:2 D5:2 C5:4'], 0.6) }],
};


import type { Song } from '../sequencer';
import { PALM_BEACH } from './palm-beach';
import { GAME_OVER, LEVEL_CLEAR, LOSE_LIFE, STARFRUIT } from './short';

/** Every piece of music by name. */
export const SONGS = {
  palmBeach: PALM_BEACH,
  starfruit: STARFRUIT,
  levelClear: LEVEL_CLEAR,
  gameOver: GAME_OVER,
  loseLife: LOSE_LIFE,
} satisfies Record<string, Song>;

export type SongName = keyof typeof SONGS;

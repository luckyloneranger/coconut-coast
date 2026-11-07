import { describe, expect, it } from 'vitest';
import { noteFreq, stepSeconds, transpose } from '../src/audio/notes';
import { MAX_VOICES, VoicePool } from '../src/audio/voices';
import { INSTRUMENTS, STEPS_PER_BAR, bars, notesBetween, parseLine, songSteps } from '../src/audio/sequencer';
import { SONGS } from '../src/audio/songs';
import { loadAudioSettings } from '../src/audio/audio-system';
import type { SoundEvent } from '../src/audio/sfx';
import { AUDIO, COMBAT, PIP } from '../src/game/tuning';
import { LevelScene } from '../src/scenes/level-scene';
import type { ArtLibrary } from '../src/gfx/art/library';
import type { InputSnapshot } from '../src/core/input';
import type { Action } from '../src/core/keymap';

describe('notes and timing', () => {
  it('note names become the right frequencies', () => {
    expect(noteFreq('A4')).toBeCloseTo(440);
    expect(noteFreq('A5')).toBeCloseTo(880);
    expect(noteFreq('C4')).toBeCloseTo(261.63, 1);
    expect(noteFreq('Bb3')).toBeCloseTo(noteFreq('A#3'));
    expect(() => noteFreq('H2')).toThrow();
  });
  it('transposes by semitones, and steps follow the tempo', () => {
    expect(transpose('C4', 7)).toBe('G4');
    expect(transpose('F3', -12)).toBe('F2');
    expect(stepSeconds(120)).toBeCloseTo(0.125);
  });
});

describe('the 8-voice limit', () => {
  it('a free voice is used first; when all 8 are busy the one finishing soonest gives way', () => {
    const pool = new VoicePool();
    const stopped: number[] = [];
    for (let i = 0; i < MAX_VOICES; i++) pool.take(0, 1 + i, () => stopped.push(i));
    expect(pool.busy(0.5)).toBe(MAX_VOICES);
    expect(stopped).toEqual([]);
    pool.take(0.5, 2, () => {});
    expect(stopped).toEqual([0]); // the one ending at 1 s was cut
    expect(pool.busy(0.6)).toBe(MAX_VOICES);
  });
  it('voices that have finished are reused without cutting anything', () => {
    const pool = new VoicePool();
    let cut = false;
    pool.take(0, 1, () => (cut = true));
    pool.take(2, 3, () => {});
    expect(cut).toBe(false);
  });
});

describe('the sequencer', () => {
  it('reads note lines, and every bar must be 16 steps', () => {
    const { notes, steps } = parseLine('C5:2 -:2 E5:4 G5:8');
    expect(steps).toBe(16);
    expect(notes.map((n) => n.step)).toEqual([0, 4, 8]);
    expect(() => bars(['C5:4 E5:4'])).toThrow(/Bar 1 is 8 steps/);
  });

  it('finds the notes in a stretch of time, and loops seamlessly', () => {
    const song = SONGS.starfruit;
    const length = songSteps(song);
    const first = notesBetween(song, 0, 8);
    const again = notesBetween(song, length, length + 8);
    expect(again.length).toBe(first.length);
    expect(again[0].at - length).toBe(first[0].at);
    const all = notesBetween(song, 0, length).length;
    expect(notesBetween(song, 0, length / 2).length + notesBetween(song, length / 2, length).length).toBe(all); // no note lost or doubled at the seam
  });

  it('a song that does not loop stops at the end', () => {
    const song = SONGS.levelClear;
    expect(notesBetween(song, songSteps(song), songSteps(song) * 3)).toHaveLength(0);
  });
});

describe('the songs', () => {
  it('every song is well formed: real notes, known instruments, notes inside the song', () => {
    for (const song of Object.values(SONGS)) {
      for (const track of song.tracks) {
        expect(INSTRUMENTS).toContain(track.instrument);
        for (const n of track.notes) {
          expect(() => noteFreq(n.note)).not.toThrow();
          expect(n.step).toBeGreaterThanOrEqual(0);
          expect(n.step).toBeLessThan(song.bars * STEPS_PER_BAR);
          expect(n.vel).toBeGreaterThan(0);
          expect(n.vel).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('Palm Beach is about a minute long and loops; the jingles are short and do not', () => {
    const pb = SONGS.palmBeach;
    const seconds = songSteps(pb) * stepSeconds(pb.bpm);
    expect(seconds).toBeGreaterThan(45);
    expect(seconds).toBeLessThan(95);
    expect(pb.loop).toBe(true);
    for (const j of [SONGS.levelClear, SONGS.gameOver, SONGS.loseLife]) {
      expect(j.loop).toBe(false);
      expect(songSteps(j) * stepSeconds(j.bpm)).toBeLessThan(6);
    }
  });

  it('never asks for more than 8 notes at once in the busiest moment of Palm Beach', () => {
    const pb = SONGS.palmBeach;
    let most = 0;
    for (let s = 0; s < songSteps(pb); s++) most = Math.max(most, notesBetween(pb, s, s + 1).length);
    expect(most).toBeLessThanOrEqual(8);
  });
});

describe('volume settings', () => {
  it('start at the defaults, and read saved values (ignoring nonsense)', () => {
    expect(loadAudioSettings(() => null)).toEqual({ music: AUDIO.MUSIC_VOLUME, sfx: AUDIO.SFX_VOLUME, muted: false });
    const saved: Record<string, string> = { musicVolume: '0.3', sfxVolume: '7', muted: '1' };
    expect(loadAudioSettings((k) => saved[k] ?? null)).toEqual({ music: 0.3, sfx: AUDIO.SFX_VOLUME, muted: true });
  });
});

const DT = 1 / 60;
const ART = { source: 'code', sheet: () => ({ frameW: 24, frameH: 32, frames: 37, from: 'code' }) } as unknown as ArtLibrary;
const press = (held: Action[], fresh: Action[] = []): InputSnapshot => ({ isDown: (a) => held.includes(a) || fresh.includes(a), justPressed: (a) => fresh.includes(a), justReleased: () => false });

describe('the game announces sounds', () => {
  function scene(rows: string[]) {
    const heard: SoundEvent[] = [];
    const s = new LevelScene({ name: 's', rows }, ART, () => {}, { sound: (e) => heard.push(e) });
    return { s, heard, kinds: () => heard.map((e) => e.kind) };
  }

  it('jumping, collecting fruit and stomping', () => {
    const { s, kinds } = scene(['P.*...............c', '###################']); // the crab far enough away not to meet Pip first
    for (let t = 0; t < 0.5; t += DT) s.update(DT, press(['RIGHT'])); // walk into the fruit
    expect(kinds()).toContain('fruit');
    s.update(DT, press(['JUMP'], ['JUMP']));
    for (let t = 0; t < 0.3; t += DT) s.update(DT, press(['JUMP']));
    expect(kinds()).toContain('jump');
    expect(s.dying).toBe(0);
    const crab = s.enemies[0];
    crab.awake = true;
    s.pip.x = crab.x + 2;
    s.pip.y = crab.y - PIP.HEIGHT - 20;
    s.pip.vx = 0;
    s.pip.vy = 0; // dropped from just above, not still rising from the jump
    for (let t = 0; t < 0.5; t += DT) s.update(DT, press([]));
    expect(kinds()).toContain('stomp');
  });

  it('the music follows what is happening: level tune, Starfruit theme, losing a life', () => {
    const { s } = scene(['P.....', '######']);
    expect(s.song).toBe('palmBeach');
    s.form.eatStarfruit();
    expect(s.song).toBe('starfruit');
    s.die();
    expect(s.song).toBe('loseLife');
    for (let t = 0; t < COMBAT.DEATH_TIME + 0.1; t += DT) s.update(DT, press([]));
    expect(s.song).toBe('palmBeach');
  });
});

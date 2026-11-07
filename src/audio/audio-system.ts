// The game's sound: unlocks on the first key or tap (browsers block sound
// before that), keeps the volumes and mute saved, pauses with the tab, and
// switches between songs and jingles.

import { loadSetting, saveSetting } from '../core/settings';
import { AUDIO } from '../game/tuning';
import { MusicPlayer } from './music';
import { playSfx, type SoundEvent } from './sfx';
import { SONGS, type SongName } from './songs';
import { Synth } from './synth';

/** Volumes and mute, as saved (pure, so it can be tested). */
export interface AudioSettings {
  music: number; // 0-1
  sfx: number; // 0-1
  muted: boolean;
}

export function loadAudioSettings(read: (key: string) => string | null): AudioSettings {
  const num = (key: string, fallback: number) => {
    const v = Number(read(key));
    return read(key) !== null && Number.isFinite(v) && v >= 0 && v <= 1 ? v : fallback;
  };
  return { music: num('musicVolume', AUDIO.MUSIC_VOLUME), sfx: num('sfxVolume', AUDIO.SFX_VOLUME), muted: read('muted') === '1' };
}

export class AudioSystem {
  settings: AudioSettings = loadAudioSettings(loadSetting);
  private synth: Synth | null = null;
  private music: MusicPlayer | null = null;
  private wanted: SongName | null = null;
  private stopWaves: (() => void) | null = null;
  private wavesWanted = false;

  /** 'locked' until the first key or tap, then 'running' (or 'suspended' while the tab is hidden). */
  get state(): string {
    return this.synth ? this.synth.ctx.state : 'locked';
  }

  /** Call from the first key press, tap or pad button: browsers only allow sound after one. */
  unlock(): void {
    if (this.synth) {
      if (this.synth.ctx.state === 'suspended' && !document.hidden) void this.synth.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return; // no Web Audio: the game simply stays silent
    this.synth = new Synth(new Ctx());
    this.music = new MusicPlayer(this.synth);
    this.applyVolumes();
    if (this.wavesWanted) this.setWaves(true);
    document.addEventListener('visibilitychange', () => {
      if (!this.synth) return;
      if (document.hidden) void this.synth.ctx.suspend();
      else void this.synth.ctx.resume();
    });
  }

  toggleMute(): void {
    this.settings.muted = !this.settings.muted;
    saveSetting('muted', this.settings.muted ? '1' : '0');
    this.applyVolumes();
  }

  setVolumes(music: number, sfx: number): void {
    this.settings.music = music;
    this.settings.sfx = sfx;
    saveSetting('musicVolume', String(music));
    saveSetting('sfxVolume', String(sfx));
    this.applyVolumes();
  }

  private applyVolumes(): void {
    this.synth?.setVolumes(this.settings.music, this.settings.sfx, this.settings.muted);
  }

  /** The song that should be playing now (switches only when it changes). */
  setSong(name: SongName | null): void {
    if (name === this.wanted) return;
    this.wanted = name;
    this.music?.play(name ? SONGS[name] : null);
  }

  /** Gentle waves under the music (the beach). */
  setWaves(on: boolean): void {
    this.wavesWanted = on;
    if (!this.synth) return;
    if (on && !this.stopWaves) this.stopWaves = this.synth.waves(AUDIO.WAVES_LEVEL);
    if (!on && this.stopWaves) {
      this.stopWaves();
      this.stopWaves = null;
    }
  }

  sfx(e: SoundEvent): void {
    if (this.synth && this.synth.ctx.state === 'running') playSfx(this.synth, e);
  }

  /** Call every frame. */
  tick(): void {
    if (!this.music) return;
    if (this.wanted && !this.music.playing) this.music.play(SONGS[this.wanted]);
    this.music.tick();
  }
}

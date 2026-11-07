import { describe, expect, it } from 'vitest';
import { Particles } from '../src/gfx/fx/particles';
import { cycleIndex, layerStart } from '../src/gfx/fx/parallax';
import { ASSETS } from '../src/gfx/art/assets';
import { ENEMY_FRAME } from '../src/gfx/art/code/enemies';
import { mapsAreSize } from '../src/gfx/art/pixels';
import { COMBAT, FX, PIP } from '../src/game/tuning';
import { LevelScene } from '../src/scenes/level-scene';
import { Level } from '../src/world/level';
import { TEST_LEVEL } from '../src/world/levels/test-level';
import { TILE } from '../src/world/tiles';
import type { ArtLibrary } from '../src/gfx/art/library';
import type { InputSnapshot } from '../src/core/input';
import type { Action } from '../src/core/keymap';

const DT = 1 / 60;
const ART = { source: 'code', sheet: () => ({ frameW: 24, frameH: 32, frames: 37, from: 'code' }) } as unknown as ArtLibrary;
const input = (held: Action[] = []): InputSnapshot => ({ isDown: (a) => held.includes(a), justPressed: () => false, justReleased: () => false });

describe('particles', () => {
  it('move, fall, and disappear when their time is up', () => {
    const p = new Particles();
    p.splash(100, 100, 5);
    expect(p.list).toHaveLength(5);
    const y0 = p.list[0].y;
    for (let t = 0; t < 0.3; t += DT) p.update(DT);
    expect(p.list[0].y).not.toBe(y0);
    for (let t = 0; t < 1; t += DT) p.update(DT);
    expect(p.list).toHaveLength(0);
  });

  it('never grow past the cap (the oldest go first)', () => {
    const p = new Particles();
    for (let i = 0; i < FX.MAX_PARTICLES + 50; i++) p.sparkle(i, 0);
    expect(p.list.length).toBe(FX.MAX_PARTICLES);
  });

  it('are repeatable (same effects every run)', () => {
    const a = new Particles();
    const b = new Particles();
    a.pop(0, 0);
    b.pop(0, 0);
    expect(a.list.map((q) => q.vx)).toEqual(b.list.map((q) => q.vx));
  });
});

describe('parallax and colour cycling', () => {
  it('a layer starts at or left of 0, and slower layers move less', () => {
    expect(layerStart(0, 0.5, 512)).toBe(-0);
    expect(layerStart(100, 0.5, 512)).toBe(-50);
    expect(layerStart(100, 0.1, 512)).toBe(-10);
    expect(layerStart(2000, 0.4, 512)).toBeLessThanOrEqual(0);
    expect(layerStart(2000, 0.4, 512)).toBeGreaterThan(-512); // wraps seamlessly
  });

  it('colours step round the cycle over time', () => {
    expect(cycleIndex(0, 0, 4, 4)).toBe(0);
    expect(cycleIndex(0, 0.25, 4, 4)).toBe(1);
    expect(cycleIndex(3, 0.25, 4, 4)).toBe(0);
  });
});

describe('the new art', () => {
  it('enemy sheets have their walk/flap frames plus a hit frame, at the ART_PROMPTS sizes', () => {
    expect(mapsAreSize(ASSETS.crab.code, 24, 16)).toBe(true);
    expect(ASSETS.crab.code).toHaveLength(ENEMY_FRAME.crab.hit + 1);
    expect(mapsAreSize(ASSETS.gull.code, 24, 20)).toBe(true);
    expect(ASSETS.gull.code).toHaveLength(ENEMY_FRAME.gull.hit + 1);
    expect(ASSETS.urchin.code).toHaveLength(ENEMY_FRAME.urchin.hit + 1);
  });

  it('background layers are their documented sizes, and the far sea cycles through 3 frames', () => {
    expect(mapsAreSize(ASSETS.bgSky.code, 480, 270)).toBe(true);
    expect(mapsAreSize(ASSETS.bgFar.code, 512, 100)).toBe(true);
    expect(ASSETS.bgFar.code).toHaveLength(3);
    expect(ASSETS.bgFar.code[0].rows).toEqual(ASSETS.bgFar.code[1].rows); // same picture...
    expect(ASSETS.bgFar.code[0].palette['1']).not.toBe(ASSETS.bgFar.code[1].palette['1']); // ...different glint colours
    expect(mapsAreSize(ASSETS.bgMid.code, 512, 120)).toBe(true);
  });
});

describe('sea water', () => {
  it('the test level has water in the wide pit', () => {
    const L = new Level(TEST_LEVEL);
    expect(L.tileAt(80, 17)).toBe('water');
    expect(L.isSolid(80, 17)).toBe(false);
  });

  it('sinking into it costs a life, with a splash', () => {
    const scene = new LevelScene({ name: 'w', rows: ['P.....', '##..##', '##~~##', '######'] }, ART, () => {});
    scene.pip.x = 2 * TILE + 8;
    scene.pip.y = TILE - PIP.HEIGHT;
    for (let t = 0; t < 1 && scene.dying === 0; t += DT) scene.update(DT, input());
    expect(scene.dying).toBeGreaterThan(0);
    expect(scene.particles.list.some((p) => p.kind === 'splash')).toBe(true);
  });
});

describe('game feel', () => {
  const L = { name: 'c', rows: ['P....c....', '##########'] };

  it('a stomp freezes the game for a moment and pops the enemy into stars', () => {
    const scene = new LevelScene(L, ART, () => {});
    const crab = scene.enemies[0];
    crab.awake = true;
    scene.pip.x = crab.x + 2;
    scene.pip.y = crab.y - PIP.HEIGHT - 20;
    for (let t = 0; t < 0.5 && scene.freeze === 0; t += DT) scene.update(DT, input());
    expect(scene.freeze).toBeGreaterThan(0);
    expect(scene.particles.list.some((p) => p.kind === 'star')).toBe(true);
    const yFrozen = scene.pip.y;
    scene.update(DT, input());
    expect(scene.pip.y).toBe(yFrozen); // held still
    for (let t = 0; t < FX.STOMP_FREEZE + COMBAT.SQUASH_TIME + 0.1; t += DT) scene.update(DT, input());
    expect(crab.defeated).toBe(true);
  });

  it('Big Pip breaking stone shakes the screen, but not in calm mode', () => {
    const room = { name: 'r', rows: ['.......', '.......', '...%...', '.......', '.......', 'P......', '#######'] };
    for (const calm of [false, true]) {
      const scene = new LevelScene(room, ART, () => {}, { calm });
      scene.form.eatMango();
      for (let t = 0; t < 0.3; t += DT) scene.update(DT, input());
      scene.pip.x = 3 * TILE;
      for (let t = 0; t < 0.1; t += DT) scene.update(DT, input());
      let shook = false;
      scene.update(DT, { isDown: (a) => a === 'JUMP', justPressed: (a) => a === 'JUMP', justReleased: () => false });
      for (let t = 0; t < 0.6; t += DT) {
        scene.update(DT, input(['JUMP']));
        if (scene.shake > 0) shook = true;
      }
      expect(scene.level.tileAt(3, 2)).toBe('air');
      expect(shook).toBe(!calm);
    }
  });

  it('running at full speed leaves after-images; walking does not', () => {
    const scene = new LevelScene({ name: 'f', rows: ['P' + '.'.repeat(60), '#'.repeat(61)] }, ART, () => {});
    for (let t = 0; t < 0.5; t += DT) scene.update(DT, input(['RIGHT']));
    expect(scene.afterImages).toHaveLength(0);
    for (let t = 0; t < 1; t += DT) scene.update(DT, input(['RIGHT', 'RUN']));
    expect(scene.afterImages.length).toBeGreaterThan(0);
    expect(scene.afterImages.length).toBeLessThanOrEqual(FX.AFTERIMAGES);
  });
});

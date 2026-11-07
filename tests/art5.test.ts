import { describe, expect, it } from 'vitest';
import { ASSETS, ASSET_IDS } from '../src/gfx/art/assets';
import { MAX_PALETTE_COLOURS, framesInVariant, variantColour } from '../src/gfx/art/palettes';
import { PIP_FRAMES, PIP_FRAME_COUNT } from '../src/gfx/art/code/pip';
import { groundTile, tileHash } from '../src/gfx/art/code/tiles-beach';
import { mapPixels, mapsAreSize } from '../src/gfx/art/pixels';
import { PipAnimator, type AnimInput } from '../src/actors/pip-anim';
import { ANIM } from '../src/game/tuning';

describe('palettes', () => {
  it('every sprite uses 16 colours or fewer, none pure black', () => {
    for (const id of ASSET_IDS) {
      for (const f of ASSETS[id].code) {
        const used = new Set(mapPixels(f).map((p) => p.colour));
        expect(used.size, id).toBeLessThanOrEqual(MAX_PALETTE_COLOURS);
        expect(Object.keys(f.palette).length, id).toBeLessThanOrEqual(MAX_PALETTE_COLOURS);
        expect(used.has('#000000'), id).toBe(false);
      }
    }
  });

  it('the hit flash turns colours white but keeps the outline; the star shimmer changes them', () => {
    expect(variantColour('flash', '#3e9ee0', false)).not.toBe('#3e9ee0');
    expect(variantColour('flash', '#2a1610', true)).toBe('#2a1610');
    const star = framesInVariant(ASSETS.pip.code.slice(0, 1), 'starA');
    expect(star[0].palette.v).not.toBe(ASSETS.pip.code[0].palette.v);
    expect(star[0].rows).toEqual(ASSETS.pip.code[0].rows); // same pixels, new colours
  });
});

describe("Pip's sheets", () => {
  it('small, Big and Sling all have every animation, at the right sizes', () => {
    expect(mapsAreSize(ASSETS.pip.code, 24, 32)).toBe(true);
    expect(mapsAreSize(ASSETS.pipBig.code, 24, 40)).toBe(true);
    expect(mapsAreSize(ASSETS.pipSling.code, 24, 40)).toBe(true);
    for (const id of ['pip', 'pipBig', 'pipSling'] as const) expect(ASSETS[id].code).toHaveLength(PIP_FRAME_COUNT);
    // The animations from the spec, with the walk and run at 8 frames.
    for (const a of ['idle', 'bored', 'walk', 'run', 'skid', 'rise', 'apex', 'fall', 'land', 'duck', 'throw', 'hurt', 'victory', 'death'] as const) {
      expect(PIP_FRAMES[a].count, a).toBeGreaterThan(0);
    }
    expect(PIP_FRAMES.walk.count).toBe(8);
    expect(PIP_FRAMES.run.count).toBe(8);
  });

  it('feet touch the bottom of the frame when standing', () => {
    const stand = ASSETS.pip.code[PIP_FRAMES.idle.start];
    expect(stand.rows[31].replace(/\./g, '').length).toBeGreaterThan(0);
  });
});

const BASE: AnimInput = { onGround: true, vx: 0, vy: 0, skidding: false, ducking: false, sinceLanding: 1, stride: 0, dying: false, won: false };

describe('animation picker', () => {
  it('idle, then bored after 5 s of standing still', () => {
    const a = new PipAnimator();
    a.update(0.1, BASE);
    expect(a.anim).toBe('idle');
    for (let t = 0; t < ANIM.BORED_AFTER + 0.1; t += 0.1) a.update(0.1, BASE);
    expect(a.anim).toBe('bored');
    a.update(0.1, { ...BASE, vx: 50 });
    expect(a.anim).toBe('walk');
  });

  it('walk and run frames go by distance, so faster feet move faster', () => {
    const a = new PipAnimator();
    a.update(0.1, { ...BASE, vx: 100 });
    const f0 = a.frame({ ...BASE, vx: 100, stride: 0 });
    const f1 = a.frame({ ...BASE, vx: 100, stride: ANIM.WALK_STRIDE });
    expect(f1).toBe(f0 + 1);
    a.update(0.1, { ...BASE, vx: 180 });
    expect(a.anim).toBe('run');
  });

  it('in the air: rising, the turn at the top, falling', () => {
    const a = new PipAnimator();
    a.update(0.1, { ...BASE, onGround: false, vy: -300 });
    expect(a.anim).toBe('rise');
    a.update(0.1, { ...BASE, onGround: false, vy: -20 });
    expect(a.anim).toBe('apex');
    a.update(0.1, { ...BASE, onGround: false, vy: 250 });
    expect(a.anim).toBe('fall');
  });

  it('throw and hurt show briefly; a hit flashes white first', () => {
    const a = new PipAnimator();
    a.throwNow();
    a.update(0.01, BASE);
    expect(a.anim).toBe('throw');
    a.update(ANIM.THROW_TIME, BASE);
    expect(a.anim).toBe('idle');
    a.hurtNow();
    expect(a.flashing).toBe(true);
    a.update(0.01, BASE);
    expect(a.anim).toBe('hurt');
    a.update(ANIM.HURT_TIME, BASE);
    expect(a.flashing).toBe(false);
  });

  it('duck, skid, land, victory and death', () => {
    const a = new PipAnimator();
    const check = (s: Partial<AnimInput>, want: string) => {
      a.update(0.01, { ...BASE, ...s });
      expect(a.anim).toBe(want);
    };
    check({ ducking: true }, 'duck');
    check({ skidding: true, vx: 120 }, 'skid');
    check({ sinceLanding: 0.02 }, 'land');
    check({ won: true }, 'victory');
    check({ dying: true }, 'death');
  });
});

describe('ground auto-tiles', () => {
  const all = { n: true, e: true, s: true, w: true, nw: true, ne: true };
  it('grass only on tiles with open air above', () => {
    const top = groundTile({ ...all, n: false }, 0);
    const inside = groundTile(all, 0);
    const has = (m: ReturnType<typeof groundTile>, ch: string) => m.rows.some((r) => r.includes(ch));
    expect(has(top, 'G')).toBe(true);
    expect(has(inside, 'G')).toBe(false);
  });

  it('open sides get an outline; inner corners get a shadow in the nook', () => {
    const left = groundTile({ ...all, w: false }, 0);
    expect(left.rows.every((r) => r[0] === 'o')).toBe(true);
    const nook = groundTile({ ...all, nw: false }, 0);
    expect(nook.rows[0][0]).toBe('B');
  });

  it('every combination is 16 x 16, and the sand variation is stable per tile', () => {
    for (let mask = 0; mask < 64; mask++) {
      const nb = { n: !!(mask & 1), e: !!(mask & 2), s: !!(mask & 4), w: !!(mask & 8), nw: !!(mask & 16), ne: !!(mask & 32) };
      expect(mapsAreSize([groundTile(nb, mask % 4)], 16, 16)).toBe(true);
    }
    expect(tileHash(5, 9)).toBe(tileHash(5, 9));
  });
});

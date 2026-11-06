import { describe, expect, it } from 'vitest';
import { ASSETS, ASSET_IDS, sheetFits } from '../src/gfx/art/assets';
import { keyOutMagenta, mapPixels, mapsAreSize } from '../src/gfx/art/pixels';
import { artSourceFrom, pickSource } from '../src/gfx/art/library';

describe('code-drawn art', () => {
  it('every asset has the right number of frames, all the right size, using only its palette', () => {
    for (const id of ASSET_IDS) {
      const a = ASSETS[id];
      expect(a.code, id).toHaveLength(a.frames);
      expect(mapsAreSize(a.code, a.frameW, a.frameH), id).toBe(true);
      for (const f of a.code) expect(() => mapPixels(f)).not.toThrow();
    }
  });
  it('outlines are never pure black (16-bit style)', () => {
    for (const id of ASSET_IDS) for (const f of ASSETS[id].code) expect(Object.values(f.palette)).not.toContain('#000000');
  });
});

describe('external art', () => {
  it('code is the default; the address or the saved choice can pick external', () => {
    expect(artSourceFrom('', null)).toBe('code');
    expect(artSourceFrom('', 'external')).toBe('external');
    expect(artSourceFrom('?art=code', 'external')).toBe('code');
    expect(artSourceFrom('?art=external', null)).toBe('external');
  });
  it('falls back to code for any asset whose file is missing, broken or the wrong size', () => {
    expect(pickSource('external', 'ready')).toBe('external');
    for (const s of ['missing', 'loading', 'wrong size', 'failed'] as const) expect(pickSource('external', s)).toBe('code');
    expect(pickSource('code', 'ready')).toBe('code');
  });
  it('a sheet must match the frame grid exactly', () => {
    const hero = ASSETS.hero;
    expect(sheetFits(hero, hero.frameW * hero.frames, hero.frameH)).toBe(true);
    expect(sheetFits(hero, 1024, 1024)).toBe(false);
  });
  it('magenta backgrounds turn see-through, other colours stay', () => {
    const px = new Uint8ClampedArray([255, 0, 255, 255, 250, 12, 245, 255, 200, 40, 60, 255]);
    expect(keyOutMagenta(px, 40)).toBe(2);
    expect([px[3], px[7], px[11]]).toEqual([0, 0, 255]);
  });
});

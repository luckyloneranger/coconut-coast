import { describe, expect, it } from 'vitest';
import { assembleSheet, backgroundColour, cleanUp, findFigures, makePalette, pixelSizeFor, reduceColours, shrink, type Rgba } from '../src/tools/art-clean';

/** A made-up "generated image": magenta background, figures drawn as blocks of `scale` px per game pixel. */
function fakeImage(figures: { x: number; y: number; map: string[] }[], w: number, h: number, scale: number): Rgba {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([255, 0, 255, 255], i * 4);
  const colours: Record<string, number[]> = { r: [220, 60, 50], b: [40, 90, 200], y: [250, 220, 60] };
  for (const f of figures) {
    f.map.forEach((row, gy) => {
      for (let gx = 0; gx < row.length; gx++) {
        const c = colours[row[gx]];
        if (!c) continue;
        for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) data.set([...c, 255], ((f.y + gy * scale + dy) * w + f.x + gx * scale + dx) * 4);
      }
    });
  }
  return { data, w, h };
}
const FIG = ['.rr.', 'rbbr', 'rbbr', '.yy.'];

describe('art cleanup', () => {
  it('finds the magenta background and the figures on it, left to right', () => {
    const img = fakeImage([{ x: 10, y: 20, map: FIG }, { x: 80, y: 12, map: FIG }], 140, 60, 6);
    const bg = backgroundColour(img);
    expect(bg[0]).toBeGreaterThan(200);
    expect(bg[1]).toBeLessThan(40);
    const figs = findFigures(img, bg);
    expect(figs).toHaveLength(2);
    expect(figs[0].x).toBe(10);
    expect(figs[1].y).toBe(12);
    expect(figs[0].w).toBe(24);
  });

  it('works out the pixel size and shrinks a figure back to its real pixels', () => {
    const img = fakeImage([{ x: 10, y: 20, map: FIG }], 60, 60, 6);
    const [fig] = findFigures(img, backgroundColour(img));
    expect(pixelSizeFor(fig, 4, 4)).toBe(6);
    const small = shrink(img, fig, 6, backgroundColour(img));
    expect([small.w, small.h]).toEqual([4, 4]);
    expect(small.data[3]).toBe(0); // the corner was background: see-through
    expect([small.data[4], small.data[5], small.data[6]]).toEqual([220, 60, 50]); // red
  });

  it('ignores the blurry edges a generator adds', () => {
    const img = fakeImage([{ x: 12, y: 12, map: FIG }], 60, 60, 8);
    // Smudge one pixel at the edge of each cell with an in-between colour.
    for (let y = 12; y < 44; y += 8) img.data.set([180, 40, 140, 255], (y * 60 + 12 + 8) * 4);
    const [fig] = findFigures(img, backgroundColour(img));
    const small = shrink(img, fig, 8, backgroundColour(img));
    expect([small.data[4], small.data[5], small.data[6]]).toEqual([220, 60, 50]);
  });

  it('cuts the colours down to the limit', () => {
    const many = Array.from({ length: 200 }, (_, i) => [i, (i * 7) % 256, (i * 13) % 256] as [number, number, number]);
    expect(makePalette(many, 16).length).toBeLessThanOrEqual(16);
    const img: Rgba = { data: new Uint8ClampedArray(many.flatMap((c) => [...c, 255])), w: 200, h: 1 };
    reduceColours(img, 4);
    const left = new Set<string>();
    for (let i = 0; i < img.data.length; i += 4) left.add(`${img.data[i]},${img.data[i + 1]},${img.data[i + 2]}`);
    expect(left.size).toBeLessThanOrEqual(4);
  });

  it('lines frames up bottom-centred in a sheet of the exact size', () => {
    const fig: Rgba = { data: new Uint8ClampedArray(4 * 4 * 4).fill(255), w: 4, h: 4 };
    const sheet = assembleSheet([fig, fig], 8, 8, 3);
    expect([sheet.w, sheet.h]).toEqual([24, 8]);
    const alpha = (x: number, y: number) => sheet.data[(y * 24 + x) * 4 + 3];
    expect(alpha(2, 4)).toBe(255); // frame 1: centred, bottom rows
    expect(alpha(2, 3)).toBe(0);
    expect(alpha(16 + 2, 7)).toBe(0); // frame 3 empty (only 2 figures)
  });

  it('the whole cleanup gives a sheet the game accepts', () => {
    const img = fakeImage([{ x: 10, y: 30, map: FIG }, { x: 70, y: 30, map: FIG }], 130, 70, 5);
    const { sheet, found } = cleanUp(img, 4, 4, 2);
    expect(found).toBe(2);
    expect([sheet.w, sheet.h]).toEqual([8, 4]);
  });
});

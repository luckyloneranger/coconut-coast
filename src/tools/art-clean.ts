// The cleanup steps for images from an image generator, as plain functions on
// RGBA pixel arrays (no browser needed, so they can be tested):
//   1. find the background colour (from the border) and the figures on it,
//   2. shrink each figure onto the game's real pixel grid,
//   3. cut the colours down to a small palette (16 at most),
//   4. place each figure bottom-centred in a frame of the sheet's exact size.

export interface Rgba {
  data: Uint8ClampedArray; // 4 bytes per pixel
  w: number;
  h: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Rgb = [number, number, number];

const get = (img: Rgba, x: number, y: number): Rgb => {
  const i = (y * img.w + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};
const dist2 = (a: Rgb, b: Rgb) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const isClear = (img: Rgba, x: number, y: number) => img.data[(y * img.w + x) * 4 + 3] < 128;

/** The background: the most common colour round the border (magenta if the prompt was followed). */
export function backgroundColour(img: Rgba): Rgb {
  const counts = new Map<string, { c: Rgb; n: number }>();
  const add = (x: number, y: number) => {
    const c = get(img, x, y).map((v) => Math.round(v / 16) * 16) as Rgb;
    const k = c.join(',');
    const e = counts.get(k);
    if (e) e.n++;
    else counts.set(k, { c, n: 1 });
  };
  for (let x = 0; x < img.w; x++) {
    add(x, 0);
    add(x, img.h - 1);
  }
  for (let y = 0; y < img.h; y++) {
    add(0, y);
    add(img.w - 1, y);
  }
  return [...counts.values()].sort((a, b) => b.n - a.n)[0].c;
}

/** Is this pixel background (close to the background colour, or see-through)? */
export function isBackground(img: Rgba, x: number, y: number, bg: Rgb, tolerance = 60): boolean {
  return isClear(img, x, y) || dist2(get(img, x, y), bg) < tolerance * tolerance;
}

/**
 * The figures, left to right: runs of columns that hold something other than
 * background, each trimmed top and bottom to what it holds. Tiny specks
 * (narrower than `minWidth`) are ignored.
 */
export function findFigures(img: Rgba, bg: Rgb, minWidth = 3): Box[] {
  const colHas = Array.from({ length: img.w }, (_, x) => {
    for (let y = 0; y < img.h; y++) if (!isBackground(img, x, y, bg)) return true;
    return false;
  });
  const out: Box[] = [];
  let start = -1;
  for (let x = 0; x <= img.w; x++) {
    const has = x < img.w && colHas[x];
    if (has && start < 0) start = x;
    if (!has && start >= 0) {
      if (x - start >= minWidth) {
        let top = img.h;
        let bottom = -1;
        for (let yy = 0; yy < img.h; yy++) {
          for (let xx = start; xx < x; xx++) {
            if (!isBackground(img, xx, yy, bg)) {
              top = Math.min(top, yy);
              bottom = Math.max(bottom, yy);
            }
          }
        }
        out.push({ x: start, y: top, w: x - start, h: bottom - top + 1 });
      }
      start = -1;
    }
  }
  return out;
}

/** How many image pixels make one game pixel, so the figure fits the frame (or the size you choose). */
export function pixelSizeFor(fig: Box, frameW: number, frameH: number, override = 0): number {
  if (override > 0) return override;
  return Math.max(fig.w / frameW, fig.h / frameH, 1);
}

/**
 * Shrink a figure onto the game's pixel grid: each game pixel takes the most
 * common colour in its cell (so blurred edges from the generator drop away).
 * Background cells come out see-through (alpha 0).
 */
export function shrink(img: Rgba, fig: Box, size: number, bg: Rgb): Rgba {
  const w = Math.max(1, Math.round(fig.w / size));
  const h = Math.max(1, Math.round(fig.h / size));
  const out = new Uint8ClampedArray(w * h * 4);
  for (let gy = 0; gy < h; gy++) {
    for (let gx = 0; gx < w; gx++) {
      const counts = new Map<string, { c: Rgb; n: number }>();
      let bgCount = 0;
      const x0 = Math.floor(fig.x + gx * size);
      const y0 = Math.floor(fig.y + gy * size);
      const x1 = Math.min(img.w, Math.max(x0 + 1, Math.floor(fig.x + (gx + 1) * size)));
      const y1 = Math.min(img.h, Math.max(y0 + 1, Math.floor(fig.y + (gy + 1) * size)));
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          if (isBackground(img, x, y, bg)) {
            bgCount++;
            continue;
          }
          const c = get(img, x, y);
          const k = c.map((v) => v >> 3).join(',');
          const e = counts.get(k);
          if (e) e.n++;
          else counts.set(k, { c, n: 1 });
        }
      }
      const best = [...counts.values()].sort((a, b) => b.n - a.n)[0];
      const i = (gy * w + gx) * 4;
      if (!best || bgCount > best.n * 1.5) continue; // mostly background: leave see-through
      out[i] = best.c[0];
      out[i + 1] = best.c[1];
      out[i + 2] = best.c[2];
      out[i + 3] = 255;
    }
  }
  return { data: out, w, h };
}

/** A palette of at most `k` colours for these pixels (median cut). */
export function makePalette(colours: Rgb[], k: number): Rgb[] {
  if (!colours.length) return [];
  let boxes: Rgb[][] = [colours];
  while (boxes.length < k) {
    // Split the box with the widest colour range along that range.
    let best = -1;
    let bestRange = 0;
    let bestCh = 0;
    boxes.forEach((b, bi) => {
      for (let ch = 0; ch < 3; ch++) {
        const vals = b.map((c) => c[ch]);
        const range = Math.max(...vals) - Math.min(...vals);
        if (range > bestRange && b.length > 1) {
          bestRange = range;
          best = bi;
          bestCh = ch;
        }
      }
    });
    if (best < 0) break;
    const box = [...boxes[best]].sort((a, b) => a[bestCh] - b[bestCh]);
    const mid = Math.floor(box.length / 2);
    boxes = [...boxes.slice(0, best), box.slice(0, mid), box.slice(mid), ...boxes.slice(best + 1)];
  }
  return boxes.map((b) => [0, 1, 2].map((ch) => Math.round(b.reduce((s, c) => s + c[ch], 0) / b.length)) as Rgb);
}

/** Snap every solid pixel to the nearest palette colour, in place. Returns the palette used. */
export function reduceColours(img: Rgba, k: number): Rgb[] {
  const solid: Rgb[] = [];
  for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3] > 0) solid.push([img.data[i], img.data[i + 1], img.data[i + 2]]);
  const palette = makePalette(solid, k);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) continue;
    const c: Rgb = [img.data[i], img.data[i + 1], img.data[i + 2]];
    const best = palette.reduce((a, b) => (dist2(b, c) < dist2(a, c) ? b : a));
    img.data[i] = best[0];
    img.data[i + 1] = best[1];
    img.data[i + 2] = best[2];
  }
  return palette;
}

/** Put the shrunk figures into one sheet: each bottom-centred in a frameW x frameH cell, left to right. */
export function assembleSheet(figures: Rgba[], frameW: number, frameH: number, frames: number): Rgba {
  const W = frameW * frames;
  const out = new Uint8ClampedArray(W * frameH * 4);
  figures.slice(0, frames).forEach((f, n) => {
    const left = n * frameW + Math.floor((frameW - f.w) / 2);
    const top = frameH - f.h;
    for (let y = 0; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        const dx = left + x;
        const dy = top + y;
        if (dx < n * frameW || dx >= (n + 1) * frameW || dy < 0) continue; // clip anything too big
        const s = (y * f.w + x) * 4;
        const d = (dy * W + dx) * 4;
        for (let c = 0; c < 4; c++) out[d + c] = f.data[s + c];
      }
    }
  });
  return { data: out, w: W, h: frameH };
}

/** The whole cleanup in one go. */
export function cleanUp(img: Rgba, frameW: number, frameH: number, frames: number, colours = 16, pixelSize = 0): { sheet: Rgba; found: number } {
  const bg = backgroundColour(img);
  const figs = findFigures(img, bg);
  // One pixel size for all figures (the largest needed), so frames stay in proportion.
  const size = pixelSize > 0 ? pixelSize : Math.max(1, ...figs.map((f) => pixelSizeFor(f, frameW, frameH)));
  const shrunk = figs.map((f) => shrink(img, f, size, bg));
  const sheet = assembleSheet(shrunk, frameW, frameH, frames);
  reduceColours(sheet, colours);
  return { sheet, found: figs.length };
}

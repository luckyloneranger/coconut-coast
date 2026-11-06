// Pure pixel helpers for the art system (no browser needed, so they can be tested).

/** A sprite drawn in code: rows of characters, each one a colour from `palette` ('.' = see-through). */
export interface PixelMap {
  rows: readonly string[];
  palette: Readonly<Record<string, string>>;
}

/** Every coloured pixel in a map, in reading order. Unknown characters are an error. */
export function mapPixels(map: PixelMap): { x: number; y: number; colour: string }[] {
  const out: { x: number; y: number; colour: string }[] = [];
  map.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const colour = map.palette[ch];
      if (!colour) throw new Error(`Pixel map uses '${ch}', which isn't in its palette`);
      out.push({ x, y, colour });
    }
  });
  return out;
}

/** Is every row of every frame the same size (w x h)? */
export function mapsAreSize(frames: readonly PixelMap[], w: number, h: number): boolean {
  return frames.every((f) => f.rows.length === h && f.rows.every((r) => r.length === w));
}

/**
 * Make pure magenta (#FF00FF, within `tolerance`) see-through, in place.
 * `data` is RGBA, 4 bytes per pixel, as from canvas getImageData.
 * Returns how many pixels were cleared.
 */
export function keyOutMagenta(data: Uint8ClampedArray, tolerance: number): number {
  let cleared = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (255 - r <= tolerance && g <= tolerance && 255 - b <= tolerance) {
      data[i + 3] = 0;
      cleared++;
    }
  }
  return cleared;
}

// Palettes: each sprite has its own small set of colours (16 at most, the
// 16-bit way), and a palette swap recolours a whole sheet at once (the white
// flash on a hit, the Starfruit shimmer; later enemy variants and night levels).

import type { PixelMap } from './pixels';

export type Palette = Readonly<Record<string, string>>;

export const MAX_PALETTE_COLOURS = 16;

/** A sheet's frames with every colour replaced by `recolour(char, colour)`. */
export function swapPalette(frames: readonly PixelMap[], recolour: (ch: string, colour: string) => string): PixelMap[] {
  return frames.map((f) => ({
    rows: f.rows,
    palette: Object.fromEntries(Object.entries(f.palette).map(([ch, c]) => [ch, recolour(ch, c)])),
  }));
}

/** Named whole-sheet palette swaps. */
export type Variant = 'normal' | 'flash' | 'starA' | 'starB';
export const VARIANTS: readonly Variant[] = ['normal', 'flash', 'starA', 'starB'];

/** How each variant changes a colour: flash goes white (outlines stay dark), star shimmers gold and cyan. */
export function variantColour(variant: Variant, colour: string, isOutline: boolean): string {
  if (variant === 'normal') return colour;
  const [r, g, b] = rgb(colour);
  const light = (r * 0.3 + g * 0.59 + b * 0.11) / 255; // how bright it is, 0-1
  if (variant === 'flash') return isOutline ? colour : mix([255, 255, 255], [220, 228, 255], light);
  const [lo, hi]: [Rgb, Rgb] = variant === 'starA' ? [[200, 120, 20], [255, 244, 140]] : [[30, 140, 200], [190, 255, 250]];
  return isOutline ? colour : mix(lo, hi, light);
}

/** The variant of a sheet's frames (`outline`: the palette letter used for outlines). */
export function framesInVariant(frames: readonly PixelMap[], variant: Variant, outline = 'o'): readonly PixelMap[] {
  return variant === 'normal' ? frames : swapPalette(frames, (ch, c) => variantColour(variant, c, ch === outline));
}

type Rgb = [number, number, number];
function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: Rgb, b: Rgb, t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

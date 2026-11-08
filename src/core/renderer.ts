import { DISPLAY } from '../game/tuning';
import { GLYPHS, GLYPH_ORDER, GLYPH_SIZE, glyphIndex, textWidth } from '../gfx/font';
import type { SpriteSheet } from '../gfx/art/library';

/**
 * How big to draw the 480x270 picture in a w x h space. A whole-number scale
 * keeps every pixel the same size; below MIN_CRISP_SCALE (a phone) that would
 * leave the game tiny, so it fills the space at a fractional scale instead.
 */
export function computeScale(availW: number, availH: number, w: number, h: number): number {
  const fit = Math.min(availW / w, availH / h);
  const whole = Math.floor(fit);
  return whole >= DISPLAY.MIN_CRISP_SCALE ? whole : fit;
}

export type TextAlign = 'left' | 'center' | 'right';

/** Draws on a 480x270 canvas, then copies it to the visible canvas, scaled with sharp pixels. */
export class Renderer {
  readonly width = DISPLAY.WIDTH;
  readonly height = DISPLAY.HEIGHT;
  scale = 1;
  private readonly low: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly screenCtx: CanvasRenderingContext2D;
  private readonly fontByColour = new Map<string, HTMLCanvasElement>();

  constructor(private readonly screen: HTMLCanvasElement) {
    this.low = document.createElement('canvas');
    this.low.width = this.width;
    this.low.height = this.height;
    this.ctx = get2d(this.low);
    this.screenCtx = get2d(screen);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Fit the visible canvas to the window (on resize and rotation). */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.scale = computeScale(window.innerWidth * dpr, window.innerHeight * dpr, this.width, this.height);
    this.screen.width = Math.round(this.width * this.scale);
    this.screen.height = Math.round(this.height * this.scale);
    this.screen.style.width = `${this.screen.width / dpr}px`;
    this.screen.style.height = `${this.screen.height / dpr}px`;
    this.screenCtx.imageSmoothingEnabled = false;
  }

  clear(colour: string): void {
    this.rect(0, 0, this.width, this.height, colour);
  }

  rect(x: number, y: number, w: number, h: number, colour: string): void {
    this.ctx.fillStyle = colour;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /** One frame of a sprite sheet with its top-left at (x, y); `flip` mirrors it (facing left), `upsideDown` turns it over. */
  sprite(sheet: SpriteSheet, frame: number, x: number, y: number, flip = false, upsideDown = false): void {
    const f = ((frame % sheet.frames) + sheet.frames) % sheet.frames;
    const dx = Math.round(x);
    const dy = Math.round(y);
    if (!flip && !upsideDown) {
      this.ctx.drawImage(sheet.image, f * sheet.frameW, 0, sheet.frameW, sheet.frameH, dx, dy, sheet.frameW, sheet.frameH);
      return;
    }
    this.ctx.save();
    this.ctx.translate(dx + (flip ? sheet.frameW : 0), dy + (upsideDown ? sheet.frameH : 0));
    this.ctx.scale(flip ? -1 : 1, upsideDown ? -1 : 1);
    this.ctx.drawImage(sheet.image, f * sheet.frameW, 0, sheet.frameW, sheet.frameH, 0, 0, sheet.frameW, sheet.frameH);
    this.ctx.restore();
  }

  /** One frame of a sheet drawn `scale` times bigger (the sprite viewer). */
  spriteScaled(sheet: SpriteSheet, frame: number, x: number, y: number, scale: number): void {
    const f = ((frame % sheet.frames) + sheet.frames) % sheet.frames;
    this.ctx.drawImage(sheet.image, f * sheet.frameW, 0, sheet.frameW, sheet.frameH, Math.round(x), Math.round(y), sheet.frameW * scale, sheet.frameH * scale);
  }

  /** A pre-drawn picture (a tile) at its natural size, optionally scaled up. */
  image(img: HTMLCanvasElement, x: number, y: number, scale = 1): void {
    this.ctx.drawImage(img, Math.round(x), Math.round(y), img.width * scale, img.height * scale);
  }

  /** Draw with see-through (0 = invisible, 1 = solid): water over Pip, after-images. */
  withAlpha(alpha: number, draw: () => void): void {
    const before = this.ctx.globalAlpha;
    this.ctx.globalAlpha = alpha;
    draw();
    this.ctx.globalAlpha = before;
  }

  /** Text in the 8x8 bitmap font. */
  text(str: string, x: number, y: number, colour: string, align: TextAlign = 'left', scale = 1): void {
    const font = this.fontImage(colour);
    const size = GLYPH_SIZE * scale;
    let left = Math.round(x);
    if (align === 'center') left -= Math.floor(textWidth(str, scale) / 2);
    else if (align === 'right') left -= textWidth(str, scale);
    for (let i = 0; i < str.length; i++) {
      const g = glyphIndex(str[i]);
      this.ctx.drawImage(font, g * GLYPH_SIZE, 0, GLYPH_SIZE, GLYPH_SIZE, left + i * size, Math.round(y), size, size);
    }
  }

  /** Text with a dark drop shadow (and optional outline), readable over any background. */
  textShadow(str: string, x: number, y: number, colour: string, align: TextAlign = 'left', scale = 1, shadow = '#1a1428', outline = false): void {
    if (outline) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) this.text(str, x + dx * scale, y + dy * scale, shadow, align, scale);
    }
    this.text(str, x + scale, y + scale, shadow, align, scale);
    this.text(str, x, y, colour, align, scale);
  }

  /** Copy the finished frame to the screen. */
  present(): void {
    this.screenCtx.imageSmoothingEnabled = false;
    this.screenCtx.drawImage(this.low, 0, 0, this.screen.width, this.screen.height);
  }

  private fontImage(colour: string): HTMLCanvasElement {
    let img = this.fontByColour.get(colour);
    if (img) return img;
    img = document.createElement('canvas');
    img.width = GLYPH_ORDER.length * GLYPH_SIZE;
    img.height = GLYPH_SIZE;
    const c = get2d(img);
    c.fillStyle = colour;
    GLYPH_ORDER.forEach((ch, i) =>
      GLYPHS[ch].forEach((row, y) => {
        for (let x = 0; x < row.length; x++) if (row[x] === '#') c.fillRect(i * GLYPH_SIZE + x, y, 1, 1);
      }),
    );
    this.fontByColour.set(colour, img);
    return img;
  }
}

function get2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser.');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

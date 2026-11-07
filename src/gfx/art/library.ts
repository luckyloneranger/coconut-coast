// Hands out sprite sheets: the code-drawn version by default, or an external
// PNG from public/art when the art option is EXTERNAL and that file exists and
// fits. Any asset without a usable external file falls back to code.

import { ART } from '../../game/tuning';
import { ASSETS, ASSET_IDS, sheetFits, type AssetId } from './assets';
import { keyOutMagenta, mapPixels } from './pixels';
import { framesInVariant, type Variant } from './palettes';

export type ArtSource = 'code' | 'external';

export interface SpriteSheet {
  image: HTMLCanvasElement;
  frameW: number;
  frameH: number;
  frames: number;
  /** Where it came from (shown in the debug overlay and sprite viewer). */
  from: ArtSource;
}

/** Why an external file wasn't used, per asset (for the debug overlay). */
export type ExternalStatus = 'missing' | 'loading' | 'ready' | 'wrong size' | 'failed';

/** Which source to use for one asset: external only when chosen and ready. */
export function pickSource(source: ArtSource, status: ExternalStatus): ArtSource {
  return source === 'external' && status === 'ready' ? 'external' : 'code';
}

/** The art option from the address (?art=code|external), else the saved choice, else code. */
export function artSourceFrom(query: string, saved: string | null): ArtSource {
  const asked = new URLSearchParams(query).get('art');
  if (asked === 'code' || asked === 'external') return asked;
  return saved === 'external' ? 'external' : 'code';
}

export class ArtLibrary {
  source: ArtSource;
  private readonly codeSheets = new Map<string, SpriteSheet>();
  private readonly externalSheets = new Map<AssetId, SpriteSheet>();
  readonly status = new Map<AssetId, ExternalStatus>();

  /** `files`: the PNG names present in public/art. */
  constructor(source: ArtSource, files: readonly string[]) {
    this.source = source;
    for (const id of ASSET_IDS) this.status.set(id, files.includes(ASSETS[id].file) ? 'loading' : 'missing');
  }

  /** Start loading every external file that exists. Safe to call once at start-up. */
  loadExternal(baseUrl: string): Promise<void> {
    const jobs = ASSET_IDS.filter((id) => this.status.get(id) === 'loading').map((id) => this.loadOne(id, baseUrl));
    return Promise.all(jobs).then(() => undefined);
  }

  /**
   * The sheet to draw for an asset right now. A palette `variant` (the hit
   * flash, the Starfruit shimmer) is made from the code-drawn colours; an
   * external sheet is shown as it is.
   */
  sheet(id: AssetId, variant: Variant = 'normal'): SpriteSheet {
    if (pickSource(this.source, this.status.get(id) ?? 'missing') === 'external') return this.externalSheets.get(id)!;
    const key = `${id}:${variant}`;
    let s = this.codeSheets.get(key);
    if (!s) {
      s = buildCodeSheet(id, variant);
      this.codeSheets.set(key, s);
    }
    return s;
  }

  /** How many assets have a usable external file. */
  get externalReady(): number {
    return [...this.status.values()].filter((s) => s === 'ready').length;
  }

  private loadOne(id: AssetId, baseUrl: string): Promise<void> {
    const spec = ASSETS[id];
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (!sheetFits(spec, img.width, img.height)) {
          console.warn(`art/${spec.file} is ${img.width}x${img.height}; expected ${spec.frameW * spec.frames}x${spec.frameH}. Using the code-drawn version.`);
          this.status.set(id, 'wrong size');
        } else {
          this.externalSheets.set(id, { ...sheetSize(id), image: keyedCanvas(img), from: 'external' });
          this.status.set(id, 'ready');
        }
        resolve();
      };
      img.onerror = () => {
        this.status.set(id, 'failed');
        resolve();
      };
      img.src = `${baseUrl}art/${spec.file}`;
    });
  }
}

function sheetSize(id: AssetId): Pick<SpriteSheet, 'frameW' | 'frameH' | 'frames'> {
  const { frameW, frameH, frames } = ASSETS[id];
  return { frameW, frameH, frames };
}

/** Draw every frame's pixel map side by side into one canvas. */
function buildCodeSheet(id: AssetId, variant: Variant): SpriteSheet {
  const spec = ASSETS[id];
  const canvas = newCanvas(spec.frameW * spec.frames, spec.frameH);
  const ctx = canvas.getContext('2d')!;
  framesInVariant(spec.code, variant).forEach((map, i) => {
    for (const p of mapPixels(map)) {
      ctx.fillStyle = p.colour;
      ctx.fillRect(i * spec.frameW + p.x, p.y, 1, 1);
    }
  });
  return { ...sheetSize(id), image: canvas, from: 'code' };
}

/** Copy an image into a canvas with its magenta background made see-through. */
function keyedCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = newCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height);
  keyOutMagenta(data.data, ART.MAGENTA_TOLERANCE);
  ctx.putImageData(data, 0, 0);
  return canvas;
}

function newCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// The cleanup tool page (?art-tool=1): pick a raw image from an image
// generator and the game sheet it's for; see the cleaned-up result beside the
// code-drawn version; save it as a PNG to drop into public/art/. Everything
// happens in the browser: nothing is uploaded anywhere.

import { ASSETS, ASSET_IDS, type AssetId } from '../gfx/art/assets';
import { mapPixels } from '../gfx/art/pixels';
import { cleanUp, type Rgba } from './art-clean';

const PREVIEW_SCALE = 3;

export function startArtTool(root: HTMLElement): void {
  document.body.style.overflow = 'auto';
  root.innerHTML = '';
  root.style.cssText = 'display:block;color:#f8f4ec;font:14px/1.5 system-ui,sans-serif;padding:16px;max-width:1100px;margin:0 auto;';
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', parent: HTMLElement = root): HTMLElementTagNameMap[K] => {
    const e = document.createElement(tag);
    if (text) e.textContent = text;
    parent.appendChild(e);
    return e;
  };
  el('h1', 'Coconut Coast art cleanup tool');
  el('p', 'Turns an image from an image generator into a game sprite sheet: it finds the figures on the background, shrinks them onto the game\'s pixel grid, cuts the colours down and lines up the frames. Nothing leaves your computer.');

  const controls = el('div');
  controls.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:12px 0;';
  const pick = el('select', '', controls);
  for (const id of ASSET_IDS) {
    const a = ASSETS[id];
    const o = el('option', `${id} — ${a.file} (${a.frames} × ${a.frameW}×${a.frameH})`, pick);
    o.value = id;
  }
  const file = el('input', '', controls);
  file.type = 'file';
  file.accept = 'image/png,image/jpeg,image/webp';
  const coloursLabel = el('label', 'Colours ', controls);
  const colours = el('input', '', coloursLabel);
  colours.type = 'number';
  colours.min = '2';
  colours.max = '16';
  colours.value = '16';
  colours.style.width = '4em';
  const sizeLabel = el('label', 'Pixel size (0 = auto) ', controls);
  const pixelSize = el('input', '', sizeLabel);
  pixelSize.type = 'number';
  pixelSize.min = '0';
  pixelSize.step = '0.5';
  pixelSize.value = '0';
  pixelSize.style.width = '5em';

  const status = el('p', 'Choose a sheet and an image.');
  el('h3', 'Cleaned up');
  const result = el('canvas');
  el('h3', 'Code-drawn version (for comparison)');
  const reference = el('canvas');
  const save = el('a', 'Save PNG');
  save.style.cssText = 'display:inline-block;margin:12px 0;padding:8px 16px;background:#3e9ee0;color:#fff;border-radius:6px;text-decoration:none;';
  el('p', 'Then put the saved file in public/art/ (keep the file name), reload the game, and press T or add ?art=external to the address.');
  el('h3', 'Original');
  const original = el('canvas');
  original.style.maxWidth = '100%';

  for (const c of [result, reference, original]) {
    c.style.imageRendering = 'pixelated';
    c.style.background = 'repeating-conic-gradient(#555 0 25%, #777 0 50%) 0 0 / 16px 16px';
  }

  let source: Rgba | null = null;

  const showReference = () => {
    const a = ASSETS[pick.value as AssetId];
    paint(reference, codeSheet(pick.value as AssetId), PREVIEW_SCALE);
    save.download = a.file;
  };

  const run = () => {
    showReference();
    if (!source) return;
    const a = ASSETS[pick.value as AssetId];
    const { sheet, found } = cleanUp(source, a.frameW, a.frameH, a.frames, Number(colours.value) || 16, Number(pixelSize.value) || 0);
    paint(result, sheet, PREVIEW_SCALE);
    save.href = toCanvas(sheet).toDataURL('image/png');
    status.textContent = `Found ${found} figure${found === 1 ? '' : 's'}; the sheet needs ${a.frames}. ${found < a.frames ? 'Missing frames are left empty: copy the nearest frame in a paint program, or generate more.' : found > a.frames ? 'Extra figures were left out.' : ''}`;
  };

  file.onchange = () => {
    const f = file.files?.[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, img.width, img.height);
      source = { data: d.data, w: d.width, h: d.height };
      paint(original, source, 1);
      run();
    };
    img.src = URL.createObjectURL(f);
  };
  pick.onchange = run;
  colours.onchange = run;
  pixelSize.onchange = run;
  showReference();
}

/** The code-drawn sheet of an asset as RGBA. */
function codeSheet(id: AssetId): Rgba {
  const a = ASSETS[id];
  const w = a.frameW * a.frames;
  const data = new Uint8ClampedArray(w * a.frameH * 4);
  a.code.forEach((map, n) => {
    for (const p of mapPixels(map)) {
      const v = parseInt(p.colour.slice(1), 16);
      const i = (p.y * w + n * a.frameW + p.x) * 4;
      data[i] = v >> 16;
      data[i + 1] = (v >> 8) & 255;
      data[i + 2] = v & 255;
      data[i + 3] = 255;
    }
  });
  return { data, w, h: a.frameH };
}

function toCanvas(img: Rgba): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.w;
  c.height = img.h;
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0);
  return c;
}

/** Show an image in a canvas, scaled up with sharp pixels. */
function paint(target: HTMLCanvasElement, img: Rgba, scale: number): void {
  target.width = img.w * scale;
  target.height = img.h * scale;
  const ctx = target.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(toCanvas(img), 0, 0, img.w * scale, img.h * scale);
}

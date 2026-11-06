import { DEBUG } from '../game/tuning';
import { UI } from '../gfx/palette';
import { textWidth } from '../gfx/font';
import type { Renderer } from './renderer';

/** Counts frames to give a smooth FPS reading. */
export class FpsCounter {
  fps = 0;
  private frames = 0;
  private elapsed = 0;
  frame(seconds: number): void {
    this.frames++;
    this.elapsed += seconds;
    if (this.elapsed >= DEBUG.FPS_SAMPLE_PERIOD) {
      this.fps = Math.round(this.frames / this.elapsed);
      this.frames = 0;
      this.elapsed = 0;
    }
  }
}

/** Developer overlay: open with ?debug=1 or the ` (backtick) key. */
export class DebugOverlay {
  visible: boolean;
  readonly fps = new FpsCounter();
  constructor(query: string) {
    this.visible = new URLSearchParams(query).get('debug') === '1';
  }
  render(r: Renderer, lines: readonly string[]): void {
    if (!this.visible) return;
    const widest = Math.max(...lines.map((l) => textWidth(l)));
    r.rect(0, 0, widest + 4, lines.length * 9 + 3, UI.BLACK);
    lines.forEach((l, i) => r.text(l, 2, 2 + i * 9, UI.GREEN));
  }
}

import type { InputSnapshot } from './input';
import type { Renderer } from './renderer';

/** One screen of the game (title, world map, a level, pause...). */
export interface Scene {
  readonly name: string;
  update(dt: number, input: InputSnapshot): void;
  render(r: Renderer): void;
  /** Extra lines for the debug overlay. */
  debugLines?(): string[];
}

/** A stack of scenes; only the top one runs (pause overlays come later). */
export class SceneManager {
  private readonly stack: Scene[] = [];
  get top(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }
  push(scene: Scene): void {
    this.stack.push(scene);
  }
  pop(): Scene | undefined {
    return this.stack.pop();
  }
  replace(scene: Scene): void {
    this.stack.pop();
    this.stack.push(scene);
  }
}

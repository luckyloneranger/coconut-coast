import { DebugOverlay } from './debug';
import { GamepadPoller, connectedPads } from './gamepad';
import { Input, attachKeyboard } from './input';
import { FixedStepClock, startLoop } from './loop';
import { Renderer } from './renderer';
import { SceneManager } from './scene';
import { loadSetting, saveSetting } from './settings';
import { ArtLibrary, artSourceFrom } from '../gfx/art/library';
import { LevelScene } from '../scenes/level-scene';
import { TEST_LEVEL } from '../world/levels/test-level';
import { UI } from '../gfx/palette';

/** Owns the loop, input, renderer, art and scenes. */
export class Game {
  readonly renderer: Renderer;
  readonly input = new Input();
  readonly scenes = new SceneManager();
  readonly art: ArtLibrary;
  readonly debug = new DebugOverlay(location.search);
  private readonly pads = new GamepadPoller();
  private lastFrameMs = -1;

  constructor(canvas: HTMLCanvasElement, externalFiles: readonly string[]) {
    this.renderer = new Renderer(canvas);
    attachKeyboard(this.input);
    this.art = new ArtLibrary(artSourceFrom(location.search, loadSetting('art')), externalFiles);
    void this.art.loadExternal(import.meta.env.BASE_URL);
    this.scenes.push(
      new LevelScene(TEST_LEVEL, this.art, () => this.toggleArt(), {
        viewW: this.renderer.width,
        viewH: this.renderer.height,
        debugOpen: () => this.debug.visible,
        // Relaxed mode (no Sun Meter) until the Options screen exists: ?relaxed=1
        relaxed: new URLSearchParams(location.search).get('relaxed') === '1',
      }),
    );
  }

  /** Switch between code-drawn and external sprites, and remember the choice. */
  toggleArt(): void {
    this.art.source = this.art.source === 'code' ? 'external' : 'code';
    saveSetting('art', this.art.source);
  }

  start(): void {
    startLoop(new FixedStepClock(), (dt) => this.update(dt), (now) => this.render(now));
  }

  private update(dt: number): void {
    this.pads.poll(connectedPads(), (c) => this.input.keyDown(c), (c) => this.input.keyUp(c));
    this.input.beginStep();
    if (this.input.justPressed('DEBUG')) this.debug.visible = !this.debug.visible;
    this.scenes.top?.update(dt, this.input);
  }

  private render(nowMs: number): void {
    if (this.lastFrameMs >= 0) this.debug.fps.frame((nowMs - this.lastFrameMs) / 1000);
    this.lastFrameMs = nowMs;
    const r = this.renderer;
    r.clear(UI.BLACK);
    this.scenes.top?.render(r);
    this.debug.render(r, [`FPS ${this.debug.fps.fps}`, `SCALE ${r.scale.toFixed(2)}`, ...(this.scenes.top?.debugLines?.() ?? [])]);
    r.present();
  }
}

import externalFiles from 'virtual:art-manifest';
import { Game } from './core/game';

const canvas = document.getElementById('screen');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Missing <canvas id="screen">');
const game = new Game(canvas, externalFiles);
game.start();

// Read-only status for the browser test (tests/e2e/smoke.spec.ts).
(window as unknown as { __cc: object }).__cc = {
  get scene() {
    return game.scenes.top?.name ?? '';
  },
  get lines() {
    return game.scenes.top?.debugLines?.() ?? [];
  },
};

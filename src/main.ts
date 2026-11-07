import externalFiles from 'virtual:art-manifest';
import { Game } from './core/game';
import { startArtTool } from './tools/art-tool-page';

const canvas = document.getElementById('screen');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Missing <canvas id="screen">');

// ?art-tool=1 opens the cleanup tool for generated images instead of the game.
if (new URLSearchParams(location.search).get('art-tool') === '1') {
  canvas.remove();
  startArtTool(document.body);
} else {
  const game = new Game(canvas, externalFiles);
  game.start();
  // Read-only status for the browser tests (tests/e2e).
  (window as unknown as { __cc: object }).__cc = {
    get scene() {
      return game.scenes.top?.name ?? '';
    },
    get lines() {
      return game.scenes.top?.debugLines?.() ?? [];
    },
  };
}

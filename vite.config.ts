import { existsSync, readdirSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const ART_DIR = 'public/art';
const MANIFEST_ID = 'virtual:art-manifest';

/**
 * Lists the PNGs in public/art as `virtual:art-manifest`, so the game knows
 * which external sprites exist without asking the server for missing files.
 * Drop a file in, and the dev server reloads with it.
 */
function artManifest(): Plugin {
  const resolved = '\0' + MANIFEST_ID;
  return {
    name: 'art-manifest',
    resolveId: (id) => (id === MANIFEST_ID ? resolved : undefined),
    load(id) {
      if (id !== resolved) return undefined;
      const files = existsSync(ART_DIR) ? readdirSync(ART_DIR).filter((f: string) => f.toLowerCase().endsWith('.png')) : [];
      return `export default ${JSON.stringify(files)};`;
    },
    configureServer(server) {
      const refresh = (file: string) => {
        if (!file.replace(/\\/g, '/').includes(ART_DIR)) return;
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}

export default defineConfig({
  // Relative paths so the built game works from any folder (e.g. GitHub Pages).
  base: './',
  plugins: [artManifest()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

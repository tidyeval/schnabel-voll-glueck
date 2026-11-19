import { offlineVersion as version, serviceWorkerSource } from '@tidyeval/game-platform/build';
import { defineConfig } from 'vite';
let base = '/', publicDir;
const publicFiles = ['icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'];
export function offlineVersion(bundle, assetDir) {
  return version(bundle, assetDir, publicFiles);
}

export default defineConfig({
  base: process.env.PAGES_BASE || '/',
  plugins: [{
    name: 'offline-game',
    configResolved(config) { base = config.base; publicDir = config.publicDir; },
    generateBundle(_, bundle) {
      const files = ['', 'index.html', ...publicFiles, ...Object.keys(bundle).filter(name => name !== 'index.html')].map(name => base + name);
      const version = offlineVersion(bundle, publicDir);
      const source = serviceWorkerSource('schnabelglueck-phaser-matter', version, files);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  }],
});

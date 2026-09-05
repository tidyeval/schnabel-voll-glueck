import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
let base = '/';
export default defineConfig({
  base: process.env.PAGES_BASE || '/',
  plugins: [{
    name: 'offline-game',
    configResolved(config) { base = config.base; },
    generateBundle(_, bundle) {
      const files = ['', 'index.html', 'icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest', ...Object.keys(bundle).filter(name => name !== 'index.html')].map(name => base + name);
      const version = createHash('sha256').update(JSON.stringify(bundle)).digest('hex').slice(0, 12);
      const source = readFileSync(new URL('./scripts/sw-template.js', import.meta.url), 'utf8').replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  }],
});

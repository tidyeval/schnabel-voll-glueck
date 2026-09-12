import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
let base = '/', publicDir;
const publicFiles = ['icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'];
export function offlineVersion(bundle, assetDir) {
  const hash = createHash('sha256');
  for (const name of Object.keys(bundle).sort()) {
    const output = bundle[name];
    hash.update(name).update(output.type === 'chunk' ? output.code : output.source);
  }
  for (const name of publicFiles) hash.update(name).update(readFileSync(resolve(assetDir, name)));
  return hash.digest('hex').slice(0, 12);
}
export default defineConfig({
  base: process.env.PAGES_BASE || '/',
  plugins: [{
    name: 'offline-game',
    configResolved(config) { base = config.base; publicDir = config.publicDir; },
    generateBundle(_, bundle) {
      const files = ['', 'index.html', ...publicFiles, ...Object.keys(bundle).filter(name => name !== 'index.html')].map(name => base + name);
      const version = offlineVersion(bundle, publicDir);
      const source = readFileSync(new URL('./scripts/sw-template.js', import.meta.url), 'utf8').replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  }],
});

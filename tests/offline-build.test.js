import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { offlineVersion } from '../vite.config.js';

test('offline versions include bundled and public precached contents', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'schnabel-offline-'));
  try {
    await cp('public', fixture, { recursive: true });
    const bundle = { 'index.js': { type: 'chunk', code: 'first' } };
    const initial = offlineVersion(bundle, fixture);
    assert.equal(offlineVersion(bundle, fixture), initial, 'identical contents are reproducible');

    const manifestPath = join(fixture, 'manifest.webmanifest');
    const manifest = await readFile(manifestPath, 'utf8');
    await writeFile(manifestPath, manifest.replace('Deine kleine Auszeit', 'Eine neue Auszeit'));
    assert.notEqual(offlineVersion(bundle, fixture), initial, 'manifest-only changes update the version');

    await writeFile(manifestPath, manifest);
    const iconPath = join(fixture, 'icon-192.png');
    await writeFile(iconPath, Buffer.concat([await readFile(iconPath), Buffer.from('changed')]));
    assert.notEqual(offlineVersion(bundle, fixture), initial, 'icon-only changes update the version');
    assert.notEqual(offlineVersion({ 'index.js': { type: 'chunk', code: 'second' } }, fixture), initial, 'bundle changes update the version');
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

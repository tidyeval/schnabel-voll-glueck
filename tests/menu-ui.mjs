import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { WORLD } from '../src/game.js';
const out = 'test-results/menu';
await mkdir(out, { recursive: true });
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.clock.install();
    await page.goto(process.env.PELICAN_URL || 'http://localhost:4173');
    await page.locator('#play').waitFor();
    assert.equal(await page.locator('[name=difficulty]').count(), 0);
    assert.equal(await page.locator('#result-difficulty').count(), 0);
    await page.screenshot({ path: `${out}/${name}-320.png` });
    const bounds = await page.locator('.start-bottom').boundingBox();
    const intro = await page.locator('.intro').boundingBox();
    assert.ok(bounds.y > intro.y + intro.height, 'menu does not overlap the title');
    assert.ok(bounds.y + bounds.height <= 568, 'all menu controls fit a small phone');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#play').click();
    await page.keyboard.down('Space'); await page.clock.runFor(1000); await page.keyboard.up('Space');
    assert.equal(await page.locator('#air').getAttribute('aria-valuemax'), String(WORLD.breath));
    await page.locator('#pause').click();
    const air = await page.locator('#air-value').textContent(); await page.clock.runFor(2000);
    assert.equal(await page.locator('#air-value').textContent(), air);
    await page.locator('#quit').click();
    await page.locator('#again').click(); await page.clock.runFor(16);
    assert.equal(await page.locator('#air').getAttribute('aria-valuemax'), String(WORLD.breath));
    await page.locator('#pause').click(); await page.locator('#quit').click(); await page.locator('#back-home').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${out}/${name}-390.png` });
    assert.deepEqual(errors, []);
    console.log(`${name}: no difficulty choices, air HUD, pause, replay and small-phone layout passed`);
  } finally { await browser.close(); }
}

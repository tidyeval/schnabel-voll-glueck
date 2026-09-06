import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { DIFFICULTIES } from '../src/game.js';
const out = 'test-results/difficulty';
await mkdir(out, { recursive: true });
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.clock.install();
    await page.goto(process.env.PELICAN_URL || 'http://localhost:4173');
    await page.locator('#play').waitFor();
    for (const [id, rules] of Object.entries(DIFFICULTIES)) {
      await page.getByRole('radio', { name: rules.name, exact: true }).check();
      await page.reload();
      assert.ok(await page.getByRole('radio', { name: rules.name, exact: true }).isChecked());
      assert.ok((await page.locator('#stage-best').textContent()).startsWith(rules.name));
      await page.screenshot({ path: `${out}/${name}-${id}-320.png` });
      const bounds = await page.locator('.start-bottom').boundingBox();
      const intro = await page.locator('.intro').boundingBox();
      assert.ok(bounds.y > intro.y + intro.height, 'menu does not overlap the title');
      assert.ok(bounds.y + bounds.height <= 568, 'all menu controls fit a small phone');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('#play').click();
      await page.keyboard.down('Space'); await page.clock.runFor(1000); await page.keyboard.up('Space');
      assert.equal(await page.locator('#air').getAttribute('aria-valuemax'), String(rules.breath));
      await page.locator('#pause').click();
      const air = await page.locator('#air-value').textContent(); await page.clock.runFor(2000);
      assert.equal(await page.locator('#air-value').textContent(), air);
      await page.locator('#quit').click();
      assert.equal(await page.locator('#result-difficulty').textContent(), rules.name);
      await page.locator('#again').click(); await page.clock.runFor(16);
      assert.equal(await page.locator('#air').getAttribute('aria-valuemax'), String(rules.breath));
      await page.locator('#pause').click(); await page.locator('#quit').click(); await page.locator('#back-home').click();
    }
    await page.getByRole('radio', { name: 'Mittel', exact: true }).focus();
    await page.keyboard.press('ArrowLeft');
    assert.ok(await page.getByRole('radio', { name: 'Einfach', exact: true }).isChecked(), 'native arrow-key selection');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${out}/${name}-390.png` });
    assert.deepEqual(errors, []);
    console.log(`${name}: all difficulty choices, reload, air HUD, pause, replay, result and small-phone layout passed`);
  } finally { await browser.close(); }
}

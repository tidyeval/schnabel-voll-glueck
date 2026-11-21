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
    await page.evaluate(() => localStorage.setItem('pelican-phaser-matter-v1', JSON.stringify({ layout: 4, completed: 2, totalFish: 90, outfit: 'sailor', bests: [123, 456, 789, 0], music: false, sound: false })));
    await page.reload(); await page.locator('#play').waitFor();
    assert.equal(await page.locator('[name=difficulty]').count(), 0);
    assert.equal(await page.locator('#result-difficulty').count(), 0);
    // Wardrobe: 90 fish unlock every look; the chosen one is saved and marked.
    await page.locator('#wardrobe').click();
    assert.equal(await page.locator('[data-outfit=sailor]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-outfit]:disabled').count(), 0);
    await page.locator('[data-outfit=flower]').click();
    assert.equal(await page.locator('#wardrobe-dialog').evaluate(d => d.open), false, 'choosing a look closes the wardrobe');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pelican-phaser-matter-v1')).outfit), 'flower');
    await page.locator('#wardrobe').click(); await page.locator('[data-outfit=sailor]').click(); await page.clock.runFor(20);
    assert.equal(await page.locator('#stage-best').textContent(), 'Rekord: 789 Punkte');
    await page.locator('#stages').selectOption('0');
    assert.equal(await page.locator('#stage-best').textContent(), 'Rekord: 123 Punkte');
    const sailor = await page.locator('#world').evaluate(canvas => canvas.toDataURL());
    await page.locator('[data-locale="en"]').focus(); await page.keyboard.press('Enter');
    await page.clock.runFor(20);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pelican-phaser-matter-v1')).outfit), 'sailor');
    assert.equal(await page.locator('#world').evaluate(canvas => canvas.toDataURL()), sailor, 'language changes do not alter the selected outfit');
    await page.screenshot({ path: `${out}/${name}-320.png` });
    const bounds = await page.locator('.start-bottom').boundingBox();
    const intro = await page.locator('.intro').boundingBox();
    assert.ok(bounds.y > intro.y + intro.height, 'menu does not overlap the title');
    assert.ok(bounds.y + bounds.height <= 568, 'all menu controls fit a small phone');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#play').click();
    assert.equal(await page.locator('#combo').count(), 0, 'in-play combo badge is absent');
    await page.keyboard.down('Space'); await page.clock.runFor(1000); await page.keyboard.up('Space');
    assert.equal(await page.locator('.air-track').getAttribute('aria-valuemax'), String(WORLD.breath));
    // Minimal HUD: a readable score and a visible energy line; air is drawn at Pip, its bar stays for screen readers.
    const sizes = await page.evaluate(() => ({ score: Number.parseFloat(getComputedStyle(document.querySelector('#score')).fontSize), energy: document.querySelector('.energy-track').getBoundingClientRect().height }));
    assert.ok(sizes.score >= 16 && sizes.energy >= 2, JSON.stringify(sizes));
    await page.locator('#pause').click();
    const air = await page.locator('#air-value').textContent(); await page.clock.runFor(2000);
    assert.equal(await page.locator('#air-value').textContent(), air);
    await page.locator('#quit').click();
    await page.locator('#again').click(); await page.clock.runFor(16);
    assert.equal(await page.locator('.air-track').getAttribute('aria-valuemax'), String(WORLD.breath));
    await page.locator('#pause').click(); await page.locator('#quit').click(); await page.locator('#back-home').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${out}/${name}-390.png` });
    assert.deepEqual(errors, []);
    console.log(`${name}: language picker, air HUD, pause, replay and small-phone layout passed`);
  } finally { await browser.close(); }
}

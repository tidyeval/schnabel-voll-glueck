import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
const url = process.env.PELICAN_URL || 'http://127.0.0.1:4183';
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.clock.install(); await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.runtime === 'phaser-matter');
    await page.evaluate(() => localStorage.setItem('pelican-v1', '{"record":999,"totalFish":42}'));
    await page.locator('#play').click();
    await page.keyboard.down('Space'); await page.clock.runFor(900); await page.keyboard.up('Space');
    let state = await page.evaluate(() => window.gameSnapshot());
    assert.equal(state.physics.engine, 'matter'); assert.equal(state.physics.bodies, 1);
    assert.ok(state.physics.player.y > 400, 'real keyboard input moves the Matter body underwater');
    assert.ok(Math.abs(state.physics.time - state.time * 1000) < 1, 'the scene does not double-step Matter');
    await page.locator('#pause').click();
    state = await page.evaluate(() => window.gameSnapshot());
    await page.clock.runFor(1000);
    assert.deepEqual(await page.evaluate(() => window.gameSnapshot()), state, 'scene pause freezes physics, simulation and score');
    await page.locator('#resume').click(); await page.clock.runFor(500);
    assert.ok((await page.evaluate(() => window.gameSnapshot())).physics.time > state.physics.time, 'resume advances the actual engine');
    await page.locator('#pause').click(); await page.locator('#quit').click();
    for (let i = 0; i < 3; i++) {
      await page.locator('#again').click(); await page.clock.runFor(100);
      assert.equal((await page.evaluate(() => window.gameSnapshot())).physics.bodies, 1, 'restart removes the previous attempt body');
      await page.locator('#pause').click(); await page.locator('#quit').click();
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('pelican-v1')), '{"record":999,"totalFish":42}', 'original save remains byte-identical');
    assert.deepEqual(errors, []);
    console.log(`${name}: real Matter body, single stepping, frozen pause, resume, clean restart and original-save isolation passed`);
  } finally { await browser.close(); }
}

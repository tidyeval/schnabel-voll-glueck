// The journey map: opened from the menu, tapping an open area selects it, locked areas stay closed;
// before a stage Pip flies there on the chart, and a tap skips the flight.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.getItem('pelican-phaser-matter-v1') || localStorage.setItem('pelican-phaser-matter-v1', JSON.stringify({ layout: 5, completed: 3, tutorial: true, bests: [1240, 1870, 2310, 0, 0] })));
  await page.goto(process.env.PELICAN_URL || 'http://localhost:4173'); await page.locator('#play').waitFor();
  await page.locator('#map-open').click();
  assert.ok(await page.locator('#journey').isVisible());
  assert.equal(await page.locator('#journey-title').textContent(), '3 von 5 Nestern');
  assert.equal(await page.locator('#journey-go').textContent(), 'Weiter: Sturmkap');
  const box = await page.locator('#journey-canvas').boundingBox();
  const tap = (x, y) => page.mouse.click(box.x + box.width * x, box.y + box.height * y);
  await tap(.28, .49); assert.equal(await page.locator('#stages').inputValue(), '2', 'an open area is selected');
  await tap(.36, .215); assert.equal(await page.locator('#stages').inputValue(), '2', 'a locked area cannot be chosen');
  await tap(.67, .355); assert.equal(await page.locator('#journey-go').textContent(), 'Weiter: Sturmkap');
  await page.locator('#journey-close').click(); assert.equal(await page.locator('#journey').isVisible(), false);
  // Starting a stage shows the flight on the chart; a tap skips it and the game runs.
  await page.locator('#play').click();
  assert.ok(await page.locator('#journey.intro').isVisible());
  assert.equal(await page.locator('#journey-kicker').textContent(), 'ETAPPE 4 VON 5');
  await page.mouse.click(195, 600);
  assert.equal(await page.locator('#journey').isVisible(), false); assert.ok(await page.locator('#hud').isVisible());
  assert.deepEqual(errors, []);
  console.log('chromium: journey map, area selection, locked areas and the stage flight passed');
} finally { await browser.close(); }

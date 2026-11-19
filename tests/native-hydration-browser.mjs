import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.CapacitorCustomPlatform = { name: 'ios' };
    indexedDB.open = () => { throw new Error('forced unavailable journal'); };
  });
  await page.goto(process.env.PELICAN_URL || 'http://127.0.0.1:4183');
  await page.locator('[role=alert]').waitFor();
  assert.equal(await page.locator('#play').isDisabled(), true);
  assert.equal(await page.locator('[role=alert] button').isVisible(), true);
  assert.equal(await page.evaluate(() => localStorage.getItem('pelican-phaser-matter-v1')), null);
  console.log('native hydration failure blocks play and offers reload without writing defaults');
} finally { await browser.close(); }

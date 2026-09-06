import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results/energy', {recursive:true});
for (const [name, engine] of [['chromium',chromium],['webkit',webkit]]) {
  const browser=await engine.launch();
  try {
    const page=await browser.newPage({viewport:{width:320,height:568}, reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install();await page.goto(process.env.PELICAN_URL || 'http://localhost:4173');
    await page.locator('#settings').click();
    const bounds=await page.locator('.close-settings').boundingBox();
    assert.ok(bounds.y>=0&&bounds.y+bounds.height<=568,'help and close button fit a small phone');
    await page.locator('.close-settings').click();await page.locator('#play').click();
    await page.clock.runFor(22000);
    assert.equal(await page.locator('#result-dialog').isVisible(),false);
    const energy=await page.locator('#energy-value').textContent();
    assert.ok(Number(energy)<40,'energy visibly drains in real play');
    assert.ok(!(await page.locator('#cargo-label').textContent()).includes('ZUM NEST'));
    await page.locator('#pause').click();await page.clock.runFor(5000);
    assert.equal(await page.locator('#energy-value').textContent(),energy,'pause freezes energy');
    await page.locator('#resume').click();await page.clock.runFor(18000);
    assert.equal(await page.locator('#result-title').textContent(),'Keine Energie mehr!');
    await page.locator('#again').click();assert.equal(await page.locator('#energy-value').textContent(),'100');
    await page.goto('http://localhost:5175/tests/polish.html');
    await page.waitForFunction(()=>typeof window.paintPreview==='function');
    await page.locator('#pause').click();
    for(const reduced of [false,true])for(const scene of ['Müde','Stärkung','Treffer']){
      await page.locator('#scene').selectOption({label:scene});
      await page.locator('#reduced').setChecked(reduced);
      await page.locator('#seek').fill('0');
      const state=await page.evaluate(({scene,reduced})=>window.paintPreview(scene,0,'classic',reduced),{scene,reduced});
      if(scene==='Müde')assert.ok(state.energy<20);
      if(scene==='Stärkung')assert.ok(state.gulp>0);
      if(scene==='Treffer')assert.ok(state.hurt>0);
      await page.locator('canvas').screenshot({path:`test-results/energy/${name}-${scene}-${reduced}.png`});
    }
    assert.deepEqual(errors,[]);console.log(`${name}: energy loss, pause, exhaustion, retry, small-phone help, tired/catch/hit poses with reduced motion passed`);
  } finally {await browser.close();}
}

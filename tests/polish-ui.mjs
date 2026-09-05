import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results/polish/ui',{recursive:true});
for (const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
 const browser=await engine.launch();
 for(const [width,height] of [[320,568],[390,844],[430,932]]) for(const reducedMotion of ['reduce','no-preference']) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(process.env.PELICAN_URL||'http://localhost:4173');await page.locator('#play').waitFor();await page.clock.runFor(3100);
  assert.equal(await page.locator('#play').innerText(),'Los gehts!');
  assert.equal(await page.locator('.control-hint').count(),0);
  for(const selector of ['#play','#wardrobe','#settings']) {const r=await page.locator(selector).boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height,selector+' fits');}
  const play=await page.locator('#play').boundingBox(),wardrobe=await page.locator('#wardrobe').boundingBox();assert.ok(play.y+play.height<=wardrobe.y);
  await page.screenshot({path:`test-results/polish/ui/${name}-${width}-${reducedMotion}-start.png`});
  await page.locator('#play').click();await page.clock.runFor(500);await page.screenshot({path:`test-results/polish/ui/${name}-${width}-${reducedMotion}-hud.png`});
  await page.locator('#pause').click();const before=await page.locator('#world').evaluate(c=>c.toDataURL());await page.clock.runFor(1000);assert.equal(await page.locator('#world').evaluate(c=>c.toDataURL()),before,'pause freezes canvas');
  if(width===320){
   await page.locator('#resume').click();await page.keyboard.down('Space');await page.clock.runFor(6500);
   assert.ok(await page.locator('#air').evaluate(e=>e.classList.contains('low-air')));
   assert.equal(await page.locator('#toast').textContent().then(t=>t.includes('Luft wird knapp')),false);
   await page.screenshot({path:`test-results/polish/ui/${name}-low-air-${reducedMotion}.png`});
   await page.locator('#pause').click();const shadow=await page.locator('#air').evaluate(e=>e.style.boxShadow);await page.clock.runFor(500);assert.equal(await page.locator('#air').evaluate(e=>e.style.boxShadow),shadow);await page.keyboard.up('Space');
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();console.log(name+': 3 mobile sizes, reduced motion, button bounds, pause passed');
}

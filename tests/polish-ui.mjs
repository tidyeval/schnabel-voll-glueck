import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results/polish/ui',{recursive:true});
for (const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
 const browser=await engine.launch();
 for(const [width,height] of [[320,568],[390,844],[430,932]]) for(const reducedMotion of ['reduce','no-preference']) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(process.env.PELICAN_URL||'http://localhost:4173');await page.locator('#play').waitFor();await page.clock.runFor(3100);
  assert.equal(await page.locator('#play-label').innerText(),'Los gehts!');
  assert.equal(await page.locator('.control-hint').count(),0);
  for(const selector of ['#play','#settings','#stages','#stage-prev','#stage-next','#install','#update']) {if(!await page.locator(selector).isVisible())continue;const r=await page.locator(selector).boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height,selector+' fits');}
  await page.screenshot({path:`test-results/polish/ui/${name}-${width}-${reducedMotion}-start.png`});
  await page.locator('#play').click();await page.clock.runFor(500);await page.screenshot({path:`test-results/polish/ui/${name}-${width}-${reducedMotion}-hud.png`});
  await page.locator('#pause').click();const before=await page.locator('#world').evaluate(c=>c.toDataURL());await page.clock.runFor(1000);assert.equal(await page.locator('#world').evaluate(c=>c.toDataURL()),before,'pause freezes canvas');
  if(width===390&&reducedMotion==='no-preference'){
   await page.locator('#world').evaluate(canvas=>{const context=canvas.getContext('2d'),clear=context.clearRect.bind(context);window.pausedClears=0;context.clearRect=(...args)=>{window.pausedClears++;return clear(...args);};});
   await page.clock.runFor(1000);assert.equal(await page.evaluate(()=>window.pausedClears),0,'unchanged pause skips full redraws');
   await page.setViewportSize({width,height:height-1});await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.clock.runFor(20);assert.equal(await page.evaluate(()=>window.pausedClears),1,'paused resize redraws once');
   assert.notEqual(await page.locator('#world').evaluate(c=>c.toDataURL()),'','paused resize keeps a rendered scene');
  }
  if(width===320){
   await page.locator('#resume').click();await page.keyboard.down('Space');await page.clock.runFor(6500);
   assert.ok(await page.locator('#air').evaluate(e=>e.classList.contains('low-air')));
   assert.equal(await page.locator('#combo').count(),0,'combo badge is absent');
   // Minimal HUD: one line with score and time, a thin energy line below it; air is drawn at Pip.
   const energy=await page.locator('.energy-track').boundingBox();const score=await page.locator('.score-row').boundingBox();assert.ok(energy.x>=0&&energy.x+energy.width<=width&&energy.height<=8,'energy line stays thin');
   assert.ok(score.y+score.height<=energy.y,`score and energy line do not overlap: ${JSON.stringify({score,energy})}`);
   assert.equal(await page.locator('#toast').textContent().then(t=>t.includes('Luft wird knapp')),false);
   await page.screenshot({path:`test-results/polish/ui/${name}-low-air-${reducedMotion}.png`});
   await page.locator('#pause').click();await page.keyboard.up('Space');const breath=Number.parseFloat(await page.locator('#air-value').textContent());await page.locator('#resume').click();await page.clock.runFor(200);assert.ok(Math.abs(Number.parseFloat(await page.locator('#air-value').textContent())-breath)<.4,'resume does not skip warning');
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();console.log(name+': 3 mobile sizes, reduced motion, button bounds, pause passed');
}

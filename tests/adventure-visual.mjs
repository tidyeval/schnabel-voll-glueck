import { chromium, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='test-results/adventure';await mkdir(out,{recursive:true});
const cases=[['Knappe Luft',0,'Entspannt'],['Knappe Luft',4.9,'Knappe Luft'],['Luftnot',6.2,'Dringend · weiterhin gehalten'],['Knappe Luft',7.55,'Luftholen'],['Knappe Luft',8.2,'Erleichtert'],['Pip',0,'Blick zum Fisch'],['Pip',.7,'Fang'],['Pip',2.3,'Auftauchen'],['Füttern',.5,'Ankunft'],['Füttern',2,'Füttern'],['Füttern',3.4,'Satt'],['Kugelfisch',0,'Ruhig'],['Kugelfisch',.2,'Erschrecken'],['Kugelfisch',.8,'Aufblasen'],['Kugelfisch',1.5,'Aufgeblasen'],['Kugelfisch',2.6,'Abschwellen'],['Kugelfisch',3.5,'Verlegen'],['Tiere',.4,'Schildkröte'],['Tiere',1,'Hai spannt an'],['Tiere',2.2,'Hai erholt sich'],['Menschen',2.7,'Fischer Fehlwurf'],['Menschen',4.4,'Surfer winkt']];
for(const outfit of ['classic','flower','sailor'])for(const reduced of [false,true])cases.push(['Knappe Luft',5.3,`Luftnot + Fang · ${outfit}${reduced?' · ruhig':''}`,outfit,reduced]);
const evidence={};
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch();const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PELICAN_DEV_URL?`${process.env.PELICAN_DEV_URL}/tests/polish.html`:'http://localhost:5175/tests/polish.html');await page.waitForFunction(()=>window.paintPreview);await page.locator('#pause').click();
 evidence[name]=await page.evaluate(cases=>{
  const canvas=document.querySelector('canvas'),sheet=document.createElement('canvas');sheet.width=1170;sheet.height=Math.ceil(cases.length/6)*780;const c=sheet.getContext('2d');c.fillStyle='#fff5df';c.fillRect(0,0,sheet.width,sheet.height);
  const states=[];
  cases.forEach(([scene,time,label,outfit='classic',reduced=false],i)=>{
   const state=window.paintPreview(scene,time,outfit,reduced);states.push({scene,time,label,outfit,reduced,...state});
   const dx=(i%3)*390,dy=Math.floor(i/3)*390;
   c.fillStyle='#285652';c.font='15px system-ui';c.fillText(label,dx+12,dy+23);
   // World units at actual 390px phone scale, cropped vertically only.
   const sy=scene==='Kugelfisch'?520:['Knappe Luft','Luftnot'].includes(scene)?Math.max(0,state.y-160):scene==='Tiere'?370:scene==='Menschen'||scene==='Füttern'?210:Math.max(0,state.y-170);
   c.drawImage(canvas,0,sy,480,340,dx,dy+34,390,338);
  });
  window.sheet=sheet;return states;
 },cases);
 await page.evaluate(()=>{document.querySelector('header').style.display='none';document.querySelector('p').style.display='none';document.querySelector('canvas').style.display='none';window.sheet.style.width='1170px';window.sheet.style.height='auto';window.sheet.style.margin='0';document.body.append(window.sheet);});await page.setViewportSize({width:1170,height:Math.ceil(cases.length/6)*780});await page.screenshot({path:`${out}/${name}-reactions.png`,fullPage:true});
 for(let part=0;part<Math.ceil(cases.length/6);part++)await page.screenshot({path:`${out}/${name}-reactions-${part}.png`,clip:{x:0,y:part*780,width:1170,height:780}});
 assert.deepEqual(errors,[]);await browser.close();
}
await writeFile(`${out}/visual-states.json`,JSON.stringify(evidence,null,2));console.log('Both browsers: event-driven reaction contact sheets captured without HUD/audio');

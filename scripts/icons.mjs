import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const svg = (await readFile('public/icon.svg', 'utf8')).replace('rx="112"', 'rx="0"');
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [size, files] of [
  [192, ['public/icon-192.png']], [512, ['public/icon-512.png']],
  [1024, ['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png']],
  ...[['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]].map(([density, size]) => [size, ['ic_launcher','ic_launcher_round','ic_launcher_foreground'].map(name => `android/app/src/main/res/mipmap-${density}/${name}.png`)]),
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:#ccece0}svg{width:100%;height:100%}</style>${svg}`);
  const png = await page.screenshot();
  for (const file of files) await writeFile(file, png);
}
await browser.close();

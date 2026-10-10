import { readFile } from 'node:fs/promises';
import { firefox } from '@playwright/test';
const browser = await firefox.launch();
for (const [name, width, height] of [['desktop',1440,1000], ['mobile',390,844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto('http://127.0.0.1:4173/demo/index.html');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(()=>![...document.querySelectorAll('.bm-project-results')].some(node=>node.textContent.includes('Loading')));
  await page.screenshot({path:`.impeccable/review/${name}.png`, fullPage:true});
  console.log(name, await page.evaluate(() => ({viewport:innerWidth,width:document.documentElement.scrollWidth,font:getComputedStyle(document.querySelector('h1')).fontSize})));
  await page.goto('http://127.0.0.1:4173/demo/legacy.html');
  await page.waitForFunction(()=>![...document.querySelectorAll('.bm-project-results')].some(node=>node.textContent.includes('Loading')));
  await page.screenshot({path:`.impeccable/review/legacy-${name}.png`,fullPage:true});
  await page.goto('http://127.0.0.1:4173/demo/results.html');
  await page.screenshot({path:`.impeccable/review/results-${name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Switch to dark theme'}).click();
  await page.screenshot({path:`.impeccable/review/dark-${name}.png`,fullPage:true});
  await page.goto('http://127.0.0.1:4173/demo/submit.html');
  await page.screenshot({path:`.impeccable/review/upload-${name}.png`,fullPage:true});
  await page.close();
}
const popup = await browser.newPage({viewport:{width:340,height:470}});
await popup.addInitScript(await readFile('demo/demo.js','utf8'));
await popup.goto('http://127.0.0.1:4173/extension/popup/popup.html');
await popup.screenshot({path:'.impeccable/review/popup.png',fullPage:true});
await popup.getByLabel('Appearance').selectOption('dark');
await popup.screenshot({path:'.impeccable/review/popup-dark.png',fullPage:true});
await browser.close();

// One-time raster export of our existing SVG mark; requires Playwright Chromium.
import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const svg=await readFile(new URL('../extension/icons/icon.svg',import.meta.url),'utf8');
const browser=await chromium.launch();
for(const size of [16,32,48,128]) {
 const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 await page.setContent(`<style>body{margin:0}svg{width:100vw;height:100vh;display:block}</style>${svg}`);
 await page.screenshot({path:new URL(`../extension/icons/icon-${size}.png`,import.meta.url).pathname,omitBackground:true});
 await page.close();
}
await browser.close();

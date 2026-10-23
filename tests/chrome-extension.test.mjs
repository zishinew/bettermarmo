import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

test('Chrome loads the unpacked build and real popup settings update live content', async () => {
 const extension = resolve('dist/chrome');
 const manifest=JSON.parse(await readFile(join(extension,'manifest.json'),'utf8'));
 assert.equal(manifest.browser_specific_settings,undefined);
 assert.equal(manifest.minimum_chrome_version,'120');
 assert.deepEqual(manifest.host_permissions,['https://marmoset.student.cs.uwaterloo.ca/*']);
 for(const size of [16,32,48,128]) {
  const bytes=await readFile(join(extension,manifest.icons[size]));
  assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
 }
 for(const file of [...manifest.content_scripts[0].js,...manifest.content_scripts[0].css,manifest.action.default_popup,'popup/popup.js']) {
  assert.deepEqual(await readFile(join(extension,file)),await readFile(join('extension',file)));
 }
 const profile=await mkdtemp(join(tmpdir(),'bettermarmo-chrome-'));
 let context;
 try {
  context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
  const errors=[];
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  const manager=await context.newPage();
  await manager.goto('chrome://extensions');
  const card=manager.locator('extensions-item').filter({hasText:'BetterMarmo'});
  await card.waitFor();
  const id=await card.getAttribute('id');
  assert.match(id,/^[a-p]{32}$/);
  // Serve representative Marmoset HTML at the real match URL, without a demo API shim.
  await context.route('https://marmoset.student.cs.uwaterloo.ca/**',async route=>{
   let html=await readFile('demo/courses.html','utf8');
   html=html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<link rel="stylesheet"[^>]*>/g,'');
   await route.fulfill({contentType:'text/html',body:html});
  });
  const course=await context.newPage();
  await course.goto('https://marmoset.student.cs.uwaterloo.ca/view/index.jsp');
  await course.locator('.bm-course-list').waitFor();
  assert.equal(await course.locator('.bm-course-code').count(),4);
  const popup=await context.newPage();
  await popup.goto(`chrome-extension://${id}/popup/popup.html`);
  await popup.getByLabel('Appearance').selectOption('dark');
  await course.waitForFunction(()=>document.documentElement.dataset.bmTheme==='dark');
  await popup.getByLabel('Redesign Marmoset').uncheck();
  await course.waitForFunction(()=>!document.documentElement.classList.contains('bm-enabled'));
  await popup.getByLabel('Redesign Marmoset').check();
  await course.waitForFunction(()=>document.documentElement.classList.contains('bm-enabled'));
  await popup.reload();
  assert.equal(await popup.getByLabel('Appearance').inputValue(),'dark');
  assert.equal(await popup.getByLabel('Redesign Marmoset').isChecked(),true);
  assert.deepEqual(errors,[]);
 } finally {
  await context?.close();
  await rm(profile,{recursive:true,force:true});
 }
});

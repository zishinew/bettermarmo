import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { firefox } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { resolve, extname } from 'node:path';
let browser, server, base;
before(async () => {
  server = http.createServer(async (req, res) => {
    const path = resolve(`.${new URL(req.url, 'http://localhost').pathname}`);
    try {
      res.setHeader('Content-Type', { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' }[extname(path)] || 'application/octet-stream');
      res.end(await readFile(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0,'127.0.0.1',done));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await firefox.launch();
});
after(async () => { await browser?.close(); await new Promise(done => server.close(done)); });
async function pageAt(path, options = {}) {
  const page = await browser.newPage(options);
  await page.goto(`${base}/demo/${path}`);
  await page.locator('html.bm-enabled').waitFor();
  return page;
}
test('search, empty state, and numeric-aware sorting work without replacing links', async () => {
  const page = await pageAt('index.html');
  const links = await page.locator('table a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  const search = page.getByRole('searchbox');
  await search.fill('a3');
  assert.equal(await page.locator('table tr:not([hidden])').count(),3);
  await search.fill('nonexistent');
  assert.equal(await page.locator('.bm-empty').isVisible(),true);
  await search.fill('');
  await page.getByRole('button', { name:'Sort by Project', exact:true }).click();
  await page.getByRole('button', { name:'Sort by Project', exact:true }).click();
  assert.equal(await page.locator('table tr').nth(1).locator('td').first().textContent(),'a4q1');
  assert.deepEqual((await page.locator('table a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).sort(),links.sort());
  await page.close();
});
test('result filters combine with search; disabling restores all original rows', async () => {
  const page = await pageAt('results.html');
  await page.getByLabel('Failures only').check();
  assert.equal(await page.locator('table tr:not([hidden])').count(),3);
  await page.getByRole('searchbox').fill('move');
  assert.equal(await page.locator('table tr:not([hidden])').count(),2);
  await page.evaluate(() => browser.storage.local.set({settings:{enabled:false,theme:'system',compact:false}}));
  assert.equal(await page.locator('table tr:not([hidden])').count(),7);
  assert.equal(await page.locator('#bm-topbar').isVisible(),false);
  assert.equal(await page.locator('.bm-original-label').first().isVisible(),true);
  await page.close();
});
test('upload form, hidden inputs and server action retain their original semantics', async () => {
  const page = await pageAt('submit.html');
  assert.equal(await page.locator('form').getAttribute('action'),'/action/SubmitProjectViaWeb');
  assert.equal(await page.locator('form').getAttribute('method'),'POST');
  assert.equal(await page.locator('form').getAttribute('enctype'),'multipart/form-data');
  assert.equal(await page.locator('input[name="projectPK"]').inputValue(),'123');
  assert.equal(await page.locator('input[name="submitClientTool"]').inputValue(),'web');
  assert.equal(await page.locator('input[type="file"]').getAttribute('name'),'file');
  assert.equal(await page.locator('.bm-table-tools').count(),0);
  await page.locator('input[type="file"]').setInputFiles({name:'solution.cpp',mimeType:'text/plain',buffer:Buffer.from('int main() {}')});
  assert.equal(await page.locator('input[type="file"]').evaluate(input=>input.files[0].name),'solution.cpp');
  await page.close();
});
test('irregular submission rows stay visible and are not offered unsafe sorting', async () => {
  const page = await pageAt('project.html');
  assert.equal(await page.locator('.bm-sort').count(),0);
  await page.getByRole('searchbox').fill('no match');
  assert.equal(await page.locator('td[colspan="2"]').isVisible(),true);
  await page.close();
});
test('new rows are enhanced without duplicating controls; original hidden rows stay hidden', async () => {
  const page = await pageAt('results.html');
  await page.evaluate(() => {
    const row = document.querySelector('table').insertRow();
    ['public','7','failed','1','new_case','wrong output'].forEach(value=>row.insertCell().textContent=value);
  });
  await page.waitForFunction(()=>document.querySelectorAll('.bm-fail').length===3);
  assert.equal(await page.locator('.bm-table-tools').count(),1);
  await page.getByLabel('Failures only').check();
  assert.equal(await page.locator('table tr:not([hidden])').count(),4);
  await page.close();
});
test('mobile content stays within the viewport and tables scroll independently', async () => {
  const page = await pageAt('results.html',{viewport:{width:390,height:844}});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('.bm-table-scroll').evaluate(node=>node.scrollWidth>node.clientWidth),true);
  await page.getByRole('button',{name:'Switch to dark theme'}).click();
  assert.equal(await page.locator('html').getAttribute('data-bm-theme'),'dark');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-bm-theme'),'dark');
  await page.close();
});
test('ambiguous cross-month deadlines retain server order and cannot be text-sorted', async () => {
  const page = await pageAt('index.html');
  assert.equal(await page.getByRole('button', {name:'Sort by Due',exact:true}).count(),0);
  const dates=await page.locator('table tr td:nth-child(4)').allTextContents();
  assert.equal(dates[0],'18 Sep, 11:59 PM');
  assert.equal(dates[2],'02 Oct, 11:59 PM');
  await page.close();
});
test('scope is restricted to Waterloo Marmoset and packaged resources exist',async()=>{
  const manifest=JSON.parse(await readFile('extension/manifest.json','utf8'));
  assert.deepEqual(manifest.host_permissions,['https://marmoset.student.cs.uwaterloo.ca/*']);
  assert.deepEqual(manifest.permissions,['storage']);
  assert.equal(manifest.browser_specific_settings.gecko.data_collection_permissions.required[0],'none');
  for (const file of [...manifest.content_scripts[0].js,...manifest.content_scripts[0].css,manifest.action.default_popup,manifest.icons['48']]) assert.ok((await readFile(`extension/${file}`)).length);
});

test('legacy paragraph and fixed-width parents release full width without cutting off desktop columns', async () => {
  for (const width of [1024, 1440, 2048]) {
    const page = await pageAt('legacy.html', {viewport:{width,height:1000}});
    assert.equal(await page.evaluate(()=>document.compatMode),'BackCompat');
    assert.equal(await page.getByRole('searchbox').getAttribute('aria-label'),'Search Projects');
    const geometry = await page.locator('.bm-table-scroll').evaluate(node => ({width:node.clientWidth, scroll:node.scrollWidth, body:document.body.clientWidth, last:node.querySelector('tr:last-child td:last-child').getBoundingClientRect().right, right:node.getBoundingClientRect().right}));
    assert.ok(geometry.width > Math.min(width,1680)-110, JSON.stringify(geometry));
    assert.ok(geometry.scroll <= geometry.width+1, JSON.stringify(geometry));
    assert.ok(geometry.last <= geometry.right+1, JSON.stringify(geometry));
    const logout=await page.locator('.logout a').evaluate(node=>getComputedStyle(node).color);
    assert.equal(logout,'rgb(23, 23, 23)');
    await page.close();
  }
});
test('long-name project tables show every field on mobile without sideways clipping', async () => {
  const page=await pageAt('legacy.html',{viewport:{width:390,height:844}});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const cells=await page.locator('table td').evaluateAll(nodes=>nodes.map(node=>({left:node.getBoundingClientRect().left,right:node.getBoundingClientRect().right,width:node.getBoundingClientRect().width,label:node.dataset.bmLabel})));
  assert.ok(cells.every(cell=>cell.left>=0 && cell.right<=390 && cell.width>0 && cell.label));
  assert.equal(await page.locator('.bm-table-scroll').evaluate(node=>node.scrollWidth<=node.clientWidth+1),true);
  await page.close();
});

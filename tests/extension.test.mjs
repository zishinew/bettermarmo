import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { firefox, chromium } from '@playwright/test';
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
  browser = await (process.env.BETTERMARMO_BROWSER === 'chromium' ? chromium : firefox).launch();
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

test('project list loads latest results, empty and pending histories, and inline case details', async () => {
  const page=await pageAt('index.html');
  await page.waitForFunction(()=>![...document.querySelectorAll('.bm-project-results')].some(node=>node.textContent.includes('Loading')));
  const summaries=await page.locator('.bm-project-results').allTextContents();
  assert.match(summaries[0],/Submission #3.*Public: 8 \/ 8 passed/);
  assert.match(summaries[1],/Submission #2.*Public: 3 \/ 5 passed/);
  assert.equal(summaries[2],'Not submitted');
  assert.match(summaries[3],/Did not compile/);
  assert.match(summaries[4],/Testing pending/);
  await page.locator('.bm-project-results').first().locator('summary').click();
  assert.equal(await page.locator('.bm-project-results').first().locator('li').count(),8);
  assert.equal(await page.locator('.bm-project-results').first().locator('.bm-case-list').getByText('copy_constructor',{exact:true}).isVisible(),true);
  await page.close();
});
test('login/unrecognized history shows an error instead of Not submitted, and retry recovers', async () => {
  const page=await browser.newPage();
  let authorized=false;
  await page.route('**/demo/project-empty.html',async route=>route.fulfill({status:200,contentType:'text/html',body:authorized ? '<table><tr><th>#</th><th>Submitted</th></tr></table>' : '<h1>Sign in</h1><form><input type="password"></form>'}));
  await page.goto(`${base}/demo/index.html`);
  const panel=page.locator('tr').filter({has:page.locator('td:first-child', {hasText:'a2q1'})}).locator('.bm-project-results');
  await panel.getByText('Couldn’t load results').waitFor();
  assert.doesNotMatch(await panel.textContent(),/Not submitted/);
  authorized=true;
  await panel.getByRole('button',{name:'Retry'}).click();
  await panel.getByText('Not submitted',{exact:true}).waitFor();
  await page.close();
});
test('weighted scores remain scores when case details fail; they are never called test counts', async () => {
  const page=await browser.newPage();
  await page.route('**/demo/results.html',route=>route.fulfill({status:503,contentType:'text/html',body:'Unavailable'}));
  await page.goto(`${base}/demo/index.html`);
  const panel=page.locator('.bm-project-results').nth(1);
  await panel.getByText('Public: 6 / 8 score',{exact:true}).waitFor();
  assert.doesNotMatch(await panel.textContent(),/6 \/ 8 passed/);
  assert.match(await panel.textContent(),/Test cases unavailable/);
  await page.close();
});
test('disabled redesign makes no history requests; refresh deduplicates projects and limits parallel reads', async () => {
  const page=await browser.newPage();
  await page.addInitScript(()=>localStorage.setItem('bm-demo-settings',JSON.stringify({enabled:false,theme:'light',compact:false})));
  let active=0,maxActive=0,historyReads=0;
  await page.route(/\/demo\/(project|results)[^/]*\.html/,async route=>{
    active++;maxActive=Math.max(maxActive,active);
    if(new URL(route.request().url()).pathname==='/demo/project.html')historyReads++;
    await new Promise(done=>setTimeout(done,30));
    const response=await route.fetch();
    await route.fulfill({response});
    active--;
  });
  await page.goto(`${base}/demo/index.html`);
  assert.equal(historyReads,0);
  await page.evaluate(()=>browser.storage.local.set({settings:{enabled:true,theme:'light',compact:false}}));
  const refresh=page.getByRole('button',{name:'Refresh results'});
  await page.waitForFunction(()=>{const b=document.querySelector('.bm-refresh-results');return b && !b.disabled;});
  assert.equal(historyReads,1);
  assert.ok(maxActive<=3,`Parallel reads: ${maxActive}`);
  await refresh.click();
  await page.waitForFunction(()=>!document.querySelector('.bm-refresh-results').disabled);
  assert.equal(historyReads,2);
  await page.close();
});
test('latest submission is chosen by number and fetch adapters reject action/external URLs',async()=>{
  const page=await pageAt('index.html');
  const result=await page.evaluate(()=>{
    const html='<table><tr><th>#</th><th>Submitted</th><th>Public tests score</th><th>Detailed test results</th></tr><tr><td>2</td><td>date</td><td>6 / 10</td><td><a href="/view/submission.jsp?submissionPK=2">view</a></td></tr><tr><td>11</td><td>date</td><td>40 / 50</td><td><a href="/view/submission.jsp?submissionPK=11">view</a></td></tr></table>';
    const parsed=BetterMarmoResults.parseProject(html,location.origin+'/view/project.jsp?projectPK=1');
    return {number:parsed.number,unit:parsed.groups[0].unit,external:BetterMarmoResults.allowedURL(new URL('https://example.com/view/project.jsp'),'project'),action:BetterMarmoResults.allowedURL(new URL(location.origin+'/action/RequestReleaseTest'),'submission')};
  });
  assert.equal(result.number,11);assert.equal(result.unit,'score');assert.equal(result.external,false);assert.equal(result.action,false);
  await page.close();
});
test('entry pages preserve original navigation, adapt on phones and restore when disabled', async () => {
  for (const route of ['login.html', 'courses.html']) {
    const page = await pageAt(route, {viewport:{width:390,height:844}, reducedMotion:'reduce'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('.bm-table-tools').count(), 0);
    if (route === 'login.html') {
      assert.equal(await page.locator('.bm-account-action').getAttribute('href'), 'courses.html');
      assert.equal(await page.getByRole('heading',{name:'Continue to Marmoset'}).isVisible(), true);
      assert.equal(await page.locator('.bm-account-action').innerText(), 'Continue');
      assert.equal(await page.locator('.bm-account-table').evaluate(n=>getComputedStyle(n).animationName), 'bm-entry-fade');
    } else {
      assert.equal(await page.locator('.bm-course-list a').count(), 4);
      assert.equal(await page.locator('.bm-course-code').first().innerText(), 'CS136L');
      assert.equal(await page.locator('.bm-course-term').first().innerText(), 'Winter 2026');
    }
    const archives = await page.locator('.bm-archive-row a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
    assert.equal(archives.length,4);
    await page.evaluate(()=>browser.storage.local.set({settings:{enabled:false,theme:'system',compact:false}}));
    assert.equal(await page.locator('.bm-archive-title').isVisible(), false);
    if (route === 'login.html') assert.equal(await page.locator('.bm-account-action').innerText(),'as');
    else assert.equal(await page.locator('.bm-course-list a').first().innerText(),'CS136L (Winter 2026):');
    assert.deepEqual(await page.locator('.bm-archive-row a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))),archives);
    await page.close();
  }
});
test('course emphasis follows Toronto term boundaries and year without changing links or order', async () => {
  for (const [instant, expected] of [
    ['2026-01-01T05:00:00Z','Winter 2026'], ['2026-05-01T03:59:59Z','Winter 2026'],
    ['2026-05-01T04:00:00Z','Spring 2026'], ['2026-09-01T03:59:59Z','Spring 2026'],
    ['2026-09-01T04:00:00Z','Fall 2026'], ['2026-10-11T16:00:00Z','Fall 2026'],
    ['2027-01-01T04:59:59Z','Fall 2026'], ['2027-01-01T05:00:00Z',null]
  ]) {
    const page = await browser.newPage({timezoneId:'Asia/Tokyo'});
    await page.clock.install({time: new Date(instant)});
    await page.goto(`${base}/demo/courses.html`);
    await page.locator('.bm-course-list').waitFor();
    const terms = await page.locator('.bm-current-course .bm-course-term').allTextContents();
    assert.deepEqual(terms, expected === 'Winter 2026' ? [expected,expected] : expected ? [expected] : []);
    assert.equal(await page.locator('.bm-course-current').count(),terms.length);
    assert.equal(await page.locator('.bm-other-course').count(),4-terms.length);
    assert.deepEqual(await page.locator('.bm-course-code').allTextContents(),['CS136L','CS136','CS136','CS136']);
    assert.deepEqual(await page.locator('.bm-course-list a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))),Array(4).fill('index.html'));
    await page.evaluate(()=>browser.storage.local.set({settings:{enabled:false,theme:'system',compact:false}}));
    assert.equal(await page.locator('.bm-course-current:visible').count(),0);
    await page.close();
  }
});
test('chrome-only API namespace loads stored settings and receives live changes', async () => {
 const page=await browser.newPage();
 await page.route('**/demo.js',async route=>{
  const shim=(await readFile('demo/demo.js','utf8')).replace('window.browser =','window.chrome =');
  await route.fulfill({contentType:'text/javascript',body:shim});
 });
 await page.goto(`${base}/demo/courses.html`);
 await page.locator('.bm-course-list').waitFor();
 await page.evaluate(()=>chrome.storage.local.set({settings:{enabled:true,theme:'dark',compact:true}}));
 await page.waitForFunction(()=>document.documentElement.dataset.bmTheme==='dark' && document.documentElement.classList.contains('bm-compact'));
 await page.reload();
 await page.waitForFunction(()=>document.documentElement.dataset.bmTheme==='dark');
 await page.evaluate(()=>chrome.storage.local.set({settings:{enabled:false,theme:'dark',compact:true}}));
 await page.waitForFunction(()=>!document.documentElement.classList.contains('bm-enabled'));
 await page.close();
});
test('legacy red link rules cannot leak into monochrome courses or invert action text', async () => {
 const page=await browser.newPage();
 await page.clock.install({time:new Date('2026-10-23T16:00:00Z')});
 await page.goto(`${base}/demo/courses.html`);
 await page.locator('.bm-course-list').waitFor();
 await page.addStyleTag({content:'a:link {color:#cc0000} a:visited {color:#aa0000} div.breadcrumb a:link {color:white}'});
 for(const [theme,current,other] of [['light','rgb(23, 23, 23)','rgb(102, 102, 102)'],['dark','rgb(245, 245, 245)','rgb(163, 163, 163)']]) {
  await page.evaluate(theme=>browser.storage.local.set({settings:{enabled:true,theme,compact:false}}),theme);
  assert.equal(await page.locator('.bm-course-list a').last().evaluate(n=>getComputedStyle(n).color),current);
  assert.equal(await page.locator('.bm-course-code').last().evaluate(n=>getComputedStyle(n).color),current);
  assert.equal(await page.locator('.bm-course-list a').first().evaluate(n=>getComputedStyle(n).color),other);
 }
 await page.evaluate(()=>browser.storage.local.set({settings:{enabled:false,theme:'light',compact:false}}));
 assert.equal(await page.locator('.bm-course-list a').last().evaluate(n=>getComputedStyle(n).color),'rgb(204, 0, 0)');
 await page.close();
 const projects=await pageAt('index.html');
 await projects.addStyleTag({content:'a:link{color:#cc0000}a:visited{color:#aa0000}div.breadcrumb a:link{color:white}'});
 await projects.evaluate(()=>browser.storage.local.set({settings:{enabled:true,theme:'light',compact:false}}));
 assert.equal(await projects.locator('.breadcrumb a').evaluate(n=>getComputedStyle(n).color),'rgb(23, 23, 23)');
 assert.equal(await projects.locator('.bm-submit-link').first().evaluate(n=>getComputedStyle(n).color),'rgb(255, 255, 255)');
 await projects.close();
});

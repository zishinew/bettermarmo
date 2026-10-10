/* Read-only adapters. Fractions labelled "score" are never treated as case counts. */
(() => {
  'use strict';
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const text = node => normalize(node?.textContent || '');
  function expand(row) {
    return [...row.cells].flatMap(cell => Array.from({ length: cell.colSpan || 1 }, () => cell));
  }
  function tableWith(doc, predicate) {
    for (const table of doc.querySelectorAll('table')) {
      const header = [...table.rows].find(row => row.querySelector('th'));
      if (!header) continue;
      const labels = expand(header).map(cell => text(cell).toLowerCase());
      if (predicate(labels)) return { table, header, labels };
    }
    return null;
  }
  function hrefIn(cell, base, kind) {
    for (const link of cell?.querySelectorAll('a[href]') || []) {
      const url = new URL(link.getAttribute('href'), base);
      if (allowedURL(url, kind, new URL(base))) return url.href;
    }
    return null;
  }
  function allowedURL(url, kind, base = new URL(location.href)) {
    if (url.origin !== base.origin || url.username || url.password) return false;
    if (kind === 'project' && /\/view\/project\.jsp$/.test(url.pathname)) return true;
    if (kind === 'submission' && /\/view\/submission(?:AllTests)?\.jsp$/.test(url.pathname)) return true;
    // Local fixtures are never matched by the extension manifest.
    if (['127.0.0.1', 'localhost'].includes(base.hostname)) {
      return kind === 'project' ? /^\/demo\/project(?:-[a-z]+)?\.html$/.test(url.pathname) : /^\/demo\/results(?:-[a-z]+)?\.html$/.test(url.pathname);
    }
    return false;
  }
  function parseProject(html, base) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const found = tableWith(doc, labels => labels.some(label => /^(#|submission(?:\s*(?:#|number))?)$/.test(label)) && labels.some(label => /submitted|submission time/.test(label)));
    if (!found) throw new Error('Submission history was not available.');
    const numberIndex = found.labels.findIndex(label => /^(#|submission(?:\s*(?:#|number))?)$/.test(label));
    const rows = [...found.table.rows].filter(row => row !== found.header && !row.querySelector('th'));
    const submissions = rows.map(row => ({ row, cells: expand(row), number: Number(text(expand(row)[numberIndex])) }))
      .filter(item => /^\d+$/.test(text(item.cells[numberIndex])));
    if (!submissions.length) {
      if (rows.some(row => text(row) && !/no submissions|not submitted/i.test(text(row)))) throw new Error('Unrecognized submission history.');
      return { status: 'empty' };
    }
    const latest = submissions.reduce((a, b) => a.number > b.number ? a : b);
    const summary = { status: 'submitted', number: latest.number, groups: [], cases: [], detailURL: null };
    const rowText = text(latest.row).toLowerCase();
    if (/did not compile|compile.*unsuccessful|compilation failed/.test(rowText)) summary.status = 'compile-error';
    else if (/not tested yet|queued|building|pending|testing in progress/.test(rowText)) summary.status = 'pending';
    const detailsIndex = found.labels.findIndex(label => /detailed.*test|details|test results/.test(label));
    summary.detailURL = hrefIn(latest.cells[detailsIndex], base, 'submission');
    if (!summary.detailURL) summary.detailURL = hrefIn(latest.row, base, 'submission');
    for (const [index, label] of found.labels.entries()) {
      if (!/public tests|release tests|secret tests|student tests/.test(label)) continue;
      const value = text(latest.cells[index]);
      const fraction = value.match(/^(\d+)\s*\/\s*(\d+)$/);
      const kind = label.match(/public|release|secret|student/)[0];
      if (fraction) summary.groups.push({ kind, passed: Number(fraction[1]), total: Number(fraction[2]), unit: /score|points/.test(label) ? 'score' : 'tests' });
    }
    return summary;
  }
  function parseResults(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const found = tableWith(doc, labels => labels.some(label => /outcome|status/.test(label)) && labels.some(label => /test.*#|test.*number|name/.test(label)));
    if (!found) return null;
    const typeIndex = found.labels.findIndex(label => /^(type|test type)$/.test(label));
    const outcomeIndex = found.labels.findIndex(label => /outcome|status/.test(label));
    const nameIndex = found.labels.findIndex(label => /^(name|test name)$/.test(label));
    const numberIndex = found.labels.findIndex(label => /test.*#|test.*number/.test(label));
    const cases = [];
    for (const row of found.table.rows) {
      if (row === found.header || row.querySelector('th')) continue;
      const cells = expand(row);
      const outcome = text(cells[outcomeIndex]).toLowerCase();
      if (!/^(passed|pass|correct|failed|fail|wrong|error|crashed|timeout|could[_ ]not[_ ]run|not[_ ]implemented)$/.test(outcome)) continue;
      const type = text(cells[typeIndex]).toLowerCase();
      const kind = /public|release|secret|student/.exec(type)?.[0] || 'visible';
      const name = text(cells[nameIndex]);
      const number = text(cells[numberIndex]);
      cases.push({ kind, name: name && name !== '?' ? name : (number && number !== '?' ? `Test ${number}` : 'Unnamed test'), outcome, passed: /^(passed|pass|correct)$/.test(outcome) });
    }
    const groups = [...new Set(cases.map(item => item.kind))].map(kind => {
      const items = cases.filter(item => item.kind === kind);
      return { kind, passed: items.filter(item => item.passed).length, total: items.length, unit: 'tests' };
    });
    return { groups, cases };
  }
  globalThis.BetterMarmoResults = { allowedURL, parseProject, parseResults };
})();

/* BetterMarmo enhances the original DOM; it never submits or rewrites links. Results use read-only, same-origin GETs. */
(() => {
  'use strict';
  if (document.getElementById('bm-topbar')) return;
  const api = typeof browser !== 'undefined' ? browser : null;
  const defaults = { enabled: true, theme: 'system', compact: false };
  let settings = { ...defaults };
  const tables = new Map();
  const resultPanels = new Map();
  const pageCache = new Map();
  const readQueue = [];
  const activeReads = new Set();
  let settingsReady = !api;
  let readCount = 0;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const icons = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    moon: '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    arrow: '<path d="m9 5 7 7-7 7"/>'
  };
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    // Fixed, local icon strings only. No page or remote content is parsed as HTML.
    for (const match of (icons[name] || icons.grid).matchAll(/<(path|circle|rect)\s+([^>]+)\/>/g)) {
      const shape = document.createElementNS('http://www.w3.org/2000/svg', match[1]);
      for (const attr of match[2].matchAll(/([a-z]+)="([^"]*)"/g)) shape.setAttribute(attr[1], attr[2]);
      svg.append(shape);
    }
    return svg;
  }
  function isDark() { return settings.theme === 'dark' || (settings.theme === 'system' && media.matches); }
  function applySettings(next) {
    settings = { ...defaults, ...next };
    document.documentElement.classList.toggle('bm-enabled', settings.enabled);
    document.documentElement.dataset.bmTheme = isDark() ? 'dark' : 'light';
    document.documentElement.classList.toggle('bm-compact', settings.compact);
    const toggle = document.getElementById('bm-theme');
    if (toggle) {
      toggle.replaceChildren(icon(isDark() ? 'sun' : 'moon'), el('span', '', isDark() ? 'Light theme' : 'Dark theme'));
      toggle.setAttribute('aria-label', `Switch to ${isDark() ? 'light' : 'dark'} theme`);
    }
    if (!settings.enabled) activeReads.forEach(controller => controller.abort());
    if (settingsReady && settings.enabled) loadProjectResults();
    if (!settings.enabled) for (const state of tables.values()) {
      state.search.value = '';
      if (state.failures) state.failures.checked = false;
      filter(state);
    }
  }
  async function save(patch) {
    applySettings({ ...settings, ...patch });
    if (api) {
      try { await api.storage.local.set({ settings }); }
      catch { /* The current page still works if settings cannot be saved. */ }
    }
  }
  const topbar = el('header', 'bm-ui bm-topbar');
  topbar.id = 'bm-topbar';
  const brand = el('div', 'bm-brand');
  const mark = el('span', 'bm-mark', 'M');
  brand.append(mark, el('span', '', 'BetterMarmo'));
  const theme = el('button', 'bm-button bm-theme');
  theme.type = 'button';
  theme.id = 'bm-theme';
  theme.addEventListener('click', () => save({ theme: isDark() ? 'light' : 'dark' }));
  topbar.append(brand, theme);
  document.body.prepend(topbar);

  function drainReads() {
    while (readCount < 3 && readQueue.length) {
      const { url, resolve, reject } = readQueue.shift();
      if (!settings.enabled) { reject(new Error('Results paused.')); continue; }
      readCount++;
      const controller = new AbortController();
      activeReads.add(controller);
      const timer = setTimeout(() => controller.abort(), 12000);
      fetch(url, { credentials: 'same-origin', redirect: 'error', signal: controller.signal, cache: 'no-store' })
        .then(async response => {
          if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Results unavailable.');
          const html = await response.text();
          if (html.length > 2000000) throw new Error('Results page too large.');
          return html;
        }).then(resolve, reject).finally(() => {
          clearTimeout(timer);
          activeReads.delete(controller);
          readCount--;
          drainReads();
        });
    }
  }
  function readPage(url, kind) {
    if (!globalThis.BetterMarmoResults.allowedURL(new URL(url), kind)) return Promise.reject(new Error('Unsupported results link.'));
    if (!pageCache.has(url)) {
      const promise = new Promise((resolve, reject) => { readQueue.push({url, resolve, reject}); drainReads(); });
      pageCache.set(url, promise);
      promise.catch(() => { if (pageCache.get(url) === promise) pageCache.delete(url); });
    }
    return pageCache.get(url);
  }
  function paintResults(panel, result) {
    panel.node.replaceChildren();
    const labels = { empty: 'Not submitted', pending: 'Submitted · Testing pending', 'compile-error': 'Submitted · Did not compile' };
    if (labels[result.status]) panel.node.append(el('div', 'bm-result-status', labels[result.status]));
    else panel.node.append(el('div', 'bm-result-status', `Submission #${result.number}`));
    for (const group of result.groups || []) {
      const kind = group.kind === 'visible' ? 'Visible' : group.kind[0].toUpperCase() + group.kind.slice(1);
      const suffix = group.unit === 'score' ? 'score' : 'passed';
      panel.node.append(el('div', 'bm-result-count', `${kind}: ${group.passed} / ${group.total} ${suffix}`));
    }
    if (result.status === 'submitted' && !result.groups.length) panel.node.append(el('div', 'bm-result-note', 'Test results not available yet'));
    if (result.detailsUnavailable) panel.node.append(el('div', 'bm-result-note', 'Test cases unavailable · Open submission details'));
    if (result.cases?.length) {
      const preview = el('div', 'bm-case-preview');
      for (const item of result.cases.slice(0, 2)) {
        const entry = el('div', 'bm-case-preview-row');
        entry.append(el('span', 'bm-case-name', item.name), el('span', 'bm-case-outcome', item.outcome));
        preview.append(entry);
      }
      panel.node.append(preview);
      const details = el('details', 'bm-result-cases');
      details.append(el('summary', '', `${result.cases.length} available test cases`));
      const list = el('ul', 'bm-case-list');
      for (const item of result.cases) {
        const entry = el('li');
        entry.append(el('span', 'bm-case-name', item.name), el('span', 'bm-case-outcome', item.outcome));
        list.append(entry);
      }
      details.append(list);
      panel.node.append(details);
    }
    panel.loaded = true;
  }
  function attachProjectResults(state) {
    if (!state.projectTable || !globalThis.BetterMarmoResults) return;
    for (const row of dataRows(state)) {
      const cell = row.cells[1];
      if (resultPanels.has(cell)) continue;
      const link = [...cell.querySelectorAll('a[href]')].find(item => globalThis.BetterMarmoResults.allowedURL(new URL(item.href), 'project'));
      const node = el('div', 'bm-ui bm-project-results');
      node.append(el('span', 'bm-result-note', 'Loading results…'));
      cell.prepend(node);
      resultPanels.set(cell, {node, url: link?.href, loaded: false, loading: false});
    }
    if (!state.refresh) {
      const refresh = el('button', 'bm-ui bm-refresh-results', 'Refresh results');
      refresh.type = 'button';
      refresh.addEventListener('click', () => {
        pageCache.clear();
        resultPanels.forEach(panel => { panel.loaded = false; });
        loadProjectResults();
      });
      state.count.before(refresh);
      state.refresh = refresh;
    }
  }
  function loadProjectResults() {
    if (!settingsReady || !settings.enabled || !globalThis.BetterMarmoResults) return;
    for (const panel of resultPanels.values()) {
      if (panel.loaded || panel.loading || !panel.node.isConnected) continue;
      panel.loading = true;
      panel.node.replaceChildren(el('span', 'bm-result-note', 'Loading results…'));
      (async () => {
        if (!panel.url) throw new Error('No submission history link.');
        const html = await readPage(panel.url, 'project');
        const result = globalThis.BetterMarmoResults.parseProject(html, panel.url);
        if (result.status === 'submitted' && result.detailURL) {
          try {
            const detail = globalThis.BetterMarmoResults.parseResults(await readPage(result.detailURL, 'submission'));
            if (detail?.groups.length) {
              // Keep weighted scores only for groups whose actual cases are unavailable.
              result.groups = [...detail.groups, ...result.groups.filter(group => !detail.groups.some(item => item.kind === group.kind))];
              result.cases = detail.cases;
            } else result.detailsUnavailable = true;
          } catch { result.detailsUnavailable = true; }
        }
        if (settings.enabled) paintResults(panel, result);
      })().catch(() => {
        if (!settings.enabled) return;
        panel.loaded = true;
        panel.node.replaceChildren(el('div', 'bm-result-note', 'Couldn’t load results'));
        const retry = el('button', 'bm-result-retry', 'Retry');
        retry.type = 'button';
        retry.addEventListener('click', () => { panel.loaded = false; pageCache.clear(); loadProjectResults(); });
        panel.node.append(retry);
      }).finally(() => {
        panel.loading = false;
        for (const state of tables.values()) if (state.refresh) state.refresh.disabled = [...resultPanels.values()].some(item => item.loading);
      });
    }
    for (const state of tables.values()) if (state.refresh) state.refresh.disabled = [...resultPanels.values()].some(item => item.loading);
  }
  function headerRow(table) {
    return [...table.rows].find(row => [...row.cells].some(cell => cell.tagName === 'TH'));
  }
  function dataRows(state) {
    return [...state.table.rows].filter(row => row !== state.header &&
      !row.closest('thead, tfoot') && ![...row.cells].some(cell => cell.tagName === 'TH') &&
      row.cells.length === state.header.cells.length && [...row.cells].every(cell => cell.colSpan === 1 && cell.rowSpan === 1));
  }
  function statusKind(text) {
    const value = text.trim().toLowerCase();
    if (/^(passed|pass|correct|successful|success)$/.test(value)) return 'pass';
    if (/^(failed|fail|wrong|error|crashed|timeout|did not compile|compile\/build unsuccessful|could not run)$/.test(value)) return 'fail';
    if (/^(pending|queued|building|testing|not tested|not implemented|not_implemented|could_not_run|warning)$/.test(value)) return 'pending';
    return '';
  }
  function decorateRows(state) {
    const headers = [...state.header.cells].map(cell => cell.textContent.trim().toLowerCase());
    for (const row of dataRows(state)) {
      for (const [index, cell] of [...row.cells].entries()) {
        if (state.projectTable) cell.dataset.bmLabel = state.labels[index];
        cell.classList.remove('bm-pass', 'bm-fail', 'bm-pending');
        const kind = statusKind(cell.textContent);
        // Interpret outcome columns and existing semantic classes, never points or names.
        if (kind && (/outcome|status|result/.test(headers[index]) || ['passed', 'failed', 'error', 'timeout', 'warning'].some(name => cell.classList.contains(name)))) {
          cell.classList.remove('bm-pass', 'bm-fail', 'bm-pending');
          cell.classList.add(`bm-${kind}`);
        }
        if (/web\s*submission/.test(headers[index])) cell.querySelectorAll('a').forEach(a => a.classList.add('bm-submit-link'));
      }
    }
  }
  function filter(state) {
    const query = state.search.value.trim().toLowerCase();
    const rows = dataRows(state);
    let visible = 0;
    for (const row of rows) {
      if (!state.originalHidden.has(row)) state.originalHidden.set(row, row.hidden);
      const matches = row.textContent.toLowerCase().includes(query) &&
        (!state.failures?.checked || !!row.querySelector('.bm-fail'));
      row.hidden = state.originalHidden.get(row) || !matches;
      if (!row.hidden) visible++;
    }
    const total = rows.filter(row => !state.originalHidden.get(row)).length;
    state.count.textContent = `${visible} of ${total}`;
    state.empty.hidden = visible !== 0;
    state.empty.textContent = total ? 'No matching rows. Clear your search or filters to see everything.' : 'No entries on this page yet.';
  }
  function sortable(state) {
    const rows = dataRows(state);
    // Do not reorder irregular legacy tables, or rows with server-owned rowspan/colspan.
    if (!rows.length || rows.length !== [...state.table.rows].filter(r => r !== state.header && !r.closest('thead, tfoot')).length) return;
    if (new Set(rows.map(row => row.parentElement)).size !== 1) return;
    [...state.header.cells].forEach((cell, index) => {
      if (cell.querySelector('a, input, button, select')) return;
      const label = cell.innerText.trim().replace(/\s+/g, ' ');
      // Legacy dates omit year/timezone; preserve server order rather than imply chronology.
      if (/\b(due|submitted|date|time|timestamp)\b|release tested/i.test(label)) return;
      const button = el('button', 'bm-ui bm-sort', label);
      button.type = 'button';
      button.setAttribute('aria-label', `Sort by ${label}`);
      button.append(el('span', 'bm-sort-symbol', '↕'));
      cell.append(button);
      // Keep original header content present for disabling and assistive technologies.
      const original = [...cell.childNodes].filter(node => node !== button);
      const originalLabel = el('span', 'bm-original-label');
      original.forEach(node => originalLabel.append(node));
      cell.prepend(originalLabel);
      button.addEventListener('click', () => {
        const descending = state.sortIndex === index && !state.descending;
        state.sortIndex = index;
        state.descending = descending;
        const current = dataRows(state);
        const values = current.map(row => row.cells[index].textContent.trim());
        const numeric = values.every(value => /^-?\d+(\.\d+)?$/.test(value));
        const sorted = current.map((row, order) => ({ row, order })).sort((a, b) => {
          const av = a.row.cells[index].textContent.trim();
          const bv = b.row.cells[index].textContent.trim();
          const comparison = numeric ? Number(av) - Number(bv) : av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
          return (descending ? -comparison : comparison) || a.order - b.order;
        });
        sorted.forEach(({ row }) => row.parentElement.append(row));
        state.header.querySelectorAll('.bm-sort').forEach(control => {
          control.removeAttribute('aria-pressed');
          control.lastElementChild.textContent = '↕';
        });
        button.setAttribute('aria-pressed', 'true');
        button.lastElementChild.textContent = descending ? '↓' : '↑';
        state.count.textContent += ` · ${label}, ${descending ? 'descending' : 'ascending'}`;
      });
    });
  }
  function enhanceTable(table) {
    if (tables.has(table) || table.closest('.bm-ui') || table.parentElement.closest('table') || table.querySelector('table') ||
        table.matches('.form, .codetable, .stacktrace, .bm-account-table') || table.closest('form')) return;
    const header = headerRow(table);
    if (!header || header.cells.length < 2 || [...header.cells].some(c => c.colSpan !== 1)) return;
    const wrapper = el('section', 'bm-table-section');
    const scroller = el('div', 'bm-table-scroll');
    scroller.tabIndex = 0;
    scroller.setAttribute('role', 'region');
    const heading = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(node =>
      node.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).at(-1);
    const label = heading?.textContent.trim() || 'Entries';
    scroller.setAttribute('aria-label', `${label} table`);
    const toolbar = el('div', 'bm-ui bm-table-tools');
    const searchLabel = el('label', 'bm-search');
    const search = el('input');
    search.type = 'search';
    search.placeholder = `Search ${label.toLowerCase()}…`;
    search.setAttribute('aria-label', `Search ${label}`);
    searchLabel.append(icon('search'), search);
    const count = el('span', 'bm-count');
    count.setAttribute('role', 'status');
    count.setAttribute('aria-live', 'polite');
    toolbar.append(searchLabel, count);
    const empty = el('p', 'bm-ui bm-empty');
    empty.hidden = true;
    empty.setAttribute('role', 'status');
    const labels = [...header.cells].map(cell => cell.innerText.trim().replace(/\s+/g, ' '));
    const projectTable = labels.length === 5 && /project/i.test(labels[0]) && /submissions/i.test(labels[1]) && /due/i.test(labels[3]);
    const state = { table, header, search, count, empty, labels, projectTable, originalHidden: new WeakMap() };
    if (projectTable) {
      table.classList.add('bm-project-table');
      header.classList.add('bm-project-head');
    }
    // Preserve original nodes and parentage, but release legacy width constraints.
    for (let host = table.parentElement; host && host !== document.body; host = host.parentElement) {
      if (/^(P|DIV|SECTION|MAIN|ARTICLE)$/.test(host.tagName)) host.classList.add('bm-table-host');
    }
    tables.set(table, state);
    table.before(wrapper);
    const hint = el('p', 'bm-ui bm-scroll-hint', 'Scroll horizontally to see all columns.');
    hint.hidden = true;
    wrapper.append(toolbar, scroller, hint, empty);
    new ResizeObserver(() => { hint.hidden = scroller.scrollWidth <= scroller.clientWidth + 1; }).observe(scroller);
    scroller.append(table);
    table.classList.add('bm-data-table');
    decorateRows(state);
    const isResults = [...header.cells].some(cell => /outcome/i.test(cell.textContent));
    if (isResults) {
      const failureLabel = el('label', 'bm-failure-filter');
      const failures = el('input');
      failures.type = 'checkbox';
      failureLabel.append(failures, document.createTextNode('Failures only'));
      toolbar.insertBefore(failureLabel, count);
      state.failures = failures;
      failures.addEventListener('change', () => filter(state));
    }
    search.addEventListener('input', () => filter(state));
    sortable(state);
    attachProjectResults(state);
    filter(state);
  }
  function currentTerm() {
    // Waterloo's academic terms follow Toronto's calendar, including at midnight abroad.
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Toronto', year: 'numeric', month: 'numeric'}).formatToParts(new Date());
    const month = Number(parts.find(part => part.type === 'month').value);
    const year = parts.find(part => part.type === 'year').value;
    return `${month <= 4 ? 'Winter' : month <= 8 ? 'Spring' : 'Fall'} ${year}`;
  }
  function formatEntryPages() {
    for (const table of document.querySelectorAll('table')) {
      if (table.classList.contains('bm-account-table')) continue;
      const header = headerRow(table);
      const names = [...(header?.cells || [])].map(cell => cell.textContent.trim().toLowerCase());
      if (names.length !== 3 || !/name/.test(names[0]) || !/directory/.test(names[1]) || !/authenticate/.test(names[2])) continue;
      table.classList.add('bm-account-table');
      document.body.classList.add('bm-login-page');
      const title = el('div', 'bm-ui bm-entry-title');
      title.append(el('h1', '', 'Continue to Marmoset'), el('p', '', 'Choose an account to access your courses.'));
      table.before(title);
      for (const row of [...table.rows].filter(row => row !== header && row.cells.length === 3)) {
        row.cells[0].classList.add('bm-account-name');
        row.cells[1].classList.add('bm-account-id');
        for (const action of row.cells[2].querySelectorAll('a, input[type="submit"], button')) {
          action.classList.add('bm-account-action');
          // Keep the original action text/value and all server-owned attributes.
          if (action.tagName === 'A' && action.textContent.trim() === 'as') {
            const original = el('span', 'bm-entry-original');
            original.append(...action.childNodes);
            const arrow = icon('arrow');
            arrow.classList.add('bm-ui');
            action.append(original, el('span', 'bm-ui', 'Continue'), arrow);
          }
        }
      }
      for (const node of document.querySelectorAll('p, h2, h3')) {
        if (node.closest('table, .bm-ui')) continue;
        if (/^Current Marmoset courses:/i.test(node.textContent.trim())) node.classList.add('bm-entry-original');
        if (/please login as one of the users/i.test(node.textContent)) { node.classList.add('bm-login-help'); node.before(title); }
        if (/^Welcome to the Marmoset Submit/i.test(node.textContent.trim())) node.classList.add('bm-entry-original');
      }
    }
    for (const list of document.querySelectorAll('ul, ol')) {
      if (list.classList.contains('bm-course-list') || list.closest('.bm-ui')) continue;
      const items = [...list.children];
      if (!items.length || !items.every(item => item.tagName === 'LI' && item.querySelector('a') && /\([^()]+\d{4}\)/.test(item.querySelector('a').textContent))) continue;
      list.classList.add('bm-course-list');
      document.body.classList.add('bm-courses-page');
      for (const item of items) {
        const link = item.querySelector('a');
        const match = link.textContent.trim().match(/^(.+?)\s*\(([^()]+)\):?$/);
        if (!match) continue;
        const original = el('span', 'bm-entry-original');
        original.append(...link.childNodes);
        const content = el('span', 'bm-ui bm-course-content');
        content.append(el('span', 'bm-course-code', match[1]), el('span', 'bm-course-term', match[2]));
        const term = match[2].trim().replace(/\s+/g, ' ');
        if (/^(Winter|Spring|Fall) \d{4}$/i.test(term)) {
          const current = term.toLowerCase() === currentTerm().toLowerCase();
          item.classList.add(current ? 'bm-current-course' : 'bm-other-course');
          if (current) content.append(el('span', 'bm-course-current', 'Current term'));
        }
        const action = el('span', 'bm-ui bm-course-open', 'Open course');
        action.append(icon('arrow'));
        link.append(original, content, action);
      }
    }
    const archives = [...document.querySelectorAll('p')].filter(node => !node.classList.contains('bm-archive-row') && /^Marmoset courses from/i.test(node.textContent.trim()) && node.querySelector('a'));
    if (archives.length) {
      archives[0].before(el('h2', 'bm-ui bm-archive-title', 'Previous terms'));
      for (const node of archives) {
        node.classList.add('bm-archive-row');
        const link = node.querySelector('a');
        const term = node.textContent.split(':')[0].replace(/^Marmoset courses from\s*/i, '');
        for (const child of [...node.childNodes]) {
          if (child === link || child.contains?.(link)) continue;
          const original = el('span', 'bm-entry-original');
          child.before(original); original.append(child);
        }
        const original = el('span', 'bm-entry-original');
        original.append(...link.childNodes);
        const arrow = icon('arrow');
        arrow.classList.add('bm-ui');
        link.append(original, el('span', 'bm-ui', term), arrow);
      }
    }
  }
  function enhance() {
    formatEntryPages();
    document.querySelectorAll('table').forEach(enhanceTable);
    for (const state of tables.values()) {
      if (!state.table.isConnected) { tables.delete(state.table); continue; }
      decorateRows(state);
      attachProjectResults(state);
      filter(state);
    }
    loadProjectResults();
    document.querySelectorAll('input[type="file"]').forEach(input => {
      if (!input.getAttribute('aria-label') && !input.labels?.length) input.setAttribute('aria-label', 'File to submit');
    });
  }
  applySettings(settings);
  enhance();
  // Legacy pages may update results in place. Batch mutations and ignore our own UI.
  let scheduled = false;
  new MutationObserver(records => {
    const changed = records.some(record => {
      const owner = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (owner?.closest('.bm-ui')) return false;
      if (record.type === 'characterData') return !!owner?.closest('td');
      return [...record.addedNodes].some(node => node.nodeType === 3 ? !!owner?.closest('td') : node.nodeType === 1 &&
        !node.matches('.bm-ui, .bm-original-label, .bm-table-section') && !node.closest('.bm-ui'));
    });
    if (changed && !scheduled) {
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; enhance(); });
    }
  }).observe(document.body, { childList: true, characterData: true, subtree: true });
  media.addEventListener('change', () => applySettings(settings));
  if (api) {
    api.storage.local.get('settings').then(result => { settingsReady = true; applySettings(result.settings); }).catch(() => { settingsReady = true; applySettings(settings); });
    api.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.settings) applySettings(changes.settings.newValue);
    });
  }
})();

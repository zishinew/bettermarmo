/* BetterMarmo enhances the original DOM; it never submits, fetches, or rewrites links. */
(() => {
  'use strict';
  if (document.getElementById('bm-topbar')) return;
  const api = typeof browser !== 'undefined' ? browser : null;
  const defaults = { enabled: true, theme: 'system', compact: false };
  let settings = { ...defaults };
  const tables = new Map();
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
        table.matches('.form, .codetable, .stacktrace') || table.closest('form')) return;
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
    filter(state);
  }
  function enhance() {
    document.querySelectorAll('table').forEach(enhanceTable);
    for (const state of tables.values()) {
      if (!state.table.isConnected) { tables.delete(state.table); continue; }
      decorateRows(state);
      filter(state);
    }
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
    api.storage.local.get('settings').then(result => applySettings(result.settings)).catch(() => {});
    api.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.settings) applySettings(changes.settings.newValue);
    });
  }
})();

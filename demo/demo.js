'use strict';
// Preview-only browser API shim. Never included in the extension package.
const listeners = [];
window.browser = {
  storage: {
    local: {
      get: async () => ({ settings: JSON.parse(localStorage.getItem('bm-demo-settings') || 'null') }),
      set: async ({ settings }) => {
        localStorage.setItem('bm-demo-settings', JSON.stringify(settings));
        listeners.forEach(fn => fn({ settings: { newValue: settings } }, 'local'));
      }
    },
    onChanged: { addListener: fn => listeners.push(fn) }
  }
};
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('demo-feedback').textContent = 'Preview only: no file was uploaded. The extension uses the real Marmoset form on the live site.';
  }));
});

'use strict';
const defaults = { enabled: true, theme: 'system', compact: false };
const controls = ['enabled', 'theme', 'compact'].map(id => document.getElementById(id));
const status = document.getElementById('status');
const media = matchMedia('(prefers-color-scheme: dark)');
function appearance() {
  const theme = document.getElementById('theme').value;
  document.documentElement.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
}
async function init() {
  try {
    const stored = await browser.storage.local.get('settings');
    const settings = { ...defaults, ...stored.settings };
    controls.forEach(control => { if (control.type === 'checkbox') control.checked = settings[control.id]; else control.value = settings[control.id]; });
    appearance();
    controls.forEach(control => control.addEventListener('change', async () => {
      const next = Object.fromEntries(controls.map(input => [input.id, input.type === 'checkbox' ? input.checked : input.value]));
      appearance();
      try { await browser.storage.local.set({ settings: next }); status.textContent = 'Saved. Applies to open Marmoset pages.'; }
      catch { status.textContent = 'Couldn’t save settings. Reopen the extension and try again.'; }
    }));
  } catch {
    status.textContent = 'Couldn’t load settings. Reopen the extension and try again.';
    controls.forEach(control => { control.disabled = true; });
  }
}
media.addEventListener('change', appearance);
init();

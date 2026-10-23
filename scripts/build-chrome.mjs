import { cp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

// Only packaging metadata differs; JavaScript, CSS, HTML and font assets are copied unchanged.
const root = resolve(import.meta.dirname, '..');
const destination = resolve(root, 'dist/chrome');
await rm(destination, {recursive:true, force:true});
await mkdir(destination, {recursive:true});
await cp(resolve(root, 'extension'), destination, {recursive:true, filter:source => basename(source) !== '.DS_Store'});
const manifest = JSON.parse(await readFile(resolve(destination, 'manifest.json'), 'utf8'));
delete manifest.browser_specific_settings;
manifest.minimum_chrome_version = '120';
manifest.icons = Object.fromEntries([16,32,48,128].map(size => [size, `icons/icon-${size}.png`]));
manifest.action.default_icon = manifest.icons;
await writeFile(resolve(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
execFileSync(process.execPath, [resolve(root, 'node_modules/web-ext/bin/web-ext.js'), 'build', '--source-dir', destination, '--artifacts-dir', resolve(root, 'dist'), '--filename', `bettermarmo-chrome-${manifest.version}.zip`, '--overwrite-dest'], {stdio:'inherit'});
console.log(`Load unpacked Chrome extension: ${destination}`);

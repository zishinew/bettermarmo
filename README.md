# BetterMarmo

A Firefox extension that gives Waterloo Marmoset a calmer, cleaner interface. It enhances the original pages instead of rebuilding the submission system.

- Composio-inspired black and white interface, with light, dark, and system appearance.
- Searchable course, project, submission, and test-result tables.
- Sortable regular tables, preserving irregular rows and legacy layouts.
- A **Failures only** filter for test-result tables.
- Readable outcome labels, keyboard focus, responsive table scrolling, and compact density.
- Native file inputs, original links, form actions, hidden fields, and submission behavior.
- One-click disable in the extension popup. Settings are stored locally; no analytics, external services, or background requests.

## Load in Firefox

Requires Firefox 142 or later.

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…**.
3. Select `extension/manifest.json` from this repository.
4. Open [Marmoset](https://marmoset.student.cs.uwaterloo.ca/) and sign in normally. Reload any Marmoset pages that were already open.
5. Use the BetterMarmo toolbar button for appearance, compact tables, or disabling the redesign.

Temporary add-ons are removed when Firefox restarts. For persistent installation on standard Firefox, the extension must be signed through Mozilla; the generated ZIP is an unsigned package for development/review, not a signed store release. [Mozilla's temporary installation instructions](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

## Preview and develop

```sh
npm ci
npm run preview
```

Open http://127.0.0.1:4173. The legacy preview at `/demo/legacy.html` reproduces quirks-mode tables nested in paragraphs, constrained parent widths, and long project names. Desktop project columns use the available page width; on phones they stack with labels so every field stays visible. Other dense tables expose a horizontal scroll cue.

The preview includes course lists, projects, submission history, test results, and an upload form. **All preview data is illustrative. The demo does not upload files.** The browser API shim in `demo/demo.js` is excluded from the extension package.

```sh
npx playwright install firefox
npm test
npm run lint
npm run build
```

The package is written to `dist/bettermarmo-1.1.0.zip`. No npm dependencies ship inside it. Firefox fixture tests cover search, empty states, sorting, combined result filters, local settings, mobile overflow, dynamic rows, preservation of the original submission form, and the restricted permission scope.

## Compatibility and boundaries

The live CS site redirects to Waterloo SSO. Its signed-in pages were unavailable during development. Adapters are based on the [upstream Marmoset JSP templates](https://github.com/squished18/marmoset_ECE_base/tree/master/SubmitServer/trunk/SubmitServer2/WebRoot) and [Waterloo's documented student workflow](https://student.cs.uwaterloo.ca/~cs240e/w26/resources.phtml); the deployed Waterloo version may differ. **Signed-in compatibility and an actual upload have not been verified.**

The extension only runs on `https://marmoset.student.cs.uwaterloo.ca/*`; it does not alter the Waterloo identity provider. It reads existing page text for local filtering and does not fetch other pages, infer scores, consume release tokens, auto-submit, or change server data. The browser's host permission is needed to apply the interface, and `storage` saves preferences.

Only rectangular data rows are filtered. Rows with `colspan` or `rowspan` remain visible to preserve legacy summaries/errors, and irregular tables are not sorted. Date columns remain in server order because legacy dates can omit year and timezone. Code tables and form tables are excluded from enhancements. If a page looks wrong, disable the redesign from the popup and report its structure using anonymized HTML.

Known development-tool limitation: the current `web-ext` dependency tree has unpatched `node-forge` / `adbkit` audit findings. These tools are development-only and are not included in the extension. `shell-quote` is overridden to its patched version.

## Files

- `extension/manifest.json` — scoped Firefox Manifest V3 configuration.
- `extension/content/content.js` — progressive table and theme enhancements.
- `extension/content/styles.css` — scoped design system and responsive styles.
- `extension/popup/` — local extension preferences.
- `demo/` — representative preview fixtures, not the actual Waterloo website.
- `tests/extension.test.mjs` — Firefox browser tests against the fixtures.

Geist is bundled under its SIL Open Font License in `extension/fonts/LICENSE.txt`. BetterMarmo is an independent project, not affiliated with the University of Waterloo.
# bettermarmo

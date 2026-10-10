---
name: BetterMarmo
description: Clean monochrome Marmoset workflows inspired by Composio.
colors:
  ground: "#fafafa"
  surface: "#ffffff"
  text: "#171717"
  muted: "#666666"
  line: "#e5e5e5"
  soft: "#f5f5f5"
  action: "#171717"
  link: "#171717"
  selection: "#d4d4d4"
  pass-bg: "#fafafa"
  pass: "#404040"
  fail-bg: "#f0f0f0"
  fail: "#171717"
  pending-bg: "#fafafa"
  pending: "#666666"
  focus: "#737373"
  action-hover: "#404040"
  dark-ground: "#0a0a0a"
  dark-surface: "#111111"
  dark-text: "#f5f5f5"
  dark-muted: "#a3a3a3"
  dark-line: "#303030"
  dark-soft: "#1c1c1c"
  dark-action: "#f5f5f5"
  dark-link: "#f5f5f5"
  dark-pass-bg: "#171717"
  dark-pass: "#d4d4d4"
  dark-fail-bg: "#262626"
  dark-fail: "#ffffff"
  dark-pending-bg: "#171717"
  dark-pending: "#a3a3a3"
  dark-action-hover: "#d4d4d4"
typography:
  headline:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "clamp(24px, 3vw, 34px)"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-.025em"
  title:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 620
    lineHeight: 1.4
    letterSpacing: "-.025em"
  section:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-.025em"
  body:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.65
  label:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: ".04em"
  code:
    fontFamily: "ui-monospace, monospace"
    fontSize: "13px"
  popup-body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
rounded:
  control: "4px"
  submit-link: "3px"
  table: "6px"
  code: "10px"
  file-button: "6px"
  mark: "3px"
spacing:
  control-gap: "8px"
  mobile-gap: "12px"
  tools-gap: "16px"
  section-inset: "20px"
  tablet-gutter: "24px"
  desktop-gutter: "48px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "11px 20px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  submit-link:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.submit-link}"
    padding: "5px 12px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  table-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.table}"
  status-pass:
    backgroundColor: "{colors.pass-bg}"
    textColor: "{colors.pass}"
  status-fail:
    backgroundColor: "{colors.fail-bg}"
    textColor: "{colors.fail}"
  status-pending:
    backgroundColor: "{colors.pending-bg}"
    textColor: "{colors.pending}"
---

# Design System: BetterMarmo

## Overview

**Creative North Star: "Monochrome workspace"**

The user-approved direction is black and white, very clean and modern, using Composio's visual language. Geist, quiet navigation, thin neutral rules and square black actions keep dense academic content easy to scan. The first viewport gives the course table room to breathe and keeps every desktop project column visible.

Source authority is `extension/content/styles.css`, `extension/content/content.js` and `extension/popup/popup.css`. This describes the implemented extension, including its neutral dark appearance. Ten Firefox fixture tests passed; signed-in Waterloo compatibility has not been directly verified.

**Key Characteristics:**

- Monochrome surfaces and actions, with no green, gold or colored result cells.
- Locally bundled Geist and tabular numbers.
- Wide desktop tables and labelled phone project fields.
- Flat surfaces and reversible enhancements to original workflows.

## Colors

The frontmatter owns the actual light values and dark overrides. `action` and `link` use near-black in light appearance and pale neutral text in dark appearance. Primary submit actions invert against the surface. `ground`, `surface`, `soft`, `line`, `text` and `muted` establish hierarchy through neutral contrast.

Pass, failure and pending roles also remain neutral. Preserve original outcome text: pass uses weight 600, enhanced failure cells 650, and pending cells weight 550 with italics. Pass and failure fills survive row hover. Pending follows the general soft hover fill. These treatments do not infer grades.

Dark appearance uses true neutral black ground, near-black surfaces and neutral borders. The popup shares the ground, surface, text, muted and line roles; its control accent follows the action color. Selection stays light gray with near-black text in both themes. Keyboard focus stays medium gray.

## Typography

Bundled variable Geist loads from `extension/fonts/Geist.ttf`, supports weights 100–900 and uses swap behavior. Content names the face BetterMarmo Geist; the popup names it Geist. System sans-serif is the fallback. Code uses platform monospace.

The frontmatter records the heading/body/label hierarchy. Headings have restrained negative tracking; direct body paragraphs cap at 75ch. First-column labels and action links use weight 550. Tables and row counts use tabular numbers. The header brand and popup title are 18px/650. Popup body is 13px/1.5 with 11px captions, footer and status text. Phone project titles are 16px; field labels are 11px/400. There is no decorative display face.

## Layout

The content body spans the available width up to 1680px, centered with desktop padding `100px 48px 44px`. The fixed header is 64px tall and uses `max(24px, calc((100vw - 1584px) / 2))` horizontal padding. Original navigation and breadcrumbs remain in the content flow.

Table shells fill their work area. Legacy paragraph/div ancestors receive `.bm-table-host` to release narrow widths and paragraph line-length limits while enabled. Project tables use fixed column proportions of **28/12/12/17/31 percent**, with no 760px minimum. Long project names and titles wrap. Dense result tables retain the 760px minimum and scroll inside a focusable region; a visible cue appears only when columns overflow.

The toolbar has a 62px minimum height, `16px 20px` padding and 16px wrapping gaps. Search spans 200–360px and the count aligns to the end. Cells use `13px 16px`; compact mode reduces data-cell vertical padding to 10px.

At 900px and below, body gutters become 24px and project-cell horizontal padding becomes 12px. At 700px and below, final body padding is `88px 16px 30px`, the header is 60px tall and its theme label disappears. Project rows become two-column field grids with `20px 16px` row padding and `12px 16px` gaps. Project names, deadlines and titles span both columns; `data-bm-label` supplies field labels. Desktop project headers are hidden on phones. Result tables still scroll. Tools use `12px 16px` padding; search minimum becomes 150px and the failures filter occupies a full row. Form cells stack; text inputs become 16px.

Forms cap at 720px. The popup is 340px wide with 22px gutters, `24px 22px` header padding and 20px vertical setting rows. Printing removes the fixed header, tools and sort symbols and exposes table overflow.

## Elevation & Depth

There are no shadows, blur or animated transitions. Surface tones and 1px rules provide depth. The fixed header's stacking order is structural. Hover changes neutral fills and underlines links; keyboard focus is an outline without glow.

## Shapes

Actions are square in character with restrained 3–4px corners. Table shells and file-selector buttons use 6px corners; code blocks use 10px. Tables use bottom dividers rather than individually boxed cells. The 33px identity mark is a solid inverted square with 3px corners and no border.

## Components

### Header and navigation

A neutral surface header holds the identity and an end-aligned outlined theme button. Its 18px SVG icons use rounded strokes. Theme hover uses the soft neutral fill. Retain original navigation, instructor links, breadcrumbs and logout. Breadcrumb links underline on hover; logout link and visited states remain neutral. The original header image is grayscale.

### Table tools and data

Search is borderless with an outlined search icon. Row counts are quiet, tabular and announced as live status. Outcome tables expose a native Failures only checkbox. Empty results show an explanatory line in the same table shell. Preserve spanning rows and server-hidden rows.

Supported sortable headers are unfilled text controls with direction indicators; active state uses the link color. Irregular tables and headers containing existing controls are not sortable. Legacy date-like labels do not receive sort controls because their dates omit year/timezone.

### Actions and fields

Primary submit controls use action fill, surface-colored text and `11px 20px` padding. Inline submit links use `5px 12px`, 12px text and 3px corners. Light hover is dark gray; dark hover is light gray. View actions remain text links. Standard fields use surface fill, 1px neutral borders, 4px corners and `10px 12px` padding. Disabled inputs/buttons use half opacity and a not-allowed cursor. File upload remains native with a soft file-selector button.

### Outcome cells and messages

Use original text and recognized outcome/status/result columns or semantic classes. Status messages use soft fill, a thin border, 4px corners and 16px inset. Outcomes remain table cells; there is no separate badge/chip component.

### Focus and settings

Content focus uses a `3px solid #737373` outline, 4px offset and 3px radius. Popup controls use the same outline with 3px offset. Popup setting rows retain labels for enablement, System/Light/Dark appearance and compact density. Native checkboxes are 18px; the select has 6px corners. Open Marmoset uses inverted text/ground colors, `11px 14px` padding and 4px corners; hover opacity is .85. Save feedback reserves an 11px status line.

## Do's and Don'ts

- **Do** use the user-approved monochrome direction, bundled Geist and shared light/dark roles.
- **Do** keep all five desktop project columns visible and phone fields labelled.
- **Do** retain original links, forms, navigation and textual outcomes.
- **Do** provide visible keyboard focus, overflow cues and honest empty states.
- **Don't** reintroduce green, gold or colored status cells.
- **Don't** infer grades or submission success, or add misleading date sorting.
- **Don't** add decorative nested cards, pill actions, shadows or unnecessary motion.
- **Don't** claim signed-in live verification from fixture tests.

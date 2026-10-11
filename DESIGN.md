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
  entry-headline:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "clamp(28px, 4vw, 40px)"
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
  summary:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.65
  caption:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
  brand:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    letterSpacing: "-.025em"
  mark:
    fontFamily: "BetterMarmo Geist, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 650
  code:
    fontFamily: "ui-monospace, monospace"
    fontSize: "13px"
  popup-body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
rounded:
  control: "4px"
  entry-container: "8px"
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
  account-action:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  current-term-indicator:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.submit-link}"
    padding: "3px 8px"
  entry-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.entry-container}"
    padding: "24px"
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

Source authority is `extension/content/styles.css`, `extension/content/content.js`, `extension/content/results.js` and `extension/popup/popup.css`. This describes the implemented extension, including its neutral dark appearance. Seventeen Firefox fixture tests passed with zero extension lint errors, notices or warnings; final light login and course screenshots were reviewed at desktop and phone widths, including current-term course captures fixed to October 11, 2026 (Fall 2026); signed-in Waterloo compatibility has not been directly verified.

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

The frontmatter records the heading/body/label hierarchy and deliberate summary, caption, brand and mark roles. Headings have restrained negative tracking; direct body paragraphs cap at 75ch. First-column labels and action links use weight 550. Tables and row counts use tabular numbers. The header brand and popup title use the brand role; the identity mark uses the mark role. Submission summaries and Refresh results use 12px text; notes, case previews, outcomes and disclosure labels use 11px text. Popup body is 13px/1.5 with 11px captions, footer and status text. Phone project titles are 16px; field labels are 11px/400. Entry headings use the separate fluid entry-headline role (28–40px). These endpoints and 8px entry containers are deliberate extensions of the existing hierarchy and corner language, including when the detector flags them. There is no decorative display face.

## Layout

The content body spans the available width up to 1680px, centered with desktop padding `100px 48px 44px`. The fixed header is 64px tall and uses `max(24px, calc((100vw - 1584px) / 2))` horizontal padding. Original navigation and breadcrumbs remain in the content flow.

Table shells fill their work area. Legacy paragraph/div ancestors receive `.bm-table-host` to release narrow widths and paragraph line-length limits while enabled. Project tables use fixed column proportions of **24/24/10/16/26 percent**, with no 760px minimum. Long project names and titles wrap. Dense result tables retain the 760px minimum and scroll inside a focusable region; a visible cue appears only when columns overflow.

The toolbar has a 62px minimum height, `16px 20px` padding and 16px wrapping gaps. Search spans 200–360px and the count aligns to the end. Cells use `13px 16px`; compact mode reduces data-cell vertical padding to 10px.

At 900px and below, body gutters become 24px and project-cell horizontal padding becomes 12px. At 700px and below, final body padding is `88px 16px 30px`, the header is 60px tall and its theme label disappears. Project rows become two-column field grids with `20px 16px` row padding and `12px 16px` gaps. Project names, submissions, actions, deadlines and titles span both columns; `data-bm-label` supplies field labels. Desktop project headers are hidden on phones. Result tables still scroll. Tools use `12px 16px` padding; search minimum becomes 150px and the failures filter occupies a full row. Form cells stack; text inputs become 16px.

Login and course selection use a centered shell capped at 1080px. Current courses form two equal columns with 16px gaps; at 640px and below they become one column with 12px gaps. Account rows stack at that breakpoint with 20px inset and a full-width action. Entry title margins are 48px above and 28px below, reducing the upper margin to 32px on phones.

Forms cap at 720px. The popup is 340px wide with 22px gutters, `24px 22px` header padding and 20px vertical setting rows. Printing removes the fixed header, tools and sort symbols and exposes table overflow.

## Elevation & Depth

There are no shadows or blur. Account and course choosers receive one 200ms entrance from .4 to 1 opacity and a 6px rise, using cubic-bezier(.23, 1, .32, 1). Course and account arrows move 3px on pointer hover with a 150ms transition using the same easing. Reduced motion replaces the entrance with a 150ms ease opacity fade from .7 to 1 and disables arrow movement. Existing reading tables have no entrance motion. Surface tones and 1px rules provide depth. The fixed header's stacking order is structural. Hover changes neutral fills and underlines links; keyboard focus is an outline without glow.

## Shapes

Actions are square in character with restrained 3–4px corners. Entry account and course containers use 8px corners with 4px actions. Table shells and file-selector buttons use 6px corners; code blocks use 10px. Tables use bottom dividers rather than individually boxed cells. The 33px identity mark is a solid inverted square with 3px corners and no border.

## Components

### Header and navigation

A neutral surface header holds the identity and an end-aligned outlined theme button. Its 18px SVG icons use rounded strokes. Theme hover uses the soft neutral fill. Retain original navigation, instructor links, breadcrumbs and logout. Breadcrumb links underline on hover; logout link and visited states remain neutral. The original header image is grayscale.

### Account and course entry

Login presents “Continue to Marmoset”, original authorization help, account name, directory identity and a Continue action. Account rows use a surface fill, thin neutral border and 24px cell inset; names use 18px/600 and directory text is muted. The action retains server-owned attributes and uses the original destination.

Current courses use full-card original links with 24px inset, 24px/650 course codes, muted 13px terms and a 13px Open course row. Pointer hover adds a soft fill and muted border. Previous terms are quiet 13px text links with 14px vertical inset, fine bottom rules and a 16px section title. Exact original archive URLs remain intact. Original labels are retained and restored when the extension is disabled. No raster asset ships with this extension.

Recognized Winter/Spring/Fall YYYY terms compare against the exact year and Toronto calendar: January–April is Winter, May–August Spring, September–December Fall. Current-term cards use a text-colored border and an inverted “Current term” indicator (12px/550, 3px corners, 3px 8px inset). Other recognized terms use ground fill, muted text and 500-weight course codes without reducing whole-card opacity. Unknown terms keep the neutral default. Original order and links remain intact.

### Table tools and data

Search is borderless with an outlined search icon. Row counts are quiet, tabular and announced as live status. Outcome tables expose a native Failures only checkbox. Empty results show an explanatory line in the same table shell. Preserve spanning rows and server-hidden rows.

Supported sortable headers are unfilled text controls with direction indicators; active state uses the link color. Irregular tables and headers containing existing controls are not sortable. Legacy date-like labels do not receive sort controls because their dates omit year/timezone.

### Actions and fields

Primary submit controls use action fill, surface-colored text and `11px 20px` padding. Inline submit links use `5px 12px`, 12px text and 3px corners. Light hover is dark gray; dark hover is light gray. View actions remain text links. Standard fields use surface fill, 1px neutral borders, 4px corners and `10px 12px` padding. Disabled inputs/buttons use half opacity and a not-allowed cursor. File upload remains native with a soft file-selector button.

### Outcome cells and messages

Use original text and recognized outcome/status/result columns or semantic classes. Status messages use soft fill, a thin border, 4px corners and 16px inset. Outcomes remain table cells; there is no separate badge/chip component.

### Latest submission results

The original submissions cell starts with a compact, unboxed results block and retains its original links below. A weight-550 status identifies the latest submission; tabular counts show each available test group as `passed / available passed`. Fractions sourced only from weighted score columns remain labelled `score`. Two named cases preview their textual outcomes. A native details disclosure labelled with the available case count reveals the complete readable list; opening it hides the duplicate preview. Long case names wrap and case rows use fine neutral dividers, without colored badges.

Loading says `Loading results…`. Empty history says `Not submitted`; pending and compile failures say `Submitted · Testing pending` and `Submitted · Did not compile`. A submitted history without counts says `Test results not available yet`. Unreadable details retain the summary and say `Test cases unavailable · Open submission details`. A failed history read says `Couldn’t load results` and offers an underlined Retry action. These states stay distinct and never imply success or a grade.

Refresh results is a quiet outlined toolbar button with 4px corners, 12px text and `6px 10px` inset. It clears cached reads and reloads results; it is disabled while reads are in progress. Retry uses inherited summary text, no fill or border, an underline and `4px 0` inset. Both inherit visible content focus. Results read the original same-origin history and detail pages, with three concurrent reads and 12-second timeouts. On phones, submissions and actions each occupy the full row width.

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

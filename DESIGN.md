---
name: Workout Planner
description: Plan, log and review workouts inside Obsidian notes, logged with a thumb at the gym.
colors:
  # Sampled from Obsidian's default theme (light, then the -dark pair). In
  # code every color is a CSS variable (Obsidian's or a --workout-* token in
  # app/styles/_variables.scss), never these literals: themes change them.
  page: "#ffffff"
  page-dark: "#000000"
  card: "#f6f6f6"
  card-dark: "#1e1e1e"
  ink: "#000000"
  ink-dark: "#dadada"
  ink-muted: "#5c5c5c"
  ink-muted-dark: "#b3b3b3"
  accent: "#9873f7"
  accent-dark: "#8a5cf5"
  accent-fill: "#7a5cc5"
  accent-fill-dark: "#6e4ac4"
  accent-text: "#6040ab"
  accent-text-dark: "#b6a2ef"
  on-accent: "#ffffff"
  border-control: "#8a8a8a"
  border-control-dark: "#696969"
  border-subtle: "#b8b8b8"
  border-subtle-dark: "#5a5a5a"
  error-text: "#8c1d2b"
  error-text-dark: "#ee8185"
  success-text: "#045d27"
  success-text-dark: "#8fd4a4"
typography:
  body:
    fontFamily: "var(--font-text), ui-sans-serif, -apple-system, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  title:
    fontFamily: "var(--font-text), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1em"
    fontWeight: 600
  figure:
    fontFamily: "var(--font-text), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1em"
    fontWeight: 600
    fontFeature: "tnum"
  label:
    fontFamily: "var(--font-text), ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8em"
    fontWeight: 400
  clock:
    fontFamily: "var(--font-monospace), ui-monospace, monospace"
    fontSize: "1.5em"
    fontWeight: 600
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  3xs: "1px"
  2xs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
  touch: "44px"
components:
  block-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "12px"
  number-field:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    rounded: "{rounded.md}"
    height: "44px"
  number-field-suggestion:
    textColor: "{colors.ink-muted}"
  check-toggle:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.lg}"
    width: "52px"
    height: "44px"
  check-toggle-done:
    backgroundColor: "{colors.accent-fill}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.lg}"
    width: "52px"
    height: "44px"
  disclosure-toggle:
    textColor: "{colors.ink-muted}"
    size: "44px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  chip-selected:
    backgroundColor: "{colors.accent-fill}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  stat-card:
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
  stat-card-better:
    textColor: "{colors.success-text}"
    typography: "{typography.figure}"
  chart-plot:
    backgroundColor: "{colors.page}"
    rounded: "{rounded.lg}"
  timer-strip:
    backgroundColor: "{colors.page}"
    textColor: "{colors.accent-text}"
    typography: "{typography.clock}"
    rounded: "{rounded.lg}"
    padding: "4px 4px 4px 12px"
---

# Design System: Workout Planner

## Overview

**Creative North Star: "The gym notebook"**

A training diary that fills in with a thumb. You open the note, the next set is already written in grey (what you did last time), and one tap on the tick logs it. The plugin lives inside Obsidian, so the theme leads: every surface, ink and accent comes from Obsidian's variables, and the plugin adds only what the task needs. Big figures, one tick per set, nothing that makes you scroll between sets.

Character depends on where a component is used. **At the gym** (`workout-sets`, `workout-session`, `workout-timer`) controls are tactile and sure: 44px targets, clear states (outlined to do, filled done), figures in semibold tabular numerals, readable with sweaty hands in gym light. **At the desk** (`workout-log` tables, charts, dashboards, settings) they are quiet and precise: they follow the theme, and the accent marks only what is done, picked or focused.

**Key Characteristics:**

- Theme first: Obsidian variables and `--workout-*` tokens, never a literal color.
- One tap per set: the suggestion is the value, so an untouched row logs last time.
- Done is filled, to do is outlined; the accent fill means "done" or "picked".
- Every control is at least 44×44px on a phone.
- Undo instead of confirm for actions taken in one tap.

## Colors

Neutral ink and surfaces from the theme, one accent (the theme's) used for state, never for decoration.

### Primary

A primary button (`Button` with `BUTTONVARIANT.PRIMARY`) is the accent fill wherever it is drawn, inside `.workout-buttons-container` or not.


- **Theme accent** (`--interactive-accent`, #9873f7 / #8a5cf5): focus borders and rings, hover borders. Never behind white text (3.4:1).
- **Accent fill** (`--workout-accent-fill`, #7a5cc5 / #6e4ac4): the fill of something done or picked: a logged set's tick, a selected chip, a primary action. White text on it is ≥4.5:1.
- **Accent text** (`--workout-text-accent`, #6040ab / #b6a2ef): text in the accent (exercise names, the running timer's digits), ≥4.5:1 on page and card.

### Neutral

- **Page** (`--background-primary`, #ffffff / #000000): the note, and the inset of fields, ticks and the rest strip inside a card.
- **Card** (`--background-secondary`, #f6f6f6 / #1e1e1e): a block's surface. Anything that must stand out from the note uses it, never `--background-primary`.
- **Ink** (`--text-normal`): typed values, titles, logged figures.
- **Muted ink** (`--text-muted`, #5c5c5c / #b3b3b3): labels, meta lines, and the suggestion in an empty field (6.7:1 light, 10:1 dark).
- **Control border** (`--workout-border-color`, about 3:1 on the card): the outline of fields, ticks, buttons and cards (WCAG 1.4.11).
- **Subtle border** (`--workout-border-subtle`): rows and sections inside a component.

### Semantic

- **Error text** (`--workout-text-error`) and **success text** (`--workout-text-success`): messages and states, ≥4.5:1. The raw `--text-error` / `--color-*` are 2–3.4:1 on white.

### Named Rules

**The Body Token Rule.** Tokens built from theme variables are declared on `body`, not `:root`: Obsidian defines its theme variables on `body.theme-*`, and a custom property resolves where it is declared (on `:root` the fill turns transparent).

**The Suggestion Is Ink Rule.** A suggestion that gets logged is information, not decoration: it uses `--text-muted` (≥4.5:1), never `--text-faint` (2.2:1). It differs from a typed value by weight (normal against semibold) and color (muted against normal).

## Typography

**Body font:** the theme's `--font-text` (system UI by default). **Clock font:** `--font-monospace`.

**Character:** the theme's own voice for words; figures are the plugin's voice, heavier and tabular so columns of reps and weights line up.

### Hierarchy

- **Title** (600, 1.1em): a block's exercise name, in accent text.
- **Figure** (600, 1.1em, tabular numerals): typed and logged values in a set row.
- **Body** (400, 16px): notes, messages.
- **Label** (400, 0.8em, muted): column headers, field labels, the protocol picker's label.
- **Meta** (400, 0.85em, muted): "Last time", "2/4 sets".
- **Clock** (600, 1.5em in a strip, monospace): the rest countdown. The standalone timer block on a phone uses `clamp(3rem, 18vw, 4.5rem)`.

**The Tabular Figures Rule.** Any number that is compared down a column (reps, weight, set number, time) uses `font-variant-numeric: tabular-nums`.

## Layout

Spacing is an 8px scale with 4px middle steps (`--workout-space-*`: 1, 2, 4, 8, 12, 16, 20, 24, 32, 40px). Gaps between siblings use `gap`, not margins.

A set row is a grid: set number (2.25rem), one `minmax(0, 1fr)` column per field, the chevron (2.5rem) and the tick (4rem, wider than the 52px tick so a tap meant for the chevron can't land on it). Tracks are always `minmax(0, 1fr)`, never a bare `1fr`, which grows to the widest child and pushes the block off screen.

On phones the first row to fill in must be on the first screen: the rest timer inside a block is a one-line strip (`.workout-timer-strip`), not the standalone timer's big centred layout. The tick sits at the right end of the row, where the right thumb reaches it.

Breakpoints (Sass): mobile 484px, tablet 768px, xl 1200px, huge 1600px. Layout that depends on Obsidian's phone UI reads `body.is-mobile`.

## Elevation & Depth

Flat by default, depth by tone: a card (`--background-secondary`) sits on the note, and fields, ticks and the rest strip are inset into it with `--background-primary`. Shadows (`--workout-shadow-sm/md/lg`) appear only on things that float over content: dropdowns, the autocomplete, the tour.

**The Inset Not Lifted Rule.** A control inside a card is inset (page color plus border), never lifted with a shadow.

## Shapes

Radii come from Obsidian with fallbacks (`--workout-radius-*`: 2, 4, 6, 8, 12px, full). Cards use xl (12px), the tick and the rest strip lg (8px), fields the theme's input radius, chips full (pill). Borders are 1px (`--workout-border-thin`) for outlines and 2px (`--workout-border-medium`) for the tick and focus rings.

## Components

The UI kit is in `app/components/atoms` and `app/components/molecules` (barrels: `@app/components/atoms`, `@app/components/molecules`), with styles in `app/styles/components/`. `workout-sets` (`EmbeddedSetsView`) is the reference use of every piece.

### NumberField (molecule)

A number typed quickly on a phone.

- **Style:** page-color box with a control border, 44px high, figure type. Text input with `inputmode` (`numeric` for whole numbers, else `decimal`), not `type="number"`: no spinners, a decimal comma stays as typed.
- **Suggestion:** `suggestion` is the placeholder and the value used when the field stays empty (the caller reads it, as `rowToFormData` does). Muted ink, normal weight.
- **Options:** `unit` (shown at the end, added to the accessible name), `step` with `min`/`max` (− / + buttons that show the step, "−2.5" / "+2.5", out of the tab order; ↑ / ↓ keys), `enterKeyHint`, `onEnter`.
- **Focus:** the whole box gets the accent border and ring (`:focus-within`). Focus selects a typed value, so the first key replaces it.
- **Error:** `setError(message)` shows the message under the field, sets `aria-invalid` and `aria-describedby`, and turns the border to error text color; typing clears it.
- **Keys:** stay in the field (`stopPropagation`), so the editor around a block never receives them.

### CheckToggle (atom)

The tick that marks something done, and takes it back.

- **To do:** outlined, page color, muted check (52×44px).
- **Done:** accent fill, white check.
- **Label:** names the action of its current state ("Log set 2", "Remove set 2 from the log"), since one control does opposite things.
- **Taking back** what was done is immediate and offers an UndoNotice; it never asks to confirm.

### DisclosureToggle (atom)

The chevron that shows a row's details.

- 44×44px, `aria-expanded`, the chevron turns 180° when open (no animation with `prefers-reduced-motion`).
- `marked` draws an accent dot inside its box: the hidden details hold something other than the defaults.

### ChipGroup (molecule)

One of a few options, picked from chips.

- One scrolling row of chips in a `role="group"` labelled by its visible label (label type). Selected: accent fill, `aria-pressed="true"`.
- A pick presses the new chip at once, so a caller that doesn't redraw stays right (the heat map's Period, Side and Measure).
- `ChipGroup.createMulti`: the same group where several chips are pressed (`picked()`, `setError` under the chips, cleared by the next pick). For settings that show some of a few things (cards, periods, buttons).
- `labelHidden` when the options name themselves (Week, Month, Year): the label still names the group for screen readers, without a row of its own.
- **ProtocolPicker** is the ChipGroup of a set's protocol: the caller passes the list (`ProtocolCatalog.all()`), adding a picked protocol that is no longer in the settings.

### NotesField (molecule)

A labelled text area (`<label for>`). `saveOn: "input"` for a draft kept in memory, `"change"` for a value written to the log once the field is left.

### UndoNotice (molecule)

An Obsidian notice for a one-tap action: what happened on the left, Undo (`mod-cta`) at the right end, 8s (`UNDO_NOTICE_MS`). Tapping Undo hides it and runs `onUndo`; the caller makes undo exact (the deleted set comes back with its timestamp).

### DeleteButton (atom)

The red trash icon (error text color) for something removed on purpose and rarely. A 44px target on phones. The caller asks to confirm only when the action can't be undone.

### LiveRegion (atom)

A polite `role="status"` region for what changed ("2/4 sets"). Create it once, outside what the block redraws: a region drawn again with its text already in it is not read.

### Rest strip (`.workout-timer-strip`)

`RestTimer.draw` draws a block's rest as one line: clock digits left, play/pause and reset right (44px). It overrides the standalone timer's phone layout, so it stays one line on phones.

### BlockCard (molecule)

A block (`workout-log`, `workout-sets`, `workout-session`, `workout-chart`, `workout-duration`, and each widget of `workout-dashboard`) is a card: card color, control border, xl radius, 12px padding, its parts separated by an 8px gap. Its top row is the title (accent text; muted when it says what is missing), meta and the ⋮ menu, always in the top right corner. `BlockCard.footer` is a row of actions at the end.

### StatCard (molecule)

One figure of a summary: its label above (label type, muted), the figure (figure type, tabular numerals, ink), an optional detail under it (meta, muted: the day it happened, "last 3"). No box of its own: a row of them (`StatCard.row`, `.stat-card-row`) sits on the card under a subtle border, in a grid of `minmax(min(7.5rem, 100%), 1fr)` tracks. A change is toned by whether it is an improvement, not by its sign (for pace a fall is better): `is-up` in success text, `is-neutral` muted, a decline stays ink. Never red: a worse week is not an error.

### ProgressMeter (atom)

How far something is from done: a 6px pill bar, the theme's border color as track. The fill is muted ink on the way and accent fill once done (`is-done`); no red/amber/green, being short of a target is not an error. A `progressbar` with `aria-label`, and the number beside it in words (never only in a tooltip, which a phone can't show).

### Target (`TargetSection`, in `workout-log` and `workout-sets`)

The block's goal, so it must read as one: its own panel inset into the card (page color, control border, lg radius, 12px padding). Top row: target icon (accent text), "Target:" (label), on the right the best reps at that weight (meta) or "No sets at 85kg yet". Under it the target in big figures (1.5em, semibold, tabular, ink), then an 8px `ProgressMeter`, empty until a set at the target weight exists. Reached: accent border, full accent meter, icon and best reps in success text, and the achievement row inside the same panel under a subtle border: "Target reached!" (success), the next weight (muted) with the primary Update target button, a 44px × at the right end. No shadow, no slide-in.

### Log table (`workout-log`)

The desk's view of logged sets, on the card.

- **Add log** sits under the title, above the table: a new set shows up as the table's first row.
- **Days are groups.** Each day starts with a line (date, totals) under a control border, and every row of the day shares one shade; the shade alternates between days, never between rows.
- **Type:** column labels muted (label), numbers in figure type with tabular numerals, time and N/A muted. No accent on dates or volume.
- **Phones:** one row of column labels; each set is one grid row (time, one `minmax(min-content, 1fr)` track per number, never narrower than its figure, the 44px edit button). A figure never wraps or ends in an ellipsis. The exercise goes above the numbers, protocol badge and notes under them.

### Chart card (`workout-chart`)

The desk's view of how an exercise moves, one BlockCard.

- **Top row:** the block's `title`, else the exercise or workout, else the chart's default title ("Trend Volume"); the data type as meta when the title doesn't already name it; the ⋮ menu (go to exercise, edit). The canvas draws no title of its own.
- **Trend row** (`TrendHeader`): trend icon, direction ("Increasing", semibold ink), the change along the trend line as a `TrendIndicator`, then "from 491 kg to 646 kg" (meta). The icon and the change carry the tone of StatCard.
- **Plot:** inset into the card (page color, control border, lg radius), never lifted with a shadow. Chart.js reads the theme through `ChartColors`, which lets the browser resolve each variable (themes write `hsl()` and `color-mix()`): one series in the theme accent with a 15% fill, points page-colored with an accent ring, the trend line dashed in muted ink (not error red), axes muted, the grid the subtle border at 40%. Every data type uses the accent. The legend shows only when there are two series to tell apart.
- **Phones:** a table instead of the plot (dates left, figures right-aligned, tabular, semibold), inset like the plot, under the same top row.
- **Stats row** (`StatsBox`): Average, Max and Min with their day, Sessions, Recent trend, as StatCards.

### Duration card (`workout-duration`)

How long a workout note takes, one BlockCard.

- **Top row:** "Estimated duration" as title; the analyzed note's name as meta when the block names another note (`workout:`), wrapping instead of pushing the card.
- **Estimate:** the total in big figures (1.5em, semibold, tabular, ink), like the target. Not accent: nothing is done or picked.
- **Breakdown** (`StatCard.row`): Rest time, Set time (detail: the sets counted), Last session (detail: its day) when the log has one.
- **Error:** the message in error text inside the card, no tinted fill.

### Dashboard (`workout-dashboard`)

The desk's overview: a grid of widgets, each one a BlockCard.

- **Header:** the block's `title` (ink, semibold, no rule under it) and the dashboard's ⋮ menu at the right end.
- **Widget card** (`WidgetContainer`): title in the top row with the widget's ⋮ menu, the subtitle under it as meta, then the content. Flat: no shadow, no hover lift, no accent border on hover.
- **Figures:** the summary and the calendar's streaks are a `StatCard.row` (as the first row under the title it has no border above it; two tiles a row on phones). "This week" reached is `is-up`.
- **Lists** (recent workouts, top exercises by volume): the name in ink with its day under it (meta), the figure at the right end in figure type, ink. No accent: nothing in a list is done or picked.
- **Tables** (quick stats, protocol effectiveness, duration comparison): column labels in label type, figures right-aligned, semibold, tabular. On phones each row of the last two is a panel inset into the card (page color, control border, lg radius) with its values under their column names.
- **Tones:** like StatCard. An improvement in success text (volume up, progression ≥ 70%, an estimate within 10%, estimates getting closer), stable muted, anything worse stays ink. No red or amber for a worse figure; amber stays for real problems (an exercise page's errors, an imbalance alert).
- **Heat map:** Period, Side and Measure are three ChipGroups with hidden labels in one row that wraps a whole group at a time: one row on the desk, two on phones (period and side, then measure; narrower chips, still 44px high, filling the width). The body and its analysis are inset into the card.
- **Muscle tags:** copyable tags inset into the card, an accent border on hover and focus, no lift.
- **Phones:** one column, Quick actions first; the volume chart is left out, its top list stays.
- **Widget settings** (`EditWidgetModal`, from each widget's ⋮): "Edit {widget}" as title, one kit control per entry of the widget's `settings`: a number is an `AdjustField` with the schema's lower limit, a sensible upper one (the form's only), a step and its unit (an optional limit opens empty on "All"), a choice a `ChipGroup` (in the order the widget shows it), a list a `ChipGroup.createMulti`, a toggle a checkbox. Remove is the trash at the start of the bar; when the widget is the only one, a muted line says why it can't go.

### Modal forms (insert, edit, log)

A modal is a form on the page color; it uses the same kit as the blocks.

- **Fields:** label above the field, in label type (muted, 0.8em); a checkbox's label is body text, tied to its box (`label[for]`), and the whole 44px row ticks it. Numbers are a `NumberField` (`AdjustField` is the labelled one for forms: whole numbers, − / +, unit at the end of the field), never a number input between red and green buttons.
- **Choices:** one of a few options is a row of `Chip`s (picked: accent fill, `aria-pressed`); a set's protocol is the `ProtocolPicker`, any other one-of-a-few choice with a label a `ChipGroup`, some of a few a `ChipGroup.createMulti` (never zero: say so under it); notes are a `NotesField`. In a settings form the chips wrap, so every option is in sight.
- **Sections:** `ModalBase.createSection` is a card on the modal (card color, control border, xl radius, 12px padding), its heading in title type with no rule under it.
- **Actions:** save and cancel in `Button.createModalActions`, at the right end, one size (44px high), primary first.
- **Errors:** under the field to fix (under a NumberField's whole box, which turns error color), never only a notice. A value the form can't write keeps Update from saving (`createEditButtons`' `validate`); it is never dropped quietly.

## Do's and Don'ts

### Do:

- **Do** take every color from an Obsidian variable or a `--workout-*` token, and declare theme-derived tokens on `body`.
- **Do** use `--workout-text-accent/-error/-success/-warning` for colored text and `--workout-accent-fill` behind `--text-on-accent`.
- **Do** keep every interactive control at least 44×44px on phones, and give buttons a `:focus-visible` ring in `--interactive-accent`.
- **Do** name kit controls with `focusKey` and focus them again after a redraw (`DomUtils.focusByKey`): blocks redraw on every log change.
- **Do** say changes that happen without moving focus through a LiveRegion.
- **Do** nest field selectors two classes deep (`.workout-number-field .workout-number-field-input`) to outrank Obsidian's `input[type="text"]` rules.
- **Do** offer Undo (UndoNotice) for a one-tap action that removes something.

### Don't:

- **Don't** hand a theme variable to Chart.js as a string to parse: resolve it with `ChartColors` (a hex parser turns `hsl()` into `rgba(NaN…)`).
- **Don't** use `--text-faint` for text anyone has to read, and never for a suggestion that gets logged.
- **Don't** use `--background-primary` for a surface that must stand out from the note; that is the page color.
- **Don't** use `:has()`; add a class from the TypeScript that builds the element.
- **Don't** use a bare `1fr` grid track; use `minmax(0, 1fr)`.
- **Don't** ask to confirm an action you can undo; confirm only what can't be undone.
- **Don't** draw the standalone timer's big phone layout inside a block; use the rest strip.
- **Don't** build a block's controls by hand when the kit has them (fields, ticks, chevrons, protocol chips, notes, undo notices).

# Dashboard inventory mode: plan

Status: implemented (2026-11-02), resize included. Builds on `2026-11-02-dashboard-widgets-design.md` (8f0418a).

## Idea

Today a dashboard has one layout: the widgets in `widgets` order, packed by the bento grid (`applyBentoLayout`: 280px min column, 10px rows, each widget spans the rows its content needs). The user picks the order, not the place.

Inventory mode (Resident Evil style) adds a second layout: a grid where **each widget occupies a rectangle of cells** that the user places. Every widget has a **minimum width in columns**, rectangles never overlap, and empty cells stay empty. The list layout stays the default.

## Decisions

1. **Columns follow the width of the note.** The column count is `max(1, floor((width + gap) / (cellMinWidth + gap)))` of the dashboard's container, recomputed on resize (the view already has a `ResizeObserver`). The editor measures the **note**, not the modal (they have different widths): from the dashboard's element when opened from its ⋯ menu, from the active markdown view when inserting. If no width can be measured, the editor asks how many columns to use (a number field, default 2). The block records the columns the grid was made for (`columns:`).
2. **Rows grow with their content** (`grid-auto-rows: auto`). A widget's height is the number of rows it spans; there is no fixed cell height and no scrolling inside widgets.
3. **Resizing** (wider/taller than the minimum) is a second step: first ship move-only with each widget at its minimum size; add resize if it fits.
4. **Phones**: one column, widgets stacked in reading order (top to bottom, then left to right), as the list layout does today.
5. **One line per widget** in the block, so moving a widget rewrites only its line.

## Block syntax

```yaml
layout: grid
columns: 3
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
grid.volume: 3 2 1 1
grid.recentWorkouts: 3 3 1 1
```

`grid.<widget>: column row width height`, 1-based. Widgets without a `grid.` line are not shown. `widgets` is ignored in grid mode; switching back to List writes `widgets` in reading order and removes the `grid.` lines.

**Fewer columns than `columns`** (narrower pane): the widgets are packed again in reading order into the available columns (first fit, width clamped to the columns), so nothing overflows. **More columns**: the grid keeps `columns` tracks, each wider (`1fr`), so the layout looks as designed. One column: stacked (decision 4).

Errors, shown in place of the block like other parameter errors: a rectangle outside `columns`, narrower than the widget's minimum, overlapping another, or not four positive whole numbers.

## Where the logic lives

| Piece | Where | What |
|---|---|---|
| Minimum widths | `widgets/dashboardWidgets.ts` | `minColumns` per widget, next to label and render |
| Layout rules | new `layout/gridLayout.ts` (pure) | `Placement` type; `columnsFor(width)`; `validate` (bounds, min width, overlap); `autoPack(ids, columns)` (first fit, for List → Grid and for narrower panes); `move` returning the new placements or the conflict; `readingOrder` (phones, Grid → List); later `resize` |
| Schema | `dashboardBlock.ts`, `CodeBlockSchema.ts` | `layout: enum [list, grid]` (default `list`), `columns: number`, and one `grid.<id>` field per widget id with a new `placement` kind (four positive integers), generated from `DASHBOARD_WIDGET_IDS` so the typed params stay derived from the schema |
| Grid validation | `gridLayout.validate`, reported with `renderInvalidParams` | Overlap and bounds need all placements together, so they can't be per-field checks; same look as schema errors |
| Rendering | `EmbeddedDashboardView` | `layout: grid` → CSS grid, `grid-column: x / span w; grid-row: y / span h`, auto rows, no bento measuring. On resize: same columns → as saved; fewer → `autoPack` in reading order; one → stacked |
| Editor | new `ui/GridEditor.ts`, used by `InsertDashboardModal` | List / Grid switch; scaled grid at the measured column count; tiles snap to cells; red outline and refused drop on overlap; stash of unplaced widgets; pointer events on the document (the lesson from the list drag); keyboard: arrows move, Delete stashes. Holds no rules: it calls `gridLayout` |
| Width for the editor | `DashboardActionSelect` / `InsertDashboardModal` | Measure the dashboard grid (edit) or the active view's content (insert) and pass the width to the modal |

## Steps (each one releasable)

1. **Measure** in Obsidian, with realistic data: the cell min width that makes the smallest widgets readable (starting point 220px), and each widget's minimum columns (heat map, volume chart and the tables are the wide ones). Record the column counts at typical widths (readable line width on/off, sidebar open/closed).
2. **`gridLayout.ts` with tests** (TDD, pure): `columnsFor`, every validation error, `autoPack` never overlaps and respects minimums, `move` refuses conflicts, `readingOrder`, packing into fewer columns.
3. **Schema and rendering**: `layout`, `columns`, `grid.<id>` fields, grid rendering, narrower panes and phones, errors. Usable by writing YAML.
4. **Grid editor, move only**: List / Grid switch, tiles at minimum size, stash, pointer + keyboard, conflict highlight, column measuring and the fallback question. Edit keeps `changedParams` + `patchCodeBlock`, so only moved widgets' lines change.
5. **Resize** (if it fits): corner handle and Shift+arrows, never below the minimum; `gridLayout.resize` with tests.
6. **Docs and verification**: README section and screenshot, CLAUDE.md block example, `obsidian-verify` at several pane widths and at 390px, real-mouse drag through CDP, and a real phone for touch.

## Risks

- A grid saved at 4 columns and opened in a 2-column pane is repacked, so it looks different from what the user placed. That is the price of decision 1; the editor shows the column count it uses so the user knows.
- With auto rows, a tall widget makes its whole row tall; widgets beside it get empty space below. That is how an inventory with growing rows behaves; measuring in step 1 shows whether it looks acceptable.
- Chart.js charts must resize with their cell; `ChartRenderer` already follows its container in the bento grid, but check it on column changes.
- The grid editor is the largest UI piece in the plugin; touch drag must be verified on a real phone, not only in emulation.

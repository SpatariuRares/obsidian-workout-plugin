# Composable dashboard: the `widgets` parameter and the dashboard modal

Status: implemented. Date: 2026-11-02.

## Problem

`workout-dashboard` was a fixed layout with 5 switches:

- `EmbeddedDashboardView.renderDashboard` called 11 widgets in a hard-coded order.
- Only 5 widgets could be hidden (`showSummary`, `showQuickStats`, `showVolumeAnalytics`, `showRecentWorkouts`, `showQuickActions`). Heat map, protocols, duration, file errors and muscle tags always showed (unless they had no data).
- `InsertDashboardModal` had no options and wrote an empty block. There was no edit modal, and the block had no `id`.

## Goal

The user picks **which** widgets to show and **in what order**, in YAML or in a modal, and can edit an inserted dashboard without rewriting it by hand.

Out of scope (separate steps): `exercise` / `workout` filters on the dashboard; per-widget width; the mismatch between `dateRange` and the fixed periods of quick stats and the heat map; a 2D "inventory" layout mode.

## Syntax

```yaml
title: Push day
dateRange: 90
widgets: [summary, heatMap, volume, recentWorkouts]
recentWorkoutsLimit: 10
```

Widget ids, in the default order: `summary`, `quickStats`, `heatMap`, `volume`, `recentWorkouts`, `protocolDistribution`, `protocolEffectiveness`, `duration`, `quickActions`, `fileErrors`, `muscleTags`.

Rules:

1. **No `widgets`**: every widget, in the default order.
2. **With `widgets`**: only those, in that order; a repeated id counts once.
3. **Unknown id**: a parse error in place of the block, listing the allowed ids (like an invalid `enum` value).
4. A listed widget without data keeps its empty state.

The `show*` flags are removed from the schema (decided during review). Unknown keys are skipped, so a block that still has `showQuickStats: false` shows every widget; `widgets` (or the modal) replaces them.

## Where the logic lives

- **Schema** (`CodeBlockSchema.ts`): `ListField` takes an optional `values`; each item is read like an `enum` (any case, canonical spelling). `dashboardBlock` gains `id` and `widgets: { kind: "list", values: DASHBOARD_WIDGET_IDS }`. The ids live in `dashboard/types.ts`.
- **Registry** (`widgets/dashboardWidgets.ts`): `DASHBOARD_WIDGETS` maps each id to its label and how to render it from a `DashboardWidgetContext`; `resolveWidgets(params)` applies rules 1–2. `renderDashboard` loops over it.
- **Modals**: `InsertDashboardModal` is the form (title, `dateRange`, one card per widget with checkbox, drag grip and ↑/↓ arrows for the keyboard, widget settings shown only while their widget is ticked; buttons stick to the bottom). It writes `widgets` only when selection or order differ from the default, so untouched dashboards get later widgets. `EditDashboardModal` opens on the block's params, patches only what changed (`changedParams` + `patchCodeBlock`). Dragging listens on the document, because moving the row in the DOM drops any pointer capture on the grip.
- **Kebab menu** (`ui/DashboardActionSelect.ts`): on every dashboard. A block with an `id` is found by it; one without is found by the line of its opening fence (`CodeBlockMatch { line }`, from `ctx.getSectionInfo(el)`, read at click time through the view state `DashboardViewState.fenceLine`, kept apart from the block parameters since #65) and gets an `id` when saved.
- **Ids**: `dashboardBlock` is in `BlockIdMigration`'s schemas; the example generators write an `id`.

## Decisions

1. Writing `widgets` only when it differs from the default limits the "explicit list misses future widgets" problem without a third syntax (`hide:`).
2. `fileErrors` and `muscleTags` stay in the registry and the default, so nothing changes for existing dashboards; users can untick them.

# Tables Feature Architecture

## Overview

The tables feature renders sortable workout log tables with date grouping, spacer rows (summary stats), target tracking with achievement badges, and inline edit/delete actions.

**Total**: ~3,980 source lines + ~2,240 test lines across 20+ files

## File Structure

```
app/features/tables/
├── index.ts                          (40)   Barrel export
├── types.ts                          (61)   EmbeddedTableParams, TableRow, TableData, etc.
│
├── views/
│   └── EmbeddedTableView.ts          (346)  Main view orchestrator (extends BaseView)
│
├── components/
│   ├── TableRenderer.ts              (217)  DOM table rendering, row grouping
│   └── TableActions.ts               (92)   Edit/delete event handlers
│
├── business/
│   ├── index.ts                      (13)   Barrel export
│   ├── TableDataProcessor.ts         (150)  Orchestrator: sort, limit, resolve columns
│   ├── TableRowProcessor.ts          (172)  Formats individual rows for display
│   ├── TableColumnResolver.ts        (162)  Dynamic headers, abbreviations, units
│   ├── SpacerRowCalculator.ts        (122)  Summary stats aggregation per date group
│   ├── TargetCalculator.ts           (98)   Progress calculation, achievement checks
│   ├── TableConfig.ts                (91)   Parameter validation, defaults, merging
│   ├── ProtocolResolver.ts           (84)   Protocol string --> badge config mapping
│   ├── TableActionHandler.ts         (58)   DEAD CODE - duplicate of TableActions
│   ├── TableRefresh.ts               (43)   Cache clear + data reload
│   ├── TableDataLoader.ts            (30)   CSV data retrieval with filters
│   └── TableDataCheckers.ts          (49)   Field presence detection (notes, custom fields, protocol)
│
├── ui/
│   ├── index.ts                      (14)   Barrel export
│   ├── AchievementBadge.ts           (145)  Success notification + weight suggestion
│   ├── TargetHeader.ts               (108)  Target display + progress bar
│   ├── GoToExerciseButton.ts         (65)   Exercise file navigation button
│   ├── ActionButtons.ts              (39)   Edit/delete button container
│   ├── TableErrorMessage.ts          (39)   Error rendering wrapper
│   └── TableHeader.ts               (22)   thead creation
│
└── modals/
    └── InsertTableModal.ts           (241)  Code block generation form (extends BaseInsertModal)
```

## Layer Architecture

```
Views Layer
  EmbeddedTableView (entry point, extends BaseView)
      |
Components Layer (Rendering + Actions)
  |-- TableRenderer (static rendering methods, DOM creation)
  |-- TableActions (event handlers for edit/delete)
      |
Business Layer (Pure functions, no UI)
  |-- Data Loading
  |     |-- TableDataLoader (CSV retrieval)
  |     |-- TableDataCheckers (field presence detection)
  |
  |-- Data Processing
  |     |-- TableDataProcessor (orchestrator: sort, limit, resolve columns)
  |     |-- TableRowProcessor (formats individual rows)
  |
  |-- Column Resolution
  |     |-- TableColumnResolver (dynamic headers from exercise definitions)
  |
  |-- Calculations
  |     |-- TargetCalculator (progress %, achievement checks)
  |     |-- SpacerRowCalculator (summary stats per date group)
  |
  |-- Configuration
  |     |-- TableConfig (validation, defaults, merging)
  |     |-- ProtocolResolver (badge config mapping)
  |
  |-- Operations
        |-- TableRefresh (cache invalidation + reload)
```

## Data Flow

### Loading

```
EmbeddedTableView.createTable()
  |
TableDataLoader.getOptimizedCSVData()
  |-- Filters by exercise (if params.exercise)
  |-- Filters by workout (if params.workout)
  |-- Returns: WorkoutLogData[]
```

### Processing

```
TableDataProcessor.processTableData()
  |
  |-- TableRowProcessor.sortAndLimitData()
  |     |-- Sorts descending by date
  |     |-- Limits to specified count (default 50)
  |
  |-- TableDataCheckers.hasCustomField()
  |     |-- Checks for duration, distance, heartRate
  |     |-- Determines which columns to show
  |
  |-- TableColumnResolver.getDefaultColumns()
  |     |-- Returns: Date, Exercise, Reps, Weight, Volume
  |
  |-- TableColumnResolver.determineColumnsForExercise()
  |     |-- Fetches dynamic columns from ExerciseDefinitionService
  |
  |-- TableColumnResolver.addOptionalColumns()
  |     |-- Appends Notes, Protocol, Actions if needed
  |
  |-- TableRowProcessor.processRows()
        |-- Maps log data to displayRow arrays
        |-- Caches date formatting
        |-- Handles custom field mapping
        |-- Returns: TableRow[] with originalLog references
```

### Rendering

```
EmbeddedTableView.renderTableContentOptimized()
  |-- Clear container
  |-- Render action buttons (Add Log + Go To Exercise)
  |-- TargetHeader.render() (target weight/reps + progress bar)
  |-- AchievementBadge.render() (if target achieved)
  |
  |-- TableRenderer.renderTable()
        |-- Create table element
        |-- TableHeader.render() (thead)
        |
        |-- applyRowGroupingOptimized()
              |-- Group rows by dateKey
              |-- For each group:
                    |-- Spacer row (summary stats)
                    |     |-- SpacerRowCalculator.calculate()
                    |           |-- Aggregates volume, weight, reps
                    |           |-- Aggregates duration, distance, heartrate
                    |
                    |-- Data rows:
                          |-- Regular cells (text)
                          |-- Volume cell (styled)
                          |-- Protocol cell --> ProtocolBadge
                          |-- Actions cell --> TableActions.renderActionButtons()
```

### Refresh

```
TableRefresh.refreshTable()
  |-- plugin.clearLogDataCache()
  |-- plugin.getWorkoutLogData() (fresh data)
  |-- Re-execute renderTable() with fresh data
```

### Action Handlers

```
TableActions.handleEdit()
  |-- Opens EditLogModal --> plugin.triggerWorkoutLogRefresh()

TableActions.handleDelete()
  |-- Opens ConfirmModal --> plugin.deleteWorkoutLogEntry() --> refresh
```

## Dead Code

### TableActionHandler.ts (58 lines) - UNUSED

This file contains exact duplicates of methods in `TableActions.ts`:
- `handleEdit()` - duplicate
- `handleDelete()` - duplicate

**Evidence**: Not imported anywhere in feature code. Only imported in its own test file. The active implementation is `TableActions.ts` (in components/).

**Recommendation**: Delete `TableActionHandler.ts` and its test file.

## Key Classes

| Class | Lines | Responsibility |
|-------|-------|---------------|
| **EmbeddedTableView** | 346 | Main orchestrator: data loading, rendering, event lifecycle, target tracking |
| **TableDataProcessor** | 150 | Orchestrates data transformation: sort, limit, resolve columns |
| **TableRenderer** | 217 | Renders DOM table, row grouping with spacer rows, document fragments |
| **TableColumnResolver** | 162 | Dynamic headers from exercise definitions, abbreviations, unit formatting |
| **TableRowProcessor** | 172 | Formats row data for display, caches date formatting |
| **TargetCalculator** | 98 | `calculateBestRepsAtWeight()`, `checkTargetAchieved()`, `calculateProgressPercent()` |
| **SpacerRowCalculator** | 122 | Aggregates summary stats per date group |
| **TableActions** | 92 | Edit/delete handlers with modal integration |
| **AchievementBadge** | 145 | Achievement celebration UI + weight suggestion |
| **TargetHeader** | 108 | Target display with progress bar |
| **TableConfig** | 91 | Parameter validation, defaults, merging |
| **ProtocolResolver** | 84 | Maps protocol strings to badge configs |

## Recommendations

### Remove Dead Code
- Delete `TableActionHandler.ts` (58 lines) + test file - exact duplicate of `TableActions.ts`

### Consider Splitting EmbeddedTableView (346 lines)
Current responsibilities:
1. Rendering orchestration
2. Event lifecycle management (AbortController)
3. Action button delegation
4. Target tracking (achievement badge, progress bar)
5. Error handling (from BaseView)
6. Refresh coordination

Potential extractions:
- Achievement badge logic to separate orchestrator
- Button rendering to dedicated component
- Rendering orchestration from data loading

### Merge Small Files
- `TableDataLoader` (30 lines) and `TableDataCheckers` (49 lines) could be merged into a single data utilities module

## Dependencies

- `@app/features/common/views/BaseView` - Base class
- `@app/features/modals/base/BaseInsertModal` - InsertTableModal extends
- `@app/features/modals/log/EditLogModal` - Table edit action
- `@app/features/modals/common/ConfirmModal` - Table delete action
- `@app/features/charts/components/ChartTableViews` - MobileTable import
- `@app/components/atoms` - Button, SpacerStat, ProtocolBadge, Feedback
- `@app/components/molecules` - ActionButtonGroup
- `@app/components/organism` - LogCallouts
- `@app/services/editor/CodeBlockEditorService` - Update target weight in markdown
- `@app/types/WorkoutLogData` - Core data structure

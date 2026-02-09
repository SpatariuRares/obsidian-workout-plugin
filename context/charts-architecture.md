# Charts Feature Architecture

## Overview

The charts feature provides Chart.js-based workout data visualization with trend analysis, mobile fallbacks, and support for multiple exercise types.

**Total**: ~3,700 lines across 28 files (source + tests)

## File Structure

```
app/features/charts/
├── index.ts                          (29)   Barrel export
├── types.ts                          (49)   CHART_TYPE, CHART_DATA_TYPE enums, EmbeddedChartParams, ChartDataset
│
├── views/
│   └── EmbeddedChartView.ts          (204)  Main view orchestrator (extends BaseView)
│
├── business/
│   ├── ChartDataUtils.ts             (191)  Data aggregation: groups by date, avg vs sum paths
│   ├── ChartDataExtractor.ts         (153)  Custom field extraction, type-to-data mapping
│   └── ChartTypeResolver.ts          (116)  Resolves/validates chart data type against exercise definition
│
├── components/
│   ├── ChartRenderer.ts              (177)  Chart.js lifecycle: create, destroy, trend lines
│   ├── TrendHeader.ts                (205)  Trend direction indicator + variation percentage
│   ├── ChartTableViews.ts            (119)  Fallback table + mobile table (merged from 2 files)
│   ├── ChartContainer.ts             (34)   Container div + canvas creation
│   └── index.ts                      (4)    Barrel export
│
├── config/
│   ├── ChartConfigBuilder.ts         (234)  Chart.js config objects (axes, tooltips, plugins)
│   ├── ChartTheme.ts                 (195)  Color extraction from Obsidian CSS variables
│   ├── ChartConstants.ts             (190)  Available/default chart types per exercise, styling values
│   └── index.ts                      (19)   Barrel export
│
├── ui/
│   ├── ChartLegendItem.ts            (112)  Color box + label molecule (active/dimmed states)
│   └── index.ts                      (4)    Barrel export
│
└── modals/
    └── InsertChartModal.ts           (281)  User form for chart code block insertion
```

## Data Model: WorkoutLogData

Defined in `app/types/WorkoutLogData.ts`:

```typescript
export interface WorkoutLogData {
  date: string;
  exercise: string;
  reps: number;        // Always present (strength-specific)
  weight: number;      // Always present (strength-specific)
  volume: number;      // Always present (strength-specific)
  file?: TFile;
  origine?: string;
  workout?: string;
  notes?: string;
  timestamp?: number;
  protocol?: WorkoutProtocol;
  customFields?: Record<string, string | number | boolean>;  // Dynamic exercise params
}
```

### The Data Model Asymmetry

`reps`, `weight`, `volume` are top-level fields on every log entry. All other exercise-type parameters (duration, distance, pace, heartRate, custom metrics) live inside `customFields`.

This creates two distinct aggregation paths in the chart data processing.

**Why this structure exists**: The plugin started as a strength-training tracker. `reps/weight/volume` were the only metrics. When cardio, timed, and custom exercise types were added, `customFields` was introduced to avoid breaking existing CSV data.

**TODO in codebase** (`WorkoutLogData.ts:74-78`):
```
Consider removing reps/weight/volume from standard columns in a future
breaking change. These are strength-specific parameters and could be moved
to customFields like other exercise type parameters.
```

### Impact

- **100+ consumers** across the codebase access `log.reps`, `log.weight`, `log.volume` directly
- Charts must handle both paths: direct field access AND `ChartDataExtractor.getCustomFieldNumber(log.customFields, key)`
- Custom field extraction is case-insensitive (handles inconsistent CSV data)

## Two Aggregation Paths

Both paths converge in `ChartDataUtils.processChartData()`:

### Path 1: Single Exercise (EXERCISE display type) - Averages

Groups by date, divides totals by count to show **average per session**:

```typescript
volumeData.push(values.count > 0 ? values.volume / values.count : 0);
weightData.push(values.count > 0 ? values.weight / values.count : 0);
// ... same for reps, duration, distance, custom, heartRate
paceData.push(avgDistance > 0 ? avgDuration / avgDistance : 0);
```

### Path 2: Multiple Exercises (WORKOUT/COMBINED/ALL) - Totals

Groups by date, pushes raw **sums** (no division):

```typescript
volumeData.push(values.volume);
weightData.push(values.weight);
// ... same for reps, duration, distance, custom
paceData.push(values.distance > 0 ? values.duration / values.distance : 0);
heartRateData.push(values.count > 0 ? values.heartRate / values.count : 0); // HR always averaged
```

### Unification Approach

To unify the data model, a possible migration would:

1. Move `reps/weight/volume` into `customFields` for new entries
2. Provide a CSV migration command that restructures existing data
3. Update all 100+ consumers to use `customFields` consistently
4. Keep backward compatibility during transition via a normalization layer

## Data Flow

```
CSV/Data Source
    |
WorkoutLogData[] (with customFields)
    |
EmbeddedChartView.createChart()
    |-- ChartTypeResolver.resolve()    --> determines CHART_DATA_TYPE
    |-- ChartTypeResolver.validate()   --> validates against exercise type
    |-- Filter by date range
    |-- Filter by exercise/workout
    |
ChartDataUtils.processChartData()
    |-- Groups by date
    |-- Aggregates standard fields (volume, weight, reps)
    |-- Extracts customFields (duration, distance, heartRate, custom)
    |-- Chooses aggregation path:
    |   |-- EXERCISE type --> AVERAGE values
    |   |-- WORKOUT/COMBINED/ALL --> SUM values
    |-- Calculates derived metrics (pace = duration/distance)
    |
ChartDataExtractor.getChartDataForType()
    |-- Returns {data[], label, color}
    |
ChartRenderer.renderChart()
    |-- Builds Chart.js config via ChartConfigBuilder
    |-- Applies styling via ChartTheme
    |-- Renders Canvas with Chart.js
    |-- Fallback to ChartTableViews if Chart.js unavailable
    |
EmbeddedChartView renders:
    |-- TrendHeader (direction + variation)
    |-- ChartRenderer (interactive chart)
    |-- MobileTable (mobile-only fallback)
    |-- StatsBox (summary statistics, imported from dashboard/ui)
```

## Key Classes

| Class | Responsibility |
|-------|---------------|
| **EmbeddedChartView** | Main orchestrator: data filtering, type resolution, chart creation, lifecycle/cleanup |
| **ChartDataUtils** | Core data processor: date grouping, aggregation (avg vs sum), dataset labeling |
| **ChartDataExtractor** | Extracts numeric values from customFields (case-insensitive), maps chart types to data arrays |
| **ChartTypeResolver** | Bridges exercise definitions with chart rendering, validates types |
| **ChartRenderer** | Chart.js lifecycle: creates, destroys, tracks instances, adds trend lines |
| **ChartConfigBuilder** | Builds complete Chart.js config (axes, tooltips, plugins, dataset styling) |
| **ChartTheme** | Extracts colors from Obsidian CSS variables, creates color schemes |
| **ChartConstants** | Static config: available/default chart types per exercise type |
| **TrendHeader** | Renders trend direction indicator with variation %, handles inverted metrics |
| **ChartTableViews** | Merged fallback table + mobile table with backward-compatible exports |
| **InsertChartModal** | Code block generation form, dynamic data type options based on exercise |

## Refactoring Completed

These refactoring steps were completed in the current session:

### Merges
- **DatasetStyler** merged into **ChartConfigBuilder** (dataset styling is part of config building)

### Extractions
- **ChartDataExtractor** extracted from inline usage (reusable custom field parsing)
- **ChartTypeResolver** extracted from EmbeddedChartView (testable type resolution)

### Renames
- `ChartColors.ts` --> `ChartTheme.ts` (better describes the module's purpose)
- `MobileTable.ts` --> `ChartTableViews.ts` (contains both fallback and mobile table)

### Deletions
- `ChartFallbackTable.ts` - logic moved into `ChartTableViews.ts`
- `DatasetStyler.ts` - merged into `ChartConfigBuilder.ts`

### Backward Compatibility
All renamed/merged exports maintain backward-compatible aliases:
- `ChartFallbackTable` and `MobileTable` exported from `ChartTableViews.ts`
- `DatasetStyler` exported from `ChartConfigBuilder.ts`
- `ChartColors` exported from `ChartTheme.ts`

## Chart Types

```typescript
enum CHART_TYPE {
  EXERCISE = "exercise",   // Single exercise (averages)
  WORKOUT = "workout",     // Multiple exercises (sums)
  COMBINED = "combined",   // Combined view
  ALL = "all",             // All data
}

enum CHART_DATA_TYPE {
  VOLUME = "volume",       // Standard field
  WEIGHT = "weight",       // Standard field
  REPS = "reps",           // Standard field
  DURATION = "duration",   // customFields
  DISTANCE = "distance",   // customFields
  PACE = "pace",           // Derived: duration/distance
  HEART_RATE = "heartRate", // customFields
}
```

## Dependencies

- **Chart.js** - Canvas-based chart rendering
- `@app/features/dashboard/ui/StatsBox` - Statistics box (cross-feature dependency)
- `@app/features/common/views/BaseView` - Base class for error handling/logging
- `@app/types/WorkoutLogData` - Core data structure
- `@app/services/exercise/ExerciseDefinitionService` - Exercise type info for chart type resolution

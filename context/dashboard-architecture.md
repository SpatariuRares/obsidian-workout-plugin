# Dashboard Feature Architecture

## Overview

The dashboard provides a bento-grid layout with 11 independent widgets for workout analytics: summary stats, volume trends, protocol analysis, muscle heat maps, duration comparisons, and more.

**Total**: ~3,500-4,000 source lines across ~45+ files

## File Structure

```
app/features/dashboard/
├── index.ts                          (32)   Barrel export
├── types.ts                          (20)   EmbeddedDashboardParams
│
├── views/
│   └── EmbeddedDashboardView.ts      (435)  Main orchestrator + bento grid layout
│
├── modals/
│   └── InsertDashboardModal.ts              Code block generation form
│
├── ui/
│   ├── StatsBox.ts                   (252)  Stats visualization (USED BY CHARTS, not dashboard)
│   └── index.ts                      (2)    Barrel export
│
├── business/
│   ├── DashboardCalculations.ts      (45)   DEAD CODE - pure facade
│   └── index.ts                      (8)    Barrel export
│
├── __tests__/
│   └── DashboardCalculations.test.ts (423)  Tests the facade
│
└── widgets/
    ├── index.ts                      (17)   Widget barrel export
    │
    ├── summary/
    │   ├── SummaryWidget.ts          (80)   Full-width: workouts, streak, volume, PRs
    │   ├── business/calculateSummaryMetrics.ts
    │   └── index.ts
    │
    ├── quick-stats/
    │   ├── QuickStatsCards.ts        (105)  Full-width: week/month/year stat cards
    │   ├── business/calculatePeriodStats.ts
    │   └── index.ts
    │
    ├── volume-analytics/
    │   ├── VolumeAnalytics.ts        (86)   Wide: 30-day volume trend chart + breakdown
    │   ├── business/volumeAnalyticsData.ts
    │   └── index.ts
    │
    ├── recent-workouts/
    │   ├── RecentWorkouts.ts         (43)   Regular: last 5 workouts list
    │   ├── business/getRecentWorkouts.ts
    │   └── index.ts
    │
    ├── protocol-distribution/
    │   ├── ProtocolDistribution.ts   (408)  Wide: clickable pie chart + legend + filter
    │   └── index.ts
    │
    ├── protocol-effectiveness/
    │   ├── ProtocolEffectiveness.ts  (368)  Wide: protocol stats table
    │   └── index.ts
    │
    ├── duration-comparison/
    │   ├── DurationComparison.ts     (400)  Wide: actual vs estimated duration table
    │   └── index.ts
    │
    ├── quick-actions/
    │   ├── QuickActions.ts           (57)   Regular: Add Log + View Exercises buttons
    │   └── index.ts
    │
    ├── muscle-tags/
    │   ├── MuscleTagsWidget.ts       (109)  Wide: copyable muscle tag badges grid
    │   └── index.ts
    │
    ├── file-errors/
    │   ├── WidgetsFileError.ts       (161)  Regular: exercise file validation errors
    │   └── index.ts
    │
    └── muscle-heat-map/
        ├── MuscleHeatMap.ts          (133)  Wide: front/back body SVG + controls
        ├── HeatMapControls.ts               View toggle + time frame filter
        ├── types.ts                         HeatMap-specific types
        ├── index.ts
        ├── business/
        │   ├── MuscleDataCalculator.ts      Calculates muscle group volumes
        │   ├── MuscleBalanceAnalyzer.ts      Detects muscle imbalances
        │   ├── MuscleTagMapper.ts           Maps exercises to muscles
        │   └── index.ts              (15)
        └── body/
            ├── Body.ts               (164)  Body visualization class
            ├── index.ts              (62)   Type exports (BodyData, etc.)
            ├── renderers/
            │   ├── BodyViewSvg.ts           SVG body rendering
            │   └── ViewDataPreparer.ts      Prepares data for SVG
            └── utils/
                ├── SVGBuilder.ts     (224)  SVG element creation utilities
                ├── IntensityCalculator.ts (84)  Intensity normalization (0-1)
                ├── HeatMapColors.ts         Color mapping for intensity
                └── index.ts
```

## 11 Widgets

### Full-Width (grid-column: 1/-1)

| Widget | Lines | Description |
|--------|-------|-------------|
| **SummaryWidget** | 80 | 4 metric cards: Total Workouts, Current Streak, Total Volume, Personal Records |
| **QuickStatsCards** | 105 | 3 period cards (Week/Month/Year) with workouts, volume, avg volume |

### Wide (grid-column: span 2)

| Widget | Lines | Description |
|--------|-------|-------------|
| **VolumeAnalytics** | 86 | Line chart (30-day trend) + top exercises breakdown |
| **ProtocolDistribution** | 408 | Clickable pie chart + custom legend + filter indicator |
| **ProtocolEffectiveness** | 368 | Stats table: protocol, entries, volume change %, progression rate % |
| **DurationComparison** | 400 | Table: actual vs estimated duration, variance trend analysis |
| **MuscleHeatMap** | 133 | Front/back body SVG with heat coloring + imbalance analysis |
| **MuscleTagsWidget** | 109 | Copyable muscle tag badges grid |

### Regular (auto column)

| Widget | Lines | Description |
|--------|-------|-------------|
| **RecentWorkouts** | 43 | Last 5 workouts with date and volume |
| **QuickActions** | 57 | Add Workout Log + View Exercises buttons |
| **WidgetsFileError** | 161 | Exercise file validation (missing tags, read errors) |

## Bento Grid Pattern

### CSS Grid

```css
.workout-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-auto-rows: 10px;
  gap: 16px;
  grid-auto-flow: dense;  /* Fills gaps with smaller widgets */
}
```

### JavaScript Dynamic Row Spanning

`EmbeddedDashboardView.applyBentoLayout()`:
1. Temporarily sets `grid-auto-rows: auto` for natural height measurement
2. Measures each widget's content height
3. Calculates row spans: `Math.ceil((contentHeight + gap) / (rowHeight + gap))`
4. Sets `grid-row-end: span <calculated>` on each widget
5. Uses ResizeObserver (debounced 150ms) for responsive recalculation

### Responsive Breakpoints
- Mobile (<768px): Single column, all widgets full-width, auto rows
- Tablet (768px-1200px): Auto-fill columns with 280px minimum
- Desktop (1200px+): Same grid, slightly reduced gap (12px)

## Per-Widget Data Flow

```
EmbeddedDashboardView.createDashboard()
  |
  |-- Load WorkoutLogData[]
  |-- Apply protocol filter if active
  |     displayData = activeProtocolFilter ? filterByProtocol(data) : data
  |
  |-- renderDashboard() orchestrates 11 widgets:
  |
  |   SummaryWidget.render(gridEl, displayData, params)
  |     |-- calculateSummaryMetrics(data) --> streak, volume, PRs
  |
  |   QuickStatsCards.render(gridEl, displayData, params)
  |     |-- calculatePeriodStats(data, 7/30/365) --> per-period stats
  |
  |   MuscleHeatMap.render(gridEl, displayData, params, plugin)
  |     |-- MuscleDataCalculator.calculateMuscleGroupVolumes()
  |     |-- Body.render() --> SVG
  |     |-- MuscleBalanceAnalyzer.renderToInfoPanel()
  |
  |   VolumeAnalytics.render(gridEl, displayData, params)
  |     |-- prepareVolumeTrendData(data, 30) --> chart data
  |     |-- ChartRenderer.renderChart()
  |
  |   RecentWorkouts.render(gridEl, displayData, params)
  |     |-- getRecentWorkouts(data, 5)
  |
  |   ProtocolDistribution.render(gridEl, data, params, plugin, callback)
  |     |-- Uses ORIGINAL data (not filtered) for pie chart
  |     |-- onFilterChange callback --> re-renders entire dashboard
  |
  |   ProtocolEffectiveness.render(gridEl, data, params, plugin)
  |     |-- Uses ORIGINAL data for statistical validity (min 5 entries)
  |
  |   DurationComparison.render(gridEl, data, params)
  |     |-- calculateWorkoutSessions() --> group by workout+date
  |     |-- calculateVarianceTrend() --> improving/declining/stable
  |
  |   QuickActions.render(gridEl, params, plugin)
  |   MuscleTagsWidget.render(gridEl, params, plugin)
  |   WidgetsFileError.render(gridEl, plugin) [async]
  |
  |-- applyBentoLayout(gridEl) --> dynamic row spanning
  |-- observeGridResize(gridEl)  --> responsive recalculation
```

## Dead Code

### DashboardCalculations Facade (45 lines)

Pure facade that delegates every method to individual business functions:

```typescript
export class DashboardCalculations {
  static calculateSummaryMetrics(data) { return calculateSummaryMetrics(data); }
  static calculatePeriodStats(data, days) { return calculatePeriodStats(data, days); }
  // ... all methods are one-line passthroughs
}
```

**Not used in dashboard code** - widgets import functions directly. Only consumed by its own test file.

**Recommendation**: Remove facade. Tests should import functions directly.

### SVGBuilder - Potentially Unused Methods

Methods `createDefs()`, `createRadialGradient()`, `createLinearGradient()`, `createStop()`, `appendChildren()` may be unused (no gradient colors detected in heatmap rendering).

### IntensityCalculator - Potentially Unused Methods

Only `normalize()` is clearly used. `normalizeBilateral()`, `normalizeMultiple()`, `normalizeAverage()`, `setMaxValue()`, `getMaxValue()` are potentially unused.

### Body Class - Potentially Unused Methods

`updateBodyData()`, `getBodyData()` are implemented but never called in the dashboard. `setView()` may be called by HeatMapControls.

## StatsBox Misplacement

**Location**: `app/features/dashboard/ui/StatsBox.ts` (252 lines)

StatsBox is imported and used by `EmbeddedChartView` (charts feature), **not** by any dashboard widget.

**Recommendation**: Move to `app/features/charts/ui/StatsBox.ts` for proper feature separation.

## Recommendations

### Split Large Widgets

**ProtocolDistribution (408 lines)**:
```
ProtocolDistribution.ts (100 lines - orchestrator)
├── business/ProtocolStatsCalculator.ts (~130 lines)
├── components/ProtocolPieChart.ts (~120 lines)
└── components/ProtocolLegend.ts (~80 lines)
```

**ProtocolEffectiveness (368 lines)**:
```
ProtocolEffectiveness.ts (100 lines - orchestrator)
├── business/EffectivenessCalculator.ts (~200 lines)
└── components/EffectivenessTable.ts (~100 lines)
```

**DurationComparison (400 lines)**:
```
DurationComparison.ts (120 lines - orchestrator)
├── business/SessionCalculator.ts (~170 lines)
└── components/DurationTable.ts (~130 lines)
```

### Remove Dead Code
- Delete `DashboardCalculations.ts` facade + its test
- Verify and remove unused SVGBuilder/IntensityCalculator/Body methods

### Move StatsBox
- Move `StatsBox.ts` from `dashboard/ui/` to `charts/ui/`

## Dependencies

- **Chart.js** - VolumeAnalytics chart, ProtocolDistribution pie chart
- `@app/features/common/views/BaseView` - Base class
- `@app/features/charts/components/ChartRenderer` - Chart rendering in VolumeAnalytics
- `@app/features/charts/ui/ChartLegendItem` - Legend items in ProtocolDistribution
- `@app/components/atoms` - StatCard, Button, Canvas, ProtocolBadge, ListItem
- `@app/components/molecules` - FilterIndicator
- `@app/services/exercise/MuscleTagService` - Muscle tag data
- `@app/utils/frontmatter/FrontmatterParser` - File validation in WidgetsFileError

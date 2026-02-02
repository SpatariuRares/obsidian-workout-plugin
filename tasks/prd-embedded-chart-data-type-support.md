# PRD: Embedded Chart Data Type Support

## Introduction

Fix critical bugs in the EmbeddedChartView system where trend calculations, units, and visual indicators are hardcoded for strength exercises (volume/weight/reps) and fail to properly support other exercise types like pace, duration, distance, and heart rate.

The core issue: metrics like **pace** (min/km) are "lower is better" but the system treats all increases as improvements (green), causing incorrect trend indicators and confusing users.

## Goals

- Fix inverted trend logic for "lower is better" metrics (pace)
- Replace hardcoded "kg" units with dynamic units based on data type
- Ensure trend colors correctly reflect improvement/decline for all data types
- Create centralized formatting utilities for duration and pace display
- Propagate `CHART_DATA_TYPE` through all downstream components

## User Stories

### US-001: Add isLowerBetter logic to TrendCalculator
**Description:** As a user tracking pace, I want to see green (improving) when my pace decreases, so that the trend indicator accurately reflects my performance improvement.

**Acceptance Criteria:**
- [ ] `TrendCalculator.getTrendIndicators()` accepts optional `dataType` parameter
- [ ] For `CHART_DATA_TYPE.PACE`, negative slope returns "Improving" (green)
- [ ] For `CHART_DATA_TYPE.PACE`, positive slope returns "Declining" (red)
- [ ] All other data types maintain current behavior (positive = green)
- [ ] Existing tests pass
- [ ] New tests cover pace trend inversion
- [ ] Typecheck/lint passes

### US-002: Create centralized units map
**Description:** As a developer, I need a single source of truth for data type units, so that all components display consistent unit labels.

**Acceptance Criteria:**
- [ ] Create `UNITS_MAP` constant in `app/constants/` mapping each `CHART_DATA_TYPE` to its unit string
- [ ] Units: volume="kg", weight="kg", reps="", duration="sec", distance="km", pace="min/km", heartRate="bpm"
- [ ] Export from constants barrel
- [ ] Typecheck/lint passes

### US-003: Create FormatUtils with duration and pace formatters
**Description:** As a user, I want duration displayed as "1h 30m" instead of "5400 sec" and pace as "5:30" instead of "5.5", so that values are human-readable.

**Acceptance Criteria:**
- [ ] Create `app/utils/FormatUtils.ts`
- [ ] `formatDuration(seconds: number): string` - returns "30s", "5m 30s", or "1h 30m" format
- [ ] `formatPace(minPerKm: number): string` - returns "5:30" format
- [ ] `formatValue(value: number, dataType: CHART_DATA_TYPE): string` - dispatcher that applies correct formatter
- [ ] Unit tests for edge cases (0, negative, very large values)
- [ ] Typecheck/lint passes

### US-004: Fix StatsBox hardcoded units
**Description:** As a user viewing pace statistics, I want to see "min/km" instead of "kg", so that the displayed unit matches my data type.

**Acceptance Criteria:**
- [ ] `StatsBox.render()` accepts `dataType: CHART_DATA_TYPE` parameter
- [ ] Average, max, min values display correct unit from `UNITS_MAP`
- [ ] Recent trend displays correct unit
- [ ] Title dynamically changes: "Volume Statistics", "Pace Statistics", etc.
- [ ] Duration and pace values use `FormatUtils` formatters
- [ ] Typecheck/lint passes

### US-005: Fix StatsBox trend color inversion
**Description:** As a user tracking pace, I want the recent trend to show red when pace increases (slower) and green when pace decreases (faster), so that colors accurately indicate improvement.

**Acceptance Criteria:**
- [ ] `StatsBox.calculateRecentTrend()` accepts `dataType` parameter
- [ ] For pace: positive change = red (declining), negative change = green (improving)
- [ ] For other types: maintain current behavior (positive = green)
- [ ] Typecheck/lint passes

### US-006: Fix TrendHeader direction logic
**Description:** As a user, I want the trend arrow direction and color to correctly reflect whether I'm improving or declining based on my exercise type.

**Acceptance Criteria:**
- [ ] `TrendHeader.render()` accepts optional `dataType` parameter
- [ ] For pace: negative percent = "up" arrow (improving), positive = "down" arrow (declining)
- [ ] For other types: maintain current behavior
- [ ] Arrow color matches trend direction (green=improving, red=declining)
- [ ] Typecheck/lint passes

### US-007: Propagate dataType through EmbeddedChartView
**Description:** As a developer, I need the resolved `CHART_DATA_TYPE` passed to all downstream components, so that each component can apply type-specific logic.

**Acceptance Criteria:**
- [ ] `EmbeddedChartView` passes `resolvedType` to `TrendCalculator.getTrendIndicators()`
- [ ] `EmbeddedChartView` passes `resolvedType` to `TrendHeader.render()`
- [ ] `EmbeddedChartView` passes `resolvedType` to `StatsBox.render()`
- [ ] No breaking changes to components that don't pass dataType (graceful fallback)
- [ ] Typecheck/lint passes

### US-008: Extend MobileTable column labels
**Description:** As a user viewing data on mobile, I want column headers to show the correct label for all data types, not just volume/weight/reps.

**Acceptance Criteria:**
- [ ] Create `COLUMN_LABELS` map for all `CHART_DATA_TYPE` values
- [ ] Labels include units: "Volume (kg)", "Pace (min/km)", "Heart Rate (bpm)", etc.
- [ ] `MobileTable` uses map instead of ternary chain
- [ ] Unknown types fall back to displaying the type name
- [ ] Typecheck/lint passes

## Functional Requirements

- FR-1: `TrendCalculator.getTrendIndicators(slope, data, dataType?)` must invert trend logic when `dataType === CHART_DATA_TYPE.PACE`
- FR-2: All unit strings must come from a centralized `UNITS_MAP` constant
- FR-3: `FormatUtils.formatDuration()` must convert seconds to human-readable format (s/m/h)
- FR-4: `FormatUtils.formatPace()` must convert decimal minutes to MM:SS format
- FR-5: `StatsBox` must display dynamic titles and units based on `dataType`
- FR-6: `StatsBox.calculateRecentTrend()` must invert color logic for pace
- FR-7: `TrendHeader` must invert arrow direction for pace (down arrow = declining performance)
- FR-8: `EmbeddedChartView` must propagate `resolvedType` to TrendCalculator, TrendHeader, and StatsBox
- FR-9: `MobileTable` must support all `CHART_DATA_TYPE` values in column headers
- FR-10: All components must gracefully handle missing `dataType` parameter (backward compatible)

## Non-Goals

- No user-configurable unit settings (kg vs lbs, km vs miles) - use sensible defaults
- No user-configurable "lower is better" toggles - derive from data type
- No changes to chart colors or visual styling beyond trend indicators
- No new exercise types beyond those already defined in `CHART_DATA_TYPE`
- No changes to data storage or CSV format

## Technical Considerations

### Files to Modify

1. `app/services/data/TrendCalculator.ts` - Add dataType parameter, invert logic for pace
2. `app/features/dashboard/ui/StatsBox.ts` - Dynamic units, titles, trend colors
3. `app/features/charts/components/TrendHeader.ts` - Invert direction for pace
4. `app/features/tables/ui/MobileTable.ts` - Extend column labels map
5. `app/views/EmbeddedChartView.ts` - Propagate resolvedType to components
6. `app/constants/ui.constants.ts` - Add UNITS_MAP and COLUMN_LABELS

### New Files

1. `app/utils/FormatUtils.ts` - Centralized formatters for duration, pace, and generic values

### Backward Compatibility

- All new parameters are optional with sensible defaults
- Existing code blocks continue to work unchanged
- Components without dataType parameter fall back to current behavior (strength/volume defaults)
- Deprecation warnings can be added in future versions

### Type Safety

- Use `CHART_DATA_TYPE` enum consistently
- Add helper function `isLowerBetter(dataType: CHART_DATA_TYPE): boolean` for reuse

## Success Metrics

- Pace charts show correct trend colors (green when pace improves/decreases)
- StatsBox displays correct units for all data types
- Duration displays in human-readable format (not raw seconds)
- Pace displays in MM:SS format (not decimal)
- All existing tests pass
- New tests cover inverted logic scenarios

## Open Questions

- Should `isLowerBetter()` be extended to support custom exercise types in the future?
- Should duration formatting prefer "1:30:00" format or "1h 30m" format?
- Should very small pace values (< 1 min/km) show seconds precision?

import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";
import {
  DASHBOARD_WIDGET_IDS,
  DashboardWidgetId,
  HEAT_MAP_METRICS,
  HEAT_MAP_TIME_FRAMES,
  HEAT_MAP_VIEWS,
  PROTOCOL_CHART_TYPES,
  PROTOCOL_SORTS,
  QUICK_ACTION_IDS,
  QUICK_STATS_METRIC_IDS,
  QUICK_STATS_PERIOD_IDS,
  SUMMARY_METRIC_IDS,
} from "@app/features/dashboard/types";

/** `grid.<widget>: column row width height`, one line per widget (layout: grid) */
const gridFields = Object.fromEntries(
  // eslint-disable-next-line i18next/no-literal-string -- block parameter names
  DASHBOARD_WIDGET_IDS.map((id) => [`grid.${id}`, { kind: "cell" }]),
) as { [Id in DashboardWidgetId as `grid.${Id}`]: { kind: "cell" } };

/** The `workout-dashboard` code block: its parameters, types and defaults */
export const dashboardBlock = defineCodeBlock("workout-dashboard", {
  /** Written by the insert modal so the block can be edited in place */
  id: { kind: "string" },
  title: { kind: "string" },
  /** Days to include in analytics; 0 = all history */
  dateRange: { kind: "number", min: 0 },
  /** Which widgets to show, in this order; unset: all of them */
  widgets: { kind: "list", values: DASHBOARD_WIDGET_IDS },
  /** list: widgets in `widgets` order; grid: each widget in its cells */
  layout: { kind: "enum", values: ["list", "grid"] },
  /** grid: the columns the grid was made for (it follows the note's width) */
  columns: { kind: "number", min: 1 },
  ...gridFields,
  recentWorkoutsLimit: { kind: "number", min: 1, default: 5 },
  volumeTrendDays: { kind: "number", min: 1, default: 30 },
  /** summary: the cards shown; unset: all of them */
  summaryMetrics: { kind: "list", values: SUMMARY_METRIC_IDS },
  /** volume: exercises in the top list, and whether the list shows at all */
  volumeTopLimit: { kind: "number", min: 1, default: 5 },
  volumeShowBreakdown: { kind: "boolean", default: true },
  /** trainingCalendar: weeks shown */
  calendarWeeks: { kind: "number", min: 1, max: 53, default: 53 },
  calendarShowStats: { kind: "boolean", default: true },
  /** quickStats: the columns and the rows shown; unset: all of them */
  quickStatsPeriods: { kind: "list", values: QUICK_STATS_PERIOD_IDS },
  quickStatsMetrics: { kind: "list", values: QUICK_STATS_METRIC_IDS },
  /** heatMap: what its toggles start on */
  heatMapTimeFrame: { kind: "enum", values: HEAT_MAP_TIME_FRAMES, default: "week" },
  heatMapMetric: { kind: "enum", values: HEAT_MAP_METRICS, default: "volume" },
  heatMapView: { kind: "enum", values: HEAT_MAP_VIEWS, default: "front" },
  heatMapShowImbalance: { kind: "boolean", default: true },
  /** protocolDistribution: days counted */
  protocolDays: { kind: "number", min: 1, default: 30 },
  protocolChartType: { kind: "enum", values: PROTOCOL_CHART_TYPES, default: "pie" },
  /** protocolEffectiveness: sets a protocol needs to be compared */
  protocolMinEntries: { kind: "number", min: 1, default: 5 },
  protocolSortBy: { kind: "enum", values: PROTOCOL_SORTS, default: "progressionRate" },
  /** duration: workouts compared, and the rest between sets in the estimate */
  durationRecentCount: { kind: "number", min: 1, default: 5 },
  durationRestSeconds: { kind: "number", min: 0, default: 90 },
  durationShowTrend: { kind: "boolean", default: true },
  /** quickActions: the buttons shown; unset: both */
  quickActionsShown: { kind: "list", values: QUICK_ACTION_IDS },
  /** fileErrors: rows shown (unset: all), the most muscle tags a page may have */
  fileErrorsMaxItems: { kind: "number", min: 1 },
  fileErrorsMaxTags: { kind: "number", min: 1, default: 3 },
  fileErrorsCheckSharedNames: { kind: "boolean", default: true },
  /** muscleTags: one block of badges per muscle group */
  muscleTagsGroupByMuscle: { kind: "boolean", default: false },
});

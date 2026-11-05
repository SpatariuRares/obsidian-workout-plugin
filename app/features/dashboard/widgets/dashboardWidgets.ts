import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import {
  DASHBOARD_WIDGET_IDS,
  DashboardWidgetId,
  EmbeddedDashboardParams,
  ProtocolFilterCallback,
} from "@app/features/dashboard/types";
import { SummaryWidget } from "@app/features/dashboard/widgets/summary/SummaryWidget";
import { QuickStatsCards } from "@app/features/dashboard/widgets/quick-stats/QuickStatsCards";
import { MuscleHeatMap } from "@app/features/dashboard/widgets/muscle-heat-map/MuscleHeatMap";
import { VolumeAnalytics } from "@app/features/dashboard/widgets/volume-analytics/VolumeAnalytics";
import { RecentWorkouts } from "@app/features/dashboard/widgets/recent-workouts/RecentWorkouts";
import { ProtocolDistribution } from "@app/features/dashboard/widgets/protocol-distribution/ProtocolDistribution";
import { ProtocolEffectiveness } from "@app/features/dashboard/widgets/protocol-effectiveness/ProtocolEffectiveness";
import { DurationComparison } from "@app/features/dashboard/widgets/duration-comparison/DurationComparison";
import { QuickActions } from "@app/features/dashboard/widgets/quick-actions/QuickActions";
import { WidgetsFileError } from "@app/features/dashboard/widgets/file-errors/WidgetsFileError";
import { MuscleTagsWidget } from "@app/features/dashboard/widgets/muscle-tags/MuscleTagsWidget";
import { TrainingCalendarWidget } from "@app/features/dashboard/widgets/training-calendar/TrainingCalendarWidget";
import type { WidgetSetting } from "@app/features/dashboard/widgets/widgetSettings";
import {
  HEAT_MAP_METRIC_SETTING,
  HEAT_MAP_TIME_FRAME_SETTING,
  HEAT_MAP_VIEW_SETTING,
} from "@app/features/dashboard/widgets/muscle-heat-map/heatMapSettings";
import { CONSTANTS } from "@app/constants";
import { t } from "@app/i18n";

/** What a widget can draw from */
export interface DashboardWidgetContext {
  grid: HTMLElement;
  /** Sets in the period, narrowed to the protocol chosen in the pie chart */
  data: WorkoutLogData[];
  /** Sets in the period, whatever the chosen protocol */
  periodData: WorkoutLogData[];
  params: EmbeddedDashboardParams;
  plugin: WorkoutPluginContext;
  /** Unique per rendered dashboard, so two dashboards keep separate charts */
  dashboardId: string;
  /** The protocol chosen in the distribution widget, if any */
  activeProtocolFilter: string | null;
  onProtocolFilterChange: ProtocolFilterCallback;
  /** Every logged set */
  history(): Promise<WorkoutLogData[]>;
}

interface DashboardWidget {
  /** Shown in the dashboard modal */
  label(): string;
  /** The block parameters this widget reads; most have none */
  settings?: WidgetSetting[];
  /** Grid layout: the fewest columns its content reads well in */
  minColumns: number;
  render(ctx: DashboardWidgetContext): void | Promise<void>;
}

/** Every widget a `workout-dashboard` block can show, by id */
export const DASHBOARD_WIDGETS: Record<
  DashboardWidgetId,
  DashboardWidget
> = {
  summary: {
    label: () => t("dashboard.summary.title"),
    settings: [
      {
        kind: "multi",
        key: "summaryMetrics",
        label: () => t("dashboard.widgetModal.summaryMetrics"),
        options: [
          {
            value: "workouts",
            label: () => t("dashboard.summary.totalWorkouts"),
          },
          {
            value: "streak",
            label: () => t("dashboard.summary.currentStreak"),
          },
          {
            value: "volume",
            label: () => t("dashboard.summary.totalVolume"),
          },
          {
            value: "records",
            label: () => t("dashboard.summary.personalRecords"),
          },
        ],
      },
    ],
    minColumns: 1,
    // Records are judged against all history, not just this period
    render: async (ctx) =>
      SummaryWidget.render(
        ctx.grid,
        ctx.data,
        ctx.params,
        await ctx.history(),
        ctx.plugin.settings.weeklyGoal,
      ),
  },
  trainingCalendar: {
    label: () => t("dashboard.trainingCalendar.title"),
    settings: [
      {
        kind: "number",
        key: "calendarWeeks",
        label: () => t("dashboard.widgetModal.calendarWeeks"),
        min: 1,
        max: 53,
        step: 4,
        unit: () => t("dashboard.widgetModal.units.weeks"),
      },
      {
        kind: "toggle",
        key: "calendarShowStats",
        label: () => t("dashboard.widgetModal.calendarShowStats"),
      },
    ],
    minColumns: 2,
    // A year of training, whatever the dashboard's period
    render: async (ctx) =>
      TrainingCalendarWidget.render(
        ctx.grid,
        await ctx.history(),
        ctx.plugin.settings.weeklyGoal,
        undefined,
        {
          weeks: ctx.params.calendarWeeks,
          showStats: ctx.params.calendarShowStats,
        },
      ),
  },
  quickStats: {
    label: () => t("dashboard.quickStats.title"),
    settings: [
      {
        kind: "multi",
        key: "quickStatsPeriods",
        label: () => t("dashboard.widgetModal.quickStatsPeriods"),
        options: [
          { value: "week", label: () => t("dashboard.quickStats.week") },
          { value: "month", label: () => t("dashboard.quickStats.month") },
          { value: "year", label: () => t("dashboard.quickStats.year") },
        ],
      },
      {
        kind: "multi",
        key: "quickStatsMetrics",
        label: () => t("dashboard.widgetModal.quickStatsMetrics"),
        options: [
          {
            value: "workouts",
            label: () => t("dashboard.quickStats.workouts"),
          },
          {
            value: "volume",
            label: () => CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME,
          },
          {
            value: "avgVolume",
            label: () => CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
          },
        ],
      },
    ],
    minColumns: 1,
    render: (ctx) =>
      QuickStatsCards.render(ctx.grid, ctx.data, ctx.params),
  },
  heatMap: {
    label: () => t("general.muscleHeatMap"),
    settings: [
      HEAT_MAP_TIME_FRAME_SETTING,
      HEAT_MAP_VIEW_SETTING,
      HEAT_MAP_METRIC_SETTING,
      {
        kind: "toggle",
        key: "heatMapShowImbalance",
        label: () => t("dashboard.widgetModal.heatMapShowImbalance"),
      },
    ],
    minColumns: 2,
    render: (ctx) =>
      MuscleHeatMap.render(
        ctx.grid,
        ctx.data,
        ctx.params,
        ctx.plugin,
      ),
  },
  volume: {
    label: () => t("dashboard.volumeAnalytics.title"),
    settings: [
      {
        kind: "number",
        key: "volumeTrendDays",
        label: () => t("dashboard.widgetModal.volumeTrendDays"),
        min: 1,
        max: 365,
        step: 7,
        unit: () => t("dashboard.widgetModal.units.days"),
      },
      {
        kind: "toggle",
        key: "volumeShowBreakdown",
        label: () => t("dashboard.widgetModal.volumeShowBreakdown"),
      },
      {
        kind: "number",
        key: "volumeTopLimit",
        label: () => t("dashboard.widgetModal.volumeTopLimit"),
        min: 1,
        max: 20,
        step: 1,
      },
    ],
    minColumns: 2,
    render: (ctx) =>
      VolumeAnalytics.render(ctx.grid, ctx.data, ctx.params, {
        chartId: `volume-analytics-${ctx.dashboardId}`,
      }),
  },
  recentWorkouts: {
    label: () => t("dashboard.recentWorkouts.title"),
    settings: [
      {
        kind: "number",
        key: "recentWorkoutsLimit",
        label: () => t("dashboard.widgetModal.recentWorkoutsLimit"),
        min: 1,
        max: 50,
        step: 1,
      },
    ],
    minColumns: 1,
    render: (ctx) =>
      RecentWorkouts.render(ctx.grid, ctx.data, ctx.params),
  },
  protocolDistribution: {
    label: () => t("dashboard.protocolDistribution.title"),
    settings: [
      {
        kind: "number",
        key: "protocolDays",
        label: () => t("dashboard.widgetModal.protocolDays"),
        min: 1,
        max: 365,
        step: 7,
        unit: () => t("dashboard.widgetModal.units.days"),
      },
      {
        kind: "choice",
        key: "protocolChartType",
        label: () => t("dashboard.widgetModal.protocolChartType"),
        options: [
          { value: "pie", label: () => t("dashboard.widgetModal.chartPie") },
          {
            value: "doughnut",
            label: () => t("dashboard.widgetModal.chartDoughnut"),
          },
        ],
      },
    ],
    minColumns: 2,
    render: (ctx) =>
      ProtocolDistribution.render(
        ctx.grid,
        ctx.periodData,
        ctx.plugin,
        {
          chartId: `protocol-distribution-${ctx.dashboardId}`,
          onFilterChange: ctx.onProtocolFilterChange,
          activeFilter: ctx.activeProtocolFilter,
          days: ctx.params.protocolDays,
          chartType: ctx.params.protocolChartType,
        },
      ),
  },
  protocolEffectiveness: {
    label: () => t("dashboard.protocolEffectiveness.title"),
    settings: [
      {
        kind: "number",
        key: "protocolMinEntries",
        label: () => t("dashboard.widgetModal.protocolMinEntries"),
        min: 1,
        max: 100,
        step: 1,
      },
      {
        kind: "choice",
        key: "protocolSortBy",
        label: () => t("dashboard.widgetModal.protocolSortBy"),
        options: [
          {
            value: "progressionRate",
            label: () => t("dashboard.protocolEffectiveness.columnProgression"),
          },
          {
            value: "avgVolumeChange",
            label: () => t("dashboard.protocolEffectiveness.columnVolumeChange"),
          },
          {
            value: "entryCount",
            label: () => t("dashboard.widgetModal.sortMostSets"),
          },
        ],
      },
    ],
    minColumns: 2,
    render: (ctx) =>
      ProtocolEffectiveness.render(
        ctx.grid,
        ctx.periodData,
        ctx.params,
        ctx.plugin,
      ),
  },
  duration: {
    label: () => t("dashboard.durationComparison.title"),
    settings: [
      {
        kind: "number",
        key: "durationRecentCount",
        label: () => t("dashboard.widgetModal.durationRecentCount"),
        min: 1,
        max: 50,
        step: 1,
      },
      {
        kind: "number",
        key: "durationRestSeconds",
        label: () => t("dashboard.widgetModal.durationRestSeconds"),
        min: 0,
        max: 600,
        step: 15,
        unit: () => t("dashboard.widgetModal.units.seconds"),
      },
      {
        kind: "toggle",
        key: "durationShowTrend",
        label: () => t("dashboard.widgetModal.durationShowTrend"),
      },
    ],
    minColumns: 2,
    render: (ctx) =>
      DurationComparison.render(
        ctx.grid,
        ctx.periodData,
        ctx.params,
        {
          setDuration: ctx.plugin.settings.setDuration,
        },
      ),
  },
  quickActions: {
    label: () => t("dashboard.quickActions.title"),
    settings: [
      {
        kind: "multi",
        key: "quickActionsShown",
        label: () => t("dashboard.widgetModal.quickActionsShown"),
        options: [
          {
            value: "addLog",
            label: () => t("dashboard.quickActions.addWorkoutLog"),
          },
          {
            value: "viewExercises",
            label: () => t("dashboard.quickActions.viewExercises"),
          },
        ],
      },
    ],
    minColumns: 1,
    render: (ctx) =>
      QuickActions.render(ctx.grid, ctx.params, ctx.plugin),
  },
  fileErrors: {
    label: () => t("dashboard.fileErrors.title"),
    settings: [
      {
        kind: "toggle",
        key: "fileErrorsCheckSharedNames",
        label: () => t("dashboard.widgetModal.fileErrorsCheckSharedNames"),
      },
      {
        kind: "number",
        key: "fileErrorsMaxItems",
        label: () => t("dashboard.widgetModal.fileErrorsMaxItems"),
        min: 1,
        max: 100,
        step: 1,
      },
      {
        kind: "number",
        key: "fileErrorsMaxTags",
        label: () => t("dashboard.widgetModal.fileErrorsMaxTags"),
        min: 1,
        max: 20,
        step: 1,
      },
    ],
    minColumns: 1,
    render: (ctx) =>
      WidgetsFileError.render(ctx.grid, ctx.plugin, ctx.params),
  },
  muscleTags: {
    label: () => t("dashboard.muscleTags.title"),
    settings: [
      {
        kind: "toggle",
        key: "muscleTagsGroupByMuscle",
        label: () => t("dashboard.widgetModal.muscleTagsGroupByMuscle"),
      },
    ],
    minColumns: 2,
    render: (ctx) =>
      MuscleTagsWidget.render(ctx.grid, ctx.params, ctx.plugin),
  },
};

/**
 * The widgets a block shows, in order: its `widgets` list (each once) or,
 * without one, every widget.
 */
export function resolveWidgets(
  params: EmbeddedDashboardParams,
): DashboardWidgetId[] {
  return params.widgets
    ? [...new Set(params.widgets)]
    : [...DASHBOARD_WIDGET_IDS];
}

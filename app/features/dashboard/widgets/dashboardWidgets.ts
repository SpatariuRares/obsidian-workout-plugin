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
    minColumns: 1,
    // Records are judged against all history, not just this period
    render: async (ctx) =>
      SummaryWidget.render(
        ctx.grid,
        ctx.data,
        ctx.params,
        await ctx.history(),
      ),
  },
  quickStats: {
    label: () => t("dashboard.quickStats.title"),
    minColumns: 1,
    render: (ctx) =>
      QuickStatsCards.render(ctx.grid, ctx.data, ctx.params),
  },
  heatMap: {
    label: () => t("general.muscleHeatMap"),
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
    minColumns: 2,
    render: (ctx) =>
      VolumeAnalytics.render(ctx.grid, ctx.data, ctx.params, {
        chartId: `volume-analytics-${ctx.dashboardId}`,
      }),
  },
  recentWorkouts: {
    label: () => t("dashboard.recentWorkouts.title"),
    minColumns: 1,
    render: (ctx) =>
      RecentWorkouts.render(ctx.grid, ctx.data, ctx.params),
  },
  protocolDistribution: {
    label: () => t("dashboard.protocolDistribution.title"),
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
        },
      ),
  },
  protocolEffectiveness: {
    label: () => t("dashboard.protocolEffectiveness.title"),
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
    minColumns: 1,
    render: (ctx) =>
      QuickActions.render(ctx.grid, ctx.params, ctx.plugin),
  },
  fileErrors: {
    label: () => t("dashboard.fileErrors.title"),
    minColumns: 1,
    render: (ctx) => WidgetsFileError.render(ctx.grid, ctx.plugin),
  },
  muscleTags: {
    label: () => t("dashboard.muscleTags.title"),
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

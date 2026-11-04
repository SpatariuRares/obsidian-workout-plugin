import type { BlockMenuAction } from "@app/features/common/ui/BlockMenu";
import type { CodeBlockMatch } from "@app/services/editor/CodeBlockEditorService";
import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import type { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
/** The widgets a dashboard can show, in their default order */
export const DASHBOARD_WIDGET_IDS = [
  "summary",
  "quickStats",
  "heatMap",
  "volume",
  "recentWorkouts",
  "protocolDistribution",
  "protocolEffectiveness",
  "duration",
  "quickActions",
  "fileErrors",
  "muscleTags",
  "trainingCalendar",
] as const;
export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

/** The periods the quick stats table can show, shortest first */
export const QUICK_STATS_PERIOD_IDS = ["week", "month", "year"] as const;
/** The rows the quick stats table can show */
export const QUICK_STATS_METRIC_IDS = [
  "workouts",
  "volume",
  "avgVolume",
] as const;
/** The cards of the summary widget */
export const SUMMARY_METRIC_IDS = [
  "workouts",
  "streak",
  "volume",
  "records",
] as const;
/** The buttons of the quick actions widget */
export const QUICK_ACTION_IDS = ["addLog", "viewExercises"] as const;
/** How the protocol distribution is drawn */
export const PROTOCOL_CHART_TYPES = ["pie", "doughnut"] as const;
/** What the protocol effectiveness table is ordered by, best first */
export const PROTOCOL_SORTS = [
  "progressionRate",
  "avgVolumeChange",
  "entryCount",
] as const;
/** What the heat map's toggles can start on */
export const HEAT_MAP_TIME_FRAMES = ["week", "month", "year"] as const;
export const HEAT_MAP_METRICS = ["volume", "sets", "reps"] as const;
export const HEAT_MAP_VIEWS = ["front", "back"] as const;

/** Parameters of a `workout-dashboard` block; the schema is in dashboardBlock.ts */
export type EmbeddedDashboardParams = BlockParams<
  typeof dashboardBlock
>;

/** What the view knows about a rendered dashboard besides its block parameters */
export interface DashboardViewState {
  /** The protocol chosen in the distribution widget */
  activeProtocolFilter?: string | null;
  /** The note the block is written in, for the edit menu */
  sourcePath?: string;
  /** How to find the block when it has no id, read when the menu is used */
  matchWithoutId?: () => CodeBlockMatch;
  /** The block's edit action (CodeBlockProcessorService), in the dashboard's ⋮ menu */
  editAction?: BlockMenuAction;
}

/**
 * Callback type for protocol filter changes in dashboard
 */
export type ProtocolFilterCallback = (
  protocol: string | null,
) => void;
export type { MuscleHeatMapOptions } from "@app/features/dashboard/widgets/muscle-heat-map/types";

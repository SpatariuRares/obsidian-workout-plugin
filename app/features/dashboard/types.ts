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
] as const;
export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

/** Parameters of a `workout-dashboard` block; the schema is in dashboardBlock.ts */
export type EmbeddedDashboardParams = BlockParams<
  typeof dashboardBlock
>;

/** What the view knows about a rendered dashboard besides its block parameters */
export interface DashboardViewState {
  /** The protocol chosen in the distribution widget */
  activeProtocolFilter?: string | null;
  /** The line of the block's opening fence, read when needed (the note may have changed) */
  fenceLine?: () => number | undefined;
}

/**
 * Callback type for protocol filter changes in dashboard
 */
export type ProtocolFilterCallback = (
  protocol: string | null,
) => void;
export type { MuscleHeatMapOptions } from "@app/features/dashboard/widgets/muscle-heat-map/types";

import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import type { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
/** Parameters of a `workout-dashboard` block; the schema is in dashboardBlock.ts */
export type EmbeddedDashboardParams = BlockParams<typeof dashboardBlock> & {
  /** View state, not a block parameter: the protocol chosen in the distribution widget */
  activeProtocolFilter?: string | null;
};

/**
 * Callback type for protocol filter changes in dashboard
 */
export type ProtocolFilterCallback = (
  protocol: string | null,
) => void;
export type { MuscleHeatMapOptions } from "@app/features/dashboard/widgets/muscle-heat-map/types";

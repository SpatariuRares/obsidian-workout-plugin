import type { EmbeddedChartParams } from "@app/features/charts/types";
import type { EmbeddedTableParams } from "@app/features/tables/types";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import type { EmbeddedDashboardParams } from "@app/features/dashboard/types";

// Common parameter type for all embedded views
export type EmbeddedViewParams =
  | EmbeddedChartParams
  | EmbeddedTableParams
  | EmbeddedTimerParams
  | EmbeddedDashboardParams;

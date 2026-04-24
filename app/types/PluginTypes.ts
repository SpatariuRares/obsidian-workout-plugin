import type { CHART_TYPE } from "@app/types/WorkoutConfigTypes";

// Common parameter type for all embedded views
export interface EmbeddedViewParams {
  exercise?: string;
  workout?: string;
  exactMatch?: boolean;
  dateRange?: number;
  chartType?: CHART_TYPE;
  protocol?: string | string[];
}

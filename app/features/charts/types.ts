import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import type { chartBlock } from "@app/features/charts/chartBlock";
import {
  CHART_DATA_TYPE,
  CHART_TYPE,
} from "@app/types/WorkoutConfigTypes";

export { CHART_DATA_TYPE, CHART_TYPE };

/**
 * Whether a chart shows each day's total (workout, combined, all) rather
 * than the daily average of one exercise.
 */
export function isAggregateChart(displayType: CHART_TYPE): boolean {
  return (
    displayType === CHART_TYPE.WORKOUT ||
    displayType === CHART_TYPE.COMBINED ||
    displayType === CHART_TYPE.ALL
  );
}

/** Parameters of a `workout-chart` block; the schema is in chartBlock.ts */
export type EmbeddedChartParams = BlockParams<typeof chartBlock>;

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  tension?: number;
  fill?: boolean;
  pointRadius?: number;
  pointHoverRadius?: number;
  borderDash?: number[];
  borderWidth?: number;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
}

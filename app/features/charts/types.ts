import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import type { chartBlock } from "@app/features/charts/chartBlock";
import {
  CHART_DATA_TYPE,
  CHART_TYPE,
} from "@app/types/WorkoutConfigTypes";

export { CHART_DATA_TYPE, CHART_TYPE };

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

import {
  CHART_DATA_TYPE,
  CHART_TYPE,
} from "@app/types/WorkoutConfigTypes";

export { CHART_DATA_TYPE, CHART_TYPE };

export interface EmbeddedChartParams {
  type?: CHART_DATA_TYPE;
  chartType?: CHART_TYPE;
  exercise?: string;
  workout?: string;
  dateRange?: number;
  showTrendLine?: boolean;
  showTrend?: boolean;
  showStats?: boolean;
  title?: string;
  height?: string | number; // e.g. 300 (px) or "50vh"; default 4:3 aspect ratio
  limit?: number;
  exactMatch?: boolean;
}

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

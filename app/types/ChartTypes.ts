
import { TrendIndicators, FilterResult } from "@app/types/CommonTypes";
export enum CHART_TYPE {
  EXERCISE = "exercise",
  WORKOUT = "workout",
  COMBINED = "combined",
  NONE = "NONE",
}

export enum CHART_DATA_TYPE {
  VOLUME = "volume",
  WEIGHT = "weight",
  REPS = "reps",
}

export interface EmbeddedChartParams {
  type?: CHART_DATA_TYPE;
  chartType?: CHART_TYPE;
  exercise?: string;
  exercisePath?: string;
  workout?: string;
  workoutPath?: string;
  dateRange?: number;
  showTrendLine?: boolean;
  showTrend?: boolean;
  showStats?: boolean;
  title?: string;
  height?: string;
  limit?: number;
  exactMatch?: boolean;
  debug?: boolean;
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

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  volumeData: number[];
  trendIndicators: TrendIndicators;
  filterResult: FilterResult;
  params: EmbeddedChartParams;
}

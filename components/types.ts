export interface EmbeddedChartParams {
  type?: "volume" | "weight" | "reps";
  chartType?: "exercise" | "workout";
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

export interface EmbeddedTableParams {
  exercise?: string;
  exercisePath?: string;
  workout?: string;
  workoutPath?: string;
  limit?: number;
  exactMatch?: boolean;
  searchByName?: boolean;
  showAddButton?: boolean;
  buttonText?: string;
  columns?: string[] | string;
  debug?: boolean;
}

export interface TrendIndicators {
  trendDirection: string;
  trendColor: string;
  trendIcon: string;
}

export interface FilterResult {
  filteredData: any[];
  filterMethodUsed: string;
  titlePrefix: string;
}

export interface TableData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  filterResult: FilterResult;
  params: EmbeddedTableParams;
}

export interface ChartData {
  labels: string[];
  datasets: any[];
  volumeData: number[];
  trendIndicators: TrendIndicators;
  filterResult: FilterResult;
  params: EmbeddedChartParams;
}

export interface ChartConfig {
  type: "line";
  data: {
    labels: string[];
    datasets: any[];
  };
  options: any;
}

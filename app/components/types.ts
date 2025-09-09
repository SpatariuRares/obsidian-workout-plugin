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
  dateRange?: number; // Days to look back for filtering
  limit?: number;
  exactMatch?: boolean;
  searchByName?: boolean;
  showAddButton?: boolean;
  buttonText?: string;
  columns?: string[] | string;
  debug?: boolean;
}

export interface EmbeddedTimerParams {
  duration?: number; // Duration in seconds
  type?: "countdown";
  autoStart?: boolean;
  showControls?: boolean;
  title?: string;
  intervalTime?: number; // For interval timer
  rounds?: number; // For interval timer
  sound?: boolean;
  debug?: boolean;
}

export interface EmbeddedDashboardParams {
  title?: string;
  dateRange?: number; // Days to include in analytics
  showSummary?: boolean;
  showQuickStats?: boolean;
  showVolumeAnalytics?: boolean;
  showRecentWorkouts?: boolean;
  showQuickActions?: boolean;
  recentWorkoutsLimit?: number;
  volumeTrendDays?: number;
  debug?: boolean;
}

export interface TrendIndicators {
  trendDirection: string;
  trendColor: string;
  trendIcon: string;
}

export interface FilterResult {
  filteredData: WorkoutLogData[];
  filterMethodUsed: string;
  titlePrefix: string;
}

export interface TableRow {
  displayRow: string[];
  originalDate: string;
  dateKey: string;
  originalLog?: WorkoutLogData;
}

export interface TableData {
  headers: string[];
  rows: TableRow[];
  totalRows: number;
  filterResult: FilterResult;
  params: EmbeddedTableParams;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  volumeData: number[];
  trendIndicators: TrendIndicators;
  filterResult: FilterResult;
  params: EmbeddedChartParams;
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

// Common parameter type for all embedded views
export type EmbeddedViewParams =
  | EmbeddedChartParams
  | EmbeddedTableParams
  | EmbeddedTimerParams
  | EmbeddedDashboardParams;

// Context type for code block handlers
export interface CodeBlockContext {
  source: string;
  el: HTMLElement;
  [key: string]: unknown;
}
export interface WorkoutChartsPluginInterface {
  settings: {
    debugMode: boolean;
    csvLogFilePath: string;
  };
  app: {
    vault: {
      create: (path: string, content: string) => Promise<TFile>;
      getAbstractFileByPath: (path: string) => TAbstractFile | null;
      read: (file: TFile) => Promise<string>;
      modify: (file: TFile, content: string) => Promise<void>;
      trigger: (event: string, file: TFile) => void;
    };
    workspace: {
      getActiveViewOfType: (type: any) => any;
      getLeavesOfType: (type: string) => any[];
      trigger: (event: string) => void;
    };
    keymap: any;
    scope: any;
    metadataCache: any;
    fileManager: any;
    internalPlugins: any;
    plugins: any;
    commands: any;
    lastEvent: any;
    loadLocalStorage: (key: string) => string | null;
    saveLocalStorage: (key: string, value: string) => void;
  };
  clearLogDataCache: () => void;
  addWorkoutLogEntry: (
    entry: Omit<CSVWorkoutLogEntry, "timestamp">
  ) => Promise<void>;
  updateWorkoutLogEntry: (
    originalLog: WorkoutLogData,
    updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp">
  ) => Promise<void>;
  deleteWorkoutLogEntry: (logToDelete: WorkoutLogData) => Promise<void>;
  triggerWorkoutLogRefresh: () => void;
}

// Import the WorkoutLogData type from the types directory
import { WorkoutLogData, CSVWorkoutLogEntry } from "../types/WorkoutLogData";
import { TFile, TAbstractFile } from "obsidian";

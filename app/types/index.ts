// Common types shared across modules
export type {
  TrendIndicators,
  FilterResult,
  CodeBlockContext,
} from "@app/types/CommonTypes";

export { INPUT_TYPE } from "@app/types/InputTypes";
// Chart-related types
export type {
  EmbeddedChartParams,
  ChartDataset,
  ChartData,
} from "@app/types/ChartTypes";
export { CHART_TYPE, CHART_DATA_TYPE } from "@app/types/ChartTypes";

// Table-related types
export type {
  EmbeddedTableParams,
  TableRow,
  TableData,
  TableCodeOptions,
} from "@app/types/TableTypes";
export { TABLE_TYPE } from "@app/types/TableTypes";

// Timer-related types
export type {
  EmbeddedTimerParams,
  TimerPresetConfig,
} from "@app/types/TimerTypes";
export { TIMER_TYPE } from "@app/types/TimerTypes";

// Duration-related types
export type {
  EmbeddedDurationParams,
  DurationAnalysisResult,
} from "@app/types/DurationTypes";

// Dashboard-related types
export type { EmbeddedDashboardParams, ProtocolFilterCallback } from "@app/types/DashboardTypes";

// Plugin-related types
export type {
  WorkoutChartsPluginInterface,
  EmbeddedViewParams,
} from "@app/types/PluginTypes";

// Workout log data types
export type {
  WorkoutLogData,
  CSVWorkoutLogEntry,
  WorkoutChartsSettings,
  CustomProtocolConfig,
} from "@app/types/WorkoutLogData";
export { WorkoutProtocol } from "@app/types/WorkoutLogData";

// Muscle heat map types
export type { MuscleHeatMapOptions } from "@app/types/MuscleHeatMapOptions";

// Exercise type definitions
export type {
  ParameterValueType,
  ParameterDefinition,
  ExerciseTypeDefinition,
  ExerciseDefinition,
} from "@app/types/ExerciseTypes";

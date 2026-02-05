// Common types shared across modules
export type { TrendIndicators, FilterResult } from "@app/types/CommonTypes";

export { INPUT_TYPE } from "@app/types/InputTypes";

// Plugin-related types
export type { EmbeddedViewParams } from "@app/types/PluginTypes";

// Workout log data types
export type {
  WorkoutLogData,
  CSVWorkoutLogEntry,
  WorkoutChartsSettings,
  CustomProtocolConfig,
} from "@app/types/WorkoutLogData";
export { WorkoutProtocol } from "@app/types/WorkoutLogData";

// Muscle heat map types
export type { MuscleHeatMapOptions } from "@app/features/dashboard/types";

// Exercise type definitions
export type {
  ParameterValueType,
  ParameterDefinition,
  ExerciseTypeDefinition,
  ExerciseDefinition,
} from "@app/types/ExerciseTypes";

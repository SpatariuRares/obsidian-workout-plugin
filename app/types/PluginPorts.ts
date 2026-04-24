import type { App, MarkdownPostProcessorContext } from "obsidian";
import type {
  CSVWorkoutLogEntry,
  WorkoutChartsSettings,
  WorkoutLogData,
} from "@app/types/WorkoutLogData";
import type { ExerciseDefinitionService } from "@app/services/exercise/ExerciseDefinitionService";
import type { MuscleTagService } from "@app/services/exercise/MuscleTagService";
import type { LogBulkChangedPayload } from "@app/services/events/WorkoutEventTypes";

export interface AppPort {
  app: App;
}

export interface SettingsPort {
  settings: WorkoutChartsSettings;
  saveSettings(): Promise<void>;
}

export interface WorkoutDataPort {
  getWorkoutLogData(): Promise<WorkoutLogData[]>;
  clearLogDataCache(): void;
  createCSVLogFile(): Promise<void>;
  addWorkoutLogEntry(
    entry: Omit<CSVWorkoutLogEntry, "timestamp">,
  ): Promise<void>;
  updateWorkoutLogEntry(
    originalLog: WorkoutLogData,
    updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp">,
  ): Promise<void>;
  deleteWorkoutLogEntry(logToDelete: WorkoutLogData): Promise<void>;
  batchOperation(
    operation: LogBulkChangedPayload["operation"],
    fn: () => Promise<void>,
  ): Promise<void>;
  renameExercise(oldName: string, newName: string): Promise<number>;
  findLastEntryForExercise(
    exerciseName: string,
  ): Promise<WorkoutLogData | undefined>;
}

export interface ExerciseDefinitionPort {
  getExerciseDefinitionService(): ExerciseDefinitionService;
}

export interface MuscleTagPort {
  getMuscleTagService(): MuscleTagService;
  triggerMuscleTagRefresh(): void;
}

export interface MarkdownCodeBlockProcessorPort {
  registerMarkdownCodeBlockProcessor(
    language: string,
    processor: (
      source: string,
      el: HTMLElement,
      ctx: MarkdownPostProcessorContext,
    ) => void | Promise<void>,
  ): void;
}

export type WorkoutPluginContext = AppPort &
  SettingsPort &
  WorkoutDataPort &
  ExerciseDefinitionPort &
  MuscleTagPort;

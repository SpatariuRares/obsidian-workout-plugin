import type { App, Command, MarkdownPostProcessorContext } from "obsidian";
import type {
  CSVWorkoutLogEntry,
  WorkoutChartsSettings,
  WorkoutLogData,
} from "@app/types/WorkoutLogData";
import type { ExerciseDefinitionService } from "@app/services/exercise/ExerciseDefinitionService";
import type { MuscleTagService } from "@app/services/exercise/MuscleTagService";
import type { LogBulkChangedPayload } from "@app/services/events/WorkoutEventTypes";
import type { TemplateGeneratorService } from "@app/services/templates/TemplateGeneratorService";
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type { WorkoutPlannerAPI } from "@app/api/WorkoutPlannerAPI";

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

export interface RefreshPort {
  triggerWorkoutLogRefresh(): void;
}

export interface ExerciseDefinitionPort {
  getExerciseDefinitionService(): ExerciseDefinitionService;
}

export interface MuscleTagPort {
  getMuscleTagService(): MuscleTagService;
  triggerMuscleTagRefresh(): void;
}

export interface LogModalPort {
  createLogModalHandler: { openModal(): void };
}

export interface EventBusPort {
  eventBus: WorkoutEventBus;
}

export interface WorkoutAPIPort {
  getWorkoutPlannerAPI(): WorkoutPlannerAPI;
}

export interface TemplateGeneratorPort {
  templateGeneratorService: TemplateGeneratorService;
}

export interface CommandRegistryPort {
  addCommand(command: Command): Command;
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
  RefreshPort &
  ExerciseDefinitionPort &
  MuscleTagPort &
  LogModalPort;

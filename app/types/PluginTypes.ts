import { TFile, TAbstractFile } from "obsidian";
import {
  EmbeddedChartParams,
  EmbeddedTableParams,
  EmbeddedTimerParams,
  EmbeddedDashboardParams,
} from "@app/types/index";

export interface WorkoutChartsPluginInterface {
  settings: {
    csvLogFilePath: string;
  };
  app: {
    vault: {
      create: () => Promise<TFile>;
      getAbstractFileByPath: () => TAbstractFile | null;
      read: () => Promise<string>;
      modify: () => Promise<void>;
      trigger: () => void;
    };
    workspace: {
      getActiveViewOfType: () => unknown;
      getLeavesOfType: () => unknown[];
      trigger: () => void;
    };
    keymap: unknown;
    scope: unknown;
    metadataCache: unknown;
    fileManager: unknown;
    internalPlugins: unknown;
    plugins: unknown;
    commands: unknown;
    lastEvent: unknown;
    loadLocalStorage: () => string | null;
    saveLocalStorage: () => void;
  };
  clearLogDataCache: () => void;
  addWorkoutLogEntry: () => Promise<void>;
  updateWorkoutLogEntry: () => Promise<void>;
  deleteWorkoutLogEntry: () => Promise<void>;
  triggerWorkoutLogRefresh: () => void;
}

// Common parameter type for all embedded views
export type EmbeddedViewParams =
  | EmbeddedChartParams
  | EmbeddedTableParams
  | EmbeddedTimerParams
  | EmbeddedDashboardParams;

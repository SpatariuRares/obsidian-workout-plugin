import { TFile, TAbstractFile } from "obsidian";
import { WorkoutLogData, CSVWorkoutLogEntry } from "@app/types/WorkoutLogData";
import {
	EmbeddedChartParams,
	EmbeddedTableParams,
	EmbeddedTimerParams,
	EmbeddedDashboardParams,
} from "@app/types/index";

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

// Common parameter type for all embedded views
export type EmbeddedViewParams =
	| EmbeddedChartParams
	| EmbeddedTableParams
	| EmbeddedTimerParams
	| EmbeddedDashboardParams;

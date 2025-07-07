// Main plugin file - Workout Charts for Obsidian
import { Plugin, TFile, MarkdownView, Notice } from "obsidian";
import {
  WorkoutChartsSettings,
  DEFAULT_SETTINGS,
  WorkoutLogData,
  CSVWorkoutLogEntry,
  parseCSVLogFile,
  entriesToCSVContent,
  convertFromCSVEntry,
} from "./app/types/WorkoutLogData";
import { WorkoutChartsSettingTab } from "./app/settings/WorkoutChartsSettings";
import { EmbeddedChartView } from "./app/views/EmbeddedChartView";
import { EmbeddedTableView } from "./app/views/EmbeddedTableView";
import { EmbeddedTimerView } from "./app/views/EmbeddedTimerView";
import { CreateLogModal } from "./app/modals/CreateLogModal";
import { InsertChartModal } from "./app/modals/InsertChartModal";
import { InsertTableModal } from "./app/modals/InsertTableModal";
import { InsertTimerModal } from "./app/modals/InsertTimerModal";
import { CreateExercisePageModal } from "./app/modals/CreateExercisePageModal";
import { CreateExerciseSectionModal } from "./app/modals/CreateExerciseSectionModal";
import {
  EmbeddedChartParams,
  EmbeddedTableParams,
  EmbeddedTimerParams,
} from "./app/components/types";
import type { MarkdownPostProcessorContext } from "obsidian";

// ===================== MAIN PLUGIN =====================

export default class WorkoutChartsPlugin extends Plugin {
  settings!: WorkoutChartsSettings;
  public embeddedChartView!: EmbeddedChartView;
  public embeddedTableView!: EmbeddedTableView;
  private activeTimers: Map<string, EmbeddedTimerView> = new Map();

  // Add caching for performance
  private logDataCache: WorkoutLogData[] | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  async onload() {
    await this.loadSettings();

    // Initialize embedded views
    this.embeddedChartView = new EmbeddedChartView(this);
    this.embeddedTableView = new EmbeddedTableView(this);

    // Register code block processors
    this.registerMarkdownCodeBlockProcessor(
      "workout-chart",
      this.handleWorkoutChart.bind(this)
    );
    this.registerMarkdownCodeBlockProcessor(
      "workout-log",
      this.handleWorkoutLog.bind(this)
    );
    this.registerMarkdownCodeBlockProcessor(
      "workout-timer",
      this.handleWorkoutTimer.bind(this)
    );

    this.addCommand({
      id: "create-workout-log",
      name: "Create Workout Log",
      callback: () => {
        new CreateLogModal(this.app, this, undefined, undefined, () => {
          this.triggerWorkoutLogRefresh();
        }).open();
      },
    });

    this.addCommand({
      id: "create-csv-log",
      name: "Create CSV Log File",
      callback: async () => {
        try {
          await this.createCSVLogFile();
          new Notice("CSV log file created successfully!");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(`Error creating CSV file: ${errorMessage}`);
        }
      },
    });

    // Add commands for inserting charts into notes
    this.addCommand({
      id: "insert-workout-chart",
      name: "Insert Workout Chart",
      callback: () => {
        new InsertChartModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "insert-workout-table",
      name: "Insert Workout Table",
      callback: () => {
        new InsertTableModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "insert-workout-timer",
      name: "Insert Workout Timer",
      callback: () => {
        new InsertTimerModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "create-exercise-page",
      name: "Create Exercise Page",
      callback: () => {
        new CreateExercisePageModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "create-exercise-section",
      name: "Create Exercise Section",
      callback: () => {
        new CreateExerciseSectionModal(this.app, this).open();
      },
    });

    // Add settings tab
    this.addSettingTab(new WorkoutChartsSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async getWorkoutLogData(filterParams?: {
    exercise?: string;
    workout?: string;
    exactMatch?: boolean;
  }): Promise<WorkoutLogData[]> {
    const now = Date.now();
    if (this.logDataCache && now - this.lastCacheTime < this.CACHE_DURATION) {
      // If we have cached data and filter params, apply filtering to cached data
      if (filterParams) {
        return this.applyEarlyFiltering(this.logDataCache, filterParams);
      }
      return this.logDataCache;
    }

    // Always use CSV mode
    return this.getCSVWorkoutLogData(filterParams);
  }

  /**
   * Get workout log data from CSV file
   */
  private async getCSVWorkoutLogData(filterParams?: {
    exercise?: string;
    workout?: string;
    exactMatch?: boolean;
  }): Promise<WorkoutLogData[]> {
    const logData: WorkoutLogData[] = [];

    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        return logData;
      }

      const csvFile = abstractFile;

      const content = await this.app.vault.cachedRead(csvFile);
      const csvEntries = parseCSVLogFile(content, this.settings.debugMode);

      // Convert CSV entries to WorkoutLogData format
      csvEntries.forEach((entry) => {
        const logEntry = convertFromCSVEntry(entry, csvFile);

        // Apply filtering if specified
        if (filterParams) {
          if (!this.matchesEarlyFilter(logEntry, filterParams)) {
            return;
          }
        }

        logData.push(logEntry);
      });

      // Update cache
      this.logDataCache = logData;
      this.lastCacheTime = Date.now();
    } catch (error) {
      console.error("Error reading CSV workout data:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(`Error loading CSV workout data: ${errorMessage}`);
    }

    return logData;
  }

  /**
   * Apply early filtering to reduce data processing
   */
  private applyEarlyFiltering(
    logData: WorkoutLogData[],
    filterParams: {
      exercise?: string;
      workout?: string;
      exactMatch?: boolean;
    }
  ): WorkoutLogData[] {
    return logData.filter((log) => this.matchesEarlyFilter(log, filterParams));
  }

  /**
   * Check if a log entry matches early filtering criteria
   */
  private matchesEarlyFilter(
    log: WorkoutLogData,
    filterParams: {
      exercise?: string;
      workout?: string;
      exactMatch?: boolean;
    }
  ): boolean {
    // Check exercise filter
    if (filterParams.exercise) {
      const exerciseName = filterParams.exercise
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      const logExercise = (log.exercise || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      if (filterParams.exactMatch) {
        const exerciseMatch = logExercise === exerciseName;

        if (!exerciseMatch) {
          return false;
        }
      } else {
        // Simple includes check for early filtering
        const exerciseMatch = logExercise.includes(exerciseName);

        if (!exerciseMatch) {
          return false;
        }
      }
    }

    // Check workout filter
    if (filterParams.workout) {
      const workoutName = filterParams.workout
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      const logOrigine = (log.origine || log.workout || "")
        .toLowerCase()
        .replace(/\[\[|\]\]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (filterParams.exactMatch) {
        const workoutMatch = logOrigine === workoutName;

        if (!workoutMatch) {
          return false;
        }
      } else {
        const workoutMatch = logOrigine.includes(workoutName);

        if (!workoutMatch) {
          return false;
        }
      }
    }

    return true;
  }

  public clearLogDataCache(): void {
    this.logDataCache = null;
    this.lastCacheTime = 0;
  }

  // Handle workout chart code blocks
  private async handleWorkoutChart(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) {
    try {
      const params = this.parseCodeBlockParams(source);

      // Use early filtering if we have specific parameters
      let logData: WorkoutLogData[];
      if (params.exercise || params.workout) {
        logData = await this.getWorkoutLogData({
          exercise: params.exercise as string,
          workout: params.workout as string,
          exactMatch: params.exactMatch as boolean,
        });
      } else {
        logData = await this.getWorkoutLogData();
      }

      if (logData.length === 0) {
        const { UIComponents } = await import("./app/components");
        UIComponents.renderCSVNoDataMessage(
          el,
          this.settings.csvLogFilePath,
          this
        );
        return;
      }

      // Create chart - filtering is now handled by the DataFilter class
      await this.createEmbeddedChart(el, logData, params);
    } catch (error) {
      const errorDiv = document.createElement("div");
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errorDiv.textContent = `Error loading chart: ${errorMessage}`;
      errorDiv.className = "workout-chart-error";
      el.appendChild(errorDiv);
    }
  }

  // Handle workout log code blocks
  private async handleWorkoutLog(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) {
    try {
      const params = this.parseCodeBlockParams(source);

      // Use early filtering if we have specific parameters
      let logData: WorkoutLogData[];
      if (params.exercise || params.workout) {
        logData = await this.getWorkoutLogData({
          exercise: params.exercise as string,
          workout: params.workout as string,
          exactMatch: params.exactMatch as boolean,
        });
      } else {
        logData = await this.getWorkoutLogData();
      }

      if (logData.length === 0) {
        const { UIComponents } = await import("./app/components");
        UIComponents.renderCSVNoDataMessage(
          el,
          this.settings.csvLogFilePath,
          this
        );
        return;
      }

      // Create table - filtering is now handled by the DataFilter class
      await this.createEmbeddedTable(el, logData, params);
    } catch (error) {
      const errorDiv = document.createElement("div");
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errorDiv.textContent = `Error loading log: ${errorMessage}`;
      errorDiv.className = "workout-log-error";
      el.appendChild(errorDiv);
    }
  }

  // Handle workout timer code blocks
  private async handleWorkoutTimer(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) {
    try {
      const params = this.parseCodeBlockParams(source);
      await this.createEmbeddedTimer(el, params);
    } catch (error) {
      const errorDiv = document.createElement("div");
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errorDiv.textContent = `Error loading timer: ${errorMessage}`;
      errorDiv.className = "workout-timer-error";
      el.appendChild(errorDiv);
    }
  }

  // Create embedded chart using the dedicated view
  private async createEmbeddedChart(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedChartParams
  ) {
    await this.embeddedChartView.createChart(container, data, params);
  }

  // Create embedded table using the dedicated view
  private async createEmbeddedTable(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedTableParams
  ) {
    await this.embeddedTableView.createTable(container, data, params);
  }

  // Create embedded timer using the dedicated view
  private async createEmbeddedTimer(
    container: HTMLElement,
    params: EmbeddedTimerParams
  ) {
    const timerId = `timer-${Date.now()}-${Math.random()}`;
    const timerView = new EmbeddedTimerView(this);
    this.activeTimers.set(timerId, timerView);
    await timerView.createTimer(container, params);
  }

  // Parse code block parameters
  private parseCodeBlockParams(source: string): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    const lines = source.split("\n");

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex > 0) {
          const key = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();

          // Try to parse as number, boolean, or keep as string
          if (value === "true" || value === "false") {
            params[key] = value === "true";
          } else if (!isNaN(Number(value))) {
            params[key] = Number(value);
          } else {
            params[key] = value;
          }
        }
      }
    });

    return params;
  }

  /**
   * Create a new CSV log file with header
   */
  public async createCSVLogFile(): Promise<void> {
    const header = "date,exercise,reps,weight,volume,origine,workout,timestamp";
    const sampleEntry = `2024-01-01T10:00:00.000Z,Sample Exercise,10,50,500,Sample Workout,Sample Workout,1704096000000`;
    const content = `${header}\n${sampleEntry}`;

    await this.app.vault.create(this.settings.csvLogFilePath, content);
    this.clearLogDataCache();
  }

  /**
   * Add a new workout log entry to the CSV file
   */
  public async addWorkoutLogEntry(
    entry: Omit<CSVWorkoutLogEntry, "timestamp">
  ): Promise<void> {
    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        // Create the file if it doesn't exist
        await this.createCSVLogFile();
        return this.addWorkoutLogEntry(entry); // Retry
      }

      const csvFile = abstractFile;

      const content = await this.app.vault.cachedRead(csvFile);
      const csvEntries = parseCSVLogFile(content, this.settings.debugMode);

      // Add new entry with timestamp
      const newEntry: CSVWorkoutLogEntry = {
        ...entry,
        timestamp: Date.now(),
      };

      csvEntries.push(newEntry);

      // Convert back to CSV content
      const newContent = entriesToCSVContent(csvEntries);

      // Write back to file
      await this.app.vault.modify(csvFile, newContent);

      // Clear cache
      this.clearLogDataCache();
    } catch (error) {
      console.error("Error adding workout log entry:", error);
      throw error;
    }
  }

  /**
   * Update an existing workout log entry in the CSV file
   */
  public async updateWorkoutLogEntry(
    originalLog: WorkoutLogData,
    updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp">
  ): Promise<void> {
    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        throw new Error("CSV log file not found");
      }

      const csvFile = abstractFile;

      const content = await this.app.vault.cachedRead(csvFile);
      const csvEntries = parseCSVLogFile(content, this.settings.debugMode);

      // Find the entry to update by matching timestamp (most reliable identifier)
      let entryIndex = csvEntries.findIndex((entry) => {
        return entry.timestamp === originalLog.timestamp;
      });

      // Fallback: if timestamp not found, try matching by date, exercise, reps, and weight
      if (entryIndex === -1) {
        const fallbackIndex = csvEntries.findIndex((entry) => {
          return (
            entry.date === originalLog.date &&
            entry.exercise === originalLog.exercise &&
            entry.reps === originalLog.reps &&
            entry.weight === originalLog.weight
          );
        });

        if (fallbackIndex !== -1) {
          entryIndex = fallbackIndex;
        }
      }

      if (entryIndex === -1) {
        throw new Error("Original log entry not found in CSV file");
      }

      // Update the entry while preserving the original timestamp
      const updatedEntryWithTimestamp: CSVWorkoutLogEntry = {
        ...updatedEntry,
        timestamp: csvEntries[entryIndex].timestamp, // Keep original timestamp
      };

      csvEntries[entryIndex] = updatedEntryWithTimestamp;

      // Convert back to CSV content
      const newContent = entriesToCSVContent(csvEntries);

      // Write back to file
      await this.app.vault.modify(csvFile, newContent);

      // Clear cache
      this.clearLogDataCache();
    } catch (error) {
      console.error("Error updating workout log entry:", error);
      throw error;
    }
  }

  /**
   * Delete a workout log entry from the CSV file
   */
  public async deleteWorkoutLogEntry(
    logToDelete: WorkoutLogData
  ): Promise<void> {
    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        throw new Error("CSV log file not found");
      }

      const csvFile = abstractFile;

      const content = await this.app.vault.cachedRead(csvFile);
      const csvEntries = parseCSVLogFile(content, this.settings.debugMode);

      // Find the entry to delete by matching timestamp (most reliable identifier)
      let entryIndex = csvEntries.findIndex((entry) => {
        return entry.timestamp === logToDelete.timestamp;
      });

      // Fallback: if timestamp not found, try matching by date, exercise, reps, and weight
      if (entryIndex === -1) {
        entryIndex = csvEntries.findIndex((entry) => {
          return (
            entry.date === logToDelete.date &&
            entry.exercise === logToDelete.exercise &&
            entry.reps === logToDelete.reps &&
            entry.weight === logToDelete.weight
          );
        });
      }

      if (entryIndex === -1) {
        throw new Error("Log entry not found in CSV file");
      }

      // Remove the entry
      csvEntries.splice(entryIndex, 1);

      // Convert back to CSV content
      const newContent = entriesToCSVContent(csvEntries);

      // Write back to file
      await this.app.vault.modify(csvFile, newContent);

      // Clear cache
      this.clearLogDataCache();
    } catch (error) {
      console.error("Error deleting workout log entry:", error);
      throw error;
    }
  }

  public triggerWorkoutLogRefresh(): void {
    // Clear cache first
    this.clearLogDataCache();

    // Trigger dataview refresh if available (for compatibility)
    if (this.app.workspace.trigger) {
      this.app.workspace.trigger("dataview:refresh-views");
    }

    // Force refresh of all markdown views that contain workout-log code blocks
    // Use a more efficient approach
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    leaves.forEach((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        const view = leaf.view;
        if (view?.editor) {
          // Trigger a refresh by updating the view
          view.editor.refresh();

          // Also trigger a file change event to force code block processors to re-run
          if (view.file) {
            this.app.vault.trigger("raw", view.file);
          }
        }
      }
    });
  }
}

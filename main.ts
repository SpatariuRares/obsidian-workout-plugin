import {
  App,
  Notice,
  Plugin,
  TFile,
  MarkdownView,
  normalizePath,
} from "obsidian";

import {
  WorkoutChartsSettings,
  DEFAULT_SETTINGS,
  WorkoutLogData,
  CSVWorkoutLogEntry,
  parseCSVLogFile,
  convertFromCSVEntry,
} from "./app/types/WorkoutLogData";

import { EmbeddedChartView } from "./app/views/EmbeddedChartView";
import { EmbeddedTableView } from "./app/views/EmbeddedTableView";
import { EmbeddedTimerView } from "./app/views/EmbeddedTimerView";
import { CreateLogModal } from "./app/modals/CreateLogModal";
import { WorkoutChartsSettingTab } from "./app/settings/WorkoutChartsSettings";
import { InsertChartModal } from "./app/modals/InsertChartModal";
import { InsertTableModal } from "./app/modals/InsertTableModal";
import { InsertTimerModal } from "./app/modals/InsertTimerModal";
import { CreateExercisePageModal } from "./app/modals/CreateExercisePageModal";
import { CreateExerciseSectionModal } from "./app/modals/CreateExerciseSectionModal";

// ===================== MAIN PLUGIN =====================

export default class WorkoutChartsPlugin extends Plugin {
  settings: WorkoutChartsSettings;
  private embeddedChartView: EmbeddedChartView;
  private embeddedTableView: EmbeddedTableView;
  private activeTimers: Map<string, EmbeddedTimerView> = new Map();

  private logDataCache: WorkoutLogData[] | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5000;

  async onload() {
    await this.loadSettings();

    this.embeddedChartView = new EmbeddedChartView(this);
    this.embeddedTableView = new EmbeddedTableView(this);

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
      id: "migrate-to-csv",
      name: "Migrate Logs to CSV",
      callback: async () => {
        try {
          await this.migrateToCSV();
          new Notice("Migration completed successfully!");
        } catch (error) {
          new Notice(`Migration failed: ${error.message}`);
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
      id: "create-exercise-page",
      name: "Create Exercise Page",
      callback: () => {
        new CreateExercisePageModal(this.app, this).open();
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
      id: "create-exercise-section",
      name: "Create Exercise Section",
      callback: () => {
        new CreateExerciseSectionModal(this.app, this).open();
      },
    });

    // Add settings tab
    this.addSettingTab(new WorkoutChartsSettingTab(this.app, this));
  }

  onunload() {
    // Cleanup all active timers
    this.activeTimers.forEach((timer) => {
      timer.destroy();
    });
    this.activeTimers.clear();
  }

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
      const csvFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath
      ) as TFile;

      if (!csvFile) {
        if (this.settings.debugMode) {
          console.log("CSV log file not found:", this.settings.csvLogFilePath);
        }
        // Return empty array - the UI will handle the message
        return logData;
      }

      const content = await this.app.vault.cachedRead(csvFile);
      const csvEntries = parseCSVLogFile(content, this.settings.debugMode);

      if (this.settings.debugMode) {
        console.log(`Parsed ${csvEntries.length} entries from CSV file`);
      }

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
      new Notice(`Error loading CSV workout data: ${error.message}`);
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
      const exerciseName = filterParams.exercise.trim();
      const logExercise = log.exercise || "";

      if (filterParams.exactMatch) {
        if (logExercise.toLowerCase() !== exerciseName.toLowerCase()) {
          return false;
        }
      } else {
        // Simple includes check for early filtering
        if (!logExercise.toLowerCase().includes(exerciseName.toLowerCase())) {
          return false;
        }
      }
    }

    // Check workout filter
    if (filterParams.workout) {
      const workoutName = filterParams.workout.toLowerCase();
      const logOrigine = (log.origine || log.workout || "").toLowerCase();

      if (!logOrigine.includes(workoutName)) {
        return false;
      }
    }

    return true;
  }

  public clearLogDataCache(): void {
    this.logDataCache = null;
    this.lastCacheTime = 0;
  }

  // Handle workout chart code blocks
  private async handleWorkoutChart(source: string, el: HTMLElement, ctx: any) {
    try {
      const params = this.parseCodeBlockParams(source);
      const logData = await this.getWorkoutLogData();

      // Create chart container
      const chartContainer = el.createEl("div", {
        cls: "workout-chart-embed",
      });
      chartContainer.style.width = "100%";

      // Create chart using Chart.js
      await this.createEmbeddedChart(chartContainer, logData, params);
    } catch (error) {
      const errorDiv = document.createElement("div");
      errorDiv.textContent = `Error loading chart: ${error.message}`;
      errorDiv.className = "workout-chart-error";
      el.appendChild(errorDiv);
    }
  }

  // Handle workout log code blocks
  private async handleWorkoutLog(source: string, el: HTMLElement, ctx: any) {
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
      errorDiv.textContent = `Error loading log: ${error.message}`;
      errorDiv.className = "workout-log-error";
      el.appendChild(errorDiv);
    }
  }

  // Handle workout timer code blocks
  private async handleWorkoutTimer(source: string, el: HTMLElement, ctx: any) {
    try {
      const params = this.parseCodeBlockParams(source);

      // Create timer container
      const timerContainer = el.createEl("div", {
        cls: "workout-timer-embed",
      });
      timerContainer.style.width = "100%";

      // Create timer using the embedded timer view
      await this.createEmbeddedTimer(timerContainer, params);
    } catch (error) {
      const errorDiv = document.createElement("div");
      errorDiv.textContent = `Error loading timer: ${error.message}`;
      errorDiv.className = "workout-timer-error";
      el.appendChild(errorDiv);
    }
  }

  // Parse code block parameters
  private parseCodeBlockParams(source: string): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    const lines = source.split("\n");

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        params[key] = this.parseParameterValue(value.trim());
      }
    }

    return params;
  }

  // Parse individual parameter values
  private parseParameterValue(
    value: string
  ): string | number | boolean | string[] {
    // Handle arrays
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        // Remove brackets and split by comma
        const arrayContent = value.slice(1, -1);
        if (arrayContent.trim() === "") return [];

        return arrayContent.split(",").map((item) => {
          const trimmed = item.trim();
          // Remove quotes if present
          if (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))
          ) {
            return trimmed.slice(1, -1);
          }
          return trimmed;
        });
      } catch (error) {
        console.warn("Error parsing array parameter:", value, error);
        return value;
      }
    }

    // Handle booleans
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    // Handle numbers
    if (!isNaN(Number(value)) && value.trim() !== "") {
      return Number(value);
    }

    // Return as string (remove quotes if present)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }

    return value;
  }

  // Create embedded chart using the dedicated view
  private async createEmbeddedChart(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: Record<string, unknown>
  ) {
    await this.embeddedChartView.createChart(container, data, params as any);
  }

  private async createEmbeddedTable(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: Record<string, unknown>
  ) {
    await this.embeddedTableView.createTable(container, data, params as any);
  }

  private async createEmbeddedTimer(
    container: HTMLElement,
    params: Record<string, unknown>
  ) {
    const timerView = new EmbeddedTimerView(this);
    await timerView.createTimer(container, params as any);

    const timerId = timerView.getId();
    this.activeTimers.set(timerId, timerView);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === container || (node as Element)?.contains?.(container)) {
            timerView.destroy();
            this.activeTimers.delete(timerId);
            observer.disconnect();
          }
        });
      });
    });

    observer.observe(container.parentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  private async createWorkoutLog() {
    const modal = new CreateLogModal(this.app, this);
    modal.open();
  }

  private async createExercisePage() {
    const modal = new CreateExercisePageModal(this.app, this);
    modal.open();
  }

  private async createExerciseSection() {
    const modal = new CreateExerciseSectionModal(this.app, this);
    modal.open();
  }

  private async insertChart() {
    const modal = new InsertChartModal(this.app, this);
    modal.open();
  }

  private async insertTable() {
    const modal = new InsertTableModal(this.app, this);
    modal.open();
  }

  private async insertTimer() {
    const modal = new InsertTimerModal(this.app, this);
    modal.open();
  }

  public onWorkoutLogCreated(): void {
    this.clearLogDataCache();
  }

  /**
   * Migrate existing individual log files to CSV format
   */
  public async migrateToCSV(): Promise<void> {
    try {
      // Since we're always using CSV mode now, this method is for legacy migration
      // Read all markdown files from the old log folder
      const logFolderPath = this.settings.logFolderPath;
      const allMarkdownFiles = this.app.vault.getMarkdownFiles();
      const foundFiles = allMarkdownFiles
        .filter((file) => file.path.startsWith(logFolderPath))
        .slice(0, 1000);

      if (foundFiles.length === 0) {
        throw new Error("No existing log files found to migrate");
      }

      const existingLogs: WorkoutLogData[] = [];
      const batchSize = 50;

      for (let i = 0; i < foundFiles.length; i += batchSize) {
        const batch = foundFiles.slice(i, i + batchSize);

        const batchPromises = batch.map(async (file) => {
          try {
            const content = await this.app.vault.cachedRead(file);
            // Parse the markdown file content to extract workout data
            const logEntry = this.parseMarkdownLogFile(content, file);
            return logEntry;
          } catch (error) {
            if (this.settings.debugMode) {
              console.warn(`Error reading file ${file.path}:`, error);
            }
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((logEntry: WorkoutLogData | null) => {
          if (logEntry) {
            existingLogs.push(logEntry);
          }
        });

        if (i + batchSize < foundFiles.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      // Convert to CSV entries
      const csvEntries = existingLogs.map((log: WorkoutLogData) => ({
        date: log.date,
        exercise: log.exercise,
        reps: log.reps,
        weight: log.weight,
        volume: log.volume,
        origine: log.origine || "",
        workout: log.workout || "",
        timestamp: log.file.stat.ctime,
      }));

      // Create CSV content
      const header =
        "date,exercise,reps,weight,volume,origine,workout,timestamp";
      const csvLines = [header];

      csvEntries.forEach((entry: any) => {
        const line = [
          entry.date,
          entry.exercise,
          entry.reps.toString(),
          entry.weight.toString(),
          entry.volume.toString(),
          entry.origine,
          entry.workout,
          entry.timestamp.toString(),
        ]
          .map((value: string) => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const escaped = value.replace(/"/g, '""');
            if (
              escaped.includes(",") ||
              escaped.includes('"') ||
              escaped.includes("\n")
            ) {
              return `"${escaped}"`;
            }
            return escaped;
          })
          .join(",");

        csvLines.push(line);
      });

      const csvContent = csvLines.join("\n");

      // Create CSV file
      await this.app.vault.create(this.settings.csvLogFilePath, csvContent);

      // Clear cache to force reload
      this.clearLogDataCache();

      new Notice(
        `Successfully migrated ${existingLogs.length} log entries to CSV format`
      );
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  /**
   * Parse markdown log file content and extract workout data
   */
  private parseMarkdownLogFile(
    content: string,
    file: TFile
  ): WorkoutLogData | null {
    try {
      // Simple parsing for markdown log files
      // Look for lines that contain workout data in format: exercise - reps x weight
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("#")) continue;

        // Try to match patterns like: "Bench Press - 10 x 100kg" or "Squats 5x80"
        const match = trimmedLine.match(
          /(.+?)\s*[-x]\s*(\d+)\s*[xX]\s*(\d+(?:\.\d+)?)/
        );
        if (match) {
          const exercise = match[1].trim();
          const reps = parseInt(match[2]);
          const weight = parseFloat(match[3]);
          const volume = reps * weight;

          // Extract date from filename or use current date
          const dateMatch = file.basename.match(/(\d{4}-\d{2}-\d{2})/);
          const date = dateMatch
            ? dateMatch[1]
            : new Date().toISOString().split("T")[0];

          return {
            date,
            exercise,
            reps,
            weight,
            volume,
            file,
            origine: file.parent?.name || "",
            workout: file.basename,
          };
        }
      }

      return null;
    } catch (error) {
      if (this.settings.debugMode) {
        console.warn(`Error parsing markdown file ${file.path}:`, error);
      }
      return null;
    }
  }

  public triggerWorkoutLogRefresh(): void {
    this.clearLogDataCache();

    if (this.app.workspace.trigger) {
      this.app.workspace.trigger("dataview:refresh-views");
    }

    const leaves = this.app.workspace.getLeavesOfType("markdown");
    leaves.forEach((leaf) => {
      const view = leaf.view as any;
      if (view?.editor?.cm) {
        view.editor.cm.refresh();

        if (view.file) {
          this.app.vault.trigger("raw", view.file);
        }
      }
    });
  }
}

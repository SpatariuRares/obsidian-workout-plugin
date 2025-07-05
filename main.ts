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
  parseLogFile,
  WorkoutLogData,
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
      id: "create-log-folder",
      name: "Create Log Folder",
      callback: async () => {
        try {
          await this.app.vault.createFolder(this.settings.logFolderPath);
          new Notice(`Created log folder: ${this.settings.logFolderPath}`);
        } catch (error) {
          new Notice(`Error creating folder: ${error.message}`);
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

  async getWorkoutLogData(): Promise<WorkoutLogData[]> {
    const now = Date.now();
    if (this.logDataCache && now - this.lastCacheTime < this.CACHE_DURATION) {
      return this.logDataCache;
    }

    const logData: WorkoutLogData[] = [];

    try {
      // Try multiple possible log folder paths
      const possiblePaths = [
        this.settings.logFolderPath,
        "theGYM/Log/Data",
        "Log/Data",
        "Log",
      ];

      let foundFiles: TFile[] = [];

      // Try each possible path
      for (const path of possiblePaths) {
        const logFolder = this.app.vault.getAbstractFileByPath(path);

        if (logFolder) {
          const files = this.app.vault
            .getMarkdownFiles()
            .filter((file) => file.path.startsWith(path))
            .slice(0, 1000);

          if (files.length > 0) {
            foundFiles = files;
            if (this.settings.debugMode) {
              console.log(`Found ${files.length} files in: ${path}`);
            }
            break;
          }
        }
      }

      if (foundFiles.length === 0) {
        try {
          await this.app.vault.createFolder(this.settings.logFolderPath);
          new Notice(`Created log folder: ${this.settings.logFolderPath}`);
        } catch (createError) {
          if (this.settings.debugMode) {
            console.warn("Could not create log folder:", createError);
          }
        }
      }

      if (this.settings.debugMode) {
        console.log("Workout Charts Debug:", {
          logFolderPath: this.settings.logFolderPath,
          totalMarkdownFiles: this.app.vault.getMarkdownFiles().length,
          filesInLogFolder: foundFiles.length,
          filePaths: foundFiles.map((f) => f.path).slice(0, 10), // Show first 10
          searchedPaths: possiblePaths,
        });
      }

      if (foundFiles.length === 0) {
        new Notice(
          `No workout log files found in any of these paths: ${possiblePaths.join(
            ", "
          )}. Use the "Create Workout Log" command to add your first log.`
        );
        return logData;
      }

      const batchSize = 50;
      for (let i = 0; i < foundFiles.length; i += batchSize) {
        const batch = foundFiles.slice(i, i + batchSize);

        const batchPromises = batch.map(async (file) => {
          try {
            const content = await this.app.vault.cachedRead(file);
            return parseLogFile(content, file, this.settings.debugMode);
          } catch (error) {
            if (this.settings.debugMode) {
              console.warn(`Error reading file ${file.path}:`, error);
            }
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((logEntry) => {
          if (logEntry) {
            logData.push(logEntry);
          }
        });

        if (i + batchSize < foundFiles.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      if (this.settings.debugMode) {
        console.log("Total parsed log entries:", logData.length);
      }

      this.logDataCache = logData;
      this.lastCacheTime = now;
    } catch (error) {
      console.error("Error getting workout log data:", error);
      new Notice(`Error loading workout data: ${error.message}`);
    }

    return logData;
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
      const logData = await this.getWorkoutLogData();

      if (logData.length === 0) {
        const noDataDiv = document.createElement("div");
        noDataDiv.textContent =
          "No workout data found. Please create some workout logs first using the 'Create Workout Log' command.";
        noDataDiv.className = "workout-log-no-data";
        el.appendChild(noDataDiv);
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

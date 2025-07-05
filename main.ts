// Main plugin file - Workout Charts for Obsidian
import {
  App,
  Notice,
  Plugin,
  TFile,
  MarkdownView,
  normalizePath,
} from "obsidian";

// Import types and utilities
import {
  WorkoutChartsSettings,
  DEFAULT_SETTINGS,
  parseLogFile,
  WorkoutLogData,
} from "./app/types/WorkoutLogData";

// Import views, modals, and settings
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
          // Get all markdown files in this folder
          const files = this.app.vault
            .getMarkdownFiles()
            .filter((file) => file.path.startsWith(path));

          if (files.length > 0) {
            foundFiles = files;
            if (this.settings.debugMode) {
              console.log(`Found ${files.length} files in: ${path}`);
            }
            break; // Use the first path that has files
          }
        }
      }

      // If no files found in any path, try to create the default folder
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

      // Parse all found files
      for (const file of foundFiles) {
        try {
          const content = await this.app.vault.cachedRead(file);
          const logEntry = parseLogFile(content, file, this.settings.debugMode);
          if (logEntry) {
            logData.push(logEntry);
          } else if (this.settings.debugMode) {
            console.warn("Failed to parse file:", file.path);
          }
        } catch (error) {
          if (this.settings.debugMode) {
            console.warn(`Error reading file ${file.path}:`, error);
          }
        }
      }

      if (this.settings.debugMode) {
        console.log("Total parsed log entries:", logData.length);
      }
    } catch (error) {
      console.error("Error getting workout log data:", error);
      new Notice(`Error loading workout data: ${error.message}`);
    }

    return logData;
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

  // Create embedded table using the dedicated view
  private async createEmbeddedTable(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: Record<string, unknown>
  ) {
    await this.embeddedTableView.createTable(container, data, params as any);
  }

  // Create embedded timer using the dedicated view
  private async createEmbeddedTimer(
    container: HTMLElement,
    params: Record<string, unknown>
  ) {
    const timerView = new EmbeddedTimerView(this);
    await timerView.createTimer(container, params as any);

    // Store the timer instance for cleanup
    const timerId = timerView.getId();
    this.activeTimers.set(timerId, timerView);

    // Add cleanup when container is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === container || (node as Element)?.contains?.(container)) {
            // Timer container was removed, cleanup the timer
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

  // Trigger refresh of all workout log views
  public triggerWorkoutLogRefresh(): void {
    // Trigger dataview refresh if available (for compatibility)
    if (this.app.workspace.trigger) {
      this.app.workspace.trigger("dataview:refresh-views");
    }

    // Force refresh of all markdown views that contain workout-log code blocks
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view.getViewType() === "markdown") {
        const view = leaf.view as any;
        if (view.editor && view.editor.cm) {
          // Force a refresh by triggering a file change event
          // This will cause all code block processors to re-run
          const file = view.file;
          if (file) {
            // Trigger a refresh by updating the view
            view.editor.cm.refresh();

            // Also trigger a file change event to force code block processors to re-run
            this.app.vault.trigger("raw", file);
          }
        }
      }
    });
  }
}

import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedChartView } from "@app/views/EmbeddedChartView";
import { EmbeddedTableView } from "@app/views/EmbeddedTableView";
import { EmbeddedTimerView } from "@app/views/EmbeddedTimerView";
import { EmbeddedDashboardView } from "@app/views/EmbeddedDashboardView";
import {
  EmbeddedChartParams,
  EmbeddedTableParams,
  EmbeddedTimerParams,
  EmbeddedDashboardParams,
} from "@app/types";
import type WorkoutChartsPlugin from "main";
import { DataService } from "@app/services/DataService";

export class CodeBlockProcessorService {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private dataService: DataService,
    private embeddedChartView: EmbeddedChartView,
    private embeddedTableView: EmbeddedTableView,
    private embeddedDashboardView: EmbeddedDashboardView,
    private activeTimers: Map<string, EmbeddedTimerView>
  ) {}

  registerProcessors(): void {
    this.plugin.registerMarkdownCodeBlockProcessor(
      "workout-chart",
      this.handleWorkoutChart.bind(this)
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      "workout-log",
      this.handleWorkoutLog.bind(this)
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      "workout-timer",
      this.handleWorkoutTimer.bind(this)
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      "workout-dashboard",
      this.handleWorkoutDashboard.bind(this)
    );
  }

  // Handle workout chart code blocks
  private async handleWorkoutChart(source: string, el: HTMLElement) {
    try {
      const params = this.parseCodeBlockParams(source);

      // Use early filtering if we have specific parameters
      let logData: WorkoutLogData[];
      if (params.exercise || params.workout) {
        logData =
          (await this.dataService.getWorkoutLogData({
            exercise: params.exercise as string,
            workout: params.workout as string,
            exactMatch: params.exactMatch as boolean,
          })) || [];
      } else {
        logData = (await this.dataService.getWorkoutLogData()) || [];
      }

      if (logData.length === 0) {
        const { UIComponents } = await import("@app/components");
        UIComponents.renderCSVNoDataMessage(
          el,
          this.plugin.settings.csvLogFilePath,
          this.plugin
        );
        return;
      }

      // Create chart - filtering is now handled by the DataFilter class
      this.createEmbeddedChart(el, logData, params);
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
  private async handleWorkoutLog(source: string, el: HTMLElement) {
    try {
      const params = this.parseCodeBlockParams(source);

      // Use early filtering if we have specific parameters
      let logData: WorkoutLogData[];
      if (params.exercise || params.workout) {
        logData =
          (await this.dataService.getWorkoutLogData({
            exercise: params.exercise as string,
            workout: params.workout as string,
            exactMatch: params.exactMatch as boolean,
          })) || [];
      } else {
        logData = (await this.dataService.getWorkoutLogData()) || [];
      }

      if (logData.length === 0) {
        const { UIComponents } = await import("@app/components");
        UIComponents.renderCSVNoDataMessage(
          el,
          this.plugin.settings.csvLogFilePath,
          this.plugin
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
  private async handleWorkoutTimer(source: string, el: HTMLElement) {
    try {
      const params = this.parseCodeBlockParams(source);
      this.createEmbeddedTimer(el, params);
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
  private createEmbeddedChart(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedChartParams
  ) {
    this.embeddedChartView.createChart(container, data, params);
  }

  // Create embedded table using the dedicated view
  private createEmbeddedTable(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedTableParams
  ) {
    this.embeddedTableView.createTable(container, data, params);
  }

  // Create embedded timer using the dedicated view
  private createEmbeddedTimer(
    container: HTMLElement,
    params: EmbeddedTimerParams
  ) {
    const timerId = `timer-${Date.now()}-${Math.random()}`;
    const timerView = new EmbeddedTimerView(this.plugin);
    this.activeTimers.set(timerId, timerView);
    timerView.createTimer(container, params);
  }

  // Handle workout dashboard code blocks
  private async handleWorkoutDashboard(source: string, el: HTMLElement) {
    try {
      const params = this.parseCodeBlockParams(source);

      // Use early filtering if we have specific parameters
      let logData: WorkoutLogData[];
      if (params.dateRange) {
        // Filter data based on date range for better performance
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (params.dateRange as number));

        logData = (await this.dataService.getWorkoutLogData()) || [];
        logData = logData.filter((d) => new Date(d.date) >= cutoffDate);
      } else {
        logData = (await this.dataService.getWorkoutLogData()) || [];
      }

      if (logData.length === 0) {
        const { UIComponents } = await import("@app/components");
        UIComponents.renderCSVNoDataMessage(
          el,
          this.plugin.settings.csvLogFilePath,
          this.plugin
        );
        return;
      }

      // Create dashboard
      await this.createEmbeddedDashboard(el, logData, params);
    } catch (error) {
      const errorDiv = document.createElement("div");
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errorDiv.textContent = `Error loading dashboard: ${errorMessage}`;
      errorDiv.className = "workout-dashboard-error";
      el.appendChild(errorDiv);
    }
  }

  // Create embedded dashboard using the dedicated view
  private async createEmbeddedDashboard(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams
  ) {
    await this.embeddedDashboardView.createDashboard(container, data, params);
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
}

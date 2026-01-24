import { CONSTANTS } from "@app/constants/Constants";
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
import { LogCallouts } from "@app/components/organism/LogCallouts";
import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";

class TimerRenderChild extends MarkdownRenderChild {
  constructor(
    containerEl: HTMLElement,
    private timerView: EmbeddedTimerView,
    private activeTimers: Map<string, EmbeddedTimerView>,
  ) {
    super(containerEl);
  }

  onload() {
    // Timer is already created/rendered by the view
  }

  onunload() {
    const timerId = this.timerView.getId();
    this.timerView.destroy();
    if (this.activeTimers.has(timerId)) {
      this.activeTimers.delete(timerId);
    }
  }
}

export class CodeBlockProcessorService {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private dataService: DataService,
    private embeddedChartView: EmbeddedChartView,
    private embeddedTableView: EmbeddedTableView,
    private embeddedDashboardView: EmbeddedDashboardView,
    private activeTimers: Map<string, EmbeddedTimerView>,
  ) {}

  registerProcessors(): void {
    this.plugin.registerMarkdownCodeBlockProcessor(
      CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.CHART,
      (source, el, ctx) => this.handleWorkoutChart(source, el, ctx),
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TABLE,
      (source, el, ctx) => this.handleWorkoutLog(source, el, ctx),
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TIMER,
      (source, el, ctx) => this.handleWorkoutTimer(source, el, ctx),
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DASHBOARD,
      (source, el, ctx) => this.handleWorkoutDashboard(source, el, ctx),
    );
  }

  // Handle workout chart code blocks
  private async handleWorkoutChart(
    source: string,
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext,
  ) {
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
        LogCallouts.renderCsvNoDataMessage(el, this.plugin);
        return;
      }

      // Create chart - filtering is now handled by the DataFilter class
      this.createEmbeddedChart(el, logData, params);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      el.createDiv({
        cls: "workout-chart-error",
        text: `Error loading chart: ${errorMessage}`,
      });
    }
  }

  // Handle workout log code blocks
  private async handleWorkoutLog(
    source: string,
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext,
  ) {
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
      await this.createEmbeddedTable(el, logData, params);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      el.createDiv({
        cls: "workout-log-error",
        text: `Error loading log: ${errorMessage}`,
      });
    }
  }

  // Handle workout timer code blocks
  private handleWorkoutTimer(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    try {
      const params = this.parseCodeBlockParams(source);
      this.createEmbeddedTimer(el, params, ctx);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      el.createDiv({
        cls: "workout-timer-error",
        text: `Error loading timer: ${errorMessage}`,
      });
    }
  }

  // Create embedded chart using the dedicated view
  private createEmbeddedChart(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedChartParams,
  ) {
    this.embeddedChartView.createChart(container, data, params);
  }

  // Create embedded table using the dedicated view
  private async createEmbeddedTable(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedTableParams,
  ) {
    await this.embeddedTableView.createTable(container, data, params);
  }

  // Create embedded timer using the dedicated view
  private createEmbeddedTimer(
    container: HTMLElement,
    params: EmbeddedTimerParams,
    ctx: MarkdownPostProcessorContext,
  ) {
    const timerView = new EmbeddedTimerView(this.plugin);
    const timerId = timerView.getId(); // Get ID generated by view
    this.activeTimers.set(timerId, timerView);

    // Register lifecycle manager
    const timerChild = new TimerRenderChild(
      container,
      timerView,
      this.activeTimers,
    );
    ctx.addChild(timerChild);

    timerView.createTimer(container, params);
  }

  // Handle workout dashboard code blocks
  private async handleWorkoutDashboard(
    source: string,
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext,
  ) {
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
        LogCallouts.renderCsvNoDataMessage(el, this.plugin);
        return;
      }

      // Create dashboard
      await this.createEmbeddedDashboard(el, logData, params);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      el.createDiv({
        cls: "workout-dashboard-error",
        text: `Error loading dashboard: ${errorMessage}`,
      });
    }
  }

  // Create embedded dashboard using the dedicated view
  private async createEmbeddedDashboard(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
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
          } else if (value && !isNaN(Number(value))) {
            // Check for empty string before number conversion
            // Empty strings convert to 0 with Number(""), which is undesirable
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

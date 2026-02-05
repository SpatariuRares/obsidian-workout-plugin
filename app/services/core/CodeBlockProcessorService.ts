import { CONSTANTS } from "@app/constants";
import { Feedback } from "@app/components/atoms/Feedback";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedChartView } from "@app/features/charts";
import { EmbeddedTableView } from "@app/features/tables";
import { EmbeddedTimerView } from "@app/features/timer";
import { EmbeddedDashboardView } from "@app/features/dashboard/views/EmbeddedDashboardView";
import { EmbeddedDurationView } from "@app/features/duration/views/EmbeddedDurationView";
import {
  EmbeddedChartParams,
} from "@app/features/charts/types";
import { EmbeddedTableParams } from "@app/features/tables/types";
import { EmbeddedTimerParams } from "@app/features/timer/types";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { EmbeddedDurationParams } from "@app/features/duration/types";
import type WorkoutChartsPlugin from "main";
import { DataService } from "@app/services/data/DataService";
import { MuscleTagService } from "@app/services/exercise/MuscleTagService";
import { DataFilter } from "@app/services/data/DataFilter";
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
  private embeddedDurationView: EmbeddedDurationView;

  constructor(
    private plugin: WorkoutChartsPlugin,
    private dataService: DataService,
    private embeddedChartView: EmbeddedChartView,
    private embeddedTableView: EmbeddedTableView,
    private embeddedDashboardView: EmbeddedDashboardView,
    private activeTimers: Map<string, EmbeddedTimerView>,
    private muscleTagService: MuscleTagService,
  ) {
    // Initialize duration view internally (no external dependencies needed)
    this.embeddedDurationView = new EmbeddedDurationView(plugin);

    // Set MuscleTagService on DataFilter for muscle tag lookups
    DataFilter.setMuscleTagService(muscleTagService);
  }

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
    this.plugin.registerMarkdownCodeBlockProcessor(
      CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DURATION,
      (source, el, ctx) => this.handleWorkoutDuration(source, el, ctx),
    );
  }

  // Handle workout chart code blocks
  private async handleWorkoutChart(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
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
        const sourcePath = ctx.sourcePath;
        const basename =
          sourcePath.split("/").pop()?.replace(/\.md$/i, "") || "";
        const currentPageLink = basename ? `[[${basename}]]` : "";
        LogCallouts.renderCsvNoDataMessage(
          el,
          this.plugin,
          undefined,
          undefined,
          currentPageLink,
        );
        return;
      }

      // Create chart - filtering is now handled by the DataFilter class
      await this.createEmbeddedChart(el, logData, params);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Feedback.renderError(el, `Error loading chart: ${errorMessage}`);
    }
  }

  // Handle workout log code blocks
  private async handleWorkoutLog(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
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
      Feedback.renderError(el, `Error loading log: ${errorMessage}`, {
        className: "workout-feedback-error",
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
      Feedback.renderError(el, `Error loading timer: ${errorMessage}`, {
        className: "workout-timer-error",
      });
    }
  }

  // Create embedded chart using the dedicated view
  private async createEmbeddedChart(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedChartParams,
  ): Promise<void> {
    await this.embeddedChartView.createChart(container, data, params);
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
    ctx: MarkdownPostProcessorContext,
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
        const sourcePath = ctx.sourcePath;
        const basename =
          sourcePath.split("/").pop()?.replace(/\.md$/i, "") || "";
        const currentPageLink = basename ? `[[${basename}]]` : "";
        LogCallouts.renderCsvNoDataMessage(
          el,
          this.plugin,
          undefined,
          undefined,
          currentPageLink,
        );
        return;
      }

      // Create dashboard
      await this.createEmbeddedDashboard(el, logData, params);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Feedback.renderError(el, `Error loading dashboard: ${errorMessage}`, {
        className: "workout-feedback-error",
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

  // Handle workout duration code blocks
  private async handleWorkoutDuration(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    try {
      const params = this.parseCodeBlockParams(
        source,
      ) as EmbeddedDurationParams;

      // Get current file path from context
      const currentFilePath = ctx.sourcePath;

      await this.embeddedDurationView.createDurationEstimator(
        el,
        params,
        currentFilePath,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Feedback.renderError(
        el,
        `Error loading duration estimator: ${errorMessage}`,
        { className: "workout-duration-error" },
      );
    }
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

          // Check for array syntax: [value1, value2, ...]
          if (value.startsWith("[") && value.endsWith("]")) {
            const arrayStr = value.slice(1, -1);
            params[key] = arrayStr
              .split(",")
              .map((v) => v.trim())
              .filter((v) => v.length > 0);
          } else if (value === "true" || value === "false") {
            // Try to parse as boolean
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

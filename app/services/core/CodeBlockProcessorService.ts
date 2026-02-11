import { CONSTANTS } from "@app/constants";
import { Feedback } from "@app/components/atoms/Feedback";
import { EmbeddedChartView } from "@app/features/charts";
import { EmbeddedTableView } from "@app/features/tables";
import { EmbeddedTimerView } from "@app/features/timer";
import { EmbeddedDashboardView } from "@app/features/dashboard/views/EmbeddedDashboardView";
import { EmbeddedDurationView } from "@app/features/duration/views/EmbeddedDurationView";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { EmbeddedChartParams } from "@app/features/charts/types";
import { EmbeddedTableParams } from "@app/features/tables/types";
import { EmbeddedTimerParams } from "@app/features/timer/types";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { EmbeddedDurationParams } from "@app/features/duration/types";
import type WorkoutChartsPlugin from "main";
import { DataService } from "@app/services/data/DataService";
import { DataAwareRenderChild } from "@app/services/core/DataAwareRenderChild";
import { LogCallouts } from "@app/components/molecules/LogCallouts";
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
  ) {
    // Initialize duration view internally (no external dependencies needed)
    this.embeddedDurationView = new EmbeddedDurationView(plugin);
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
      const logData = await this.embeddedChartView.loadChartData(
        params as EmbeddedChartParams,
      );

      if (logData.length === 0) {
        this.renderNoDataMessage(el, ctx);
        return;
      }

      await this.embeddedChartView.createChart(el, logData, params as EmbeddedChartParams);

      ctx.addChild(
        new DataAwareRenderChild(el, this.plugin, params, () =>
          this.embeddedChartView.refreshChart(el, params as EmbeddedChartParams),
        ),
      );
    } catch (error) {
      const errorMessage =
        ErrorUtils.getErrorMessage(error);
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
      const logData = await this.loadFilteredLogData(params);
      await this.embeddedTableView.createTable(el, logData, params as EmbeddedTableParams);

      ctx.addChild(
        new DataAwareRenderChild(el, this.plugin, params, () =>
          this.embeddedTableView.refreshTable(el, params as EmbeddedTableParams),
        ),
      );
    } catch (error) {
      const errorMessage =
        ErrorUtils.getErrorMessage(error);
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
        ErrorUtils.getErrorMessage(error);
      Feedback.renderError(el, `Error loading timer: ${errorMessage}`, {
        className: "workout-timer-error",
      });
    }
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
      const logData = await this.embeddedDashboardView.loadDashboardData(
        params as EmbeddedDashboardParams,
      );

      if (logData.length === 0) {
        this.renderNoDataMessage(el, ctx);
        return;
      }

      await this.embeddedDashboardView.createDashboard(
        el,
        logData,
        params as EmbeddedDashboardParams,
      );

      // Dashboard has no exercise/workout filters → pass {} so it always refreshes
      ctx.addChild(
        new DataAwareRenderChild(el, this.plugin, {}, () =>
          this.embeddedDashboardView.refreshDashboard(
            el,
            params as EmbeddedDashboardParams,
          ),
        ),
      );
    } catch (error) {
      const errorMessage =
        ErrorUtils.getErrorMessage(error);
      Feedback.renderError(el, `Error loading dashboard: ${errorMessage}`, {
        className: "workout-feedback-error",
      });
    }
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
        ErrorUtils.getErrorMessage(error);
      Feedback.renderError(
        el,
        `Error loading duration estimator: ${errorMessage}`,
        { className: "workout-duration-error" },
      );
    }
  }

  // Load workout log data with optional exercise/workout filtering
  private async loadFilteredLogData(
    params: Record<string, unknown>,
  ): Promise<import("@app/types/WorkoutLogData").WorkoutLogData[]> {
    if (params.exercise || params.workout) {
      return (
        (await this.dataService.getWorkoutLogData({
          exercise: params.exercise as string,
          workout: params.workout as string,
          exactMatch: params.exactMatch as boolean,
        })) || []
      );
    }
    return (await this.dataService.getWorkoutLogData()) || [];
  }

  // Render "no data" callout with page link from context
  private renderNoDataMessage(
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): void {
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

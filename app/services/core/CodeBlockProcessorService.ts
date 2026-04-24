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
import { DataService } from "@app/services/data/DataService";
import { EventAwareRenderChild } from "@app/services/core/EventAwareRenderChild";
import { LogCallouts } from "@app/features/modals/log/LogCallouts";
import type {
  MarkdownCodeBlockProcessorPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";
import {
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
} from "obsidian";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { normalizeExercise } from "@app/services/events/WorkoutEventTypes";
import { CONSTANTS } from "@app/constants";

type CodeBlockProcessorPlugin = WorkoutPluginContext &
  MarkdownCodeBlockProcessorPort;

class TimerRenderChild extends MarkdownRenderChild {
  constructor(
    containerEl: HTMLElement,
    private timerView: EmbeddedTimerView,
    private activeTimers: Map<string, EmbeddedTimerView>,
    private persistentId?: string,
    private exercise?: string,
    private workout?: string,
    private eventBus?: WorkoutEventBus,
  ) {
    super(containerEl);
  }

  onload() {
    if (!this.exercise || !this.workout || !this.eventBus) return;

    const exerciseNorm = normalizeExercise(this.exercise);
    const workoutNorm = normalizeExercise(this.workout);

    // Only auto-start on log:added, not on edit/delete
    this.register(
      this.eventBus.on("log:added", ({ context }) => {
        if (
          normalizeExercise(context.exercise) === exerciseNorm &&
          context.workout &&
          normalizeExercise(context.workout) === workoutNorm &&
          !this.timerView.isTimerRunning()
        ) {
          this.timerView.reset();
          this.timerView.start();
        }
      }),
    );
  }

  onunload() {
    const timerId = this.timerView.getId();

    // If it's a generated temporary ID, clean up.
    // If it's a persistent ID from code block, keep it running in activeTimers
    // but we still need to clear its DOM references since they are being removed.
    if (!this.persistentId) {
      this.timerView.destroy();
      if (this.activeTimers.has(timerId)) {
        this.activeTimers.delete(timerId);
      }
    }
  }
}

export class CodeBlockProcessorService {
  private embeddedDurationView: EmbeddedDurationView;

  constructor(
    private plugin: CodeBlockProcessorPlugin,
    private dataService: DataService,
    private embeddedChartView: EmbeddedChartView,
    private embeddedTableView: EmbeddedTableView,
    private embeddedDashboardView: EmbeddedDashboardView,
    private activeTimers: Map<string, EmbeddedTimerView>,
    private eventBus: WorkoutEventBus,
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
      (source, el, ctx) =>
        this.handleWorkoutDashboard(source, el, ctx),
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DURATION,
      (source, el, ctx) =>
        this.handleWorkoutDuration(source, el, ctx),
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

      await this.embeddedChartView.createChart(
        el,
        logData,
        params as EmbeddedChartParams,
      );

      ctx.addChild(
        new EventAwareRenderChild(
          el,
          this.eventBus,
          {
            exercise: params.exercise as string | undefined,
            workout: params.workout as string | undefined,
            exactMatch: params.exactMatch as boolean | undefined,
            muscleTagsAware: false,
          },
          () =>
            this.embeddedChartView.refreshChart(
              el,
              params as EmbeddedChartParams,
            ),
        ),
      );
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      Feedback.renderError(
        el,
        `Error loading chart: ${errorMessage}`,
      );
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

      const logData = await this.loadLogData();
      await this.embeddedTableView.createTable(
        el,
        logData,
        params as EmbeddedTableParams,
      );

      ctx.addChild(
        new EventAwareRenderChild(
          el,
          this.eventBus,
          {
            exercise: params.exercise as string | undefined,
            workout: params.workout as string | undefined,
            exactMatch: params.exactMatch as boolean | undefined,
            muscleTagsAware: false,
          },
          () =>
            this.embeddedTableView.refreshTable(
              el,
              params as EmbeddedTableParams,
            ),
        ),
      );
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      Feedback.renderError(el, `Error loading log: ${errorMessage}`, {
        className: "workout-feedback-error",
      });
    }
  }

  // Handle workout timer code blocks
  private async handleWorkoutTimer(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    try {
      const params = this.parseCodeBlockParams(
        source,
      ) as EmbeddedTimerParams;

      this.createEmbeddedTimer(el, params, ctx);
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      Feedback.renderError(
        el,
        `Error loading timer: ${errorMessage}`,
        {
          className: "workout-timer-error",
        },
      );
    }
  }

  // Create embedded timer using the dedicated view
  private createEmbeddedTimer(
    container: HTMLElement,
    params: EmbeddedTimerParams,
    ctx: MarkdownPostProcessorContext,
  ) {
    // Reuse existing timer view if it has a persistent ID
    let timerView: EmbeddedTimerView | undefined;
    if (params.id) {
      timerView = this.activeTimers.get(params.id);
    }

    if (!timerView) {
      timerView = new EmbeddedTimerView(this.plugin, params.id);
      this.activeTimers.set(timerView.getId(), timerView);
    }

    // Resolve workout: fallback to current file title if not in code block
    const timerExercise = params.exercise as string | undefined;
    const timerWorkout =
      (params.workout as string | undefined) ||
      ctx.sourcePath.split("/").pop()?.replace(/\.md$/i, "");

    // Register lifecycle manager + auto-start listener on log-added
    ctx.addChild(
      new TimerRenderChild(
        container,
        timerView,
        this.activeTimers,
        params.id, // Pass persistentId for lifecycle management
        timerExercise,
        timerWorkout,
        this.eventBus,
      ),
    );

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
      const logData =
        await this.embeddedDashboardView.loadDashboardData(
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

      ctx.addChild(
        new EventAwareRenderChild(
          el,
          this.eventBus,
          {
            // Nessun filtro esercizio/workout = sempre refresh
            muscleTagsAware: true, // Dashboard mostra muscle heat map
          },
          () =>
            this.embeddedDashboardView.refreshDashboard(
              el,
              params as EmbeddedDashboardParams,
            ),
        ),
      );
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      Feedback.renderError(
        el,
        `Error loading dashboard: ${errorMessage}`,
        {
          className: "workout-feedback-error",
        },
      );
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
      const errorMessage = ErrorUtils.getErrorMessage(error);
      Feedback.renderError(
        el,
        `Error loading duration estimator: ${errorMessage}`,
        { className: "workout-duration-error" },
      );
    }
  }

  // Load raw workout log data. Filtering is handled inside views via DataFilter.
  private async loadLogData(): Promise<
    import("@app/types/WorkoutLogData").WorkoutLogData[]
  > {
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
      currentPageLink,
    );
  }

  // Parse code block parameters
  private parseCodeBlockParams(
    source: string,
  ): Record<string, unknown> {
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

import { Feedback } from "@app/components/atoms/Feedback";
import { EmbeddedChartView } from "@app/features/charts/views/EmbeddedChartView";
import { EmbeddedTableView } from "@app/features/tables/views/EmbeddedTableView";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { EmbeddedDashboardView } from "@app/features/dashboard/views/EmbeddedDashboardView";
import { EmbeddedDurationView } from "@app/features/duration/views/EmbeddedDurationView";
import { PathUtils } from "@app/utils/PathUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { EmbeddedChartParams } from "@app/features/charts/types";
import { EmbeddedTableParams } from "@app/features/tables/types";
import { EmbeddedTimerParams } from "@app/features/timer/types";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { chartBlock } from "@app/features/charts/chartBlock";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { durationBlock } from "@app/features/duration/durationBlock";
import type { CodeBlockSchema } from "@app/services/codeblocks/CodeBlockSchema";
import { renderInvalidParams } from "@app/features/common/views/BaseView";
import { EventAwareRenderChild } from "@app/services/core/EventAwareRenderChild";
import { LogCallouts } from "@app/features/modals/log/LogCallouts";
import type {
  MarkdownCodeBlockProcessorPort,
  WorkoutDataPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";
import {
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
} from "obsidian";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { normalizeExercise } from "@app/services/events/WorkoutEventTypes";

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
    private dataService: Pick<WorkoutDataPort, "getWorkoutLogData">,
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
      chartBlock.type,
      (source, el, ctx) => this.handleWorkoutChart(source, el, ctx),
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      tableBlock.type,
      (source, el, ctx) => this.handleWorkoutLog(source, el, ctx),
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      timerBlock.type,
      (source, el, ctx) => this.handleWorkoutTimer(source, el, ctx),
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      dashboardBlock.type,
      (source, el, ctx) =>
        this.handleWorkoutDashboard(source, el, ctx),
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      durationBlock.type,
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
      const parsed = this.parseParams(chartBlock, source, el);
      if (!parsed) return;
      const params: EmbeddedChartParams = {
        ...chartBlock.defaults,
        ...parsed,
      };
      const logData = await this.embeddedChartView.loadChartData(params);

      if (logData.length === 0) {
        this.renderNoDataMessage(el, ctx);
        return;
      }

      await this.embeddedChartView.createChart(el, logData, params);

      ctx.addChild(
        new EventAwareRenderChild(
          el,
          this.eventBus,
          {
            exercise: params.exercise,
            workout: params.workout,
            exactMatch: params.exactMatch,
            muscleTagsAware: false,
          },
          () => this.embeddedChartView.refreshChart(el, params),
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
      const parsed = this.parseParams(tableBlock, source, el);
      if (!parsed) return;
      const params: EmbeddedTableParams = {
        ...tableBlock.defaults,
        ...parsed,
      };

      const pageLink = PathUtils.toWikiLink(ctx.sourcePath);
      const logData = await this.loadLogData();
      await this.embeddedTableView.createTable(
        el,
        logData,
        params,
        pageLink,
      );

      ctx.addChild(
        new EventAwareRenderChild(
          el,
          this.eventBus,
          {
            exercise: params.exercise,
            workout: params.workout,
            exactMatch: params.exactMatch,
            muscleTagsAware: false,
          },
          () =>
            this.embeddedTableView.refreshTable(el, params, pageLink),
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
      // Defaults are applied by the timer view, after the preset
      const params = this.parseParams(timerBlock, source, el);
      if (!params) return;

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
    const timerExercise = params.exercise;
    const timerWorkout =
      params.workout ||
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
      const parsed = this.parseParams(dashboardBlock, source, el);
      if (!parsed) return;
      const params: EmbeddedDashboardParams = {
        ...dashboardBlock.defaults,
        ...parsed,
      };
      const logData =
        await this.embeddedDashboardView.loadDashboardData(params);

      if (logData.length === 0) {
        this.renderNoDataMessage(el, ctx);
        return;
      }

      await this.embeddedDashboardView.createDashboard(
        el,
        logData,
        params,
      );

      ctx.addChild(
        new EventAwareRenderChild(
          el,
          this.eventBus,
          {
            // Nessun filtro esercizio/workout = sempre refresh
            muscleTagsAware: true, // Dashboard mostra muscle heat map
          },
          () => this.embeddedDashboardView.refreshDashboard(el, params),
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
      const params = this.parseParams(durationBlock, source, el);
      if (!params) return;

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
    LogCallouts.renderCsvNoDataMessage(
      el,
      this.plugin,
      undefined,
      PathUtils.toWikiLink(ctx.sourcePath),
    );
  }

  /**
   * Read a block with its schema. Invalid values are shown in place of the
   * block and stop the render (null).
   */
  private parseParams<P>(
    schema: CodeBlockSchema<P>,
    source: string,
    el: HTMLElement,
  ): P | null {
    const { params, errors } = schema.parse(source);
    if (errors.length > 0) {
      renderInvalidParams(el, errors);
      return null;
    }
    return params;
  }
}

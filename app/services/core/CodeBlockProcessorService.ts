import { Feedback } from "@app/components/atoms/Feedback";
import {
  BLOCK_MENU_CLASS,
  BlockMenu,
} from "@app/features/common/ui/BlockMenu";
import { ICONS } from "@app/constants/ui.constants";
import { EditChartModal } from "@app/features/charts/modals/EditChartModal";
import { EditTableModal } from "@app/features/tables/modals/EditTableModal";
import { EditTimerModal } from "@app/features/timer/modals/EditTimerModal";
import { EditDashboardModal } from "@app/features/dashboard/modals/EditDashboardModal";
import { t } from "@app/i18n";
import type { BlockLocation } from "@app/services/editor/CodeBlockEditorService";
import type { EditTarget } from "@app/features/modals/base/components/createEditButtons";
import { EmbeddedChartView } from "@app/features/charts/views/EmbeddedChartView";
import { EmbeddedTableView } from "@app/features/tables/views/EmbeddedTableView";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { EmbeddedDashboardView } from "@app/features/dashboard/views/EmbeddedDashboardView";
import { EmbeddedDurationView } from "@app/features/duration/views/EmbeddedDurationView";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { PathUtils } from "@app/utils/PathUtils";
import { EmbeddedTimerParams } from "@app/features/timer/types";
import { DashboardViewState } from "@app/features/dashboard/types";
import { chartBlock } from "@app/features/charts/chartBlock";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { durationBlock } from "@app/features/duration/durationBlock";
import { sessionBlock } from "@app/features/session/sessionBlock";
import { EmbeddedSessionView } from "@app/features/session/views/EmbeddedSessionView";
import { setsBlock } from "@app/features/tables/setsBlock";
import { EmbeddedSetsView } from "@app/features/tables/views/EmbeddedSetsView";
import { EditSetsModal } from "@app/features/tables/modals/EditSetsModal";
import type { CodeBlockSchema } from "@app/services/codeblocks/CodeBlockSchema";
import { renderInvalidParams } from "@app/features/common/views/BaseView";
import { EventAwareRenderChild } from "@app/services/core/EventAwareRenderChild";
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
    private embeddedChartView: EmbeddedChartView,
    private embeddedTableView: EmbeddedTableView,
    private embeddedDashboardView: EmbeddedDashboardView,
    private activeTimers: Map<string, EmbeddedTimerView>,
    private eventBus: WorkoutEventBus,
    private embeddedSessionView: EmbeddedSessionView,
    private embeddedSetsView: EmbeddedSetsView,
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
    this.plugin.registerMarkdownCodeBlockProcessor(
      sessionBlock.type,
      (source, el, ctx) => this.handleWorkoutSession(source, el, ctx),
    );
    this.plugin.registerMarkdownCodeBlockProcessor(
      setsBlock.type,
      (source, el, ctx) => this.handleWorkoutSets(source, el, ctx),
    );
  }

  // Handle workout sets code blocks: rows to fill in, kept across log changes
  private handleWorkoutSets(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    return this.renderBlock(el, source, ctx, {
      schema: setsBlock,
      editLabel: t("sets.editBlock"),
      edit: (params, target) =>
        new EditSetsModal(this.plugin.app, this.plugin, params, target).open(),
      loadError: (error) => t("codeBlocks.loadError.sets", { error }),
      draw: async (body, params, syncMenu) => {
        // The sheet draws the table's ⋮ menu itself, with this edit action
        const where = this.locate(el, source, ctx);
        const sheet = this.embeddedSetsView.createSets(body, params, ctx.sourcePath, () =>
          new EditSetsModal(this.plugin.app, this.plugin, params, {
            sourcePath: where.sourcePath,
            matchWithoutId: where.matchWithoutId(),
          }).open(),
        );
        ctx.addChild(sheet);
        await sheet.render();
        this.refreshOnLogChange(
          ctx,
          body,
          { exercise: params.exercise, exactMatch: true },
          () => sheet.render().finally(syncMenu),
        );
      },
    });
  }

  // Handle workout session code blocks: the session reads its own note
  private handleWorkoutSession(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    if (!this.parseParams(sessionBlock, source, el)) return;
    ctx.addChild(
      this.embeddedSessionView.createSession(el, ctx.sourcePath),
    );
  }

  // Handle workout chart code blocks
  private handleWorkoutChart(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    return this.renderBlock(el, source, ctx, {
      schema: chartBlock,
      editLabel: t("charts.editChart"),
      edit: (params, target) =>
        new EditChartModal(
          this.plugin.app,
          this.plugin,
          params,
          target,
        ).open(),
      loadError: (error) =>
        t("codeBlocks.loadError.chart", { error }),
      draw: async (body, params, syncMenu) => {
        const render = () =>
          this.embeddedChartView.render(body, params, ctx.sourcePath);
        await render();
        // Also on an empty log: the chart fills in with the first set
        this.refreshOnLogChange(ctx, body, params, () =>
          render().finally(syncMenu),
        );
      },
    });
  }

  // Handle workout log code blocks
  private handleWorkoutLog(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    return this.renderBlock(el, source, ctx, {
      schema: tableBlock,
      editLabel: t("table.editTable"),
      edit: (params, target) =>
        new EditTableModal(
          this.plugin.app,
          this.plugin,
          params,
          target,
        ).open(),
      loadError: (error) => t("codeBlocks.loadError.log", { error }),
      draw: async (body, params, syncMenu) => {
        const render = () =>
          this.embeddedTableView.refreshTable(body, params, ctx.sourcePath);
        await render();
        this.refreshOnLogChange(ctx, body, params, () =>
          render().finally(syncMenu),
        );
      },
    });
  }

  // Handle workout timer code blocks
  private handleWorkoutTimer(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    return this.renderBlock(el, source, ctx, {
      schema: timerBlock,
      // Defaults are applied by the timer view, after the preset
      withDefaults: false,
      editLabel: t("timer.editTimer"),
      edit: (params, target) =>
        new EditTimerModal(
          this.plugin.app,
          this.plugin,
          params,
          target,
        ).open(),
      loadError: (error) =>
        t("codeBlocks.loadError.timer", { error }),
      errorClass: "workout-timer-error",
      draw: async (body, params) =>
        this.createEmbeddedTimer(body, params, ctx),
    });
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
    const timerWorkout = params.workout || PathUtils.noteName(ctx.sourcePath);

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

    timerView.createTimer(container, params, ctx.sourcePath);
  }

  // Handle workout dashboard code blocks
  private handleWorkoutDashboard(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    // Where the block is, for the edit menu
    const state: DashboardViewState = this.locate(el, source, ctx);
    return this.renderBlock(el, source, ctx, {
      schema: dashboardBlock,
      editLabel: t("dashboard.editDashboard"),
      edit: (params, target, body) =>
        new EditDashboardModal(this.plugin.app, params, {
          ...target,
          noteWidth: body.getBoundingClientRect().width || undefined,
        }).open(),
      loadError: (error) =>
        t("codeBlocks.loadError.dashboard", { error }),
      draw: async (body, params, syncMenu) => {
        const render = () =>
          this.embeddedDashboardView.render(body, params, state, ctx.sourcePath);
        await render();
        // Every log change, and muscle tags for the heat map
        ctx.addChild(
          new EventAwareRenderChild(body, this.eventBus, { muscleTagsAware: true }, () =>
            render().finally(syncMenu),
          ),
        );
      },
    });
  }

  // Handle workout duration code blocks
  // Handle workout duration code blocks: the view shows its own errors
  private async handleWorkoutDuration(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) {
    const params = this.parseParams(durationBlock, source, el);
    if (params) {
      await this.embeddedDurationView.createDurationEstimator(el, params, ctx.sourcePath);
    }
  }

  /**
   * What every block with an edit menu does: read its parameters (the
   * schema's defaults under them, unless `withDefaults` is false), draw the
   * menu row, then let `draw` fill the body. Invalid parameters and any error
   * are shown in the body, and the menu follows whatever ends up there.
   */
  private async renderBlock<P extends object>(
    el: HTMLElement,
    source: string,
    ctx: MarkdownPostProcessorContext,
    spec: {
      schema: CodeBlockSchema<P>;
      withDefaults?: boolean;
      editLabel: string;
      edit: (
        params: P,
        target: EditTarget,
        body: HTMLElement,
      ) => void;
      loadError: (error: string) => string;
      errorClass?: string;
      draw: (
        body: HTMLElement,
        params: P,
        syncMenu: () => void,
      ) => Promise<void>;
    },
  ): Promise<void> {
    const {
      params: parsed,
      errors,
      invalidKeys,
    } = spec.schema.parse(source);
    const params =
      spec.withDefaults === false
        ? parsed
        : { ...spec.schema.defaults, ...parsed };
    const { body, syncMenu } = this.frame(
      el,
      source,
      ctx,
      spec.editLabel,
      invalidKeys,
      (target) => spec.edit(params, target, body),
    );

    try {
      if (errors.length > 0) {
        renderInvalidParams(body, errors);
        return;
      }
      await spec.draw(body, params, syncMenu);
    } catch (error) {
      Feedback.renderError(
        body,
        spec.loadError(ErrorUtils.getErrorMessage(error)),
        { className: spec.errorClass ?? "workout-feedback-error" },
      );
    } finally {
      syncMenu();
    }
  }

  // Re-draw a block when a set it shows is logged, changed or deleted
  private refreshOnLogChange(
    ctx: MarkdownPostProcessorContext,
    body: HTMLElement,
    filter: {
      exercise?: string;
      workout?: string;
      exactMatch?: boolean;
    },
    refresh: () => Promise<void>,
  ): void {
    ctx.addChild(
      new EventAwareRenderChild(
        body,
        this.eventBus,
        {
          exercise: filter.exercise,
          workout: filter.workout,
          exactMatch: filter.exactMatch,
          muscleTagsAware: false,
        },
        refresh,
      ),
    );
  }

  /**
   * The body a view draws into, with a row for the block's edit menu above
   * it. The row holds this menu only when the view drew none of its own
   * (`syncMenu`, after every render), so whatever the block shows (data, no
   * data, an error, invalid parameters) it can be edited, with one menu.
   */
  private frame(
    el: HTMLElement,
    source: string,
    ctx: MarkdownPostProcessorContext,
    label: string,
    invalidKeys: string[],
    edit: (target: EditTarget) => void,
  ): { body: HTMLElement; syncMenu: () => void } {
    const row = el.createDiv({ cls: "workout-block-actions" });
    const body = el.createDiv();
    const where = this.locate(el, source, ctx);
    const syncMenu = () => {
      row.empty();
      if (!body.querySelector(`.${BLOCK_MENU_CLASS}`)) {
        BlockMenu.render(row, [
          {
            label,
            icon: ICONS.ACTIONS.EDIT,
            edits: true,
            run: () =>
              edit({
                sourcePath: where.sourcePath,
                matchWithoutId: where.matchWithoutId(),
                invalidKeys,
              }),
          },
        ]);
      }
    };
    return { body, syncMenu };
  }

  // Where a block is written, for its edit menu
  private locate(
    el: HTMLElement,
    source: string,
    ctx: MarkdownPostProcessorContext,
  ): BlockLocation {
    return {
      sourcePath: ctx.sourcePath,
      matchWithoutId: () => {
        const section = ctx.getSectionInfo(el);
        return {
          body: source,
          lines: section
            ? { start: section.lineStart, end: section.lineEnd }
            : undefined,
        };
      },
    };
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

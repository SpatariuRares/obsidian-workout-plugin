import { MarkdownRenderChild } from "obsidian";
import { BaseView } from "@app/features/common/views/BaseView";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { RestTimer } from "@app/features/timer/views/RestTimer";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { describeLastTime, describeTarget } from "@app/features/modals/log/LogHistory";
import { prefillFromLast } from "@app/features/modals/base/logic/LogEntryDraft";
import {
  readNotePlan,
  stepOf,
  sessionProgress,
  type SessionStep,
} from "@app/features/session/business/sessionPlan";
import { BlockMenu } from "@app/features/common/ui/BlockMenu";
import { restBlockAction } from "@app/features/tables/modals/restBlockAction";
import {
  TrainingHistory,
  localDay,
  sameWorkout,
} from "@app/services/history/TrainingHistory";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { BlockCard } from "@app/components/molecules/BlockCard";
import { ICONS } from "@app/constants";
import { PathUtils } from "@app/utils/PathUtils";
import { parametersOrNone } from "@app/services/exercise/ExerciseDefinitionService";
import { t } from "@app/i18n";

/**
 * The `workout-session` block: walks through the plan its note describes
 * (see readSessionPlan), one exercise at a time. Progress comes from the
 * sets logged today for this workout, so it survives closing the note.
 */
export class EmbeddedSessionView extends BaseView {
  /**
   * @param activeTimers - The plugin's timers by block id, shared with the
   * `workout-timer` blocks so a section's rest runs on one timer
   */
  constructor(
    plugin: WorkoutPluginContext,
    private activeTimers: Map<string, EmbeddedTimerView>,
  ) {
    super(plugin);
  }

  /** @param sourcePath - The note the block is written in: its plan and workout name */
  createSession(container: HTMLElement, sourcePath: string): MarkdownRenderChild {
    return this.track(
      new SessionRenderChild(
        container,
        this.plugin,
        this.activeTimers,
        sourcePath,
        (error) => this.handleError(container, error),
      ),
    );
  }
}

class SessionRenderChild extends MarkdownRenderChild {
  private readonly workout: string;
  /** The rest after a set, on the section's timer (see RestTimer) */
  private readonly restTimer: RestTimer;
  /** The step picked with previous/next; undefined follows the progress */
  private position?: number;
  /** The step just logged, whose rest is shown while it runs */
  private restingStep?: SessionStep;
  private renders = 0;
  /** The plan last drawn, to skip redraws when the note changes elsewhere */
  private drawnPlan?: string;

  constructor(
    containerEl: HTMLElement,
    private plugin: WorkoutPluginContext,
    private activeTimers: Map<string, EmbeddedTimerView>,
    private sourcePath: string,
    private onError: (error: unknown) => void,
  ) {
    super(containerEl);
    this.workout = PathUtils.noteName(sourcePath);
    this.restTimer = new RestTimer(plugin, activeTimers);
  }

  onload(): void {
    const { eventBus, app } = this.plugin;
    const refresh = () => void this.render();
    this.register(
      eventBus.on("log:added", ({ context }) => void this.logged(context)),
    );
    this.register(eventBus.on("log:updated", refresh));
    this.register(eventBus.on("log:deleted", refresh));
    this.register(eventBus.on("log:bulk-changed", refresh));
    this.register(eventBus.on("settings:changed", refresh));
    this.registerEvent(
      app.vault.on("modify", (file) => {
        if (file.path === this.sourcePath) void this.planChanged();
      }),
    );
    refresh();
  }

  onunload(): void {
    this.restTimer.destroy();
  }

  /**
   * A set was logged. One of this workout's: back to the progress and rest
   * after it, unless it was the plan's last set.
   */
  private async logged(context: {
    exercise: string;
    workout?: string;
  }): Promise<void> {
    if (!sameWorkout(context.workout, this.workout)) {
      await this.render();
      return;
    }
    this.position = undefined;
    const plan = await this.readPlan();
    const step = plan ? stepOf(plan, context.exercise) : undefined;
    if (step) this.restingStep = step;
    const restShown = await this.render(step !== undefined);
    if (step?.rest && restShown) this.restTimer.restart(step.rest);
  }

  /** The note was saved: redraw only if its plan is not the one shown */
  private async planChanged(): Promise<void> {
    const steps = await this.readPlan();
    if (steps && JSON.stringify(steps) !== this.drawnPlan) {
      await this.render();
    }
  }

  private readPlan(): Promise<SessionStep[] | null> {
    return readNotePlan(this.plugin.app.vault, this.sourcePath);
  }

  /**
   * @param resting - A rest is about to start: show it even if not running yet
   * @returns Whether an exercise is current (its card shows the rest timer, if the step rests)
   */
  private async render(resting = false): Promise<boolean> {
    const render = ++this.renders;
    try {
      const [steps, logs] = await Promise.all([
        this.readPlan(),
        this.plugin.getWorkoutLogData(),
      ]);
      if (render !== this.renders || steps === null) return false;

      const today = localDay(new Date());
      const history = new TrainingHistory(logs);
      const todaysSets =
        history
          .sessions({ workout: this.workout })
          .find((session) => session.day === today)?.sets ?? [];
      const { done, current } = sessionProgress(steps, todaysSets);
      const index =
        this.position !== undefined
          ? Math.min(this.position, steps.length - 1)
          : current;
      const step = steps[index];
      const parameters = step ? await parametersOrNone(this.plugin, step.exercise) : [];
      if (render !== this.renders) return false;

      this.drawnPlan = JSON.stringify(steps);
      this.containerEl.empty();
      if (!step) {
        const card = BlockCard.create(this.containerEl, { className: "workout-session" }).el;
        if (steps.length === 0) {
          card.createDiv({ cls: "workout-session-message", text: t("session.empty") });
        } else {
          this.renderDone(card, todaysSets.length, steps.length);
        }
        return false;
      }

      const { el: card, header } = BlockCard.create(this.containerEl, {
        title: step.exercise,
        meta: t("session.exerciseOf", { current: index + 1, total: steps.length }),
        className: "workout-session",
      });

      const setsDone = done[index].length;
      card.createDiv({
        cls: "workout-session-set",
        text:
          step.sets !== undefined && setsDone < step.sets
            ? t("session.setOf", { set: setsDone + 1, sets: step.sets })
            : t("session.setNumber", { set: setsDone + 1 }),
      });

      const target = describeTarget(step.targetReps, step.targetWeight, this.plugin.settings.weightUnit);
      if (target) {
        card.createDiv({ cls: "workout-session-meta", text: t("session.target", { target }) });
      }
      const lastTime = history.previousDay(step.exercise, today);
      if (lastTime) {
        card.createDiv({
          cls: "workout-session-meta",
          text: describeLastTime(lastTime, parameters, this.plugin.settings.weightUnit),
        });
      }

      this.renderNavigation(card, index, steps.length, () =>
        this.openLogForm(step, done[index], history),
      );

      const restingTimer = this.restingStep?.rest;
      const restStep =
        this.restingStep && restingTimer && (resting || this.restTimer.isRunning(restingTimer))
          ? this.restingStep
          : step;
      // A step with `rest: 0` rests on nothing (see stepRest)
      if (restStep.rest) {
        const restEl = card.createDiv({ cls: "workout-session-rest" });
        restEl.createDiv({ cls: "workout-session-meta", text: t("session.rest") });
        this.restTimer.draw(restEl.createDiv(), restStep.rest);
      }
      if (restStep.restBlock) {
        // Edits the rest where it is written (see RestBlock)
        BlockMenu.render(header, [
          restBlockAction(this.plugin, this.sourcePath, restStep.restBlock, restStep.rest ?? {}),
        ]);
      }
      return true;
    } catch (error) {
      this.onError(error);
      return false;
    }
  }

  /** Every planned set is logged; Previous goes back to the last exercise */
  private renderDone(card: HTMLElement, sets: number, total: number): void {
    card.createDiv({
      cls: "workout-session-message",
      text: t("session.done", { sets }),
    });
    const buttons = Button.createContainer(card);
    buttons.addClass("workout-session-actions");
    const previous = Button.create(buttons, {
      text: t("session.previous"),
      variant: BUTTONVARIANT.SECONDARY,
    });
    Button.onClick(previous, () => this.moveTo(total - 1));
  }

  private renderNavigation(
    card: HTMLElement,
    index: number,
    total: number,
    onLog: () => void,
  ): void {
    const buttons = Button.createContainer(card);
    buttons.addClass("workout-session-actions");
    const previous = Button.create(buttons, {
      text: t("session.previous"),
      variant: BUTTONVARIANT.SECONDARY,
      disabled: index === 0,
    });
    Button.onClick(previous, () => this.moveTo(index - 1));

    const log = Button.create(buttons, {
      text: t("session.logSet"),
      icon: ICONS.ACTIONS.ADD,
      variant: BUTTONVARIANT.PRIMARY,
    });
    Button.onClick(log, onLog);

    const next = Button.create(buttons, {
      text: t("session.next"),
      variant: BUTTONVARIANT.SECONDARY,
      disabled: index === total - 1,
    });
    Button.onClick(next, () => this.moveTo(index + 1));
  }

  private moveTo(index: number): void {
    this.position = Math.max(0, index);
    void this.render();
  }

  /**
   * The form starts from today's last set of the step; before the first one
   * from the last set ever, with the planned reps and weight on top. The
   * workout is always this note's.
   */
  private openLogForm(
    step: SessionStep,
    doneToday: WorkoutLogData[],
    history: TrainingHistory,
  ): void {
    const last = doneToday[doneToday.length - 1] ?? history.lastSet(step.exercise);
    const first = doneToday.length === 0;
    const prefill = prefillFromLast(last, {
      exercise: step.exercise,
      // The set belongs to this note's workout, not to the last set's
      workout: this.workout,
      targetReps: first ? step.targetReps : undefined,
      targetWeight: first ? step.targetWeight : undefined,
    });
    new CreateLogModal(
      this.plugin.app,
      this.plugin,
      step.exercise,
      PathUtils.toWikiLink(this.sourcePath),
      prefill,
    ).open();
  }
}

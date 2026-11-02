import { MarkdownRenderChild, TFile } from "obsidian";
import { BaseView } from "@app/features/common/views/BaseView";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { describeSet } from "@app/features/modals/log/LogHistory";
import { fromLog } from "@app/features/modals/base/logic/LogEntryDraft";
import {
  readSessionPlan,
  sessionProgress,
  type SessionStep,
} from "@app/features/session/business/sessionPlan";
import {
  TrainingHistory,
  localDay,
  sameWorkout,
} from "@app/services/history/TrainingHistory";
import { StringUtils } from "@app/utils/StringUtils";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { LogFormData } from "@app/types/ModalTypes";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { ICONS } from "@app/constants";
import { PathUtils } from "@app/utils/PathUtils";
import { t } from "@app/i18n";

/**
 * The `workout-session` block: walks through the plan its note describes
 * (see readSessionPlan), one exercise at a time. Progress comes from the
 * sets logged today for this workout, so it survives closing the note.
 */
export class EmbeddedSessionView extends BaseView {
  private sessions = new Set<SessionRenderChild>();

  constructor(plugin: WorkoutPluginContext) {
    super(plugin);
  }

  /** @param sourcePath - The note the block is written in: its plan and workout name */
  createSession(container: HTMLElement, sourcePath: string): MarkdownRenderChild {
    const session = new SessionRenderChild(
      container,
      this.plugin,
      sourcePath,
      (error) => this.handleError(container, error),
      () => this.sessions.delete(session),
    );
    this.sessions.add(session);
    return session;
  }

  cleanup(): void {
    for (const session of this.sessions) session.unload();
    this.sessions.clear();
  }
}

class SessionRenderChild extends MarkdownRenderChild {
  private readonly workout: string;
  private readonly restTimer: EmbeddedTimerView;
  /** The step picked with previous/next; undefined follows the progress */
  private position?: number;
  /** Rest of the exercise just logged, shown while it runs */
  private rest?: EmbeddedTimerParams;
  private renders = 0;
  /** The plan last drawn, to skip redraws when the note changes elsewhere */
  private drawnPlan?: string;

  constructor(
    containerEl: HTMLElement,
    private plugin: WorkoutPluginContext,
    private sourcePath: string,
    private onError: (error: Error) => void,
    private onUnload: () => void,
  ) {
    super(containerEl);
    this.workout = PathUtils.noteName(sourcePath);
    this.restTimer = new EmbeddedTimerView(plugin);
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
    this.onUnload();
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
    const exercise = StringUtils.normalize(context.exercise);
    const step = (await this.readPlan())?.find(
      (s) => StringUtils.normalize(s.exercise) === exercise,
    );
    if (step) this.rest = restOf(step);
    const restShown = await this.render(step !== undefined);
    if (step && restShown) {
      this.restTimer.reset();
      this.restTimer.start();
    }
  }

  /** The note was saved: redraw only if its plan is not the one shown */
  private async planChanged(): Promise<void> {
    const steps = await this.readPlan();
    if (steps && JSON.stringify(steps) !== this.drawnPlan) {
      await this.render();
    }
  }

  private async readPlan(): Promise<SessionStep[] | null> {
    const file = this.plugin.app.vault.getAbstractFileByPath(this.sourcePath);
    if (!(file instanceof TFile)) return null;
    return readSessionPlan(await this.plugin.app.vault.cachedRead(file));
  }

  /**
   * @param resting - A rest is about to start: show it even if not running yet
   * @returns Whether the card shows the rest timer (an exercise is current)
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
      const parameters = step ? await this.parametersOf(step.exercise) : [];
      if (render !== this.renders) return false;

      this.drawnPlan = JSON.stringify(steps);
      this.containerEl.empty();
      const card = this.containerEl.createDiv({ cls: "workout-session" });
      if (steps.length === 0) {
        card.createDiv({ cls: "workout-session-message", text: t("session.empty") });
        return false;
      }
      if (!step) {
        this.renderDone(card, todaysSets.length, steps.length);
        return false;
      }

      const header = card.createDiv({ cls: "workout-session-header" });
      header.createDiv({ cls: "workout-session-exercise", text: step.exercise });
      header.createDiv({
        cls: "workout-session-meta",
        text: t("session.exerciseOf", { current: index + 1, total: steps.length }),
      });

      const setsDone = done[index].length;
      card.createDiv({
        cls: "workout-session-set",
        text:
          step.sets !== undefined && setsDone < step.sets
            ? t("session.setOf", { set: setsDone + 1, sets: step.sets })
            : t("session.setNumber", { set: setsDone + 1 }),
      });

      const target = this.targetText(step);
      if (target) {
        card.createDiv({ cls: "workout-session-meta", text: t("session.target", { target }) });
      }
      const lastTime = history.lastSet(step.exercise, { before: today });
      if (lastTime) {
        card.createDiv({
          cls: "workout-session-meta",
          text: t("logs.lastSet", {
            set: describeSet(lastTime, parameters, this.plugin.settings.weightUnit),
          }),
        });
      }

      this.renderNavigation(card, index, steps.length, () =>
        this.openLogForm(step, done[index], history),
      );

      const restEl = card.createDiv({ cls: "workout-session-rest" });
      restEl.createDiv({ cls: "workout-session-meta", text: t("session.rest") });
      const rest =
        this.rest && (resting || this.restTimer.isTimerRunning())
          ? this.rest
          : restOf(step);
      this.restTimer.createTimer(restEl.createDiv(), rest, this.sourcePath);
      return true;
    } catch (error) {
      this.onError(error instanceof Error ? error : new Error(String(error)));
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
    let prefill: Partial<LogFormData> = last
      ? { ...fromLog(last), date: undefined }
      : {};
    prefill.exercise = step.exercise;
    // The set belongs to this note's workout, not to the last set's
    prefill.workout = this.workout;
    if (doneToday.length === 0) {
      if (step.targetReps !== undefined) prefill.reps = step.targetReps;
      if (step.targetWeight !== undefined) {
        // Targets are in the settings unit
        prefill = { ...prefill, weight: step.targetWeight, weightUnit: undefined };
      }
    }
    new CreateLogModal(
      this.plugin.app,
      this.plugin,
      step.exercise,
      PathUtils.toWikiLink(this.sourcePath),
      prefill,
    ).open();
  }

  private targetText(step: SessionStep): string | undefined {
    const unit = this.plugin.settings.weightUnit;
    const { targetReps: reps, targetWeight: weight } = step;
    if (reps !== undefined && weight !== undefined) {
      return t("logs.weightedSet", { weight, unit, reps });
    }
    if (reps !== undefined) return t("session.targetReps", { reps });
    if (weight !== undefined) return t("session.targetWeight", { weight, unit });
    return undefined;
  }

  private async parametersOf(exercise: string): Promise<ParameterDefinition[]> {
    return this.plugin
      .getExerciseDefinitionService()
      .getParametersForExercise(exercise)
      .catch((): ParameterDefinition[] => []);
  }
}

/** The step's timer, without the block id (its menu belongs to the block) */
function restOf(step: SessionStep): EmbeddedTimerParams {
  const { id: _id, ...rest } = step.rest;
  return rest;
}

import { MarkdownRenderChild } from "obsidian";
import { BaseView } from "@app/features/common/views/BaseView";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { RestTimer } from "@app/features/timer/views/RestTimer";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { describeLastTime, describeTarget } from "@app/features/modals/log/LogHistory";
import { prefillFromLast } from "@app/features/modals/base/logic/LogEntryDraft";
import {
  readNotePlan,
  stepExercises,
  sessionProgress,
  supersetProgress,
  type SessionStep,
  type SupersetStepProgress,
} from "@app/features/session/business/sessionPlan";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import { BlockMenu } from "@app/features/common/ui/BlockMenu";
import { restBlockAction } from "@app/features/tables/modals/restBlockAction";
import {
  TrainingHistory,
  localDay,
  sameWorkout,
} from "@app/services/history/TrainingHistory";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { betweenRest } from "@app/features/tables/setsBlock";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { ProtocolBadge } from "@app/components/atoms/ProtocolBadge";
import { BlockCard } from "@app/components/molecules/BlockCard";
import { exerciseTitleLink } from "@app/features/common/ui/exerciseTitleLink";
import { ICONS } from "@app/constants";
import { PathUtils } from "@app/utils/PathUtils";
import { parametersOrNone } from "@app/services/exercise/ExerciseDefinitionService";
import {
  ProtocolCatalog,
  isStandardProtocol,
  isWarmupProtocol,
  protocolId,
} from "@app/services/protocols/ProtocolCatalog";
import { StringUtils } from "@app/utils/StringUtils";
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
  /** The specific rest timer params just triggered (may differ from step.rest for superset restBetween) */
  private restingRest?: EmbeddedTimerParams;
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
      eventBus.on("log:added", ({ entry, context }) => void this.logged(context, entry)),
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
   * after it, unless it was a warm-up or the plan's last set.
   */
  private async logged(
    context: {
      exercise: string;
      workout?: string;
    },
    entry: Pick<WorkoutLogData, "block" | "protocol">,
  ): Promise<void> {
    if (!sameWorkout(context.workout, this.workout)) {
      await this.render();
      return;
    }
    this.position = undefined;
    if (isWarmupProtocol(entry.protocol)) {
      await this.render();
      return;
    }
    const [plan, logs] = await Promise.all([
      this.readPlan(),
      this.plugin.getWorkoutLogData(),
    ]);
    const matched = plan
      ? this.resolveLoggedStepAndRest(plan, logs, context.exercise, entry.block)
      : undefined;
    const prevRest = this.restingRest;
    if (prevRest && (!matched?.rest || prevRest.id !== matched.rest.id)) {
      this.restTimer.cancel(prevRest);
    }
    this.restingStep = matched?.rest ? matched.step : undefined;
    this.restingRest = matched?.rest;
    const restShown = await this.render(matched?.rest !== undefined);
    if (matched?.rest && restShown) this.restTimer.restart(matched.rest);
  }

  private resolveLoggedStepAndRest(
    plan: SessionStep[],
    logs: WorkoutLogData[],
    exercise: string,
    block: string | undefined,
  ): { step: SessionStep; rest: EmbeddedTimerParams | undefined } | undefined {
    const wanted = StringUtils.normalize(exercise);
    let stepIndex =
      block !== undefined
        ? plan.findIndex((s) => s.block === block)
        : -1;
    if (stepIndex < 0) {
      stepIndex = plan.findIndex((s) =>
        stepExercises(s).some((ex) => StringUtils.normalize(ex) === wanted),
      );
    }
    if (stepIndex < 0) return undefined;

    const step = plan[stepIndex];
    const exercises = stepExercises(step);
    if (exercises.length < 2) {
      return { step, rest: step.rest };
    }

    const exerciseIndex = exercises.findIndex(
      (ex) => StringUtils.normalize(ex) === wanted,
    );
    if (exerciseIndex < 0) return { step, rest: undefined };
    if (exerciseIndex < exercises.length - 1) {
      return { step, rest: betweenRest(step) };
    }

    const today = localDay(new Date());
    const todaysSets =
      new TrainingHistory(logs)
        .sessions({ workout: this.workout })
        .find((session) => session.day === today)?.sets ?? [];
    const { done } = sessionProgress(plan, todaysSets);
    const progress = supersetProgress(step, done[stepIndex] ?? []);
    const finalRound =
      step.sets !== undefined && progress.counts[exerciseIndex] >= step.sets;
    return { step, rest: finalRound ? undefined : step.rest };
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
      const superset =
        step && stepExercises(step).length >= 2
          ? supersetProgress(step, done[index])
          : undefined;
      const activeExercise = superset ? superset.exercise : step?.exercise;
      const parameters = activeExercise
        ? await parametersOrNone(this.plugin, activeExercise)
        : [];
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
        titleLink: superset
          ? undefined
          : exerciseTitleLink({
              plugin: this.plugin,
              exerciseName: step.exercise,
              sourcePath: this.sourcePath,
            }),
        meta: t("session.exerciseOf", { current: index + 1, total: steps.length }),
        className: superset
          ? "workout-session workout-session-superset"
          : "workout-session",
      });

      if (superset) {
        this.renderSupersetBody(card, step, superset);
      } else {
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
      }

      const targetExercise = activeExercise ?? step.exercise;
      const lastTime = history.previousDay(targetExercise, today, { block: step.block });
      if (lastTime) {
        card.createDiv({
          cls: "workout-session-meta",
          text: describeLastTime(lastTime, parameters, this.plugin.settings.weightUnit),
        });
      }

      const activeDone = superset ? superset.exerciseDone : done[index];
      this.renderNavigation(card, index, steps.length, () =>
        this.openLogForm(step, targetExercise, activeDone, lastTime?.sets ?? [], history),
      );

      const restingTimer = this.restingRest;
      const keepResting =
        this.restingStep &&
        restingTimer &&
        (resting || this.restTimer.isRunning(restingTimer));
      const restStep = keepResting ? this.restingStep : step;
      const displayRest = keepResting
        ? restingTimer
        : (step.rest ?? (superset ? betweenRest(step) : undefined));
      // A step with `rest: 0` rests on nothing (see stepRest)
      if (displayRest) {
        const restEl = card.createDiv({ cls: "workout-session-rest" });
        restEl.createDiv({ cls: "workout-session-meta", text: t("session.rest") });
        this.restTimer.draw(restEl.createDiv(), displayRest);
      }
      if (restStep?.restBlock) {
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

  private renderSupersetBody(
    card: HTMLElement,
    step: SessionStep,
    superset: SupersetStepProgress,
  ): void {
    const exercises = step.exercises ?? [];
    card.createDiv({
      cls: "workout-session-set",
      text:
        step.sets !== undefined && superset.completedRounds < step.sets
          ? t("session.roundOf", { round: superset.round, rounds: step.sets })
          : t("session.roundNumber", { round: superset.round }),
    });

    const activeRow = card.createDiv({ cls: "workout-session-superset-active" });
    const titleLink = exerciseTitleLink({
      plugin: this.plugin,
      exerciseName: superset.exercise,
      sourcePath: this.sourcePath,
    });
    if (titleLink) {
      BlockCard.renderTitleLink(activeRow, superset.exercise, titleLink);
    } else {
      activeRow.createSpan({ text: superset.exercise });
    }
    if (step.protocol) {
      const info = new ProtocolCatalog(this.plugin.settings.customProtocols).resolve(step.protocol);
      ProtocolBadge.forProtocol(activeRow, info);
    }
    activeRow.createSpan({
      cls: "workout-session-meta",
      text: t("session.roundExerciseOf", {
        current: superset.exerciseIndex + 1,
        total: exercises.length,
      }),
    });

    const list = card.createDiv({ cls: "workout-session-superset-exercises" });
    exercises.forEach((exerciseName, i) => {
      const chip = list.createSpan({
        cls: "workout-session-superset-exercise",
        text: exerciseName,
      });
      if (superset.counts[i] >= superset.round) {
        chip.addClass("is-done");
      } else if (i === superset.exerciseIndex) {
        chip.addClass("is-active");
        chip.setAttribute("aria-current", "step");
      }
    });
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
   * from its last time's last set (else the exercise's last set ever), with the planned reps and weight on top. The
   * workout is always this note's.
   */
  private openLogForm(
    step: SessionStep,
    exercise: string,
    doneToday: WorkoutLogData[],
    lastTime: WorkoutLogData[],
    history: TrainingHistory,
  ): void {
    const last =
      doneToday[doneToday.length - 1] ??
      lastTime[lastTime.length - 1] ??
      history.lastSet(exercise);
    const first = doneToday.length === 0;
    const prefill = prefillFromLast(last, {
      exercise,
      // The set belongs to this note's workout, not to the last set's
      workout: this.workout,
      targetReps: first ? step.targetReps : undefined,
      targetWeight: first ? step.targetWeight : undefined,
    });
    // The set is this step's: logged with its block, it counts for it
    if (step.block) prefill.block = step.block;
    if (
      step.protocol &&
      !isStandardProtocol(step.protocol) &&
      !isWarmupProtocol(step.protocol) &&
      (!prefill.protocol ||
        isStandardProtocol(prefill.protocol) ||
        isWarmupProtocol(prefill.protocol))
    ) {
      prefill.protocol = protocolId(step.protocol);
    }
    new CreateLogModal(
      this.plugin.app,
      this.plugin,
      exercise,
      PathUtils.toWikiLink(this.sourcePath),
      prefill,
    ).open();
  }
}

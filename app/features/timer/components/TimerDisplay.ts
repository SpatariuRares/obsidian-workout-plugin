import {
  TimerState,
  TimerSurface,
  TIMER_TYPE,
} from "@app/features/timer/types";
import {
  intervalAt,
  intervalPlan,
  intervalSeconds,
  type IntervalPhase,
} from "@app/features/timer/business/intervalSchedule";
import { Icon } from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";
import { t } from "@app/i18n";

const URGENT_THRESHOLD_MS = 10000;

export class TimerDisplay {
  private static urgentOverlays = new Map<string, HTMLElement>();

  private static formatTime(milliseconds: number): string {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  private static plan(state: TimerState) {
    return intervalPlan({
      duration: state.duration,
      rest: state.rest,
      rounds: state.totalRounds,
    });
  }

  /** Time left in the countdown, or in the current interval phase */
  private static getRemaining(state: TimerState): number | null {
    if (state.timerType === TIMER_TYPE.COUNTDOWN) {
      return Math.max(0, state.duration * 1000 - state.elapsedTime);
    }
    if (state.timerType === TIMER_TYPE.INTERVAL) {
      return intervalAt(this.plan(state), state.elapsedTime).remainingMs;
    }
    return null;
  }

  /** Time left until the whole timer ends (drives the last-seconds overlay) */
  private static getRemainingToEnd(state: TimerState): number | null {
    if (state.timerType === TIMER_TYPE.INTERVAL) {
      return Math.max(
        0,
        intervalSeconds(this.plan(state)) * 1000 - state.elapsedTime,
      );
    }
    return this.getRemaining(state);
  }

  private static showUrgentOverlay(
    timerId: string,
    secondsLeft: number,
  ): void {
    let overlay = this.urgentOverlays.get(timerId);
    if (!overlay) {
      overlay = document.body.createDiv({
        cls: "workout-timer-urgent-overlay",
      });
      this.urgentOverlays.set(timerId, overlay);
    }
    overlay.empty();
    overlay.createSpan({
      cls: "workout-timer-urgent-overlay__count",
      text: String(secondsLeft),
    });
  }

  private static hideUrgentOverlay(timerId: string): void {
    const overlay = this.urgentOverlays.get(timerId);
    if (overlay) {
      overlay.remove();
      this.urgentOverlays.delete(timerId);
    }
  }

  static cleanupOverlay(timerId: string): void {
    this.hideUrgentOverlay(timerId);
  }

  static updateDisplay(state: TimerState, timerId: string): void {
    if (state.surfaces.length === 0) {
      return;
    }

    const remaining = this.getRemaining(state);
    const remainingToEnd = this.getRemainingToEnd(state);
    const isCompleted =
      !state.isRunning &&
      ((state.timerType === TIMER_TYPE.COUNTDOWN &&
        state.elapsedTime >= state.duration * 1000) ||
        (state.timerType === TIMER_TYPE.INTERVAL && state.phase === "done"));
    const isUrgent =
      state.isRunning &&
      remainingToEnd !== null &&
      remainingToEnd > 0 &&
      remainingToEnd <= URGENT_THRESHOLD_MS;

    if (isUrgent && remainingToEnd !== null) {
      this.showUrgentOverlay(timerId, Math.ceil(remainingToEnd / 1000));
    } else {
      this.hideUrgentOverlay(timerId);
    }

    // Running/paused drive the digit color; "Paused" is also written out
    const isPaused = !state.isRunning && state.elapsedTime > 0 && !isCompleted;
    const roundText =
      state.timerType === TIMER_TYPE.INTERVAL && !isCompleted
        ? t("timer.round", {
            current: state.currentRound,
            total: state.totalRounds,
          })
        : "";
    // Work/rest only means something when the rounds have a rest
    const phase =
      state.timerType === TIMER_TYPE.INTERVAL &&
      state.rest > 0 &&
      state.phase !== "done" &&
      !isCompleted
        ? state.phase
        : undefined;

    for (const surface of state.surfaces) {
      this.drawSurface(surface, state, {
        time: this.timeText(state, remaining),
        isCompleted,
        isPaused,
        roundText,
        phase,
      });
    }
  }

  private static timeText(state: TimerState, remaining: number | null): string {
    if (
      state.timerType === TIMER_TYPE.COUNTDOWN ||
      state.timerType === TIMER_TYPE.INTERVAL
    ) {
      return this.formatTime(remaining ?? 0);
    }
    if (state.timerType === TIMER_TYPE.STOPWATCH) {
      return this.formatTime(state.elapsedTime);
    }
    return "00:00";
  }

  private static drawSurface(
    surface: TimerSurface,
    state: TimerState,
    view: {
      time: string;
      isCompleted: boolean;
      isPaused: boolean;
      roundText: string;
      phase?: Exclude<IntervalPhase, "done">;
    },
  ): void {
    const display = surface.timerDisplay;
    display.empty();
    const timer = display.closest(".workout-timer");
    timer?.classList.toggle("is-running", state.isRunning);
    timer?.classList.toggle("is-paused", view.isPaused);
    timer?.classList.toggle("is-rest", view.phase === "rest");
    if (surface.roundCounterDisplay) {
      surface.roundCounterDisplay.textContent = view.roundText;
    }

    if (view.isCompleted) {
      const done = display.createSpan({ cls: "workout-timer-complete" });
      Icon.create(done, { name: ICONS.STATUS.SUCCESS });
      done.appendText(t("timer.status.done"));
      return;
    }

    if (view.phase) {
      display.createSpan({
        cls: "workout-timer-phase",
        text:
          view.phase === "rest"
            ? t("timer.phase.rest")
            : t("timer.phase.work"),
      });
    }
    display.createSpan({
      cls: "workout-timer-time-display",
      text: view.time,
    });
    if (view.isPaused) {
      display.createSpan({
        cls: "workout-timer-status",
        text: t("timer.status.paused"),
      });
    }
  }

  static createDisplay(container: HTMLElement): HTMLElement {
    const timeDisplay = container.createDiv({
      cls: "workout-timer-time",
    });

    return timeDisplay;
  }

  static createRoundCounter(container: HTMLElement): HTMLElement {
    return container.createSpan({
      cls: "workout-timer-round-counter",
    });
  }
}

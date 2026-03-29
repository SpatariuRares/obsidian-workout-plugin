import { TimerState, TIMER_TYPE } from "@app/features/timer";
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

  private static getRemaining(state: TimerState): number | null {
    if (state.timerType === TIMER_TYPE.COUNTDOWN) {
      return Math.max(0, state.duration * 1000 - state.elapsedTime);
    }
    if (state.timerType === TIMER_TYPE.INTERVAL) {
      const intervalElapsed = state.elapsedTime % (state.duration * 1000);
      return state.duration * 1000 - intervalElapsed;
    }
    return null;
  }

  private static showUrgentOverlay(timerId: string, secondsLeft: number): void {
    let overlay = this.urgentOverlays.get(timerId);
    if (!overlay) {
      overlay = document.body.createDiv({
        cls: "workout-timer-urgent-overlay",
      });
      this.urgentOverlays.set(timerId, overlay);
    }
    overlay.empty();
    overlay.createEl("span", {
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
    if (!state.timerDisplay) {
      return;
    }

    const remaining = this.getRemaining(state);
    const isCompleted =
      !state.isRunning &&
      state.timerType === TIMER_TYPE.COUNTDOWN &&
      state.elapsedTime >= state.duration * 1000;
    const isUrgent =
      state.isRunning &&
      remaining !== null &&
      remaining > 0 &&
      remaining <= URGENT_THRESHOLD_MS;

    if (isUrgent && remaining !== null) {
      this.showUrgentOverlay(timerId, Math.ceil(remaining / 1000));
    } else {
      this.hideUrgentOverlay(timerId);
    }

    state.timerDisplay.empty();

    if (isCompleted) {
      state.timerDisplay.createEl("span", {
        cls: "workout-timer-complete",
        text: t("icons.status.success"),
      });
      this.updateRoundCounter(state, "");
      return;
    }

    let displayTime: string;
    if (state.timerType === TIMER_TYPE.COUNTDOWN) {
      displayTime = this.formatTime(remaining ?? 0);
    } else if (state.timerType === TIMER_TYPE.STOPWATCH) {
      displayTime = this.formatTime(state.elapsedTime);
    } else if (state.timerType === TIMER_TYPE.INTERVAL) {
      displayTime = this.formatTime(remaining ?? 0);
    } else {
      displayTime = "00:00";
    }

    state.timerDisplay.createEl("span", {
      cls: "workout-timer-time-display",
      text: displayTime,
    });

    if (state.timerType === TIMER_TYPE.INTERVAL) {
      this.updateRoundCounter(
        state,
        `${state.currentRound} / ${state.totalRounds}`,
      );
    }
  }

  private static updateRoundCounter(state: TimerState, text: string): void {
    if (state.roundCounterDisplay) {
      state.roundCounterDisplay.textContent = text;
    }
  }

  static createDisplay(container: HTMLElement): HTMLElement {
    const timeDisplay = container.createEl("div", {
      cls: "workout-timer-time",
    });

    return timeDisplay;
  }

  static createRoundCounter(container: HTMLElement): HTMLElement {
    return container.createEl("span", {
      cls: "workout-timer-round-counter",
    });
  }
}

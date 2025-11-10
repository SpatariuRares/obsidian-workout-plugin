import { TimerState } from "@app/components/timer/TimerTypes";

export class TimerDisplay {
  private static formatTime(milliseconds: number): string {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  static updateDisplay(state: TimerState, _timerId: string): void {
    if (!state.timerDisplay) {
      return;
    }

    let displayTime: string;

    if (state.timerType === "countdown") {
      const remaining = Math.max(0, state.duration * 1000 - state.elapsedTime);
      displayTime = this.formatTime(remaining);
    } else if (state.timerType === "stopwatch") {
      displayTime = this.formatTime(state.elapsedTime);
    } else if (state.timerType === "interval") {
      const intervalElapsed = state.elapsedTime % (state.intervalTime * 1000);
      const remaining = state.intervalTime * 1000 - intervalElapsed;
      displayTime = this.formatTime(remaining);
    } else {
      displayTime = "00:00";
    }

    // Only show completion checkmark if timer is stopped and completed
    if (
      !state.isRunning &&
      state.timerType === "countdown" &&
      state.elapsedTime >= state.duration * 1000
    ) {
      state.timerDisplay.empty();
      state.timerDisplay.createEl("span", {
        cls: "workout-timer-complete",
        text: "✓",
      });
    } else {
      state.timerDisplay.empty();
      state.timerDisplay.createEl("span", {
        cls: "workout-timer-time-display",
        text: displayTime,
      });
    }
  }

  static createDisplay(container: HTMLElement): HTMLElement {
    const timerDisplay = container.createEl("div", {
      cls: "workout-timer-display",
    });

    const timeDisplay = timerDisplay.createEl("div", {
      cls: "workout-timer-time",
    });

    return timeDisplay;
  }
}

import { TimerState } from "@app/types/TimerTypes";
import { TIMER_TYPE } from "@app/types/TimerTypes";

export interface TimerControlCallbacks {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export class TimerControls {
  static createControls(
    container: HTMLElement,
    state: TimerState,
    callbacks: TimerControlCallbacks
  ): HTMLButtonElement | undefined {
    const controlsDiv = container.createEl("div", {
      cls: "workout-timer-controls",
    });

    // Start/Stop button
    const startStopBtn = controlsDiv.createEl("button", {
      cls: "workout-timer-btn workout-timer-start-stop",
      text: "▶",
    });

    // Reset button
    const resetBtn = controlsDiv.createEl("button", {
      cls: "workout-timer-btn workout-timer-reset",
      text: "↺",
    });

    // Add event listeners
    startStopBtn.addEventListener("click", () => {
      if (state.isRunning) {
        callbacks.onStop();
        startStopBtn.textContent = "▶";
      } else {
        if (
          state.timerType === TIMER_TYPE.COUNTDOWN &&
          state.elapsedTime >= state.duration * 1000
        ) {
          state.elapsedTime = 0;
          state.currentRound = 1;
        }
        callbacks.onStart();
        startStopBtn.textContent = "⏸";
      }
    });

    resetBtn.addEventListener("click", () => {
      callbacks.onReset();
      startStopBtn.textContent = "▶";
    });

    return startStopBtn;
  }

  static updateStartStopButton(
    button: HTMLButtonElement | undefined,
    isRunning: boolean
  ): void {
    if (button) {
      button.textContent = isRunning ? "⏸" : "▶";
    }
  }
}

import { TimerState, TIMER_TYPE } from "@app/features/timer";
import { Button } from "@app/components/atoms";

export interface TimerControlCallbacks {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export class TimerControls {
  static createControls(
    container: HTMLElement,
    state: TimerState,
    callbacks: TimerControlCallbacks,
  ): HTMLButtonElement | undefined {
    const controlsDiv = container.createEl("div", {
      cls: "workout-timer-controls",
    });

    // Start/Stop button
    const startStopBtn = Button.create(controlsDiv, {
      className: "workout-timer-btn workout-timer-start-stop",
      text: "▶",
      ariaLabel: "Start timer",
    });

    // Reset button
    const resetBtn = Button.create(controlsDiv, {
      className: "workout-timer-btn workout-timer-reset",
      text: "↺",
      ariaLabel: "Reset timer",
    });

    // Add event listeners
    Button.onClick(startStopBtn, () => {
      if (state.isRunning) {
        callbacks.onStop();
        startStopBtn.textContent = "▶";
        startStopBtn.setAttribute("aria-label", "Start timer");
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
        startStopBtn.setAttribute("aria-label", "Pause timer");
      }
    });

    Button.onClick(resetBtn, () => {
      callbacks.onReset();
      startStopBtn.textContent = "▶";
      startStopBtn.setAttribute("aria-label", "Start timer");
    });

    return startStopBtn;
  }

  static updateStartStopButton(
    button: HTMLButtonElement | undefined,
    isRunning: boolean,
  ): void {
    if (button) {
      button.textContent = isRunning ? "⏸" : "▶";
    }
  }
}

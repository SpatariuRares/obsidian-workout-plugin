import { TimerState } from "@app/features/timer";
import { Button } from "@app/components/atoms";

export interface TimerControlCallbacks {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export class TimerControls {
  static createControls(
    container: HTMLElement,
    getState: () => TimerState,
    callbacks: TimerControlCallbacks,
  ): HTMLButtonElement | undefined {
    const controlsDiv = container.createEl("div", {
      cls: "workout-timer-controls",
    });

    // Start/Stop button
    const startStopBtn = Button.create(controlsDiv, {
      className: "workout-timer-btn workout-timer-start-stop",
      text: "▶",
      variant: "secondary",
      size: "small",
      ariaLabel: "Start timer",
    });

    // Reset button
    const resetBtn = Button.create(controlsDiv, {
      className: "workout-timer-btn workout-timer-reset",
      text: "↺",
      variant: "secondary",
      size: "small",
      ariaLabel: "Reset timer",
    });

    // Add event listeners
    Button.onClick(startStopBtn, () => {
      const state = getState();
      if (state.isRunning) {
        callbacks.onStop();
        startStopBtn.textContent = "▶";
        startStopBtn.setAttribute("aria-label", "Start timer");
      } else {
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

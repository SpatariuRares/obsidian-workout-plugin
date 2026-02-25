import { TimerState } from "@app/features/timer";
import { Button } from "@app/components/atoms";
import { t } from "@app/i18n";

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
      text: t("icons.timer.play"),
      variant: "secondary",
      size: "small",
      ariaLabel: t("timer.controls.startTimer"),
    });

    // Reset button
    const resetBtn = Button.create(controlsDiv, {
      className: "workout-timer-btn workout-timer-reset",
      text: t("icons.timer.reset"),
      variant: "secondary",
      size: "small",
      ariaLabel: t("timer.controls.resetTimer"),
    });

    // Add event listeners
    Button.onClick(startStopBtn, () => {
      const state = getState();
      if (state.isRunning) {
        callbacks.onStop();
        startStopBtn.textContent = t("icons.timer.play");
        startStopBtn.setAttribute("aria-label", t("timer.controls.startTimer"));
      } else {
        callbacks.onStart();
        startStopBtn.textContent = t("icons.timer.pause");
        startStopBtn.setAttribute("aria-label", t("timer.controls.pauseTimer"));
      }
    });

    Button.onClick(resetBtn, () => {
      callbacks.onReset();
      startStopBtn.textContent = "▶";
      startStopBtn.setAttribute("aria-label", t("timer.controls.startTimer"));
    });

    return startStopBtn;
  }

  static updateStartStopButton(
    button: HTMLButtonElement | undefined,
    isRunning: boolean,
  ): void {
    if (button) {
      button.textContent = isRunning
        ? t("icons.timer.pause")
        : t("icons.timer.play");
    }
  }
}

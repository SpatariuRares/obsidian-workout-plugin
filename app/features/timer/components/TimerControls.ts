import { TimerState } from "@app/features/timer/types";
import { Button, Icon } from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";
import { t } from "@app/i18n";
import {
  BUTTONVARIANT,
  BUTTONSIZE,
} from "@app/components/atoms/Button";
import { TOUR_TARGETS, markTourTarget } from "@app/features/tour/tourTargets";

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
    const controlsDiv = container.createDiv({
      cls: "workout-timer-controls",
    });

    // Start/Stop button
    const startStopBtn = Button.create(controlsDiv, {
      className: "workout-timer-btn workout-timer-start-stop",
      icon: ICONS.TIMER.PLAY,
      variant: BUTTONVARIANT.PRIMARY,
      size: BUTTONSIZE.SMALL,
      ariaLabel: t("timer.controls.startTimer"),
    });
    markTourTarget(startStopBtn, TOUR_TARGETS.timerStart);

    // Reset button
    const resetBtn = Button.create(controlsDiv, {
      className: "workout-timer-btn workout-timer-reset",
      icon: ICONS.TIMER.RESET,
      variant: BUTTONVARIANT.SECONDARY,
      size: BUTTONSIZE.SMALL,
      ariaLabel: t("timer.controls.resetTimer"),
    });

    // Add event listeners
    Button.onClick(startStopBtn, () => {
      const state = getState();
      if (state.isRunning) {
        callbacks.onStop();
      } else {
        callbacks.onStart();
      }
      this.updateStartStopButton(startStopBtn, !state.isRunning);
    });

    Button.onClick(resetBtn, () => {
      callbacks.onReset();
      this.updateStartStopButton(startStopBtn, false);
    });

    return startStopBtn;
  }

  /** Play or pause icon, with the label a screen reader reads for it */
  static updateStartStopButton(
    button: HTMLButtonElement | undefined,
    isRunning: boolean,
  ): void {
    if (!button) return;
    button.empty();
    Icon.create(button, {
      name: isRunning ? ICONS.TIMER.PAUSE : ICONS.TIMER.PLAY,
      className: "workout-btn-icon",
    });
    button.setAttribute(
      "aria-label",
      isRunning
        ? t("timer.controls.pauseTimer")
        : t("timer.controls.startTimer"),
    );
  }
}

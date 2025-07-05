// Reusable timer configuration section component
import { ModalBase } from "../base/ModalBase";

export interface TimerConfigurationElements {
  timerTypeSelect: HTMLSelectElement;
  durationInput?: HTMLInputElement;
  intervalTimeInput?: HTMLInputElement;
  roundsInput?: HTMLInputElement;
  titleInput: HTMLInputElement;
  showControlsToggle: HTMLInputElement;
  autoStartToggle: HTMLInputElement;
  soundToggle: HTMLInputElement;
}

export interface TimerConfigurationHandlers {
  updateVisibility: () => void;
}

export class TimerConfigurationSection {
  /**
   * Creates the timer configuration section
   */
  static create(
    modal: ModalBase,
    container: HTMLElement
  ): {
    elements: TimerConfigurationElements;
    handlers: TimerConfigurationHandlers;
  } {
    const timerSection = modal.createSection(container, "Timer Configuration");

    // Timer Type selector
    const timerTypeContainer = modal.createFormGroup(timerSection);
    const timerTypeSelect = modal.createSelect(
      timerTypeContainer,
      "Timer Type:",
      [
        { text: "Countdown", value: "countdown" },
        { text: "Interval", value: "interval" },
      ]
    );

    // Duration input (for countdown)
    const durationContainer = modal.createFormGroup(timerSection);
    const durationInput = modal.createNumberInput(
      durationContainer,
      "Duration (seconds):",
      "90",
      1,
      3600,
      "300"
    );

    // Interval configuration (for interval timer)
    const intervalTimeContainer = modal.createFormGroup(timerSection);
    const intervalTimeInput = modal.createNumberInput(
      intervalTimeContainer,
      "Interval Time (seconds):",
      "30",
      1,
      3600,
      "30"
    );

    const roundsContainer = modal.createFormGroup(timerSection);
    const roundsInput = modal.createNumberInput(
      roundsContainer,
      "Rounds:",
      "5",
      1,
      100,
      "5"
    );

    // Title input
    const titleContainer = modal.createFormGroup(timerSection);
    const titleInput = modal.createTextInput(
      titleContainer,
      "Title:",
      "Workout Timer",
      "Workout Timer"
    );

    // Display options
    const displaySection = modal.createSection(container, "Display Options");

    // Show controls toggle
    const showControlsContainer = modal.createCheckboxGroup(displaySection);
    const showControlsToggle = modal.createCheckbox(
      showControlsContainer,
      "Show Controls",
      true,
      "showControls"
    );

    // Auto start toggle
    const autoStartContainer = modal.createCheckboxGroup(displaySection);
    const autoStartToggle = modal.createCheckbox(
      autoStartContainer,
      "Auto Start",
      false,
      "autoStart"
    );

    // Sound toggle
    const soundContainer = modal.createCheckboxGroup(displaySection);
    const soundToggle = modal.createCheckbox(
      soundContainer,
      "Sound",
      false,
      "sound"
    );

    const elements: TimerConfigurationElements = {
      timerTypeSelect,
      durationInput,
      intervalTimeInput,
      roundsInput,
      titleInput,
      showControlsToggle,
      autoStartToggle,
      soundToggle,
    };

    // Create visibility handler
    const updateVisibility = () => {
      const isCountdown = timerTypeSelect.value === "countdown";
      durationContainer.className = isCountdown
        ? "workout-charts-form-group timer-config-countdown"
        : "workout-charts-form-group timer-config-countdown display-none";
      intervalTimeContainer.className = isCountdown
        ? "workout-charts-form-group timer-config-interval display-none"
        : "workout-charts-form-group timer-config-interval";
      roundsContainer.className = isCountdown
        ? "workout-charts-form-group timer-config-rounds display-none"
        : "workout-charts-form-group timer-config-rounds";
    };

    const handlers: TimerConfigurationHandlers = {
      updateVisibility,
    };

    // Setup event listeners
    timerTypeSelect.addEventListener("change", updateVisibility);
    updateVisibility();

    return { elements, handlers };
  }

  /**
   * Gets the timer configuration values
   */
  static getValues(elements: TimerConfigurationElements): {
    timerType: string;
    duration?: number;
    intervalTime?: number;
    rounds?: number;
    title: string;
    showControls: boolean;
    autoStart: boolean;
    sound: boolean;
  } {
    const values: any = {
      timerType: elements.timerTypeSelect.value,
      title: elements.titleInput.value.trim(),
      showControls: elements.showControlsToggle.checked,
      autoStart: elements.autoStartToggle.checked,
      sound: elements.soundToggle.checked,
    };

    if (
      elements.timerTypeSelect.value === "countdown" &&
      elements.durationInput
    ) {
      values.duration = parseInt(elements.durationInput.value) || 90;
    } else if (elements.timerTypeSelect.value === "interval") {
      if (elements.intervalTimeInput) {
        values.intervalTime = parseInt(elements.intervalTimeInput.value) || 30;
      }
      if (elements.roundsInput) {
        values.rounds = parseInt(elements.roundsInput.value) || 5;
      }
    }

    return values;
  }
}

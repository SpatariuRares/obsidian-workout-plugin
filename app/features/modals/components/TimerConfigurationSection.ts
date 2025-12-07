import { CONSTANTS } from "@app/constants/Constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { EmbeddedTimerParams, TIMER_TYPE } from "@app/types";

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
    const timerSection = modal.createSection(container, CONSTANTS.WORKOUT.MODAL.SECTIONS.TIMER_CONFIGURATION);

    // Timer Type selector
    const timerTypeContainer = modal.createFormGroup(timerSection);
    const timerTypeSelect = modal.createSelect(
      timerTypeContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.TIMER_TYPE,
      [
        { text: CONSTANTS.WORKOUT.TIMER.TYPES.COUNTDOWN, value: TIMER_TYPE.COUNTDOWN as string },
        { text: CONSTANTS.WORKOUT.TIMER.TYPES.INTERVAL, value: TIMER_TYPE.INTERVAL as string },
      ]
    );

    // Duration input (for countdown)
    const durationContainer = modal.createFormGroup(timerSection);
    const durationInput = modal.createNumberInput(
      durationContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.DURATION,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.REST_TIME,
      1,
      3600,
      "300"
    );

    // Interval configuration (for interval timer)
    const intervalTimeContainer = modal.createFormGroup(timerSection);
    const intervalTimeInput = modal.createNumberInput(
      intervalTimeContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.INTERVAL_TIME,
      "30",
      1,
      3600,
      "30"
    );

    const roundsContainer = modal.createFormGroup(timerSection);
    const roundsInput = modal.createNumberInput(
      roundsContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.ROUNDS,
      "5",
      1,
      100,
      "5"
    );

    // Title input
    const titleContainer = modal.createFormGroup(timerSection);
    const titleInput = modal.createTextInput(
      titleContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.TITLE,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.TIMER_TITLE,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.TIMER_TITLE
    );

    // Display options
    const displaySection = modal.createSection(container, CONSTANTS.WORKOUT.MODAL.SECTIONS.DISPLAY_OPTIONS);

    // Show controls toggle
    const showControlsContainer = modal.createCheckboxGroup(displaySection);
    const showControlsToggle = modal.createCheckbox(
      showControlsContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SHOW_CONTROLS,
      true,
      "showControls"
    );

    // Auto start toggle
    const autoStartContainer = modal.createCheckboxGroup(displaySection);
    const autoStartToggle = modal.createCheckbox(
      autoStartContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.AUTO_START,
      false,
      "autoStart"
    );

    // Sound toggle
    const soundContainer = modal.createCheckboxGroup(displaySection);
    const soundToggle = modal.createCheckbox(
      soundContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SOUND,
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
      const isCountdown = (timerTypeSelect.value as TIMER_TYPE) === TIMER_TYPE.COUNTDOWN;
      durationContainer.className = isCountdown
        ? "workout-charts-form-group workout-timer-config-countdown"
        : "workout-charts-form-group workout-timer-config-countdown workout-display-none";
      intervalTimeContainer.className = isCountdown
        ? "workout-charts-form-group workout-timer-config-interval workout-display-none"
        : "workout-charts-form-group workout-timer-config-interval";
      roundsContainer.className = isCountdown
        ? "workout-charts-form-group workout-timer-config-rounds workout-display-none"
        : "workout-charts-form-group workout-timer-config-rounds";
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
  static getValues(elements: TimerConfigurationElements): EmbeddedTimerParams {
    const values: EmbeddedTimerParams = {
      type: elements.timerTypeSelect.value as TIMER_TYPE,
      title: elements.titleInput.value.trim(),
      showControls: elements.showControlsToggle.checked,
      autoStart: elements.autoStartToggle.checked,
      sound: elements.soundToggle.checked,
    };

    if (
      (elements.timerTypeSelect.value as TIMER_TYPE) === TIMER_TYPE.COUNTDOWN &&
      elements.durationInput
    ) {
      values.duration = parseInt(elements.durationInput.value) || 90;
    } else if ((elements.timerTypeSelect.value as TIMER_TYPE) === TIMER_TYPE.INTERVAL) {
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

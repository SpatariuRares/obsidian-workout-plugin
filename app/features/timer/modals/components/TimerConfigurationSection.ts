import { CONSTANTS } from "@app/constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { EmbeddedTimerParams, TIMER_TYPE } from "@app/features/timer";

export interface TimerConfigurationElements {
  timerTypeSelect: HTMLSelectElement;
  durationInput?: HTMLInputElement;
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
    container: HTMLElement,
  ): {
    elements: TimerConfigurationElements;
    handlers: TimerConfigurationHandlers;
  } {
    const timerSection = modal.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.TIMER_CONFIGURATION,
    );

    // Timer Type selector
    const timerTypeContainer = modal.createFormGroup(timerSection);
    const timerTypeSelect = modal.createSelect(
      timerTypeContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.TIMER_TYPE,
      [
        {
          text: CONSTANTS.WORKOUT.TIMER.TYPES.COUNTDOWN,
          value: TIMER_TYPE.COUNTDOWN as string,
        },
        {
          text: CONSTANTS.WORKOUT.TIMER.TYPES.INTERVAL,
          value: TIMER_TYPE.INTERVAL as string,
        },
      ],
    );

    // Duration input (used for all timer types)
    const durationContainer = modal.createFormGroup(timerSection);
    const durationInput = modal.createNumberInput(
      durationContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.DURATION,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.REST_TIME,
      1,
      3600,
      "30",
    );

    // Rounds input (for interval timer only)
    const roundsContainer = modal.createFormGroup(timerSection);
    const roundsInput = modal.createNumberInput(
      roundsContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.ROUNDS,
      "5",
      1,
      100,
      "5",
    );

    // Title input
    const titleContainer = modal.createFormGroup(timerSection);
    const titleInput = modal.createTextInput(
      titleContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.TITLE,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.TIMER_TITLE,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.TIMER_TITLE,
    );

    // Display options
    const displaySection = modal.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.DISPLAY_OPTIONS,
    );

    // Show controls toggle
    const showControlsContainer = modal.createCheckboxGroup(displaySection);
    const showControlsToggle = modal.createCheckbox(
      showControlsContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SHOW_CONTROLS,
      true,
      "showControls",
    );

    // Auto start toggle
    const autoStartContainer = modal.createCheckboxGroup(displaySection);
    const autoStartToggle = modal.createCheckbox(
      autoStartContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.AUTO_START,
      false,
      "autoStart",
    );

    // Sound toggle
    const soundContainer = modal.createCheckboxGroup(displaySection);
    const soundToggle = modal.createCheckbox(
      soundContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SOUND,
      false,
      "sound",
    );

    const elements: TimerConfigurationElements = {
      timerTypeSelect,
      durationInput,
      roundsInput,
      titleInput,
      showControlsToggle,
      autoStartToggle,
      soundToggle,
    };

    // Create visibility handler
    const updateVisibility = () => {
      const isInterval =
        (timerTypeSelect.value as TIMER_TYPE) === TIMER_TYPE.INTERVAL;
      // Duration is always visible for all timer types
      durationContainer.className =
        "workout-charts-form-group workout-timer-config-duration";
      // Rounds only visible for interval timer
      roundsContainer.className = isInterval
        ? "workout-charts-form-group workout-timer-config-rounds"
        : "workout-charts-form-group workout-timer-config-rounds workout-display-none";
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
    const timerType = elements.timerTypeSelect.value as TIMER_TYPE;

    const values: EmbeddedTimerParams = {
      type: timerType,
      title: elements.titleInput.value.trim(),
      showControls: elements.showControlsToggle.checked,
      autoStart: elements.autoStartToggle.checked,
      sound: elements.soundToggle.checked,
    };

    // Duration is used for all timer types
    if (elements.durationInput) {
      values.duration = parseInt(elements.durationInput.value) || 30;
    }

    // Rounds only applies to interval timer
    if (timerType === TIMER_TYPE.INTERVAL && elements.roundsInput) {
      values.rounds = parseInt(elements.roundsInput.value) || 5;
    }

    return values;
  }
}

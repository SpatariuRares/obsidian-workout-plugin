import { CONSTANTS } from "@app/constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { EmbeddedTimerParams, TIMER_TYPE } from "@app/features/timer";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import type WorkoutChartsPlugin from "main";

export interface TimerConfigurationElements {
  timerTypeSelect: HTMLSelectElement;
  durationInput?: HTMLInputElement;
  roundsInput?: HTMLInputElement;
  exerciseInput: HTMLInputElement;
  showControlsToggle: HTMLInputElement;
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
    plugin: WorkoutChartsPlugin,
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

    // Exercise autocomplete (replaces old title input)
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      modal,
      timerSection,
      plugin,
      undefined,
      { showCreateButton: false },
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
      exerciseInput: exerciseElements.exerciseInput,
      showControlsToggle,
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
      exercise: elements.exerciseInput.value.trim(),
      showControls: elements.showControlsToggle.checked,
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

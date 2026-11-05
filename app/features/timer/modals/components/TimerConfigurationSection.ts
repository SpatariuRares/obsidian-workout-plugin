import { AdjustField } from "@app/components/molecules/AdjustField";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import {
  EmbeddedTimerParams,
  TIMER_TYPE,
} from "@app/features/timer/types";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import {
  ChipGroup,
  type ChipGroupResult,
} from "@app/components/molecules/ChipGroup";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";

export interface TimerConfigurationElements {
  /** The timer type chips; `value()` is the picked TIMER_TYPE */
  timerType: ChipGroupResult<TIMER_TYPE>;
  /** Row under the timer type for the presets of that type (filled by the modal) */
  presetGroup: HTMLElement;
  durationInput: HTMLInputElement;
  durationContainer: HTMLElement;
  restInput: HTMLInputElement;
  restContainer: HTMLElement;
  roundsInput: HTMLInputElement;
  roundsContainer: HTMLElement;
  exerciseInput: HTMLInputElement;
  showControlsToggle: HTMLInputElement;
  soundToggle: HTMLInputElement;
}

export interface TimerConfigurationHandlers {
  updateVisibility: () => void;
  setTimerType: (type: TIMER_TYPE) => void;
}

const DURATION_INCREMENT = 15;
const ROUNDS_INCREMENT = 1;
const REST_INCREMENT = 5;

export class TimerConfigurationSection {
  /**
   * Creates the timer fields (type chips, presets, adjust fields) directly in
   * the modal, then the display options. onTypeChange runs when the user
   * picks another type.
   */
  static create(
    modal: ModalBase,
    container: HTMLElement,
    plugin: WorkoutPluginContext,
    onTypeChange?: (type: TIMER_TYPE) => void,
  ): {
    elements: TimerConfigurationElements;
    handlers: TimerConfigurationHandlers;
  } {
    // The modal is already about the timer, so its fields need no card
    const typeGroup = modal.createFormGroup(container);
    const timerType = ChipGroup.create<TIMER_TYPE>(typeGroup, {
      label: t("modal.timerType"),
      options: [
        { id: TIMER_TYPE.COUNTDOWN, label: t("timer.countdown") },
        { id: TIMER_TYPE.INTERVAL, label: t("timer.interval") },
        { id: TIMER_TYPE.STOPWATCH, label: t("timer.stopwatch") },
      ],
      selected: TIMER_TYPE.COUNTDOWN,
      className: "workout-modal-type-chips",
      onPick: (type) => {
        updateVisibility();
        onTypeChange?.(type);
      },
    });

    // Presets of the selected type, between the type and its values
    const presetGroup = modal.createFormGroup(container);

    // Parameters container (grid: 1 col mobile, 2 col desktop)
    const parametersContainer = container.createDiv({
      cls: "workout-parameters-container",
    });

    // Duration field with +/- adjust (hidden for stopwatch)
    const durationContainer = parametersContainer.createDiv({
      cls: "workout-field-with-adjust",
    });
    const durationInput = AdjustField.fill(durationContainer, {
      label: t("modal.duration"),
      value: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION,
      min: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION_MIN,
      max: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION_MAX,
      step: DURATION_INCREMENT,
      unit: "s",
    });

    // Rest field with +/- adjust (interval only)
    const restContainer = parametersContainer.createDiv({
      cls: "workout-field-with-adjust",
    });
    const restInput = AdjustField.fill(restContainer, {
      label: t("modal.rest"),
      value: 0,
      min: 0,
      max: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION_MAX,
      step: REST_INCREMENT,
      unit: "s",
    });

    // Rounds field with +/- adjust
    const roundsContainer = parametersContainer.createDiv({
      cls: "workout-field-with-adjust",
    });
    const roundsInput = AdjustField.fill(roundsContainer, {
      label: t("modal.rounds"),
      value: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_ROUNDS,
      min: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_ROUNDS_MIN,
      max: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_ROUNDS_MAX,
      step: ROUNDS_INCREMENT,
    });

    // Exercise autocomplete
    const { elements: exerciseElements } =
      ExerciseAutocomplete.create(
        modal,
        container,
        plugin,
        undefined,
        { showCreateButton: false },
      );

    // Display options - compact row
    const displaySection = modal.createSection(
      container,
      t("modal.sections.displayOptions"),
    );

    const optionsRow = displaySection.createDiv({
      cls: "workout-timer-options-row",
    });

    const showControlsContainer =
      modal.createCheckboxGroup(optionsRow);
    const showControlsToggle = modal.createCheckbox(
      showControlsContainer,
      t("modal.checkboxes.showControls"),
      true,
      "showControls",
    );

    const soundContainer = modal.createCheckboxGroup(optionsRow);
    const soundToggle = modal.createCheckbox(
      soundContainer,
      t("modal.checkboxes.sound"),
      false,
      "sound",
    );

    const elements: TimerConfigurationElements = {
      timerType,
      presetGroup,
      durationInput,
      durationContainer,
      restInput,
      restContainer,
      roundsInput,
      roundsContainer,
      exerciseInput: exerciseElements.exerciseInput,
      showControlsToggle,
      soundToggle,
    };

    // Visibility handler
    const updateVisibility = () => {
      const isInterval = timerType.value() === TIMER_TYPE.INTERVAL;
      const isStopwatch = timerType.value() === TIMER_TYPE.STOPWATCH;
      // For intervals the duration is the work phase of each round
      const durationLabel = durationContainer.querySelector(
        ".workout-field-label",
      );
      if (durationLabel) {
        durationLabel.textContent = isInterval
          ? t("modal.work")
          : t("modal.duration");
      }
      for (const intervalOnly of [roundsContainer, restContainer]) {
        if (isInterval) {
          intervalOnly.removeClass("workout-display-none");
        } else {
          intervalOnly.addClass("workout-display-none");
        }
      }
      if (isStopwatch) {
        durationContainer.addClass("workout-display-none");
      } else {
        durationContainer.removeClass("workout-display-none");
      }
    };

    // Picks the type from code, as a click on its chip would
    const setTimerType = (type: TIMER_TYPE) => {
      timerType.select(type);
    };

    const handlers: TimerConfigurationHandlers = {
      updateVisibility,
      setTimerType,
    };

    // Initial visibility
    updateVisibility();

    return { elements, handlers };
  }

  /**
   * Gets the timer configuration values from the elements
   */
  static getValues(
    elements: TimerConfigurationElements,
  ): EmbeddedTimerParams {
    const timerType = elements.timerType.value();

    const values: EmbeddedTimerParams = {
      type: timerType,
      exercise: elements.exerciseInput.value.trim(),
      showControls: elements.showControlsToggle.checked,
      sound: elements.soundToggle.checked,
    };

    if (timerType === TIMER_TYPE.COUNTDOWN) {
      values.duration = parseInt(elements.durationInput.value) || 30;
    }

    // For intervals the duration field is the work phase of each round
    if (timerType === TIMER_TYPE.INTERVAL) {
      values.work = parseInt(elements.durationInput.value) || 30;
      values.rest = Math.max(
        0,
        parseInt(elements.restInput.value) || 0,
      );
      values.rounds = parseInt(elements.roundsInput.value) || 5;
    }

    return values;
  }
}

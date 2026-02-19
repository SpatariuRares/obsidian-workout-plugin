import { CONSTANTS } from "@app/constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { EmbeddedTimerParams, TIMER_TYPE } from "@app/features/timer";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { Chip } from "@app/components/atoms/Chip";
import { Button } from "@app/components/atoms/Button";
import { Input } from "@app/components/atoms/Input";
import { INPUT_TYPE } from "@app/types/InputTypes";
import type WorkoutChartsPlugin from "main";

export interface TimerConfigurationElements {
  timerTypeChips: Map<TIMER_TYPE, HTMLButtonElement>;
  selectedTimerType: TIMER_TYPE;
  durationInput: HTMLInputElement;
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

export class TimerConfigurationSection {
  /**
   * Creates the timer configuration section with chips, adjust fields, and compact options
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

    // Timer Type - chips instead of select
    const typeGroup = modal.createFormGroup(timerSection);
    typeGroup.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.TIMER_TYPE,
    });

    const chipContainer = typeGroup.createDiv({
      cls: "workout-timer-type-chips",
    });

    const selectedTimerType = TIMER_TYPE.COUNTDOWN;
    const timerTypeChips = new Map<TIMER_TYPE, HTMLButtonElement>();

    const timerTypes: Array<{ type: TIMER_TYPE; label: string }> = [
      {
        type: TIMER_TYPE.COUNTDOWN,
        label: CONSTANTS.WORKOUT.TIMER.TYPES.COUNTDOWN,
      },
      {
        type: TIMER_TYPE.INTERVAL,
        label: CONSTANTS.WORKOUT.TIMER.TYPES.INTERVAL,
      },
    ];

    for (const { type, label } of timerTypes) {
      const chip = Chip.create(chipContainer, {
        text: label,
        selected: type === selectedTimerType,
        onClick: () => {
          setTimerType(type);
        },
      });
      timerTypeChips.set(type, chip);
    }

    // Parameters container (grid: 1 col mobile, 2 col desktop)
    const parametersContainer = timerSection.createDiv({
      cls: "workout-parameters-container",
    });

    // Duration field with +/- adjust
    const durationInput = TimerConfigurationSection.createAdjustField(
      parametersContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.DURATION,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION_MIN,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION_MAX,
      DURATION_INCREMENT,
      "s",
    );

    // Rounds field with +/- adjust
    const roundsContainer = parametersContainer.createDiv({
      cls: "workout-field-with-adjust",
    });
    const roundsInput = TimerConfigurationSection.createAdjustFieldInContainer(
      roundsContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.ROUNDS,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_ROUNDS,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_ROUNDS_MIN,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_ROUNDS_MAX,
      ROUNDS_INCREMENT,
    );

    // Exercise autocomplete
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      modal,
      timerSection,
      plugin,
      undefined,
      { showCreateButton: false },
    );

    // Display options - compact row
    const displaySection = modal.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.DISPLAY_OPTIONS,
    );

    const optionsRow = displaySection.createDiv({
      cls: "workout-timer-options-row",
    });

    const showControlsContainer = modal.createCheckboxGroup(optionsRow);
    const showControlsToggle = modal.createCheckbox(
      showControlsContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SHOW_CONTROLS,
      true,
      "showControls",
    );

    const soundContainer = modal.createCheckboxGroup(optionsRow);
    const soundToggle = modal.createCheckbox(
      soundContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SOUND,
      false,
      "sound",
    );

    const elements: TimerConfigurationElements = {
      timerTypeChips,
      selectedTimerType,
      durationInput,
      roundsInput,
      roundsContainer,
      exerciseInput: exerciseElements.exerciseInput,
      showControlsToggle,
      soundToggle,
    };

    // Visibility handler
    const updateVisibility = () => {
      const isInterval = elements.selectedTimerType === TIMER_TYPE.INTERVAL;
      if (isInterval) {
        roundsContainer.removeClass("workout-display-none");
      } else {
        roundsContainer.addClass("workout-display-none");
      }
    };

    // Timer type selection handler
    const setTimerType = (type: TIMER_TYPE) => {
      elements.selectedTimerType = type;
      for (const [t, chip] of timerTypeChips) {
        Chip.setSelected(chip, t === type);
      }
      updateVisibility();
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
   * Creates a field with +/- adjust buttons (replicates DynamicFieldsRenderer pattern)
   */
  private static createAdjustField(
    parent: HTMLElement,
    label: string,
    defaultValue: number,
    min: number,
    max: number,
    increment: number,
    unit?: string,
  ): HTMLInputElement {
    const fieldContainer = parent.createDiv({
      cls: "workout-field-with-adjust",
    });

    return TimerConfigurationSection.createAdjustFieldInContainer(
      fieldContainer,
      label,
      defaultValue,
      min,
      max,
      increment,
      unit,
    );
  }

  /**
   * Creates adjust field content inside a given container
   */
  private static createAdjustFieldInContainer(
    fieldContainer: HTMLElement,
    label: string,
    defaultValue: number,
    min: number,
    max: number,
    increment: number,
    unit?: string,
  ): HTMLInputElement {
    const labelText = unit ? `${label} (${unit})` : label;
    const labelEl = fieldContainer.createDiv({ cls: "workout-field-label" });
    labelEl.textContent = labelText;

    const inputContainer = fieldContainer.createDiv({
      cls: "workout-input-with-adjust",
    });

    const minusBtn = Button.create(inputContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_MINUS + increment,
      className: "workout-adjust-btn workout-adjust-minus",
      ariaLabel: `Decrease ${label} by ${increment}`,
      variant: "secondary",
      size: "small",
    });
    minusBtn.type = "button";

    const input = Input.create(inputContainer, {
      type: INPUT_TYPE.NUMBER,
      className: "workout-charts-input",
      min,
      max,
      step: 1,
      value: defaultValue,
    });

    const plusBtn = Button.create(inputContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_PLUS + increment,
      className: "workout-adjust-btn workout-adjust-plus",
      ariaLabel: `Increase ${label} by ${increment}`,
      variant: "secondary",
      size: "small",
    });
    plusBtn.type = "button";

    Button.onClick(minusBtn, () => {
      const current = parseInt(input.value) || 0;
      input.value = Math.max(min, current - increment).toString();
    });

    Button.onClick(plusBtn, () => {
      const current = parseInt(input.value) || 0;
      input.value = Math.min(max, current + increment).toString();
    });

    return input;
  }

  /**
   * Gets the timer configuration values from the elements
   */
  static getValues(elements: TimerConfigurationElements): EmbeddedTimerParams {
    const timerType = elements.selectedTimerType;

    const values: EmbeddedTimerParams = {
      type: timerType,
      exercise: elements.exerciseInput.value.trim(),
      showControls: elements.showControlsToggle.checked,
      sound: elements.soundToggle.checked,
    };

    values.duration = parseInt(elements.durationInput.value) || 30;

    if (timerType === TIMER_TYPE.INTERVAL) {
      values.rounds = parseInt(elements.roundsInput.value) || 5;
    }

    return values;
  }
}

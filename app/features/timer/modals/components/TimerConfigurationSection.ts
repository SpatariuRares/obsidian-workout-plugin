import { ModalBase } from "@app/features/modals/base/ModalBase";
import { EmbeddedTimerParams, TIMER_TYPE } from "@app/features/timer/types";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { Chip } from "@app/components/atoms/Chip";
import {
  Button,
  BUTTONSIZE,
  BUTTONVARIANT,
} from "@app/components/atoms/Button";
import { Input } from "@app/components/atoms/Input";
import { INPUT_TYPE } from "@app/types/InputTypes";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";

export interface TimerConfigurationElements {
  timerTypeChips: Map<TIMER_TYPE, HTMLButtonElement>;
  selectedTimerType: TIMER_TYPE;
  /** Row under the timer type for the presets of that type (filled by the modal) */
  presetGroup: HTMLElement;
  presetChipsContainer: HTMLElement;
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
    // Timer Type - chips instead of select
    const typeGroup = modal.createFormGroup(container);
    typeGroup.createEl("label", {
      text: t("modal.timerType"),
    });

    const chipContainer = typeGroup.createDiv({
      cls: "workout-timer-type-chips",
    });

    const selectedTimerType = TIMER_TYPE.COUNTDOWN;
    const timerTypeChips = new Map<TIMER_TYPE, HTMLButtonElement>();

    const timerTypes: Array<{ type: TIMER_TYPE; label: string }> = [
      {
        type: TIMER_TYPE.COUNTDOWN,
        label: t("timer.countdown"),
      },
      {
        type: TIMER_TYPE.INTERVAL,
        label: t("timer.interval"),
      },
      {
        type: TIMER_TYPE.STOPWATCH,
        label: t("timer.stopwatch"),
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

    // Presets of the selected type, between the type and its values
    const presetGroup = modal.createFormGroup(container);
    presetGroup.createEl("label", { text: t("modal.sections.preset") });
    const presetChipsContainer = presetGroup.createDiv({
      cls: "workout-timer-preset-chips",
    });

    // Parameters container (grid: 1 col mobile, 2 col desktop)
    const parametersContainer = container.createDiv({
      cls: "workout-parameters-container",
    });

    // Duration field with +/- adjust (hidden for stopwatch)
    const durationContainer = parametersContainer.createDiv({
      cls: "workout-field-with-adjust",
    });
    const durationInput =
      TimerConfigurationSection.createAdjustFieldInContainer(
        durationContainer,
        t("modal.duration"),
        CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION,
        CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION_MIN,
        CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION_MAX,
        DURATION_INCREMENT,
        "s",
      );

    // Rest field with +/- adjust (interval only)
    const restContainer = parametersContainer.createDiv({
      cls: "workout-field-with-adjust",
    });
    const restInput = TimerConfigurationSection.createAdjustFieldInContainer(
      restContainer,
      t("modal.rest"),
      0,
      0,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_DURATION_MAX,
      REST_INCREMENT,
      "s",
    );

    // Rounds field with +/- adjust
    const roundsContainer = parametersContainer.createDiv({
      cls: "workout-field-with-adjust",
    });
    const roundsInput =
      TimerConfigurationSection.createAdjustFieldInContainer(
        roundsContainer,
        t("modal.rounds"),
        CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_ROUNDS,
        CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_ROUNDS_MIN,
        CONSTANTS.WORKOUT.MODAL.DEFAULTS.TIMER_ROUNDS_MAX,
        ROUNDS_INCREMENT,
      );

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
      timerTypeChips,
      selectedTimerType,
      presetGroup,
      presetChipsContainer,
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
      const isInterval =
        elements.selectedTimerType === TIMER_TYPE.INTERVAL;
      const isStopwatch =
        elements.selectedTimerType === TIMER_TYPE.STOPWATCH;
      // For intervals the duration is the work phase of each round
      const durationLabel = durationContainer.querySelector(
        ".workout-field-label",
      );
      if (durationLabel) {
        durationLabel.textContent = isInterval
          ? `${t("modal.work")} (s)`
          : `${t("modal.duration")} (s)`;
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

    // Timer type selection handler
    const setTimerType = (type: TIMER_TYPE) => {
      elements.selectedTimerType = type;
      for (const [t, chip] of timerTypeChips) {
        Chip.setSelected(chip, t === type);
      }
      updateVisibility();
      onTypeChange?.(type);
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
    const labelEl = fieldContainer.createDiv({
      cls: "workout-field-label",
    });
    labelEl.textContent = labelText;

    const inputContainer = fieldContainer.createDiv({
      cls: "workout-input-with-adjust",
    });

    const minusBtn = Button.create(inputContainer, {
      text: t("modal.buttons.adjustMinus") + increment,
      className: "workout-adjust-btn workout-adjust-minus",
      ariaLabel: t("modal.buttons.decreaseBy", { label, increment }),
      variant: BUTTONVARIANT.SECONDARY,
      size: BUTTONSIZE.SMALL,
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
      text: t("modal.buttons.adjustPlus") + increment,
      className: "workout-adjust-btn workout-adjust-plus",
      ariaLabel: t("modal.buttons.increaseBy", { label, increment }),
      variant: BUTTONVARIANT.SECONDARY,
      size: BUTTONSIZE.SMALL,
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
  static getValues(
    elements: TimerConfigurationElements,
  ): EmbeddedTimerParams {
    const timerType = elements.selectedTimerType;

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
      values.rest = Math.max(0, parseInt(elements.restInput.value) || 0);
      values.rounds = parseInt(elements.roundsInput.value) || 5;
    }

    return values;
  }
}

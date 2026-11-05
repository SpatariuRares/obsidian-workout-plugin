import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { CHART_TYPE } from "@app/features/charts/types";
import { setupWorkoutToggle } from "@app/utils/form/FormUtils";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

export interface TargetSectionWithAutocompleteElements {
  exerciseContainer: HTMLElement;
  exerciseInput: HTMLInputElement;
  container: HTMLElement;
  autocompleteContainer: HTMLElement;
  workoutContainer: HTMLElement;
  workoutInput: HTMLInputElement;
  currentWorkoutToggle: HTMLInputElement;
  currentFileInfo: HTMLElement;
}

export interface WorkoutFieldElements {
  workoutContainer: HTMLElement;
  workoutInput: HTMLInputElement;
  currentWorkoutContainer: HTMLElement;
  currentWorkoutToggle: HTMLInputElement;
}

export interface TargetSectionWithAutocompleteHandlers {
  updateVisibility: () => void;
}

const HIDDEN_CLASS = "workout-display-none";

export class TargetSectionWithAutocomplete {
  /**
   * Creates the target section with exercise autocomplete and workout selection.
   * `getType` reads the type picked in the modal (chart or table type); the
   * modal calls `handlers.updateVisibility` when it changes.
   */
  static create(
    modal: ModalBase,
    container: HTMLElement,
    getType: () => CHART_TYPE,
    currentFileName: string,
    plugin: WorkoutPluginContext,
  ): {
    elements: TargetSectionWithAutocompleteElements;
    handlers: TargetSectionWithAutocompleteHandlers;
  } {
    const targetSection = modal.createSection(
      container,
      t("modal.sections.target"),
    );

    // Exercise autocomplete (for exercise-specific charts/tables)
    const exerciseContainer = modal.createFormGroup(targetSection);
    exerciseContainer.classList.add("workout-target-exercise");
    const { elements: exerciseElements } =
      ExerciseAutocomplete.create(modal, exerciseContainer, plugin, undefined, {
        showCreateButton: false,
      });

    const { workoutContainer, workoutInput, currentWorkoutContainer, currentWorkoutToggle } =
      TargetSectionWithAutocomplete.createWorkoutFields(
        modal,
        targetSection,
        currentFileName,
      );

    // Add info text about current file
    const currentFileInfo = modal.createCurrentFileInfo(
      targetSection,
      currentFileName,
    );
    currentFileInfo.classList.add("workout-target-current-file-info");
    currentFileInfo.setAttribute("data-field-type", "file-info");

    const elements: TargetSectionWithAutocompleteElements = {
      container: targetSection,
      exerciseContainer,
      exerciseInput: exerciseElements.exerciseInput,
      autocompleteContainer: exerciseElements.autocompleteContainer,
      workoutContainer,
      workoutInput,
      currentWorkoutToggle,
      currentFileInfo,
    };

    // Create handlers
    const updateVisibility = () => {
      const type = getType();
      const isExercise = type === CHART_TYPE.EXERCISE;
      const isWorkout = type === CHART_TYPE.WORKOUT;
      const isCombined = type === CHART_TYPE.COMBINED;

      exerciseContainer.classList.toggle(
        HIDDEN_CLASS,
        !(isExercise || isCombined),
      );
      workoutContainer.classList.toggle(
        HIDDEN_CLASS,
        !(isWorkout || isCombined),
      );
      currentWorkoutContainer.classList.toggle(
        HIDDEN_CLASS,
        !(isWorkout || isCombined),
      );
      currentFileInfo.classList.toggle(
        HIDDEN_CLASS,
        !(isWorkout || isCombined),
      );
    };

    const handlers: TargetSectionWithAutocompleteHandlers = {
      updateVisibility,
    };

    updateVisibility();

    return { elements, handlers };
  }

  /**
   * The workout name field and its "use current workout file" toggle: ticking
   * the toggle fills the field with the current note's name and locks it
   */
  static createWorkoutFields(
    modal: ModalBase,
    container: HTMLElement,
    currentFileName: string,
    label: string = t("forms.workoutName"),
  ): WorkoutFieldElements {
    const workoutContainer = modal.createFormGroup(container);
    workoutContainer.classList.add("workout-target-workout");
    workoutContainer.setAttribute("data-field-type", t("common.workout"));
    const workoutInput = modal.createTextInput(
      workoutContainer,
      label,
      t("modal.placeholders.workout"),
    );

    const currentWorkoutContainer = modal.createCheckboxGroup(container);
    currentWorkoutContainer.classList.add("workout-target-current-workout");
    currentWorkoutContainer.setAttribute("data-field-type", "current-workout");
    const currentWorkoutToggle = modal.createCheckbox(
      currentWorkoutContainer,
      t("modal.checkboxes.useCurrentWorkoutFile"),
      false,
      "currentWorkout",
    );

    setupWorkoutToggle(
      currentWorkoutToggle,
      workoutInput,
      () => currentFileName,
    );

    return {
      workoutContainer,
      workoutInput,
      currentWorkoutContainer,
      currentWorkoutToggle,
    };
  }

  /** The workout the fields name: the current note when the toggle is on */
  static workoutValue(
    elements: Pick<WorkoutFieldElements, "workoutInput" | "currentWorkoutToggle">,
    currentFileName: string,
  ): string {
    return elements.currentWorkoutToggle.checked
      ? currentFileName
      : elements.workoutInput.value.trim();
  }

  /**
   * Gets the target value based on current selection
   */
  static getTargetValue(
    elements: TargetSectionWithAutocompleteElements,
    type: CHART_TYPE,
    currentFileName: string,
  ): { type: string; exercise?: string; workout?: string } {
    const workoutValue = TargetSectionWithAutocomplete.workoutValue(
      elements,
      currentFileName,
    );

    switch (type) {
      case CHART_TYPE.EXERCISE:
        return {
          type,
          exercise: elements.exerciseInput.value.trim(),
        };
      case CHART_TYPE.WORKOUT:
        return { type, workout: workoutValue };
      case CHART_TYPE.COMBINED:
        return {
          type,
          exercise: elements.exerciseInput.value.trim(),
          workout: workoutValue,
        };
      default:
        return { type: CHART_TYPE.NONE };
    }
  }
}

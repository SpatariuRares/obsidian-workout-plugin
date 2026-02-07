import { CONSTANTS } from "@app/constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { CHART_TYPE } from "@app/features/charts/types";
import { setupWorkoutToggle } from "@app/utils/form/FormUtils";
import type WorkoutChartsPlugin from "main";

export interface TargetSectionWithAutocompleteElements {
  exerciseContainer: HTMLElement;
  exerciseInput: HTMLInputElement;
  container: HTMLElement;
  autocompleteContainer: HTMLElement;
  exerciseStatusText: HTMLElement;
  createExercisePageBtn: HTMLButtonElement;
  workoutContainer: HTMLElement;
  workoutInput: HTMLInputElement;
  currentWorkoutToggle: HTMLInputElement;
  currentFileInfo: HTMLElement;
}

export interface TargetSectionWithAutocompleteHandlers {
  updateVisibility: () => void;
}

const HIDDEN_CLASS = "workout-display-none";

export class TargetSectionWithAutocomplete {
  /**
   * Creates the target section with exercise autocomplete and workout selection
   */
  static create(
    modal: ModalBase,
    container: HTMLElement,
    typeSelect: HTMLSelectElement,
    currentFileName: string,
    plugin: WorkoutChartsPlugin,
  ): {
    elements: TargetSectionWithAutocompleteElements;
    handlers: TargetSectionWithAutocompleteHandlers;
  } {
    const targetSection = modal.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.TARGET,
    );

    // Exercise autocomplete (for exercise-specific charts/tables)
    const exerciseContainer = modal.createFormGroup(targetSection);
    exerciseContainer.classList.add("workout-target-exercise");
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      modal,
      exerciseContainer,
      plugin,
    );

    // Workout input (for workout charts/tables)
    const workoutContainer = modal.createFormGroup(targetSection);
    workoutContainer.classList.add("workout-target-workout");
    workoutContainer.setAttribute(
      "data-field-type",
      CONSTANTS.WORKOUT.COMMON.TYPES.WORKOUT,
    );
    const workoutInput = modal.createTextInput(
      workoutContainer,
      CONSTANTS.WORKOUT.FORMS.LABELS.WORKOUT_NAME,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.WORKOUT,
    );

    // Current Workout checkbox (for workout charts/tables)
    const currentWorkoutContainer = modal.createCheckboxGroup(targetSection);
    currentWorkoutContainer.classList.add("workout-target-current-workout");
    currentWorkoutContainer.setAttribute("data-field-type", "current-workout");
    const currentWorkoutToggle = modal.createCheckbox(
      currentWorkoutContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.USE_CURRENT_WORKOUT_FILE,
      false,
      "currentWorkout",
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
      exerciseStatusText: exerciseElements.exerciseStatusText,
      createExercisePageBtn: exerciseElements.createExercisePageBtn,
      workoutContainer,
      workoutInput,
      currentWorkoutToggle,
      currentFileInfo,
    };

    // Create handlers
    const updateVisibility = () => {
      const type = typeSelect.value as CHART_TYPE;
      const isExercise = type === CHART_TYPE.EXERCISE;
      const isWorkout = type === CHART_TYPE.WORKOUT;
      const isCombined = type === CHART_TYPE.COMBINED;

      exerciseContainer.classList.toggle(HIDDEN_CLASS, !(isExercise || isCombined));
      workoutContainer.classList.toggle(HIDDEN_CLASS, !(isWorkout || isCombined));
      currentWorkoutContainer.classList.toggle(HIDDEN_CLASS, !(isWorkout || isCombined));
      currentFileInfo.classList.toggle(HIDDEN_CLASS, !(isWorkout || isCombined));
    };

    const handlers: TargetSectionWithAutocompleteHandlers = {
      updateVisibility,
    };

    // Setup event listeners
    setupWorkoutToggle(
      currentWorkoutToggle,
      workoutInput,
      () => currentFileName,
    );
    typeSelect.addEventListener("change", updateVisibility);
    updateVisibility();

    return { elements, handlers };
  }

  /**
   * Gets the target value based on current selection
   */
  static getTargetValue(
    elements: TargetSectionWithAutocompleteElements,
    typeSelect: HTMLSelectElement,
    currentFileName: string,
  ): { type: string; exercise?: string; workout?: string } {
    const type = typeSelect.value as CHART_TYPE;
    const useCurrentWorkout = elements.currentWorkoutToggle.checked;
    const workoutValue = useCurrentWorkout
      ? currentFileName
      : elements.workoutInput.value.trim();

    switch (type) {
      case CHART_TYPE.EXERCISE:
        return { type, exercise: elements.exerciseInput.value.trim() };
      case CHART_TYPE.WORKOUT:
        return { type, workout: workoutValue };
      case CHART_TYPE.COMBINED:
        return { type, exercise: elements.exerciseInput.value.trim(), workout: workoutValue };
      default:
        return { type: CHART_TYPE.NONE };
    }
  }
}

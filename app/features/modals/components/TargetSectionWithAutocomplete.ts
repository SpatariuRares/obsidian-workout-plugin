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
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      modal,
      exerciseContainer,
      plugin,
    );

    // Workout input (for workout charts/tables)
    const workoutContainer = modal.createFormGroup(targetSection);
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
      const selectedType = typeSelect.value;
      const isExercise = (selectedType as CHART_TYPE) === CHART_TYPE.EXERCISE;
      const isWorkout = (selectedType as CHART_TYPE) === CHART_TYPE.WORKOUT;
      const isCombined = (selectedType as CHART_TYPE) === CHART_TYPE.COMBINED;

      const showExercise = isExercise || isCombined;
      exerciseContainer.className = showExercise
        ? "workout-charts-form-group workout-target-exercise"
        : "workout-charts-form-group workout-target-exercise workout-display-none";

      const showWorkout = isWorkout || isCombined;
      workoutContainer.className = showWorkout
        ? "workout-charts-form-group workout-target-workout"
        : "workout-charts-form-group workout-target-workout workout-display-none";

      const showCurrentWorkout = isWorkout || isCombined;
      currentWorkoutContainer.className = showCurrentWorkout
        ? "workout-charts-checkbox-group workout-target-current-workout"
        : "workout-charts-checkbox-group workout-target-current-workout workout-display-none";

      const showFileInfo = isWorkout || isCombined;
      currentFileInfo.className = showFileInfo
        ? "workout-current-file-info workout-target-current-file-info"
        : "workout-current-file-info workout-target-current-file-info workout-display-none";

      // Force visibility for combined mode - additional check
      if (isCombined) {
        setTimeout(() => {
          workoutContainer.classList.add("workout-modal-field-visible");
          workoutContainer.classList.remove("workout-modal-field-hidden");
          currentWorkoutContainer.classList.add("workout-modal-field-visible");
          currentWorkoutContainer.classList.remove(
            "workout-modal-field-hidden",
          );
          currentFileInfo.classList.add("workout-modal-field-visible");
          currentFileInfo.classList.remove("workout-modal-field-hidden");
        }, 100);
      }
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
    const selectedType = typeSelect.value;
    const useCurrentWorkout = elements.currentWorkoutToggle.checked;

    if ((selectedType as CHART_TYPE) === CHART_TYPE.EXERCISE) {
      return {
        type: CHART_TYPE.EXERCISE,
        exercise: elements.exerciseInput.value.trim(),
      };
    } else if ((selectedType as CHART_TYPE) === CHART_TYPE.WORKOUT) {
      return {
        type: CHART_TYPE.WORKOUT,
        workout: useCurrentWorkout
          ? currentFileName
          : elements.workoutInput.value.trim(),
      };
    } else if ((selectedType as CHART_TYPE) === CHART_TYPE.COMBINED) {
      return {
        type: CHART_TYPE.COMBINED,
        exercise: elements.exerciseInput.value.trim(),
        workout: useCurrentWorkout
          ? currentFileName
          : elements.workoutInput.value.trim(),
      };
    }

    return { type: CHART_TYPE.NONE };
  }
}

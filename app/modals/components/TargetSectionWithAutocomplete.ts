// Enhanced target section component with exercise autocomplete
import { ModalBase } from "@app/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/modals/components/ExerciseAutocomplete";
import type WorkoutChartsPlugin from "main";

export interface TargetSectionWithAutocompleteElements {
  exerciseContainer: HTMLElement;
  exerciseInput: HTMLInputElement;
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
  handleCurrentWorkoutToggle: () => void;
}

export class TargetSectionWithAutocomplete {
  /**
   * Creates the target section with exercise autocomplete and workout selection
   */
  static async create(
    modal: ModalBase,
    container: HTMLElement,
    typeSelect: HTMLSelectElement,
    currentFileName: string,
    plugin: WorkoutChartsPlugin
  ): Promise<{
    elements: TargetSectionWithAutocompleteElements;
    handlers: TargetSectionWithAutocompleteHandlers;
  }> {
    const targetSection = modal.createSection(container, "Target");

    // Exercise autocomplete (for exercise-specific charts/tables)
    const exerciseContainer = modal.createFormGroup(targetSection);
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      modal,
      exerciseContainer,
      plugin
    );

    // Workout input (for workout charts/tables)
    const workoutContainer = modal.createFormGroup(targetSection);
    workoutContainer.setAttribute("data-field-type", "workout");
    const workoutInput = modal.createTextInput(
      workoutContainer,
      "Workout Name:",
      "e.g. Workout A, Training B, or use checkbox below"
    );

    // Current Workout checkbox (for workout charts/tables)
    const currentWorkoutContainer = modal.createCheckboxGroup(targetSection);
    currentWorkoutContainer.setAttribute("data-field-type", "current-workout");
    const currentWorkoutToggle = modal.createCheckbox(
      currentWorkoutContainer,
      "Use Current Workout (file name)",
      false,
      "currentWorkout"
    );

    // Add info text about current file
    const currentFileInfo = modal.createCurrentFileInfo(
      targetSection,
      currentFileName
    );
    currentFileInfo.setAttribute("data-field-type", "file-info");

    const elements: TargetSectionWithAutocompleteElements = {
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
      const isExercise = selectedType === "exercise";
      const isWorkout = selectedType === "workout";
      const isCombined = selectedType === "combined";

      const showExercise = isExercise || isCombined;
      exerciseContainer.className = showExercise
        ? "workout-charts-form-group target-exercise"
        : "workout-charts-form-group target-exercise display-none";

      const showWorkout = isWorkout || isCombined;
      workoutContainer.className = showWorkout
        ? "workout-charts-form-group target-workout"
        : "workout-charts-form-group target-workout display-none";

      const showCurrentWorkout = isWorkout || isCombined;
      currentWorkoutContainer.className = showCurrentWorkout
        ? "workout-charts-checkbox-group target-current-workout"
        : "workout-charts-checkbox-group target-current-workout display-none";

      const showFileInfo = isWorkout || isCombined;
      currentFileInfo.className = showFileInfo
        ? "current-file-info target-current-file-info"
        : "current-file-info target-current-file-info display-none";

      // Force visibility for combined mode - additional check
      if (isCombined) {
        setTimeout(() => {
          workoutContainer.classList.add("modal-field-visible");
          workoutContainer.classList.remove("modal-field-hidden");
          currentWorkoutContainer.classList.add("modal-field-visible");
          currentWorkoutContainer.classList.remove("modal-field-hidden");
          currentFileInfo.classList.add("modal-field-visible");
          currentFileInfo.classList.remove("modal-field-hidden");
        }, 100);
      }
    };

    const handleCurrentWorkoutToggle = () => {
      if (currentWorkoutToggle.checked) {
        workoutInput.disabled = true;
        workoutInput.value = currentFileName;
        workoutInput.classList.add("opacity-50");
        workoutInput.classList.remove("opacity-100");
      } else {
        workoutInput.disabled = false;
        workoutInput.value = "";
        workoutInput.classList.add("opacity-100");
        workoutInput.classList.remove("opacity-50");
      }
    };

    const handlers: TargetSectionWithAutocompleteHandlers = {
      updateVisibility,
      handleCurrentWorkoutToggle,
    };

    // Setup event listeners
    currentWorkoutToggle.addEventListener("change", handleCurrentWorkoutToggle);
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
    currentFileName: string
  ): { type: string; exercise?: string; workout?: string } {
    const selectedType = typeSelect.value;
    const useCurrentWorkout = elements.currentWorkoutToggle.checked;

    if (selectedType === "exercise") {
      return {
        type: "exercise",
        exercise: elements.exerciseInput.value.trim(),
      };
    } else if (selectedType === "workout") {
      return {
        type: "workout",
        workout: useCurrentWorkout
          ? currentFileName
          : elements.workoutInput.value.trim(),
      };
    } else if (selectedType === "combined") {
      return {
        type: "combined",
        exercise: elements.exerciseInput.value.trim(),
        workout: useCurrentWorkout
          ? currentFileName
          : elements.workoutInput.value.trim(),
      };
    }

    return { type: "none" };
  }
}

// Enhanced target section component with exercise autocomplete
import { ModalBase } from "../base/ModalBase";
import { ExerciseAutocomplete } from "./ExerciseAutocomplete";
import type WorkoutChartsPlugin from "../../../main";

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
    const { elements: exerciseElements } = await ExerciseAutocomplete.create(
      modal,
      exerciseContainer,
      plugin
    );

    // Workout input (for workout charts/tables)
    const workoutContainer = modal.createFormGroup(targetSection);
    workoutContainer.setAttribute("data-field-type", "workout");
    const workoutInput = modal.createTextInput(
      workoutContainer,
      "Nome Allenamento:",
      "Es. Allenamento A, Workout B, o usa il checkbox sotto"
    );

    // Current Workout checkbox (for workout charts/tables)
    const currentWorkoutContainer = modal.createCheckboxGroup(targetSection);
    currentWorkoutContainer.setAttribute("data-field-type", "current-workout");
    const currentWorkoutToggle = modal.createCheckbox(
      currentWorkoutContainer,
      "Usa Allenamento Corrente (nome file)",
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

      // Exercise container: show for exercise or combined mode
      const showExercise = isExercise || isCombined;
      exerciseContainer.className = showExercise
        ? "workout-charts-form-group target-exercise"
        : "workout-charts-form-group target-exercise display-none";
      exerciseContainer.style.display = showExercise ? "" : "none";

      // Workout container: show for workout or combined mode
      const showWorkout = isWorkout || isCombined;
      workoutContainer.className = showWorkout
        ? "workout-charts-form-group target-workout"
        : "workout-charts-form-group target-workout display-none";
      workoutContainer.style.display = showWorkout ? "" : "none";

      // Current workout toggle: show for workout or combined mode
      const showCurrentWorkout = isWorkout || isCombined;
      currentWorkoutContainer.className = showCurrentWorkout
        ? "workout-charts-checkbox-group target-current-workout"
        : "workout-charts-checkbox-group target-current-workout display-none";
      currentWorkoutContainer.style.display = showCurrentWorkout ? "" : "none";

      // Current file info: show for workout or combined mode
      const showFileInfo = isWorkout || isCombined;
      currentFileInfo.className = showFileInfo
        ? "current-file-info target-current-file-info"
        : "current-file-info target-current-file-info display-none";
      currentFileInfo.style.display = showFileInfo ? "" : "none";

      // Force visibility for combined mode - additional check
      if (isCombined) {
        setTimeout(() => {
          workoutContainer.style.display = "";
          workoutContainer.style.visibility = "visible";
          workoutContainer.style.opacity = "1";
          currentWorkoutContainer.style.display = "";
          currentWorkoutContainer.style.visibility = "visible";
          currentWorkoutContainer.style.opacity = "1";
          currentFileInfo.style.display = "";
          currentFileInfo.style.visibility = "visible";
          currentFileInfo.style.opacity = "1";
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

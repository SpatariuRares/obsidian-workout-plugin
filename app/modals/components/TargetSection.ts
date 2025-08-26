// Reusable target section component for exercise/workout selection
import { ModalBase } from "../base/ModalBase";

export interface TargetSectionElements {
  exerciseContainer: HTMLElement;
  exerciseInput: HTMLInputElement;
  workoutContainer: HTMLElement;
  workoutInput: HTMLInputElement;
  currentWorkoutToggle: HTMLInputElement;
  currentFileInfo: HTMLElement;
}

export interface TargetSectionHandlers {
  updateVisibility: () => void;
  handleCurrentWorkoutToggle: () => void;
}

export class TargetSection {
  /**
   * Creates the target section with exercise/workout selection
   */
  static create(
    modal: ModalBase,
    container: HTMLElement,
    typeSelect: HTMLSelectElement,
    currentFileName: string
  ): { elements: TargetSectionElements; handlers: TargetSectionHandlers } {
    const targetSection = modal.createSection(container, "Target");

    // Exercise input (for exercise-specific charts/tables)
    const exerciseContainer = modal.createFormGroup(targetSection);
    const exerciseInput = modal.createTextInput(
      exerciseContainer,
      "Exercise Name:",
      "e.g. Bench Press, Squat, RDL..."
    );

    // Workout input (for workout charts/tables)
    const workoutContainer = modal.createFormGroup(targetSection);
    const workoutInput = modal.createTextInput(
      workoutContainer,
      "Workout Name:",
      "e.g. Workout A, Training B..."
    );

    // Current Workout checkbox (for workout charts/tables)
    const currentWorkoutContainer = modal.createCheckboxGroup(targetSection);
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

    const elements: TargetSectionElements = {
      exerciseContainer,
      exerciseInput,
      workoutContainer,
      workoutInput,
      currentWorkoutToggle,
      currentFileInfo,
    };

    // Create handlers
    const updateVisibility = () => {
      const isExercise = typeSelect.value === "exercise";
      exerciseContainer.className = isExercise
        ? "workout-charts-form-group target-exercise"
        : "workout-charts-form-group target-exercise display-none";
      workoutContainer.className = isExercise
        ? "workout-charts-form-group target-workout display-none"
        : "workout-charts-form-group target-workout";
      currentWorkoutContainer.className = isExercise
        ? "workout-charts-checkbox-group target-current-workout display-none"
        : "workout-charts-checkbox-group target-current-workout";
      currentFileInfo.className = isExercise
        ? "current-file-info target-current-file-info display-none"
        : "current-file-info target-current-file-info";
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

    const handlers: TargetSectionHandlers = {
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
    elements: TargetSectionElements,
    typeSelect: HTMLSelectElement,
    currentFileName: string
  ): { type: string; value: string } {
    const isExercise = typeSelect.value === "exercise";
    const useCurrentWorkout = elements.currentWorkoutToggle.checked;

    if (isExercise) {
      return {
        type: "exercise",
        value: elements.exerciseInput.value.trim(),
      };
    } else {
      return {
        type: "workout",
        value: useCurrentWorkout
          ? currentFileName
          : elements.workoutInput.value.trim(),
      };
    }
  }
}

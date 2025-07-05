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
      "Nome Esercizio:",
      "Es. Panca Piana, Squat, RDL..."
    );

    // Workout input (for workout charts/tables)
    const workoutContainer = modal.createFormGroup(targetSection);
    const workoutInput = modal.createTextInput(
      workoutContainer,
      "Nome Allenamento:",
      "Es. Allenamento A, Workout B..."
    );

    // Current Workout checkbox (for workout charts/tables)
    const currentWorkoutContainer = modal.createCheckboxGroup(targetSection);
    const currentWorkoutToggle = modal.createCheckbox(
      currentWorkoutContainer,
      "Usa Allenamento Corrente (nome file)",
      false,
      "currentWorkout"
    );

    // Add info text about current file
    const currentFileInfo = targetSection.createEl("div", {
      cls: "current-file-info",
    });
    Object.assign(currentFileInfo.style, {
      fontSize: "0.8em",
      color: "var(--text-muted)",
      fontStyle: "italic",
      marginTop: "5px",
      padding: "5px",
      backgroundColor: "var(--background-modifier-border)",
      borderRadius: "4px",
    });
    currentFileInfo.textContent = `File corrente: ${currentFileName}`;

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
      exerciseContainer.style.display = isExercise ? "block" : "none";
      workoutContainer.style.display = isExercise ? "none" : "block";
      currentWorkoutContainer.style.display = isExercise ? "none" : "block";
      currentFileInfo.style.display = isExercise ? "none" : "block";
    };

    const handleCurrentWorkoutToggle = () => {
      if (currentWorkoutToggle.checked) {
        workoutInput.disabled = true;
        workoutInput.value = currentFileName;
        workoutInput.style.opacity = "0.5";
      } else {
        workoutInput.disabled = false;
        workoutInput.value = "";
        workoutInput.style.opacity = "1";
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

// Reusable exercise autocomplete component
import { CONSTANTS } from "@app/constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import type WorkoutChartsPlugin from "main";
import { CreateExercisePageModal } from "@app/features/modals/CreateExercisePageModal";
import { ExercisePathResolver } from "@app/utils/ExercisePathResolver";

import { Button } from "@app/components/atoms";

export interface ExerciseAutocompleteElements {
  exerciseInput: HTMLInputElement;
  autocompleteContainer: HTMLElement;
  exerciseStatusText: HTMLElement;
  createExercisePageBtn: HTMLButtonElement;
}

export interface ExerciseAutocompleteHandlers {
  showAutocomplete: (_query: string) => void;
  hideAutocomplete: () => void;
}

export class ExerciseAutocomplete {
  private availableExercises: string[] = [];
  private exerciseExists: boolean = false;

  /**
   * Creates the exercise autocomplete component
   */
  static create(
    modal: ModalBase,
    container: HTMLElement,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
  ): {
    elements: ExerciseAutocompleteElements;
    handlers: ExerciseAutocompleteHandlers;
    exerciseExists: boolean;
  } {
    const instance = new ExerciseAutocomplete();
    instance.loadAvailableExercises(plugin);

    // Exercise input with autocomplete
    const exerciseContainer = modal.createFormGroup(container);
    const exerciseInput = modal.createTextInput(
      exerciseContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.EXERCISE,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.EXERCISE_AUTOCOMPLETE,
      exerciseName || "",
    );

    // Autocomplete container
    const autocompleteContainer = exerciseContainer.createEl("div", {
      cls: "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden",
    });

    // Exercise status indicator and create page button
    const exerciseStatusContainer = exerciseContainer.createEl("div", {
      cls: "workout-exercise-autocomplete-hidden",
    });

    const exerciseStatusText = exerciseStatusContainer.createEl("span", {
      cls: "workout-exercise-status-text",
    });

    // Create exercise page button using Button atom
    const createExercisePageBtn = Button.create(exerciseStatusContainer, {
      text: CONSTANTS.WORKOUT.MODAL.EXERCISE_STATUS.CREATE_PAGE,
      className: "workout-create-exercise-page-btn workout-display-none",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.EXERCISE_STATUS.CREATE_PAGE,
    });

    const elements: ExerciseAutocompleteElements = {
      exerciseInput,
      autocompleteContainer,
      exerciseStatusText,
      createExercisePageBtn,
    };

    // Create handlers
    const showAutocomplete = (query: string) => {
      if (!query.trim() || query.length < 1) {
        autocompleteContainer.className =
          "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden";
        createExercisePageBtn.className =
          "workout-create-exercise-page-btn workout-display-none";
        return;
      }

      const matchingExercises = instance.availableExercises.filter((exercise) =>
        exercise.toLowerCase().startsWith(query.toLowerCase()),
      );

      if (matchingExercises.length > 0) {
        autocompleteContainer.empty();
        autocompleteContainer.className =
          "workout-exercise-autocomplete-container workout-exercise-autocomplete-visible";

        matchingExercises.slice(0, 8).forEach((exercise) => {
          const suggestion = autocompleteContainer.createEl("div", {
            cls: "workout-exercise-autocomplete-suggestion",
            text: exercise,
          });

          suggestion.addEventListener("click", () => {
            exerciseInput.value = exercise;
            exerciseInput.dispatchEvent(new Event("change"));
            autocompleteContainer.className =
              "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden";
            createExercisePageBtn.className =
              "workout-create-exercise-page-btn workout-display-none";
            instance.exerciseExists = true;
          });

          suggestion.addEventListener("mouseenter", () => {
            suggestion.classList.add(
              "workout-exercise-autocomplete-suggestion-hover",
            );
          });

          suggestion.addEventListener("mouseleave", () => {
            suggestion.classList.remove(
              "workout-exercise-autocomplete-suggestion-hover",
            );
          });
        });
        exerciseStatusContainer.className =
          "workout-exercise-autocomplete-hidden";
        createExercisePageBtn.className =
          "workout-create-exercise-page-btn workout-display-none";
        instance.exerciseExists = true;
      } else {
        autocompleteContainer.className =
          "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden";
        exerciseStatusContainer.className = "workout-exercise-status-container workout-exercise-autocomplete-no-found";
        exerciseStatusText.textContent =
          CONSTANTS.WORKOUT.MODAL.EXERCISE_STATUS.NOT_FOUND;
        exerciseStatusText.className =
          "workout-exercise-status-text workout-exercise-status-warning";
        createExercisePageBtn.className =
          "workout-create-exercise-page-btn workout-display-inline-block";
        instance.exerciseExists = false;
      }
    };

    const hideAutocomplete = () => {
      setTimeout(() => {
        autocompleteContainer.className =
          "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden";
      }, 200);
    };

    const handlers: ExerciseAutocompleteHandlers = {
      showAutocomplete,
      hideAutocomplete,
    };

    // Setup event listeners
    exerciseInput.addEventListener("input", (e) => {
      const exerciseName = (e.target as HTMLInputElement).value;
      showAutocomplete(exerciseName);
    });

    exerciseInput.addEventListener("blur", hideAutocomplete);

    // Create exercise page button event listener using Button helper
    Button.onClick(createExercisePageBtn, () => {
      const exerciseName = exerciseInput.value.trim();
      if (exerciseName) {
        new CreateExercisePageModal(modal.app, plugin, exerciseName).open();
      }
    });

    // Initial check if exercise name is pre-filled
    if (exerciseName) {
      showAutocomplete(exerciseName);
    }

    return {
      elements,
      handlers,
      exerciseExists: instance.exerciseExists,
    };
  }

  /**
   * Loads available exercises from the exercise folder
   */
  private loadAvailableExercises(plugin: WorkoutChartsPlugin) {
    try {
      // Use ExercisePathResolver to get exercise names
      this.availableExercises = ExercisePathResolver.getExerciseNames(plugin);
    } catch {
      this.availableExercises = [];
    }
  }
}

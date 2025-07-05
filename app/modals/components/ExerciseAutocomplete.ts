// Reusable exercise autocomplete component
import { ModalBase } from "../base/ModalBase";
import type WorkoutChartsPlugin from "../../../main";
import { CreateExercisePageModal } from "../CreateExercisePageModal";

export interface ExerciseAutocompleteElements {
  exerciseInput: HTMLInputElement;
  autocompleteContainer: HTMLElement;
  exerciseStatusText: HTMLElement;
  createExercisePageBtn: HTMLButtonElement;
}

export interface ExerciseAutocompleteHandlers {
  showAutocomplete: (query: string) => void;
  hideAutocomplete: () => void;
}

export class ExerciseAutocomplete {
  private availableExercises: string[] = [];
  private exerciseExists: boolean = false;

  /**
   * Creates the exercise autocomplete component
   */
  static async create(
    modal: ModalBase,
    container: HTMLElement,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string
  ): Promise<{
    elements: ExerciseAutocompleteElements;
    handlers: ExerciseAutocompleteHandlers;
    exerciseExists: boolean;
  }> {
    const instance = new ExerciseAutocomplete();
    await instance.loadAvailableExercises(plugin);

    // Exercise input with autocomplete
    const exerciseContainer = modal.createFormGroup(container);
    const exerciseInput = modal.createTextInput(
      exerciseContainer,
      "Exercise:",
      "Start typing to see available exercises...",
      exerciseName || ""
    );

    // Autocomplete container
    const autocompleteContainer = exerciseContainer.createEl("div", {
      cls: "exercise-autocomplete-container",
    });
    autocompleteContainer.style.display = "none";

    // Exercise status indicator and create page button
    const exerciseStatusContainer = exerciseContainer.createEl("div", {
      cls: "exercise-status-container",
    });

    const exerciseStatusText = exerciseStatusContainer.createEl("span", {
      cls: "exercise-status-text",
    });

    const createExercisePageBtn = exerciseStatusContainer.createEl("button", {
      text: "📝 Crea Pagina Esercizio",
      cls: "create-exercise-page-btn",
    });
    createExercisePageBtn.style.display = "none";

    const elements: ExerciseAutocompleteElements = {
      exerciseInput,
      autocompleteContainer,
      exerciseStatusText,
      createExercisePageBtn,
    };

    // Create handlers
    const showAutocomplete = (query: string) => {
      if (!query.trim() || query.length < 1) {
        autocompleteContainer.style.display = "none";
        exerciseStatusText.textContent = "";
        createExercisePageBtn.style.display = "none";
        return;
      }

      const matchingExercises = instance.availableExercises.filter((exercise) =>
        exercise.toLowerCase().startsWith(query.toLowerCase())
      );

      if (matchingExercises.length > 0) {
        autocompleteContainer.innerHTML = "";
        autocompleteContainer.style.display = "block";

        matchingExercises.slice(0, 8).forEach((exercise) => {
          const suggestion = autocompleteContainer.createEl("div", {
            cls: "exercise-autocomplete-suggestion",
            text: exercise,
          });

          suggestion.addEventListener("click", () => {
            exerciseInput.value = exercise;
            autocompleteContainer.style.display = "none";
            exerciseStatusText.textContent = "✅ Esercizio selezionato";
            exerciseStatusText.style.color = "var(--text-success)";
            createExercisePageBtn.style.display = "none";
            instance.exerciseExists = true;
          });

          suggestion.addEventListener("mouseenter", () => {
            suggestion.style.backgroundColor =
              "var(--background-modifier-hover)";
          });

          suggestion.addEventListener("mouseleave", () => {
            suggestion.style.backgroundColor = "var(--background-secondary)";
          });
        });

        exerciseStatusText.textContent = `📋 ${matchingExercises.length} esercizi trovati`;
        exerciseStatusText.style.color = "var(--text-accent)";
        createExercisePageBtn.style.display = "none";
        instance.exerciseExists = true;
      } else {
        autocompleteContainer.style.display = "none";
        exerciseStatusText.textContent = "⚠️ Nessun esercizio trovato";
        exerciseStatusText.style.color = "var(--text-warning)";
        createExercisePageBtn.style.display = "inline-block";
        instance.exerciseExists = false;
      }
    };

    const hideAutocomplete = () => {
      setTimeout(() => {
        autocompleteContainer.style.display = "none";
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

    // Create exercise page button event listener
    createExercisePageBtn.addEventListener("click", () => {
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
  private async loadAvailableExercises(plugin: WorkoutChartsPlugin) {
    const exerciseFolderPath = plugin.settings.exerciseFolderPath;
    if (!exerciseFolderPath) {
      this.availableExercises = [];
      return;
    }

    try {
      // Get all markdown files in the exercise folder
      const files = plugin.app.vault
        .getMarkdownFiles()
        .filter((file) => file.path.startsWith(exerciseFolderPath));

      // Extract exercise names from filenames (remove .md extension)
      this.availableExercises = files.map((file) => file.basename).sort();

      if (plugin.settings.debugMode) {
        console.log(
          `Loaded ${this.availableExercises.length} exercises from ${exerciseFolderPath}:`,
          this.availableExercises
        );
      }
    } catch (error) {
      console.error("Error loading available exercises:", error);
      this.availableExercises = [];
    }
  }
}

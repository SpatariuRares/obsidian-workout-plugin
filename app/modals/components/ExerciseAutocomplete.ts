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
      cls: "exercise-autocomplete-container exercise-autocomplete-hidden",
    });

    // Exercise status indicator and create page button
    const exerciseStatusContainer = exerciseContainer.createEl("div", {
      cls: "exercise-status-container",
    });

    const exerciseStatusText = exerciseStatusContainer.createEl("span", {
      cls: "exercise-status-text",
    });

    const createExercisePageBtn = exerciseStatusContainer.createEl("button", {
      text: "📝 Create exercise page",
      cls: "create-exercise-page-btn display-none",
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
          "exercise-autocomplete-container exercise-autocomplete-hidden";
        exerciseStatusText.textContent = "";
        createExercisePageBtn.className =
          "create-exercise-page-btn display-none";
        return;
      }

      const matchingExercises = instance.availableExercises.filter((exercise) =>
        exercise.toLowerCase().startsWith(query.toLowerCase())
      );

      if (matchingExercises.length > 0) {
        autocompleteContainer.empty();
        autocompleteContainer.className =
          "exercise-autocomplete-container exercise-autocomplete-visible";

        matchingExercises.slice(0, 8).forEach((exercise) => {
          const suggestion = autocompleteContainer.createEl("div", {
            cls: "exercise-autocomplete-suggestion",
            text: exercise,
          });

          suggestion.addEventListener("click", () => {
            exerciseInput.value = exercise;
            autocompleteContainer.className =
              "exercise-autocomplete-container exercise-autocomplete-hidden";
            exerciseStatusText.textContent = "✅ Exercise selected";
            exerciseStatusText.className =
              "exercise-status-text exercise-status-success";
            createExercisePageBtn.className =
              "create-exercise-page-btn display-none";
            instance.exerciseExists = true;
          });

          suggestion.addEventListener("mouseenter", () => {
            suggestion.classList.add("exercise-autocomplete-suggestion-hover");
          });

          suggestion.addEventListener("mouseleave", () => {
            suggestion.classList.remove(
              "exercise-autocomplete-suggestion-hover"
            );
          });
        });

        exerciseStatusText.textContent = `📋 ${matchingExercises.length} exercises found`;
        exerciseStatusText.className =
          "exercise-status-text exercise-status-accent";
        createExercisePageBtn.className =
          "create-exercise-page-btn display-none";
        instance.exerciseExists = true;
      } else {
        autocompleteContainer.className =
          "exercise-autocomplete-container exercise-autocomplete-hidden";
        exerciseStatusText.textContent = "⚠️ No exercises found";
        exerciseStatusText.className =
          "exercise-status-text exercise-status-warning";
        createExercisePageBtn.className =
          "create-exercise-page-btn display-inline-block";
        instance.exerciseExists = false;
      }
    };

    const hideAutocomplete = () => {
      setTimeout(() => {
        autocompleteContainer.className =
          "exercise-autocomplete-container exercise-autocomplete-hidden";
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
      const allFiles = plugin.app.vault.getMarkdownFiles();
      const files = allFiles.filter((file) => {
        const normalizedFilePath = file.path.replace(/\\/g, "/");
        
        // Try multiple path patterns to match the exercise folder
        const pathsToCheck = [
          exerciseFolderPath,
          exerciseFolderPath + "/",
          exerciseFolderPath + "/Data",
          exerciseFolderPath + "/Data/",
          "theGYM/" + exerciseFolderPath,
          "theGYM/" + exerciseFolderPath + "/",
          "theGYM/" + exerciseFolderPath + "/Data",
          "theGYM/" + exerciseFolderPath + "/Data/"
        ];
        
        return pathsToCheck.some(path => 
          normalizedFilePath.startsWith(path) || 
          normalizedFilePath.includes(path + "/")
        );
      });

      // if (plugin.settings.debugMode) {
        console.log("ExerciseAutocomplete: Exercise folder path:", exerciseFolderPath);
        console.log("ExerciseAutocomplete: Total markdown files:", allFiles.length);
        console.log("ExerciseAutocomplete: Paths to check:", [
          exerciseFolderPath,
          exerciseFolderPath + "/",
          exerciseFolderPath + "/Data",
          exerciseFolderPath + "/Data/",
          "theGYM/" + exerciseFolderPath,
          "theGYM/" + exerciseFolderPath + "/",
          "theGYM/" + exerciseFolderPath + "/Data",
          "theGYM/" + exerciseFolderPath + "/Data/"
        ]);
        console.log("ExerciseAutocomplete: Filtered exercise files:", files.length);
        console.log("ExerciseAutocomplete: Exercise files:", files.map(f => f.path));
      // }

      // Extract exercise names from filenames (remove .md extension)
      this.availableExercises = files.map((file) => file.basename).sort();
    } catch (error) {
      console.error("Error loading available exercises:", error);
      this.availableExercises = [];
    }
  }
}

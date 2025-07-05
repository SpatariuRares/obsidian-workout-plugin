// Modal for creating a new workout log
import WorkoutChartsPlugin from "main";
import { App, Modal, Notice, TFile } from "obsidian";
import { CreateExercisePageModal } from "./CreateExercisePageModal";

export class CreateLogModal extends Modal {
  private exerciseName?: string;
  private currentPageLink?: string;
  private onLogCreated?: () => void;
  private exerciseExists: boolean = false;
  private autocompleteContainer?: HTMLElement;
  private availableExercises: string[] = [];

  constructor(
    app: App,
    private plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    currentPageLink?: string,
    onLogCreated?: () => void
  ) {
    super(app);
    this.exerciseName = exerciseName;
    this.currentPageLink = currentPageLink;
    this.onLogCreated = onLogCreated;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    // Load available exercises from exercise folder
    await this.loadAvailableExercises();

    // Add modal title
    const titleEl = contentEl.createEl("h2", { text: "Create Workout Log" });

    // Create form container
    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Exercise input with autocomplete
    const exerciseContainer = formContainer.createEl("div", {
      cls: "workout-charts-form-group",
    });
    const exerciseLabel = exerciseContainer.createEl("label", {
      text: "Exercise:",
    });
    const exerciseInput = exerciseContainer.createEl("input", { type: "text" });
    exerciseInput.placeholder = "Start typing to see available exercises...";

    // Pre-fill exercise name if provided
    if (this.exerciseName) {
      exerciseInput.value = this.exerciseName;
    }

    // Autocomplete container
    this.autocompleteContainer = exerciseContainer.createEl("div", {
      cls: "exercise-autocomplete-container",
    });
    this.autocompleteContainer.style.display = "none";

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

    const showAutocomplete = (query: string) => {
      if (!query.trim() || query.length < 1) {
        this.autocompleteContainer!.style.display = "none";
        exerciseStatusText.textContent = "";
        createExercisePageBtn.style.display = "none";
        return;
      }

      const matchingExercises = this.availableExercises.filter((exercise) =>
        exercise.toLowerCase().startsWith(query.toLowerCase())
      );

      if (matchingExercises.length > 0) {
        this.autocompleteContainer!.innerHTML = "";
        this.autocompleteContainer!.style.display = "block";

        matchingExercises.slice(0, 8).forEach((exercise) => {
          const suggestion = this.autocompleteContainer!.createEl("div", {
            cls: "exercise-autocomplete-suggestion",
            text: exercise,
          });

          suggestion.addEventListener("click", () => {
            exerciseInput.value = exercise;
            this.autocompleteContainer!.style.display = "none";
            exerciseStatusText.textContent = "✅ Esercizio selezionato";
            exerciseStatusText.style.color = "var(--text-success)";
            createExercisePageBtn.style.display = "none";
            this.exerciseExists = true;
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
        this.exerciseExists = true;
      } else {
        this.autocompleteContainer!.style.display = "none";
        exerciseStatusText.textContent = "⚠️ Nessun esercizio trovato";
        exerciseStatusText.style.color = "var(--text-warning)";
        createExercisePageBtn.style.display = "inline-block";
        this.exerciseExists = false;
      }
    };

    // Check exercise existence on input change
    exerciseInput.addEventListener("input", (e) => {
      const exerciseName = (e.target as HTMLInputElement).value;
      showAutocomplete(exerciseName);
    });

    // Hide autocomplete when clicking outside
    exerciseInput.addEventListener("blur", () => {
      setTimeout(() => {
        this.autocompleteContainer!.style.display = "none";
      }, 200);
    });

    // Create exercise page button event listener
    createExercisePageBtn.addEventListener("click", () => {
      const exerciseName = exerciseInput.value.trim();
      if (exerciseName) {
        new CreateExercisePageModal(this.app, this.plugin, exerciseName).open();
      }
    });

    // Initial check if exercise name is pre-filled
    if (this.exerciseName) {
      showAutocomplete(this.exerciseName);
    }

    // Reps input
    const repsContainer = formContainer.createEl("div", {
      cls: "workout-charts-form-group",
    });
    const repsLabel = repsContainer.createEl("label", { text: "Reps:" });
    const repsInput = repsContainer.createEl("input", { type: "number" });
    repsInput.setAttribute("min", "1");
    repsInput.setAttribute("placeholder", "e.g., 10");

    // Weight input
    const weightContainer = formContainer.createEl("div", {
      cls: "workout-charts-form-group",
    });
    const weightLabel = weightContainer.createEl("label", {
      text: "Weight (kg):",
    });
    const weightInput = weightContainer.createEl("input", { type: "number" });
    weightInput.setAttribute("step", "0.5");
    weightInput.setAttribute("min", "0");
    weightInput.setAttribute("placeholder", "e.g., 10.5");

    // Buttons container
    const buttonsContainer = formContainer.createEl("div", {
      cls: "workout-charts-buttons",
    });

    // Cancel button
    const cancelBtn = buttonsContainer.createEl("button", {
      text: "Cancel",
      cls: "workout-charts-btn workout-charts-btn-warning",
    });

    // Create button
    const createBtn = buttonsContainer.createEl("button", {
      text: "Create Log",
      cls: "workout-charts-btn workout-charts-btn-primary",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    createBtn.addEventListener("click", async () => {
      const exercise = exerciseInput.value.trim();
      const reps = parseInt(repsInput.value);
      const weight = parseFloat(weightInput.value);

      if (!exercise || isNaN(reps) || isNaN(weight)) {
        new Notice("Please fill in all fields with valid values");
        return;
      }

      if (reps <= 0 || weight < 0) {
        new Notice("Please enter valid positive values for reps and weight");
        return;
      }

      try {
        await this.createLogFile(exercise, reps, weight);
        this.close();
        new Notice("Workout log created successfully!");

        // Trigger refresh callback if provided
        if (this.onLogCreated) {
          this.onLogCreated();
        }
      } catch (error) {
        new Notice(`Error creating log: ${error.message}`);
      }
    });

    // Focus on first empty input
    if (!this.exerciseName) {
      exerciseInput.focus();
    } else {
      repsInput.focus();
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private async loadAvailableExercises() {
    const exerciseFolderPath = this.plugin.settings.exerciseFolderPath;
    if (!exerciseFolderPath) {
      this.availableExercises = [];
      return;
    }

    try {
      // Get all markdown files in the exercise folder
      const files = this.app.vault
        .getMarkdownFiles()
        .filter((file) => file.path.startsWith(exerciseFolderPath));

      // Extract exercise names from filenames (remove .md extension)
      this.availableExercises = files.map((file) => file.basename).sort();

      if (this.plugin.settings.debugMode) {
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

  private async createLogFile(exercise: string, reps: number, weight: number) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeExerciseName = exercise.replace(/[\\/:"*?<>|]/g, "_");
    const fileName = `${this.plugin.settings.logFolderPath}/${safeExerciseName}-${timestamp}.md`;

    const content = `---
Rep: ${reps}
Weight: ${weight}
Volume: ${reps * weight}
---
Esercizio:: [[${exercise}]]
Origine:: ${this.currentPageLink || "[[Workout Charts Plugin]]"}
DataOra:: ${new Date().toISOString()}
`;

    await this.app.vault.create(fileName, content);
  }
}

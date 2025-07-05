// Modal for creating a new workout log
import WorkoutChartsPlugin from "main";
import { App, Modal, Notice, TFile } from "obsidian";

export class CreateLogModal extends Modal {
  private exerciseName?: string;
  private currentPageLink?: string;
  private onLogCreated?: () => void;

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

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    // Add modal title
    const titleEl = contentEl.createEl("h2", { text: "Create Workout Log" });

    // Create form container
    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Exercise input
    const exerciseContainer = formContainer.createEl("div", {
      cls: "workout-charts-form-group",
    });
    const exerciseLabel = exerciseContainer.createEl("label", {
      text: "Exercise:",
    });
    const exerciseInput = exerciseContainer.createEl("input", { type: "text" });
    exerciseInput.placeholder = "Enter exercise name";

    // Pre-fill exercise name if provided
    if (this.exerciseName) {
      exerciseInput.value = this.exerciseName;
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

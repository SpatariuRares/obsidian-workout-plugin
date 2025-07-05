import { App, Notice, TFile } from "obsidian";
import type WorkoutChartsPlugin from "../../main";
import { ModalBase } from "./base/ModalBase";
import { ExerciseAutocomplete } from "./components/ExerciseAutocomplete";

export class CreateLogModal extends ModalBase {
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

  async onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    const titleEl = contentEl.createEl("h2", { text: "Create Workout Log" });

    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    const { elements: exerciseElements } = await ExerciseAutocomplete.create(
      this,
      formContainer,
      this.plugin,
      this.exerciseName
    );

    const repsContainer = this.createFormGroup(formContainer);
    const repsInput = this.createNumberInput(
      repsContainer,
      "Reps:",
      "",
      1,
      undefined,
      "e.g., 10"
    );

    const weightContainer = this.createFormGroup(formContainer);
    const weightInput = this.createNumberInput(
      weightContainer,
      "Weight (kg):",
      "",
      0,
      undefined,
      "e.g., 10.5"
    );
    weightInput.setAttribute("step", "0.5");

    const buttonsContainer = this.createButtonsSection(formContainer);

    const cancelBtn = buttonsContainer.createEl("button", {
      text: "Cancel",
      cls: "workout-charts-btn workout-charts-btn-warning",
    });

    const createBtn = buttonsContainer.createEl("button", {
      text: "Create Log",
      cls: "workout-charts-btn workout-charts-btn-primary",
    });

    cancelBtn.addEventListener("click", () => this.close());

    createBtn.addEventListener("click", async () => {
      const exercise = exerciseElements.exerciseInput.value.trim();
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

        this.plugin.onWorkoutLogCreated();

        if (this.onLogCreated) {
          this.onLogCreated();
        }
      } catch (error) {
        new Notice(`Error creating log: ${error.message}`);
      }
    });

    if (!this.exerciseName) {
      exerciseElements.exerciseInput.focus();
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

import { App, Notice, TFile, MarkdownView } from "obsidian";
import type WorkoutChartsPlugin from "../../main";
import { ModalBase } from "./base/ModalBase";
import { ExerciseAutocomplete } from "./components/ExerciseAutocomplete";
import { TargetSectionWithAutocomplete } from "./components/TargetSectionWithAutocomplete";
import { CSVWorkoutLogEntry, entryToCSVLine } from "../types/WorkoutLogData";

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

    // Show CSV mode info
    const modeInfo = contentEl.createEl("div", {
      cls: "workout-charts-mode-info",
    });
    modeInfo.innerHTML = `
      <p><strong>CSV Mode:</strong> Logs will be added to ${this.plugin.settings.csvLogFilePath}</p>
      <p><small>All workout data is stored in a single CSV file for better performance</small></p>
    `;

    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Get current file name for workout field
    const currentFileName = this.getCurrentFileName();

    // Create exercise autocomplete
    const { elements: exerciseElements } = await ExerciseAutocomplete.create(
      this,
      formContainer,
      this.plugin,
      this.exerciseName
    );

    // Create workout target section
    const workoutContainer = this.createFormGroup(formContainer);
    const workoutInput = this.createTextInput(
      workoutContainer,
      "Allenamento:",
      "",
      "Nome dell'allenamento (opzionale)"
    );

    // Current Workout checkbox
    const currentWorkoutContainer = this.createCheckboxGroup(formContainer);
    const currentWorkoutToggle = this.createCheckbox(
      currentWorkoutContainer,
      "Usa Allenamento Corrente (nome file)",
      false,
      "currentWorkout"
    );

    // Add info text about current file
    const currentFileInfo = this.createCurrentFileInfo(
      formContainer,
      currentFileName
    );

    // Add event listener for current workout checkbox
    currentWorkoutToggle.addEventListener("change", () => {
      if (currentWorkoutToggle.checked) {
        workoutInput.value = currentFileName;
        workoutInput.disabled = true;
      } else {
        workoutInput.disabled = false;
      }
    });

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
      let workout = workoutInput.value.trim();
      const reps = parseInt(repsInput.value);
      const weight = parseFloat(weightInput.value);

      // Use current file name if checkbox is checked
      if (currentWorkoutToggle.checked) {
        workout = currentFileName;
      }

      if (!exercise || isNaN(reps) || isNaN(weight)) {
        new Notice("Please fill in all fields with valid values");
        return;
      }

      if (reps <= 0 || weight < 0) {
        new Notice("Please enter valid positive values for reps and weight");
        return;
      }

      try {
        await this.createCSVLogEntry(exercise, workout, reps, weight);
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

  private async createCSVLogEntry(
    exercise: string,
    workout: string,
    reps: number,
    weight: number
  ) {
    const volume = reps * weight;
    const timestamp = Date.now();
    const date = new Date().toISOString();

    const entry: CSVWorkoutLogEntry = {
      date,
      exercise,
      reps,
      weight,
      volume,
      origine: this.currentPageLink || "Workout Charts Plugin",
      workout: workout || undefined,
      timestamp,
    };

    const csvLine = entryToCSVLine(entry);

    // Get or create CSV file
    let csvFile = this.app.vault.getAbstractFileByPath(
      this.plugin.settings.csvLogFilePath
    ) as TFile;

    if (!csvFile) {
      // Create new CSV file with header
      const header =
        "date,exercise,reps,weight,volume,origine,workout,timestamp";
      const content = `${header}\n${csvLine}`;
      await this.app.vault.create(this.plugin.settings.csvLogFilePath, content);
    } else {
      // Append to existing CSV file
      const currentContent = await this.app.vault.cachedRead(csvFile);
      const newContent = currentContent + "\n" + csvLine;
      await this.app.vault.modify(csvFile, newContent);
    }
  }
}

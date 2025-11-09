// EditLogModal for editing existing workout log entries
import { App, Notice, TFile } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/modals/components/ExerciseAutocomplete";
import { CSVWorkoutLogEntry, WorkoutLogData } from "@app/types/WorkoutLogData";

export class EditLogModal extends ModalBase {
  private exerciseName?: string;
  private currentPageLink?: string;
  private onLogUpdated?: () => void;
  private originalLog: WorkoutLogData;

  constructor(
    app: App,
    private plugin: WorkoutChartsPlugin,
    originalLog: WorkoutLogData,
    onLogUpdated?: () => void
  ) {
    super(app);
    this.originalLog = originalLog;
    this.exerciseName = originalLog.exercise;
    this.currentPageLink = originalLog.origine;
    this.onLogUpdated = onLogUpdated;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    // Add modal title
    const titleEl = contentEl.createEl("h2", {
      text: "Edit workout log",
    });

    // Create form container
    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = await ExerciseAutocomplete.create(
      this,
      formContainer,
      this.plugin,
      this.exerciseName
    );

    // Pre-fill exercise field
    exerciseElements.exerciseInput.value = this.originalLog.exercise || "";

    // Reps input
    const repsContainer = this.createFormGroup(formContainer);
    const repsInput = this.createNumberInput(
      repsContainer,
      "Reps:",
      "",
      1,
      undefined,
      "e.g., 10"
    );
    // Pre-fill reps field
    repsInput.value = this.originalLog.reps?.toString() || "";

    // Weight input
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
    // Pre-fill weight field
    weightInput.value = this.originalLog.weight?.toString() || "";

    // Notes input
    const notesContainer = this.createFormGroup(formContainer);
    notesContainer.createEl("label", { text: "Notes (optional):" });
    const notesInput = notesContainer.createEl("textarea", {
      placeholder: "e.g., Good form, felt strong",
    });
    notesInput.rows = 3;
    // Pre-fill notes field
    notesInput.value = this.originalLog.notes || "";

    // Workout section
    const workoutSection = this.createSection(formContainer, "Workout");

    // Current workout toggle
    const currentWorkoutContainer = this.createCheckboxGroup(workoutSection);
    const currentWorkoutToggle = this.createCheckbox(
      currentWorkoutContainer,
      "Use current page as workout",
      false,
      "currentWorkout"
    );

    // Workout input (optional)
    const workoutContainer = this.createFormGroup(workoutSection);
    const workoutInput = this.createTextInput(
      workoutContainer,
      "Workout (optional):",
      "",
      this.originalLog.workout || ""
    );

    // Handle current workout toggle
    const currentFileName = this.getCurrentFileName();
    currentWorkoutToggle.addEventListener("change", () => {
      if (currentWorkoutToggle.checked) {
        workoutInput.disabled = true;
        workoutInput.value = currentFileName;
        workoutInput.classList.add("opacity-50");
        workoutInput.classList.remove("opacity-100");
      } else {
        workoutInput.disabled = false;
        workoutInput.value = this.originalLog.workout || "";
        workoutInput.classList.add("opacity-100");
        workoutInput.classList.remove("opacity-50");
      }
    });

    // Buttons container
    const buttonsContainer = this.createButtonsSection(formContainer);

    // Update button
    const updateBtn = buttonsContainer.createEl("button", {
      text: "Update log",
      cls: "workout-charts-btn workout-charts-btn-primary",
    });

    // Cancel button
    const cancelBtn = buttonsContainer.createEl("button", {
      text: "Cancel",
      cls: "workout-charts-btn workout-charts-btn-warning",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    updateBtn.addEventListener("click", () => {
      const exercise = exerciseElements.exerciseInput.value.trim();
      const reps = parseInt(repsInput.value);
      const weight = parseFloat(weightInput.value);
      const notes = notesInput.value.trim();
      let workout = workoutInput.value.trim();

      // Handle current workout toggle
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

      this.updateLogEntry(exercise, reps, weight, workout, notes)
        .then(() => {
          this.close();
          new Notice("Workout log updated successfully!");

          // Trigger refresh callback if provided
          if (this.onLogUpdated) {
            this.onLogUpdated();
          }
        })
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(`Error updating log: ${errorMessage}`);
        });
    });

    // Focus on first input
    repsInput.focus();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private async updateLogEntry(
    exercise: string,
    reps: number,
    weight: number,
    workout: string,
    notes: string
  ) {
    const updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp"> = {
      date: this.originalLog.date, // Keep the original date
      exercise: exercise,
      reps: reps,
      weight: weight,
      volume: reps * weight,
      origine: this.originalLog.origine || "[[Workout Charts Plugin]]",
      workout: workout || undefined,
      notes: notes || undefined,
    };

    // Use the plugin's update method
    await this.plugin.updateWorkoutLogEntry(this.originalLog, updatedEntry);
  }
}

// Refactored CreateLogModal using reusable components
import { App, Notice } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/modals/components/ExerciseAutocomplete";
import { CSVWorkoutLogEntry } from "@app/types/WorkoutLogData";

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

    // Add modal title
    contentEl.createEl("h2", {
      text: "Create workout log",
    });

    // Create form container
    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      this,
      formContainer,
      this.plugin,
      this.exerciseName
    );

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

    // Notes input
    const notesContainer = this.createFormGroup(formContainer);
    notesContainer.createEl("label", { text: "Notes (optional):" });
    const notesInput = notesContainer.createEl("textarea", {
      placeholder: "e.g., Good form, felt strong",
    });
    notesInput.rows = 3;

    // Workout section
    const workoutSection = this.createSection(formContainer, "Workout");

    // Current workout toggle
    const currentWorkoutContainer = this.createCheckboxGroup(workoutSection);
    const currentWorkoutToggle = this.createCheckbox(
      currentWorkoutContainer,
      "Use current page as workout",
      true,
      "currentWorkout"
    );

    // Workout input (optional)
    const workoutContainer = this.createFormGroup(workoutSection);
    const workoutInput = this.createTextInput(
      workoutContainer,
      "Workout (optional):",
      "",
      this.currentPageLink || ""
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
        workoutInput.value = "";
        workoutInput.classList.add("opacity-100");
        workoutInput.classList.remove("opacity-50");
      }
    });

    // Set initial state
    if (currentWorkoutToggle.checked) {
      workoutInput.disabled = true;
      workoutInput.value = currentFileName;
      workoutInput.classList.add("opacity-50");
    }

    // Buttons container
    const buttonsContainer = this.createButtonsSection(formContainer);

    // Create button
    const createBtn = buttonsContainer.createEl("button", {
      text: "Create log",
      cls: "workout-charts-btn workout-charts-btn-primary",
    });

    // Cancel button
    const cancelBtn = buttonsContainer.createEl("button", {
      text: "Cancel",
      cls: "workout-charts-btn workout-charts-btn-warning",
    });


    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    createBtn.addEventListener("click", () => {
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

      this.createLogEntry(exercise, reps, weight, workout, notes)
        .then(() => {
          this.close();
          new Notice("Workout log created successfully!");

          // Trigger refresh callback if provided
          if (this.onLogCreated) {
            this.onLogCreated();
          }
        })
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(`Error creating log: ${errorMessage}`);
        });
    });

    // Focus on first empty input
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

  private async createLogEntry(
    exercise: string,
    reps: number,
    weight: number,
    workout: string,
    notes: string
  ) {
    const entry: Omit<CSVWorkoutLogEntry, "timestamp"> = {
      date: new Date().toISOString(),
      exercise: exercise,
      reps: reps,
      weight: weight,
      volume: reps * weight,
      origine: this.currentPageLink || "[[Workout Charts Plugin]]",
      workout: workout || undefined,
      notes: notes || undefined,
    };

    await this.plugin.addWorkoutLogEntry(entry);
  }
}

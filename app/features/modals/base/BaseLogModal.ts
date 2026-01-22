// Base class for log modals (Create and Edit)
// Extracts common form creation and validation logic
import { CONSTANTS } from "@app/constants/Constants";
import { App, Notice } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import {
  ExerciseAutocomplete,
  ExerciseAutocompleteElements,
} from "@app/features/modals/components/ExerciseAutocomplete";
import { CSVWorkoutLogEntry } from "@app/types/WorkoutLogData";
import { Button } from "@app/components/atoms";

export interface LogFormData {
  exercise: string;
  reps: number;
  weight: number;
  workout: string;
  notes: string;
}

export interface LogFormElements {
  exerciseElements: ExerciseAutocompleteElements;
  repsInput: HTMLInputElement;
  weightInput: HTMLInputElement;
  notesInput: HTMLTextAreaElement;
  workoutInput: HTMLInputElement;
  currentWorkoutToggle: HTMLInputElement;
}

/**
 * Abstract base class for workout log modals.
 * Provides shared form creation, validation, and submission logic.
 * Subclasses implement specific behavior for create vs edit operations.
 */
export abstract class BaseLogModal extends ModalBase {
  protected exerciseName?: string;
  protected currentPageLink?: string;
  protected onComplete?: () => void;

  constructor(
    app: App,
    protected plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    currentPageLink?: string,
    onComplete?: () => void,
  ) {
    super(app);
    this.exerciseName = exerciseName;
    this.currentPageLink = currentPageLink;
    this.onComplete = onComplete;
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract getModalTitle(): string;
  protected abstract getButtonText(): string;
  protected abstract getSuccessMessage(): string;
  protected abstract getInitialWorkoutToggleState(): boolean;
  protected abstract handleSubmit(_data: LogFormData): Promise<void>;
  protected abstract shouldPreFillForm(): boolean;
  protected abstract getPreFillData(): Partial<LogFormData> | null;

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    // Add modal title
    contentEl.createEl("h2", {
      text: this.getModalTitle(),
    });

    // Create styled main container
    const formContainer = this.createStyledMainContainer(contentEl);

    // Create form elements
    const formElements = this.createFormElements(formContainer);

    // Pre-fill form if needed
    if (this.shouldPreFillForm()) {
      this.preFillForm(formElements);
    }

    // Create buttons
    const buttonsContainer = this.createButtonsSection(formContainer);
    this.createButtons(buttonsContainer, formElements);

    // Set focus
    this.setInitialFocus(formElements);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Creates all form elements
   */
  protected createFormElements(formContainer: HTMLElement): LogFormElements {
    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      this,
      formContainer,
      this.plugin,
      this.exerciseName,
    );

    // Reps input
    const repsInput = this.createNumberField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.REPS,
      0,
      {
        min: 1,
        placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.REPS,
      },
    );
    repsInput.value = ""; // Allow empty for user input

    // Weight input
    const weightInput = this.createNumberField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.WEIGHT,
      0,
      {
        min: 0,
        placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.WEIGHT,
      },
    );
    weightInput.value = ""; // Allow empty for user input
    weightInput.setAttribute("step", "0.5");

    // Notes input
    const notesInput = this.createTextareaField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.NOTES,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.NOTES,
      3,
    );

    // Workout section
    const workoutSection = this.createSection(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.WORKOUT,
    );

    // Current workout toggle
    const currentWorkoutToggle = this.createCheckboxField(
      workoutSection,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.USE_CURRENT_WORKOUT,
      this.getInitialWorkoutToggleState(),
      "currentWorkout",
    );

    // Workout input (optional)
    const workoutInput = this.createTextField(
      workoutSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.WORKOUT,
      "",
      this.currentPageLink || "",
    );

    // Setup workout toggle behavior
    this.setupWorkoutToggle(currentWorkoutToggle, workoutInput);

    return {
      exerciseElements,
      repsInput,
      weightInput,
      notesInput,
      workoutInput,
      currentWorkoutToggle,
    };
  }

  /**
   * Sets up the workout toggle behavior
   */
  protected setupWorkoutToggle(
    toggle: HTMLInputElement,
    workoutInput: HTMLInputElement,
  ): void {
    const currentFileName = this.getCurrentFileName();

    toggle.addEventListener("change", () => {
      if (toggle.checked) {
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
    if (toggle.checked) {
      workoutInput.disabled = true;
      workoutInput.value = currentFileName;
      workoutInput.classList.add("opacity-50");
    }
  }

  /**
   * Pre-fills form with data
   */
  protected preFillForm(formElements: LogFormElements): void {
    const data = this.getPreFillData();
    if (!data) return;

    if (data.exercise) {
      formElements.exerciseElements.exerciseInput.value = data.exercise;
    }
    if (data.reps !== undefined) {
      formElements.repsInput.value = data.reps.toString();
    }
    if (data.weight !== undefined) {
      formElements.weightInput.value = data.weight.toString();
    }
    if (data.notes) {
      formElements.notesInput.value = data.notes;
    }
    if (data.workout) {
      formElements.workoutInput.value = data.workout;
    }
  }

  /**
   * Creates submit and cancel buttons
   * Uses Button atom for consistent button styling
   */
  protected createButtons(
    container: HTMLElement,
    formElements: LogFormElements,
  ): void {
    // Submit button using Button atom
    const submitBtn = Button.create(container, {
      text: this.getButtonText(),
      className: "workout-charts-btn workout-charts-btn-primary",
      ariaLabel: this.getButtonText(),
    });

    // Cancel button using Button atom
    const cancelBtn = Button.create(container, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
      className: "workout-charts-btn workout-charts-btn-warning",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
    });

    // Event listeners using Button helper
    Button.onClick(cancelBtn, () => this.close());

    Button.onClick(submitBtn, async () => {
      await this.handleFormSubmit(formElements);
    });
  }

  /**
   * Handles form submission with validation
   */
  protected async handleFormSubmit(
    formElements: LogFormElements,
  ): Promise<void> {
    const currentFileName = this.getCurrentFileName();

    // Extract form data
    const exercise = formElements.exerciseElements.exerciseInput.value.trim();
    const reps = parseInt(formElements.repsInput.value);
    const weight = parseFloat(formElements.weightInput.value);
    const notes = formElements.notesInput.value.trim();
    let workout = formElements.workoutInput.value.trim();

    // Handle current workout toggle
    if (formElements.currentWorkoutToggle.checked) {
      workout = currentFileName;
    }

    // Validate form data
    if (!this.validateLogData(exercise, reps, weight)) {
      return;
    }

    const data: LogFormData = {
      exercise,
      reps,
      weight,
      workout,
      notes,
    };

    // Submit data
    try {
      await this.handleSubmit(data);
      this.close();
      new Notice(this.getSuccessMessage());

      // Trigger refresh callback if provided
      if (this.onComplete) {
        this.onComplete();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(
        `${CONSTANTS.WORKOUT.MODAL.NOTICES.GENERIC_ERROR}${errorMessage}`,
      );
    }
  }

  /**
   * Validates log form data
   */
  protected validateLogData(
    exercise: string,
    reps: number,
    weight: number,
  ): boolean {
    if (!exercise || isNaN(reps) || isNaN(weight)) {
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.VALIDATION_FILL_ALL);
      return false;
    }

    if (reps <= 0 || weight < 0) {
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.VALIDATION_POSITIVE_VALUES);
      return false;
    }

    return true;
  }

  /**
   * Sets initial focus on appropriate input
   */
  protected setInitialFocus(formElements: LogFormElements): void {
    if (!this.exerciseName) {
      formElements.exerciseElements.exerciseInput.focus();
    } else {
      formElements.repsInput.focus();
    }
  }

  /**
   * Helper method to create log entry object
   */
  protected createLogEntryObject(
    exercise: string,
    reps: number,
    weight: number,
    workout: string,
    notes: string,
    date?: string,
  ): Omit<CSVWorkoutLogEntry, "timestamp"> {
    return {
      date: date || new Date().toISOString(),
      exercise: exercise,
      reps: reps,
      weight: weight,
      volume: reps * weight,
      origine: this.currentPageLink || "[[Workout Charts Plugin]]",
      workout: workout || undefined,
      notes: notes || undefined,
    };
  }
}

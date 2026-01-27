// Base class for log modals (Create and Edit)
// Extracts common form creation and validation logic
import { CONSTANTS } from "@app/constants/Constants";
import { App, Notice } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { CSVWorkoutLogEntry, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { Button } from "@app/components/atoms";
import { LogFormData, LogFormElements } from "@app/types/ModalTypes";

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

  /**
   * Determines if the date field should be shown in the form.
   * Defaults to false.
   */
  protected shouldShowDateField(): boolean {
    return false;
  }

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

    // Reps input with adjust buttons
    const repsSection = formContainer.createDiv({ cls: "workout-field-with-adjust" });
    const repsLabel = repsSection.createDiv({ cls: "workout-field-label" });
    repsLabel.textContent = CONSTANTS.WORKOUT.MODAL.LABELS.REPS;

    const repsInputContainer = repsSection.createDiv({ cls: "workout-input-with-adjust" });
    const repsInput = repsInputContainer.createEl("input", {
      type: "number",
      cls: "workout-charts-input",
      attr: {
        min: "1",
        placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.REPS,
      },
    });
    repsInput.value = ""; // Allow empty for user input

    // Quick adjust buttons for reps
    const repsAdjustButtons = repsInputContainer.createDiv({ cls: "workout-adjust-buttons" });
    const repsMinusBtn = repsAdjustButtons.createEl("button", {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_MINUS + "1",
      cls: "workout-adjust-btn workout-adjust-minus",
      attr: { type: "button", "aria-label": "Decrease reps by 1" },
    });
    const repsPlusBtn = repsAdjustButtons.createEl("button", {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_PLUS + "1",
      cls: "workout-adjust-btn workout-adjust-plus",
      attr: { type: "button", "aria-label": "Increase reps by 1" },
    });

    repsMinusBtn.addEventListener("click", () => {
      const currentValue = parseInt(repsInput.value) || 0;
      repsInput.value = Math.max(0, currentValue - 1).toString();
    });

    repsPlusBtn.addEventListener("click", () => {
      const currentValue = parseInt(repsInput.value) || 0;
      repsInput.value = (currentValue + 1).toString();
    });

    // Weight input with adjust buttons
    const weightSection = formContainer.createDiv({ cls: "workout-field-with-adjust" });
    const weightLabel = weightSection.createDiv({ cls: "workout-field-label" });
    weightLabel.textContent = CONSTANTS.WORKOUT.MODAL.LABELS.WEIGHT;

    const weightInputContainer = weightSection.createDiv({ cls: "workout-input-with-adjust" });
    const weightInput = weightInputContainer.createEl("input", {
      type: "number",
      cls: "workout-charts-input",
      attr: {
        min: "0",
        step: "0.5",
        placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.WEIGHT,
      },
    });
    weightInput.value = ""; // Allow empty for user input

    // Quick adjust buttons for weight
    const weightIncrement = this.plugin.settings.weightIncrement;
    const weightAdjustButtons = weightInputContainer.createDiv({ cls: "workout-adjust-buttons" });
    const weightMinusBtn = weightAdjustButtons.createEl("button", {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_MINUS + weightIncrement,
      cls: "workout-adjust-btn workout-adjust-minus",
      attr: { type: "button", "aria-label": `Decrease weight by ${weightIncrement}kg` },
    });
    const weightPlusBtn = weightAdjustButtons.createEl("button", {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_PLUS + weightIncrement,
      cls: "workout-adjust-btn workout-adjust-plus",
      attr: { type: "button", "aria-label": `Increase weight by ${weightIncrement}kg` },
    });

    weightMinusBtn.addEventListener("click", () => {
      const currentValue = parseFloat(weightInput.value) || 0;
      weightInput.value = Math.max(0, currentValue - weightIncrement).toFixed(1);
    });

    weightPlusBtn.addEventListener("click", () => {
      const currentValue = parseFloat(weightInput.value) || 0;
      weightInput.value = (currentValue + weightIncrement).toFixed(1);
    });

    // Protocol dropdown - built-in protocols first, then custom protocols
    const builtInProtocols = [...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.PROTOCOL];
    const customProtocols = this.plugin.settings.customProtocols.map((p) => ({
      text: p.name,
      value: p.id,
    }));
    const allProtocols = [...builtInProtocols, ...customProtocols];

    const protocolSelect = this.createSelectField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.PROTOCOL,
      allProtocols,
    );
    protocolSelect.value = WorkoutProtocol.STANDARD;

    // Notes input
    const notesInput = this.createTextareaField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.NOTES,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.NOTES,
      3,
    );

    // Optional Date input
    let dateInput: HTMLInputElement | undefined;
    if (this.shouldShowDateField()) {
      dateInput = this.createTextField(
        formContainer,
        "Date", // TODO: Add to constants if needed, hardcoded for now as per minimal change
        "",
        "",
      );
      dateInput.type = "date";
    }

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
      dateInput,
      protocolSelect,
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
    if (data.date && formElements.dateInput && this.shouldShowDateField()) {
      const dateValue = data.date.split("T")[0];
      formElements.dateInput.value = dateValue;
    }
    if (data.protocol && formElements.protocolSelect) {
      formElements.protocolSelect.value = data.protocol;
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

    Button.onClick(submitBtn, () => {
      void (async () => {
        await this.handleFormSubmit(formElements);
      })();
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
    const protocol = (formElements.protocolSelect?.value || WorkoutProtocol.STANDARD) as WorkoutProtocol;

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
      date: formElements.dateInput?.value || undefined,
      protocol,
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
    protocol?: WorkoutProtocol,
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
      protocol: protocol || WorkoutProtocol.STANDARD,
    };
  }
}
export type { LogFormData };

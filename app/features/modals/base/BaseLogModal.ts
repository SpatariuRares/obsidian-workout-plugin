// Base class for log modals (Create and Edit)
// Extracts common form creation and validation logic
import { CONSTANTS } from "@app/constants";
import { App, Notice } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { CSVWorkoutLogEntry, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { Button } from "@app/components/atoms";
import { LogFormData, LogFormElements } from "@app/types/ModalTypes";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { ExerciseDefinitionService } from "@app/services/ExerciseDefinitionService";

/**
 * Abstract base class for workout log modals.
 * Provides shared form creation, validation, and submission logic.
 * Subclasses implement specific behavior for create vs edit operations.
 */
export abstract class BaseLogModal extends ModalBase {
  protected exerciseName?: string;
  protected currentPageLink?: string;
  protected onComplete?: () => void;
  protected exerciseDefService: ExerciseDefinitionService;

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
    this.exerciseDefService = this.plugin.getExerciseDefinitionService();
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

  async onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    // Add modal title
    contentEl.createEl("h2", {
      text: this.getModalTitle(),
    });

    // Create styled main container
    const formContainer = this.createStyledMainContainer(contentEl);

    // Create form elements (async to load exercise parameters)
    const formElements = await this.createFormElements(formContainer);

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
  protected async createFormElements(
    formContainer: HTMLElement,
  ): Promise<LogFormElements> {
    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      this,
      formContainer,
      this.plugin,
      this.exerciseName,
    );

    // Reps input with adjust buttons
    const repsSection = formContainer.createDiv({
      cls: "workout-field-with-adjust",
    });
    const repsLabel = repsSection.createDiv({ cls: "workout-field-label" });
    repsLabel.textContent = CONSTANTS.WORKOUT.MODAL.LABELS.REPS;

    const repsInputContainer = repsSection.createDiv({
      cls: "workout-input-with-adjust",
    });
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
    const repsAdjustButtons = repsInputContainer.createDiv({
      cls: "workout-adjust-buttons",
    });
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
    const weightSection = formContainer.createDiv({
      cls: "workout-field-with-adjust",
    });
    const weightLabel = weightSection.createDiv({ cls: "workout-field-label" });
    weightLabel.textContent = CONSTANTS.WORKOUT.MODAL.LABELS.WEIGHT;

    const weightInputContainer = weightSection.createDiv({
      cls: "workout-input-with-adjust",
    });
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
    const weightAdjustButtons = weightInputContainer.createDiv({
      cls: "workout-adjust-buttons",
    });
    const weightMinusBtn = weightAdjustButtons.createEl("button", {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_MINUS + weightIncrement,
      cls: "workout-adjust-btn workout-adjust-minus",
      attr: {
        type: "button",
        "aria-label": `Decrease weight by ${weightIncrement}kg`,
      },
    });
    const weightPlusBtn = weightAdjustButtons.createEl("button", {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_PLUS + weightIncrement,
      cls: "workout-adjust-btn workout-adjust-plus",
      attr: {
        type: "button",
        "aria-label": `Increase weight by ${weightIncrement}kg`,
      },
    });

    weightMinusBtn.addEventListener("click", () => {
      const currentValue = parseFloat(weightInput.value) || 0;
      weightInput.value = Math.max(0, currentValue - weightIncrement).toFixed(
        1,
      );
    });

    weightPlusBtn.addEventListener("click", () => {
      const currentValue = parseFloat(weightInput.value) || 0;
      weightInput.value = (currentValue + weightIncrement).toFixed(1);
    });

    // Protocol dropdown - built-in protocols first, then custom protocols
    const builtInProtocols = [
      ...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.PROTOCOL,
    ];
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

    // Initialize dynamic fields map with reps/weight for backward compatibility
    const dynamicFieldInputs = new Map<string, HTMLInputElement>();
    dynamicFieldInputs.set("reps", repsInput);
    dynamicFieldInputs.set("weight", weightInput);

    // Load exercise definition and render dynamic fields if exercise is known
    if (this.exerciseName) {
      try {
        const parameters =
          await this.exerciseDefService.getParametersForExercise(
            this.exerciseName,
          );

        // Render fields for each parameter (excluding 'reps' and 'weight' which are already rendered)
        for (const param of parameters) {
          if (param.key === "reps" || param.key === "weight") continue;

          const input = this.renderParameterField(formContainer, param);
          dynamicFieldInputs.set(param.key, input);
        }
      } catch (error) {
        // If exercise definition not found, continue with standard fields only
        // eslint-disable-next-line no-console
        console.warn(
          `Could not load exercise definition for ${this.exerciseName}:`,
          error,
        );
      }
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
      dynamicFieldInputs,
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

    // Pre-fill custom fields
    if (data.customFields) {
      for (const [key, value] of Object.entries(data.customFields)) {
        const input = formElements.dynamicFieldInputs.get(key);
        if (input) {
          if (input.type === "checkbox") {
            input.checked = Boolean(value);
          } else {
            input.value = String(value);
          }
        }
      }
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

    //Extract form data
    const exercise = formElements.exerciseElements.exerciseInput.value.trim();
    const reps = parseInt(formElements.repsInput.value);
    const weight = parseFloat(formElements.weightInput.value);
    const notes = formElements.notesInput.value.trim();
    let workout = formElements.workoutInput.value.trim();
    const protocol = (formElements.protocolSelect?.value ||
      WorkoutProtocol.STANDARD) as WorkoutProtocol;

    // Handle current workout toggle
    if (formElements.currentWorkoutToggle.checked) {
      workout = currentFileName;
    }

    // Build customFields from dynamicFieldInputs (excluding standard reps/weight)
    const customFields: Record<string, string | number | boolean> = {};
    for (const [key, input] of formElements.dynamicFieldInputs) {
      if (key === "reps" || key === "weight") {
        continue; // Skip standard fields, they're handled separately
      }

      const value = input.value.trim();
      if (!value) continue; // Skip empty values

      // Try to parse as number or boolean, otherwise keep as string
      if (input.type === "checkbox") {
        customFields[key] = (input as HTMLInputElement).checked;
      } else if (input.type === "number") {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          customFields[key] = parsed;
        }
      } else {
        customFields[key] = value;
      }
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
      customFields:
        Object.keys(customFields).length > 0 ? customFields : undefined,
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
   * Renders an input field for a parameter based on its definition
   */
  protected renderParameterField(
    container: HTMLElement,
    param: ParameterDefinition,
  ): HTMLInputElement {
    const fieldContainer = container.createDiv({
      cls: "workout-field-with-adjust",
    });
    const label = fieldContainer.createDiv({ cls: "workout-field-label" });

    // Build label with unit if available
    const labelText = param.unit
      ? `${param.label} (${param.unit})`
      : param.label;
    label.textContent = labelText;

    let input: HTMLInputElement;

    if (param.type === "boolean") {
      // Checkbox for boolean parameters
      input = fieldContainer.createEl("input", {
        type: "checkbox",
        cls: "workout-charts-checkbox",
      });
    } else if (param.type === "number") {
      // Number input with min/max validation
      input = fieldContainer.createEl("input", {
        type: "number",
        cls: "workout-charts-input",
        attr: {
          min: param.min?.toString() || "0",
          max: param.max?.toString() || "",
          step: "0.1",
        },
      });

      // Set default value if provided
      if (param.default !== undefined) {
        input.value = param.default.toString();
      }
    } else {
      // Text input for string parameters
      input = fieldContainer.createEl("input", {
        type: "text",
        cls: "workout-charts-input",
      });

      // Set default value if provided
      if (param.default !== undefined) {
        input.value = param.default.toString();
      }
    }

    // Mark required fields
    if (param.required) {
      input.required = true;
    }

    return input;
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
    customFields?: Record<string, string | number | boolean>,
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
      customFields: customFields,
    };
  }
}
export type { LogFormData };

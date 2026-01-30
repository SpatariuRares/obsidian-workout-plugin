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

  // Track current parameters for dynamic validation
  protected currentParameters: ParameterDefinition[] = [];
  protected formElements?: LogFormElements;

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
   * Creates all form elements with dynamic parameter fields based on exercise type
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

    // Create container for dynamic parameter fields
    const parametersContainer = formContainer.createDiv({
      cls: "workout-parameters-container",
    });

    // Load and render parameters for initial exercise (or default to strength)
    const parameters = await this.loadParametersForExercise(this.exerciseName);
    this.currentParameters = parameters;
    const dynamicFieldInputs = this.renderDynamicFields(
      parametersContainer,
      parameters,
    );

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
        "Date",
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

    const formElements: LogFormElements = {
      exerciseElements,
      notesInput,
      workoutInput,
      currentWorkoutToggle,
      dateInput,
      protocolSelect,
      dynamicFieldInputs,
      parametersContainer,
    };

    // Store reference for updates
    this.formElements = formElements;

    // Setup exercise change listener to update fields dynamically
    this.setupExerciseChangeListener(
      exerciseElements.exerciseInput,
      parametersContainer,
    );

    return formElements;
  }

  /**
   * Loads parameters for an exercise, defaulting to strength type if not found.
   */
  protected async loadParametersForExercise(
    exerciseName?: string,
  ): Promise<ParameterDefinition[]> {
    if (!exerciseName) {
      // Default to strength type for empty exercise
      return this.exerciseDefService.getParametersForExercise("");
    }

    try {
      return await this.exerciseDefService.getParametersForExercise(
        exerciseName,
      );
    } catch {
      // Fallback to strength type if error
      return this.exerciseDefService.getParametersForExercise("");
    }
  }

  /**
   * Renders dynamic fields based on parameter definitions.
   * Clears existing fields and creates new inputs for each parameter.
   */
  protected renderDynamicFields(
    container: HTMLElement,
    parameters: ParameterDefinition[],
  ): Map<string, HTMLInputElement> {
    // Clear existing fields
    container.empty();

    const fieldInputs = new Map<string, HTMLInputElement>();

    for (const param of parameters) {
      const input = this.renderParameterFieldWithAdjust(container, param);
      fieldInputs.set(param.key, input);
    }

    return fieldInputs;
  }

  /**
   * Renders a parameter field with optional quick-adjust buttons for numeric types.
   */
  protected renderParameterFieldWithAdjust(
    container: HTMLElement,
    param: ParameterDefinition,
  ): HTMLInputElement {
    const fieldContainer = container.createDiv({
      cls: "workout-field-with-adjust",
    });

    const label = fieldContainer.createDiv({ cls: "workout-field-label" });
    const labelText = param.unit
      ? `${param.label} (${param.unit})`
      : param.label;
    label.textContent = labelText;

    // For numeric fields, add adjust buttons
    if (param.type === "number") {
      const inputContainer = fieldContainer.createDiv({
        cls: "workout-input-with-adjust",
      });

      const input = inputContainer.createEl("input", {
        type: "number",
        cls: "workout-charts-input",
        attr: {
          min: param.min?.toString() || "0",
          max: param.max?.toString() || "",
          step: this.getStepForParameter(param),
          placeholder: param.default?.toString() || "",
        },
      });

      // Quick adjust buttons
      const increment = this.getIncrementForParameter(param);
      const adjustButtons = inputContainer.createDiv({
        cls: "workout-adjust-buttons",
      });

      const minusBtn = adjustButtons.createEl("button", {
        text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_MINUS + increment,
        cls: "workout-adjust-btn workout-adjust-minus",
        attr: { type: "button", "aria-label": `Decrease ${param.label} by ${increment}` },
      });

      const plusBtn = adjustButtons.createEl("button", {
        text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_PLUS + increment,
        cls: "workout-adjust-btn workout-adjust-plus",
        attr: { type: "button", "aria-label": `Increase ${param.label} by ${increment}` },
      });

      minusBtn.addEventListener("click", () => {
        const current = parseFloat(input.value) || 0;
        const newValue = Math.max(param.min || 0, current - increment);
        input.value = this.formatNumericValue(newValue, param);
      });

      plusBtn.addEventListener("click", () => {
        const current = parseFloat(input.value) || 0;
        const newValue = current + increment;
        input.value =
          param.max !== undefined
            ? this.formatNumericValue(Math.min(param.max, newValue), param)
            : this.formatNumericValue(newValue, param);
      });

      if (param.required) {
        input.required = true;
      }

      return input;
    }

    // Boolean checkbox
    if (param.type === "boolean") {
      const input = fieldContainer.createEl("input", {
        type: "checkbox",
        cls: "workout-charts-checkbox",
      });
      if (param.default === true) {
        input.checked = true;
      }
      return input;
    }

    // String/text input (default)
    const input = fieldContainer.createEl("input", {
      type: "text",
      cls: "workout-charts-input",
    });
    if (param.default !== undefined) {
      input.value = param.default.toString();
    }
    if (param.required) {
      input.required = true;
    }
    return input;
  }

  /**
   * Formats a numeric value based on parameter type (integer vs decimal).
   */
  protected formatNumericValue(
    value: number,
    param: ParameterDefinition,
  ): string {
    // Use integer format for reps, duration in seconds
    if (param.key === "reps" || param.key === "heartRate") {
      return Math.round(value).toString();
    }
    if (param.key === "duration" && param.unit === "sec") {
      return Math.round(value).toString();
    }
    // Use decimal for weight, distance
    return value.toFixed(1);
  }

  /**
   * Determines increment value for quick-adjust buttons based on parameter key.
   */
  protected getIncrementForParameter(param: ParameterDefinition): number {
    if (param.key === "reps") return 1;
    if (param.key === "weight") return this.plugin.settings.weightIncrement;
    if (param.key === "duration" && param.unit === "sec") return 5;
    if (param.key === "duration" && param.unit === "min") return 1;
    if (param.key === "distance") return 0.5;
    if (param.key === "heartRate") return 5;

    // Default based on unit
    if (param.unit?.includes("km")) return 0.5;
    if (param.unit?.includes("min") || param.unit?.includes("sec")) return 1;
    return 1;
  }

  /**
   * Determines step value for numeric input based on parameter.
   */
  protected getStepForParameter(param: ParameterDefinition): string {
    if (param.key === "weight") return "0.5";
    if (param.key === "distance") return "0.1";
    if (
      param.key === "reps" ||
      param.key === "duration" ||
      param.key === "heartRate"
    )
      return "1";
    return "0.1";
  }

  /**
   * Sets up listener to update fields when exercise changes.
   */
  protected setupExerciseChangeListener(
    exerciseInput: HTMLInputElement,
    parametersContainer: HTMLElement,
  ): void {
    // Listen for change event (triggered by autocomplete selection)
    exerciseInput.addEventListener("change", () => {
      const exerciseName = exerciseInput.value.trim();
      void this.updateFieldsForExercise(exerciseName, parametersContainer);
    });

    // Also listen for blur to catch manual typing
    let blurTimeout: ReturnType<typeof setTimeout> | null = null;
    exerciseInput.addEventListener("blur", () => {
      // Debounce to avoid double-triggering with change event
      if (blurTimeout) clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        const exerciseName = exerciseInput.value.trim();
        if (exerciseName && this.formElements) {
          void this.updateFieldsForExercise(exerciseName, parametersContainer);
        }
      }, 250);
    });
  }

  /**
   * Updates dynamic fields when exercise selection changes.
   * Preserves any values that match between old and new parameter sets.
   */
  protected async updateFieldsForExercise(
    exerciseName: string,
    parametersContainer: HTMLElement,
  ): Promise<void> {
    if (!this.formElements) return;

    // Get new parameters
    const newParameters = await this.loadParametersForExercise(exerciseName);

    // Check if parameters actually changed
    const paramKeys = newParameters.map((p) => p.key).sort().join(",");
    const currentKeys = this.currentParameters.map((p) => p.key).sort().join(",");
    if (paramKeys === currentKeys) {
      return; // No change needed
    }

    // Preserve existing values where possible
    const preservedValues = new Map<string, string>();
    for (const [key, input] of this.formElements.dynamicFieldInputs) {
      if (input.value) {
        preservedValues.set(key, input.value);
      }
    }

    // Update parameters and re-render fields
    this.currentParameters = newParameters;
    const newFieldInputs = this.renderDynamicFields(
      parametersContainer,
      newParameters,
    );

    // Restore preserved values for matching parameters
    for (const [key, value] of preservedValues) {
      const input = newFieldInputs.get(key);
      if (input) {
        input.value = value;
      }
    }

    // Update form elements reference
    this.formElements.dynamicFieldInputs = newFieldInputs;
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

    // Pre-fill reps/weight from dynamic inputs if they exist
    if (data.reps !== undefined) {
      const repsInput = formElements.dynamicFieldInputs.get("reps");
      if (repsInput) {
        repsInput.value = data.reps.toString();
      }
    }
    if (data.weight !== undefined) {
      const weightInput = formElements.dynamicFieldInputs.get("weight");
      if (weightInput) {
        weightInput.value = data.weight.toString();
      }
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

    // Pre-fill custom fields (all dynamic fields including non-reps/weight)
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

    // Extract form data
    const exercise = formElements.exerciseElements.exerciseInput.value.trim();

    // Use dynamic validation based on current parameters
    if (!this.validateDynamicLogData(exercise, formElements.dynamicFieldInputs)) {
      return;
    }

    // Extract reps/weight from dynamic inputs (if present, for CSV backward compatibility)
    const repsInput = formElements.dynamicFieldInputs.get("reps");
    const weightInput = formElements.dynamicFieldInputs.get("weight");
    const reps = repsInput ? parseInt(repsInput.value) || 0 : 0;
    const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;

    const notes = formElements.notesInput.value.trim();
    let workout = formElements.workoutInput.value.trim();
    const protocol = (formElements.protocolSelect?.value ||
      WorkoutProtocol.STANDARD) as WorkoutProtocol;

    // Handle current workout toggle
    if (formElements.currentWorkoutToggle.checked) {
      workout = currentFileName;
    }

    // Build customFields from dynamicFieldInputs (excluding standard reps/weight for CSV)
    const customFields: Record<string, string | number | boolean> = {};
    for (const [key, input] of formElements.dynamicFieldInputs) {
      if (key === "reps" || key === "weight") {
        continue; // Skip standard fields, they go in CSV columns
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
   * Validates form data based on current exercise parameters.
   * @returns true if valid, false otherwise
   */
  protected validateDynamicLogData(
    exercise: string,
    dynamicFieldInputs: Map<string, HTMLInputElement>,
  ): boolean {
    // Exercise is always required
    if (!exercise) {
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.VALIDATION_FILL_ALL);
      return false;
    }

    // Validate each required parameter
    for (const param of this.currentParameters) {
      if (!param.required) continue;

      const input = dynamicFieldInputs.get(param.key);
      if (!input) {
        new Notice(`Missing required field: ${param.label}`);
        return false;
      }

      const value = input.value.trim();

      if (param.type === "number") {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          new Notice(`${param.label} must be a valid number`);
          return false;
        }

        // Check min/max
        if (param.min !== undefined && numValue < param.min) {
          new Notice(`${param.label} must be at least ${param.min}`);
          return false;
        }
        if (param.max !== undefined && numValue > param.max) {
          new Notice(`${param.label} must be at most ${param.max}`);
          return false;
        }
      } else if (param.type === "string" && !value) {
        new Notice(`${param.label} is required`);
        return false;
      }
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
      // Focus on first dynamic field
      const firstInput = formElements.dynamicFieldInputs.values().next().value;
      if (firstInput) {
        firstInput.focus();
      }
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

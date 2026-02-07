// Base class for log modals (Create and Edit)
// Extracts common form creation and validation logic
import { CONSTANTS } from "@app/constants";
import { App, Notice } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { CSVWorkoutLogEntry, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { Button } from "@app/components/atoms";
import { LogFormData, LogFormElements } from "@app/types/ModalTypes";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { LogDataService } from "@app/features/modals/base/services/LogDataService";
import { DynamicFieldsRenderer } from "@app/features/modals/base/components/DynamicFieldsRenderer";
import { LogFormRenderer } from "@app/features/modals/base/components/LogFormRenderer";
import { LogSubmissionHandler } from "@app/features/modals/base/logic/LogSubmissionHandler";

import { fillDynamicInputsFromCustomFields } from "@app/utils/form/FormUtils";
import { RecentExercisesService } from "@app/features/modals/base/services/RecentExercisesService";

/**
 * Abstract base class for workout log modals.
 * Provides shared form creation, validation, and submission logic.
 * Subclasses implement specific behavior for create vs edit operations.
 */
export abstract class BaseLogModal extends ModalBase {
  protected exerciseName?: string;
  protected currentPageLink?: string;
  protected onComplete?: () => void;
  protected logDataService: LogDataService;
  protected dynamicFieldsRenderer: DynamicFieldsRenderer;
  protected logFormRenderer: LogFormRenderer;
  protected recentExercisesService: RecentExercisesService;

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
    this.logDataService = new LogDataService(this.plugin);
    this.dynamicFieldsRenderer = new DynamicFieldsRenderer(this.plugin);
    this.recentExercisesService = new RecentExercisesService(this.plugin);
    this.logFormRenderer = new LogFormRenderer(
      this.plugin,
      this.dynamicFieldsRenderer,
      this.logDataService,
      this.recentExercisesService,
    );
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
    contentEl.addClass("workout-modal");

    // Pre-load workout log data
    if (this.shouldAutoFillFromLastEntry()) {
      await this.logDataService.loadWorkoutLogData();
    }

    // Add modal title
    contentEl.createEl("h2", {
      text: this.getModalTitle(),
    });

    // Create styled main container
    const formContainer = this.createStyledMainContainer(contentEl);

    // Create form elements via Renderer
    this.formElements = await this.logFormRenderer.createFormElements(
      this,
      formContainer,
      this.exerciseName,
      this.currentPageLink,
      this.shouldShowDateField(),
      this.getInitialWorkoutToggleState(),
      (newParams) => {
        this.currentParameters = newParams;
      },
    );

    // Pre-fill form if needed
    if (this.shouldPreFillForm()) {
      this.preFillForm(this.formElements);
    }
    // Note: Auto-fill logic is now handled within LogFormRenderer's setup

    // Create buttons
    const buttonsContainer = Button.createContainer(formContainer);
    this.createButtons(buttonsContainer, this.formElements);

    // Set focus
    this.setInitialFocus(this.formElements);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Helper method to create log entry object.
   * Preserved for backward compatibility with subclasses.
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
    return LogSubmissionHandler.createLogEntry(
      { exercise, reps, weight, workout, notes, date, protocol, customFields },
      this.currentPageLink,
    );
  }

  /**
   * Whether to enable auto-fill from the last entry.
   * Override in subclasses to disable.
   */
  public shouldAutoFillFromLastEntry(): boolean {
    return false;
  }

  /**
   * Pre-fills form with data
   */
  protected preFillForm(formElements: LogFormElements): void {
    const data = this.getPreFillData();
    if (!data) return;

    if (data.exercise) {
      formElements.exerciseElements.exerciseInput.value = data.exercise;
      // Trigger change event to load parameters?
      // Actually LogFormRenderer handles initial load.
      // But if we pre-fill a DIFFERENT exercise than initial, we might need to trigger update.
      // For now assume initial exercise matches pre-fill or is empty.
    }

    // Pre-fill fields
    if (data.reps !== undefined) {
      const repsInput = formElements.dynamicFieldInputs.get("reps");
      if (repsInput) repsInput.value = data.reps.toString();
    }
    if (data.weight !== undefined) {
      const weightInput = formElements.dynamicFieldInputs.get("weight");
      if (weightInput) weightInput.value = data.weight.toString();
    }

    if (data.notes) formElements.notesInput.value = data.notes;
    if (data.workout) formElements.workoutInput.value = data.workout;

    if (data.date && formElements.dateInput && this.shouldShowDateField()) {
      const dateValue = data.date.split("T")[0];
      formElements.dateInput.value = dateValue;
    }
    if (data.protocol && formElements.protocolSelect) {
      formElements.protocolSelect.value = data.protocol;
    }

    // Pre-fill custom fields
    fillDynamicInputsFromCustomFields(
      data.customFields,
      formElements.dynamicFieldInputs,
    );
  }

  /**
   * Creates submit and cancel buttons
   */
  protected createButtons(
    container: HTMLElement,
    formElements: LogFormElements,
  ): void {
    const submitBtn = Button.create(container, {
      text: this.getButtonText(),
      variant: "primary",
      ariaLabel: this.getButtonText(),
    });

    const cancelBtn = Button.create(container, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
      variant: "warning",
    });

    Button.onClick(cancelBtn, () => this.close());
    Button.onClick(submitBtn, () => {
      void (async () => {
        await this.handleFormSubmit(formElements);
      })();
    });
  }

  /**
   * Handles form submission via LogSubmissionHandler
   */
  protected async handleFormSubmit(
    formElements: LogFormElements,
  ): Promise<void> {
    const currentFileName = this.getCurrentFileName();

    const data = LogSubmissionHandler.extractAndValidateData(
      formElements,
      this.currentParameters,
      currentFileName,
    );

    if (!data) return;

    try {
      await this.handleSubmit(data);

      // Keep recent exercise chips in sync without blocking success flow.
      try {
        await this.recentExercisesService.trackExercise(data.exercise);
      } catch {
        // Non-critical failure: log entry is already saved.
      }

      this.close();
      new Notice(this.getSuccessMessage());

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
   * Sets initial focus on appropriate input
   */
  protected setInitialFocus(formElements: LogFormElements): void {
    if (!this.exerciseName) {
      formElements.exerciseElements.exerciseInput.focus();
    } else {
      const firstInput = formElements.dynamicFieldInputs.values().next().value;
      if (firstInput) {
        firstInput.focus();
      }
    }
  }
}
export type { LogFormData };

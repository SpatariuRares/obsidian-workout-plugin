// Base class for log modals (Create and Edit)
// Extracts common form creation and validation logic
import { CONSTANTS } from "@app/constants";
import { App, Notice } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { CSVWorkoutLogEntry, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { WorkoutDataChangedEvent } from "@app/types/WorkoutEvents";
import { Button } from "@app/components/atoms";
import { LogFormData, LogFormElements } from "@app/types/ModalTypes";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { DynamicFieldsRenderer } from "@app/features/modals/base/components/DynamicFieldsRenderer";
import { LogFormRenderer } from "@app/features/modals/base/components/LogFormRenderer";
import { LogSubmissionHandler } from "@app/features/modals/base/logic/LogSubmissionHandler";

import { fillDynamicInputsFromCustomFields } from "@app/utils/form/FormUtils";
import { RecentExercisesService } from "@app/features/modals/base/services/RecentExercisesService";
import { t } from "@app/i18n";

/**
 * Abstract base class for workout log modals.
 * Provides shared form creation, validation, and submission logic.
 * Subclasses implement specific behavior for create vs edit operations.
 */
export abstract class BaseLogModal extends ModalBase {
  protected exerciseName?: string;
  protected currentPageLink?: string;
  protected onComplete?: (context?: WorkoutDataChangedEvent) => void;
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
    onComplete?: (context?: WorkoutDataChangedEvent) => void,
  ) {
    super(app);
    this.exerciseName = exerciseName;
    this.currentPageLink = currentPageLink;
    this.onComplete = onComplete;
    this.dynamicFieldsRenderer = new DynamicFieldsRenderer(this.plugin);
    this.recentExercisesService = new RecentExercisesService(this.plugin);
    this.logFormRenderer = new LogFormRenderer(
      this.plugin,
      this.dynamicFieldsRenderer,
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

  /**
   * Determines if the workout toggle should be shown.
   * Defaults to true. Override in subclasses if needed.
   */
  protected shouldShowWorkoutToggle(): boolean {
    return true;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-modal");

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
      this.shouldShowWorkoutToggle(),
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
   * Helper method to create log entry object from LogFormData.
   * Simpler overload - recommended for new code.
   */
  protected createLogEntryObject(
    data: LogFormData,
  ): Omit<CSVWorkoutLogEntry, "timestamp">;

  /**
   * Helper method to create log entry object from individual parameters.
   * Preserved for backward compatibility with subclasses.
   * @deprecated Use the LogFormData overload instead
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
  ): Omit<CSVWorkoutLogEntry, "timestamp">;

  protected createLogEntryObject(
    dataOrExercise: LogFormData | string,
    reps?: number,
    weight?: number,
    workout?: string,
    notes?: string,
    date?: string,
    protocol?: WorkoutProtocol,
    customFields?: Record<string, string | number | boolean>,
  ): Omit<CSVWorkoutLogEntry, "timestamp"> {
    if (typeof dataOrExercise === "string") {
      // Old signature: individual parameters
      return LogSubmissionHandler.createLogEntry(
        {
          exercise: dataOrExercise,
          reps: reps!,
          weight: weight!,
          workout: workout!,
          notes: notes!,
          date,
          protocol,
          customFields,
        },
        this.currentPageLink,
      );
    } else {
      // New signature: LogFormData object
      return LogSubmissionHandler.createLogEntry(
        dataOrExercise,
        this.currentPageLink,
      );
    }
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
      text: t("modal.buttons.cancel"),
      ariaLabel: t("modal.buttons.cancel"),
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

      // Fire log-added event so timers can auto-start
      this.plugin.app.workspace.trigger("workout-planner:log-added", {
        exercise: data.exercise,
        workout: data.workout,
      });

      if (this.onComplete) {
        this.onComplete({
          exercise: data.exercise,
          workout: data.workout,
        });
      }
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
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

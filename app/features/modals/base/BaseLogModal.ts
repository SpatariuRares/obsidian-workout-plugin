// Base class for log modals (Create and Edit)
// Extracts common form creation and validation logic

import { App, Notice, Platform } from "obsidian";
import type { WorkoutPluginContext, TemplateGeneratorPort } from "@app/types/PluginPorts";
import { CreateExercisePageModal } from "@app/features/modals/exercise/CreateExercisePageModal";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { Button, BUTTONVARIANT } from "@app/components/atoms";
import { LogFormData, LogFormElements } from "@app/types/ModalTypes";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { DomUtils } from "@app/utils/DomUtils";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { DynamicFieldsRenderer } from "@app/features/modals/base/components/DynamicFieldsRenderer";
import { LogFormRenderer } from "@app/features/modals/base/components/LogFormRenderer";
import { readLogForm } from "@app/features/modals/base/components/readLogForm";
import { validate, type FormError } from "@app/features/modals/base/logic/LogEntryDraft";

import { fillDynamicInputsFromCustomFields } from "@app/utils/form/FormUtils";
import { RecentExercisesService } from "@app/features/modals/base/services/RecentExercisesService";
import { t } from "@app/i18n";
import { trainingDay } from "@app/services/history/TrainingHistory";
import {
  ProtocolCatalog,
  protocolId,
} from "@app/services/protocols/ProtocolCatalog";

/**
 * Abstract base class for workout log modals.
 * Provides shared form creation, validation, and submission logic.
 * Subclasses implement specific behavior for create vs edit operations.
 */
export abstract class BaseLogModal extends ModalBase {
  protected exerciseName?: string;
  protected currentPageLink?: string;
  protected dynamicFieldsRenderer: DynamicFieldsRenderer;
  protected logFormRenderer: LogFormRenderer;
  protected recentExercisesService: RecentExercisesService;

  // Track current parameters for dynamic validation
  protected currentParameters: ParameterDefinition[] = [];
  protected formElements?: LogFormElements;
  private stopKeepingFieldVisible?: () => void;

  constructor(
    app: App,
    protected plugin: WorkoutPluginContext,
    exerciseName?: string,
    currentPageLink?: string,
  ) {
    super(app);
    this.exerciseName = exerciseName;
    this.currentPageLink = currentPageLink;
    this.dynamicFieldsRenderer = new DynamicFieldsRenderer(
      this.plugin,
    );
    this.recentExercisesService = new RecentExercisesService(
      this.plugin,
    );
    const templatePlugin = this.plugin as WorkoutPluginContext & TemplateGeneratorPort;
    this.logFormRenderer = new LogFormRenderer(
      this.plugin,
      this.dynamicFieldsRenderer,
      this.recentExercisesService,
      "templateGeneratorService" in templatePlugin
        ? (name) => new CreateExercisePageModal(this.app, templatePlugin, name).open()
        : undefined,
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
    contentEl.addClass("workout-modal", "workout-log-modal");

    // iOS overlays the keyboard on the modal, hiding fields like notes
    if (Platform.isMobile) {
      this.stopKeepingFieldVisible =
        DomUtils.keepFocusedFieldVisible(contentEl);
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
      this.shouldShowWorkoutToggle(),
    );

    // Pre-fill form if needed
    if (this.shouldPreFillForm()) {
      this.preFillForm(this.formElements);
    }
    // Note: Auto-fill logic is now handled within LogFormRenderer's setup

    // Create buttons
    const buttonsContainer = Button.createContainer(formContainer);
    // Stays at the bottom of the modal on phones: saving the prefilled set
    // shouldn't need a scroll past protocol, notes and workout
    buttonsContainer.addClass("workout-log-actions");
    this.createButtons(buttonsContainer, this.formElements);

    // Set focus
    this.setInitialFocus(this.formElements);
  }

  onClose() {
    const { contentEl } = this;
    this.stopKeepingFieldVisible?.();
    this.stopKeepingFieldVisible = undefined;
    contentEl.empty();
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
      formElements.exerciseElements.exerciseInput.value =
        data.exercise;
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
      const weightInput =
        formElements.dynamicFieldInputs.get("weight");
      if (weightInput) {
        DynamicFieldsRenderer.setWeightValue(
          weightInput,
          data.weight,
          data.weightUnit,
        );
      }
    }

    if (data.notes) formElements.notesInput.value = data.notes;
    if (data.workout) formElements.workoutInput.value = data.workout;

    if (
      data.date &&
      formElements.dateInput &&
      this.shouldShowDateField()
    ) {
      formElements.dateInput.value = trainingDay(data.date);
    }
    if (data.protocol && formElements.protocolSelect) {
      const select = formElements.protocolSelect;
      const id = protocolId(data.protocol);
      // A set logged with a protocol no longer in the settings list (e.g. a
      // deleted drop set) keeps it: without an option the select would be
      // empty and saving would turn the set into standard
      if (!Array.from(select.options).some((o) => o.value === id)) {
        const info = new ProtocolCatalog(
          this.plugin.settings.customProtocols,
        ).resolve(id);
        select.createEl("option", { text: info.name, value: id });
      }
      select.value = id;
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
      variant: BUTTONVARIANT.PRIMARY,
      ariaLabel: this.getButtonText(),
    });

    const cancelBtn = Button.create(container, {
      text: t("modal.buttons.cancel"),
      ariaLabel: t("modal.buttons.cancel"),
      variant: BUTTONVARIANT.SECONDARY,
    });

    Button.onClick(cancelBtn, () => this.close());
    Button.onClick(submitBtn, () => {
      void (async () => {
        await this.handleFormSubmit(formElements);
      })();
    });
  }

  /**
   * Reads and validates the form, then hands the data to handleSubmit
   */
  protected async handleFormSubmit(
    formElements: LogFormElements,
  ): Promise<void> {
    const { data, fields } = readLogForm(
      formElements,
      this.getCurrentFileName(),
      this.currentParameters,
    );
    const error = validate(data.exercise, fields, this.currentParameters);
    this.clearFieldError();
    if (error) {
      this.showFieldError(formElements, error);
      return;
    }

    try {
      await this.handleSubmit(data);

      // Keep recent exercise chips in sync without blocking success flow.
      try {
        await this.recentExercisesService.trackExercise(
          data.exercise,
        );
      } catch {
        // Non-critical failure: log entry is already saved.
      }

      this.close();
      new Notice(this.getSuccessMessage());
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(
        t("modal.notices.genericError", { error: errorMessage }),
      );
    }
  }

  /**
   * Shows why the set can't be saved under the field to fix and focuses it,
   * so on a phone the message isn't a notice far from the field. Falls back
   * to a notice when the form has no such field.
   */
  private showFieldError(formElements: LogFormElements, error: FormError): void {
    const input =
      error.field === "exercise"
        ? formElements.exerciseElements.exerciseInput
        : formElements.dynamicFieldInputs.get(error.field);
    if (!input) {
      new Notice(error.message);
      return;
    }

    input.setAttribute("aria-invalid", "true");
    const message = this.contentEl.createDiv({
      cls: "workout-field-error",
      text: error.message,
      attr: { role: "alert" },
    });
    message.id = "workout-log-field-error";
    input.setAttribute("aria-describedby", message.id);
    // After the +/- row for numbers, so the message sits under the whole control
    (input.closest(".workout-input-with-adjust") ?? input).after(message);
    input.addEventListener("input", () => this.clearFieldError(), { once: true });
    input.focus();
  }

  private clearFieldError(): void {
    const { contentEl } = this;
    contentEl.querySelector(".workout-field-error")?.remove();
    contentEl.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");
    });
  }

  /**
   * Sets initial focus on appropriate input
   */
  protected setInitialFocus(formElements: LogFormElements): void {
    if (!this.exerciseName) {
      formElements.exerciseElements.exerciseInput.focus();
    } else {
      const firstInput = formElements.dynamicFieldInputs
        .values()
        .next().value;
      if (firstInput) {
        firstInput.focus();
      }
    }
  }
}
export type { LogFormData };

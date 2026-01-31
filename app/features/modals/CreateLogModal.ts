// CreateLogModal - extends BaseLogModal for creating new workout logs
import { CONSTANTS } from "@app/constants";
import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { BaseLogModal } from "@app/features/modals/base/BaseLogModal";
import { LogFormData } from "@app/types/ModalTypes";

export class CreateLogModal extends BaseLogModal {
  private initialValues?: Partial<LogFormData>;

  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    currentPageLink?: string,
    onLogCreated?: () => void,
    initialValues?: Partial<LogFormData>,
  ) {
    super(app, plugin, exerciseName, currentPageLink, onLogCreated);
    this.initialValues = initialValues;
  }

  protected getModalTitle(): string {
    return CONSTANTS.WORKOUT.MODAL.TITLES.CREATE_LOG;
  }

  protected getButtonText(): string {
    return CONSTANTS.WORKOUT.MODAL.BUTTONS.CREATE;
  }

  protected getSuccessMessage(): string {
    return CONSTANTS.WORKOUT.MODAL.NOTICES.LOG_CREATED;
  }

  protected getInitialWorkoutToggleState(): boolean {
    return true; // Default to checked for create modal
  }

  protected shouldPreFillForm(): boolean {
    return !!this.initialValues; // Pre-fill if initialValues provided
  }

  protected shouldAutoFillFromLastEntry(): boolean {
    // Enable auto-fill from last entry when no explicit initialValues provided
    return !this.initialValues;
  }

  protected getPreFillData(): Partial<LogFormData> | null {
    return this.initialValues || null;
  }

  protected async handleSubmit(data: LogFormData): Promise<void> {
    const entry = this.createLogEntryObject(
      data.exercise,
      data.reps ?? 0,
      data.weight ?? 0,
      data.workout,
      data.notes,
      undefined,
      data.protocol,
      data.customFields,
    );

    await this.plugin.addWorkoutLogEntry(entry);
  }
}

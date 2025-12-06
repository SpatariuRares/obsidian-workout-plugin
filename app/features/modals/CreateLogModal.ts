// CreateLogModal - extends BaseLogModal for creating new workout logs
import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { BaseLogModal, LogFormData } from "@app/features/modals/base/BaseLogModal";
import {
  MODAL_TITLES,
  MODAL_BUTTONS,
  MODAL_NOTICES,
} from "@app/constants/ModalConstants";

export class CreateLogModal extends BaseLogModal {
  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    currentPageLink?: string,
    onLogCreated?: () => void
  ) {
    super(app, plugin, exerciseName, currentPageLink, onLogCreated);
  }

  protected getModalTitle(): string {
    return MODAL_TITLES.CREATE_LOG;
  }

  protected getButtonText(): string {
    return MODAL_BUTTONS.CREATE;
  }

  protected getSuccessMessage(): string {
    return MODAL_NOTICES.LOG_CREATED;
  }

  protected getInitialWorkoutToggleState(): boolean {
    return true; // Default to checked for create modal
  }

  protected shouldPreFillForm(): boolean {
    return false; // No pre-fill for create modal
  }

  protected getPreFillData(): null {
    return null;
  }

  protected async handleSubmit(data: LogFormData): Promise<void> {
    const entry = this.createLogEntryObject(
      data.exercise,
      data.reps,
      data.weight,
      data.workout,
      data.notes
    );

    await this.plugin.addWorkoutLogEntry(entry);
  }
}

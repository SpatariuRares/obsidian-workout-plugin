// CreateLogModal - extends BaseLogModal for creating new workout logs
import { CONSTANTS } from "@app/constants/Constants";
import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { BaseLogModal } from "@app/features/modals/base/BaseLogModal";
import { LogFormData } from "@app/types/ModalTypes";

export class CreateLogModal extends BaseLogModal {
  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    currentPageLink?: string,
    onLogCreated?: () => void,
  ) {
    super(app, plugin, exerciseName, currentPageLink, onLogCreated);
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
      data.notes,
    );

    await this.plugin.addWorkoutLogEntry(entry);
  }
}

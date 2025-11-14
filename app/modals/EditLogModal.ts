// EditLogModal - extends BaseLogModal for editing existing workout logs
import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { BaseLogModal, LogFormData } from "@app/modals/base/BaseLogModal";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  MODAL_TITLES,
  MODAL_BUTTONS,
  MODAL_NOTICES,
} from "@app/constants/ModalConstants";

export class EditLogModal extends BaseLogModal {
  private originalLog: WorkoutLogData;

  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    originalLog: WorkoutLogData,
    onLogUpdated?: () => void
  ) {
    super(
      app,
      plugin,
      originalLog.exercise,
      originalLog.origine,
      onLogUpdated
    );
    this.originalLog = originalLog;
  }

  protected getModalTitle(): string {
    return MODAL_TITLES.EDIT_LOG;
  }

  protected getButtonText(): string {
    return MODAL_BUTTONS.UPDATE;
  }

  protected getSuccessMessage(): string {
    return MODAL_NOTICES.LOG_UPDATED;
  }

  protected getInitialWorkoutToggleState(): boolean {
    return false; // Default to unchecked for edit modal
  }

  protected shouldPreFillForm(): boolean {
    return true; // Pre-fill form with existing data
  }

  protected getPreFillData(): Partial<LogFormData> {
    return {
      exercise: this.originalLog.exercise || "",
      reps: this.originalLog.reps,
      weight: this.originalLog.weight,
      notes: this.originalLog.notes || "",
      workout: this.originalLog.workout || "",
    };
  }

  protected async handleSubmit(data: LogFormData): Promise<void> {
    const updatedEntry = this.createLogEntryObject(
      data.exercise,
      data.reps,
      data.weight,
      data.workout,
      data.notes,
      this.originalLog.date // Keep the original date
    );

    await this.plugin.updateWorkoutLogEntry(this.originalLog, updatedEntry);
  }
}

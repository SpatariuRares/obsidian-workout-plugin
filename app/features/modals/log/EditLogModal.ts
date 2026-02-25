// EditLogModal - extends BaseLogModal for editing existing workout logs

import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { BaseLogModal } from "@app/features/modals/base/BaseLogModal";
import { LogFormData } from "@app/types/ModalTypes";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { WorkoutDataChangedEvent } from "@app/types/WorkoutEvents";
import { t } from "@app/i18n";

export class EditLogModal extends BaseLogModal {
  private originalLog: WorkoutLogData;

  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    originalLog: WorkoutLogData,
    onLogUpdated?: (context?: WorkoutDataChangedEvent) => void,
  ) {
    super(app, plugin, originalLog.exercise, originalLog.origine, onLogUpdated);
    this.originalLog = originalLog;
  }

  protected getModalTitle(): string {
    return t("modal.titles.editLog");
  }

  protected getButtonText(): string {
    return t("modal.buttons.update");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.logUpdated");
  }

  protected getInitialWorkoutToggleState(): boolean {
    return false;
  }

  protected shouldPreFillForm(): boolean {
    return true;
  }

  protected shouldShowDateField(): boolean {
    return true;
  }

  protected getPreFillData(): Partial<LogFormData> {
    return {
      exercise: this.originalLog.exercise || "",
      reps: this.originalLog.reps,
      weight: this.originalLog.weight,
      notes: this.originalLog.notes || "",
      workout: this.originalLog.workout || "",
      date: this.originalLog.date,
      protocol: this.originalLog.protocol,
      customFields: this.originalLog.customFields,
    };
  }

  protected async handleSubmit(data: LogFormData): Promise<void> {
    let finalDate = this.originalLog.date;

    // If date was changed (and exists in data), preserve the original time
    if (data.date) {
      try {
        // data.date from input[type="date"] is "YYYY-MM-DD"
        // this.originalLog.date is full ISO "YYYY-MM-DDTHH:mm:ss.sssZ"

        const originalDateObj = new Date(this.originalLog.date);
        const newDateParts = data.date.split("-");

        if (newDateParts.length === 3) {
          const year = parseInt(newDateParts[0], 10);
          const month = parseInt(newDateParts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(newDateParts[2], 10);

          // Update year, month, day but keep time components
          originalDateObj.setFullYear(year);
          originalDateObj.setMonth(month);
          originalDateObj.setDate(day);

          finalDate = originalDateObj.toISOString();
        }
      } catch {
        // Failed to parse date, keeping original
      }
    }

    // Update the date in data with the preserved time
    const updatedData = { ...data, date: finalDate };
    const updatedEntry = this.createLogEntryObject(updatedData);

    await this.plugin.updateWorkoutLogEntry(this.originalLog, updatedEntry);
  }
}

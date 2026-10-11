// EditLogModal - extends BaseLogModal for editing existing workout logs

import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { BaseLogModal } from "@app/features/modals/base/BaseLogModal";
import { LogFormData } from "@app/types/ModalTypes";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  fromLog,
  toEntry,
} from "@app/features/modals/base/logic/LogEntryDraft";
import { t } from "@app/i18n";

export class EditLogModal extends BaseLogModal {
  private originalLog: WorkoutLogData;

  constructor(
    app: App,
    plugin: WorkoutPluginContext,
    originalLog: WorkoutLogData,
  ) {
    super(app, plugin, originalLog.exercise, originalLog.origine);
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
    return fromLog(this.originalLog);
  }

  protected async handleSubmit(data: LogFormData): Promise<void> {
    await this.plugin.updateWorkoutLogEntry(
      this.originalLog,
      toEntry(data, {
        original: this.originalLog,
        now: new Date(),
        pageLink: this.currentPageLink,
      }),
    );
  }
}

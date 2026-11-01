// EditLogModal - extends BaseLogModal for editing existing workout logs

import { App, Notice, setIcon } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { BaseLogModal } from "@app/features/modals/base/BaseLogModal";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import { describeSet } from "@app/features/modals/log/LogHistory";
import { DateUtils } from "@app/utils/DateUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { LogFormData, LogFormElements } from "@app/types/ModalTypes";
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

  /**
   * Deleting is rare, so it is a small trash icon at the start of the save
   * bar: always there, out of the way, and it still asks to confirm
   */
  protected createButtons(
    container: HTMLElement,
    formElements: LogFormElements,
  ): void {
    const deleteBtn = container.createEl("button", {
      cls: "clickable-icon workout-log-delete",
      attr: {
        type: "button",
        "aria-label": t("modal.buttons.deleteSet"),
      },
    });
    setIcon(deleteBtn, "trash-2");
    deleteBtn.addEventListener("click", () => this.confirmDelete());
    super.createButtons(container, formElements);
  }

  /** Asks to confirm, naming the set as it was logged (not as edited) */
  private confirmDelete(): void {
    const log = this.originalLog;
    const set = [
      log.exercise,
      describeSet(log, this.currentParameters, this.plugin.settings.weightUnit),
      DateUtils.toShortDate(log.date),
    ].join(" · ");

    new ConfirmModal(
      this.app,
      t("table.deleteSetMessage", { set }),
      async () => {
        try {
          await this.plugin.deleteWorkoutLogEntry(log);
          this.close();
          new Notice(t("table.deleteSuccess"));
        } catch (error) {
          new Notice(
            t("table.deleteError", { error: ErrorUtils.getErrorMessage(error) }),
          );
        }
      },
      undefined,
      {
        title: t("table.deleteSetTitle"),
        confirmText: t("table.deleteTitle"),
        destructive: true,
      },
    ).open();
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

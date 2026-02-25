// CreateLogModal - extends BaseLogModal for creating new workout logs

import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { BaseLogModal } from "@app/features/modals/base/BaseLogModal";
import { LogFormData } from "@app/types/ModalTypes";
import { WorkoutDataChangedEvent } from "@app/types/WorkoutEvents";
import { t } from "@app/i18n";

export class CreateLogModal extends BaseLogModal {
  private initialValues?: Partial<LogFormData>;
  private currentWorkoutDoesntExist: boolean;

  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    currentPageLink?: string,
    onLogCreated?: (context?: WorkoutDataChangedEvent) => void,
    initialValues?: Partial<LogFormData>,
    currentWorkoutDoesntExist = false,
  ) {
    super(app, plugin, exerciseName, currentPageLink, onLogCreated);
    this.initialValues = initialValues;
    this.currentWorkoutDoesntExist = currentWorkoutDoesntExist;
  }

  protected getModalTitle(): string {
    return t("modal.titles.createLog");
  }

  protected getButtonText(): string {
    return t("modal.buttons.create");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.logCreated");
  }

  protected getInitialWorkoutToggleState(): boolean {
    return !this.currentWorkoutDoesntExist;
  }

  protected shouldShowWorkoutToggle(): boolean {
    return !this.currentWorkoutDoesntExist;
  }

  protected shouldPreFillForm(): boolean {
    return !!this.initialValues; // Pre-fill if initialValues provided
  }

  public shouldAutoFillFromLastEntry(): boolean {
    // Enable auto-fill from last entry when no explicit initialValues provided
    return !this.initialValues;
  }

  protected getPreFillData(): Partial<LogFormData> | null {
    return this.initialValues || null;
  }

  protected async handleSubmit(data: LogFormData): Promise<void> {
    const entry = this.createLogEntryObject(data);
    await this.plugin.addWorkoutLogEntry(entry);
  }
}

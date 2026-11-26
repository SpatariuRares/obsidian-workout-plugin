// CreateLogModal - extends BaseLogModal for creating new workout logs

import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { BaseLogModal } from "@app/features/modals/base/BaseLogModal";
import { LogFormData } from "@app/types/ModalTypes";
import { toEntry } from "@app/features/modals/base/logic/LogEntryDraft";
import { normalizeExercise } from "@app/services/events/WorkoutEventTypes";
import { t } from "@app/i18n";

export class CreateLogModal extends BaseLogModal {
  private initialValues?: Partial<LogFormData>;
  private currentWorkoutDoesntExist: boolean;

  constructor(
    app: App,
    plugin: WorkoutPluginContext,
    exerciseName?: string,
    currentPageLink?: string,
    initialValues?: Partial<LogFormData>,
    currentWorkoutDoesntExist = false,
  ) {
    super(app, plugin, exerciseName, currentPageLink);
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
    await this.plugin.addWorkoutLogEntry(
      toEntry(
        { ...data, block: this.blockOf(data) },
        { now: new Date(), pageLink: this.currentPageLink },
      ),
    );
  }

  /**
   * The `workout-sets` block the form was opened for (a session step), while
   * the set is still that block's exercise
   */
  private blockOf(data: LogFormData): string | undefined {
    const initial = this.initialValues;
    if (!initial?.block || initial.exercise === undefined) return undefined;
    return normalizeExercise(initial.exercise) === normalizeExercise(data.exercise)
      ? initial.block
      : undefined;
  }
}

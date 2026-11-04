import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { InsertSetsModal } from "@app/features/sets/modals/InsertSetsModal";
import { setsBlock, type EmbeddedSetsParams } from "@app/features/sets/setsBlock";
import {
  createEditButtons,
  type EditTarget,
} from "@app/features/modals/base/components/createEditButtons";
import { t } from "@app/i18n";

/**
 * Edits a `workout-sets` block: the insert form, filled in with the block's
 * parameters, patching only the ones the user changed.
 */
export class EditSetsModal extends InsertSetsModal {
  /** @param where - The note the block is written in, and how to find it without an id */
  constructor(
    app: App,
    plugin: WorkoutPluginContext,
    private readonly initialParams: EmbeddedSetsParams,
    private readonly where: EditTarget,
  ) {
    super(app, plugin);
  }

  protected getModalTitle(): string {
    return t("sets.editBlock");
  }

  protected getButtonText(): string {
    return t("modal.buttons.update");
  }

  protected getSuccessMessage(): string {
    return t("sets.blockUpdated");
  }

  protected getCodeBlockId(): string {
    return this.initialParams.id || super.getCodeBlockId();
  }

  protected createConfigurationSections(container: HTMLElement): void {
    super.createConfigurationSections(container);
    const { exercise, workout, sets, targetReps, targetWeight } = this.initialParams;
    if (this.exerciseInput) this.exerciseInput.value = exercise ?? "";
    if (this.workoutInput) this.workoutInput.value = workout ?? "";
    // An unset value shows as 0, which collectParams leaves out again
    if (this.setsInput) this.setsInput.value = String(sets ?? 0);
    if (this.targetRepsInput) this.targetRepsInput.value = String(targetReps ?? 0);
    if (this.targetWeightInput) this.targetWeightInput.value = String(targetWeight ?? 0);
  }

  protected createButtons(container: HTMLElement): void {
    createEditButtons(this, container, {
      schema: setsBlock,
      target: this.where,
      id: this.initialParams.id,
      collectParams: () => this.collectParams(),
      buttonText: this.getButtonText(),
      successMessage: this.getSuccessMessage(),
      failureMessage: t("sets.blockUpdateFailed"),
    });
  }
}

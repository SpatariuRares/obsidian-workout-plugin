import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { InsertSetsModal } from "@app/features/tables/modals/InsertSetsModal";
import { PlanFields } from "@app/features/tables/modals/components/PlanFields";
import { setsBlock, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
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
    const { exercise, workout } = this.initialParams;
    if (this.exerciseInput) this.exerciseInput.value = exercise ?? "";
    if (this.workoutInput) this.workoutInput.value = workout ?? "";
    if (this.planFields) PlanFields.fill(this.planFields, this.initialParams);
    if (this.restInput) this.restInput.value = String(this.initialParams.rest ?? 0);
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

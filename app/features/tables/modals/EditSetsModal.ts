import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import {
  InsertSetsModal,
  type InsertSetsState,
} from "@app/features/tables/modals/InsertSetsModal";
import { setsBlock, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import { changedParams } from "@app/services/codeblocks/CodeBlockSchema";
import {
  applyBlockEdit,
  type EditTarget,
} from "@app/features/modals/base/components/createEditButtons";
import { t } from "@app/i18n";

/**
 * Edits a `workout-sets` block: the insert wizard, filled in with the block's
 * parameters, patching only the ones the user changed.
 */
export class EditSetsModal extends InsertSetsModal {
  private formAtOpen?: EmbeddedSetsParams;

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

  protected override createInitialState(): InsertSetsState {
    return {
      exercise: this.initialParams.exercise ?? "",
      workout: this.initialParams.workout ?? "",
      sets: this.initialParams.sets,
      targetWeight: this.initialParams.targetWeight,
      targetReps: this.initialParams.targetReps,
      rest: this.initialParams.rest ?? 0,
    };
  }

  override onOpen(): void {
    super.onOpen();
    // Snapshot initial form values once on open, never on footer re-renders
    this.formAtOpen = this.collectParams();
  }

  protected override onSubmit(_state: InsertSetsState): void {
    const formNow = this.collectParams();
    const formAtOpen = this.formAtOpen ?? formNow;
    const changes = changedParams(formAtOpen, formNow);
    for (const key of this.where.invalidKeys ?? []) {
      const invalidKey = key as keyof EmbeddedSetsParams;
      Object.assign(changes, { [invalidKey]: formNow[invalidKey] });
    }
    applyBlockEdit(
      this,
      {
        schema: setsBlock,
        target: this.where,
        id: this.initialParams.id,
        successMessage: this.getSuccessMessage(),
        failureMessage: t("sets.blockUpdateFailed"),
      },
      changes,
    );
  }
}

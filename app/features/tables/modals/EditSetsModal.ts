import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { ModalAction } from "@app/components/atoms";
import {
  InsertSetsModal,
  type InsertSetsState,
} from "@app/features/tables/modals/InsertSetsModal";
import {
  setsBlock,
  isSupersetBlock,
  type EmbeddedSetsParams,
} from "@app/features/tables/setsBlock";
import { changedParams } from "@app/services/codeblocks/CodeBlockSchema";
import {
  ProtocolCatalog,
  protocolId,
  type ProtocolInfo,
} from "@app/services/protocols/ProtocolCatalog";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
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
    const superset = isSupersetBlock(this.initialParams);
    return {
      protocol: superset
        ? WorkoutProtocol.SUPERSET
        : protocolId(this.initialParams.protocol),
      exercise: this.initialParams.exercise ?? "",
      exercises:
        this.initialParams.exercises && this.initialParams.exercises.length >= 2
          ? [...this.initialParams.exercises]
          : [this.initialParams.exercise ?? "", ""],
      workout: this.initialParams.workout ?? "",
      sets: this.initialParams.sets,
      warmups: this.initialParams.warmups ?? 0,
      targetWeight: this.initialParams.targetWeight,
      targetReps: this.initialParams.targetReps,
      restBetween: this.initialParams.restBetween ?? 0,
      rest: this.initialParams.rest ?? 0,
    };
  }

  protected override getProtocolOptions(catalog: ProtocolCatalog): ProtocolInfo[] {
    const initial = isSupersetBlock(this.initialParams)
      ? WorkoutProtocol.SUPERSET
      : protocolId(this.initialParams.protocol);
    return catalog
      .optionsIncluding(initial)
      .filter((p) => p.id !== (WorkoutProtocol.WARMUP as string));
  }

  override onOpen(): void {
    super.onOpen();
    // Snapshot initial form values once on open, never on footer re-renders
    this.formAtOpen = this.collectParams();
  }

  protected override getSecondaryActions(stepIndex: number): ModalAction[] {
    if (stepIndex >= this.stepCount - 1) return [];
    return [
      {
        text: this.getButtonText(),
        onClick: () => this.handleSubmit(),
      },
    ];
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

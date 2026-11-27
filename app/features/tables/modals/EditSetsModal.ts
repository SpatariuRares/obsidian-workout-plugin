import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { InsertSetsModal } from "@app/features/tables/modals/InsertSetsModal";
import {
  setsBlock,
  isSupersetBlock,
  type EmbeddedSetsParams,
} from "@app/features/tables/setsBlock";
import {
  ProtocolCatalog,
  protocolId,
  type ProtocolInfo,
} from "@app/services/protocols/ProtocolCatalog";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import {
  applyBlockEdit,
  changesSince,
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
    this.quickSubmit = true;
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

  protected override getProtocolOptions(catalog: ProtocolCatalog): ProtocolInfo[] {
    const initial = isSupersetBlock(this.initialParams)
      ? WorkoutProtocol.SUPERSET
      : protocolId(this.initialParams.protocol);
    return catalog
      .optionsIncluding(initial)
      .filter((p) => p.id !== (WorkoutProtocol.WARMUP as string));
  }

  protected createConfigurationSections(container: HTMLElement): void {
    this.applyInitialParams(this.initialParams);
    super.createConfigurationSections(container);
    // Snapshot after the prefill so only what the user changes is patched
    this.formAtOpen = this.collectParams();
    // The prefill sets values without events: unlock the stepper for them
    this.refreshHeader();
  }

  protected submit(): void {
    const formNow = this.collectParams();
    const changes = changesSince(this.formAtOpen ?? formNow, formNow, this.where);
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

  private applyInitialParams(params: EmbeddedSetsParams): void {
    const superset = isSupersetBlock(params);
    this.selectedProtocol = superset
      ? WorkoutProtocol.SUPERSET
      : protocolId(params.protocol);
    this.singleExercise = params.exercise ?? "";
    this.supersetExercises =
      params.exercises && params.exercises.length >= 2
        ? [...params.exercises]
        : [params.exercise ?? "", ""];
    this.workoutValue = params.workout ?? "";
    this.plannedSets = params.sets;
    this.warmupsValue = params.warmups ?? 0;
    this.targetWeightValue = params.targetWeight;
    this.targetRepsValue = params.targetReps;
    this.restBetweenValue = params.restBetween ?? 0;
    this.restValue = params.rest ?? 0;
  }
}

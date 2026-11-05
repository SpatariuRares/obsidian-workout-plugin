import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { EditTimerModal } from "@app/features/timer/modals/EditTimerModal";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import {
  blockRest,
  restParams,
  setsBlock,
  type EmbeddedSetsParams,
} from "@app/features/tables/setsBlock";
import {
  createEditButtons,
  type EditTarget,
} from "@app/features/modals/base/components/createEditButtons";
import { t } from "@app/i18n";

/**
 * Edits the rest timer of a `workout-sets` block with every option of the
 * timer form, written into the block itself (`rest` and `timer.*`, see
 * restParams). It opens on the timer the block rests on now; when that is
 * not the block's own (the section's `workout-timer` or the default preset),
 * Update writes all of it, so the block keeps resting the same way.
 */
export class EditRestTimerModal extends EditTimerModal {
  /**
   * @param sets - The block's parameters
   * @param resting - The timer it rests on now (restOf)
   * @param where - The note the block is written in, and how to find it without an id
   */
  constructor(
    app: App,
    plugin: WorkoutPluginContext,
    private readonly sets: EmbeddedSetsParams,
    resting: EmbeddedTimerParams,
    where: EditTarget,
  ) {
    // The id is the shared timer's (a section's), not this block's
    super(app, plugin, { ...resting, id: undefined }, where);
  }

  protected getModalTitle(): string {
    return t("sets.editRestTimer");
  }

  protected createConfigurationSections(container: HTMLElement): void {
    super.createConfigurationSections(container);
    // The rest belongs to the block's exercise
    this.timerElements?.exerciseInput
      .closest(".workout-charts-form-group")
      ?.addClass("workout-display-none");
  }

  protected createButtons(container: HTMLElement): void {
    const own = blockRest(this.sets) !== undefined;
    const collect = () => restParams(this.collectParams());
    createEditButtons(this, container, {
      schema: setsBlock,
      target: own
        ? this.where
        : {
            ...this.where,
            invalidKeys: [
              ...(this.where.invalidKeys ?? []),
              ...Object.keys(collect()),
            ],
          },
      id: this.sets.id,
      collectParams: collect,
      buttonText: this.getButtonText(),
      successMessage: this.getSuccessMessage(),
      failureMessage: t("modal.notices.timerUpdateFailed"),
    });
  }
}

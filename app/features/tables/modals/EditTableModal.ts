import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { InsertTableModal } from "@app/features/tables/modals/InsertTableModal";
import {
  EmbeddedTableParams,
  TABLE_TYPE,
} from "@app/features/tables/types";
import { tableBlock } from "@app/features/tables/tableBlock";
import { PlanFields } from "@app/features/tables/modals/components/PlanFields";
import type { EditTarget } from "@app/features/modals/base/components/createEditButtons";
import { t } from "@app/i18n";

/**
 * EditTableModal - Modal for editing existing table code block parameters.
 *
 * Extends InsertTableModal to reuse form creation, then pre-fills fields
 * with current params and patches the parameters the user changed into the
 * code block on submit (matched by ID).
 */
export class EditTableModal extends InsertTableModal {
  private readonly initialParams: EmbeddedTableParams;

  /** @param where - The note the block is written in, and how to find it without an id */
  constructor(
    app: App,
    plugin: WorkoutPluginContext,
    params: EmbeddedTableParams,
    private readonly where: EditTarget,
  ) {
    super(app, plugin);
    this.initialParams = params;
  }

  protected getModalTitle(): string {
    return t("modal.titles.editTable");
  }

  protected getButtonText(): string {
    return t("modal.buttons.updateTable");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.tableUpdated");
  }

  protected createConfigurationSections(
    container: HTMLElement,
  ): void {
    super.createConfigurationSections(container);
    this.prefillFields();
  }

  /**
   * Pre-fill all form fields with the current table params
   */
  private prefillFields(): void {
    const params = this.initialParams;

    // Determine and set table type
    this.tableType?.select(this.inferTableType(params));

    // Pre-fill exercise and workout inputs
    if (this.targetElements) {
      if (params.exercise) {
        this.targetElements.exerciseInput.value = params.exercise;
      }
      if (params.workout) {
        this.targetElements.workoutInput.value = params.workout;
      }
    }

    // Pre-fill date range
    if (this.dateRangeInput && params.dateRange !== undefined) {
      this.dateRangeInput.value = params.dateRange.toString();
    }

    // Pre-fill the plan (sets and progressive overload targets)
    if (this.planFields) PlanFields.fill(this.planFields, params);

    // Pre-fill advanced options
    if (this.advancedElements) {
      if (params.exactMatch !== undefined) {
        this.advancedElements.exactMatchToggle.checked =
          params.exactMatch;
      }
      if (
        params.showAddButton !== undefined &&
        this.advancedElements.addButtonToggle
      ) {
        this.advancedElements.addButtonToggle.checked =
          params.showAddButton;
      }
    }
  }

  /**
   * Infer the TABLE_TYPE from the current params
   */
  private inferTableType(params: EmbeddedTableParams): TABLE_TYPE {
    if (params.exercise && params.workout) return TABLE_TYPE.COMBINED;
    if (params.exercise) return TABLE_TYPE.EXERCISE;
    if (params.workout) return TABLE_TYPE.WORKOUT;
    return TABLE_TYPE.ALL;
  }

  protected createButtons(container: HTMLElement): void {
    const { id } = this.initialParams;
    this.editButtons(container, tableBlock, t("modal.notices.tableUpdateFailed"), {
      target: this.where,
      id,
      collectParams: () => this.collectParams(),
      // The rows now follow the planned sets (tableRowLimit)
      retiredParams: ["limit"],
    });
  }
}

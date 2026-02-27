import { App, Notice } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { InsertTableModal } from "@app/features/tables/modals/InsertTableModal";
import { EmbeddedTableParams, TABLE_TYPE } from "@app/features/tables/types";
import { CodeBlockEditorService } from "@app/services/editor/CodeBlockEditorService";
import { Button } from "@app/components/atoms/Button";
import { t } from "@app/i18n";

/**
 * EditTableModal - Modal for editing existing table code block parameters.
 *
 * Extends InsertTableModal to reuse form creation, then pre-fills fields
 * with current params and replaces the code block on submit (matched by ID).
 */
export class EditTableModal extends InsertTableModal {
  private readonly initialParams: EmbeddedTableParams;

  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    params: EmbeddedTableParams,
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

  /**
   * Preserve the existing code block ID instead of generating a new one
   */
  protected getCodeBlockId(): string {
    return this.initialParams.id || super.getCodeBlockId();
  }

  protected createConfigurationSections(container: HTMLElement): void {
    super.createConfigurationSections(container);
    this.prefillFields();
  }

  /**
   * Pre-fill all form fields with the current table params
   */
  private prefillFields(): void {
    const params = this.initialParams;

    // Determine and set table type
    const tableType = this.inferTableType(params);
    this.onTableTypeChipClick(tableType);

    // Pre-fill exercise and workout inputs
    if (this.targetElements) {
      if (params.exercise) {
        this.targetElements.exerciseInput.value = params.exercise;
      }
      if (params.workout) {
        this.targetElements.workoutInput.value = params.workout;
      }
    }

    // Pre-fill limit
    if (this.limitInput && params.limit !== undefined) {
      this.limitInput.value = params.limit.toString();
    }

    // Pre-fill date range
    if (this.dateRangeInput && params.dateRange !== undefined) {
      this.dateRangeInput.value = params.dateRange.toString();
    }

    // Pre-fill progressive overload targets
    if (this.targetWeightInput && params.targetWeight !== undefined) {
      this.targetWeightInput.value = params.targetWeight.toString();
    }
    if (this.targetRepsInput && params.targetReps !== undefined) {
      this.targetRepsInput.value = params.targetReps.toString();
    }

    // Pre-fill advanced options
    if (this.advancedElements) {
      if (params.exactMatch !== undefined) {
        this.advancedElements.exactMatchToggle.checked = params.exactMatch;
      }
      if (
        params.searchByName !== undefined &&
        this.advancedElements.searchByNameToggle
      ) {
        this.advancedElements.searchByNameToggle.checked = params.searchByName;
      }
      if (
        params.showAddButton !== undefined &&
        this.advancedElements.addButtonToggle
      ) {
        this.advancedElements.addButtonToggle.checked = params.showAddButton;
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

  /**
   * Override button creation to replace code block instead of inserting
   */
  protected createButtons(container: HTMLElement): void {
    const updateBtn = Button.create(container, {
      text: this.getButtonText(),
      variant: "primary",
      ariaLabel: this.getButtonText(),
    });

    const cancelBtn = Button.create(container, {
      text: t("modal.buttons.cancel"),
      variant: "warning",
      ariaLabel: t("modal.buttons.cancel"),
    });

    Button.onClick(cancelBtn, () => this.close());

    Button.onClick(updateBtn, () => {
      const code = this.generateCode();
      const id = this.initialParams.id;

      if (!id) {
        new Notice(t("modal.notices.tableUpdateFailed"));
        this.close();
        return;
      }

      void CodeBlockEditorService.replaceCodeBlock(
        this.app,
        "workout-log",
        id,
        code,
      ).then((success) => {
        if (success) {
          new Notice(this.getSuccessMessage());
        } else {
          new Notice(t("modal.notices.tableUpdateFailed"));
        }
      });

      this.close();
    });
  }
}

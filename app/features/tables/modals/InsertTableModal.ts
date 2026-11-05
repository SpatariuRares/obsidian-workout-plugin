// Refactored InsertTableModal extending BaseInsertModal
import { AdjustField } from "@app/components/molecules/AdjustField";
import { CONSTANTS } from "@app/constants";
import { DomUtils } from "@app/utils/DomUtils";
import { App, Notice } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import {
  TargetSectionWithAutocomplete,
  TargetSectionWithAutocompleteElements,
  type TargetSectionWithAutocompleteHandlers,
} from "@app/features/modals/components/TargetSectionWithAutocomplete";
import {
  AdvancedOptionsSection,
  AdvancedOptionsElements,
} from "@app/features/modals/components/AdvancedOptionsSection";
import {
  TABLE_TYPE,
  type EmbeddedTableParams,
} from "@app/features/tables/types";
import { tableBlock } from "@app/features/tables/tableBlock";
import {
  PlanFields,
  type PlanFieldsElements,
} from "@app/features/tables/modals/components/PlanFields";
import {
  ChipGroup,
  type ChipGroupResult,
} from "@app/components/molecules/ChipGroup";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

const DATE_RANGE_INCREMENT = 7;

export class InsertTableModal extends BaseInsertModal {
  protected tableType?: ChipGroupResult<TABLE_TYPE>;
  protected targetElements?: TargetSectionWithAutocompleteElements;
  private targetHandlers?: TargetSectionWithAutocompleteHandlers;
  protected dateRangeInput?: HTMLInputElement;
  protected advancedElements?: AdvancedOptionsElements;
  protected planFields?: PlanFieldsElements;
  protected progressiveSection?: HTMLElement;
  protected currentFileName: string;

  constructor(app: App, plugin: WorkoutPluginContext) {
    super(app, plugin);
    this.currentFileName = this.getCurrentFileName();
  }

  protected getModalTitle(): string {
    return t("modal.titles.insertTable");
  }

  protected getButtonText(): string {
    return t("modal.buttons.insertTable");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.tableInserted");
  }

  protected createConfigurationSections(
    container: HTMLElement,
  ): void {
    // Table Type Section
    const tableTypeSection = this.createSection(
      container,
      t("modal.sections.tableType"),
    );

    if (!this.plugin) {
      throw new Error("Plugin is required for InsertTableModal");
    }

    // The table type picks which target fields and sections show
    this.tableType = ChipGroup.create<TABLE_TYPE>(tableTypeSection, {
      label: t("modal.sections.tableType"),
      labelHidden: true,
      options: CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.TABLE_TYPE.map(
        (option) => ({ id: option.value, label: option.label }),
      ),
      selected: TABLE_TYPE.COMBINED,
      className: "workout-modal-type-chips",
      onPick: () => this.updateSectionsVisibility(),
    });

    const tableType = this.tableType;
    const target = TargetSectionWithAutocomplete.create(
      this,
      container,
      () => tableType.value(),
      this.currentFileName,
      this.plugin,
    );
    this.targetElements = target.elements;
    this.targetHandlers = target.handlers;

    // Configuration Section
    const configSection = this.createSection(
      container,
      t("modal.sections.configuration"),
    );

    // Parameters container (grid layout)
    const parametersContainer = configSection.createDiv({
      cls: "workout-parameters-container",
    });

    // Date range with +/- adjust
    this.dateRangeInput = AdjustField.create(parametersContainer, {
      label: t("modal.dateRange"),
      value: 0,
      min: 0,
      max: 365,
      step: DATE_RANGE_INCREMENT,
      unit: "d",
    });

    // Progressive Overload Section
    this.progressiveSection = this.createSection(
      container,
      t("modal.sections.progressiveOverload"),
    );

    this.planFields = PlanFields.create(this.progressiveSection);
    this.updateSectionsVisibility();

    // Advanced Options Section using reusable component
    this.advancedElements = AdvancedOptionsSection.create(
      this,
      container,
      {
        showAddButton: true,
        compact: true,
      },
    );

    // Set default values based on plugin settings
    this.advancedElements.exactMatchToggle.checked =
      this.plugin.settings.defaultExactMatch;
  }

  protected updateSectionsVisibility(): void {
    if (!this.tableType || !this.targetElements || !this.targetHandlers) return;

    const type = this.tableType.value();
    const targetContainer = this.targetElements.container;
    const showTarget = type !== TABLE_TYPE.ALL;
    const showProgressive =
      type === TABLE_TYPE.EXERCISE || type === TABLE_TYPE.COMBINED;

    DomUtils.setCssProps(targetContainer, {
      display: showTarget ? "flex" : "none",
    });

    if (this.progressiveSection) {
      DomUtils.setCssProps(this.progressiveSection, {
        display: showProgressive ? "flex" : "none",
      });
    }

    if (showTarget) {
      this.targetHandlers.updateVisibility();
    }
  }

  protected generateCode(): string {
    return tableBlock.serialize({ id: generateCodeBlockId(), ...this.collectParams() });
  }

  /**
   * The block parameters the form sets. Parameters the form leaves at their
   * default are undefined, so they are not written (and an edit removes them).
   */
  protected collectParams(): EmbeddedTableParams {
    if (
      !this.tableType ||
      !this.targetElements ||
      !this.advancedElements
    ) {
      throw new Error(t("modal.errors.missingElements"));
    }

    const tableType = this.tableType.value();
    const target = TargetSectionWithAutocomplete.getTargetValue(
      this.targetElements,
      tableType,
      this.currentFileName,
    );
    const dateRange = this.dateRangeInput
      ? parseInt(this.dateRangeInput.value) || 0
      : 0;
    const showAddButton =
      this.advancedElements.addButtonToggle?.checked ?? true;
    const advancedValues = AdvancedOptionsSection.getValues(
      this.advancedElements,
    );
    const plan = this.planFields ? PlanFields.read(this.planFields) : {};

    if (
      tableType === TABLE_TYPE.COMBINED &&
      (!target.exercise || !target.workout)
    ) {
      new Notice(t("modal.notices.validationCombinedMode"));
      throw new Error(t("modal.errors.validationCombinedMode"));
    }

    return {
      exercise: target.exercise || undefined,
      workout: target.workout || undefined,
      dateRange: dateRange > 0 ? dateRange : undefined,
      showAddButton: showAddButton ? undefined : false,
      exactMatch: advancedValues.exactMatch ? true : undefined,
      ...plan,
    };
  }
}

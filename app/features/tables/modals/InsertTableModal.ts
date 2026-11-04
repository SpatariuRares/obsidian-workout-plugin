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
import { Chip } from "@app/components/atoms/Chip";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

const DATE_RANGE_INCREMENT = 7;

export class InsertTableModal extends BaseInsertModal {
  protected tableTypeSelect?: HTMLSelectElement;
  protected tableTypeChips: Map<string, HTMLButtonElement> =
    new Map();
  protected targetElements?: TargetSectionWithAutocompleteElements;
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

    // Hidden select as backing store for TargetSectionWithAutocomplete
    this.tableTypeSelect = tableTypeSection.createEl("select", {
      cls: "workout-charts-select",
    });
    DomUtils.setCssProps(this.tableTypeSelect, { display: "none" });

    for (const option of CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS
      .TABLE_TYPE) {
      this.tableTypeSelect.createEl("option", {
        text: option.label,
        value: option.value,
      });
    }

    // Chips for table type selection
    const chipContainer = tableTypeSection.createDiv({
      cls: "workout-table-type-chips",
    });

    for (const option of CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS
      .TABLE_TYPE) {
      const isDefault =
        (option.value as TABLE_TYPE) === TABLE_TYPE.COMBINED;
      const chip = Chip.create(chipContainer, {
        text: option.label,
        selected: isDefault,
        onClick: () => this.onTableTypeChipClick(option.value),
      });
      this.tableTypeChips.set(option.value, chip);
    }

    // Set initial select value
    this.tableTypeSelect.value = TABLE_TYPE.COMBINED;

    // Target Section using reusable component with autocomplete
    if (!this.plugin) {
      throw new Error("Plugin is required for InsertTableModal");
    }

    const { elements: targetElements, handlers: targetHandlers } =
      TargetSectionWithAutocomplete.create(
        this,
        container,
        this.tableTypeSelect,
        this.currentFileName,
        this.plugin,
      );

    this.targetElements = targetElements;

    // Ensure visibility is updated based on initial selection
    targetHandlers.updateVisibility();

    // Event listener for display toggle
    this.tableTypeSelect.addEventListener("change", () => {
      this.updateSectionsVisibility(targetHandlers);
    });

    // Apply visibility for initial state
    this.updateSectionsVisibility(targetHandlers);

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

  protected onTableTypeChipClick(value: string): void {
    if (!this.tableTypeSelect) return;

    // Update chips
    for (const [chipValue, chip] of this.tableTypeChips) {
      Chip.setSelected(chip, chipValue === value);
    }

    // Update hidden select and dispatch change event
    this.tableTypeSelect.value = value;
    this.tableTypeSelect.dispatchEvent(new Event("change"));
  }

  protected updateSectionsVisibility(targetHandlers: {
    updateVisibility: () => void;
  }): void {
    if (!this.tableTypeSelect || !this.targetElements) return;

    const type = this.tableTypeSelect.value as TABLE_TYPE;
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
      targetHandlers.updateVisibility();
    }
  }

  protected generateCode(): string {
    return tableBlock.serialize(this.collectParams());
  }

  /**
   * The block parameters the form sets. Parameters the form leaves at their
   * default are undefined, so they are not written (and an edit removes them).
   */
  protected collectParams(): EmbeddedTableParams {
    if (
      !this.tableTypeSelect ||
      !this.targetElements ||
      !this.advancedElements
    ) {
      throw new Error(t("modal.errors.missingElements"));
    }

    const tableType = this.tableTypeSelect.value as TABLE_TYPE;
    const target = TargetSectionWithAutocomplete.getTargetValue(
      this.targetElements,
      this.tableTypeSelect,
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
      id: this.getCodeBlockId(),
      exercise: target.exercise || undefined,
      workout: target.workout || undefined,
      dateRange: dateRange > 0 ? dateRange : undefined,
      showAddButton: showAddButton ? undefined : false,
      exactMatch: advancedValues.exactMatch ? true : undefined,
      ...plan,
    };
  }

  /**
   * Generates a unique ID for the code block.
   * Subclasses can override to preserve an existing ID.
   */
  protected getCodeBlockId(): string {
    return generateCodeBlockId();
  }
}

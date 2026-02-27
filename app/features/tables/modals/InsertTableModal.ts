// Refactored InsertTableModal extending BaseInsertModal
import { CONSTANTS, getDynamicModalLabels } from "@app/constants";
import { DomUtils } from "@app/utils/DomUtils";
import { App, Notice } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import {
  TargetSectionWithAutocomplete,
  TargetSectionWithAutocompleteElements,
} from "@app/features/modals/components/TargetSectionWithAutocomplete";
import {
  AdvancedOptionsSection,
  AdvancedOptionsElements,
} from "@app/features/modals/components/AdvancedOptionsSection";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { TABLE_TYPE } from "@app/features/tables/types";
import { Chip } from "@app/components/atoms/Chip";
import { Button } from "@app/components/atoms/Button";
import { Input } from "@app/components/atoms/Input";
import { INPUT_TYPE } from "@app/types/InputTypes";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

const LIMIT_INCREMENT = 5;
const DATE_RANGE_INCREMENT = 7;
const TARGET_WEIGHT_INCREMENT = 5;
const TARGET_REPS_INCREMENT = 1;

export class InsertTableModal extends BaseInsertModal {
  protected tableTypeSelect?: HTMLSelectElement;
  protected tableTypeChips: Map<string, HTMLButtonElement> = new Map();
  protected targetElements?: TargetSectionWithAutocompleteElements;
  protected limitInput?: HTMLInputElement;
  protected dateRangeInput?: HTMLInputElement;
  protected advancedElements?: AdvancedOptionsElements;
  protected targetWeightInput?: HTMLInputElement;
  protected targetRepsInput?: HTMLInputElement;
  protected progressiveSection?: HTMLElement;
  protected currentFileName: string;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
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

  protected createConfigurationSections(container: HTMLElement): void {
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

    for (const option of CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.TABLE_TYPE) {
      this.tableTypeSelect.createEl("option", {
        text: option.label,
        value: option.value,
      });
    }

    // Chips for table type selection
    const chipContainer = tableTypeSection.createDiv({
      cls: "workout-table-type-chips",
    });

    for (const option of CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.TABLE_TYPE) {
      const isDefault = (option.value as TABLE_TYPE) === TABLE_TYPE.COMBINED;
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

    // Limit with +/- adjust
    this.limitInput = this.createAdjustField(
      parametersContainer,
      t("modal.maxLogCount"),
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TABLE_LIMIT,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TABLE_LIMIT_MIN,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TABLE_LIMIT_MAX,
      LIMIT_INCREMENT,
    );

    // Date range with +/- adjust
    this.dateRangeInput = this.createAdjustField(
      parametersContainer,
      t("modal.dateRange"),
      0,
      0,
      365,
      DATE_RANGE_INCREMENT,
      "d",
    );

    // Progressive Overload Section
    this.progressiveSection = this.createSection(
      container,
      t("modal.sections.progressiveOverload"),
    );

    // Target parameters container (grid layout)
    const targetParametersContainer = this.progressiveSection.createDiv({
      cls: "workout-parameters-container",
    });

    // Target weight with +/- adjust
    this.targetWeightInput = this.createAdjustField(
      targetParametersContainer,
      getDynamicModalLabels().TARGET_WEIGHT,
      0,
      0,
      1000,
      TARGET_WEIGHT_INCREMENT,
    );

    // Target reps with +/- adjust
    this.targetRepsInput = this.createAdjustField(
      targetParametersContainer,
      t("modal.labels.targetReps"),
      0,
      0,
      100,
      TARGET_REPS_INCREMENT,
    );

    // Advanced Options Section using reusable component
    this.advancedElements = AdvancedOptionsSection.create(this, container, {
      showSearchByName: true,
      showAddButton: true,
      compact: true,
    });

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

  /**
   * Creates a field with +/- adjust buttons (same pattern as TimerConfigurationSection)
   */
  private createAdjustField(
    parent: HTMLElement,
    label: string,
    defaultValue: number,
    min: number,
    max: number,
    increment: number,
    unit?: string,
  ): HTMLInputElement {
    const fieldContainer = parent.createDiv({
      cls: "workout-field-with-adjust",
    });

    const labelText = unit ? `${label} (${unit})` : label;
    const labelEl = fieldContainer.createDiv({ cls: "workout-field-label" });
    labelEl.textContent = labelText;

    const inputContainer = fieldContainer.createDiv({
      cls: "workout-input-with-adjust",
    });

    const minusBtn = Button.create(inputContainer, {
      text: t("modal.buttons.adjustMinus") + increment,
      className: "workout-adjust-btn workout-adjust-minus",
      ariaLabel: `Decrease ${label} by ${increment}`,
      variant: "secondary",
      size: "small",
    });
    minusBtn.type = "button";

    const input = Input.create(inputContainer, {
      type: INPUT_TYPE.NUMBER,
      className: "workout-charts-input",
      min,
      max,
      step: 1,
      value: defaultValue,
    });

    const plusBtn = Button.create(inputContainer, {
      text: t("modal.buttons.adjustPlus") + increment,
      className: "workout-adjust-btn workout-adjust-plus",
      ariaLabel: `Increase ${label} by ${increment}`,
      variant: "secondary",
      size: "small",
    });
    plusBtn.type = "button";

    Button.onClick(minusBtn, () => {
      const current = parseInt(input.value) || 0;
      input.value = Math.max(min, current - increment).toString();
    });

    Button.onClick(plusBtn, () => {
      const current = parseInt(input.value) || 0;
      input.value = Math.min(max, current + increment).toString();
    });

    return input;
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
    if (
      !this.tableTypeSelect ||
      !this.targetElements ||
      !this.limitInput ||
      !this.advancedElements
    ) {
      throw new Error("Table elements not initialized");
    }

    const tableType = this.tableTypeSelect.value;
    const target = TargetSectionWithAutocomplete.getTargetValue(
      this.targetElements,
      this.tableTypeSelect,
      this.currentFileName,
    );
    const limit = parseInt(this.limitInput.value) || 50;
    const dateRange = this.dateRangeInput
      ? parseInt(this.dateRangeInput.value) || 0
      : 0;
    const showAddButton =
      this.advancedElements.addButtonToggle?.checked ?? true;
    const advancedValues = AdvancedOptionsSection.getValues(
      this.advancedElements,
    );
    const targetWeight = this.targetWeightInput
      ? parseFloat(this.targetWeightInput.value) || 0
      : 0;
    const targetReps = this.targetRepsInput
      ? parseInt(this.targetRepsInput.value) || 0
      : 0;

    // Validation for combined mode
    if ((tableType as TABLE_TYPE) === TABLE_TYPE.COMBINED) {
      if (!target.exercise || !target.workout) {
        new Notice(t("modal.notices.validationCombinedMode"));
        throw new Error(
          "Both exercise and workout are required for combined mode",
        );
      }
    }

    return CodeGenerator.generateTableCode({
      id: this.getCodeBlockId(),
      tableType: tableType as TABLE_TYPE,
      exercise: target?.exercise || "",
      workout: target?.workout || "",
      limit,
      dateRange: dateRange > 0 ? dateRange : undefined,
      showAddButton,
      searchByName: advancedValues.searchByName || false,
      exactMatch: advancedValues.exactMatch,
      targetWeight: targetWeight > 0 ? targetWeight : undefined,
      targetReps: targetReps > 0 ? targetReps : undefined,
    });
  }

  /**
   * Generates a unique ID for the code block.
   * Subclasses can override to preserve an existing ID.
   */
  protected getCodeBlockId(): string {
    return generateCodeBlockId();
  }
}

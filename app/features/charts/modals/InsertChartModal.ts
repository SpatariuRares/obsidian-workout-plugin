// Refactored InsertChartModal extending BaseInsertModal
import { CONSTANTS } from "@app/constants";
import { DomUtils } from "@app/utils/DomUtils";
import { App } from "obsidian";
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
import { CHART_DATA_TYPE, CHART_TYPE } from "@app/features/charts/types";
import {
  getAvailableChartDataTypes,
  getDefaultChartDataType,
  isValidChartDataType,
} from "@app/features/charts/config/ChartConstants";
import { ParameterUtils } from "@app/utils";
import { Chip } from "@app/components/atoms/Chip";
import { Button } from "@app/components/atoms/Button";
import { Input } from "@app/components/atoms/Input";
import { INPUT_TYPE } from "@app/types/InputTypes";
import { t } from "@app/i18n";

const DATE_RANGE_INCREMENT = 7;
const LIMIT_INCREMENT = 10;

export class InsertChartModal extends BaseInsertModal {
  private chartTypeSelect?: HTMLSelectElement;
  private chartTypeChips: Map<string, HTMLButtonElement> = new Map();
  private dataTypeSelect?: HTMLSelectElement;
  private dataTypeChips: Map<string, HTMLButtonElement> = new Map();
  private dataTypeChipContainer?: HTMLElement;
  private targetElements?: TargetSectionWithAutocompleteElements;
  private dateRangeInput?: HTMLInputElement;
  private limitInput?: HTMLInputElement;
  private trendLineToggle?: HTMLInputElement;
  private trendHeaderToggle?: HTMLInputElement;
  private statsToggle?: HTMLInputElement;
  private advancedElements?: AdvancedOptionsElements;
  private currentFileName: string;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
    this.currentFileName = this.getCurrentFileName();
  }

  protected getModalTitle(): string {
    return t("modal.titles.insertChart");
  }

  protected getButtonText(): string {
    return t("modal.buttons.insertChart");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.chartInserted");
  }

  protected createConfigurationSections(container: HTMLElement): void {
    // Chart Type Section
    const chartTypeSection = this.createSection(
      container,
      t("modal.sections.chartType"),
    );

    // Hidden select as backing store for TargetSectionWithAutocomplete
    this.chartTypeSelect = chartTypeSection.createEl("select", {
      cls: "workout-charts-select",
    });
    DomUtils.setCssProps(this.chartTypeSelect, { display: "none" });

    for (const option of CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.CHART_TYPE) {
      this.chartTypeSelect.createEl("option", {
        text: option.text,
        value: option.value,
      });
    }

    // Chips for chart type selection (workout vs exercise)
    const chartTypeChipContainer = chartTypeSection.createDiv({
      cls: "workout-table-type-chips",
    });

    for (const option of CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.CHART_TYPE) {
      const isDefault = option.value === "workout";
      const chip = Chip.create(chartTypeChipContainer, {
        text: option.text,
        selected: isDefault,
        onClick: () => this.onChartTypeChipClick(option.value),
      });
      this.chartTypeChips.set(option.value, chip);
    }

    // Set initial select value
    this.chartTypeSelect.value = "workout";

    // Data Type chips section
    const dataTypeSection = this.createSection(
      container,
      t("modal.dataType"),
    );

    // Hidden select as backing store for data type
    this.dataTypeSelect = dataTypeSection.createEl("select", {
      cls: "workout-charts-select",
    });
    DomUtils.setCssProps(this.dataTypeSelect, { display: "none" });

    for (const option of CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.DATA_TYPE) {
      this.dataTypeSelect.createEl("option", {
        text: option.text,
        value: option.value,
      });
    }

    // Chips for data type selection
    this.dataTypeChipContainer = dataTypeSection.createDiv({
      cls: "workout-table-type-chips",
    });

    this.buildDataTypeChips(
      CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.DATA_TYPE.map((o) => ({
        text: o.text,
        value: o.value,
      })),
    );

    // Target Section using reusable component with autocomplete
    if (!this.plugin) {
      throw new Error("Plugin is required for InsertChartModal");
    }

    const { elements: targetElements, handlers: targetHandlers } =
      TargetSectionWithAutocomplete.create(
        this,
        container,
        this.chartTypeSelect,
        this.currentFileName,
        this.plugin,
      );

    this.targetElements = targetElements;

    // Listen for exercise changes to update data type options
    this.targetElements.exerciseInput.addEventListener("change", () => {
      void this.updateDataTypeOptions(this.targetElements!.exerciseInput.value);
    });

    // Initial update if exercise is already populated
    if (this.targetElements.exerciseInput.value) {
      void this.updateDataTypeOptions(this.targetElements.exerciseInput.value);
    }

    // Ensure visibility is updated based on initial selection
    targetHandlers.updateVisibility();

    // Event listener for chart type change
    this.chartTypeSelect.addEventListener("change", () => {
      targetHandlers.updateVisibility();
    });

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
    this.dateRangeInput = this.createAdjustField(
      parametersContainer,
      t("modal.daysRange"),
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_DATE_RANGE,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_DATE_RANGE_MIN,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_DATE_RANGE_MAX,
      DATE_RANGE_INCREMENT,
      "d",
    );

    // Limit with +/- adjust
    this.limitInput = this.createAdjustField(
      parametersContainer,
      t("modal.dataLimit"),
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_LIMIT,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_LIMIT_MIN,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_LIMIT_MAX,
      LIMIT_INCREMENT,
    );

    // Display Options Section
    const displaySection = this.createSection(
      container,
      t("modal.sections.displayOptions"),
    );

    // Compact toggle row for display options
    const toggleRow = displaySection.createDiv({
      cls: "workout-table-options-row",
    });

    // Show trend line toggle
    const trendLineContainer = this.createCheckboxGroup(toggleRow);
    this.trendLineToggle = this.createCheckbox(
      trendLineContainer,
      t("modal.checkboxes.showTrendLine"),
      true,
      "trendLine",
    );

    // Show trend header toggle
    const trendHeaderContainer = this.createCheckboxGroup(toggleRow);
    this.trendHeaderToggle = this.createCheckbox(
      trendHeaderContainer,
      t("modal.checkboxes.showTrendHeader"),
      true,
      "trendHeader",
    );

    // Show statistics toggle
    const statsContainer = this.createCheckboxGroup(toggleRow);
    this.statsToggle = this.createCheckbox(
      statsContainer,
      t("modal.checkboxes.showStatistics"),
      true,
      "stats",
    );

    // Advanced Options Section using reusable component
    this.advancedElements = AdvancedOptionsSection.create(this, container, {
      showTitle: true,
    });

    // Set exact match default based on plugin settings
    this.advancedElements.exactMatchToggle.checked =
      this.plugin.settings.defaultExactMatch;
  }

  private onChartTypeChipClick(value: string): void {
    if (!this.chartTypeSelect) return;

    // Update chips
    for (const [chipValue, chip] of this.chartTypeChips) {
      Chip.setSelected(chip, chipValue === value);
    }

    // Update hidden select and dispatch change event
    this.chartTypeSelect.value = value;
    this.chartTypeSelect.dispatchEvent(new Event("change"));
  }

  private onDataTypeChipClick(value: string): void {
    if (!this.dataTypeSelect) return;

    // Update chips
    for (const [chipValue, chip] of this.dataTypeChips) {
      Chip.setSelected(chip, chipValue === value);
    }

    // Update hidden select
    this.dataTypeSelect.value = value;
  }

  /**
   * Builds data type chips from a list of options
   */
  private buildDataTypeChips(
    options: Array<{ text: string; value: string }>,
  ): void {
    if (!this.dataTypeChipContainer || !this.dataTypeSelect) return;

    // Clear existing chips
    this.dataTypeChipContainer.empty();
    this.dataTypeChips.clear();

    // Determine default selected value
    const currentValue = this.dataTypeSelect.value;
    const hasCurrentValue = options.some((o) => o.value === currentValue);
    const defaultValue = hasCurrentValue
      ? currentValue
      : options[0]?.value || "";

    for (const option of options) {
      const isSelected = option.value === defaultValue;
      const chip = Chip.create(this.dataTypeChipContainer, {
        text: option.text,
        selected: isSelected,
        onClick: () => this.onDataTypeChipClick(option.value),
      });
      this.dataTypeChips.set(option.value, chip);
    }

    // Update hidden select value
    if (defaultValue) {
      this.dataTypeSelect.value = defaultValue;
    }
  }

  /**
   * Creates a field with +/- adjust buttons (same pattern as InsertTableModal)
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

  protected generateCode(): string {
    if (
      !this.chartTypeSelect ||
      !this.dataTypeSelect ||
      !this.targetElements ||
      !this.dateRangeInput ||
      !this.limitInput ||
      !this.trendLineToggle ||
      !this.trendHeaderToggle ||
      !this.statsToggle ||
      !this.advancedElements
    ) {
      throw new Error("Chart elements not initialized");
    }

    const chartType = this.chartTypeSelect.value;
    const dataType = this.dataTypeSelect.value;
    const target = TargetSectionWithAutocomplete.getTargetValue(
      this.targetElements,
      this.chartTypeSelect,
      this.currentFileName,
    );
    const dateRange = parseInt(this.dateRangeInput.value) || 30;
    const limit = parseInt(this.limitInput.value) || 50;
    const showTrendLine = this.trendLineToggle.checked;
    const showTrend = this.trendHeaderToggle.checked;
    const showStats = this.statsToggle.checked;
    const advancedValues = AdvancedOptionsSection.getValues(
      this.advancedElements,
    );

    return CodeGenerator.generateChartCode({
      type: dataType as CHART_DATA_TYPE,
      chartType: chartType as CHART_TYPE,
      exercise: target.exercise || "",
      workout: target.workout || "",
      dateRange,
      limit,
      showTrendLine,
      showTrend,
      showStats,
      exactMatch: advancedValues.exactMatch,
      title: advancedValues.title || "",
    });
  }

  /**
   * Updates the data type options based on the selected exercise
   */
  private async updateDataTypeOptions(exerciseName: string): Promise<void> {
    if (!this.dataTypeSelect || !this.plugin) return;

    // If no exercise selected, reset to standard options
    if (!exerciseName) {
      // Rebuild standard options
      this.dataTypeSelect.empty();
      const standardOptions =
        CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.DATA_TYPE.map((opt) => ({
          text: opt.text,
          value: opt.value,
        }));
      standardOptions.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.text = opt.text;
        this.dataTypeSelect?.appendChild(option);
      });
      this.buildDataTypeChips(standardOptions);
      return;
    }

    const service = this.plugin.getExerciseDefinitionService();
    const definition = await service.getExerciseDefinition(exerciseName);

    // Default to strength if no definition found
    const typeId = definition?.typeId || "strength";
    // Use ParameterUtils to extract numeric parameter keys
    const customParams = definition?.customParameters
      ? ParameterUtils.getNumericParamKeys(definition.customParameters)
      : undefined;

    const availableTypes = getAvailableChartDataTypes(typeId, customParams);

    // Clear existing options
    this.dataTypeSelect.empty();

    // Build new options
    const newOptions: Array<{ text: string; value: string }> = [];

    availableTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;

      // Determine display text using ParameterUtils
      let displayText: string;
      const customParam = definition?.customParameters?.find(
        (p) => p.key === type,
      );
      if (customParam) {
        displayText = ParameterUtils.formatParamWithUnit(customParam);
      } else {
        displayText = ParameterUtils.formatKeyWithUnit(type);
      }

      option.text = displayText;
      this.dataTypeSelect?.appendChild(option);
      newOptions.push({ text: displayText, value: type });
    });

    // Update selected value to default if current is invalid
    const currentVal = this.dataTypeSelect.value;
    if (!isValidChartDataType(typeId, currentVal, customParams)) {
      this.dataTypeSelect.value = getDefaultChartDataType(typeId, customParams);
    }

    // Rebuild data type chips
    this.buildDataTypeChips(newOptions);
  }
}

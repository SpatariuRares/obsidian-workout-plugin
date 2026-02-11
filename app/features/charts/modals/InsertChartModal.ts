// Refactored InsertChartModal extending BaseInsertModal
import { CONSTANTS } from "@app/constants";
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

export class InsertChartModal extends BaseInsertModal {
  private chartTypeSelect?: HTMLSelectElement;
  private dataTypeSelect?: HTMLSelectElement;
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
    return CONSTANTS.WORKOUT.MODAL.TITLES.INSERT_CHART;
  }

  protected getButtonText(): string {
    return CONSTANTS.WORKOUT.MODAL.BUTTONS.INSERT_CHART;
  }

  protected getSuccessMessage(): string {
    return CONSTANTS.WORKOUT.MODAL.NOTICES.CHART_INSERTED;
  }

  protected createConfigurationSections(container: HTMLElement): void {
    // Chart Type Section
    const chartTypeSection = this.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.CHART_TYPE,
    );

    // Chart Type selector (exercise vs workout)
    this.chartTypeSelect = this.createSelectField(
      chartTypeSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.CHART_TYPE,
      [...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.CHART_TYPE],
    );

    // Data Type selector (volume, weight, reps)
    this.dataTypeSelect = this.createSelectField(
      chartTypeSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.DATA_TYPE,
      [...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.DATA_TYPE],
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

    // Configuration Section
    const configSection = this.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.CONFIGURATION,
    );

    // Date range selector
    this.dateRangeInput = this.createNumberField(
      configSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.DAYS_RANGE,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_DATE_RANGE,
      {
        min: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_DATE_RANGE_MIN,
        max: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_DATE_RANGE_MAX,
      },
    );

    // Limit selector
    this.limitInput = this.createNumberField(
      configSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.DATA_LIMIT,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_LIMIT,
      {
        min: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_LIMIT_MIN,
        max: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_LIMIT_MAX,
      },
    );

    // Display Options Section
    const displaySection = this.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.DISPLAY_OPTIONS,
    );

    // Show trend line toggle
    this.trendLineToggle = this.createCheckboxField(
      displaySection,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SHOW_TREND_LINE,
      true,
      "trendLine",
    );

    // Show trend header toggle
    this.trendHeaderToggle = this.createCheckboxField(
      displaySection,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SHOW_TREND_HEADER,
      true,
      "trendHeader",
    );

    // Show statistics toggle
    this.statsToggle = this.createCheckboxField(
      displaySection,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SHOW_STATISTICS,
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

    // If no exercise selected, reset to default (or maybe standard types?)
    if (!exerciseName) {
      // Keep existing options or reset to standard?
      // For now, let's just return to avoid clearing useful defaults if user is typing
      // But if they clear the input, we might want to reset.
      // Let's reload standard options if empty
      this.dataTypeSelect.empty();
      CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.DATA_TYPE.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.text = opt.text;
        this.dataTypeSelect?.appendChild(option);
      });
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

    // Add new options
    availableTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;

      // Determine display text using ParameterUtils
      let displayText: string;

      // First check if it's a custom parameter from the exercise definition
      const customParam = definition?.customParameters?.find((p) => p.key === type);
      if (customParam) {
        // Use ParameterUtils to format custom parameter with unit
        displayText = ParameterUtils.formatParamWithUnit(customParam);
      } else {
        // Use ParameterUtils to format standard types with their default units
        displayText = ParameterUtils.formatKeyWithUnit(type);
      }

      option.text = displayText;
      this.dataTypeSelect?.appendChild(option);
    });

    // Update selected value to default if current is invalid
    const currentVal = this.dataTypeSelect.value;
    if (!isValidChartDataType(typeId, currentVal, customParams)) {
      this.dataTypeSelect.value = getDefaultChartDataType(typeId, customParams);
    }
  }
}

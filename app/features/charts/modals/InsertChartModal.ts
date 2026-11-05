// Refactored InsertChartModal extending BaseInsertModal

import { AdjustField } from "@app/components/molecules/AdjustField";
import { getYAxisLabel } from "@app/features/charts/config/ChartConstants";
import { App } from "obsidian";
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
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { chartBlock } from "@app/features/charts/chartBlock";
import {
  CHART_DATA_TYPE,
  CHART_TYPE,
  type EmbeddedChartParams,
} from "@app/features/charts/types";
import {
  getAvailableChartDataTypes,
  getDefaultChartDataType,
  isValidChartDataType,
} from "@app/features/charts/config/ChartConstants";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import {
  ChipGroup,
  type ChipGroupResult,
  type ChipOption,
} from "@app/components/molecules/ChipGroup";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";

const DATE_RANGE_INCREMENT = 7;
const LIMIT_INCREMENT = 10;

export class InsertChartModal extends BaseInsertModal {
  protected chartType?: ChipGroupResult<CHART_TYPE>;
  protected dataType?: ChipGroupResult;
  protected targetElements?: TargetSectionWithAutocompleteElements;
  private targetHandlers?: TargetSectionWithAutocompleteHandlers;
  protected dateRangeInput?: HTMLInputElement;
  protected limitInput?: HTMLInputElement;
  protected trendLineToggle?: HTMLInputElement;
  protected trendHeaderToggle?: HTMLInputElement;
  protected statsToggle?: HTMLInputElement;
  protected advancedElements?: AdvancedOptionsElements;
  private currentFileName: string;

  constructor(app: App, plugin: WorkoutPluginContext) {
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

  protected createConfigurationSections(
    container: HTMLElement,
  ): void {
    // Chart Type Section
    const chartTypeSection = this.createSection(
      container,
      t("modal.sections.chartType"),
    );

    this.chartType = ChipGroup.create<CHART_TYPE>(chartTypeSection, {
      label: t("modal.sections.chartType"),
      labelHidden: true,
      options: CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.CHART_TYPE.map(
        (option) => ({ id: option.value, label: option.label }),
      ),
      selected: CHART_TYPE.WORKOUT,
      className: "workout-modal-type-chips",
      onPick: () => this.targetHandlers?.updateVisibility(),
    });

    // Data Type chips section
    const dataTypeSection = this.createSection(
      container,
      t("modal.dataType"),
    );
    this.dataType = ChipGroup.create(dataTypeSection, {
      label: t("modal.dataType"),
      labelHidden: true,
      options: InsertChartModal.standardDataTypes(),
      selected: CHART_DATA_TYPE.VOLUME,
      className: "workout-modal-type-chips",
    });

    // Target Section using reusable component with autocomplete
    if (!this.plugin) {
      throw new Error("Plugin is required for InsertChartModal");
    }

    const chartType = this.chartType;
    const { elements: targetElements, handlers } =
      TargetSectionWithAutocomplete.create(
        this,
        container,
        () => chartType.value(),
        this.currentFileName,
        this.plugin,
      );
    this.targetHandlers = handlers;

    this.targetElements = targetElements;

    // Listen for exercise changes to update data type options
    this.targetElements.exerciseInput.addEventListener(
      "change",
      () => {
        void this.updateDataTypeOptions(
          this.targetElements!.exerciseInput.value,
        );
      },
    );

    // Initial update if exercise is already populated
    if (this.targetElements.exerciseInput.value) {
      void this.updateDataTypeOptions(
        this.targetElements.exerciseInput.value,
      );
    }

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
      label: t("modal.daysRange"),
      value: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_DATE_RANGE,
      min: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_DATE_RANGE_MIN,
      max: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_DATE_RANGE_MAX,
      step: DATE_RANGE_INCREMENT,
    });

    // Limit with +/- adjust
    this.limitInput = AdjustField.create(parametersContainer, {
      label: t("modal.dataLimit"),
      value: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_LIMIT,
      min: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_LIMIT_MIN,
      max: CONSTANTS.WORKOUT.MODAL.DEFAULTS.CHART_LIMIT_MAX,
      step: LIMIT_INCREMENT,
    });

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
    this.advancedElements = AdvancedOptionsSection.create(
      this,
      container,
      {
        showTitle: true,
      },
    );

    // Set exact match default based on plugin settings
    this.advancedElements.exactMatchToggle.checked =
      this.plugin.settings.defaultExactMatch;
  }

  /** The data types of an exercise without a definition */
  private static standardDataTypes(): ChipOption[] {
    return CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.DATA_TYPE.map((o) => ({
      id: o.value,
      label: o.text,
    }));
  }

  protected generateCode(): string {
    return chartBlock.serialize({ id: generateCodeBlockId(), ...this.collectParams() });
  }

  /** The form as block parameters */
  protected collectParams(): EmbeddedChartParams {
    if (
      !this.chartType ||
      !this.dataType ||
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

    const chartType = this.chartType.value();
    const dataType = this.dataType.value();
    const target = TargetSectionWithAutocomplete.getTargetValue(
      this.targetElements,
      chartType,
      this.currentFileName,
    );
    const dateRange = parseInt(this.dateRangeInput.value) || 0;
    const limit = parseInt(this.limitInput.value) || 0;
    const showTrendLine = this.trendLineToggle.checked;
    const showTrend = this.trendHeaderToggle.checked;
    const showStats = this.statsToggle.checked;
    const advancedValues = AdvancedOptionsSection.getValues(
      this.advancedElements,
    );

    return {
      chartType: chartType as EmbeddedChartParams["chartType"],
      type: dataType as CHART_DATA_TYPE,
      exercise: target.exercise || undefined,
      workout: target.workout || undefined,
      dateRange: dateRange > 0 ? dateRange : undefined,
      limit: limit > 0 ? limit : undefined,
      showTrendLine,
      showTrend,
      showStats,
      exactMatch: advancedValues.exactMatch ? true : undefined,
      title: advancedValues.title || undefined,
    };
  }

  /**
   * Updates the data type options based on the selected exercise
   */
  protected async updateDataTypeOptions(
    exerciseName: string,
  ): Promise<void> {
    if (!this.dataType || !this.plugin) return;

    // No exercise: the standard options
    if (!exerciseName) {
      this.dataType.setOptions(InsertChartModal.standardDataTypes());
      return;
    }

    const service = this.plugin.getExerciseDefinitionService();
    const definition =
      await service.getExerciseDefinition(exerciseName);

    // Default to strength if no definition found
    const typeId = definition?.typeId || "strength";
    // Use ParameterUtils to extract numeric parameter keys
    const customParams = definition?.customParameters
      ? ParameterUtils.getNumericParamKeys(
          definition.customParameters,
        )
      : undefined;

    const options = getAvailableChartDataTypes(typeId, customParams).map(
      (type): ChipOption => {
        const customParam = definition?.customParameters?.find(
          (p) => p.key === type,
        );
        const label = customParam
          ? ParameterUtils.formatParamWithUnit(customParam)
          : type === "e1rm"
            ? getYAxisLabel(type)
            : ParameterUtils.formatKeyWithUnit(type);
        return { id: type, label };
      },
    );

    // The current type stays when valid, else the exercise's default
    const current = this.dataType.value();
    this.dataType.setOptions(
      options,
      isValidChartDataType(typeId, current, customParams)
        ? current
        : getDefaultChartDataType(typeId, customParams),
    );
  }
}

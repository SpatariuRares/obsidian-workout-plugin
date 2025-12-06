// Refactored InsertChartModal extending BaseInsertModal
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
import {
  MODAL_TITLES,
  MODAL_BUTTONS,
  MODAL_LABELS,
  MODAL_SELECT_OPTIONS,
  MODAL_SECTIONS,
  MODAL_CHECKBOXES,
  MODAL_NOTICES,
  MODAL_DEFAULT_VALUES,
} from "@app/constants/ModalConstants";
import { CHART_DATA_TYPE, CHART_TYPE } from "@app/types/ChartTypes";

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
    return MODAL_TITLES.INSERT_CHART;
  }

  protected getButtonText(): string {
    return MODAL_BUTTONS.INSERT_CHART;
  }

  protected getSuccessMessage(): string {
    return MODAL_NOTICES.CHART_INSERTED;
  }

  protected createConfigurationSections(container: HTMLElement): void {
    // Chart Type Section
    const chartTypeSection = this.createSection(
      container,
      MODAL_SECTIONS.CHART_TYPE
    );

    // Chart Type selector (exercise vs workout)
    this.chartTypeSelect = this.createSelectField(
      chartTypeSection,
      MODAL_LABELS.CHART_TYPE,
      [...MODAL_SELECT_OPTIONS.CHART_TYPE]
    );

    // Data Type selector (volume, weight, reps)
    this.dataTypeSelect = this.createSelectField(
      chartTypeSection,
      MODAL_LABELS.DATA_TYPE,
      [...MODAL_SELECT_OPTIONS.DATA_TYPE]
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
        this.plugin
      );

    this.targetElements = targetElements;

    // Ensure visibility is updated based on initial selection
    targetHandlers.updateVisibility();

    // Configuration Section
    const configSection = this.createSection(
      container,
      MODAL_SECTIONS.CONFIGURATION
    );

    // Date range selector
    this.dateRangeInput = this.createNumberField(
      configSection,
      MODAL_LABELS.DAYS_RANGE,
      MODAL_DEFAULT_VALUES.CHART_DATE_RANGE,
      {
        min: MODAL_DEFAULT_VALUES.CHART_DATE_RANGE_MIN,
        max: MODAL_DEFAULT_VALUES.CHART_DATE_RANGE_MAX,
      }
    );

    // Limit selector
    this.limitInput = this.createNumberField(
      configSection,
      MODAL_LABELS.DATA_LIMIT,
      MODAL_DEFAULT_VALUES.CHART_LIMIT,
      {
        min: MODAL_DEFAULT_VALUES.CHART_LIMIT_MIN,
        max: MODAL_DEFAULT_VALUES.CHART_LIMIT_MAX,
      }
    );

    // Display Options Section
    const displaySection = this.createSection(
      container,
      MODAL_SECTIONS.DISPLAY_OPTIONS
    );

    // Show trend line toggle
    this.trendLineToggle = this.createCheckboxField(
      displaySection,
      MODAL_CHECKBOXES.SHOW_TREND_LINE,
      true,
      "trendLine"
    );

    // Show trend header toggle
    this.trendHeaderToggle = this.createCheckboxField(
      displaySection,
      MODAL_CHECKBOXES.SHOW_TREND_HEADER,
      true,
      "trendHeader"
    );

    // Show statistics toggle
    this.statsToggle = this.createCheckboxField(
      displaySection,
      MODAL_CHECKBOXES.SHOW_STATISTICS,
      true,
      "stats"
    );

    // Advanced Options Section using reusable component
    this.advancedElements = AdvancedOptionsSection.create(this, container, {
      showTitle: true,
    });

    // Set exact match default
    this.advancedElements.exactMatchToggle.checked = true;
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
      this.currentFileName
    );
    const dateRange = parseInt(this.dateRangeInput.value) || 30;
    const limit = parseInt(this.limitInput.value) || 50;
    const showTrendLine = this.trendLineToggle.checked;
    const showTrend = this.trendHeaderToggle.checked;
    const showStats = this.statsToggle.checked;
    const advancedValues = AdvancedOptionsSection.getValues(
      this.advancedElements
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
}

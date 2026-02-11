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

export class InsertTableModal extends BaseInsertModal {
  private tableTypeSelect?: HTMLSelectElement;
  private targetElements?: TargetSectionWithAutocompleteElements;
  private limitInput?: HTMLInputElement;
  private dateRangeInput?: HTMLInputElement;
  private addButtonToggle?: HTMLInputElement;
  private buttonTextInput?: HTMLInputElement;
  private advancedElements?: AdvancedOptionsElements;
  private targetWeightInput?: HTMLInputElement;
  private targetRepsInput?: HTMLInputElement;
  private progressiveSection?: HTMLElement;
  private currentFileName: string;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
    this.currentFileName = this.getCurrentFileName();
  }

  protected getModalTitle(): string {
    return CONSTANTS.WORKOUT.MODAL.TITLES.INSERT_TABLE;
  }

  protected getButtonText(): string {
    return CONSTANTS.WORKOUT.MODAL.BUTTONS.INSERT_TABLE;
  }

  protected getSuccessMessage(): string {
    return CONSTANTS.WORKOUT.MODAL.NOTICES.TABLE_INSERTED;
  }

  protected createConfigurationSections(container: HTMLElement): void {
    // Table Type Section
    const tableTypeSection = this.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.TABLE_TYPE,
    );

    // Table Type selector (exercise vs workout)
    this.tableTypeSelect = this.createSelectField(
      tableTypeSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.TABLE_TYPE,
      [...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.TABLE_TYPE],
    );

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
      CONSTANTS.WORKOUT.MODAL.SECTIONS.CONFIGURATION,
    );

    // Limit selector
    this.limitInput = this.createNumberField(
      configSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.MAX_LOG_COUNT,
      CONSTANTS.WORKOUT.MODAL.DEFAULTS.TABLE_LIMIT,
      {
        min: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TABLE_LIMIT_MIN,
        max: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TABLE_LIMIT_MAX,
      },
    );

    // Date range selector
    this.dateRangeInput = this.createNumberField(
      configSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.DATE_RANGE,
      0,
      {
        min: 0,
        max: 365,
        placeholder: "0 = all time",
      },
    );

    // Progressive Overload Section
    this.progressiveSection = this.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.PROGRESSIVE_OVERLOAD,
    );

    // Target weight input
    this.targetWeightInput = this.createNumberField(
      this.progressiveSection,
      getDynamicModalLabels().TARGET_WEIGHT,
      0,
      {
        min: 0,
        max: 1000,
        placeholder: "0 = no target",
      },
    );

    // Target reps input
    this.targetRepsInput = this.createNumberField(
      this.progressiveSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.TARGET_REPS,
      0,
      {
        min: 0,
        max: 100,
        placeholder: "0 = no target",
      },
    );

    // Advanced Options Section using reusable component
    this.advancedElements = AdvancedOptionsSection.create(this, container, {
      showSearchByName: true,
      showAddButton: true,
    });

    // Set default values based on plugin settings
    this.advancedElements.exactMatchToggle.checked =
      this.plugin.settings.defaultExactMatch;
  }

  private updateSectionsVisibility(targetHandlers: {
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
      !this.addButtonToggle ||
      !this.buttonTextInput ||
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
    const showAddButton = this.addButtonToggle.checked;
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
        new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.VALIDATION_COMBINED_MODE);
        throw new Error(
          "Both exercise and workout are required for combined mode",
        );
      }
    }

    return CodeGenerator.generateTableCode({
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
}

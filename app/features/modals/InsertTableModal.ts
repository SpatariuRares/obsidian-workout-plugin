// Refactored InsertTableModal extending BaseInsertModal
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
import { TABLE_DEFAULTS } from "@app/constants/TableConstats";
import { TableColumnType, TABLE_TYPE } from "@app/types/TableTypes";

export class InsertTableModal extends BaseInsertModal {
  private tableTypeSelect?: HTMLSelectElement;
  private targetElements?: TargetSectionWithAutocompleteElements;
  private limitInput?: HTMLInputElement;
  private columnsSelect?: HTMLSelectElement;
  private addButtonToggle?: HTMLInputElement;
  private buttonTextInput?: HTMLInputElement;
  private advancedElements?: AdvancedOptionsElements;
  private currentFileName: string;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
    this.currentFileName = this.getCurrentFileName();
  }

  protected getModalTitle(): string {
    return MODAL_TITLES.INSERT_TABLE;
  }

  protected getButtonText(): string {
    return MODAL_BUTTONS.INSERT_TABLE;
  }

  protected getSuccessMessage(): string {
    return MODAL_NOTICES.TABLE_INSERTED;
  }

  protected createConfigurationSections(container: HTMLElement): void {
    // Table Type Section
    const tableTypeSection = this.createSection(
      container,
      MODAL_SECTIONS.TABLE_TYPE
    );

    // Table Type selector (exercise vs workout)
    this.tableTypeSelect = this.createSelectField(
      tableTypeSection,
      MODAL_LABELS.TABLE_TYPE,
      [...MODAL_SELECT_OPTIONS.TABLE_TYPE]
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
        this.plugin
      );

    this.targetElements = targetElements;

    // Ensure visibility is updated based on initial selection
    targetHandlers.updateVisibility();

    // Additional check to ensure workout field is visible for combined mode
    setTimeout(() => {
      if (this.tableTypeSelect && (this.tableTypeSelect.value as TABLE_TYPE) === TABLE_TYPE.COMBINED) {
        const workoutField = container.querySelector(
          '[data-field-type=TEXT_CONSTANTS.COMMON.TYPES.WORKOUT]'
        ) as HTMLElement;
        const currentWorkoutField = container.querySelector(
          '[data-field-type="current-workout"]'
        ) as HTMLElement;
        const fileInfoField = container.querySelector(
          '[data-field-type="file-info"]'
        ) as HTMLElement;

        if (workoutField) {
          workoutField.classList.add("workout-modal-field-visible");
          workoutField.classList.remove("workout-modal-field-hidden");
        }

        if (currentWorkoutField) {
          currentWorkoutField.classList.add("workout-modal-field-visible");
          currentWorkoutField.classList.remove("workout-modal-field-hidden");
        }

        if (fileInfoField) {
          fileInfoField.classList.add("workout-modal-field-visible");
          fileInfoField.classList.remove("workout-modal-field-hidden");
        }
      }
    }, 200);

    // Configuration Section
    const configSection = this.createSection(
      container,
      MODAL_SECTIONS.CONFIGURATION
    );

    // Limit selector
    this.limitInput = this.createNumberField(
      configSection,
      MODAL_LABELS.MAX_LOG_COUNT,
      MODAL_DEFAULT_VALUES.TABLE_LIMIT,
      {
        min: MODAL_DEFAULT_VALUES.TABLE_LIMIT_MIN,
        max: MODAL_DEFAULT_VALUES.TABLE_LIMIT_MAX,
      }
    );

    // Columns selector
    this.columnsSelect = this.createSelectField(
      configSection,
      MODAL_LABELS.TABLE_COLUMNS,
      [...MODAL_SELECT_OPTIONS.TABLE_COLUMNS]
    );

    // Display Options Section
    const displaySection = this.createSection(
      container,
      MODAL_SECTIONS.DISPLAY_OPTIONS
    );

    // Show add button toggle
    this.addButtonToggle = this.createCheckboxField(
      displaySection,
      MODAL_CHECKBOXES.SHOW_ADD_BUTTON,
      true,
      "showAddButton"
    );

    // Custom button text
    this.buttonTextInput = this.createTextField(
      displaySection,
      MODAL_LABELS.BUTTON_TEXT,
      TABLE_DEFAULTS.BUTTON_TEXT,
      TABLE_DEFAULTS.BUTTON_TEXT
    );

    // Advanced Options Section using reusable component
    this.advancedElements = AdvancedOptionsSection.create(this, container, {
      showSearchByName: true,
    });

    // Set default values for combined mode
    this.advancedElements.exactMatchToggle.checked = true;
  }

  protected generateCode(): string {
    if (
      !this.tableTypeSelect ||
      !this.targetElements ||
      !this.limitInput ||
      !this.columnsSelect ||
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
      this.currentFileName
    );
    const limit = parseInt(this.limitInput.value) || 50;
    const columnsType = this.columnsSelect.value;
    const showAddButton = this.addButtonToggle.checked;
    const buttonText = this.buttonTextInput.value.trim();
    const advancedValues = AdvancedOptionsSection.getValues(
      this.advancedElements
    );

    // Validation for combined mode
    if ((tableType as TABLE_TYPE) === TABLE_TYPE.COMBINED) {
      if (!target.exercise || !target.workout) {
        new Notice(MODAL_NOTICES.VALIDATION_COMBINED_MODE);
        throw new Error(
          "Both exercise and workout are required for combined mode"
        );
      }
    }

    return CodeGenerator.generateTableCode({
      tableType: tableType as TABLE_TYPE,
      exercise: target.exercise || "",
      workout: target.workout || "",
      limit,
      columnsType: columnsType as TableColumnType,
      showAddButton,
      buttonText,
      searchByName: advancedValues.searchByName || false,
      exactMatch: advancedValues.exactMatch,
    });
  }
}

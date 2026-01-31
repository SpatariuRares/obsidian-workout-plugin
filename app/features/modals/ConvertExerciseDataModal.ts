/**
 * Modal for converting exercise data from one type to another.
 *
 * This modal allows users to convert all logged data for an exercise
 * from one exercise type to another (e.g., strength → timed).
 * It handles field mapping (e.g., reps → duration) and optionally
 * updates the exercise type in the exercise file frontmatter.
 */
import { App, Notice } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import {
  ExerciseAutocomplete,
  ExerciseAutocompleteElements,
} from "@app/features/modals/components/ExerciseAutocomplete";
import {
  BUILT_IN_EXERCISE_TYPES,
  getExerciseTypeById,
  EXERCISE_TYPE_IDS,
} from "@app/constants/exerciseTypes.constants";
import type { ExerciseTypeDefinition } from "@app/types/ExerciseTypes";
import type { CSVWorkoutLogEntry } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";

/**
 * Field mapping configuration for data conversion
 */
interface FieldMapping {
  fromField: string;
  toField: string;
  fromLabel: string;
  toLabel: string;
}

/**
 * Modal UI labels specific to conversion
 */
const CONVERT_UI = {
  TITLE: "Convert exercise data",
  SECTIONS: {
    EXERCISE: "Exercise",
    CONVERSION: "Conversion",
    FIELD_MAPPING: "Field mapping",
    PREVIEW: "Preview",
  },
  LABELS: {
    SELECT_EXERCISE: "Select exercise:",
    CURRENT_TYPE: "Current type:",
    TARGET_TYPE: "Convert to:",
    FROM_FIELD: "From:",
    TO_FIELD: "To:",
    UPDATE_FRONTMATTER: "Update exercise file type",
    ENTRIES_FOUND: (count: number) =>
      `${count} log ${count === 1 ? "entry" : "entries"} will be converted`,
    NO_ENTRIES: "No log entries found for this exercise",
  },
  BUTTONS: {
    CONVERT: "Convert",
    CANCEL: "Cancel",
    ADD_MAPPING: "Add field mapping",
  },
  NOTICES: {
    CONVERSION_SUCCESS: (count: number) =>
      `Successfully converted ${count} log ${count === 1 ? "entry" : "entries"}`,
    CONVERSION_ERROR: "Error converting exercise data: ",
    SELECT_EXERCISE: "Please select an exercise",
    SELECT_TYPE: "Please select a target type",
    ADD_MAPPING: "Please add at least one field mapping",
    SAME_TYPE: "Source and target types are the same",
  },
  PLACEHOLDERS: {
    EXERCISE: "Start typing to select exercise...",
  },
} as const;

export class ConvertExerciseDataModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;

  // Form state
  private selectedExercise: string = "";
  private currentType: ExerciseTypeDefinition | null = null;
  private targetType: string = "";
  private fieldMappings: FieldMapping[] = [];
  private updateFrontmatter: boolean = true;
  private exerciseEntryCount: number = 0;

  // UI elements
  private exerciseElements: ExerciseAutocompleteElements | null = null;
  private currentTypeDisplay: HTMLElement | null = null;
  private targetTypeSelect: HTMLSelectElement | null = null;
  private fieldMappingContainer: HTMLElement | null = null;
  private previewContainer: HTMLElement | null = null;
  private convertButton: HTMLButtonElement | null = null;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-charts-modal");

    // Title
    contentEl.createEl("h2", { text: CONVERT_UI.TITLE });

    // Main container
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Exercise section
    await this.createExerciseSection(mainContainer);

    // Conversion section (hidden until exercise selected)
    this.createConversionSection(mainContainer);

    // Field mapping section (hidden until types selected)
    this.createFieldMappingSection(mainContainer);

    // Preview section
    this.createPreviewSection(mainContainer);

    // Buttons
    this.createButtons(mainContainer);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Creates the exercise selection section with autocomplete
   */
  private async createExerciseSection(parent: HTMLElement): Promise<void> {
    const section = this.createSection(parent, CONVERT_UI.SECTIONS.EXERCISE);

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      this,
      section,
      this.plugin,
      this.selectedExercise,
    );

    // Store reference and setup change handler
    this.exerciseElements = exerciseElements;

    // Listen for exercise selection changes
    exerciseElements.exerciseInput.addEventListener("change", async () => {
      this.selectedExercise = exerciseElements.exerciseInput.value.trim();
      await this.handleExerciseChange();
    });

    // Also handle input blur to catch manual entries
    exerciseElements.exerciseInput.addEventListener("blur", async () => {
      const newValue = exerciseElements.exerciseInput.value.trim();
      if (newValue && newValue !== this.selectedExercise) {
        this.selectedExercise = newValue;
        await this.handleExerciseChange();
      }
    });

    // Current type display
    const typeGroup = this.createFormGroup(section);
    typeGroup.createEl("label", { text: CONVERT_UI.LABELS.CURRENT_TYPE });
    this.currentTypeDisplay = typeGroup.createEl("span", {
      cls: "workout-convert-current-type",
      text: "—",
    });
  }

  /**
   * Creates the conversion type selection section
   */
  private createConversionSection(parent: HTMLElement): void {
    const section = this.createSection(parent, CONVERT_UI.SECTIONS.CONVERSION);
    section.addClass("workout-convert-section-hidden");
    section.id = "conversion-section";

    // Target type dropdown
    const options = BUILT_IN_EXERCISE_TYPES.map((type) => ({
      text: type.name,
      value: type.id,
    }));

    this.targetTypeSelect = this.createSelectField(
      section,
      CONVERT_UI.LABELS.TARGET_TYPE,
      options
    );
    this.targetTypeSelect.addEventListener("change", () => {
      this.targetType = this.targetTypeSelect!.value;
      this.handleTargetTypeChange();
    });

    // Update frontmatter checkbox
    const checkboxGroup = this.createCheckboxGroup(section);
    const checkbox = this.createCheckbox(
      checkboxGroup,
      CONVERT_UI.LABELS.UPDATE_FRONTMATTER,
      true,
      "update-frontmatter"
    );
    checkbox.addEventListener("change", () => {
      this.updateFrontmatter = checkbox.checked;
    });
  }

  /**
   * Creates the field mapping section
   */
  private createFieldMappingSection(parent: HTMLElement): void {
    const section = this.createSection(parent, CONVERT_UI.SECTIONS.FIELD_MAPPING);
    section.addClass("workout-convert-section-hidden");
    section.id = "field-mapping-section";

    this.fieldMappingContainer = section.createEl("div", {
      cls: "workout-convert-mappings",
    });

    // Add mapping button
    const addButton = section.createEl("button", {
      text: CONVERT_UI.BUTTONS.ADD_MAPPING,
      cls: "mod-muted",
    });
    addButton.addEventListener("click", () => {
      this.addFieldMappingRow();
    });
  }

  /**
   * Creates the preview section
   */
  private createPreviewSection(parent: HTMLElement): void {
    const section = this.createSection(parent, CONVERT_UI.SECTIONS.PREVIEW);
    section.addClass("workout-convert-section-hidden");
    section.id = "preview-section";

    this.previewContainer = section.createEl("div", {
      cls: "workout-convert-preview",
    });
  }

  /**
   * Creates the action buttons
   */
  private createButtons(parent: HTMLElement): void {
    const buttonsSection = this.createButtonsSection(parent);

    // Cancel button
    const cancelButton = buttonsSection.createEl("button", {
      text: CONVERT_UI.BUTTONS.CANCEL,
    });
    cancelButton.addEventListener("click", () => this.close());

    // Convert button
    this.convertButton = buttonsSection.createEl("button", {
      text: CONVERT_UI.BUTTONS.CONVERT,
      cls: "mod-cta",
    });
    this.convertButton.disabled = true;
    this.convertButton.addEventListener("click", async () => {
      await this.handleConvert();
    });
  }

  /**
   * Handles exercise selection change
   */
  private async handleExerciseChange(): Promise<void> {
    if (!this.selectedExercise) {
      this.hideAllSections();
      return;
    }

    // Get current exercise type from definition service
    const exerciseDefService = this.plugin.getExerciseDefinitionService();
    const definition = await exerciseDefService.getExerciseDefinition(
      this.selectedExercise
    );
    const typeId = definition?.typeId || EXERCISE_TYPE_IDS.STRENGTH;
    this.currentType = getExerciseTypeById(typeId) || getExerciseTypeById(EXERCISE_TYPE_IDS.STRENGTH)!;

    // Update display
    if (this.currentTypeDisplay) {
      this.currentTypeDisplay.textContent = this.currentType?.name || "Unknown";
    }

    // Get entry count for this exercise
    const logData = await this.plugin.getWorkoutLogData({
      exercise: this.selectedExercise,
      exactMatch: true,
    });
    this.exerciseEntryCount = logData.length;

    // Show conversion section
    const conversionSection = this.contentEl.querySelector("#conversion-section");
    if (conversionSection) {
      conversionSection.removeClass("workout-convert-section-hidden");
    }

    // Reset target type to a different type than current
    if (this.targetTypeSelect) {
      // Find first type that's different from current
      const defaultTarget = BUILT_IN_EXERCISE_TYPES.find(
        (t) => t.id !== this.currentType?.id
      );
      if (defaultTarget) {
        this.targetTypeSelect.value = defaultTarget.id;
        this.targetType = defaultTarget.id;
      }
    }

    this.handleTargetTypeChange();
  }

  /**
   * Handles target type change
   */
  private handleTargetTypeChange(): void {
    if (!this.currentType || !this.targetType) {
      return;
    }

    // Show field mapping section
    const mappingSection = this.contentEl.querySelector("#field-mapping-section");
    if (mappingSection) {
      mappingSection.removeClass("workout-convert-section-hidden");
    }

    // Clear existing mappings
    this.fieldMappings = [];
    if (this.fieldMappingContainer) {
      this.fieldMappingContainer.empty();
    }

    // Auto-suggest initial mapping based on type conversion
    this.suggestInitialMappings();

    // Update preview
    this.updatePreview();
  }

  /**
   * Suggests initial field mappings based on source and target types
   */
  private suggestInitialMappings(): void {
    const sourceType = this.currentType;
    const targetTypeDef = getExerciseTypeById(this.targetType);

    if (!sourceType || !targetTypeDef) return;

    // Common mapping suggestions
    const suggestions: Array<{ from: string; to: string }> = [];

    // Strength → Timed: reps → duration
    if (sourceType.id === EXERCISE_TYPE_IDS.STRENGTH && targetTypeDef.id === EXERCISE_TYPE_IDS.TIMED) {
      suggestions.push({ from: "reps", to: "duration" });
    }
    // Timed → Strength: duration → reps
    else if (sourceType.id === EXERCISE_TYPE_IDS.TIMED && targetTypeDef.id === EXERCISE_TYPE_IDS.STRENGTH) {
      suggestions.push({ from: "duration", to: "reps" });
    }
    // Strength → Distance: (no obvious mapping, user chooses)
    // Strength → Cardio: (no obvious mapping, user chooses)

    // Add suggested mappings
    for (const suggestion of suggestions) {
      this.addFieldMappingRow(suggestion.from, suggestion.to);
    }

    // If no suggestions, add an empty row
    if (suggestions.length === 0) {
      this.addFieldMappingRow();
    }
  }

  /**
   * Adds a field mapping row to the UI
   */
  private addFieldMappingRow(fromField?: string, toField?: string): void {
    if (!this.fieldMappingContainer) return;

    const sourceType = this.currentType;
    const targetTypeDef = getExerciseTypeById(this.targetType);
    if (!sourceType || !targetTypeDef) return;

    const mappingRow = this.fieldMappingContainer.createEl("div", {
      cls: "workout-convert-mapping-row",
    });

    // Source field dropdown
    const sourceOptions = this.getSourceFieldOptions(sourceType);
    const sourceSelect = mappingRow.createEl("select", {
      cls: "workout-convert-select",
    });
    sourceOptions.forEach((opt) => {
      const option = sourceSelect.createEl("option", {
        text: opt.text,
        value: opt.value,
      });
      if (opt.value === fromField) {
        option.selected = true;
      }
    });

    // Arrow
    mappingRow.createEl("span", { text: " → ", cls: "workout-convert-arrow" });

    // Target field dropdown
    const targetOptions = this.getTargetFieldOptions(targetTypeDef);
    const targetSelect = mappingRow.createEl("select", {
      cls: "workout-convert-select",
    });
    targetOptions.forEach((opt) => {
      const option = targetSelect.createEl("option", {
        text: opt.text,
        value: opt.value,
      });
      if (opt.value === toField) {
        option.selected = true;
      }
    });

    // Remove button
    const removeBtn = mappingRow.createEl("button", {
      text: "×",
      cls: "workout-convert-remove-btn",
    });
    removeBtn.addEventListener("click", () => {
      mappingRow.remove();
      this.updateMappingsFromUI();
      this.updatePreview();
    });

    // Track mapping
    const mappingIndex = this.fieldMappings.length;
    this.fieldMappings.push({
      fromField: fromField || sourceOptions[0]?.value || "",
      toField: toField || targetOptions[0]?.value || "",
      fromLabel: sourceOptions.find((o) => o.value === (fromField || sourceOptions[0]?.value))?.text || "",
      toLabel: targetOptions.find((o) => o.value === (toField || targetOptions[0]?.value))?.text || "",
    });

    // Update mapping on change
    const updateMapping = () => {
      this.fieldMappings[mappingIndex] = {
        fromField: sourceSelect.value,
        toField: targetSelect.value,
        fromLabel: sourceOptions.find((o) => o.value === sourceSelect.value)?.text || "",
        toLabel: targetOptions.find((o) => o.value === targetSelect.value)?.text || "",
      };
      this.updatePreview();
    };

    sourceSelect.addEventListener("change", updateMapping);
    targetSelect.addEventListener("change", updateMapping);

    this.updatePreview();
  }

  /**
   * Gets source field options based on exercise type
   */
  private getSourceFieldOptions(
    type: ExerciseTypeDefinition
  ): Array<{ text: string; value: string }> {
    const options: Array<{ text: string; value: string }> = [];

    // Standard fields for strength type
    if (type.id === EXERCISE_TYPE_IDS.STRENGTH) {
      options.push({ text: "Reps", value: "reps" });
      options.push({ text: "Weight (kg)", value: "weight" });
    }

    // Add parameters from type definition
    for (const param of type.parameters) {
      // Skip if already added (reps/weight for strength)
      if (options.some((o) => o.value === param.key)) continue;

      const label = param.unit ? `${param.label} (${param.unit})` : param.label;
      options.push({ text: label, value: param.key });
    }

    return options;
  }

  /**
   * Gets target field options based on exercise type
   */
  private getTargetFieldOptions(
    type: ExerciseTypeDefinition
  ): Array<{ text: string; value: string }> {
    const options: Array<{ text: string; value: string }> = [];

    // Standard fields for strength type
    if (type.id === EXERCISE_TYPE_IDS.STRENGTH) {
      options.push({ text: "Reps", value: "reps" });
      options.push({ text: "Weight (kg)", value: "weight" });
    }

    // Add parameters from type definition
    for (const param of type.parameters) {
      // Skip if already added (reps/weight for strength)
      if (options.some((o) => o.value === param.key)) continue;

      const label = param.unit ? `${param.label} (${param.unit})` : param.label;
      options.push({ text: label, value: param.key });
    }

    return options;
  }

  /**
   * Updates field mappings from UI state
   */
  private updateMappingsFromUI(): void {
    if (!this.fieldMappingContainer) return;

    this.fieldMappings = [];
    const rows = this.fieldMappingContainer.querySelectorAll(
      ".workout-convert-mapping-row"
    );

    rows.forEach((row) => {
      const selects = row.querySelectorAll("select");
      if (selects.length >= 2) {
        const sourceSelect = selects[0] as HTMLSelectElement;
        const targetSelect = selects[1] as HTMLSelectElement;

        this.fieldMappings.push({
          fromField: sourceSelect.value,
          toField: targetSelect.value,
          fromLabel: sourceSelect.options[sourceSelect.selectedIndex]?.text || "",
          toLabel: targetSelect.options[targetSelect.selectedIndex]?.text || "",
        });
      }
    });
  }

  /**
   * Updates the preview section
   */
  private updatePreview(): void {
    if (!this.previewContainer) return;

    this.previewContainer.empty();

    // Show preview section
    const previewSection = this.contentEl.querySelector("#preview-section");
    if (previewSection) {
      previewSection.removeClass("workout-convert-section-hidden");
    }

    // Entry count
    if (this.exerciseEntryCount > 0) {
      this.previewContainer.createEl("p", {
        text: CONVERT_UI.LABELS.ENTRIES_FOUND(this.exerciseEntryCount),
        cls: "workout-convert-preview-count",
      });
    } else {
      this.previewContainer.createEl("p", {
        text: CONVERT_UI.LABELS.NO_ENTRIES,
        cls: "workout-convert-preview-warning",
      });
    }

    // Mapping summary
    if (this.fieldMappings.length > 0) {
      const mappingList = this.previewContainer.createEl("ul", {
        cls: "workout-convert-preview-mappings",
      });

      for (const mapping of this.fieldMappings) {
        mappingList.createEl("li", {
          text: `${mapping.fromLabel} → ${mapping.toLabel}`,
        });
      }
    }

    // Enable/disable convert button
    this.updateConvertButtonState();
  }

  /**
   * Updates the convert button enabled state
   */
  private updateConvertButtonState(): void {
    if (!this.convertButton) return;

    const canConvert =
      this.selectedExercise &&
      this.targetType &&
      this.currentType?.id !== this.targetType &&
      this.fieldMappings.length > 0 &&
      this.exerciseEntryCount > 0;

    this.convertButton.disabled = !canConvert;
  }

  /**
   * Hides all dynamic sections
   */
  private hideAllSections(): void {
    const sections = [
      "#conversion-section",
      "#field-mapping-section",
      "#preview-section",
    ];

    for (const selector of sections) {
      const section = this.contentEl.querySelector(selector);
      if (section) {
        section.addClass("workout-convert-section-hidden");
      }
    }

    if (this.currentTypeDisplay) {
      this.currentTypeDisplay.textContent = "—";
    }
  }

  /**
   * Handles the convert action
   */
  private async handleConvert(): Promise<void> {
    // Validation
    if (!this.selectedExercise) {
      new Notice(CONVERT_UI.NOTICES.SELECT_EXERCISE);
      return;
    }

    if (!this.targetType) {
      new Notice(CONVERT_UI.NOTICES.SELECT_TYPE);
      return;
    }

    if (this.currentType?.id === this.targetType) {
      new Notice(CONVERT_UI.NOTICES.SAME_TYPE);
      return;
    }

    if (this.fieldMappings.length === 0) {
      new Notice(CONVERT_UI.NOTICES.ADD_MAPPING);
      return;
    }

    try {
      // Convert data
      const convertedCount = await this.convertExerciseData();

      // Update frontmatter if requested
      if (this.updateFrontmatter) {
        await this.updateExerciseFrontmatter();
      }

      // Success notification
      new Notice(CONVERT_UI.NOTICES.CONVERSION_SUCCESS(convertedCount));

      // Close modal
      this.close();

      // Trigger refresh
      this.plugin.triggerWorkoutLogRefresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(CONVERT_UI.NOTICES.CONVERSION_ERROR + errorMessage);
    }
  }

  /**
   * Converts all exercise data entries
   */
  private async convertExerciseData(): Promise<number> {
    // Get all entries for this exercise
    const logData = await this.plugin.getWorkoutLogData({
      exercise: this.selectedExercise,
      exactMatch: true,
    });

    let convertedCount = 0;

    for (const log of logData) {
      // Build updated entry
      const updatedEntry: Omit<CSVWorkoutLogEntry, "timestamp"> = {
        date: log.date,
        exercise: log.exercise,
        reps: log.reps,
        weight: log.weight,
        volume: log.volume,
        origine: log.origine,
        workout: log.workout,
        notes: log.notes,
        protocol: log.protocol,
        customFields: { ...log.customFields },
      };

      // Apply field mappings
      for (const mapping of this.fieldMappings) {
        const sourceValue = this.getFieldValue(log, mapping.fromField);

        if (sourceValue !== undefined && sourceValue !== null) {
          this.setFieldValue(updatedEntry, mapping.toField, sourceValue);

      // Recalculate volume for strength type
      if (this.targetType === EXERCISE_TYPE_IDS.STRENGTH) {
        updatedEntry.volume = updatedEntry.reps * updatedEntry.weight;
      } else {
        // For non-strength types, volume is typically 0
        updatedEntry.volume = 0;
      }

      // Update entry
      await this.plugin.updateWorkoutLogEntry(log, updatedEntry);
      convertedCount++;
    }

    return convertedCount;
  }}

    return convertedCount;
  }

  /**
   * Gets a field value from a log entry
   */
  private getFieldValue(
    log: { reps: number; weight: number; customFields?: Record<string, string | number | boolean> },
    fieldKey: string
  ): number | string | boolean | undefined {
    // Standard fields
    if (fieldKey === "reps") return log.reps;
    if (fieldKey === "weight") return log.weight;

    // Custom fields
    return log.customFields?.[fieldKey];
  }

  /**
   * Sets a field value on an entry
   */
  private setFieldValue(
    entry: { reps: number; weight: number; customFields?: Record<string, string | number | boolean> },
    fieldKey: string,
    value: number | string | boolean
  ): void {
    // Standard fields
    if (fieldKey === "reps") {
      entry.reps = typeof value === "number" ? value : parseInt(String(value)) || 0;
      return;
    }
    if (fieldKey === "weight") {
      entry.weight = typeof value === "number" ? value : parseFloat(String(value)) || 0;
      return;
    }

    // Custom fields
    if (!entry.customFields) {
      entry.customFields = {};
    }
    entry.customFields[fieldKey] = value;
  }

  /**
   * Clears a field value on an entry
   */
  private clearFieldValue(
    entry: { reps: number; weight: number; customFields?: Record<string, string | number | boolean> },
    fieldKey: string
  ): void {
    // Standard fields - set to 0
    if (fieldKey === "reps") {
      entry.reps = 0;
      return;
    }
    if (fieldKey === "weight") {
      entry.weight = 0;
      return;
    }

    // Custom fields - remove
    if (entry.customFields) {
      delete entry.customFields[fieldKey];
    }
  }

  /**
   * Updates the exercise file frontmatter with new type
   */
  private async updateExerciseFrontmatter(): Promise<void> {
    const definition = await this.plugin.getExerciseDefinitionService().getExerciseDefinition(
      this.selectedExercise
    );

    if (definition) {
      // Update exercise type
      definition.typeId = this.targetType;

      // Save updated definition
      await this.plugin.getExerciseDefinitionService().saveExerciseDefinition(definition);
    }
  }
}

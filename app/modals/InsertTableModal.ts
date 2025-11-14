// Refactored InsertTableModal using reusable components
import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/modals/base/ModalBase";
import { TargetSectionWithAutocomplete } from "@app/modals/components/TargetSectionWithAutocomplete";
import { AdvancedOptionsSection } from "@app/modals/components/AdvancedOptionsSection";
import { CodeGenerator } from "@app/modals/components/CodeGenerator";
import { Notice } from "obsidian";

export class InsertTableModal extends ModalBase {
  constructor(app: App, private plugin: WorkoutChartsPlugin) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Insert workout log table" });

    // Create main container with better styling
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Table Type Section
    const tableTypeSection = this.createSection(mainContainer, "Table type");

    // Table Type selector (exercise vs workout)
    const tableTypeContainer = this.createFormGroup(tableTypeSection);
    const tableTypeSelect = this.createSelect(
      tableTypeContainer,
      "Table Type:",
      [
        { text: "Exercise + workout", value: "combined" },
        { text: "Specific exercise", value: "exercise" },
        { text: "Complete workout", value: "workout" },
      ]
    );

    // Target Section using reusable component with autocomplete
    const currentFileName = this.getCurrentFileName();
    const { elements: targetElements, handlers: targetHandlers } =
      TargetSectionWithAutocomplete.create(
        this,
        mainContainer,
        tableTypeSelect,
        currentFileName,
        this.plugin
      );

    // Ensure visibility is updated based on initial selection
    targetHandlers.updateVisibility();

    // Additional check to ensure workout field is visible for combined mode
    setTimeout(() => {
      if (tableTypeSelect.value === "combined") {
        const workoutField = mainContainer.querySelector(
          '[data-field-type="workout"]'
        ) as HTMLElement;
        const currentWorkoutField = mainContainer.querySelector(
          '[data-field-type="current-workout"]'
        ) as HTMLElement;
        const fileInfoField = mainContainer.querySelector(
          '[data-field-type="file-info"]'
        ) as HTMLElement;

        if (workoutField) {
          workoutField.classList.add("modal-field-visible");
          workoutField.classList.remove("modal-field-hidden");
        }

        if (currentWorkoutField) {
          currentWorkoutField.classList.add("modal-field-visible");
          currentWorkoutField.classList.remove("modal-field-hidden");
        }

        if (fileInfoField) {
          fileInfoField.classList.add("modal-field-visible");
          fileInfoField.classList.remove("modal-field-hidden");
        }
      }
    }, 200);

    // Configuration Section
    const configSection = this.createSection(mainContainer, "Configuration");

    // Limit selector
    const limitContainer = this.createFormGroup(configSection);
    const limitInput = this.createNumberInput(
      limitContainer,
      "Maximum Log Count:",
      "12",
      1,
      1000,
      "12"
    );

    // Columns selector
    const columnsContainer = this.createFormGroup(configSection);
    const columnsSelect = this.createSelect(
      columnsContainer,
      "Table Columns:",
      [
        {
          text: "Standard (Date, exercise, reps, weight, volume)",
          value: "standard",
        },
        {
          text: "Minimal (Date, exercise, reps, weight)",
          value: "minimal",
        },
      ]
    );

    // Display Options Section
    const displaySection = this.createSection(mainContainer, "Display options");

    // Show add button toggle
    const addButtonContainer = this.createCheckboxGroup(displaySection);
    const addButtonToggle = this.createCheckbox(
      addButtonContainer,
      "Show 'Add Log' Button",
      true,
      "showAddButton"
    );

    // Custom button text
    const buttonTextContainer = this.createFormGroup(displaySection);
    const buttonTextInput = this.createTextInput(
      buttonTextContainer,
      "Button Text:",
      "➕ Add Log",
      "➕ Add Log"
    );

    // Advanced Options Section using reusable component
    const advancedElements = AdvancedOptionsSection.create(
      this,
      mainContainer,
      {
        showSearchByName: true,
      }
    );

    // Set default values for combined mode
    const exactMatchToggle = advancedElements.exactMatchToggle;
    exactMatchToggle.checked = true; // Default to exact match for combined mode

    // Buttons Section
    const buttonsSection = this.createButtonsSection(mainContainer);

    // Insert button
    const insertBtn = buttonsSection.createEl("button", {
      text: "Insert table",
      cls: "mod-cta",
    });

    // Cancel button
    const cancelBtn = buttonsSection.createEl("button", {
      text: "Cancel",
      cls: "mod-warning",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    insertBtn.addEventListener("click", () => {
      const tableType = tableTypeSelect.value;
      const target = TargetSectionWithAutocomplete.getTargetValue(
        targetElements,
        tableTypeSelect,
        currentFileName
      );
      const limit = parseInt(limitInput.value) || 50;
      const columnsType = columnsSelect.value;
      const showAddButton = addButtonToggle.checked;
      const buttonText = buttonTextInput.value.trim();
      const advancedValues = AdvancedOptionsSection.getValues(advancedElements);

      // Validation for combined mode
      if (tableType === "combined") {
        if (!target.exercise || !target.workout) {
          new Notice(
            "⚠️ for 'exercise + workout' type you must fill both fields!"
          );
          return;
        }
      }

      const tableCode = CodeGenerator.generateTableCode({
        tableType,
        exercise: target.exercise || "",
        workout: target.workout || "",
        limit,
        columnsType,
        showAddButton,
        buttonText,
        searchByName: advancedValues.searchByName || false,
        exactMatch: advancedValues.exactMatch,
        debug: advancedValues.debug,
      });

      this.insertIntoEditor(tableCode, "✅ Table inserted successfully!");
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Refactored InsertTableModal using reusable components
import { App } from "obsidian";
import type WorkoutChartsPlugin from "../../main";
import { ModalBase } from "./base/ModalBase";
import { TargetSectionWithAutocomplete } from "./components/TargetSectionWithAutocomplete";
import { AdvancedOptionsSection } from "./components/AdvancedOptionsSection";
import { CodeGenerator } from "./components/CodeGenerator";
import { Notice } from "obsidian";

export class InsertTableModal extends ModalBase {
  constructor(app: App, private plugin: WorkoutChartsPlugin) {
    super(app);
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Inserisci Tabella Log Allenamento" });

    // Create main container with better styling
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Table Type Section
    const tableTypeSection = this.createSection(
      mainContainer,
      "Tipo di Tabella"
    );

    // Table Type selector (exercise vs workout)
    const tableTypeContainer = this.createFormGroup(tableTypeSection);
    const tableTypeSelect = this.createSelect(
      tableTypeContainer,
      "Tipo Tabella:",
      [
        { text: "Esercizio + Allenamento", value: "combined" },
        { text: "Esercizio Specifico", value: "exercise" },
        { text: "Allenamento Completo", value: "workout" },
      ]
    );

    // Target Section using reusable component with autocomplete
    const currentFileName = this.getCurrentFileName();
    const { elements: targetElements, handlers: targetHandlers } =
      await TargetSectionWithAutocomplete.create(
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
        // Force visibility using multiple approaches
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
          workoutField.style.display = "block";
          workoutField.style.visibility = "visible";
          workoutField.style.opacity = "1";
          workoutField.style.height = "auto";
          workoutField.style.overflow = "visible";
        }

        if (currentWorkoutField) {
          currentWorkoutField.style.display = "block";
          currentWorkoutField.style.visibility = "visible";
          currentWorkoutField.style.opacity = "1";
          currentWorkoutField.style.height = "auto";
          currentWorkoutField.style.overflow = "visible";
        }

        if (fileInfoField) {
          fileInfoField.style.display = "block";
          fileInfoField.style.visibility = "visible";
          fileInfoField.style.opacity = "1";
          fileInfoField.style.height = "auto";
          fileInfoField.style.overflow = "visible";
        }
      }
    }, 200);

    // Configuration Section
    const configSection = this.createSection(mainContainer, "Configurazione");

    // Limit selector
    const limitContainer = this.createFormGroup(configSection);
    const limitInput = this.createNumberInput(
      limitContainer,
      "Numero Massimo Log:",
      "12",
      1,
      1000,
      "12"
    );

    // Columns selector
    const columnsContainer = this.createFormGroup(configSection);
    const columnsSelect = this.createSelect(
      columnsContainer,
      "Colonne Tabella:",
      [
        {
          text: "Standard (Data, Esercizio, Ripetizioni, Peso, Volume, Link)",
          value: "standard",
        },
        {
          text: "Minimal (Data, Esercizio, Ripetizioni, Peso)",
          value: "minimal",
        },
        {
          text: "Extended (Data, Esercizio, Ripetizioni, Peso, Volume, Link, Origine)",
          value: "extended",
        },
      ]
    );

    // Display Options Section
    const displaySection = this.createSection(
      mainContainer,
      "Opzioni Visualizzazione"
    );

    // Show add button toggle
    const addButtonContainer = this.createCheckboxGroup(displaySection);
    const addButtonToggle = this.createCheckbox(
      addButtonContainer,
      "Mostra Bottone 'Aggiungi Log'",
      true,
      "showAddButton"
    );

    // Custom button text
    const buttonTextContainer = this.createFormGroup(displaySection);
    const buttonTextInput = this.createTextInput(
      buttonTextContainer,
      "Testo Bottone:",
      "➕ Aggiungi Log",
      "➕ Aggiungi Log"
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

    // Cancel button
    const cancelBtn = buttonsSection.createEl("button", {
      text: "Annulla",
      cls: "mod-warning",
    });

    // Insert button
    const insertBtn = buttonsSection.createEl("button", {
      text: "Inserisci Tabella",
      cls: "mod-cta",
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
            "⚠️ Per il tipo 'Esercizio + Allenamento' devi compilare entrambi i campi!"
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

      this.insertIntoEditor(tableCode, "✅ Tabella inserita con successo!");
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

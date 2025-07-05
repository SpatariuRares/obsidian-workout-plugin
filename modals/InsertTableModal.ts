// Modal for inserting workout log tables into notes
import { App, Modal, Notice, Editor, MarkdownView } from "obsidian";
import type WorkoutChartsPlugin from "../main";

export class InsertTableModal extends Modal {
  constructor(app: App, private plugin: WorkoutChartsPlugin) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Inserisci Tabella Log Allenamento" });

    // Create main container with better styling
    const mainContainer = contentEl.createEl("div", {
      cls: "insert-table-modal",
    });
    Object.assign(mainContainer.style, {
      padding: "20px",
      maxWidth: "600px",
      margin: "0 auto",
    });

    // Table Type Section
    const tableTypeSection = this.createSection(
      mainContainer,
      "Tipo di Tabella"
    );

    // Table Type selector (exercise vs workout)
    const tableTypeContainer = tableTypeSection.createEl("div", {
      cls: "form-group",
    });
    tableTypeContainer.createEl("label", { text: "Tipo Tabella:" });
    const tableTypeSelect = tableTypeContainer.createEl("select");
    tableTypeSelect.createEl("option", {
      text: "Esercizio Specifico",
      value: "exercise",
    });
    tableTypeSelect.createEl("option", {
      text: "Allenamento Completo",
      value: "workout",
    });

    // Exercise/Workout Section
    const targetSection = this.createSection(mainContainer, "Target");

    // Exercise input (for exercise-specific tables)
    const exerciseContainer = targetSection.createEl("div", {
      cls: "form-group",
    });
    exerciseContainer.createEl("label", { text: "Nome Esercizio:" });
    const exerciseInput = exerciseContainer.createEl("input", { type: "text" });
    exerciseInput.placeholder = "Es. Panca Piana, Squat, RDL...";

    // Workout input (for workout tables)
    const workoutContainer = targetSection.createEl("div", {
      cls: "form-group",
    });
    workoutContainer.createEl("label", { text: "Nome Allenamento:" });
    const workoutInput = workoutContainer.createEl("input", { type: "text" });
    workoutInput.placeholder = "Es. Allenamento A, Workout B...";

    // Current Workout checkbox (for workout tables)
    const currentWorkoutContainer = targetSection.createEl("div", {
      cls: "form-group checkbox-group",
    });
    const currentWorkoutToggle = currentWorkoutContainer.createEl("input", {
      type: "checkbox",
    });
    currentWorkoutToggle.id = "currentWorkout";
    const currentWorkoutLabel = currentWorkoutContainer.createEl("label", {
      text: "Usa Allenamento Corrente (nome file)",
    });
    currentWorkoutLabel.setAttribute("for", "currentWorkout");

    // Get current file name for display
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const currentFileName = activeView?.file?.basename || "File corrente";

    // Add info text about current file
    const currentFileInfo = targetSection.createEl("div", {
      cls: "current-file-info",
    });
    Object.assign(currentFileInfo.style, {
      fontSize: "0.8em",
      color: "var(--text-muted)",
      fontStyle: "italic",
      marginTop: "5px",
      padding: "5px",
      backgroundColor: "var(--background-modifier-border)",
      borderRadius: "4px",
    });
    currentFileInfo.textContent = `File corrente: ${currentFileName}`;

    // Show/hide containers based on table type
    const updateVisibility = () => {
      const isExercise = tableTypeSelect.value === "exercise";
      exerciseContainer.style.display = isExercise ? "block" : "none";
      workoutContainer.style.display = isExercise ? "none" : "block";
      currentWorkoutContainer.style.display = isExercise ? "none" : "block";
      currentFileInfo.style.display = isExercise ? "none" : "block";
    };

    // Handle current workout toggle
    const handleCurrentWorkoutToggle = () => {
      if (currentWorkoutToggle.checked) {
        workoutInput.disabled = true;
        workoutInput.value = currentFileName;
        workoutInput.style.opacity = "0.5";
      } else {
        workoutInput.disabled = false;
        workoutInput.value = "";
        workoutInput.style.opacity = "1";
      }
    };

    currentWorkoutToggle.addEventListener("change", handleCurrentWorkoutToggle);
    tableTypeSelect.addEventListener("change", updateVisibility);
    updateVisibility();

    // Configuration Section
    const configSection = this.createSection(mainContainer, "Configurazione");

    // Limit selector
    const limitContainer = configSection.createEl("div", { cls: "form-group" });
    limitContainer.createEl("label", { text: "Numero Massimo Log:" });
    const limitInput = limitContainer.createEl("input", {
      type: "number",
      value: "12",
    });
    limitInput.setAttribute("min", "1");
    limitInput.setAttribute("max", "1000");
    limitInput.placeholder = "12";

    // Columns selector
    const columnsContainer = configSection.createEl("div", {
      cls: "form-group",
    });
    columnsContainer.createEl("label", { text: "Colonne Tabella:" });
    const columnsSelect = columnsContainer.createEl("select");
    columnsSelect.createEl("option", {
      text: "Standard (Data, Esercizio, Ripetizioni, Peso, Volume, Link)",
      value: "standard",
    });
    columnsSelect.createEl("option", {
      text: "Minimal (Data, Esercizio, Ripetizioni, Peso)",
      value: "minimal",
    });
    columnsSelect.createEl("option", {
      text: "Extended (Data, Esercizio, Ripetizioni, Peso, Volume, Link, Origine)",
      value: "extended",
    });

    // Display Options Section
    const displaySection = this.createSection(
      mainContainer,
      "Opzioni Visualizzazione"
    );

    // Show add button toggle
    const addButtonContainer = displaySection.createEl("div", {
      cls: "form-group checkbox-group",
    });
    const addButtonToggle = addButtonContainer.createEl("input", {
      type: "checkbox",
    });
    addButtonToggle.checked = true;
    addButtonToggle.id = "showAddButton";
    const addButtonLabel = addButtonContainer.createEl("label", {
      text: "Mostra Bottone 'Aggiungi Log'",
    });
    addButtonLabel.setAttribute("for", "showAddButton");

    // Custom button text
    const buttonTextContainer = displaySection.createEl("div", {
      cls: "form-group",
    });
    buttonTextContainer.createEl("label", { text: "Testo Bottone:" });
    const buttonTextInput = buttonTextContainer.createEl("input", {
      type: "text",
      value: "➕ Aggiungi Log",
    });
    buttonTextInput.placeholder = "➕ Aggiungi Log";

    // Advanced Options Section
    const advancedSection = this.createSection(
      mainContainer,
      "Opzioni Avanzate"
    );

    // Search by name toggle
    const searchByNameContainer = advancedSection.createEl("div", {
      cls: "form-group checkbox-group",
    });
    const searchByNameToggle = searchByNameContainer.createEl("input", {
      type: "checkbox",
    });
    searchByNameToggle.id = "searchByName";
    const searchByNameLabel = searchByNameContainer.createEl("label", {
      text: "Ricerca per Nome File",
    });
    searchByNameLabel.setAttribute("for", "searchByName");

    // Exact match toggle
    const exactMatchContainer = advancedSection.createEl("div", {
      cls: "form-group checkbox-group",
    });
    const exactMatchToggle = exactMatchContainer.createEl("input", {
      type: "checkbox",
    });
    exactMatchToggle.id = "exactMatch";
    const exactMatchLabel = exactMatchContainer.createEl("label", {
      text: "Matching Esatto",
    });
    exactMatchLabel.setAttribute("for", "exactMatch");

    // Debug mode toggle
    const debugContainer = advancedSection.createEl("div", {
      cls: "form-group checkbox-group",
    });
    const debugToggle = debugContainer.createEl("input", {
      type: "checkbox",
    });
    debugToggle.id = "debug";
    const debugLabel = debugContainer.createEl("label", {
      text: "Modalità Debug",
    });
    debugLabel.setAttribute("for", "debug");

    // Buttons Section
    const buttonsSection = mainContainer.createEl("div", {
      cls: "buttons-section",
    });
    Object.assign(buttonsSection.style, {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "20px",
      paddingTop: "20px",
      borderTop: "1px solid var(--background-modifier-border)",
    });

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
      const exercise = exerciseInput.value.trim();
      const useCurrentWorkout = currentWorkoutToggle.checked;
      const workout = useCurrentWorkout
        ? currentFileName
        : workoutInput.value.trim();
      const limit = parseInt(limitInput.value) || 50;
      const columnsType = columnsSelect.value;
      const showAddButton = addButtonToggle.checked;
      const buttonText = buttonTextInput.value.trim();
      const searchByName = searchByNameToggle.checked;
      const exactMatch = exactMatchToggle.checked;
      const debug = debugToggle.checked;

      const tableCode = this.generateTableCode({
        tableType,
        exercise,
        workout,
        limit,
        columnsType,
        showAddButton,
        buttonText,
        searchByName,
        exactMatch,
        debug,
      });

      this.insertIntoEditor(tableCode);
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private createSection(parent: HTMLElement, title: string): HTMLElement {
    const section = parent.createEl("div", { cls: "modal-section" });
    Object.assign(section.style, {
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "var(--background-secondary)",
      borderRadius: "8px",
      border: "1px solid var(--background-modifier-border)",
    });

    const sectionTitle = section.createEl("h3", { text: title });
    Object.assign(sectionTitle.style, {
      margin: "0 0 15px 0",
      fontSize: "1.1em",
      color: "var(--text-normal)",
      borderBottom: "1px solid var(--background-modifier-border)",
      paddingBottom: "8px",
    });

    return section;
  }

  private generateTableCode(params: {
    tableType: string;
    exercise: string;
    workout: string;
    limit: number;
    columnsType: string;
    showAddButton: boolean;
    buttonText: string;
    searchByName: boolean;
    exactMatch: boolean;
    debug: boolean;
  }): string {
    const lines: string[] = ["```workout-log"];

    // Add target (exercise or workout)
    if (params.tableType === "exercise" && params.exercise) {
      lines.push(`exercise: ${params.exercise}`);
    } else if (params.tableType === "workout" && params.workout) {
      lines.push(`workout: ${params.workout}`);
    }

    // Add configuration
    lines.push(`limit: ${params.limit}`);

    // Add columns configuration
    if (params.columnsType !== "standard") {
      const columnsMap = {
        minimal: ["Data", "Esercizio", "Ripetizioni", "Peso (kg)"],
        extended: [
          "Data",
          "Esercizio",
          "Ripetizioni",
          "Peso (kg)",
          "Volume",
          "Link",
          "Origine",
        ],
      };
      const columns = columnsMap[params.columnsType as keyof typeof columnsMap];
      if (columns) {
        lines.push(`columns: [${columns.map((c) => `"${c}"`).join(", ")}]`);
      }
    }

    // Add display options
    if (!params.showAddButton) lines.push(`showAddButton: false`);
    if (params.buttonText !== "➕ Aggiungi Log") {
      lines.push(`buttonText: "${params.buttonText}"`);
    }

    // Add advanced options
    if (params.searchByName) lines.push(`searchByName: true`);
    if (params.exactMatch) lines.push(`exactMatch: true`);
    if (params.debug) lines.push(`debug: true`);

    lines.push("```");

    return lines.join("\n");
  }

  private insertIntoEditor(tableCode: string) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      editor.replaceRange(tableCode + "\n\n", cursor);
      new Notice("✅ Tabella inserita con successo!");
    } else {
      new Notice("❌ Apri un file markdown per inserire la tabella.");
    }
  }
}

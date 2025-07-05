// Modal for inserting workout charts into notes
import { App, Modal, Notice, Editor, MarkdownView } from "obsidian";
import type WorkoutChartsPlugin from "../main";

export class InsertChartModal extends Modal {
  constructor(app: App, private plugin: WorkoutChartsPlugin) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Inserisci Grafico Allenamento" });

    // Create main container with better styling
    const mainContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });
    Object.assign(mainContainer.style, {
      padding: "20px",
      maxWidth: "600px",
      margin: "0 auto",
    });

    // Chart Type Section
    const chartTypeSection = this.createSection(
      mainContainer,
      "Tipo di Grafico"
    );

    // Chart Type selector (exercise vs workout)
    const chartTypeContainer = chartTypeSection.createEl("div", {
      cls: "workout-charts-form-group",
    });
    chartTypeContainer.createEl("label", { text: "Tipo Grafico:" });
    const chartTypeSelect = chartTypeContainer.createEl("select");
    chartTypeSelect.createEl("option", {
      text: "Esercizio Specifico",
      value: "exercise",
    });
    chartTypeSelect.createEl("option", {
      text: "Allenamento Completo",
      value: "workout",
    });

    // Data Type selector (volume, weight, reps)
    const dataTypeContainer = chartTypeSection.createEl("div", {
      cls: "workout-charts-form-group",
    });
    dataTypeContainer.createEl("label", { text: "Tipo Dati:" });
    const dataTypeSelect = dataTypeContainer.createEl("select");
    dataTypeSelect.createEl("option", {
      text: "Volume (kg)",
      value: "volume",
    });
    dataTypeSelect.createEl("option", {
      text: "Peso (kg)",
      value: "weight",
    });
    dataTypeSelect.createEl("option", {
      text: "Ripetizioni",
      value: "reps",
    });

    // Exercise/Workout Section
    const targetSection = this.createSection(mainContainer, "Target");

    // Exercise input (for exercise-specific charts)
    const exerciseContainer = targetSection.createEl("div", {
      cls: "workout-charts-form-group",
    });
    exerciseContainer.createEl("label", { text: "Nome Esercizio:" });
    const exerciseInput = exerciseContainer.createEl("input", { type: "text" });
    exerciseInput.placeholder = "Es. Panca Piana, Squat, RDL...";

    // Workout input (for workout charts)
    const workoutContainer = targetSection.createEl("div", {
      cls: "workout-charts-form-group",
    });
    workoutContainer.createEl("label", { text: "Nome Allenamento:" });
    const workoutInput = workoutContainer.createEl("input", { type: "text" });
    workoutInput.placeholder = "Es. Allenamento A, Workout B...";

    // Current Workout checkbox (for workout charts)
    const currentWorkoutContainer = targetSection.createEl("div", {
      cls: "workout-charts-form-group workout-charts-checkbox-group",
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

    // Show/hide containers based on chart type
    const updateVisibility = () => {
      const isExercise = chartTypeSelect.value === "exercise";
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
    chartTypeSelect.addEventListener("change", updateVisibility);
    updateVisibility();

    // Configuration Section
    const configSection = this.createSection(mainContainer, "Configurazione");

    // Date range selector
    const dateRangeContainer = configSection.createEl("div", {
      cls: "workout-charts-form-group",
    });
    dateRangeContainer.createEl("label", { text: "Range Giorni:" });
    const dateRangeInput = dateRangeContainer.createEl("input", {
      type: "number",
      value: "30",
    });
    dateRangeInput.setAttribute("min", "1");
    dateRangeInput.setAttribute("max", "365");
    dateRangeInput.placeholder = "30";

    // Limit selector
    const limitContainer = configSection.createEl("div", {
      cls: "workout-charts-form-group",
    });
    limitContainer.createEl("label", { text: "Limite Dati:" });
    const limitInput = limitContainer.createEl("input", {
      type: "number",
      value: "50",
    });
    limitInput.setAttribute("min", "1");
    limitInput.setAttribute("max", "1000");
    limitInput.placeholder = "50";

    // Display Options Section
    const displaySection = this.createSection(
      mainContainer,
      "Opzioni Visualizzazione"
    );

    // Show trend line toggle
    const trendLineContainer = displaySection.createEl("div", {
      cls: "workout-charts-form-group workout-charts-checkbox-group",
    });
    const trendLineToggle = trendLineContainer.createEl("input", {
      type: "checkbox",
    });
    trendLineToggle.checked = true;
    trendLineToggle.id = "trendLine";
    const trendLineLabel = trendLineContainer.createEl("label", {
      text: "Mostra Linea di Tendenza",
    });
    trendLineLabel.setAttribute("for", "trendLine");

    // Show trend header toggle
    const trendHeaderContainer = displaySection.createEl("div", {
      cls: "workout-charts-form-group workout-charts-checkbox-group",
    });
    const trendHeaderToggle = trendHeaderContainer.createEl("input", {
      type: "checkbox",
    });
    trendHeaderToggle.checked = true;
    trendHeaderToggle.id = "trendHeader";
    const trendHeaderLabel = trendHeaderContainer.createEl("label", {
      text: "Mostra Header Trend",
    });
    trendHeaderLabel.setAttribute("for", "trendHeader");

    // Show statistics toggle
    const statsContainer = displaySection.createEl("div", {
      cls: "workout-charts-form-group workout-charts-checkbox-group",
    });
    const statsToggle = statsContainer.createEl("input", {
      type: "checkbox",
    });
    statsToggle.checked = true;
    statsToggle.id = "stats";
    const statsLabel = statsContainer.createEl("label", {
      text: "Mostra Statistiche",
    });
    statsLabel.setAttribute("for", "stats");

    // Advanced Options Section
    const advancedSection = this.createSection(
      mainContainer,
      "Opzioni Avanzate"
    );

    // Exact match toggle
    const exactMatchContainer = advancedSection.createEl("div", {
      cls: "workout-charts-form-group workout-charts-checkbox-group",
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
      cls: "workout-charts-form-group workout-charts-checkbox-group",
    });
    const debugToggle = debugContainer.createEl("input", {
      type: "checkbox",
    });
    debugToggle.id = "debug";
    const debugLabel = debugContainer.createEl("label", {
      text: "Modalità Debug",
    });
    debugLabel.setAttribute("for", "debug");

    // Custom title
    const titleContainer = advancedSection.createEl("div", {
      cls: "workout-charts-form-group",
    });
    titleContainer.createEl("label", { text: "Titolo Personalizzato:" });
    const titleInput = titleContainer.createEl("input", { type: "text" });
    titleInput.placeholder = "Lascia vuoto per titolo automatico";

    // Buttons Section
    const buttonsSection = mainContainer.createEl("div", {
      cls: "workout-charts-buttons",
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
      text: "Inserisci Grafico",
      cls: "mod-cta",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    insertBtn.addEventListener("click", () => {
      const chartType = chartTypeSelect.value;
      const dataType = dataTypeSelect.value;
      const exercise = exerciseInput.value.trim();
      const useCurrentWorkout = currentWorkoutToggle.checked;
      const workout = useCurrentWorkout
        ? currentFileName
        : workoutInput.value.trim();
      const dateRange = parseInt(dateRangeInput.value) || 30;
      const limit = parseInt(limitInput.value) || 50;
      const showTrendLine = trendLineToggle.checked;
      const showTrend = trendHeaderToggle.checked;
      const showStats = statsToggle.checked;
      const exactMatch = exactMatchToggle.checked;
      const debug = debugToggle.checked;
      const title = titleInput.value.trim();

      const chartCode = this.generateChartCode({
        chartType,
        dataType,
        exercise,
        workout,
        dateRange,
        limit,
        showTrendLine,
        showTrend,
        showStats,
        exactMatch,
        debug,
        title,
      });

      this.insertIntoEditor(chartCode);
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

  private generateChartCode(params: {
    chartType: string;
    dataType: string;
    exercise: string;
    workout: string;
    dateRange: number;
    limit: number;
    showTrendLine: boolean;
    showTrend: boolean;
    showStats: boolean;
    exactMatch: boolean;
    debug: boolean;
    title: string;
  }): string {
    const lines: string[] = ["```workout-chart"];

    // Add chart type
    lines.push(`chartType: ${params.chartType}`);

    // Add data type
    lines.push(`type: ${params.dataType}`);

    // Add target (exercise or workout)
    if (params.chartType === "exercise" && params.exercise) {
      lines.push(`exercise: ${params.exercise}`);
    } else if (params.chartType === "workout" && params.workout) {
      lines.push(`workout: ${params.workout}`);
    }

    // Add configuration
    lines.push(`dateRange: ${params.dateRange}`);
    lines.push(`limit: ${params.limit}`);

    // Add display options
    lines.push(`showTrendLine: ${params.showTrendLine}`);
    lines.push(`showTrend: ${params.showTrend}`);
    lines.push(`showStats: ${params.showStats}`);

    // Add advanced options
    if (params.exactMatch) lines.push(`exactMatch: true`);
    if (params.debug) lines.push(`debug: true`);
    if (params.title) lines.push(`title: ${params.title}`);

    lines.push("```");

    return lines.join("\n");
  }

  private insertIntoEditor(chartCode: string) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      editor.replaceRange(chartCode + "\n\n", cursor);
      new Notice("✅ Grafico inserito con successo!");
    } else {
      new Notice("❌ Apri un file markdown per inserire il grafico.");
    }
  }
}

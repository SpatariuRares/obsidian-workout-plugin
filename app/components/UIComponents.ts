import { Notice, MarkdownView } from "obsidian";
import { CreateLogModal } from "../modals/CreateLogModal";
import { CreateExercisePageModal } from "../modals/CreateExercisePageModal";

/**
 * Provides reusable UI components for the workout charts plugin.
 * Handles rendering of loading indicators, info messages, error messages,
 * and interactive elements like buttons and tables.
 */
export class UIComponents {
  /**
   * Renders a loading indicator with spinner and text.
   * @param container - The HTML element to render the loading indicator in
   * @returns The created loading indicator element
   */
  static renderLoadingIndicator(container: HTMLElement): HTMLElement {
    const loadingDiv = container.createEl("div", {
      cls: "embedded-chart-loading",
    });
    loadingDiv.innerHTML = "⏳ Caricamento dati...";
    return loadingDiv;
  }

  /**
   * Renders an informational message with appropriate styling.
   * @param container - The HTML element to render the message in
   * @param message - The message text to display
   * @param type - The type of message (info, warning, success)
   */
  static renderInfoMessage(
    container: HTMLElement,
    message: string,
    type: "info" | "warning" | "success" = "info"
  ): void {
    const infoDiv = container.createEl("div", {
      cls: `embedded-chart-info embedded-chart-info-${type}`,
    });

    const icons = {
      info: "ℹ️",
      warning: "⚠️",
      success: "✅",
    };

    const icon = icons[type] || icons.info;
    infoDiv.innerHTML = `<strong>${icon}</strong> ${message}`;
  }

  /**
   * Renders an error message with appropriate styling.
   * @param container - The HTML element to render the error message in
   * @param message - The error message text to display
   */
  static renderErrorMessage(container: HTMLElement, message: string): void {
    container.innerHTML = `
      <div class="workout-chart-error">
        ❌ Errore durante la creazione del grafico: ${message}
      </div>
    `;
  }

  /**
   * Renders a message when no workout data is found.
   * @param container - The HTML element to render the message in
   */
  static renderNoDataMessage(container: HTMLElement): void {
    container.innerHTML = `
      <div class="workout-log-no-data">
        <p><strong>Nessun dato trovato nel file CSV</strong></p>
        <p>Il file CSV non esiste o è vuoto.</p>
        <p>Crea il tuo primo log di allenamento usando il comando "Create Workout Log".</p>
      </div>
    `;
  }

  /**
   * Renders a message when CSV file is not found or empty.
   * @param container - The HTML element to render the message in
   * @param csvFilePath - Path to the CSV file
   * @param plugin - Plugin instance for opening the create log modal
   */
  static renderCSVNoDataMessage(
    container: HTMLElement,
    csvFilePath: string,
    plugin: any
  ): void {
    container.innerHTML = `
      <div class="workout-log-no-data">
        <p><strong>📊 Nessun dato trovato nel file CSV</strong></p>
        <p><strong>File:</strong> <code>${csvFilePath}</code></p>
        <p>Il file CSV non esiste o è vuoto. Crea il tuo primo log di allenamento per iniziare a tracciare i tuoi progressi.</p>
        <div style="margin-top: 15px;">
          <button class="add-log-button" id="create-first-log-btn">
            ➕ Crea Primo Log
          </button>
        </div>
      </div>
    `;

    // Add event listener to the button
    const button = container.querySelector(
      "#create-first-log-btn"
    ) as HTMLButtonElement;
    if (button) {
      button.addEventListener("click", () => {
        const activeView =
          plugin.app.workspace.getActiveViewOfType(MarkdownView);
        const currentPageLink = activeView?.file
          ? `[[${activeView.file.basename}]]`
          : "";

        new CreateLogModal(
          plugin.app,
          plugin,
          undefined, // No specific exercise name for first log
          currentPageLink,
          () => {
            plugin.onWorkoutLogCreated();
            plugin.triggerWorkoutLogRefresh();
          }
        ).open();
      });
    }
  }

  /**
   * Renders a message when no matching exercise data is found.
   * @param container - The HTML element to render the message in
   * @param exercise - The exercise name that was searched for
   * @param logData - Array of available workout log data
   */
  static renderNoMatchMessage(
    container: HTMLElement,
    exercise: string,
    logData: any[]
  ): void {
    container.innerHTML = `
      <div class="workout-log-no-match">
        Nessun dato trovato per l'esercizio: <strong>${exercise}</strong>
      </div>
    `;
  }

  /**
   * Renders debug information for troubleshooting.
   * @param container - The HTML element to render the debug info in
   * @param data - Array of data being processed
   * @param chartType - Type of chart being rendered
   * @param filterMethod - Method used for filtering the data
   */
  static renderDebugInfo(
    container: HTMLElement,
    data: any[],
    chartType: string,
    filterMethod: string
  ): void {
    const debugInfo = container.createEl("div", {
      cls: "embedded-chart-debug",
    });
    debugInfo.innerHTML = `
      <strong>Debug Info:</strong><br>
      Metodo Filtro: ${filterMethod}<br>
      Punti Dati: ${data.length}<br>
      Tipo Grafico: ${chartType}
    `;
  }

  /**
   * Renders a footer with summary information about the data.
   * @param contentDiv - The HTML element to render the footer in
   * @param volumeData - Array of numerical data points
   * @param filterResult - Result of the data filtering process
   * @param chartType - Type of chart being displayed
   */
  static renderFooter(
    contentDiv: HTMLElement,
    volumeData: number[],
    filterResult: any,
    chartType: string
  ): void {
    const infoFooterDiv = contentDiv.createEl("div", {
      cls: "workout-charts-footer",
    });

    let infoFooterText = `📊 ${volumeData.length} sessioni elaborate`;

    if (filterResult.titlePrefix && filterResult.titlePrefix.includes(" + ")) {
      const [exercise, workout] = filterResult.titlePrefix.split(" + ");
      const workoutFilename =
        workout.split("/").pop()?.replace(/\.md$/i, "") || workout;
      infoFooterText += ` per "${exercise}" nell'allenamento "${workoutFilename}"`;
    } else if (chartType === "exercise") {
      infoFooterText += ` per \"${filterResult.titlePrefix}\"`;
    } else if (chartType === "workout") {
      infoFooterText += ` per l'allenamento \"${filterResult.titlePrefix}\"`;
    }

    infoFooterText += `. (Metodo ricerca: ${filterResult.filterMethodUsed})`;
    infoFooterDiv.innerHTML = infoFooterText;
  }

  /**
   * Renders a fallback table when Chart.js is not available.
   * @param container - The HTML element to render the fallback table in
   * @param labels - Array of labels for the table
   * @param volumeData - Array of numerical data for the table
   * @param title - Title for the fallback table
   */
  static renderFallbackTable(
    container: HTMLElement,
    labels: string[],
    volumeData: number[],
    title: string
  ): void {
    const tableDiv = container.createEl("div", {
      cls: "embedded-chart-table-fallback",
    });

    const table = tableDiv.createEl("table");
    table.className = "workout-charts-table";

    this.createTableHeader(table);
    this.createTableBody(table, labels, volumeData);

    const infoDiv = tableDiv.createEl("div", {
      cls: "workout-charts-footer",
    });
    infoDiv.innerHTML =
      "📊 Tabella di fallback (Plugin Charts non disponibile o errore)";
  }

  /**
   * Creates the header row for a table.
   * @param table - The table element to add the header to
   */
  private static createTableHeader(table: HTMLTableElement): void {
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    ["Data", "Volume (kg)"].forEach((txt) => {
      const th = headerRow.createEl("th");
      th.textContent = txt;
    });
  }

  /**
   * Creates the body rows for a table.
   * @param table - The table element to add the body rows to
   * @param labels - Array of labels for the rows
   * @param volumeData - Array of numerical data for the rows
   */
  private static createTableBody(
    table: HTMLTableElement,
    labels: string[],
    volumeData: number[]
  ): void {
    const tbody = table.createEl("tbody");
    volumeData.forEach((v, i) => {
      const tr = tbody.createEl("tr");
      [labels[i], v.toFixed(1)].forEach((txt) => {
        const td = tr.createEl("td");
        td.textContent = txt;
      });
    });
  }

  /**
   * Creates an "Add Log" button for creating new workout logs.
   * @param container - The HTML element to render the button in
   * @param exerciseName - Name of the exercise to pre-fill in the log
   * @param currentPageLink - Link to the current page for the log
   * @param plugin - Plugin instance for opening the create log modal
   * @param onLogCreated - Callback function to execute when a log is created
   */
  static createAddLogButton(
    container: HTMLElement,
    exerciseName: string,
    currentPageLink: string,
    plugin: any,
    onLogCreated?: () => void
  ): void {
    if (!currentPageLink) {
      console.warn("'Add Log' button not created: currentPageLink is missing.");
      return;
    }

    const buttonContainer = container.createEl("div", {
      cls: "add-log-button-container",
    });

    const button = buttonContainer.createEl("button", {
      text: `➕ Aggiungi Log per ${exerciseName || "Allenamento"}`,
      cls: "add-log-button",
    });

    button.addEventListener("click", () => {
      new CreateLogModal(
        plugin.app,
        plugin,
        exerciseName,
        currentPageLink,
        onLogCreated
      ).open();
    });
  }

  /**
   * Creates a "Create Log" button for creating new workout logs when no exercise data is found.
   * @param container - The HTML element to render the button in
   * @param exerciseName - Name of the exercise to pre-fill in the modal
   * @param plugin - Plugin instance for opening the create log modal
   */
  static createCreateLogButtonForMissingExercise(
    container: HTMLElement,
    exerciseName: string,
    plugin: any
  ): void {
    const buttonContainer = container.createEl("div", {
      cls: "create-log-button-container",
    });

    const button = buttonContainer.createEl("button", {
      text: `➕ Crea Log per: ${exerciseName}`,
      cls: "create-log-button",
    });

    button.addEventListener("click", () => {
      const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
      const currentPageLink = activeView?.file
        ? `[[${activeView.file.basename}]]`
        : "";

      new CreateLogModal(
        plugin.app,
        plugin,
        exerciseName,
        currentPageLink,
        () => {
          plugin.onWorkoutLogCreated();
          plugin.triggerWorkoutLogRefresh();
        }
      ).open();
    });
  }
}

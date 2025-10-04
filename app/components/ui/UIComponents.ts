import { MarkdownView } from "obsidian";
import { CreateLogModal } from "../../modals/CreateLogModal";
import { WorkoutLogData } from "../../types/WorkoutLogData";
import { FilterResult } from "../types/types";
import type WorkoutChartsPlugin from "../../../main";

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
      cls: "workout-charts-loading",
    });
    loadingDiv.textContent = "⏳ Loading data...";
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
      cls: `workout-charts-info workout-charts-info-${type}`,
    });

    const icons = {
      info: "ℹ️",
      warning: "⚠️",
      success: "✅",
    };

    const icon = icons[type] || icons.info;
    const strongEl = infoDiv.createEl("strong", { text: icon });
    infoDiv.append(" ", message);
  }

  /**
   * Renders an error message with appropriate styling.
   * @param container - The HTML element to render the error message in
   * @param message - The error message text to display
   */
  static renderErrorMessage(container: HTMLElement, message: string): void {
    const errorDiv = container.createEl("div", {
      cls: "workout-chart-error",
    });
    errorDiv.textContent = `❌ Error creating chart: ${message}`;
  }

  /**
   * Renders a message when no workout data is found.
   * @param container - The HTML element to render the message in
   */
  static renderNoDataMessage(container: HTMLElement): void {
    const noDataDiv = container.createEl("div", {
      cls: "workout-log-no-data",
    });

    const p1 = noDataDiv.createEl("p");
    const strong1 = p1.createEl("strong", {
      text: "No data found in CSV file",
    });

    const p2 = noDataDiv.createEl("p", {
      text: "The CSV file does not exist or is empty.",
    });

    const p3 = noDataDiv.createEl("p", {
      text: 'Create your first workout log using the "Create Workout Log" command.',
    });
  }

  /**
   * Renders a message when no CSV data is found.
   * @param container - The HTML element to render the message in
   * @param csvFilePath - Path to the CSV file
   * @param plugin - Plugin instance for opening the create log modal
   */
  static renderCSVNoDataMessage(
    container: HTMLElement,
    csvFilePath: string,
    plugin: WorkoutChartsPlugin
  ): void {
    const noDataDiv = container.createEl("div", {
      cls: "workout-log-no-data",
    });

    const p1 = noDataDiv.createEl("p");
    const strong1 = p1.createEl("strong", {
      text: "📊 No data found in CSV file",
    });

    const p2 = noDataDiv.createEl("p");
    const strong2 = p2.createEl("strong", { text: "File: " });
    const codeEl = p2.createEl("code", { text: csvFilePath });

    const p3 = noDataDiv.createEl("p", {
      text: "The CSV file does not exist or is empty. Create your first workout log to start tracking your progress.",
    });

    const buttonDiv = noDataDiv.createEl("div", {
      cls: "workout-charts-button-container",
    });

    const createButton = buttonDiv.createEl("button", {
      text: "➕ Create first workout log",
      cls: "add-log-button",
    });
    createButton.id = "create-first-log-btn";

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
    logData: WorkoutLogData[]
  ): void {
    const noMatchDiv = container.createEl("div", {
      cls: "workout-log-no-match",
    });
    noMatchDiv.textContent = "No data found for exercise: ";
    const strongEl = noMatchDiv.createEl("strong", { text: exercise });
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
    data: WorkoutLogData[],
    chartType: string,
    filterMethod: string
  ): void {
    const debugInfo = container.createEl("div", {
      cls: "workout-charts-debug",
    });

    const strongEl = debugInfo.createEl("strong", { text: "Debug Info:" });
    debugInfo.createEl("br");
    debugInfo.append(`Filter Method: ${filterMethod}`);
    debugInfo.createEl("br");
    debugInfo.append(`Data Points: ${data.length}`);
    debugInfo.createEl("br");
    debugInfo.append(`Chart Type: ${chartType}`);
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
      cls: "workout-charts-table-fallback",
    });

    const table = tableDiv.createEl("table");
    table.className = "workout-charts-table";

    this.createTableHeader(table);
    this.createTableBody(table, labels, volumeData);

    const infoDiv = tableDiv.createEl("div", {
      cls: "workout-charts-footer",
    });
    infoDiv.textContent =
      "📊 Fallback table (Charts plugin not available or error)";
  }

  /**
   * Creates the header row for a table.
   * @param table - The table element to add the header to
   */
  private static createTableHeader(table: HTMLTableElement): void {
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    ["Date", "Volume (kg)"].forEach((txt) => {
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
    plugin: WorkoutChartsPlugin,
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
      text: `➕ Add Log for ${exerciseName || "Workout"}`,
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
    plugin: WorkoutChartsPlugin
  ): void {
    const buttonContainer = container.createEl("div", {
      cls: "create-log-button-container",
    });

    const button = buttonContainer.createEl("button", {
      text: `➕ Create log for: ${exerciseName}`,
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
          plugin.triggerWorkoutLogRefresh();
        }
      ).open();
    });
  }
}

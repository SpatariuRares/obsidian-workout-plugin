import { MarkdownView } from "obsidian";
import { CreateLogModal } from "@app/modals/CreateLogModal";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { LoadingSpinner, EmptyState } from "@app/components/molecules";
import { Button } from "@app/components/atoms";

/**
 * Provides reusable UI components for the workout charts plugin.
 * Handles rendering of loading indicators, info messages, error messages,
 * and interactive elements like buttons and tables.
 */
export class UIComponents {
  /**
   * Renders a loading indicator with spinner and text.
   * Uses LoadingSpinner molecule for consistent styling.
   * @param container - The HTML element to render the loading indicator in
   * @returns The created loading indicator element
   */
  static renderLoadingIndicator(container: HTMLElement): HTMLElement {
    return LoadingSpinner.create(container, {
      message: "loading data...",
      icon: "⏳",
      className: "workout-charts-loading",
    });
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

    // const strongEl = infoDiv.createEl("strong", { text: icon });
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
   * Uses EmptyState molecule for consistent styling.
   * @param container - The HTML element to render the message in
   */
  static renderNoDataMessage(container: HTMLElement): void {
    EmptyState.create(container, {
      icon: "📭",
      message: "No workout data found",
      className: "workout-log-no-data",
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
    plugin: WorkoutChartsPlugin,
    exerciseName?: string
  ): void {
    const noDataDiv = container.createEl("div", {
      cls: "workout-log-no-data",
    });

    noDataDiv.createEl("p");

    noDataDiv.createEl("p");

    const buttonDiv = noDataDiv.createEl("div", {
      cls: "workout-charts-button-container",
    });

    // Use Button atom for create button
    const createButton = Button.create(buttonDiv, {
      text: `create first workout log for ${exerciseName}`,
      icon: "➕",
      className: "add-log-button",
      ariaLabel: `Create first workout log for ${exerciseName}`,
    });

    // Add event listener using Button helper
    Button.onClick(createButton, () => {
      const activeView =
        plugin.app.workspace.getActiveViewOfType(MarkdownView);
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

  /**
   * Renders a message when no matching exercise data is found.
   * Uses EmptyState molecule for consistent styling.
   * @param container - The HTML element to render the message in
   */
  static renderNoMatchMessage(container: HTMLElement): void {
    EmptyState.create(container, {
      icon: "🔍",
      message: "No matching exercise data found",
      className: "workout-log-no-match",
    });
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
    _title: string
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
      "📊 fallback table (charts plugin not available or error)";
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
      return;
    }

    const buttonContainer = container.createEl("div", {
      cls: "add-log-button-container",
    });

    // Use Button atom for add log button
    const button = Button.create(buttonContainer, {
      text: `Add Log for ${exerciseName || "Workout"}`,
      icon: "➕",
      className: "add-log-button",
      ariaLabel: `Add workout log for ${exerciseName || "Workout"}`,
    });

    // Add event listener using Button helper
    Button.onClick(button, () => {
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

    // Use Button atom for create log button
    const button = Button.create(buttonContainer, {
      text: `Create log for: ${exerciseName}`,
      icon: "➕",
      className: "create-log-button",
      ariaLabel: `Create workout log for ${exerciseName}`,
    });

    // Add event listener using Button helper
    Button.onClick(button, () => {
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

import { WorkoutLogData } from "../types/WorkoutLogData";
import type WorkoutChartsPlugin from "../../main";
import { MarkdownView } from "obsidian";
import {
  EmbeddedTableParams,
  TableData,
  TableRenderer,
  TableDataProcessor,
  UIComponents,
} from "../components";
import { BaseView } from "./BaseView";

export class EmbeddedTableView extends BaseView {
  private currentContainer?: HTMLElement;
  private currentLogData?: WorkoutLogData[];
  private currentParams?: EmbeddedTableParams;

  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
  }

  async createTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams
  ): Promise<void> {
    this.currentContainer = container;
    this.currentLogData = logData;
    this.currentParams = params;

    await this.renderTable(container, logData, params);
  }

  private async renderTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams
  ): Promise<void> {
    try {
      this.logDebug("EmbeddedTableView", "createTable called", {
        dataLength: logData.length,
        params,
      });

      if (!this.validateTableParams(container, params)) {
        return;
      }

      const loadingDiv = this.showLoadingIndicator(container);

      if (this.handleEmptyData(container, logData)) {
        loadingDiv.remove();
        return;
      }

      // Get optimized CSV data with efficient filtering
      const dataToProcess = await this.getOptimizedCSVData(params);

      this.logDebug("EmbeddedTableView", "CSV data processing completed", {
        originalDataLength: logData.length,
        processedDataLength: dataToProcess.length,
      });

      const filterResult = this.filterData(
        dataToProcess,
        params,
        this.plugin.settings.debugMode || params.debug || false
      );

      if (filterResult.filteredData.length === 0) {
        loadingDiv.remove();
        this.handleNoFilteredData(
          container,
          params,
          filterResult.titlePrefix,
          dataToProcess,
          "table"
        );
        return;
      }

      loadingDiv.remove();
      this.logDebug("EmbeddedTableView", "Processing table data", {
        filteredDataLength: filterResult.filteredData.length,
        limit: params.limit || 50,
      });

      const tableData = TableDataProcessor.processTableData(
        filterResult.filteredData,
        params
      );

      this.renderTableContentOptimized(container, tableData);
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj, "creating embedded table");
    }
  }

  /**
   * Get optimized data for CSV mode with efficient filtering
   */
  private async getOptimizedCSVData(
    params: EmbeddedTableParams
  ): Promise<WorkoutLogData[]> {
    // In CSV mode, we can apply more efficient filtering
    const filterOptions: {
      exercise?: string;
      workout?: string;
      exactMatch?: boolean;
    } = {};

    if (params.exercise) {
      filterOptions.exercise = params.exercise;
      filterOptions.exactMatch = params.exactMatch;
    }

    if (params.workout) {
      filterOptions.workout = params.workout;
    }

    this.logDebug("EmbeddedTableView", "CSV optimized filtering", {
      filterOptions,
    });

    return await this.plugin.getWorkoutLogData(filterOptions);
  }

  private validateTableParams(
    container: HTMLElement,
    params: EmbeddedTableParams
  ): boolean {
    const validationErrors = TableDataProcessor.validateTableParams(params);
    return this.validateAndHandleErrors(container, validationErrors);
  }

  private renderTableContentOptimized(
    container: HTMLElement,
    tableData: TableData
  ): void {
    const { headers, rows, totalRows, filterResult, params } = tableData;

    container.empty();

    const fragment = document.createDocumentFragment();
    const contentDiv = fragment.appendChild(document.createElement("div"));

    // Show CSV mode indicator
    this.renderCSVModeIndicator(contentDiv);

    if (params.showAddButton !== false) {
      const activeView =
        this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      const currentPageLink = activeView?.file
        ? `[[${activeView.file.basename}]]`
        : "";
      const exerciseName = params.exercise || "Workout";

      UIComponents.createAddLogButton(
        contentDiv,
        exerciseName,
        currentPageLink,
        this.plugin,
        () => this.refreshTable()
      );
    }

    const tableContainer = TableRenderer.createTableContainer(contentDiv);

    this.logDebug("EmbeddedTableView", "Creating table with config", {
      headers,
      rows,
    });

    const tableSuccess = TableRenderer.renderTable(
      tableContainer,
      headers,
      rows,
      params,
      filterResult.filteredData,
      this.plugin
    );

    if (!tableSuccess) {
      TableRenderer.renderFallbackMessage(
        tableContainer,
        "Error in table rendering",
        "Table Error"
      );
    }

    if (this.plugin.settings.debugMode || params.debug) {
      this.renderDebugInfo(
        contentDiv,
        filterResult.filteredData,
        "table",
        filterResult.filterMethodUsed,
        true
      );
    }

    this.renderTableFooter(contentDiv, tableData);

    this.showSuccessMessage(
      contentDiv,
      `Table generated successfully! ${totalRows} logs processed. (CSV Mode)`
    );

    container.appendChild(fragment);
  }

  /**
   * Render CSV mode indicator
   */
  private renderCSVModeIndicator(container: HTMLElement): void {
    const indicatorDiv = container.createEl("div", {
      cls: "csv-mode-indicator",
    });

    const span1 = indicatorDiv.createEl("span", {
      cls: "csv-mode-indicator-icon",
    });
    span1.textContent = "📊";

    const span2 = indicatorDiv.createEl("span");
    span2.textContent = `CSV Mode: Data loaded from ${this.plugin.settings.csvLogFilePath}`;
  }

  private renderTableFooter(
    container: HTMLElement,
    tableData: TableData
  ): void {
    const { totalRows, filterResult, params } = tableData;

    const footerDiv = container.createEl("div", {
      cls: "table-footer",
    });

    let footerText = `📊 Found ${totalRows} logs`;

    if (params.exercise && params.workout) {
      const workoutFilename =
        params.workout.split("/").pop()?.replace(/\.md$/i, "") ||
        params.workout;
      footerText += ` for "${params.exercise}" in workout "${workoutFilename}"`;
    } else if (params.exercise) {
      footerText += ` for "${params.exercise}"`;
    } else if (params.workout) {
      const workoutFilename =
        params.workout.split("/").pop()?.replace(/\.md$/i, "") ||
        params.workout;
      footerText += ` in workout "${workoutFilename}"`;
    } else {
      footerText += ` total`;
    }

    footerText += `. (Method: ${
      filterResult.filterMethodUsed
    }). Showing max ${params.limit || 50}. [CSV Mode]`;

    footerDiv.textContent = footerText;
  }

  public async refreshTable(): Promise<void> {
    if (this.currentContainer && this.currentParams) {
      try {
        // Clear cache to ensure fresh data
        this.plugin.clearLogDataCache();

        const freshLogData = await this.plugin.getWorkoutLogData();

        if (
          !this.currentLogData ||
          freshLogData.length !== this.currentLogData.length
        ) {
          this.currentLogData = freshLogData;
          await this.renderTable(
            this.currentContainer,
            freshLogData,
            this.currentParams
          );
        }
      } catch (error) {
        console.error("Error refreshing table:", error);
        if (this.currentLogData) {
          await this.renderTable(
            this.currentContainer,
            this.currentLogData,
            this.currentParams
          );
        }
      }
    }
  }
}

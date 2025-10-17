import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { MarkdownView } from "obsidian";
import {
  TableRenderer,
  TableDataProcessor,
  UIComponents,
  TableState,
  TableCallbacks,
  TableDataLoader,
  TableValidator,

  TableRefresh,
} from "@app/components";
import { BaseView } from "@app/views/BaseView";
import WorkoutChartsPlugin from "main";
import { EmbeddedTableParams, TableData } from "@app/types";

export class EmbeddedTableView extends BaseView {
  private tableState: TableState;
  private callbacks: TableCallbacks;

  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);

    this.tableState = {
      currentContainer: undefined,
      currentLogData: undefined,
      currentParams: undefined,
    };

    this.callbacks = {
      onRefresh: () => this.refreshTable(),
      onError: (error, context) => this.logDebug("EmbeddedTableView", `Error in ${context}`, { error }),
      onSuccess: (message) => this.logDebug("EmbeddedTableView", message),
      onDebug: (component, message, data) => this.logDebug(component, message, data),
    };
  }

  async createTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams
  ): Promise<void> {
    this.tableState.currentContainer = container;
    this.tableState.currentLogData = logData;
    this.tableState.currentParams = params;

    await this.renderTable(container, logData, params);
  }

  private async renderTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams
  ): Promise<void> {
    try {
      this.callbacks.onDebug?.("EmbeddedTableView", "createTable called", {
        dataLength: logData.length,
        params,
      });

      // Validate parameters using the new component
      const validationErrors = TableValidator.validateTableParams(params);
      if (!this.validateAndHandleErrors(container, validationErrors)) {
        return;
      }

      const loadingDiv = this.showLoadingIndicator(container);

      if (this.handleEmptyData(container, logData)) {
        loadingDiv.remove();
        return;
      }

      // Get optimized CSV data using the new component
      const dataToProcess = await TableDataLoader.getOptimizedCSVData(
        params,
        this.plugin,
        this.callbacks
      );

      this.callbacks.onDebug?.("EmbeddedTableView", "CSV data processing completed", {
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
      this.callbacks.onDebug?.("EmbeddedTableView", "Processing table data", {
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


  private renderTableContentOptimized(
    container: HTMLElement,
    tableData: TableData
  ): void {
    const { headers, rows, totalRows, filterResult, params } = tableData;

    container.empty();

    const fragment = document.createDocumentFragment();
    const contentDiv = fragment.appendChild(document.createElement("div"));


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

    this.callbacks.onDebug?.("EmbeddedTableView", "Creating table with config", {
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

    container.appendChild(fragment);
  }


  public async refreshTable(): Promise<void> {
    await TableRefresh.refreshTable(
      this.tableState,
      this.plugin,
      (container, logData, params) => this.renderTable(container, logData, params),
      this.callbacks
    );
  }
}

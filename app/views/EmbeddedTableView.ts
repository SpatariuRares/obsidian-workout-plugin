import { MODAL_SECTIONS } from "@app/constants/ModalConstants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { MarkdownView } from "obsidian";
import {
  TableRenderer,
  TableDataProcessor,
  TableState,
  TableCallbacks,
  TableDataLoader,
  TableConfig,
  TableRefresh,
} from "@app/features/tables";
import { LogCallouts } from "@app/features/logs/components/LogCallouts";
import { BaseView } from "@app/views/BaseView";
import WorkoutChartsPlugin from "main";
import { EmbeddedTableParams, TableData } from "@app/types";
import { VIEW_TYPES } from "@app/types/ViewTypes";

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
      onError: (error, context) =>
        this.logDebug("EmbeddedTableView", `Error in ${context}`, { error }),
      onSuccess: (message) => this.logDebug("EmbeddedTableView", message),
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

      // Validate parameters using the new component
      const validationErrors = TableConfig.validateParams(params);
      if (!this.validateAndHandleErrors(container, validationErrors)) {
        return;
      }

      const loadingDiv = this.showLoadingIndicator(container);
      if (this.handleEmptyData(container, logData, params.exercise)) {
        loadingDiv.remove();
        return;
      }

      // Get optimized CSV data using the new component
      const dataToProcess = await TableDataLoader.getOptimizedCSVData(
        params,
        this.plugin,
      );



      const filterResult = this.filterData(
        dataToProcess,
        params,
      );

      if (filterResult.filteredData.length === 0) {
        loadingDiv.remove();
        this.handleNoFilteredData(
          container,
          params,
          filterResult.titlePrefix,
          VIEW_TYPES.TABLE
        );
        return;
      }

      loadingDiv.remove();


      const tableData = TableDataProcessor.processTableData(
        filterResult.filteredData,
        params
      );

      this.renderTableContentOptimized(container, tableData);
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj);
    }
  }

  private renderTableContentOptimized(
    container: HTMLElement,
    tableData: TableData
  ): void {
    const { headers, rows, filterResult, params } = tableData;

    container.empty();

    const fragment = document.createDocumentFragment();
    const contentDiv = fragment.appendChild(document.createElement("div"));

    if (params.showAddButton !== false) {
      const activeView =
        this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      const currentPageLink = activeView?.file
        ? `[[${activeView.file.basename}]]`
        : "";
      const exerciseName = params.exercise || MODAL_SECTIONS.WORKOUT;

      LogCallouts.renderAddLogButton(
        contentDiv,
        exerciseName,
        currentPageLink,
        this.plugin,
        () => void this.refreshTable()
      );
    }

    const tableContainer = TableRenderer.createTableContainer(contentDiv);
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
      );
    }

    container.appendChild(fragment);
  }

  public async refreshTable(): Promise<void> {
    await TableRefresh.refreshTable(
      this.tableState,
      this.plugin,
      (container, logData, params) =>
        this.renderTable(container, logData, params),
      this.callbacks
    );
  }
}


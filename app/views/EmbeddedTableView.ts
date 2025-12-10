import { CONSTANTS } from "@app/constants/Constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { MarkdownView } from "obsidian";
import {
  TableRenderer,
  TableDataProcessor,
  TableCallbacks,
  TableDataLoader,
  TableConfig,
} from "@app/features/tables";
import { LogCallouts } from "@app/components/organism/LogCallouts";
import { BaseView } from "@app/views/BaseView";
import WorkoutChartsPlugin from "main";
import { EmbeddedTableParams, TableData } from "@app/types";
import { VIEW_TYPES } from "@app/types/ViewTypes";

export class EmbeddedTableView extends BaseView {
  private callbacks: TableCallbacks;

  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);

    this.callbacks = {
      onRefresh: async () => { }, // Default no-op
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
    // Create a bound refresh function for this specific table instance
    const onRefresh = async () => {
      await this.refreshTable(container, params);
    };

    await this.renderTable(container, logData, params, onRefresh);
  }

  private async renderTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams,
    onRefresh: () => Promise<void>
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

      this.renderTableContentOptimized(container, tableData, () => { void onRefresh(); });
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj);
    }
  }

  private renderTableContentOptimized(
    container: HTMLElement,
    tableData: TableData,
    onRefresh: () => void
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
      const exerciseName = params.exercise || CONSTANTS.WORKOUT.MODAL.SECTIONS.WORKOUT;

      LogCallouts.renderAddLogButton(
        contentDiv,
        exerciseName,
        currentPageLink,
        this.plugin,
        onRefresh
      );
    }

    const tableContainer = TableRenderer.createTableContainer(contentDiv);
    const tableSuccess = TableRenderer.renderTable(
      tableContainer,
      headers,
      rows,
      params,
      filterResult.filteredData,
      this.plugin,
      onRefresh
    );

    if (!tableSuccess) {
      TableRenderer.renderFallbackMessage(
        tableContainer,
        "Error in table rendering",
      );
    }

    container.appendChild(fragment);
  }

  public async refreshTable(
    container: HTMLElement,
    params: EmbeddedTableParams
  ): Promise<void> {
    try {
      this.plugin.clearLogDataCache();

      const freshLogData = await this.plugin.getWorkoutLogData();
      const onRefresh = async () => {
        await this.refreshTable(container, params);
      };

      await this.renderTable(container, freshLogData, params, onRefresh);

      this.callbacks.onSuccess?.(CONSTANTS.WORKOUT.TABLE.MESSAGES.REFRESH_SUCCESS);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.callbacks.onError?.(errorObj, "refreshing table");
    }
  }
}


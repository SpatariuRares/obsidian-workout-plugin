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

      const filterResult = this.filterData(
        logData,
        params,
        this.plugin.settings.debugMode || params.debug || false
      );

      if (filterResult.filteredData.length === 0) {
        loadingDiv.remove();
        this.handleNoFilteredData(
          container,
          params,
          filterResult.titlePrefix,
          logData,
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
      this.handleError(container, error, "creating embedded table");
    }
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

    container.innerHTML = "";

    const fragment = document.createDocumentFragment();
    const contentDiv = fragment.appendChild(document.createElement("div"));

    if (params.showAddButton !== false) {
      const activeView =
        this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      const currentPageLink = activeView?.file
        ? `[[${activeView.file.basename}]]`
        : "";
      const exerciseName = params.exercise || "Allenamento";

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
        "Errore nel rendering della tabella",
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
      `Tabella generata con successo! ${totalRows} log elaborati.`
    );

    container.appendChild(fragment);
  }

  private renderTableFooter(
    container: HTMLElement,
    tableData: TableData
  ): void {
    const { totalRows, filterResult, params } = tableData;

    const footerDiv = container.createEl("div", {
      cls: "table-footer",
    });

    let footerText = `📊 Trovati ${totalRows} log`;

    if (params.exercise && params.workout) {
      const workoutFilename =
        params.workout.split("/").pop()?.replace(/\.md$/i, "") ||
        params.workout;
      footerText += ` per "${params.exercise}" nell'allenamento "${workoutFilename}"`;
    } else if (params.exercise) {
      footerText += ` per "${params.exercise}"`;
    } else if (params.workout) {
      const workoutFilename =
        params.workout.split("/").pop()?.replace(/\.md$/i, "") ||
        params.workout;
      footerText += ` nell'allenamento "${workoutFilename}"`;
    } else {
      footerText += ` in totale`;
    }

    footerText += `. (Metodo: ${
      filterResult.filterMethodUsed
    }). Visualizzati max ${params.limit || 50}.`;
    footerDiv.innerHTML = footerText;
  }

  public async refreshTable(): Promise<void> {
    if (this.currentContainer && this.currentParams) {
      try {
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

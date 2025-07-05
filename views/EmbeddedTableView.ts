// Embedded Table View for workout log data visualization
import { WorkoutLogData } from "../types/WorkoutLogData";
import type WorkoutChartsPlugin from "../main";
import { MarkdownView } from "obsidian";
import {
  EmbeddedTableParams,
  TableData,
  TableRenderer,
  TableDataProcessor,
  UIComponents,
  DataFilter,
} from "../components";

export class EmbeddedTableView {
  private currentContainer?: HTMLElement;
  private currentLogData?: WorkoutLogData[];
  private currentParams?: EmbeddedTableParams;

  constructor(private plugin: WorkoutChartsPlugin) {}

  async createTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams
  ): Promise<void> {
    // Store current state for refresh
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
      this.logDebug("createTable called", {
        dataLength: logData.length,
        params,
      });

      if (!this.validateAndHandleErrors(container, params)) {
        return;
      }

      const loadingDiv = UIComponents.renderLoadingIndicator(container);

      if (logData.length === 0) {
        loadingDiv.remove();
        UIComponents.renderNoDataMessage(container);
        return;
      }

      const filterResult = DataFilter.filterData(
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
          logData
        );
        return;
      }

      loadingDiv.remove();
      this.logDebug("Processing table data", {
        filteredDataLength: filterResult.filteredData.length,
        limit: params.limit || 50,
      });

      // Process data for table display
      const tableData = TableDataProcessor.processTableData(
        filterResult.filteredData,
        params
      );

      this.renderTableContent(container, tableData);
    } catch (error) {
      console.error("Error creating embedded table:", error);
      UIComponents.renderErrorMessage(container, error.message);
    }
  }

  private validateAndHandleErrors(
    container: HTMLElement,
    params: EmbeddedTableParams
  ): boolean {
    const validationErrors = TableDataProcessor.validateTableParams(params);
    if (validationErrors.length > 0) {
      UIComponents.renderErrorMessage(
        container,
        `Parametri non validi:\n${validationErrors.join("\n")}`
      );
      return false;
    }
    return true;
  }

  private handleNoFilteredData(
    container: HTMLElement,
    params: EmbeddedTableParams,
    titlePrefix: string,
    logData: WorkoutLogData[]
  ): void {
    const tableType = params.exercise ? "exercise" : "workout";
    if (tableType === "workout") {
      UIComponents.renderInfoMessage(
        container,
        `Nessun dato trovato per l'allenamento <strong>${titlePrefix}</strong>.`,
        "warning"
      );
    } else {
      UIComponents.renderNoMatchMessage(
        container,
        params.exercise || "",
        logData
      );
    }
  }

  private renderTableContent(
    container: HTMLElement,
    tableData: TableData
  ): void {
    const { headers, rows, totalRows, filterResult, params } = tableData;

    container.empty();
    const contentDiv = container.createEl("div");

    // Add "Add Log" button if enabled
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

    // Create table container
    const tableContainer = TableRenderer.createTableContainer(contentDiv);

    this.logDebug("Creating table with config", { headers, rows });

    const tableSuccess = TableRenderer.renderTable(
      tableContainer,
      headers,
      rows,
      params,
      filterResult.filteredData, // pass the original log objects
      this.plugin // pass the plugin for file opening
    );

    if (!tableSuccess) {
      TableRenderer.renderFallbackMessage(
        tableContainer,
        "Errore nel rendering della tabella",
        "Table Error"
      );
    }

    if (this.plugin.settings.debugMode || params.debug) {
      UIComponents.renderDebugInfo(
        contentDiv,
        filterResult.filteredData,
        "table",
        filterResult.filterMethodUsed
      );
    }

    // Footer with summary information
    this.renderTableFooter(contentDiv, tableData);

    UIComponents.renderInfoMessage(
      contentDiv,
      `Tabella generata con successo! ${totalRows} log elaborati.`,
      "success"
    );
  }

  private renderTableFooter(
    container: HTMLElement,
    tableData: TableData
  ): void {
    const { totalRows, filterResult, params } = tableData;

    const footerDiv = container.createEl("div");
    Object.assign(footerDiv.style, {
      fontSize: "0.8em",
      color: "var(--text-muted)",
      marginTop: "10px",
      padding: "8px",
      backgroundColor: "var(--background-secondary)",
      borderRadius: "4px",
    });

    let footerText = `📊 Trovati ${totalRows} log`;
    if (params.exercise) {
      footerText += ` per "${params.exercise}"`;
    }
    if (params.workout) {
      const workoutFilename =
        params.workout.split("/").pop()?.replace(/\.md$/i, "") ||
        params.workout;
      footerText += ` nell'allenamento "${workoutFilename}"`;
    } else if (!params.exercise) {
      footerText += ` in totale`;
    }
    footerText += `. (Metodo: ${
      filterResult.filterMethodUsed
    }). Visualizzati max ${params.limit || 50}.`;
    footerDiv.innerHTML = footerText;
  }

  // Method to refresh the table with new data
  public async refreshTable(): Promise<void> {
    if (this.currentContainer && this.currentLogData && this.currentParams) {
      // Get fresh data from the plugin
      const freshLogData = await this.plugin.getWorkoutLogData();
      this.currentLogData = freshLogData;
      await this.renderTable(
        this.currentContainer,
        freshLogData,
        this.currentParams
      );
    }
  }

  private logDebug(message: string, data?: any): void {
    if (this.plugin.settings.debugMode) {
      console.log(`EmbeddedTableView: ${message}`, data);
    }
  }
}

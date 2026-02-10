import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { MarkdownView, MarkdownRenderChild } from "obsidian";
import {
  TableRenderer,
  TableDataProcessor,
  TableDataLoader,
  TableConfig,
  TableRefresh,
  GoToExerciseButton,
  TargetHeader,
  AchievementBadge,
} from "@app/features/tables";
import {
  TableCallbacks,
  EmbeddedTableParams,
  TableData,
} from "@app/features/tables/types";
import { LogCallouts } from "@app/components/molecules/LogCallouts";
import { BaseView } from "@app/features/common/views/BaseView";
import WorkoutChartsPlugin from "main";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { CodeBlockEditorService } from "@app/services/editor/CodeBlockEditorService";
import { Button } from "@app/components";

/**
 * TableRenderChild extends MarkdownRenderChild to manage event listener lifecycle
 * This ensures all event listeners are properly cleaned up when the table is refreshed or removed
 */
class TableRenderChild extends MarkdownRenderChild {
  private abortController: AbortController;

  constructor(containerEl: HTMLElement) {
    super(containerEl);
    this.abortController = new AbortController();
  }

  onload(): void {
    // Event listeners will be registered here with { signal: this.abortController.signal }
  }

  onunload(): void {
    // Abort all event listeners when the child is unloaded
    this.abortController.abort();
  }

  /**
   * Get the abort signal for registering event listeners
   */
  getSignal(): AbortSignal {
    return this.abortController.signal;
  }
}

export class EmbeddedTableView extends BaseView {
  private callbacks: TableCallbacks;
  private renderChildren: TableRenderChild[] = [];

  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);

    this.callbacks = {
      onRefresh: async () => {}, // Default no-op
      onError: (error, context) =>
        this.logDebug("EmbeddedTableView", `Error in ${context}`, { error }),
      onSuccess: (message) => this.logDebug("EmbeddedTableView", message),
    };
  }

  async createTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams,
  ): Promise<void> {
    const onRefresh = async () => {
      await this.refreshTable(container, params);
    };

    await this.renderTable(container, logData, params, onRefresh);
  }

  private async renderTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams,
    onRefresh: () => Promise<void>,
  ): Promise<void> {
    try {
      const validationErrors = TableConfig.validateParams(params);
      if (!this.validateAndHandleErrors(container, validationErrors)) {
        return;
      }

      const loadingDiv = this.showLoadingIndicator(container);
      if (this.handleEmptyData(container, logData, params.exercise, onRefresh)) {
        loadingDiv.remove();
        return;
      }

      const dataToProcess = await TableDataLoader.getOptimizedCSVData(
        params,
        this.plugin,
      );

      const filterResult = this.filterData(dataToProcess, params);

      if (filterResult.filteredData.length === 0) {
        loadingDiv.remove();
        this.handleNoFilteredData(
          container,
          params,
          filterResult.titlePrefix,
          VIEW_TYPES.TABLE,
        );
        return;
      }

      loadingDiv.remove();

      const tableData = await TableDataProcessor.processTableData(
        filterResult.filteredData,
        params,
        this.plugin,
      );

      this.renderTableContentOptimized(container, tableData, () => {
        void onRefresh();
      });
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj);
    }
  }

  private renderTableContentOptimized(
    container: HTMLElement,
    tableData: TableData,
    onRefresh: () => void,
  ): void {
    const { headers, rows, filterResult, params } = tableData;

    container.empty();

    const renderChild = new TableRenderChild(container);
    this.renderChildren.push(renderChild);

    const fragment = document.createDocumentFragment();
    const contentDiv = fragment.appendChild(document.createElement("div"));
    const signal = renderChild.getSignal();

    // Render action buttons (Add Log + Goto Exercise)
    if (params.showAddButton !== false) {
      this.renderActionButtons(
        contentDiv,
        params,
        filterResult,
        onRefresh,
        signal,
      );
    }

    // Render target header with progress bar
    TargetHeader.render(contentDiv, {
      targetWeight: params.targetWeight,
      targetReps: params.targetReps,
      filteredData: filterResult.filteredData,
    });

    // Render achievement badge if applicable
    if (
      params.targetWeight !== undefined &&
      params.targetReps !== undefined &&
      params.exercise
    ) {
      this.renderAchievementBadgeWithCallbacks(
        contentDiv,
        params,
        filterResult.filteredData,
        container,
        signal,
      );
    }

    // Render the table
    const tableContainer = TableRenderer.createTableContainer(contentDiv);
    const tableSuccess = TableRenderer.renderTable(
      tableContainer,
      headers,
      rows,
      params,
      filterResult.filteredData,
      this.plugin,
      onRefresh,
      signal,
    );

    if (!tableSuccess) {
      TableRenderer.renderFallbackMessage(
        tableContainer,
        "Error in table rendering",
      );
    }

    container.appendChild(fragment);
    renderChild.load();
  }

  /**
   * Renders the Add Log and Goto Exercise buttons
   */
  private renderActionButtons(
    contentDiv: HTMLElement,
    params: EmbeddedTableParams,
    filterResult: { filteredData: WorkoutLogData[] },
    onRefresh: () => void,
    signal: AbortSignal,
  ): void {
    const activeView =
      this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    const currentPageLink = activeView?.file
      ? `[[${activeView.file.basename}]]`
      : "";
    const exerciseName =
      params.exercise || CONSTANTS.WORKOUT.MODAL.SECTIONS.WORKOUT;

    const buttonContainer = Button.createContainer(contentDiv);
    buttonContainer.addClass("workout-add-log-button-container");

    const latestEntry =
      filterResult.filteredData.length > 0
        ? filterResult.filteredData[0]
        : undefined;

    LogCallouts.renderAddLogButton(
      buttonContainer,
      exerciseName,
      currentPageLink,
      this.plugin,
      onRefresh,
      signal,
      latestEntry,
    );

    if (params.exercise) {
      GoToExerciseButton.render(
        buttonContainer,
        { exerciseName: params.exercise, app: this.plugin.app },
        signal,
      );
    }
  }

  /**
   * Renders achievement badge with callbacks wired to plugin settings and refresh
   */
  private renderAchievementBadgeWithCallbacks(
    contentDiv: HTMLElement,
    params: EmbeddedTableParams,
    filteredData: WorkoutLogData[],
    tableContainer: HTMLElement,
    signal: AbortSignal,
  ): void {
    const { targetWeight, targetReps, exercise } = params;

    if (targetWeight === undefined || targetReps === undefined || !exercise) {
      return;
    }

    const dismissedWeight = this.plugin.settings.achievedTargets[exercise];
    const isDismissedForWeight = dismissedWeight === targetWeight;

    AchievementBadge.render(
      contentDiv,
      {
        exercise,
        targetWeight,
        targetReps,
        filteredData,
        weightIncrement: this.plugin.settings.weightIncrement,
        isDismissedForWeight,
      },
      {
        onDismiss: async () => {
          this.plugin.settings.achievedTargets[exercise] = targetWeight;
          await this.plugin.saveSettings();
        },
        onUpdateTarget: async (newWeight: number) => {
          const success = await CodeBlockEditorService.updateTargetWeight(
            this.plugin.app,
            exercise,
            newWeight,
          );
          if (success) {
            await this.refreshTable(tableContainer, {
              ...params,
              targetWeight: newWeight,
            });
          }
        },
      },
      signal,
    );
  }

  public async refreshTable(
    container: HTMLElement,
    params: EmbeddedTableParams,
  ): Promise<void> {
    await TableRefresh.refreshTable(
      this.plugin,
      container,
      params,
      async (c, logData, p) => {
        const onRefresh = async () => {
          await this.refreshTable(c, p);
        };
        await this.renderTable(c, logData, p, onRefresh);
      },
      this.callbacks,
    );
  }

  /**
   * Cleanup method to be called during plugin unload
   */
  public cleanup(): void {
    try {
      this.logDebug("EmbeddedTableView", "Cleaning up table view resources");

      for (const renderChild of this.renderChildren) {
        try {
          renderChild.unload();
        } catch {
          // Continue cleanup even if individual unload fails
        }
      }

      this.renderChildren = [];

      this.logDebug("EmbeddedTableView", "Table view cleanup completed");
    } catch {
      // Silently fail cleanup
    }
  }
}

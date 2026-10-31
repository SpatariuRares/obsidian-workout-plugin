import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { MarkdownView, MarkdownRenderChild } from "obsidian";
import { TableRenderer } from "@app/features/tables/components/TableRenderer";
import { TableDataProcessor } from "@app/features/tables/business/TableDataProcessor";
import { tableBlock } from "@app/features/tables/tableBlock";
import { ExerciseActionSelect } from "@app/features/tables/ui/ExerciseActionSelect";
import { TargetHeader } from "@app/features/tables/ui/TargetHeader";
import { AchievementBadge } from "@app/features/tables/ui/AchievementBadge";
import {
  EmbeddedTableParams,
  TableData,
} from "@app/features/tables/types";
import { LogCallouts } from "@app/features/modals/log/LogCallouts";
import { BaseView } from "@app/features/common/views/BaseView";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { CodeBlockEditorService } from "@app/services/editor/CodeBlockEditorService";
import { Button } from "@app/components";
import { NextSetRow } from "@app/features/tables/ui/NextSetRow";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import { t } from "@app/i18n";

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
  private renderChildren: Map<HTMLElement, TableRenderChild> =
    new Map();

  constructor(plugin: WorkoutPluginContext) {
    super(plugin);
  }

  /**
   * @param pageLink - Wiki link to the note containing the code block,
   * used as the origin of logs added from this table
   */
  async createTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams,
    pageLink = "",
  ): Promise<void> {
    await this.renderTable(container, logData, params, pageLink);
  }

  private async renderTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams,
    pageLink: string,
  ): Promise<void> {
    try {
      const loadingDiv = this.showLoadingIndicator(container);
      // Use global refresh for the "create first log" button so all views update
      if (
        this.handleEmptyData(
          container,
          logData,
          params.exercise,
          pageLink || undefined,
          params.id,
        )
      ) {
        loadingDiv.remove();
        return;
      }

      const dataParams: EmbeddedTableParams = {
        ...tableBlock.defaults,
        ...params,
      };

      const filterResult = this.filterData(logData, dataParams);

      if (filterResult.filteredData.length === 0) {
        loadingDiv.remove();
        const renderChild = this.createRenderChild(container);
        this.handleNoFilteredData(
          container,
          params,
          filterResult.titlePrefix,
          VIEW_TYPES.TABLE,
        );
        await this.renderNextSet(
          container,
          params,
          pageLink,
          renderChild.getSignal(),
        );
        renderChild.load();
        return;
      }

      loadingDiv.remove();

      const tableData = await TableDataProcessor.processTableData(
        filterResult.filteredData,
        dataParams,
        this.plugin,
      );

      await this.renderTableContentOptimized(
        container,
        { ...tableData, params },
        pageLink,
      );
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.handleError(container, errorObj);
    }
  }

  private async renderTableContentOptimized(
    container: HTMLElement,
    tableData: TableData,
    pageLink: string,
  ): Promise<void> {
    const { headers, rows, filterResult, params } = tableData;

    const renderChild = this.createRenderChild(container);

    const contentDiv = container.createDiv({
      cls: "workout-table-content-container",
    });
    const signal = renderChild.getSignal();

    // Render action buttons (Add Log + Goto Exercise)
    if (params.showAddButton !== false) {
      this.renderActionButtons(
        contentDiv,
        params,
        filterResult,
        signal,
        pageLink,
      );
    }

    // Render target header with progress bar
    TargetHeader.render(contentDiv, {
      targetWeight: params.targetWeight,
      targetReps: params.targetReps,
      filteredData: filterResult.filteredData,
      weightUnit: this.plugin.settings.weightUnit,
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
        this.plugin.settings.weightUnit,
        pageLink,
      );
    }

    // Render the table
    const tableContainer =
      TableRenderer.createTableContainer(contentDiv);
    const tableSuccess = TableRenderer.renderTable(
      tableContainer,
      headers,
      rows,
      params,
      filterResult.filteredData,
      this.plugin,
      signal,
    );

    if (!tableSuccess) {
      TableRenderer.renderFallbackMessage(
        tableContainer,
        t("messages.errors.tableRenderError"),
      );
    }

    await this.renderNextSet(contentDiv, params, pageLink, signal);
    renderChild.load();
  }

  private createRenderChild(
    container: HTMLElement,
  ): TableRenderChild {
    this.unloadRenderChild(container);
    container.empty();
    const child = new TableRenderChild(container);
    this.renderChildren.set(container, child);
    return child;
  }

  private async renderNextSet(
    container: HTMLElement,
    params: EmbeddedTableParams,
    pageLink: string,
    signal: AbortSignal,
  ): Promise<void> {
    if (params.showAddButton !== false && params.exercise) {
      const link = pageLink || this.getActivePageLink();
      await NextSetRow.render(
        container,
        this.plugin,
        params.exercise,
        params.workout || link.replace(/^\[\[|\]\]$/g, ""),
        link,
        signal,
      );
    }
  }

  /**
   * Renders the Add Log and Goto Exercise buttons
   */
  private renderActionButtons(
    contentDiv: HTMLElement,
    params: EmbeddedTableParams,
    filterResult: { filteredData: WorkoutLogData[] },
    signal: AbortSignal,
    pageLink: string,
  ): void {
    const currentPageLink = pageLink || this.getActivePageLink();
    const exerciseName =
      params.exercise || t("modal.sections.workout");

    const buttonContainer = Button.createContainer(contentDiv);
    buttonContainer.addClass("workout-add-log-button-container");

    const latestEntry = params.exercise
      ? new TrainingHistory(filterResult.filteredData).lastSet(
          params.exercise,
        )
      : undefined;

    LogCallouts.renderAddLogButton(
      buttonContainer,
      exerciseName,
      currentPageLink,
      this.plugin,
      signal,
      latestEntry,
    );

    if (params.exercise) {
      ExerciseActionSelect.render(
        buttonContainer,
        {
          exerciseName: params.exercise,
          app: this.plugin.app,
          plugin: this.plugin,
          params,
        },
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
    weightUnit: string,
    pageLink: string,
  ): void {
    const { targetWeight, targetReps, exercise } = params;

    if (
      targetWeight === undefined ||
      targetReps === undefined ||
      !exercise
    ) {
      return;
    }

    const dismissedWeight =
      this.plugin.settings.achievedTargets[exercise];
    const isDismissedForWeight = dismissedWeight === targetWeight;

    AchievementBadge.render(
      contentDiv,
      {
        app: this.plugin.app,
        exercise,
        targetWeight,
        targetReps,
        filteredData,
        weightIncrement: this.plugin.settings.weightIncrement,
        isDismissedForWeight,
        weightUnit,
      },
      {
        onDismiss: async () => {
          this.plugin.settings.achievedTargets[exercise] =
            targetWeight;
          await this.plugin.saveSettings();
        },
        onUpdateTarget: async (newWeight: number) => {
          const success = await CodeBlockEditorService.patchCodeBlock(
            this.plugin.app,
            tableBlock,
            params.id ? { id: params.id } : { exercise },
            { targetWeight: newWeight },
          );
          if (success) {
            await this.refreshTable(
              tableContainer,
              { ...params, targetWeight: newWeight },
              pageLink,
            );
          }
        },
      },
      signal,
    );
  }

  public async refreshTable(
    container: HTMLElement,
    params: EmbeddedTableParams,
    pageLink = "",
  ): Promise<void> {
    try {
      const logData = await this.plugin.getWorkoutLogData();
      await this.renderTable(container, logData, params, pageLink);
    } catch (error) {
      this.handleError(
        container,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // Fallback for callers that don't know the source note
  private getActivePageLink(): string {
    const activeView =
      this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    return activeView?.file ? `[[${activeView.file.basename}]]` : "";
  }

  /**
   * Cleanup method to be called during plugin unload
   */
  public cleanup(): void {
    try {
      for (const renderChild of this.renderChildren.values()) {
        try {
          renderChild.unload();
        } catch {
          // Continue cleanup even if individual unload fails
        }
      }

      this.renderChildren.clear();
    } catch {
      // Silently fail cleanup
    }
  }

  private unloadRenderChild(container: HTMLElement): void {
    const existingChild = this.renderChildren.get(container);
    if (!existingChild) return;

    try {
      existingChild.unload();
    } catch {
      // Continue rendering even if cleanup fails
    }
    this.renderChildren.delete(container);
  }
}

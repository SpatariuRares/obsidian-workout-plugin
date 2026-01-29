import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { MarkdownView, MarkdownRenderChild } from "obsidian";
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
    onRefresh: () => Promise<void>,
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

    // Create a TableRenderChild for managing event listener lifecycle
    const renderChild = new TableRenderChild(container);
    this.renderChildren.push(renderChild);

    const fragment = document.createDocumentFragment();
    const contentDiv = fragment.appendChild(document.createElement("div"));

    if (params.showAddButton !== false) {
      const activeView =
        this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      const currentPageLink = activeView?.file
        ? `[[${activeView.file.basename}]]`
        : "";
      const exerciseName =
        params.exercise || CONSTANTS.WORKOUT.MODAL.SECTIONS.WORKOUT;

      const buttonContainer = contentDiv.createDiv({
        cls: "add-log-button-container",
      });

      // Get latest entry to pre-fill the form if available
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
        renderChild.getSignal(),
        latestEntry,
      );
    }

    // Render target header if targetWeight or targetReps is set
    this.renderTargetHeader(
      contentDiv,
      params,
      filterResult.filteredData,
      renderChild.getSignal(),
    );

    // Render achievement badge if target is achieved
    if (
      params.targetWeight !== undefined &&
      params.targetReps !== undefined &&
      params.exercise
    ) {
      this.renderAchievementBadge(
        contentDiv,
        params,
        filterResult.filteredData,
        renderChild.getSignal(),
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
      onRefresh,
      renderChild.getSignal(),
    );

    if (!tableSuccess) {
      TableRenderer.renderFallbackMessage(
        tableContainer,
        "Error in table rendering",
      );
    }

    container.appendChild(fragment);

    // Load the render child to activate event listeners
    renderChild.load();
  }

  private renderTargetHeader(
    container: HTMLElement,
    params: EmbeddedTableParams,
    filteredData: WorkoutLogData[],
    signal?: AbortSignal,
  ): void {
    const { targetWeight, targetReps } = params;

    // Only render if at least one target is set
    if (targetWeight === undefined && targetReps === undefined) {
      return;
    }

    const targetDiv = container.createDiv({ cls: "workout-target-header" });

    // Build the target text
    const parts: string[] = [];
    if (targetWeight !== undefined) {
      parts.push(`${targetWeight}kg`);
    }
    if (targetReps !== undefined) {
      const separator = targetWeight !== undefined ? " × " : "";
      parts.push(`${separator}${targetReps} reps`);
    }

    const targetText = `${CONSTANTS.WORKOUT.LABELS.TABLE.TARGET_PREFIX} ${parts.join("")}`;
    const targetTextSpan = targetDiv.createSpan({ cls: "workout-target-text" });
    targetTextSpan.textContent = targetText;

    // Render progress bar if both targetWeight and targetReps are set
    if (targetWeight !== undefined && targetReps !== undefined) {
      this.renderProgressBar(targetDiv, params, filteredData);
    }
  }

  private renderProgressBar(
    container: HTMLElement,
    params: EmbeddedTableParams,
    filteredData: WorkoutLogData[],
  ): void {
    const { targetWeight, targetReps } = params;

    if (targetWeight === undefined || targetReps === undefined) {
      return;
    }

    // Calculate progress: find best reps at target weight
    const bestReps = this.calculateBestRepsAtWeight(targetWeight, filteredData);

    if (bestReps === 0) {
      // No data at target weight yet
      return;
    }

    const progressPercent = Math.min((bestReps / targetReps) * 100, 100);

    // Create progress bar container
    const progressContainer = container.createDiv({
      cls: "workout-progress-container",
    });

    // Create progress bar background
    const progressBar = progressContainer.createDiv({
      cls: "workout-progress-bar",
    });

    // Create progress fill with color coding
    const progressFill = progressBar.createDiv({
      cls: "workout-progress-fill",
    });
    progressFill.style.width = `${progressPercent}%`;

    // Apply color coding based on progress
    if (progressPercent >= 100) {
      progressFill.addClass("workout-progress-complete");
    } else if (progressPercent >= 90) {
      progressFill.addClass("workout-progress-high");
    } else if (progressPercent >= 50) {
      progressFill.addClass("workout-progress-medium");
    } else {
      progressFill.addClass("workout-progress-low");
    }

    // Add tooltip
    const tooltip = `Best: ${bestReps} reps / Target: ${targetReps} reps`;
    progressBar.setAttribute("title", tooltip);
    progressBar.setAttribute("aria-label", tooltip);
  }

  private calculateBestRepsAtWeight(
    targetWeight: number,
    filteredData: WorkoutLogData[],
  ): number {
    try {
      // Find all entries at target weight
      const entriesAtTargetWeight = filteredData.filter(
        (entry) => entry.weight === targetWeight,
      );

      if (entriesAtTargetWeight.length === 0) {
        return 0;
      }

      // Find the best (maximum) reps at target weight
      const bestReps = Math.max(
        ...entriesAtTargetWeight.map((entry) => entry.reps),
      );
      return bestReps;
    } catch {
      return 0;
    }
  }

  public async refreshTable(
    container: HTMLElement,
    params: EmbeddedTableParams,
  ): Promise<void> {
    try {
      this.plugin.clearLogDataCache();

      const freshLogData = await this.plugin.getWorkoutLogData();
      const onRefresh = async () => {
        await this.refreshTable(container, params);
      };

      await this.renderTable(container, freshLogData, params, onRefresh);

      this.callbacks.onSuccess?.(
        CONSTANTS.WORKOUT.TABLE.MESSAGES.REFRESH_SUCCESS,
      );
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.callbacks.onError?.(errorObj, "refreshing table");
    }
  }

  private renderAchievementBadge(
    container: HTMLElement,
    params: EmbeddedTableParams,
    filteredData: WorkoutLogData[],
    signal?: AbortSignal,
  ): void {
    const { targetWeight, targetReps, exercise } = params;

    if (targetWeight === undefined || targetReps === undefined || !exercise) {
      return;
    }

    // Check if target is achieved
    const isAchieved = this.checkTargetAchieved(
      targetWeight,
      targetReps,
      filteredData,
    );

    if (!isAchieved) {
      return;
    }

    // Generate a unique key for this achievement: exercise name + target weight
    // This way, the achievement reappears when targetWeight changes
    const achievementKey = `${exercise}:${targetWeight}`;
    const dismissedWeight = this.plugin.settings.achievedTargets[exercise];

    // Don't show badge if it was dismissed for this specific target weight
    if (dismissedWeight === targetWeight) {
      return;
    }

    // Create achievement badge
    const badgeDiv = container.createDiv({ cls: "workout-achievement-badge" });

    const badgeText = badgeDiv.createSpan({ cls: "workout-achievement-text" });
    badgeText.textContent = CONSTANTS.WORKOUT.MODAL.NOTICES.TARGET_ACHIEVED;

    // Render weight suggestion next to achievement text
    this.renderWeightSuggestion(badgeDiv, params, container, signal);

    // Add dismiss button
    const dismissButton = badgeDiv.createEl("button", {
      cls: "workout-achievement-dismiss",
    });
    dismissButton.textContent = "×";
    dismissButton.setAttribute("aria-label", "Dismiss achievement");

    dismissButton.addEventListener(
      "click",
      async () => {
        // Store the target weight when dismissed
        this.plugin.settings.achievedTargets[exercise] = targetWeight;
        await this.plugin.saveSettings();
        badgeDiv.remove();
      },
      signal ? { signal } : undefined,
    );
  }

  private renderWeightSuggestion(
    badgeDiv: HTMLElement,
    params: EmbeddedTableParams,
    tableContainer: HTMLElement,
    signal?: AbortSignal,
  ): void {
    const { targetWeight } = params;

    if (targetWeight === undefined) {
      return;
    }

    const weightIncrement = this.plugin.settings.weightIncrement;
    const suggestedWeight = targetWeight + weightIncrement;

    // Create suggestion container
    const suggestionDiv = badgeDiv.createDiv({
      cls: "workout-weight-suggestion",
    });

    const suggestionText = suggestionDiv.createSpan({
      cls: "workout-suggestion-text",
    });
    suggestionText.textContent = `${CONSTANTS.WORKOUT.MODAL.NOTICES.SUGGESTED_NEXT_WEIGHT} ${suggestedWeight}kg`;

    // Create update button
    const updateButton = suggestionDiv.createEl("button", {
      cls: "workout-update-target-button",
    });
    updateButton.textContent =
      CONSTANTS.WORKOUT.MODAL.BUTTONS.UPDATE_TARGET_WEIGHT;

    updateButton.addEventListener(
      "click",
      async () => {
        const confirmed = confirm(
          `${CONSTANTS.WORKOUT.MODAL.NOTICES.CONFIRM_UPDATE_TARGET} ${suggestedWeight}kg?`,
        );

        if (confirmed) {
          await this.updateTargetWeight(
            params,
            suggestedWeight,
            tableContainer,
          );
        }
      },
      signal ? { signal } : undefined,
    );
  }

  private async updateTargetWeight(
    params: EmbeddedTableParams,
    newWeight: number,
    tableContainer: HTMLElement,
  ): Promise<void> {
    try {
      // Get the active markdown view
      const activeView =
        this.plugin.app.workspace.getActiveViewOfType(MarkdownView);

      if (!activeView) {
        return;
      }

      const editor = activeView.editor;
      const content = editor.getValue();

      // Find the code block with the current parameters
      // We need to update the targetWeight parameter in the code block
      const lines = content.split("\n");
      let inCodeBlock = false;
      let codeBlockStart = -1;
      let codeBlockEnd = -1;
      let foundTargetWeight = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("```workout-log")) {
          inCodeBlock = true;
          codeBlockStart = i;
          continue;
        }

        if (inCodeBlock && line.startsWith("```")) {
          codeBlockEnd = i;
          // Check if we found the targetWeight in this code block
          if (foundTargetWeight) {
            break;
          }
          // Reset for next code block
          inCodeBlock = false;
          codeBlockStart = -1;
          foundTargetWeight = false;
          continue;
        }

        if (inCodeBlock && line.startsWith("targetWeight:")) {
          // Check if this is the right code block by matching exercise name
          const exerciseLineIndex = lines
            .slice(codeBlockStart, i)
            .findIndex((l) => l.trim().startsWith("exercise:"));

          if (exerciseLineIndex !== -1) {
            const exerciseLine =
              lines[codeBlockStart + exerciseLineIndex].trim();
            const exerciseMatch = exerciseLine.match(/exercise:\s*(.+)/);

            if (
              exerciseMatch &&
              params.exercise &&
              exerciseMatch[1].trim() === params.exercise
            ) {
              foundTargetWeight = true;
              // Update this line
              lines[i] = lines[i].replace(
                /targetWeight:\s*\d+(\.\d+)?/,
                `targetWeight: ${newWeight}`,
              );
            }
          }
        }
      }

      if (foundTargetWeight) {
        // Update the editor content
        editor.setValue(lines.join("\n"));

        // Refresh the table to show updated target
        await this.refreshTable(tableContainer, {
          ...params,
          targetWeight: newWeight,
        });
      }
    } catch {
      return;
    }
  }

  private checkTargetAchieved(
    targetWeight: number,
    targetReps: number,
    filteredData: WorkoutLogData[],
  ): boolean {
    try {
      // Get the latest entry (filteredData is sorted by date descending in most cases)
      // Find entries at target weight
      const entriesAtTargetWeight = filteredData.filter(
        (entry) => entry.weight === targetWeight,
      );

      if (entriesAtTargetWeight.length === 0) {
        return false;
      }

      // Get the most recent entry at target weight
      const sortedEntries = entriesAtTargetWeight.sort((a, b) => {
        const dateA = a.timestamp || new Date(a.date).getTime();
        const dateB = b.timestamp || new Date(b.date).getTime();
        return dateB - dateA; // Most recent first
      });

      const latestEntry = sortedEntries[0];

      // Check if latest entry meets or exceeds target reps
      return latestEntry.reps >= targetReps;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup method to be called during plugin unload
   * Aborts all AbortControllers from TableRenderChild instances to clean up event listeners
   * and clears internal state to prevent memory leaks
   */
  public cleanup(): void {
    try {
      this.logDebug("EmbeddedTableView", "Cleaning up table view resources");

      // Unload all TableRenderChild instances - this will abort all their AbortControllers
      for (const renderChild of this.renderChildren) {
        try {
          renderChild.unload();
        } catch {
          return;
        }
      }

      // Clear the renderChildren array to release references
      this.renderChildren = [];

      this.logDebug("EmbeddedTableView", "Table view cleanup completed");
    } catch {
      return;
    }
  }
}

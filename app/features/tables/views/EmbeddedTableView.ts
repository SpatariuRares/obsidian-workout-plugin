import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { MarkdownView } from "obsidian";
import { TableRenderer } from "@app/features/tables/components/TableRenderer";
import { TableDataProcessor } from "@app/features/tables/business/TableDataProcessor";
import { tableBlock } from "@app/features/tables/tableBlock";
import { ExerciseActionSelect } from "@app/features/tables/ui/ExerciseActionSelect";
import { renderTargetSection } from "@app/features/tables/ui/TargetSection";
import type { BlockMenuAction } from "@app/features/common/ui/BlockMenu";
import {
  EmbeddedTableParams,
  TableData,
} from "@app/features/tables/types";
import { LogCallouts } from "@app/features/modals/log/LogCallouts";
import { BaseView } from "@app/features/common/views/BaseView";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { BlockCard } from "@app/components/molecules/BlockCard";
import { Button } from "@app/components";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import { t } from "@app/i18n";
import { PathUtils } from "@app/utils/PathUtils";

/** Where a table is written: its note, and the edit action for its ⋮ menu */
interface TableWhere {
  sourcePath: string;
  editAction?: BlockMenuAction;
}

export class EmbeddedTableView extends BaseView {
  /** Aborts the listeners of each table's last draw */
  private signals = new Map<HTMLElement, AbortController>();

  /**
   * @param sourcePath - The note containing the code block: the origin of
   * logs added from this table
   * @param editAction - The block's edit action (CodeBlockProcessorService), in its ⋮ menu
   */
  async createTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams,
    sourcePath = "",
    editAction?: BlockMenuAction,
  ): Promise<void> {
    await this.renderTable(container, logData, params, { sourcePath, editAction });
  }

  private async renderTable(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedTableParams,
    where: TableWhere,
  ): Promise<void> {
    try {
      const loadingDiv = this.showLoadingIndicator(container);
      // Use global refresh for the "create first log" button so all views update
      if (
        this.handleEmptyData(
          container,
          logData,
          params.exercise,
          where.sourcePath || undefined,
          where.editAction,
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
        if (params.exercise) {
          this.renderEmptyExerciseTable(container, params, logData, where);
          return;
        }
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
        dataParams,
        this.plugin,
      );

      this.renderTableContentOptimized(
        container,
        { ...tableData, params },
        where,
      );
    } catch (error) {
      this.handleError(container, error);
    }
  }

  private renderTableContentOptimized(
    container: HTMLElement,
    tableData: TableData,
    where: TableWhere,
  ): void {
    const { headers, rows, filterResult, params } = tableData;

    const signal = this.newSignal(container);
    const card = this.renderCard(container, params, where, signal);
    if (params.showAddButton !== false) {
      this.renderAddLog(card, params, filterResult.filteredData, signal, where);
    }

    // Target with its progress bar, and the badge once it is reached
    renderTargetSection(
      card,
      {
        plugin: this.plugin,
        params,
        schema: tableBlock,
        sourcePath: where.sourcePath,
        sets: filterResult.filteredData,
        onTargetUpdated: (updated) =>
          this.refreshTable(container, updated, where.sourcePath, where.editAction),
      },
      signal,
    );

    const tableContainer = TableRenderer.createTableContainer(card);
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

  }

  /**
   * An exercise table with no set in its filter: the same Add log button and
   * menu as a filled table, prefilled from the last set in the whole history,
   * so the next set is one tap. When only the date range hides the sets
   * (e.g. nothing logged today) it says no set matches yet; when nothing
   * matches the block at all (this exercise never logged in this workout)
   * the button reads "Create first log" and there is no message.
   */
  private renderEmptyExerciseTable(
    container: HTMLElement,
    params: EmbeddedTableParams,
    logData: WorkoutLogData[],
    where: TableWhere,
  ): void {
    const signal = this.newSignal(container);
    const card = this.renderCard(container, params, where, signal);

    const showAddButton = params.showAddButton !== false;
    const firstLog =
      showAddButton &&
      this.filterData(logData, { ...params, dateRange: undefined })
        .filteredData.length === 0;

    if (showAddButton) {
      this.renderAddLog(card, params, logData, signal, where, firstLog);
    }
    if (!firstLog) {
      LogCallouts.renderNoMatchMessage(card);
    }
  }

  /**
   * The block's card, with its top row: the exercise (else the workout) and,
   * always in the top right corner, the ⋮ menu: go to the exercise and edit
   * this block (only edit when the block names no exercise).
   */
  private renderCard(
    container: HTMLElement,
    params: EmbeddedTableParams,
    where: TableWhere,
    signal: AbortSignal,
  ): HTMLElement {
    container.empty();
    const { el, header } = BlockCard.create(container, {
      title: params.exercise || params.workout,
      className: "workout-log",
    });
    ExerciseActionSelect.render(
      header,
      { exerciseName: params.exercise ?? "", plugin: this.plugin, edit: where.editAction },
      signal,
    );
    return el;
  }

  /**
   * The row under the title: Add log, prefilled from the exercise's last set.
   * On top, not at the end: a new set shows up as the table's first row
   * @param sets - The sets the prefill is taken from
   * @param firstLog - Nothing logged for the block yet: "Create first log"
   */
  private renderAddLog(
    card: HTMLElement,
    params: EmbeddedTableParams,
    sets: WorkoutLogData[],
    signal: AbortSignal,
    where: TableWhere,
    firstLog = false,
  ): void {
    const currentPageLink =
      PathUtils.toWikiLink(where.sourcePath) || this.getActivePageLink();
    const latestEntry = params.exercise
      ? new TrainingHistory(sets).lastSet(params.exercise)
      : undefined;

    const actions = Button.createContainer(card);
    actions.addClass("workout-log-actions");
    LogCallouts.renderAddLogButton(
      actions,
      params.exercise || t("modal.sections.workout"),
      currentPageLink,
      this.plugin,
      signal,
      latestEntry,
      firstLog,
    );
  }

  public async refreshTable(
    container: HTMLElement,
    params: EmbeddedTableParams,
    sourcePath = "",
    editAction?: BlockMenuAction,
  ): Promise<void> {
    try {
      const logData = await this.plugin.getWorkoutLogData();
      await this.renderTable(container, logData, params, { sourcePath, editAction });
    } catch (error) {
      this.handleError(container, error);
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
    for (const controller of this.signals.values()) controller.abort();
    this.signals.clear();
  }

  /** Ends the listeners of the table's previous draw; the signal is for this one's */
  private newSignal(container: HTMLElement): AbortSignal {
    this.signals.get(container)?.abort();
    const controller = new AbortController();
    this.signals.set(container, controller);
    return controller.signal;
  }
}

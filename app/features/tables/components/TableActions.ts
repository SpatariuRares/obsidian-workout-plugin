import { CONSTANTS } from "@app/constants/Constants";
import { Notice } from "obsidian";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { EditLogModal } from "@app/features/modals/EditLogModal";
import { ConfirmModal } from "@app/features/modals/ConfirmModal";
import { ActionButtons } from "@app/features/tables/ui";

/**
 * Handles actions for table rows (edit, delete)
 * Business logic layer that uses UI components from table/ui
 */
export class TableActions {
  /**
   * Handle edit action for a workout log entry
   */
  static handleEdit(
    log: WorkoutLogData,
    plugin: WorkoutChartsPlugin,
    onComplete?: () => void,
  ): void {
    const modal = new EditLogModal(plugin.app, plugin, log, () => {
      plugin.triggerWorkoutLogRefresh();
      onComplete?.();
    });
    modal.open();
  }

  /**
   * Handle delete action for a workout log entry
   */
  static handleDelete(
    log: WorkoutLogData,
    plugin: WorkoutChartsPlugin,
    onComplete?: () => void,
  ): void {
    const modal = new ConfirmModal(
      plugin.app,
      CONSTANTS.WORKOUT.TABLE.MESSAGES.DELETE_CONFIRM,
      () => {
        void (async () => {
          try {
            await plugin.deleteWorkoutLogEntry(log);
            new Notice(CONSTANTS.WORKOUT.TABLE.MESSAGES.DELETE_SUCCESS);
            plugin.triggerWorkoutLogRefresh();
            onComplete?.();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            new Notice(
              CONSTANTS.WORKOUT.TABLE.MESSAGES.DELETE_ERROR + errorMessage,
            );
          }
        })();
      },
    );
    modal.open();
  }

  /**
   * Render action buttons (edit and delete) for a table row
   * Delegates UI creation to ActionButtons component
   */
  static renderActionButtons(
    td: HTMLElement,
    originalLog: WorkoutLogData | undefined,
    plugin?: WorkoutChartsPlugin,
    onRefresh?: () => void,
  ): void {
    if (!originalLog || !plugin) {
      return;
    }

    // Use UI component to create buttons
    const { editBtn, deleteBtn } =
      ActionButtons.createActionButtonsContainer(td);

    // Add event listeners with business logic
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleEdit(originalLog, plugin, onRefresh);
    });

    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleDelete(originalLog, plugin, onRefresh);
    });
  }
}

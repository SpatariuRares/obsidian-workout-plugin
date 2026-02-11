import { CONSTANTS } from "@app/constants";
import { Notice } from "obsidian";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { EditLogModal } from "@app/features/modals/log/EditLogModal";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import { ActionButtons } from "@app/features/tables/ui";
import { ErrorUtils } from "@app/utils/ErrorUtils";

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
  ): void {
    const modal = new EditLogModal(plugin.app, plugin, log, (ctx) => {
      plugin.triggerWorkoutLogRefresh(ctx);
    });
    modal.open();
  }

  /**
   * Handle delete action for a workout log entry
   */
  static handleDelete(
    log: WorkoutLogData,
    plugin: WorkoutChartsPlugin,
  ): void {
    const modal = new ConfirmModal(
      plugin.app,
      CONSTANTS.WORKOUT.TABLE.MESSAGES.DELETE_CONFIRM,
      () => {
        void (async () => {
          try {
            await plugin.deleteWorkoutLogEntry(log);
            new Notice(CONSTANTS.WORKOUT.TABLE.MESSAGES.DELETE_SUCCESS);
            plugin.triggerWorkoutLogRefresh({
              exercise: log.exercise,
              workout: log.workout,
            });
          } catch (error) {
            const errorMessage =
              ErrorUtils.getErrorMessage(error);
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
    signal?: AbortSignal
  ): void {
    if (!originalLog || !plugin) {
      return;
    }

    // Use UI component to create buttons
    const { editBtn, deleteBtn } =
      ActionButtons.createActionButtonsContainer(td);

    // Add event listeners with business logic, using AbortSignal for cleanup
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleEdit(originalLog, plugin);
    }, signal ? { signal } : undefined);

    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleDelete(originalLog, plugin);
    }, signal ? { signal } : undefined);
  }
}

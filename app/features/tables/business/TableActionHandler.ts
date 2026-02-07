import { CONSTANTS } from "@app/constants";
import { Notice } from "obsidian";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { EditLogModal } from "@app/features/modals/log/EditLogModal";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";

/**
 * Orchestrates edit/delete actions for workout log entries.
 * Opens modals, executes plugin operations, and notifies results.
 */
export class TableActionHandler {
  /**
   * Handle edit action: opens EditLogModal and triggers refresh on completion.
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
   * Handle delete action: opens ConfirmModal, deletes entry, and triggers refresh.
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
}

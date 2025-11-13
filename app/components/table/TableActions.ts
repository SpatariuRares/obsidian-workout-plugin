import { Notice } from "obsidian";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { EditLogModal } from "@app/modals/EditLogModal";
import { ConfirmModal } from "@app/modals/ConfirmModal";
import { TABLE_ICONS, TABLE_MESSAGES } from "@app/constants/TableConstats";

/**
 * Handles actions for table rows (edit, delete)
 * Extracted from TableRenderer for better separation of concerns
 */
export class TableActions {
  /**
   * Handle edit action for a workout log entry
   */
  static handleEdit(
    log: WorkoutLogData,
    plugin: WorkoutChartsPlugin,
    onComplete?: () => void
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
    onComplete?: () => void
  ): void {
    const modal = new ConfirmModal(
      plugin.app,
      TABLE_MESSAGES.DELETE_CONFIRM,
      () => {
        plugin
          .deleteWorkoutLogEntry(log)
          .then(() => {
            new Notice(TABLE_MESSAGES.DELETE_SUCCESS);
            plugin.triggerWorkoutLogRefresh();
            onComplete?.();
          })
          .catch((error) => {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            new Notice(TABLE_MESSAGES.DELETE_ERROR + errorMessage);
          });
      }
    );
    modal.open();
  }

  /**
   * Create edit button element
   */
  static createEditButton(
    container: HTMLElement,
    title = TABLE_MESSAGES.EDIT_TITLE
  ): HTMLElement {
    return container.createEl("button", {
      cls: "workout-table-action-btn workout-table-edit-btn",
      text: TABLE_ICONS.EDIT,
      attr: { title },
    });
  }

  /**
   * Create delete button element
   */
  static createDeleteButton(
    container: HTMLElement,
    title = TABLE_MESSAGES.DELETE_TITLE
  ): HTMLElement {
    return container.createEl("button", {
      cls: "workout-table-action-btn workout-table-delete-btn",
      text: TABLE_ICONS.DELETE,
      attr: { title },
    });
  }

  /**
   * Render action buttons (edit and delete) for a table row
   */
  static renderActionButtons(
    td: HTMLElement,
    originalLog: WorkoutLogData | undefined,
    plugin?: WorkoutChartsPlugin
  ): void {
    if (!originalLog || !plugin) {
      return;
    }

    const actionsContainer = td.createEl("div", {
      cls: "workout-table-actions",
    });

    // Create buttons
    const editBtn = this.createEditButton(actionsContainer);
    const deleteBtn = this.createDeleteButton(actionsContainer);

    // Add event listeners
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleEdit(originalLog, plugin);
    });

    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleDelete(originalLog, plugin);
    });
  }
}

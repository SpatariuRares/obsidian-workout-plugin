import { Platform } from "obsidian";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { EditLogModal } from "@app/features/modals/log/EditLogModal";
import { ActionButtons } from "@app/features/tables/ui/ActionButtons";

/**
 * Handles a table row's action: editing the set (deleting it is done from
 * the edit form). Business logic layer that uses UI components from table/ui
 */
export class TableActions {
  /**
   * Handle edit action for a workout log entry
   */
  static handleEdit(
    log: WorkoutLogData,
    plugin: WorkoutPluginContext,
  ): void {
    const modal = new EditLogModal(plugin.app, plugin, log);
    modal.open();
  }

  /**
   * Render the edit button for a table row. On phones the whole row (a
   * card) also opens the edit form; the button shows that it can.
   */
  static renderActionButtons(
    td: HTMLElement,
    originalLog: WorkoutLogData | undefined,
    plugin?: WorkoutPluginContext,
    signal?: AbortSignal,
  ): void {
    if (!originalLog || !plugin) {
      return;
    }

    const { editBtn } = ActionButtons.createActionButtonsContainer(td);
    const listenerOptions = signal ? { signal } : undefined;

    editBtn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleEdit(originalLog, plugin);
      },
      listenerOptions,
    );

    const row = td.closest("tr");
    if (Platform.isMobile && row) {
      row.classList.add("workout-table-row-tappable");
      row.addEventListener(
        "click",
        (e) => {
          if ((e.target as HTMLElement).closest("button, a")) return;
          this.handleEdit(originalLog, plugin);
        },
        listenerOptions,
      );
    }
  }
}

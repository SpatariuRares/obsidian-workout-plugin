import { ActionButtonGroup } from "@app/components/molecules";
import { t } from "@app/i18n";

/**
 * UI component for creating action buttons (edit, delete, etc.).
 * Pure UI - creates buttons without attaching business logic.
 * Now uses ActionButtonGroup molecule for consistent styling.
 */
export class ActionButtons {
  /**
   * Creates an actions container with edit and delete buttons
   * Uses ActionButtonGroup molecule for consistent button styling
   * @param container - Parent element
   * @returns Object with container and button elements
   */
  static createActionButtonsContainer(container: HTMLElement): {
    container: HTMLElement;
    editBtn: HTMLButtonElement;
    deleteBtn: HTMLButtonElement;
  } {
    return ActionButtonGroup.create(container, {
      editTitle: t("table.editTitle"),
      deleteTitle: t("table.deleteTitle"),
      editIcon: t("icons.tables.edit"),
      deleteIcon: t("icons.tables.delete"),
      className: "workout-table-actions",
    });
  }
}

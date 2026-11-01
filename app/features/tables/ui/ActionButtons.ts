import { Button, BUTTONVARIANT } from "@app/components/atoms";
import { t } from "@app/i18n";
import { TOUR_TARGETS, markTourTarget } from "@app/features/tour/tourTargets";
import { ICONS } from "@app/constants/ui.constants";

/**
 * UI component for a table row's action: the edit button. Deleting a set is
 * done from the edit form, so a row has one action. Pure UI - creates the
 * button without attaching business logic.
 */
export class ActionButtons {
  /**
   * Creates the actions container with the row's edit button
   * @param container - Parent element
   * @returns Object with container and button elements
   */
  static createActionButtonsContainer(container: HTMLElement): {
    container: HTMLElement;
    editBtn: HTMLButtonElement;
  } {
    const actions = Button.createContainer(container);
    actions.classList.add("workout-table-action-button-group", "workout-table-actions");
    const editBtn = Button.create(actions, {
      icon: ICONS.ACTIONS.EDIT,
      className: "workout-table-action-btn workout-table-action-btn-edit",
      title: t("table.editTitle"),
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("table.editTitle"),
    });
    markTourTarget(actions, TOUR_TARGETS.tableRowActions);
    return { container: actions, editBtn };
  }
}

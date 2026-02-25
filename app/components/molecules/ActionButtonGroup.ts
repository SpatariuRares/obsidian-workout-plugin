/**
 * ActionButtonGroup Molecule
 * Group of action buttons (edit + delete)
 * Combines: Button + Container atoms
 */

import { Button } from "@app/components/atoms";
import { t } from "@app/i18n";

export interface ActionButtonGroupProps {
  editTitle?: string;
  deleteTitle?: string;
  editIcon?: string;
  deleteIcon?: string;
  className?: string;
}

export interface ActionButtonGroupResult {
  container: HTMLElement;
  editBtn: HTMLButtonElement;
  deleteBtn: HTMLButtonElement;
}

/**
 * Creates an action button group (edit + delete)
 * Used in: Table rows, item cards, list items
 *
 * @example
 * ```typescript
 * const { editBtn, deleteBtn } = ActionButtonGroup.create(parent, {
 *   editTitle: CONSTANTS.WORKOUT.UI.ACTIONS.EDIT_WORKOUT,
 *   deleteTitle: CONSTANTS.WORKOUT.UI.ACTIONS.DELETE_WORKOUT
 * });
 *
 * Button.onClick(editBtn, () => handleEdit());
 * Button.onClick(deleteBtn, () => handleDelete());
 * ```
 */
export class ActionButtonGroup {
  // Default icons

  /**
   * Create an action button group
   * @param parent - Parent HTML element
   * @param props - Button group properties
   * @returns Object with container and button elements
   */
  static create(
    parent: HTMLElement,
    props?: ActionButtonGroupProps,
  ): ActionButtonGroupResult {
    // Create container
    const container = Button.createContainer(parent);
    container.addClass("workout-table-action-button-group");
    if (props?.className) {
      container.addClass(props.className);
    }

    // Create edit button
    const editBtn = Button.create(container, {
      icon: props?.editIcon || t("icons.actions.edit"),
      className: "workout-table-action-btn workout-table-action-btn-edit",
      title: props?.editTitle || t("general.edit"),
      variant: "secondary",
      ariaLabel: props?.editTitle || t("general.edit"),
    });

    // Create delete button
    const deleteBtn = Button.create(container, {
      icon: props?.deleteIcon || t("icons.actions.delete"),
      className: "workout-table-action-btn workout-table-action-btn-delete",
      variant: "secondary",
      title: props?.deleteTitle || t("general.delete"),
      ariaLabel: props?.deleteTitle || t("general.delete"),
    });

    return {
      container,
      editBtn,
      deleteBtn,
    };
  }
}

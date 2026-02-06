/**
 * ActionButtonGroup Molecule
 * Group of action buttons (edit + delete)
 * Combines: Button + Container atoms
 */

import { CONSTANTS } from "@app/constants";
import { Button } from "@app/components/atoms";

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
  private static readonly DEFAULT_EDIT_ICON =
    CONSTANTS.WORKOUT.ICONS.ACTIONS.EDIT;
  private static readonly DEFAULT_DELETE_ICON =
    CONSTANTS.WORKOUT.ICONS.ACTIONS.DELETE;
  private static readonly DEFAULT_EDIT_TITLE =
    CONSTANTS.WORKOUT.LABELS.ACTIONS.EDIT;
  private static readonly DEFAULT_DELETE_TITLE =
    CONSTANTS.WORKOUT.LABELS.ACTIONS.DELETE;

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
      icon: props?.editIcon || this.DEFAULT_EDIT_ICON,
      className: "workout-table-action-btn workout-table-action-btn-edit",
      title: props?.editTitle || this.DEFAULT_EDIT_TITLE,
      ariaLabel: props?.editTitle || this.DEFAULT_EDIT_TITLE,
    });

    // Create delete button
    const deleteBtn = Button.create(container, {
      icon: props?.deleteIcon || this.DEFAULT_DELETE_ICON,
      className: "workout-table-action-btn workout-table-action-btn-delete",
      title: props?.deleteTitle || this.DEFAULT_DELETE_TITLE,
      ariaLabel: props?.deleteTitle || this.DEFAULT_DELETE_TITLE,
    });

    return {
      container,
      editBtn,
      deleteBtn,
    };
  }
}

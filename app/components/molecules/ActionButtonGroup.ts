/**
 * ActionButtonGroup Molecule
 * Group of action buttons (edit + delete)
 * Combines: Button + Container atoms
 */

import { Button, Container } from "@app/components/atoms";
import { UI_ICONS } from "@app/constants/IconConstants";
import { UI_LABELS } from "@app/constants/LabelConstants";

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
 *   editTitle: "Edit workout",
 *   deleteTitle: "Delete workout"
 * });
 *
 * Button.onClick(editBtn, () => handleEdit());
 * Button.onClick(deleteBtn, () => handleDelete());
 * ```
 */
export class ActionButtonGroup {
	// Default icons
	private static readonly DEFAULT_EDIT_ICON = UI_ICONS.ACTIONS.EDIT;
	private static readonly DEFAULT_DELETE_ICON = UI_ICONS.ACTIONS.DELETE;
	private static readonly DEFAULT_EDIT_TITLE = UI_LABELS.ACTIONS.EDIT;
	private static readonly DEFAULT_DELETE_TITLE = UI_LABELS.ACTIONS.DELETE;

	/**
	 * Create an action button group
	 * @param parent - Parent HTML element
	 * @param props - Button group properties
	 * @returns Object with container and button elements
	 */
	static create(
		parent: HTMLElement,
		props?: ActionButtonGroupProps
	): ActionButtonGroupResult {
		// Create container
		const container = Container.create(parent, {
			className: `action-button-group ${props?.className || ""}`.trim(),
		});

		// Create edit button
		const editBtn = Button.create(container, {
			icon: props?.editIcon || this.DEFAULT_EDIT_ICON,
			className: "action-btn action-btn-edit",
			title: props?.editTitle || this.DEFAULT_EDIT_TITLE,
			ariaLabel: props?.editTitle || this.DEFAULT_EDIT_TITLE,
		});

		// Create delete button
		const deleteBtn = Button.create(container, {
			icon: props?.deleteIcon || this.DEFAULT_DELETE_ICON,
			className: "action-btn action-btn-delete",
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

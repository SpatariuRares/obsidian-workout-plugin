import { TABLE_ICONS, TABLE_MESSAGES } from "@app/constants/TableConstats";
import { ActionButtonGroup } from "@app/components/molecules";

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
		editBtn: HTMLElement;
		deleteBtn: HTMLElement;
	} {
		// Use ActionButtonGroup molecule for edit + delete buttons
		const result = ActionButtonGroup.create(container, {
			editTitle: TABLE_MESSAGES.EDIT_TITLE,
			deleteTitle: TABLE_MESSAGES.DELETE_TITLE,
			editIcon: TABLE_ICONS.EDIT,
			deleteIcon: TABLE_ICONS.DELETE,
			className: "workout-table-actions",
		});

		// Return in the expected format (HTMLElement instead of HTMLButtonElement)
		return {
			container: result.container,
			editBtn: result.editBtn as HTMLElement,
			deleteBtn: result.deleteBtn as HTMLElement,
		};
	}
}


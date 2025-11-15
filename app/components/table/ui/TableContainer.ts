/**
 * UI component for creating table containers.
 * Pure UI logic with no business dependencies.
 */
export class TableContainer {
	/**
	 * Creates a container for the table
	 * @param parent - The parent element to create the container in
	 * @param className - Optional additional CSS class
	 * @returns The table container element
	 */
	static create(
		parent: HTMLElement,
		className = "workout-table-container"
	): HTMLElement {
		return parent.createEl("div", { cls: className });
	}

	/**
	 * Creates an error container for displaying error messages
	 * @param parent - The parent element
	 * @returns The error container element
	 */
	static createErrorContainer(parent: HTMLElement): HTMLElement {
		return parent.createEl("div", { cls: "workout-table-error" });
	}
}

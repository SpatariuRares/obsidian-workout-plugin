/**
 * UI component for rendering error messages.
 * Pure UI logic with no business dependencies.
 */
export class ErrorMessage {
	/**
	 * Renders an error message in a container
	 * @param container - The container element
	 * @param message - Error message to display
	 * @param title - Title for the error section
	 */
	static render(
		container: HTMLElement,
		message: string,
		title = "Error"
	): void {
		const errorDiv = container.createEl("div", {
			cls: "workout-table-error",
		});
		errorDiv.createEl("strong", { text: `${title}:` });
		errorDiv.append(` ${message}`);
	}

	/**
	 * Renders a simple error message without title
	 * @param container - The container element
	 * @param message - Error message to display
	 */
	static renderSimple(container: HTMLElement, message: string): void {
		container.createEl("div", {
			cls: "workout-table-error",
			text: message,
		});
	}

	/**
	 * Clears error messages from a container
	 * @param container - The container element
	 */
	static clear(container: HTMLElement): void {
		const errorDivs = container.querySelectorAll(".workout-table-error");
		errorDivs.forEach((div) => div.remove());
	}
}

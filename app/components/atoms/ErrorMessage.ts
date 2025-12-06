import { TEXT_CONSTANTS } from "@app/constants";
/**
 * ErrorMessage Atom
 * Basic error message display - indivisible UI primitive
 */

/**
 * Creates error message elements
 * This is an atom - it has no dependencies on other UI components
 */
export class ErrorMessage {
	/**
	 * Render an error message with title
	 * @param container - The container element
	 * @param message - Error message to display
	 * @param title - Title for the error section (default: TEXT_CONSTANTS.ERRORS.TYPES.GENERIC)
	 */
	static render(
		container: HTMLElement,
		message: string,
		title = TEXT_CONSTANTS.ERRORS.TYPES.GENERIC
	): void {
		const errorDiv = container.createEl("div", {
			cls: "error-message",
		});
		errorDiv.createEl("strong", { text: `${title}:` });
		errorDiv.appendText(` ${message}`);
	}

	/**
	 * Render a simple error message without title
	 * @param container - The container element
	 * @param message - Error message to display
	 */
	static renderSimple(container: HTMLElement, message: string): void {
		container.createEl("div", {
			cls: "error-message",
			text: message,
		});
	}

	/**
	 * Clear error messages from a container
	 * @param container - The container element
	 */
	static clear(container: HTMLElement): void {
		const errorDivs = container.querySelectorAll(".error-message");
		errorDivs.forEach((div) => div.remove());
	}
}

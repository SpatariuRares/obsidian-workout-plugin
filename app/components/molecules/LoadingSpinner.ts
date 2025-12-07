/**
 * LoadingSpinner Molecule
 * Loading indicator with optional message
 * Combines: Icon + Text + Container atoms
 */

import { Icon, Text, Container } from "@app/components/atoms";

export interface LoadingSpinnerProps {
	message?: string;
	icon?: string;
	className?: string;
}

/**
 * Creates a loading spinner component
 * Used in: Data loading states, async operations, chart rendering
 *
 * @example
 * ```typescript
 * const spinner = LoadingSpinner.create(container, {
 *   message: CONSTANTS.WORKOUT.MESSAGES.LOADING
 * });
 *
 * // Later, when loading is complete:
 * spinner.remove();
 * ```
 */
export class LoadingSpinner {
	// Default loading icon
	private static readonly DEFAULT_ICON = "⏳";

	/**
	 * Create a loading spinner element
	 * @param parent - Parent HTML element
	 * @param props - Loading spinner properties
	 * @returns The created spinner container
	 */
	static create(
		parent: HTMLElement,
		props?: LoadingSpinnerProps
	): HTMLElement {
		// Create spinner container
		const spinner = Container.create(parent, {
			className: `loading-spinner ${props?.className || ""}`.trim(),
		});

		// Add spinner icon
		Icon.create(spinner, {
			name: props?.icon || this.DEFAULT_ICON,
			className: "loading-spinner-icon",
		});

		// Add optional message
		if (props?.message) {
			Text.create(spinner, {
				text: props.message,
				className: "loading-spinner-message",
				tag: "p",
			});
		}

		return spinner;
	}

	/**
	 * Create a simple loading spinner without message
	 * @param parent - Parent HTML element
	 * @param className - Optional additional classes
	 * @returns The created spinner container
	 */
	static createSimple(
		parent: HTMLElement,
		className?: string
	): HTMLElement {
		return this.create(parent, {
			className: `loading-spinner-simple ${className || ""}`.trim(),
		});
	}

	/**
	 * Remove a loading spinner from the DOM
	 * @param spinner - The spinner element to remove
	 */
	static remove(spinner: HTMLElement): void {
		spinner.remove();
	}
}

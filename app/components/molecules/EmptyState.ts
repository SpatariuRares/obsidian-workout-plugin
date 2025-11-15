/**
 * EmptyState Molecule
 * Displays "no data" message with icon
 * Combines: Icon + Text + Container atoms
 */

import { Icon, Text, Container } from "@app/components/atoms";

export interface EmptyStateProps {
	icon?: string;
	message: string;
	className?: string;
}

/**
 * Creates an empty state component for "no data" scenarios
 * Used in: Tables, lists, dashboard widgets, search results
 *
 * @example
 * ```typescript
 * EmptyState.create(container, {
 *   icon: "📭",
 *   message: "No workout data available"
 * });
 * ```
 */
export class EmptyState {
	// Default icon for empty states
	private static readonly DEFAULT_ICON = "📭";

	/**
	 * Create an empty state element
	 * @param parent - Parent HTML element
	 * @param props - Empty state properties
	 * @returns The created empty state container
	 */
	static create(
		parent: HTMLElement,
		props: EmptyStateProps
	): HTMLElement {
		// Create container
		const container = Container.create(parent, {
			className: `empty-state ${props.className || ""}`.trim(),
		});

		// Add icon
		Icon.create(container, {
			name: props.icon || this.DEFAULT_ICON,
			className: "empty-state-icon",
		});

		// Add message
		Text.create(container, {
			text: props.message,
			className: "empty-state-message",
			tag: "p",
		});

		return container;
	}
}

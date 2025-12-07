/**
 * Badge Molecule
 * Small labeled indicator with optional icon
 * Combines: Icon + Text + Container atoms
 */

import { Icon, Text, Container } from "@app/components/atoms";

export interface BadgeProps {
	text: string;
	icon?: string;
	variant?: "default" | "success" | "warning" | "error" | "info";
	className?: string;
}

/**
 * Creates a badge component for labels, tags, and status indicators
 * Used in: Tags, status indicators, category labels, counts
 *
 * @example
 * ```typescript
 * Badge.create(container, {
 *   text: CONSTANTS.WORKOUT.MUSCLES.BODY_PARTS.UPPER_BODY,
 *   icon: CONSTANTS.WORKOUT.ICONS.EXERCISE.CURL,
 *   variant: "info"
 * });
 *
 * Badge.create(container, {
 *   text: CONSTANTS.WORKOUT.UI.LABELS.EXERCISES_COUNT,
 *   variant: "default"
 * });
 * ```
 */
export class Badge {
	/**
	 * Create a badge element
	 * @param parent - Parent HTML element
	 * @param props - Badge properties
	 * @returns The created badge container
	 */
	static create(parent: HTMLElement, props: BadgeProps): HTMLElement {
		// Determine variant class
		const variantClass = props.variant
			? `badge-${props.variant}`
			: "badge-default";

		// Create badge container
		const badge = Container.create(parent, {
			className: `badge ${variantClass} ${props.className || ""}`.trim(),
		});

		// Add optional icon
		if (props.icon) {
			Icon.create(badge, {
				name: props.icon,
				className: "badge-icon",
			});
		}

		// Add text
		Text.create(badge, {
			text: props.text,
			className: "badge-text",
			tag: "span",
		});

		return badge;
	}

	/**
	 * Create a count badge (simple number badge)
	 * @param parent - Parent HTML element
	 * @param count - Number to display
	 * @param className - Optional additional classes
	 * @returns The created badge container
	 */
	static createCount(
		parent: HTMLElement,
		count: number,
		className?: string
	): HTMLElement {
		return this.create(parent, {
			text: String(count),
			variant: "default",
			className: `badge-count ${className || ""}`.trim(),
		});
	}
}

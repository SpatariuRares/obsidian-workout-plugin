/**
 * CopyableBadge Molecule
 * Badge with icon/emoji and text that copies a value to clipboard on click
 * Shows visual feedback when copied
 */

export interface CopyableBadgeProps {
	icon?: string;
	text: string;
	copyValue: string;
	tooltip?: string;
	className?: string;
	copiedClass?: string;
	copiedDuration?: number;
	dataAttributes?: Record<string, string>;
}

/**
 * Creates a badge that copies a value to clipboard on click
 * Used in: Muscle tags widget, exercise tags, copyable labels
 *
 * @example
 * ```typescript
 * CopyableBadge.create(container, {
 *   icon: "💪",
 *   text: "Biceps",
 *   copyValue: "biceps",
 *   tooltip: "Click to copy 'biceps'"
 * });
 * ```
 */
export class CopyableBadge {
	private static readonly DEFAULT_COPIED_CLASS = "workout-copied";
	private static readonly DEFAULT_COPIED_DURATION = 1000;

	/**
	 * Create a copyable badge element
	 * @param parent - Parent HTML element
	 * @param props - Badge properties
	 * @returns The created badge element
	 */
	static create(
		parent: HTMLElement,
		props: CopyableBadgeProps
	): HTMLElement {
		const badge = parent.createEl("div", {
			cls: props.className || "workout-copyable-badge",
		});

		// Add data attributes
		if (props.dataAttributes) {
			for (const [key, value] of Object.entries(props.dataAttributes)) {
				badge.setAttribute(`data-${key}`, value);
			}
		}

		// Icon/emoji
		if (props.icon) {
			badge.createEl("span", {
				text: props.icon,
				cls: "workout-copyable-badge-icon",
			});
		}

		// Text
		badge.createEl("span", {
			text: props.text,
			cls: "workout-copyable-badge-text",
		});

		// Tooltip
		if (props.tooltip) {
			badge.setAttribute("title", props.tooltip);
		}

		// Click to copy functionality
		const copiedClass = props.copiedClass || this.DEFAULT_COPIED_CLASS;
		const copiedDuration = props.copiedDuration || this.DEFAULT_COPIED_DURATION;

		badge.addEventListener("click", () => {
			navigator.clipboard.writeText(props.copyValue).catch(() => {
				// Silent fail - clipboard copy failed
			});

			// Show visual feedback
			badge.addClass(copiedClass);
			setTimeout(() => {
				badge.removeClass(copiedClass);
			}, copiedDuration);
		});

		// Add cursor pointer for clickable indication
		badge.addClass("workout-copyable-badge-clickable");

		return badge;
	}
}

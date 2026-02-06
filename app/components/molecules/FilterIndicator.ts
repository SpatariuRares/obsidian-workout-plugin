/**
 * FilterIndicator Molecule
 * Displays active filter state with badge and clear button
 * Combines: Text + Button atoms
 */

import { Button, Text } from "@app/components/atoms";

export interface FilterIndicatorProps {
	label: string;
	filterValue: string;
	color?: string;
	onClear: () => void;
	clearText?: string;
	className?: string;
}

/**
 * Creates a filter indicator with badge and clear button
 * Used in: Protocol distribution, table filters, dashboard widgets
 *
 * @example
 * ```typescript
 * FilterIndicator.create(container, {
 *   label: "Filtering by:",
 *   filterValue: "Drop Set",
 *   color: "rgba(239, 68, 68, 0.7)",
 *   onClear: () => clearFilter(),
 *   clearText: "Clear"
 * });
 * ```
 */
export class FilterIndicator {
	/**
	 * Create a filter indicator element
	 * @param parent - Parent HTML element
	 * @param props - Filter indicator properties
	 * @returns The created filter indicator container
	 */
	static create(
		parent: HTMLElement,
		props: FilterIndicatorProps
	): HTMLElement {
		const container = parent.createEl("div", {
			cls: props.className || "workout-filter-indicator",
		});

		// Filter label text
		Text.create(container, {
			text: `${props.label} `,
			className: "workout-filter-indicator-text",
			tag: "span",
		});

		// Filter value badge
		const badge = Text.create(container, {
			text: props.filterValue,
			className: "workout-filter-indicator-badge",
			tag: "span",
		});

		if (props.color) {
			badge.style.backgroundColor = props.color;
		}

		// Clear button
		const clearBtn = Button.create(container, {
			text: props.clearText || "Clear",
			className: "workout-filter-indicator-clear",
			ariaLabel: props.clearText || "Clear filter",
		});
		Button.onClick(clearBtn, props.onClear);

		return container;
	}
}

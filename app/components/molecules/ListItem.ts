/**
 * ListItem Molecule
 * Flexible list item component for displaying label-value pairs
 * Combines: Container + Text atoms
 */

import { Text } from "@app/components/atoms";

export interface ListItemProps {
	/** Primary label/name text */
	label: string;
	/** Value to display (formatted string or number) */
	value?: string | number;
	/** Optional secondary text (e.g., date, subtitle) */
	secondary?: string;
	/** Optional suffix text after value (e.g., "(date)") */
	suffix?: string;
	/** Optional icon/emoji prefix */
	icon?: string;
	/** CSS class for the list item */
	className?: string;
	/** CSS class for the label */
	labelClassName?: string;
	/** CSS class for the value */
	valueClassName?: string;
	/** Click handler */
	onClick?: () => void;
	/** Data attributes for the element */
	dataAttributes?: Record<string, string>;
}

export interface TextItemProps {
	/** Text content */
	text: string;
	/** CSS class for the list item */
	className?: string;
}

export interface StatItemProps {
	/** Label text (prefix) */
	label: string;
	/** Value to display in bold */
	value: string | number;
	/** Optional suffix after value */
	suffix?: string;
	/** CSS class for the list item */
	className?: string;
	/** CSS class for the value element */
	valueClassName?: string;
}

export interface ListContainerProps {
	/** CSS class for the ul element */
	className?: string;
	/** Items to render */
	items?: ListItemProps[];
}

/**
 * Creates list item components
 * Used in: Dashboard widgets, analytics breakdowns, recent workouts
 *
 * @example
 * ```typescript
 * // Simple label-value item
 * ListItem.create(container, {
 *   label: "Squat",
 *   value: "12,500 vol",
 *   className: "workout-muscle-group-item"
 * });
 *
 * // With secondary text
 * ListItem.create(container, {
 *   label: "Upper Body A",
 *   value: "8,200 vol",
 *   secondary: "2024-01-15",
 *   className: "workout-recent-workout-item"
 * });
 *
 * // Create full list
 * const list = ListItem.createList(container, { className: "workout-list" });
 * data.forEach(item => ListItem.create(list, item));
 * ```
 */
export class ListItem {
	/**
	 * Create a list container (ul element)
	 * @param parent - Parent HTML element
	 * @param props - List container properties
	 * @returns The created ul element
	 */
	static createList(
		parent: HTMLElement,
		props: ListContainerProps = {}
	): HTMLUListElement {
		const list = parent.createEl("ul", {
			cls: props.className || "workout-list",
		});

		if (props.items) {
			props.items.forEach((item) => this.create(list, item));
		}

		return list;
	}

	/**
	 * Create a list item element
	 * @param parent - Parent HTML element (usually a ul)
	 * @param props - List item properties
	 * @returns The created li element
	 */
	static create(parent: HTMLElement, props: ListItemProps): HTMLLIElement {
		const item = parent.createEl("li", {
			cls: props.className || "workout-list-item",
		});

		// Add data attributes
		if (props.dataAttributes) {
			Object.entries(props.dataAttributes).forEach(([key, value]) => {
				item.dataset[key] = value;
			});
		}

		// Add click handler
		if (props.onClick) {
			item.addClass("clickable");
			item.addEventListener("click", props.onClick);
		}

		// Render icon if provided
		if (props.icon) {
			Text.create(item, {
				text: props.icon,
				className: "workout-list-item-icon",
				tag: "span",
			});
		}

		// Render secondary text first if provided (often used for dates at top)
		if (props.secondary) {
			Text.create(item, {
				text: props.secondary,
				className: "workout-list-item-secondary",
				tag: "div",
			});
		}

		// Render label
		Text.create(item, {
			text: props.label,
			className: props.labelClassName || "workout-list-item-label",
			tag: "span",
		});

		// Render value if provided
		if (props.value !== undefined) {
			Text.create(item, {
				text: String(props.value),
				className: props.valueClassName || "workout-list-item-value",
				tag: "span",
			});
		}

		return item;
	}

	/**
	 * Create a simple label-value list item (most common pattern)
	 * @param parent - Parent HTML element
	 * @param label - Label text
	 * @param value - Value text
	 * @param className - Optional CSS class
	 * @returns The created li element
	 */
	static createSimple(
		parent: HTMLElement,
		label: string,
		value: string | number,
		className?: string
	): HTMLLIElement {
		return this.create(parent, { label, value, className });
	}

	/**
	 * Create a text-only list item (no label-value split)
	 * @param parent - Parent HTML element
	 * @param props - Text item properties
	 * @returns The created li element
	 *
	 * @example
	 * ```typescript
	 * ListItem.createText(list, {
	 *   text: "Weight → Peso",
	 *   className: "workout-mapping-item"
	 * });
	 * ```
	 */
	static createText(
		parent: HTMLElement,
		props: TextItemProps
	): HTMLLIElement {
		return parent.createEl("li", {
			text: props.text,
			cls: props.className || "workout-list-item",
		});
	}

	/**
	 * Create a stat list item with label: **value** (suffix) pattern
	 * @param parent - Parent HTML element
	 * @param props - Stat item properties
	 * @returns The created li element
	 *
	 * @example
	 * ```typescript
	 * ListItem.createStat(list, {
	 *   label: "Max: ",
	 *   value: "125.5 kg",
	 *   suffix: " (2024-01-15)",
	 *   className: "workout-stat-item"
	 * });
	 * ```
	 */
	static createStat(
		parent: HTMLElement,
		props: StatItemProps
	): HTMLLIElement {
		const item = parent.createEl("li", {
			cls: props.className || "workout-stat-item",
		});

		// Add label text
		item.appendText(props.label);

		// Add bold value
		item.createEl("strong", {
			text: String(props.value),
			cls: props.valueClassName,
		});

		// Add suffix if provided
		if (props.suffix) {
			item.appendText(props.suffix);
		}

		return item;
	}

	/**
	 * Create an empty list item for custom content
	 * Use this when you need to add complex children manually
	 * @param parent - Parent HTML element
	 * @param className - CSS class for the list item
	 * @returns The created li element
	 *
	 * @example
	 * ```typescript
	 * const item = ListItem.createEmpty(list, "workout-file-error-item");
	 * // Add custom content
	 * const link = item.createEl("a", { text: fileName });
	 * link.addEventListener("click", () => openFile(file));
	 * ```
	 */
	static createEmpty(
		parent: HTMLElement,
		className?: string
	): HTMLLIElement {
		return parent.createEl("li", {
			cls: className || "workout-list-item",
		});
	}
}

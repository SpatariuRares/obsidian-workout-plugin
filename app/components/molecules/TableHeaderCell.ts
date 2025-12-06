/**
 * TableHeaderCell Molecule
 * Table header cell with optional sort indicator
 * Combines: Text + Icon + Container atoms
 */

import { Text, Icon, Container } from "@app/components/atoms";

export interface TableHeaderCellProps {
	text: string;
	sortable?: boolean;
	sortDirection?: "asc" | "desc" | "none";
	className?: string;
}

export interface TableHeaderCellResult {
	cell: HTMLElement;
	sortIcon?: HTMLSpanElement;
}

/**
 * Creates a table header cell with optional sorting
 * Used in: Data tables, sortable columns
 *
 * @example
 * ```typescript
 * const { cell, sortIcon } = TableHeaderCell.create(headerRow, {
 *   text: UI_LABELS.TABLE.EXERCISE,
 *   sortable: true,
 *   sortDirection: "asc"
 * });
 *
 * Button.onClick(cell as HTMLButtonElement, () => toggleSort());
 * ```
 */
export class TableHeaderCell {
	// Sort direction icons
	private static readonly SORT_ASC_ICON = "↑";
	private static readonly SORT_DESC_ICON = "↓";
	private static readonly SORT_NONE_ICON = "↕";

	/**
	 * Get sort icon based on direction
	 * @param direction - Sort direction
	 * @returns Sort icon
	 */
	private static getSortIcon(
		direction: "asc" | "desc" | "none"
	): string {
		switch (direction) {
			case "asc":
				return this.SORT_ASC_ICON;
			case "desc":
				return this.SORT_DESC_ICON;
			case "none":
				return this.SORT_NONE_ICON;
		}
	}

	/**
	 * Create a table header cell element
	 * @param parent - Parent HTML element (usually a <tr>)
	 * @param props - Header cell properties
	 * @returns Object with cell and optional sort icon elements
	 */
	static create(
		parent: HTMLElement,
		props: TableHeaderCellProps
	): TableHeaderCellResult {
		// Create th element
		const cell = parent.createEl("th", {
			cls: `table-header-cell ${props.sortable ? "sortable" : ""} ${props.className || ""}`.trim(),
		});

		// Create inner container for flex layout
		const container = Container.create(cell, {
			className: "table-header-content",
		});

		// Add text
		Text.create(container, {
			text: props.text,
			className: "table-header-text",
			tag: "span",
		});

		// Add sort icon if sortable
		let sortIcon: HTMLSpanElement | undefined;
		if (props.sortable) {
			const direction = props.sortDirection || "none";
			sortIcon = Icon.create(container, {
				name: this.getSortIcon(direction),
				className: `table-header-sort sort-${direction}`,
			});
		}

		return {
			cell,
			sortIcon,
		};
	}

	/**
	 * Update sort direction of an existing header cell
	 * @param result - Result from create()
	 * @param direction - New sort direction
	 */
	static updateSortDirection(
		result: TableHeaderCellResult,
		direction: "asc" | "desc" | "none"
	): void {
		if (!result.sortIcon) return;

		// Update icon
		result.sortIcon.textContent = this.getSortIcon(direction);

		// Update class
		result.sortIcon.className = `table-header-sort sort-${direction}`;
	}
}

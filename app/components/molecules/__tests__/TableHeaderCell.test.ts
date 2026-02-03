/** @jest-environment jsdom */

import {
	TableHeaderCell,
	type TableHeaderCellResult,
} from "@app/components/molecules/TableHeaderCell";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

const createRow = () =>
	createObsidianContainer().createEl("tr", {
		cls: "table-header-row",
	});

describe("TableHeaderCell molecule", () => {
	it("renders non-sortable headers", () => {
		const row = createRow();
		const { cell, sortIcon } = TableHeaderCell.create(row, {
			text: "Exercise",
		});

		expect(row.contains(cell)).toBe(true);
		expect(cell.classList.contains("table-header-cell")).toBe(true);
		expect(cell.className).not.toContain("sortable");
		expect(
			cell.querySelector(".table-header-text")?.textContent
		).toBe("Exercise");
		expect(sortIcon).toBeUndefined();
	});

	it("renders sortable headers and updates the direction", () => {
		const row = createRow();
		const result = TableHeaderCell.create(row, {
			text: "Weight",
			sortable: true,
			sortDirection: "asc",
			className: "is-sticky",
		});

		expect(result.cell.className).toContain("sortable");
		expect(result.cell.className).toContain("is-sticky");

		expect(result.sortIcon).toBeTruthy();
		expect(result.sortIcon?.className).toContain("sort-asc");

		const icons = TableHeaderCell as unknown as {
			SORT_ASC_ICON: string;
			SORT_DESC_ICON: string;
			SORT_NONE_ICON: string;
		};
		expect(result.sortIcon?.textContent).toBe(icons.SORT_ASC_ICON);

		TableHeaderCell.updateSortDirection(
			result as TableHeaderCellResult,
			"desc"
		);

		expect(result.sortIcon?.className).toContain("sort-desc");
		expect(result.sortIcon?.textContent).toBe(icons.SORT_DESC_ICON);

		TableHeaderCell.updateSortDirection(
			result as TableHeaderCellResult,
			"none"
		);

		expect(result.sortIcon?.className).toContain("sort-none");
		expect(result.sortIcon?.textContent).toBe(icons.SORT_NONE_ICON);
	});

	it("defaults to sort-none when sortable but no sortDirection specified", () => {
		const row = createRow();
		const result = TableHeaderCell.create(row, {
			text: "Date",
			sortable: true,
		});

		const icons = TableHeaderCell as unknown as {
			SORT_ASC_ICON: string;
			SORT_DESC_ICON: string;
			SORT_NONE_ICON: string;
		};

		expect(result.sortIcon).toBeTruthy();
		expect(result.sortIcon?.className).toContain("sort-none");
		expect(result.sortIcon?.textContent).toBe(icons.SORT_NONE_ICON);
	});

	it("updateSortDirection does nothing when sortIcon is undefined", () => {
		const row = createRow();
		const result = TableHeaderCell.create(row, {
			text: "Notes",
			sortable: false,
		});

		expect(result.sortIcon).toBeUndefined();

		// Should not throw
		TableHeaderCell.updateSortDirection(result, "asc");

		// Still undefined
		expect(result.sortIcon).toBeUndefined();
	});
});

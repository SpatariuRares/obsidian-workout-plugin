import { CONSTANTS } from "@app/constants/Constants";

/**
 * Fallback table shown when Chart.js rendering is unavailable.
 * Lives with chart organisms because it mirrors the same dataset.
 */
export class ChartFallbackTable {
	static render(
		container: HTMLElement,
		labels: string[],
		volumeData: number[]
	): void {
		const tableDiv = container.createEl("div", {
			cls: "workout-charts-table-fallback",
		});

		const table = tableDiv.createEl("table", {
			cls: "workout-charts-table",
		});

		this.createHeader(table);
		this.createBody(table, labels, volumeData);

		tableDiv
			.createEl("div", { cls: "workout-charts-footer" })
			.appendText(
				`${CONSTANTS.WORKOUT.ICONS.STATUS.INFO} ${CONSTANTS.WORKOUT.LABELS.CHARTS.FALLBACK_TABLE_MESSAGE}`
			);
	}

	private static createHeader(table: HTMLTableElement): void {
		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		[
			CONSTANTS.WORKOUT.LABELS.TABLE.DATE,
			CONSTANTS.WORKOUT.LABELS.TABLE.VOLUME_WITH_UNIT,
		].forEach((label) => {
			headerRow.createEl("th", { text: label });
		});
	}

	private static createBody(
		table: HTMLTableElement,
		labels: string[],
		volumeData: number[]
	): void {
		const tbody = table.createEl("tbody");
		volumeData.forEach((value, index) => {
			const row = tbody.createEl("tr");
			row.createEl("td", { text: labels[index] });
			row.createEl("td", { text: value.toFixed(1) });
		});
	}
}

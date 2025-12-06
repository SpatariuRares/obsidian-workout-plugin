/**
 * ChartLegendItem Molecule
 * Legend item for charts with color indicator and label
 * Combines: Container + Text atoms
 */

import { Text, Container } from "@app/components/atoms";

export interface ChartLegendItemProps {
	color: string;
	label: string;
	value?: string | number;
	className?: string;
}

/**
 * Creates a chart legend item with color indicator
 * Used in: Chart legends, data visualizations
 *
 * @example
 * ```typescript
 * ChartLegendItem.create(legendContainer, {
 *   color: "#FF6384",
 *   label: TEXT_CONSTANTS.MUSCLES.BODY_PARTS.UPPER_BODY,
 *   value: TEXT_CONSTANTS.UI.DISPLAY.PERCENTAGE_45
 * });
 * ```
 */
export class ChartLegendItem {
	/**
	 * Create a chart legend item element
	 * @param parent - Parent HTML element
	 * @param props - Legend item properties
	 * @returns The created legend item container
	 */
	static create(
		parent: HTMLElement,
		props: ChartLegendItemProps
	): HTMLElement {
		// Create item container
		const item = Container.create(parent, {
			className: `chart-legend-item ${props.className || ""}`.trim(),
		});

		// Create color indicator
		const colorBox = item.createDiv({
			cls: "chart-legend-color",
		});
		colorBox.style.backgroundColor = props.color;

		// Create label
		Text.create(item, {
			text: props.label,
			className: "chart-legend-label",
			tag: "span",
		});

		// Add optional value
		if (props.value !== undefined) {
			Text.create(item, {
				text: String(props.value),
				className: "chart-legend-value",
				tag: "span",
			});
		}

		return item;
	}
}

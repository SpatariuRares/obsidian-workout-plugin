/**
 * ChartLegendItem
 * Legend item for charts with color indicator and label
 * Supports interactive states (active, dimmed) and click handling
 * Combines: Container + Text atoms
 */

import { Text, Container } from "@app/components/atoms";

export interface ChartLegendItemProps {
	color: string;
	label: string;
	value?: string | number;
	className?: string;
	onClick?: () => void;
	isActive?: boolean;
	isDimmed?: boolean;
	tooltip?: string;
}

/**
 * Creates a chart legend item with color indicator
 * Used in: Chart legends, data visualizations, protocol distribution
 *
 * @example
 * ```typescript
 * // Basic usage
 * ChartLegendItem.create(legendContainer, {
 *   color: "#FF6384",
 *   label: "Upper Body",
 *   value: "45%"
 * });
 *
 * // Interactive with click handler
 * ChartLegendItem.create(legendContainer, {
 *   color: "rgba(255, 99, 132, 0.7)",
 *   label: "Drop Set",
 *   value: "12 (25.5%)",
 *   onClick: () => handleFilter("drop_set"),
 *   isActive: currentFilter === "drop_set",
 *   isDimmed: currentFilter && currentFilter !== "drop_set",
 *   tooltip: "Click to filter"
 * });
 * ```
 */
export class ChartLegendItem {
	private static readonly ACTIVE_CLASS = "chart-legend-item-active";
	private static readonly DIMMED_CLASS = "chart-legend-item-dimmed";

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
		// Build class list with state classes
		const classes = ["chart-legend-item"];
		if (props.className) classes.push(props.className);
		if (props.isActive) classes.push(this.ACTIVE_CLASS);
		if (props.isDimmed) classes.push(this.DIMMED_CLASS);

		// Create item container
		const item = Container.create(parent, {
			className: classes.join(" "),
		});

		// Add tooltip if provided
		if (props.tooltip) {
			item.setAttribute("title", props.tooltip);
		}

		// Add click handler if provided
		if (props.onClick) {
			item.addClass("chart-legend-item-clickable");
			item.addEventListener("click", props.onClick);
		}

		// Create color indicator
		const colorBox = item.createDiv({
			cls: "chart-legend-color",
		});
		// Reduce opacity for dimmed items
		if (props.isDimmed && props.color.includes("rgba")) {
			colorBox.style.backgroundColor = props.color.replace(/[\d.]+\)$/, "0.3)");
		} else {
			colorBox.style.backgroundColor = props.color;
		}

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

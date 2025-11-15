/**
 * TrendIndicator Molecule
 * Displays trend percentage with direction arrow
 * Combines: Icon + Text + Container atoms
 */

import { Icon, Text, Container } from "@app/components/atoms";

export interface TrendIndicatorProps {
	percentage: number;
	direction: "up" | "down" | "neutral";
	label?: string;
	className?: string;
}

/**
 * Creates a trend indicator component showing percentage change with direction
 * Used in: Dashboard stats, analytics widgets, comparison displays
 *
 * @example
 * ```typescript
 * TrendIndicator.create(container, {
 *   percentage: 15.5,
 *   direction: "up",
 *   label: "vs last week"
 * });
 * ```
 */
export class TrendIndicator {
	// Direction arrows
	private static readonly ARROW_UP = "↑";
	private static readonly ARROW_DOWN = "↓";
	private static readonly ARROW_NEUTRAL = "→";

	/**
	 * Get arrow icon based on direction
	 * @param direction - Trend direction
	 * @returns Arrow emoji
	 */
	private static getArrow(direction: "up" | "down" | "neutral"): string {
		switch (direction) {
			case "up":
				return this.ARROW_UP;
			case "down":
				return this.ARROW_DOWN;
			case "neutral":
				return this.ARROW_NEUTRAL;
		}
	}

	/**
	 * Format percentage for display
	 * @param percentage - Raw percentage value
	 * @returns Formatted percentage string
	 */
	private static formatPercentage(percentage: number): string {
		const absValue = Math.abs(percentage);
		return `${absValue.toFixed(1)}%`;
	}

	/**
	 * Create a trend indicator element
	 * @param parent - Parent HTML element
	 * @param props - Trend indicator properties
	 * @returns The created trend indicator container
	 */
	static create(
		parent: HTMLElement,
		props: TrendIndicatorProps
	): HTMLElement {
		// Create container with direction-based class
		const container = Container.create(parent, {
			className: `trend-indicator trend-${props.direction} ${props.className || ""}`.trim(),
		});

		// Add arrow icon
		Icon.create(container, {
			name: this.getArrow(props.direction),
			className: "trend-arrow",
		});

		// Add percentage
		Text.create(container, {
			text: this.formatPercentage(props.percentage),
			className: "trend-percentage",
			tag: "span",
		});

		// Add optional label
		if (props.label) {
			Text.create(container, {
				text: props.label,
				className: "trend-label",
				tag: "span",
			});
		}

		return container;
	}
}

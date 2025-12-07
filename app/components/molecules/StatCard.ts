/**
 * StatCard Molecule
 * Displays a statistic with icon, value, and label
 * Combines: Icon + Text + Container atoms
 */

import { Icon, Text, Container } from "@app/components/atoms";

export interface StatCardProps {
	icon: string;
	value: string | number;
	label: string;
	className?: string;
}

/**
 * Creates a statistic card component
 * Used in: Dashboard stats, widget cards, analytics displays
 *
 * @example
 * ```typescript
 * StatCard.create(container, {
 *   icon: CONSTANTS.WORKOUT.ICONS.DASHBOARD.QUICK_STATS.METRICS.AVG_VOLUME,
 *   label: CONSTANTS.WORKOUT.LABELS.DASHBOARD.SUMMARY.TOTAL_WORKOUTS
 * });
 * ```
 */
export class StatCard {
	/**
	 * Create a stat card element
	 * @param parent - Parent HTML element
	 * @param props - Stat card properties
	 * @returns The created stat card container
	 */
	static create(
		parent: HTMLElement,
		props: StatCardProps
	): HTMLElement {
		// Create card container
		const card = Container.create(parent, {
			className: `stat-card ${props.className || ""}`.trim(),
		});

		// Add icon
		Icon.create(card, {
			name: props.icon,
			className: "stat-card-icon",
		});

		// Add value
		Text.create(card, {
			text: String(props.value),
			className: "stat-card-value",
			tag: "div",
		});

		// Add label
		Text.create(card, {
			text: props.label,
			className: "stat-card-label",
			tag: "span",
		});

		return card;
	}
}

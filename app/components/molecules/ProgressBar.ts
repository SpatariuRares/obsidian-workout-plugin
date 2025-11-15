/**
 * ProgressBar Molecule
 * Progress indicator with percentage display
 * Combines: Container + Text atoms
 */

import { Text, Container } from "@app/components/atoms";

export interface ProgressBarProps {
	percentage: number;
	label?: string;
	showPercentage?: boolean;
	className?: string;
	variant?: "default" | "success" | "warning" | "error";
}

/**
 * Creates a progress bar component
 * Used in: Loading states, goal tracking, completion indicators
 *
 * @example
 * ```typescript
 * ProgressBar.create(container, {
 *   percentage: 75,
 *   label: "Workout Progress",
 *   showPercentage: true,
 *   variant: "success"
 * });
 * ```
 */
export class ProgressBar {
	/**
	 * Clamp percentage between 0 and 100
	 * @param percentage - Raw percentage value
	 * @returns Clamped percentage
	 */
	private static clampPercentage(percentage: number): number {
		return Math.max(0, Math.min(100, percentage));
	}

	/**
	 * Create a progress bar element
	 * @param parent - Parent HTML element
	 * @param props - Progress bar properties
	 * @returns The created progress bar container
	 */
	static create(
		parent: HTMLElement,
		props: ProgressBarProps
	): HTMLElement {
		// Clamp percentage
		const percentage = this.clampPercentage(props.percentage);

		// Determine variant class
		const variantClass = props.variant
			? `progress-bar-${props.variant}`
			: "progress-bar-default";

		// Create main container
		const container = Container.create(parent, {
			className: `progress-bar-container ${props.className || ""}`.trim(),
		});

		// Add optional label
		if (props.label) {
			const labelContainer = Container.create(container, {
				className: "progress-bar-header",
			});

			Text.create(labelContainer, {
				text: props.label,
				className: "progress-bar-label",
				tag: "span",
			});

			if (props.showPercentage) {
				Text.create(labelContainer, {
					text: `${percentage.toFixed(0)}%`,
					className: "progress-bar-percentage-text",
					tag: "span",
				});
			}
		}

		// Create progress bar track
		const track = Container.create(container, {
			className: "progress-bar-track",
		});

		// Create progress bar fill
		const fill = Container.create(track, {
			className: `progress-bar-fill ${variantClass}`,
		});
		fill.style.width = `${percentage}%`;

		// Add percentage text inside bar if no label and showPercentage is true
		if (!props.label && props.showPercentage) {
			Text.create(fill, {
				text: `${percentage.toFixed(0)}%`,
				className: "progress-bar-percentage-inline",
				tag: "span",
			});
		}

		return container;
	}

	/**
	 * Update progress bar percentage
	 * @param container - Progress bar container from create()
	 * @param percentage - New percentage value
	 */
	static updatePercentage(
		container: HTMLElement,
		percentage: number
	): void {
		const clampedPercentage = this.clampPercentage(percentage);
		const fill = container.querySelector(
			".progress-bar-fill"
		) as HTMLElement;

		if (fill) {
			fill.style.width = `${clampedPercentage}%`;

			// Update percentage text if present
			const percentageText =
				container.querySelector(".progress-bar-percentage-text") ||
				container.querySelector(".progress-bar-percentage-inline");

			if (percentageText) {
				percentageText.textContent = `${clampedPercentage.toFixed(0)}%`;
			}
		}
	}
}

/**
 * SpacerStat Atom
 * Compact statistic display with optional icon and bolded value - indivisible UI primitive
 * Used for displaying summary statistics in tables (e.g., reps, weight, volume)
 */

export interface SpacerStatProps {
	icon?: string;
	value: string;
	className?: string;
}

/**
 * Creates a compact stat display element with icon + value
 * This is an atom - it has no dependencies on other UI components
 */
export class SpacerStat {
	/**
	 * Create a spacer stat element
	 * @param parent - Parent HTML element
	 * @param props - SpacerStat properties
	 * @returns The created span element
	 */
	static create(parent: HTMLElement, props: SpacerStatProps): HTMLSpanElement {
		const span = parent.createEl("span", {
			cls: props.className || "workout-spacer-stat",
		});

		if (props.icon) {
			span.appendText(props.icon);
		}

		span.createEl("strong", { text: props.value });

		return span;
	}
}

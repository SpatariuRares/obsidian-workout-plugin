/**
 * Chip Atom
 * Touch-friendly selection chip - indivisible UI primitive
 * Used for quick selection in modals (e.g., recent exercises)
 */

export interface ChipProps {
	text: string;
	onClick?: () => void;
	selected?: boolean;
	className?: string;
	ariaLabel?: string;
}

/**
 * Creates chip elements for quick selection
 * This is an atom - it has no dependencies on other UI components
 */
export class Chip {
	/**
	 * Create a chip element
	 * @param parent - Parent HTML element
	 * @param props - Chip properties
	 * @returns The created button element
	 */
	static create(parent: HTMLElement, props: ChipProps): HTMLButtonElement {
		const baseClass = props.className || "workout-chip";
		const selectedClass = props.selected ? "workout-chip-selected" : "";
		const cls = `${baseClass} ${selectedClass}`.trim();

		const chip = parent.createEl("button", {
			text: props.text,
			cls,
			attr: {
				type: "button",
				...(props.ariaLabel && { "aria-label": props.ariaLabel }),
				...(props.selected !== undefined && {
					"aria-pressed": props.selected.toString(),
				}),
			},
		});

		if (props.onClick) {
			chip.addEventListener("click", props.onClick);
		}

		return chip;
	}

	/**
	 * Set the selected state of a chip
	 * @param chip - Chip element
	 * @param selected - Whether the chip is selected
	 */
	static setSelected(chip: HTMLButtonElement, selected: boolean): void {
		if (selected) {
			chip.addClass("workout-chip-selected");
			chip.setAttribute("aria-pressed", "true");
		} else {
			chip.removeClass("workout-chip-selected");
			chip.setAttribute("aria-pressed", "false");
		}
	}
}

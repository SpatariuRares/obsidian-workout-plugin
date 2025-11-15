/**
 * Button Atom
 * Basic button component - indivisible UI primitive
 */

export interface ButtonProps {
	text?: string;
	icon?: string;
	className?: string;
	title?: string;
	disabled?: boolean;
	ariaLabel?: string;
}

/**
 * Creates button elements
 * This is an atom - it has no dependencies on other UI components
 */
export class Button {
	/**
	 * Create a button element
	 * @param parent - Parent HTML element
	 * @param props - Button properties
	 * @returns The created button element
	 */
	static create(
		parent: HTMLElement,
		props: ButtonProps
	): HTMLButtonElement {
		const btn = parent.createEl("button", {
			cls: props.className || "btn",
			attr: {
				...(props.title && { title: props.title }),
				...(props.disabled && { disabled: "true" }),
				...(props.ariaLabel && { "aria-label": props.ariaLabel }),
			},
		});

		// Set content (icon or text)
		if (props.icon) {
			btn.textContent = props.icon;
		} else if (props.text) {
			btn.textContent = props.text;
		}

		return btn;
	}

	/**
	 * Attach click handler to button
	 * @param button - Button element
	 * @param handler - Click event handler
	 */
	static onClick(
		button: HTMLButtonElement,
		handler: (e: MouseEvent) => void
	): void {
		button.addEventListener("click", handler);
	}

	/**
	 * Enable/disable button
	 * @param button - Button element
	 * @param disabled - Whether to disable
	 */
	static setDisabled(button: HTMLButtonElement, disabled: boolean): void {
		if (disabled) {
			button.setAttribute("disabled", "true");
			button.addClass("disabled");
		} else {
			button.removeAttribute("disabled");
			button.removeClass("disabled");
		}
	}
}

/**
 * Input Atom
 * Basic input field - indivisible UI primitive
 */

export interface InputProps {
	type?: "text" | "number" | "email" | "password" | "date" | "time";
	placeholder?: string;
	value?: string | number;
	className?: string;
	disabled?: boolean;
	required?: boolean;
	min?: number;
	max?: number;
	step?: number;
}

/**
 * Creates input elements
 * This is an atom - it has no dependencies on other UI components
 */
export class Input {
	/**
	 * Create an input element
	 * @param parent - Parent HTML element
	 * @param props - Input properties
	 * @returns The created input element
	 */
	static create(
		parent: HTMLElement,
		props?: InputProps
	): HTMLInputElement {
		const input = parent.createEl("input", {
			cls: props?.className || "input",
			attr: {
				type: props?.type || "text",
				...(props?.placeholder && { placeholder: props.placeholder }),
				...(props?.value !== undefined && { value: String(props.value) }),
				...(props?.disabled && { disabled: "true" }),
				...(props?.required && { required: "true" }),
				...(props?.min !== undefined && { min: String(props.min) }),
				...(props?.max !== undefined && { max: String(props.max) }),
				...(props?.step !== undefined && { step: String(props.step) }),
			},
		});

		return input;
	}

	/**
	 * Get input value
	 * @param input - Input element
	 * @returns The input value
	 */
	static getValue(input: HTMLInputElement): string {
		return input.value;
	}

	/**
	 * Set input value
	 * @param input - Input element
	 * @param value - Value to set
	 */
	static setValue(input: HTMLInputElement, value: string | number): void {
		input.value = String(value);
	}

	/**
	 * Attach change handler to input
	 * @param input - Input element
	 * @param handler - Change event handler
	 */
	static onChange(
		input: HTMLInputElement,
		handler: (e: Event) => void
	): void {
		input.addEventListener("change", handler);
	}
}

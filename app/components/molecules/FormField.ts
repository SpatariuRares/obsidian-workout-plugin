/**
 * FormField Molecule
 * Label + Input combination for forms
 * Combines: Text + Input atoms
 */

import { Text, Input } from "@app/components/atoms";
import type { InputProps } from "@app/components/atoms";

export interface FormFieldProps {
	label: string;
	inputProps: InputProps;
	required?: boolean;
	className?: string;
}

export interface FormFieldResult {
	container: HTMLElement;
	label: HTMLElement;
	input: HTMLInputElement;
}

/**
 * Creates a form field with label and input
 * Used in: Modals, forms, settings pages
 *
 * @example
 * ```typescript
 * const { input } = FormField.create(container, {
 *   label: CONSTANTS.WORKOUT.FORMS.LABELS.EXERCISE_NAME,
 *   inputProps: {
 *     type: "text",
 *     placeholder: CONSTANTS.WORKOUT.FORMS.PLACEHOLDERS.ENTER_EXERCISE_NAME,
 *     required: true
 *   },
 *   required: true
 * });
 *
 * Input.onChange(input, (e) => handleChange(e));
 * ```
 */
export class FormField {
	/**
	 * Create a form field element
	 * @param parent - Parent HTML element
	 * @param props - Form field properties
	 * @returns Object with container, label, and input elements
	 */
	static create(
		parent: HTMLElement,
		props: FormFieldProps
	): FormFieldResult {
		// Create field container
		const container = parent.createDiv({
			cls: `workout-form-field ${props.className || ""}`.trim(),
		});

		// Create label with required indicator if needed
		const labelText = props.required
			? `${props.label} *`
			: props.label;

		const label = Text.create(container, {
			text: labelText,
			className: "workout-form-field-label",
			tag: "label",
		});

		// Create input
		const input = Input.create(container, {
			...props.inputProps,
			className: `workout-form-field-input ${props.inputProps.className || ""}`.trim(),
		});

		return {
			container,
			label,
			input,
		};
	}
}

/** @jest-environment jsdom */

import { FormField } from "@app/components/molecules/FormField";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("FormField molecule", () => {
	it("renders label, required indicator, and input", () => {
		const parent = createObsidianContainer();

		const result = FormField.create(parent, {
			label: "Exercise Name",
			required: true,
			className: "mb-4",
			inputProps: {
				placeholder: "Enter exercise",
				className: "exercise-input",
			},
		});

		expect(result.container.className).toContain("form-field");
		expect(result.container.className).toContain("mb-4");
		expect(result.label.textContent).toBe("Exercise Name *");
		expect(result.label.classList.contains("form-field-label")).toBe(true);

		expect(result.input.classList.contains("form-field-input")).toBe(true);
		expect(result.input.classList.contains("exercise-input")).toBe(true);
		expect(result.input.getAttribute("placeholder")).toBe("Enter exercise");
	});

	it("leaves label unchanged when not required", () => {
		const parent = createObsidianContainer();

		const { label } = FormField.create(parent, {
			label: "Optional Note",
			required: false,
			inputProps: {},
		});

		expect(label.textContent).toBe("Optional Note");
	});
});

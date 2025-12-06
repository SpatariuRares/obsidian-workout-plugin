/** @jest-environment jsdom */

import { Input } from "@app/components/atoms/Input";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { INPUT_TYPE } from "@app/types";

describe("Input atom", () => {
	it("creates an input with provided attributes", () => {
		const parent = createObsidianContainer();
		const input = Input.create(parent, {
			type: INPUT_TYPE.NUMBER,
			placeholder: "Weight",
			value: 42,
			className: "weight-input",
			min: 0,
			max: 300,
			step: 5,
		});

		expect(input.tagName).toBe("INPUT");
		expect(input.classList.contains("weight-input")).toBe(true);
		expect(input.getAttribute("type")).toBe("number");
		expect(input.getAttribute("placeholder")).toBe("Weight");
		expect(Input.getValue(input)).toBe("42");
		expect(input.getAttribute("min")).toBe("0");
		expect(input.getAttribute("max")).toBe("300");
		expect(input.getAttribute("step")).toBe("5");
	});

	it("sets values and fires change handlers", () => {
		const parent = createObsidianContainer();
		const input = Input.create(parent);

		expect(input.classList.contains("input")).toBe(true);

		Input.setValue(input, 99);
		expect(Input.getValue(input)).toBe("99");

		const handler = jest.fn();
		Input.onChange(input, handler);
		input.dispatchEvent(new Event("change"));
		expect(handler).toHaveBeenCalledTimes(1);
	});
});

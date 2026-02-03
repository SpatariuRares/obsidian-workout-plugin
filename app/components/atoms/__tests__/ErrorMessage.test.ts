/** @jest-environment jsdom */

import { ErrorMessage } from "@app/components/atoms/ErrorMessage";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("ErrorMessage atom", () => {
	it("renders titled error messages", () => {
		const parent = createObsidianContainer();

		ErrorMessage.render(parent, "Missing workout file", "Error");

		const error = parent.querySelector(".error-message") as HTMLElement;
		expect(error).toBeTruthy();
		expect(error.querySelector("strong")?.textContent).toBe("Error:");
		expect(error.textContent?.trim()).toBe("Error: Missing workout file");
	});

	it("renders error messages with default title when none provided", () => {
		const parent = createObsidianContainer();

		ErrorMessage.render(parent, "Something went wrong");

		const error = parent.querySelector(".error-message") as HTMLElement;
		expect(error).toBeTruthy();
		// Uses CONSTANTS.WORKOUT.ERRORS.TYPES.GENERIC as default
		expect(error.querySelector("strong")).toBeTruthy();
		expect(error.textContent).toContain("Something went wrong");
	});

	it("renders simple error messages and clears them", () => {
		const parent = createObsidianContainer();

		ErrorMessage.renderSimple(parent, "Failed to parse log");
		let errors = parent.querySelectorAll(".error-message");
		expect(errors).toHaveLength(1);
		expect(errors[0].textContent).toBe("Failed to parse log");

		ErrorMessage.clear(parent);
		errors = parent.querySelectorAll(".error-message");
		expect(errors).toHaveLength(0);
	});
});

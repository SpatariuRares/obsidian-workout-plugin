/** @jest-environment jsdom */

import { LoadingSpinner } from "@app/components/molecules/LoadingSpinner";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { TEXT_CONSTANTS } from "@app/constants";

describe("LoadingSpinner molecule", () => {
	it("renders spinner with optional icon and message", () => {
		const parent = createObsidianContainer();

		const spinner = LoadingSpinner.create(parent, {
			message: TEXT_CONSTANTS.MESSAGES.LOADING,
			icon: "⏳",
			className: "mt-md",
		});

		expect(spinner.className).toContain("loading-spinner");
		expect(spinner.className).toContain("mt-md");
		expect(spinner.querySelector(".loading-spinner-icon")?.textContent).toBe(
			"⏳"
		);
		expect(spinner.querySelector(".loading-spinner-message")?.textContent).toBe(
			TEXT_CONSTANTS.MESSAGES.LOADING
		);
	});

	it("creates simple spinners and removes them", () => {
		const parent = createObsidianContainer();
		const spinner = LoadingSpinner.createSimple(parent, "mb-sm");

		expect(spinner.className).toContain("loading-spinner-simple");
		expect(spinner.className).toContain("mb-sm");

		LoadingSpinner.remove(spinner);
		expect(parent.contains(spinner)).toBe(false);
	});
});

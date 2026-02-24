/** @jest-environment jsdom */

import { CONSTANTS } from "@app/constants";
import { LoadingSpinner } from "@app/components/molecules/LoadingSpinner";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

describe("LoadingSpinner molecule", () => {
	it("renders spinner with optional icon and message", () => {
		const parent = createObsidianContainer();

		const spinner = LoadingSpinner.create(parent, {
			message: t("messages.loading"),
			icon: "⏳",
			className: "mt-md",
		});

		expect(spinner.className).toContain("loading-spinner");
		expect(spinner.className).toContain("mt-md");
		expect(spinner.querySelector(".loading-spinner-icon")?.textContent).toBe(
			"⏳"
		);
		expect(spinner.querySelector(".loading-spinner-message")?.textContent).toBe(
			t("messages.loading")
		);
	});

	it("uses default icon when none provided", () => {
		const parent = createObsidianContainer();

		const spinner = LoadingSpinner.create(parent, {
			message: "Loading data...",
		});

		expect(spinner.querySelector(".loading-spinner-icon")?.textContent).toBe("⏳");
	});

	it("renders spinner without message", () => {
		const parent = createObsidianContainer();

		const spinner = LoadingSpinner.create(parent, {
			icon: "🔄",
		});

		expect(spinner.querySelector(".loading-spinner-icon")?.textContent).toBe("🔄");
		expect(spinner.querySelector(".loading-spinner-message")).toBeNull();
	});

	it("renders spinner with no props", () => {
		const parent = createObsidianContainer();

		const spinner = LoadingSpinner.create(parent);

		expect(spinner.className).toContain("loading-spinner");
		expect(spinner.querySelector(".loading-spinner-icon")?.textContent).toBe("⏳");
		expect(spinner.querySelector(".loading-spinner-message")).toBeNull();
	});

	it("creates simple spinners and removes them", () => {
		const parent = createObsidianContainer();
		const spinner = LoadingSpinner.createSimple(parent, "mb-sm");

		expect(spinner.className).toContain("loading-spinner-simple");
		expect(spinner.className).toContain("mb-sm");

		LoadingSpinner.remove(spinner);
		expect(parent.contains(spinner)).toBe(false);
	});

	it("creates simple spinner without className", () => {
		const parent = createObsidianContainer();

		const spinner = LoadingSpinner.createSimple(parent);

		expect(spinner.className).toContain("loading-spinner-simple");
	});
});

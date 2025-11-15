/** @jest-environment jsdom */

import { InfoBanner } from "@app/components/molecules/InfoBanner";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("InfoBanner molecule", () => {
	it("renders info banners with default type", () => {
		const parent = createObsidianContainer();
		const banner = InfoBanner.render(parent, "No data yet");

		expect(parent.contains(banner)).toBe(true);
		expect(banner.classList.contains("workout-charts-info")).toBe(true);
		expect(banner.classList.contains("workout-charts-info-info")).toBe(true);
		expect(banner.textContent).toBe("No data yet");
	});

	it("supports alternate banner types", () => {
		const parent = createObsidianContainer();
		const banner = InfoBanner.render(parent, "Check your filters", "warning");

		expect(banner.classList.contains("workout-charts-info-warning")).toBe(true);
	});
});

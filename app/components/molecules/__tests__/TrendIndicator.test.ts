/** @jest-environment jsdom */

import { CONSTANTS } from "@app/constants";
import { TrendIndicator } from "@app/components/molecules/TrendIndicator";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("TrendIndicator molecule", () => {
	it("renders arrow, percentage, and optional label", () => {
		const parent = createObsidianContainer();
		const arrows = TrendIndicator as unknown as {
			ARROW_UP: string;
			ARROW_DOWN: string;
			ARROW_NEUTRAL: string;
		};

		const indicator = TrendIndicator.create(parent, {
			percentage: -12.34,
			direction: CONSTANTS.WORKOUT.TRENDS.DIRECTIONS.DOWN,
			label: "vs last week",
			className: "mt-lg",
		});

		expect(indicator.className).toContain("trend-indicator");
		expect(indicator.className).toContain("trend-down");
		expect(indicator.className).toContain("mt-lg");

		expect(indicator.querySelector(".trend-arrow")?.textContent).toBe(
			arrows.ARROW_DOWN
		);
		expect(indicator.querySelector(".trend-percentage")?.textContent).toBe(
			"12.3%"
		);
		expect(indicator.querySelector(".trend-label")?.textContent).toBe(
			"vs last week"
		);
	});

	it("omits the optional label for neutral trends", () => {
		const parent = createObsidianContainer();
		const arrows = TrendIndicator as unknown as {
			ARROW_UP: string;
			ARROW_DOWN: string;
			ARROW_NEUTRAL: string;
		};
		const indicator = TrendIndicator.create(parent, {
			percentage: 0,
			direction: CONSTANTS.WORKOUT.TRENDS.DIRECTIONS.NEUTRAL,
		});

		expect(indicator.querySelector(".trend-label")).toBeNull();
		expect(indicator.querySelector(".trend-arrow")?.textContent).toBe(
			arrows.ARROW_NEUTRAL
		);
	});
});

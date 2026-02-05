/** @jest-environment jsdom */

import { CONSTANTS } from "@app/constants";
import { ChartLegendItem } from "@app/features/charts/ui/ChartLegendItem";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("ChartLegendItem", () => {
	it("renders color indicator and text", () => {
		const parent = createObsidianContainer();

		const item = ChartLegendItem.create(parent, {
			color: "#FF6384",
			label: CONSTANTS.WORKOUT.MUSCLES.BODY_PARTS.UPPER_BODY,
			value: CONSTANTS.WORKOUT.UI.DISPLAY.PERCENTAGE_45,
			className: "ml-sm",
		});

		expect(item.className).toContain("chart-legend-item");
		expect(item.className).toContain("ml-sm");

		const colorBox = item.querySelector(".chart-legend-color") as HTMLElement;
		expect(colorBox).toBeTruthy();
		expect(colorBox.style.backgroundColor).toBe("rgb(255, 99, 132)");

		expect(item.querySelector(".chart-legend-label")?.textContent).toBe(
			CONSTANTS.WORKOUT.MUSCLES.BODY_PARTS.UPPER_BODY
		);
		expect(item.querySelector(".chart-legend-value")?.textContent).toBe(CONSTANTS.WORKOUT.UI.DISPLAY.PERCENTAGE_45);
	});

	it("omits the value section when not provided", () => {
		const parent = createObsidianContainer();
		const item = ChartLegendItem.create(parent, {
			color: "#000000",
			label: "Misc",
		});

		expect(item.querySelector(".chart-legend-value")).toBeNull();
	});

	describe("interactivity", () => {
		it("adds clickable class and calls onClick when clicked", () => {
			const parent = createObsidianContainer();
			const onClick = jest.fn();

			const item = ChartLegendItem.create(parent, {
				color: "#FF6384",
				label: "Drop Set",
				onClick,
			});

			expect(item.classList.contains("chart-legend-item-clickable")).toBe(true);

			item.click();
			expect(onClick).toHaveBeenCalledTimes(1);
		});

		it("adds active class when isActive is true", () => {
			const parent = createObsidianContainer();

			const item = ChartLegendItem.create(parent, {
				color: "#FF6384",
				label: "Drop Set",
				isActive: true,
			});

			expect(item.classList.contains("chart-legend-item-active")).toBe(true);
		});

		it("adds dimmed class when isDimmed is true", () => {
			const parent = createObsidianContainer();

			const item = ChartLegendItem.create(parent, {
				color: "rgba(255, 99, 132, 0.7)",
				label: "Standard",
				isDimmed: true,
			});

			expect(item.classList.contains("chart-legend-item-dimmed")).toBe(true);

			// Check that color opacity is reduced
			const colorBox = item.querySelector(".chart-legend-color") as HTMLElement;
			expect(colorBox.style.backgroundColor).toBe("rgba(255, 99, 132, 0.3)");
		});

		it("sets tooltip when provided", () => {
			const parent = createObsidianContainer();

			const item = ChartLegendItem.create(parent, {
				color: "#FF6384",
				label: "Drop Set",
				tooltip: "Click to filter",
			});

			expect(item.getAttribute("title")).toBe("Click to filter");
		});
	});

	describe("setState", () => {
		it("toggles active class", () => {
			const parent = createObsidianContainer();
			const item = ChartLegendItem.create(parent, {
				color: "#FF6384",
				label: "Test",
			});

			ChartLegendItem.setState(item, true, false);
			expect(item.classList.contains("chart-legend-item-active")).toBe(true);
			expect(item.classList.contains("chart-legend-item-dimmed")).toBe(false);

			ChartLegendItem.setState(item, false, true);
			expect(item.classList.contains("chart-legend-item-active")).toBe(false);
			expect(item.classList.contains("chart-legend-item-dimmed")).toBe(true);
		});
	});
});

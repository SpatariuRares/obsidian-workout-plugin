/** @jest-environment jsdom */

import { ChartLegendItem } from "@app/components/molecules/ChartLegendItem";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("ChartLegendItem molecule", () => {
	it("renders color indicator and text", () => {
		const parent = createObsidianContainer();

		const item = ChartLegendItem.create(parent, {
			color: "#FF6384",
			label: "Upper Body",
			value: "45%",
			className: "ml-sm",
		});

		expect(item.className).toContain("chart-legend-item");
		expect(item.className).toContain("ml-sm");

		const colorBox = item.querySelector(".chart-legend-color") as HTMLElement;
		expect(colorBox).toBeTruthy();
		expect(colorBox.style.backgroundColor).toBe("rgb(255, 99, 132)");

		expect(item.querySelector(".chart-legend-label")?.textContent).toBe(
			"Upper Body"
		);
		expect(item.querySelector(".chart-legend-value")?.textContent).toBe("45%");
	});

	it("omits the value section when not provided", () => {
		const parent = createObsidianContainer();
		const item = ChartLegendItem.create(parent, {
			color: "#000000",
			label: "Misc",
		});

		expect(item.querySelector(".chart-legend-value")).toBeNull();
	});
});

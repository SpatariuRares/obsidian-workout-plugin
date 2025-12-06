/** @jest-environment jsdom */

import { ChartLegendItem } from "@app/components/molecules/ChartLegendItem";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { TEXT_CONSTANTS } from "@app/constants";

describe("ChartLegendItem molecule", () => {
	it("renders color indicator and text", () => {
		const parent = createObsidianContainer();

		const item = ChartLegendItem.create(parent, {
			color: "#FF6384",
			label: TEXT_CONSTANTS.MUSCLES.BODY_PARTS.UPPER_BODY,
			value: TEXT_CONSTANTS.UI.DISPLAY.PERCENTAGE_45,
			className: "ml-sm",
		});

		expect(item.className).toContain("chart-legend-item");
		expect(item.className).toContain("ml-sm");

		const colorBox = item.querySelector(".chart-legend-color") as HTMLElement;
		expect(colorBox).toBeTruthy();
		expect(colorBox.style.backgroundColor).toBe("rgb(255, 99, 132)");

		expect(item.querySelector(".chart-legend-label")?.textContent).toBe(
			TEXT_CONSTANTS.MUSCLES.BODY_PARTS.UPPER_BODY
		);
		expect(item.querySelector(".chart-legend-value")?.textContent).toBe(TEXT_CONSTANTS.UI.DISPLAY.PERCENTAGE_45);
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

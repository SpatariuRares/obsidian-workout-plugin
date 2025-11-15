/** @jest-environment jsdom */

import { ProgressBar } from "@app/components/molecules/ProgressBar";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("ProgressBar", () => {
	it("renders labels, percentage text, and variant styling", () => {
		const parent = createObsidianContainer();

		const container = ProgressBar.create(parent, {
			percentage: 145,
			label: "Workout progress",
			showPercentage: true,
			className: "mb-4",
			variant: "success",
		});

		expect(parent.contains(container)).toBe(true);
		expect(container.className).toContain("progress-bar-container");
		expect(container.className).toContain("mb-4");

		const label = container.querySelector(".progress-bar-label");
		expect(label?.textContent).toBe("Workout progress");

		const labelPercentage = container.querySelector(
			".progress-bar-percentage-text"
		);
		expect(labelPercentage?.textContent).toBe("100%");

		const fill = container.querySelector(".progress-bar-fill") as HTMLElement;
		expect(fill).toBeTruthy();
		expect(fill.className).toContain("progress-bar-success");
		expect(fill.style.width).toBe("100%");
	});

	it("shows inline percentage when no label and updates via updatePercentage", () => {
		const parent = createObsidianContainer();

		const container = ProgressBar.create(parent, {
			percentage: -25,
			showPercentage: true,
		});

		const fill = container.querySelector(".progress-bar-fill") as HTMLElement;
		expect(fill).toBeTruthy();
		expect(fill.style.width).toBe("0%");

		const inlineText = container.querySelector(
			".progress-bar-percentage-inline"
		) as HTMLElement;
		expect(inlineText).toBeTruthy();
		expect(inlineText.textContent).toBe("0%");

		ProgressBar.updatePercentage(container, 65.2);
		expect(fill.style.width).toBe("65.2%");
		expect(inlineText.textContent).toBe("65%");

		ProgressBar.updatePercentage(container, 200);
		expect(fill.style.width).toBe("100%");
		expect(inlineText.textContent).toBe("100%");
	});
});

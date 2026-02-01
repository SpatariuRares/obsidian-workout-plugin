/** @jest-environment jsdom */

import { FilterIndicator } from "@app/components/molecules/FilterIndicator";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("FilterIndicator molecule", () => {
	it("renders label, filter value badge, and clear button", () => {
		const parent = createObsidianContainer();
		const onClear = jest.fn();

		const indicator = FilterIndicator.create(parent, {
			label: "Filtering by:",
			filterValue: "Drop Set",
			onClear,
		});

		expect(parent.contains(indicator)).toBe(true);
		expect(indicator.classList.contains("workout-filter-indicator")).toBe(true);

		// Check label text
		const labelEl = indicator.querySelector(".workout-filter-indicator-text");
		expect(labelEl?.textContent).toBe("Filtering by: ");

		// Check badge
		const badge = indicator.querySelector(".workout-filter-indicator-badge");
		expect(badge?.textContent).toBe("Drop Set");

		// Check clear button
		const clearBtn = indicator.querySelector(".workout-filter-indicator-clear");
		expect(clearBtn).not.toBeNull();
		expect(clearBtn?.textContent).toBe("Clear");
	});

	it("uses custom className when provided", () => {
		const parent = createObsidianContainer();

		const indicator = FilterIndicator.create(parent, {
			label: "Filter:",
			filterValue: "Myo",
			onClear: jest.fn(),
			className: "workout-protocol-filter-indicator",
		});

		expect(indicator.classList.contains("workout-protocol-filter-indicator")).toBe(true);
		expect(indicator.classList.contains("workout-filter-indicator")).toBe(false);
	});

	it("applies color to badge when provided", () => {
		const parent = createObsidianContainer();

		const indicator = FilterIndicator.create(parent, {
			label: "Filter:",
			filterValue: "Rest Pause",
			color: "rgba(255, 153, 0, 0.7)",
			onClear: jest.fn(),
		});

		const badge = indicator.querySelector(".workout-filter-indicator-badge") as HTMLElement;
		expect(badge.style.backgroundColor).toBe("rgba(255, 153, 0, 0.7)");
	});

	it("uses custom clearText when provided", () => {
		const parent = createObsidianContainer();

		const indicator = FilterIndicator.create(parent, {
			label: "Active:",
			filterValue: "Superset",
			onClear: jest.fn(),
			clearText: "Reset",
		});

		const clearBtn = indicator.querySelector(".workout-filter-indicator-clear");
		expect(clearBtn?.textContent).toBe("Reset");
	});

	it("calls onClear when clear button is clicked", () => {
		const parent = createObsidianContainer();
		const onClear = jest.fn();

		const indicator = FilterIndicator.create(parent, {
			label: "Filter:",
			filterValue: "21s",
			onClear,
		});

		const clearBtn = indicator.querySelector(".workout-filter-indicator-clear") as HTMLButtonElement;
		clearBtn.click();

		expect(onClear).toHaveBeenCalledTimes(1);
	});
});

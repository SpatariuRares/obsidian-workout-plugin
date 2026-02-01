/** @jest-environment jsdom */

import { SpacerStat } from "@app/components/atoms/SpacerStat";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("SpacerStat atom", () => {
	it("renders a span with icon and bolded value", () => {
		const parent = createObsidianContainer();

		const stat = SpacerStat.create(parent, {
			icon: "🔄",
			value: "42",
		});

		expect(parent.contains(stat)).toBe(true);
		expect(stat.classList.contains("workout-spacer-stat")).toBe(true);
		expect(stat.textContent).toContain("🔄");
		expect(stat.querySelector("strong")?.textContent).toBe("42");
	});

	it("renders without icon when not provided", () => {
		const parent = createObsidianContainer();

		const stat = SpacerStat.create(parent, {
			value: "10 sets",
		});

		expect(stat.textContent).toBe("10 sets");
		expect(stat.querySelector("strong")?.textContent).toBe("10 sets");
	});

	it("uses custom className when provided", () => {
		const parent = createObsidianContainer();

		const stat = SpacerStat.create(parent, {
			icon: "⏱️",
			value: "30s",
			className: "custom-stat-class",
		});

		expect(stat.classList.contains("custom-stat-class")).toBe(true);
		expect(stat.classList.contains("workout-spacer-stat")).toBe(false);
	});

	it("renders value in strong element", () => {
		const parent = createObsidianContainer();

		const stat = SpacerStat.create(parent, {
			icon: "🏋️",
			value: "100kg",
		});

		const strongEl = stat.querySelector("strong");
		expect(strongEl).not.toBeNull();
		expect(strongEl?.textContent).toBe("100kg");
	});
});

/** @jest-environment jsdom */

import { StatCard } from "@app/components/molecules/StatCard";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("StatCard molecule", () => {
	it("renders icon, value, and label", () => {
		const parent = createObsidianContainer();

		const card = StatCard.create(parent, {
			icon: "🏋️",
			value: 42,
			label: "Workouts",
			className: "highlight",
		});

		expect(card.classList.contains("stat-card")).toBe(true);
		expect(card.className).toContain("highlight");
		expect(card.querySelector(".stat-card-icon")?.textContent).toBe("🏋️");
		expect(card.querySelector(".stat-card-value")?.textContent).toBe("42");
		expect(card.querySelector(".stat-card-label")?.textContent).toBe(
			"Workouts"
		);
	});
});

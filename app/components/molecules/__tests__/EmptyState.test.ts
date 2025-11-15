/** @jest-environment jsdom */

import { EmptyState } from "@app/components/molecules/EmptyState";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("EmptyState molecule", () => {
	it("shows custom icons and message text", () => {
		const parent = createObsidianContainer();

		const state = EmptyState.create(parent, {
			icon: "📄",
			message: "No workouts logged",
			className: "mt-lg",
		});

		expect(state.className).toContain("empty-state");
		expect(state.className).toContain("mt-lg");
		expect(state.querySelector(".empty-state-icon")?.textContent).toBe("📄");
		expect(state.querySelector(".empty-state-message")?.textContent).toBe(
			"No workouts logged"
		);
	});

	it("falls back to the default icon when none provided", () => {
		const parent = createObsidianContainer();
		const defaults = EmptyState as unknown as { DEFAULT_ICON: string };
		const state = EmptyState.create(parent, {
			message: "Nothing to see here",
		});

		expect(state.querySelector(".empty-state-icon")?.textContent).toBe(
			defaults.DEFAULT_ICON
		);
	});
});

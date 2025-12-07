/** @jest-environment jsdom */

import { CONSTANTS } from "@app/constants/Constants";
import { Badge } from "@app/components/molecules/Badge";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Badge molecule", () => {
	it("renders badges with optional icons and variants", () => {
		const parent = createObsidianContainer();

		const badge = Badge.create(parent, {
			text: CONSTANTS.WORKOUT.MUSCLES.BODY_PARTS.UPPER_BODY,
			icon: "💪",
			variant: "info",
			className: "mb-2",
		});

		expect(parent.contains(badge)).toBe(true);
		expect(badge.classList.contains("badge")).toBe(true);
		expect(badge.className).toContain("badge-info");
		expect(badge.className).toContain("mb-2");
		expect(badge.querySelector(".badge-icon")?.textContent).toBe("💪");
		expect(badge.querySelector(".badge-text")?.textContent).toBe(CONSTANTS.WORKOUT.MUSCLES.BODY_PARTS.UPPER_BODY);
	});

	it("creates count badges via helper", () => {
		const parent = createObsidianContainer();
		const badge = Badge.createCount(parent, 5, "ml-2");

		expect(badge.className).toContain("badge-count");
		expect(badge.textContent).toBe("5");
	});
});

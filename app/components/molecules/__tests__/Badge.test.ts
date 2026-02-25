/** @jest-environment jsdom */

import { Badge } from "@app/components/molecules/Badge";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { BODY_PARTS } from "@app/constants/muscles.constants";

describe("Badge molecule", () => {
	it("renders badges with optional icons and variants", () => {
		const parent = createObsidianContainer();

		const badge = Badge.create(parent, {
			text: BODY_PARTS.UPPER_BODY,
			icon: "💪",
			variant: "info",
			className: "mb-2",
		});

		expect(parent.contains(badge)).toBe(true);
		expect(badge.classList.contains("badge")).toBe(true);
		expect(badge.className).toContain("badge-info");
		expect(badge.className).toContain("mb-2");
		expect(badge.querySelector(".badge-icon")?.textContent).toBe("💪");
		expect(badge.querySelector(".badge-text")?.textContent).toBe(BODY_PARTS.UPPER_BODY);
	});

	it("uses default variant when none provided", () => {
		const parent = createObsidianContainer();

		const badge = Badge.create(parent, {
			text: "Default badge",
		});

		expect(badge.className).toContain("badge-default");
	});

	it("renders badge without icon when none provided", () => {
		const parent = createObsidianContainer();

		const badge = Badge.create(parent, {
			text: "No icon",
			variant: "warning",
		});

		expect(badge.querySelector(".badge-icon")).toBeNull();
		expect(badge.querySelector(".badge-text")?.textContent).toBe("No icon");
	});

	it("renders badge without className when none provided", () => {
		const parent = createObsidianContainer();

		const badge = Badge.create(parent, {
			text: "Minimal",
		});

		expect(badge.classList.contains("badge")).toBe(true);
		expect(badge.classList.contains("badge-default")).toBe(true);
	});

	it("creates count badges via helper", () => {
		const parent = createObsidianContainer();
		const badge = Badge.createCount(parent, 5, "ml-2");

		expect(badge.className).toContain("badge-count");
		expect(badge.textContent).toBe("5");
	});

	it("creates count badges without className", () => {
		const parent = createObsidianContainer();
		const badge = Badge.createCount(parent, 10);

		expect(badge.className).toContain("badge-count");
		expect(badge.querySelector(".badge-text")?.textContent).toBe("10");
	});
});

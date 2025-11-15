/** @jest-environment jsdom */

import { Container } from "@app/components/atoms/Container";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Container atom", () => {
	it("creates divs with optional class and id", () => {
		const parent = createObsidianContainer();

		const container = Container.create(parent, {
			className: "flex gap-sm",
			id: "stats",
		});

		expect(parent.contains(container)).toBe(true);
		expect(container.classList.contains("flex")).toBe(true);
		expect(container.classList.contains("gap-sm")).toBe(true);
		expect(container.id).toBe("stats");
	});

	it("uses the default container class when no options are provided", () => {
		const parent = createObsidianContainer();
		const container = Container.create(parent);

		expect(container.classList.contains("container")).toBe(true);
	});
});

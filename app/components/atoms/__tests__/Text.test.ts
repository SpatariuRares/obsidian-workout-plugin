/** @jest-environment jsdom */

import { Text } from "@app/components/atoms/Text";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Text atom", () => {
	it("creates generic text elements", () => {
		const parent = createObsidianContainer();

		const paragraph = Text.create(parent, {
			text: "Workout summary",
			className: "summary",
			tag: "p",
		});

		expect(paragraph.tagName).toBe("P");
		expect(paragraph.classList.contains("summary")).toBe(true);
		expect(paragraph.textContent).toBe("Workout summary");
	});

	it("uses span as default tag when none provided", () => {
		const parent = createObsidianContainer();

		const text = Text.create(parent, {
			text: "Default span",
		});

		expect(text.tagName).toBe("SPAN");
		expect(text.textContent).toBe("Default span");
	});

	it("provides shorthand helpers for span/strong/div", () => {
		const parent = createObsidianContainer();

		const span = Text.createSpan(parent, "Inline", "inline");
		const strong = Text.createStrong(parent, "Label");
		const div = Text.createDiv(parent, "Block");

		expect(span.tagName).toBe("SPAN");
		expect(span.classList.contains("inline")).toBe(true);

		expect(strong.tagName).toBe("STRONG");
		expect(strong.textContent).toBe("Label");

		expect(div.tagName).toBe("DIV");
		expect(div.textContent).toBe("Block");
	});
});

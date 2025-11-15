/** @jest-environment jsdom */

import { SearchBox } from "@app/components/molecules/SearchBox";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("SearchBox molecule", () => {
	it("renders icon and input with provided props", () => {
		const parent = createObsidianContainer();

		const searchBox = SearchBox.create(parent, {
			placeholder: "Search exercises...",
			value: "bench press",
			icon: "🔎",
			className: "mb-2",
		});

		expect(searchBox.container.className).toContain("search-box");
		expect(searchBox.container.className).toContain("mb-2");
		expect(searchBox.icon.textContent).toBe("🔎");
		expect(searchBox.input.classList.contains("search-box-input")).toBe(true);
		expect(searchBox.input.getAttribute("placeholder")).toBe(
			"Search exercises..."
		);
		expect(searchBox.input.value).toBe("bench press");
	});

	it("exposes helpers to get/clear the input value", () => {
		const parent = createObsidianContainer();
		const searchBox = SearchBox.create(parent);

		expect(searchBox.input.getAttribute("placeholder")).toBe("Search...");

		searchBox.input.value = "squat";
		expect(SearchBox.getValue(searchBox)).toBe("squat");

		SearchBox.clear(searchBox);
		expect(searchBox.input.value).toBe("");
	});
});

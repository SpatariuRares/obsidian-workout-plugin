/** @jest-environment jsdom */

import { ListItem } from "@app/components/molecules/ListItem";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("ListItem molecule", () => {
	describe("createList", () => {
		it("creates an empty ul element with default class", () => {
			const parent = createObsidianContainer();

			const list = ListItem.createList(parent);

			expect(list.tagName).toBe("UL");
			expect(list.classList.contains("workout-list")).toBe(true);
			expect(list.children.length).toBe(0);
		});

		it("creates ul with custom class", () => {
			const parent = createObsidianContainer();

			const list = ListItem.createList(parent, {
				className: "workout-muscle-group-list",
			});

			expect(list.classList.contains("workout-muscle-group-list")).toBe(true);
		});

		it("creates list with items when provided", () => {
			const parent = createObsidianContainer();

			const list = ListItem.createList(parent, {
				className: "workout-list",
				items: [
					{ label: "Squat", value: "1000 vol" },
					{ label: "Deadlift", value: "1200 vol" },
				],
			});

			expect(list.children.length).toBe(2);
			expect(list.children[0].textContent).toContain("Squat");
			expect(list.children[1].textContent).toContain("Deadlift");
		});
	});

	describe("create", () => {
		it("creates li with label and value", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.create(list, {
				label: "Bench Press",
				value: "8,500 vol",
				className: "workout-muscle-group-item",
			});

			expect(item.tagName).toBe("LI");
			expect(item.classList.contains("workout-muscle-group-item")).toBe(true);
			expect(
				item.querySelector(".workout-list-item-label")?.textContent
			).toBe("Bench Press");
			expect(
				item.querySelector(".workout-list-item-value")?.textContent
			).toBe("8,500 vol");
		});

		it("renders icon when provided", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.create(list, {
				label: "Squat",
				value: "1000",
				icon: "🏋️",
			});

			expect(item.querySelector(".workout-list-item-icon")?.textContent).toBe(
				"🏋️"
			);
		});

		it("renders secondary text when provided", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.create(list, {
				label: "Upper Body A",
				value: "8,200 vol",
				secondary: "2024-01-15",
			});

			expect(
				item.querySelector(".workout-list-item-secondary")?.textContent
			).toBe("2024-01-15");
		});

		it("adds click handler and clickable class", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);
			const onClick = jest.fn();

			const item = ListItem.create(list, {
				label: "Clickable Item",
				onClick,
			});

			expect(item.classList.contains("clickable")).toBe(true);
			item.click();
			expect(onClick).toHaveBeenCalledTimes(1);
		});

		it("adds data attributes when provided", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.create(list, {
				label: "Test Item",
				dataAttributes: { exercise: "squat", index: "0" },
			});

			expect(item.dataset.exercise).toBe("squat");
			expect(item.dataset.index).toBe("0");
		});

		it("uses custom label and value classes", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.create(list, {
				label: "Test",
				value: "100",
				labelClassName: "custom-label",
				valueClassName: "custom-value",
			});

			expect(item.querySelector(".custom-label")?.textContent).toBe("Test");
			expect(item.querySelector(".custom-value")?.textContent).toBe("100");
		});
	});

	describe("createSimple", () => {
		it("creates simple label-value item", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.createSimple(
				list,
				"Squat",
				"12,500 vol",
				"workout-exercise-item"
			);

			expect(item.tagName).toBe("LI");
			expect(item.classList.contains("workout-exercise-item")).toBe(true);
			expect(item.textContent).toContain("Squat");
			expect(item.textContent).toContain("12,500 vol");
		});

		it("handles numeric values", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.createSimple(list, "Reps", 42);

			expect(item.textContent).toContain("42");
		});
	});

	describe("createText", () => {
		it("creates text-only list item", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.createText(list, {
				text: "Weight → Peso",
				className: "workout-mapping-item",
			});

			expect(item.tagName).toBe("LI");
			expect(item.textContent).toBe("Weight → Peso");
			expect(item.classList.contains("workout-mapping-item")).toBe(true);
		});

		it("uses default class when not provided", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.createText(list, { text: "Simple text" });

			expect(item.classList.contains("workout-list-item")).toBe(true);
		});
	});

	describe("createStat", () => {
		it("creates stat item with label and bold value", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.createStat(list, {
				label: "Max: ",
				value: "125.5 kg",
			});

			expect(item.tagName).toBe("LI");
			expect(item.textContent).toContain("Max:");
			expect(item.querySelector("strong")?.textContent).toBe("125.5 kg");
		});

		it("includes suffix when provided", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.createStat(list, {
				label: "Max: ",
				value: "125.5 kg",
				suffix: " (2024-01-15)",
			});

			expect(item.textContent).toContain("(2024-01-15)");
		});

		it("applies custom value class", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.createStat(list, {
				label: "Avg: ",
				value: 100,
				valueClassName: "highlight-value",
			});

			expect(item.querySelector("strong")?.classList.contains("highlight-value")).toBe(true);
		});
	});

	describe("createEmpty", () => {
		it("creates empty list item for custom content", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.createEmpty(list, "workout-custom-item");

			expect(item.tagName).toBe("LI");
			expect(item.classList.contains("workout-custom-item")).toBe(true);
			expect(item.children.length).toBe(0);
		});

		it("allows adding custom children", () => {
			const parent = createObsidianContainer();
			const list = ListItem.createList(parent);

			const item = ListItem.createEmpty(list);
			const link = item.createEl("a", { text: "Click me" });

			expect(item.contains(link)).toBe(true);
			expect(link.textContent).toBe("Click me");
		});
	});
});

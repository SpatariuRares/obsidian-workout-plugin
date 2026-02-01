/** @jest-environment jsdom */

import { Chip } from "@app/components/atoms/Chip";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Chip atom", () => {
	it("renders a button with text", () => {
		const parent = createObsidianContainer();

		const chip = Chip.create(parent, {
			text: "Squat",
		});

		expect(parent.contains(chip)).toBe(true);
		expect(chip.tagName).toBe("BUTTON");
		expect(chip.textContent).toBe("Squat");
		expect(chip.getAttribute("type")).toBe("button");
	});

	it("uses default workout-chip class when no className provided", () => {
		const parent = createObsidianContainer();

		const chip = Chip.create(parent, {
			text: "Bench Press",
		});

		expect(chip.classList.contains("workout-chip")).toBe(true);
	});

	it("uses custom className when provided", () => {
		const parent = createObsidianContainer();

		const chip = Chip.create(parent, {
			text: "Deadlift",
			className: "workout-quick-log-chip",
		});

		expect(chip.classList.contains("workout-quick-log-chip")).toBe(true);
		expect(chip.classList.contains("workout-chip")).toBe(false);
	});

	it("sets aria-label when provided", () => {
		const parent = createObsidianContainer();

		const chip = Chip.create(parent, {
			text: "Hip Thrust",
			ariaLabel: "Select Hip Thrust exercise",
		});

		expect(chip.getAttribute("aria-label")).toBe("Select Hip Thrust exercise");
	});

	it("calls onClick handler when clicked", () => {
		const parent = createObsidianContainer();
		const onClick = jest.fn();

		const chip = Chip.create(parent, {
			text: "Squat",
			onClick,
		});

		chip.click();

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("adds selected class and aria-pressed when selected", () => {
		const parent = createObsidianContainer();

		const chip = Chip.create(parent, {
			text: "Squat",
			selected: true,
		});

		expect(chip.classList.contains("workout-chip-selected")).toBe(true);
		expect(chip.getAttribute("aria-pressed")).toBe("true");
	});

	it("sets aria-pressed to false when not selected", () => {
		const parent = createObsidianContainer();

		const chip = Chip.create(parent, {
			text: "Squat",
			selected: false,
		});

		expect(chip.classList.contains("workout-chip-selected")).toBe(false);
		expect(chip.getAttribute("aria-pressed")).toBe("false");
	});

	describe("setSelected", () => {
		it("adds selected state", () => {
			const parent = createObsidianContainer();
			const chip = Chip.create(parent, { text: "Squat" });

			Chip.setSelected(chip, true);

			expect(chip.classList.contains("workout-chip-selected")).toBe(true);
			expect(chip.getAttribute("aria-pressed")).toBe("true");
		});

		it("removes selected state", () => {
			const parent = createObsidianContainer();
			const chip = Chip.create(parent, { text: "Squat", selected: true });

			Chip.setSelected(chip, false);

			expect(chip.classList.contains("workout-chip-selected")).toBe(false);
			expect(chip.getAttribute("aria-pressed")).toBe("false");
		});
	});
});

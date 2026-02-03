/** @jest-environment jsdom */

import { CopyableBadge } from "@app/components/molecules/CopyableBadge";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

// Mock clipboard API
const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
	clipboard: {
		writeText: mockWriteText,
	},
});

describe("CopyableBadge molecule", () => {
	beforeEach(() => {
		mockWriteText.mockClear();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("renders icon and text", () => {
		const parent = createObsidianContainer();

		const badge = CopyableBadge.create(parent, {
			icon: "💪",
			text: "Biceps",
			copyValue: "biceps",
		});

		expect(parent.contains(badge)).toBe(true);
		expect(badge.classList.contains("workout-copyable-badge")).toBe(true);

		const icon = badge.querySelector(".workout-copyable-badge-icon");
		expect(icon?.textContent).toBe("💪");

		const text = badge.querySelector(".workout-copyable-badge-text");
		expect(text?.textContent).toBe("Biceps");
	});

	it("renders without icon when not provided", () => {
		const parent = createObsidianContainer();

		const badge = CopyableBadge.create(parent, {
			text: "Quadriceps",
			copyValue: "quadriceps",
		});

		const icon = badge.querySelector(".workout-copyable-badge-icon");
		expect(icon).toBeNull();

		const text = badge.querySelector(".workout-copyable-badge-text");
		expect(text?.textContent).toBe("Quadriceps");
	});

	it("uses custom className when provided", () => {
		const parent = createObsidianContainer();

		const badge = CopyableBadge.create(parent, {
			text: "Glutes",
			copyValue: "glutes",
			className: "workout-muscle-tag-badge",
		});

		expect(badge.classList.contains("workout-muscle-tag-badge")).toBe(true);
		expect(badge.classList.contains("workout-copyable-badge")).toBe(false);
	});

	it("sets tooltip when provided", () => {
		const parent = createObsidianContainer();

		const badge = CopyableBadge.create(parent, {
			text: "Hamstrings",
			copyValue: "hamstrings",
			tooltip: "Click to copy 'hamstrings'",
		});

		expect(badge.getAttribute("title")).toBe("Click to copy 'hamstrings'");
	});

	it("sets data attributes when provided", () => {
		const parent = createObsidianContainer();

		const badge = CopyableBadge.create(parent, {
			text: "Calves",
			copyValue: "calves",
			dataAttributes: { muscle: "calves", group: "legs" },
		});

		expect(badge.getAttribute("data-muscle")).toBe("calves");
		expect(badge.getAttribute("data-group")).toBe("legs");
	});

	it("copies value to clipboard on click", () => {
		const parent = createObsidianContainer();

		const badge = CopyableBadge.create(parent, {
			text: "Triceps",
			copyValue: "triceps",
		});

		badge.click();

		expect(mockWriteText).toHaveBeenCalledWith("triceps");
	});

	it("adds copied class temporarily on click", () => {
		const parent = createObsidianContainer();

		const badge = CopyableBadge.create(parent, {
			text: "Chest",
			copyValue: "chest",
		});

		badge.click();

		expect(badge.classList.contains("workout-copied")).toBe(true);

		// After default duration (1000ms)
		jest.advanceTimersByTime(1000);

		expect(badge.classList.contains("workout-copied")).toBe(false);
	});

	it("uses custom copied class and duration", () => {
		const parent = createObsidianContainer();

		const badge = CopyableBadge.create(parent, {
			text: "Back",
			copyValue: "back",
			copiedClass: "custom-copied",
			copiedDuration: 500,
		});

		badge.click();

		expect(badge.classList.contains("custom-copied")).toBe(true);

		// After custom duration (500ms)
		jest.advanceTimersByTime(500);

		expect(badge.classList.contains("custom-copied")).toBe(false);
	});

	it("adds clickable class for cursor indication", () => {
		const parent = createObsidianContainer();

		const badge = CopyableBadge.create(parent, {
			text: "Shoulders",
			copyValue: "shoulders",
		});

		expect(badge.classList.contains("workout-copyable-badge-clickable")).toBe(true);
	});

	it("handles clipboard write failure gracefully", () => {
		const parent = createObsidianContainer();
		mockWriteText.mockRejectedValueOnce(new Error("Clipboard access denied"));

		const badge = CopyableBadge.create(parent, {
			text: "Forearms",
			copyValue: "forearms",
		});

		// Should not throw
		expect(() => badge.click()).not.toThrow();
	});
});

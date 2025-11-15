/** @jest-environment jsdom */

import { Canvas } from "@app/components/atoms/Canvas";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Canvas atom", () => {
	it("creates a canvas with default class and dimensions", () => {
		const parent = createObsidianContainer();

		const canvas = Canvas.create(parent, {
			className: "chart-surface",
			width: 640,
			height: 360,
		});

		expect(parent.contains(canvas)).toBe(true);
		expect(canvas.classList.contains("chart-surface")).toBe(true);
		expect(canvas.width).toBe(640);
		expect(canvas.height).toBe(360);
	});

	it("falls back to the default canvas class when not provided", () => {
		const parent = createObsidianContainer();
		const canvas = Canvas.create(parent);

		expect(canvas.classList.contains("canvas")).toBe(true);
	});
});

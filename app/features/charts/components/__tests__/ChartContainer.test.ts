/** @jest-environment jsdom */

import { ChartContainer } from "../ChartContainer";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("ChartContainer", () => {
  it("creates a container with default class", () => {
    const parent = createObsidianContainer();
    const container = ChartContainer.create(parent);

    expect(parent.contains(container)).toBe(true);
    expect(container.classList.contains("workout-charts-container")).toBe(true);
  });

  it("creates a container with custom class", () => {
    const parent = createObsidianContainer();
    const container = ChartContainer.create(parent, "custom-container");

    expect(container.classList.contains("custom-container")).toBe(true);
  });

  it("creates a canvas with default class", () => {
    const container = createObsidianContainer();
    const canvas = ChartContainer.createCanvas(container);

    expect(container.contains(canvas)).toBe(true);
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas.classList.contains("workout-charts-canvas")).toBe(true);
  });

  it("creates a canvas with custom class", () => {
    const container = createObsidianContainer();
    const canvas = ChartContainer.createCanvas(container, "custom-canvas");

    expect(canvas.classList.contains("custom-canvas")).toBe(true);
  });

  it("creates container and canvas together", () => {
    const parent = createObsidianContainer();
    const { container, canvas } = ChartContainer.createWithCanvas(parent);

    expect(parent.contains(container)).toBe(true);
    expect(container.contains(canvas)).toBe(true);
  });
});

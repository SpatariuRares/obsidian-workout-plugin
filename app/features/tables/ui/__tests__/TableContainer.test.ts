/** @jest-environment jsdom */

import { TableContainer } from "@app/features/tables/ui/TableContainer";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("TableContainer", () => {
  it("creates a div with default class", () => {
    const parent = createObsidianContainer();

    const container = TableContainer.create(parent);

    expect(container.tagName).toBe("DIV");
    expect(container.classList.contains("workout-table-container")).toBe(true);
    expect(parent.contains(container)).toBe(true);
  });

  it("creates a div with custom class", () => {
    const parent = createObsidianContainer();

    const container = TableContainer.create(parent, "custom-class");

    expect(container.classList.contains("custom-class")).toBe(true);
  });
});

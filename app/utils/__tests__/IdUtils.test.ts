/** @jest-environment jsdom */

import { generateCodeBlockId, getElementScopedId } from "@app/utils/IdUtils";

describe("generateCodeBlockId", () => {
  it("is a short base36 id", () => {
    expect(generateCodeBlockId()).toMatch(/^[0-9a-z]{8,}$/);
  });

  it("starts with the prefix when given one", () => {
    expect(generateCodeBlockId("timer")).toMatch(/^timer-[0-9a-z]{8,}$/);
  });
});

describe("getElementScopedId", () => {
  it("returns the same id for the same element", () => {
    const el = document.createElement("div");

    expect(getElementScopedId(el, "chartId")).toBe(
      getElementScopedId(el, "chartId"),
    );
  });

  it("returns different ids for different elements", () => {
    expect(
      getElementScopedId(document.createElement("div"), "chartId"),
    ).not.toBe(getElementScopedId(document.createElement("div"), "chartId"));
  });
});

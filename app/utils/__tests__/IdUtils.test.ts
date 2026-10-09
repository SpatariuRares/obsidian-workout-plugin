/** @jest-environment jsdom */

import { getElementScopedId } from "@app/utils/IdUtils";

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

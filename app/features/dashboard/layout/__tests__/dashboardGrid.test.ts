import { minColumnsOf } from "@app/features/dashboard/layout/dashboardGrid";

describe("minColumnsOf", () => {
  it("is the fewest columns a widget reads well in, one for an unknown id", () => {
    expect(minColumnsOf("heatMap")).toBe(2);
    expect(minColumnsOf("summary")).toBe(1);
    expect(minColumnsOf("removedWidget")).toBe(1);
  });

  it("never asks for more columns than the grid has", () => {
    expect(minColumnsOf("heatMap", 1)).toBe(1);
    expect(minColumnsOf("heatMap", 3)).toBe(2);
  });
});

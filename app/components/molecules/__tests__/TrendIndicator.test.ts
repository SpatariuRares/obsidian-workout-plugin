/** @jest-environment jsdom */

import { TrendIndicator } from "@app/components/molecules/TrendIndicator";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("TrendIndicator molecule", () => {
  const arrowFor = (direction: "up" | "down" | "neutral") => {
    const parent = createObsidianContainer();
    const indicator = TrendIndicator.create(parent, {
      percentage: 25,
      direction,
    });
    return indicator.querySelector(".trend-arrow")?.getAttribute("data-icon");
  };

  it("shows an up arrow for an upward trend", () => {
    expect(arrowFor("up")).toBe("arrow-up");
  });

  it("shows a down arrow for a downward trend", () => {
    expect(arrowFor("down")).toBe("arrow-down");
  });

  it("shows a flat arrow for no change", () => {
    expect(arrowFor("neutral")).toBe("arrow-right");
  });

  it("adds a direction class and the absolute percentage", () => {
    const parent = createObsidianContainer();
    const indicator = TrendIndicator.create(parent, {
      percentage: -12.34,
      direction: "down",
    });

    expect(indicator.classList.contains("trend-down")).toBe(true);
    expect(
      indicator.querySelector(".trend-percentage")?.textContent,
    ).toBe("12.3%");
  });
});

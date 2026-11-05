/** @jest-environment jsdom */

import { TrendHeader } from "../TrendHeader";
import { TrendIndicators } from "@app/types/CommonTypes";

import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { TrendIndicator } from "@app/components/molecules";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";

jest.mock("@app/components/molecules", () => ({
  TrendIndicator: {
    create: jest.fn(() => document.createElement("div")),
  },
}));

describe("TrendHeader", () => {
  const baseIndicators: TrendIndicators = {
    trendDirection: "Up",
    trendColor: "green",
    trendIcon: "trending-up",
  };

  const rowOf = (container: HTMLElement) =>
    container.querySelector(".workout-chart-trend") as HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders one row with the direction, the change and the range", () => {
    const container = createObsidianContainer();

    TrendHeader.render(container, baseIndicators, [10, 20]);

    const row = rowOf(container);
    expect(row.classList.contains("is-up")).toBe(true);
    expect(
      row.querySelector(".workout-chart-trend-direction")?.textContent,
    ).toBe(baseIndicators.trendDirection);
    expect(TrendIndicator.create).toHaveBeenCalledWith(
      row,
      expect.objectContaining({
        direction: "up",
        percentage: 100,
        className: "workout-chart-trend-change",
      }),
    );
    expect(row.querySelector(".workout-chart-trend-range")?.textContent).toBe(
      CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_FROM_TO_FORMATTED(
        "10.0",
        "20.0",
      ).trim(),
    );
  });

  it("takes the variation from the trend line so it agrees with the trend label", () => {
    const container = createObsidianContainer();

    // Last value is below the first, but the trend line rises 5.4%
    TrendHeader.render(container, baseIndicators, [100, 150, 160, 170, 99]);

    expect(TrendIndicator.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ direction: "up", percentage: 5.4 }),
    );
  });

  it("treats lower values as improvement for pace data", () => {
    const container = createObsidianContainer();

    TrendHeader.render(container, baseIndicators, [5, 4], CHART_DATA_TYPE.PACE);

    expect(rowOf(container).classList.contains("is-up")).toBe(true);
    expect(TrendIndicator.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ direction: "up", percentage: 20 }),
    );
  });

  it("marks a falling line as down and a flat one as neutral", () => {
    const falling = createObsidianContainer();
    TrendHeader.render(falling, baseIndicators, [20, 10]);
    expect(rowOf(falling).classList.contains("is-down")).toBe(true);

    const flat = createObsidianContainer();
    TrendHeader.render(flat, baseIndicators, [10, 10]);
    expect(rowOf(flat).classList.contains("is-neutral")).toBe(true);
  });

  it("says not available when there is no data", () => {
    const container = createObsidianContainer();

    TrendHeader.render(container, baseIndicators, []);

    expect(TrendIndicator.create).not.toHaveBeenCalled();
    expect(
      container.querySelector(".workout-chart-trend-change")?.textContent,
    ).toBe(t("table.notAvailable"));
    expect(container.querySelector(".workout-chart-trend-range")).toBeNull();
  });

  it("says a rise from zero in words", () => {
    const container = createObsidianContainer();

    TrendHeader.render(container, baseIndicators, [0, 10]);

    expect(TrendIndicator.create).not.toHaveBeenCalled();
    expect(
      container.querySelector(".workout-chart-trend-change")?.textContent,
    ).toBe(t("charts.significantIncrease"));
  });

  it("shows the only value as the range", () => {
    const container = createObsidianContainer();

    TrendHeader.render(container, baseIndicators, [12.34]);

    expect(TrendIndicator.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ direction: "neutral", percentage: 0 }),
    );
    expect(
      container.querySelector(".workout-chart-trend-range")?.textContent,
    ).toBe(
      CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_VALUE_LABEL_FORMATTED("12.3"),
    );
  });
});

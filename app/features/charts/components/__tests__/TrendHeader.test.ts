/** @jest-environment jsdom */

import { TrendHeader } from "../TrendHeader";
import { TrendIndicators } from "@app/types/CommonTypes";

import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { TrendIndicator } from "@app/components/molecules";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { t } from "@app/i18n";

jest.mock("@app/components/molecules", () => ({
  TrendIndicator: {
    create: jest.fn(() => document.createElement("div")),
  },
}));

describe("TrendHeader", () => {
  const baseIndicators: TrendIndicators = {
    trendDirection: "Up",
    trendColor: "green",
    trendIcon: "^",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header styling and uses TrendIndicator for positive change", () => {
    const container = createObsidianContainer();

    TrendHeader.render(container, baseIndicators, [10, 20]);

    const header = container.querySelector(
      ".workout-charts-trend-header",
    ) as HTMLElement;
    const title = header.querySelector("h3") as HTMLElement;

    expect(title.classList.contains("trend-color-green")).toBe(true);
    expect(title.querySelector("strong")?.textContent).toBe(
      baseIndicators.trendDirection,
    );

    const indicatorCreate = TrendIndicator.create as jest.Mock;
    expect(indicatorCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        direction: "up",
        percentage: 100,
        className: "workout-charts-trend-variation",
      }),
    );
  });

  it("treats lower values as improvement for pace data", () => {
    const container = createObsidianContainer();

    TrendHeader.render(container, baseIndicators, [5, 4], CHART_DATA_TYPE.PACE);

    const indicatorCreate = TrendIndicator.create as jest.Mock;
    expect(indicatorCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        direction: "up",
        percentage: 20,
      }),
    );
  });

  it("applies trend color classes for red, orange, and default colors", () => {
    const cases = [
      { color: "red", expectedClass: "trend-color-red" },
      { color: "orange", expectedClass: "trend-color-orange" },
      { color: "blue", expectedClass: "trend-color-accent" },
    ];

    cases.forEach(({ color, expectedClass }) => {
      const container = createObsidianContainer();

      TrendHeader.render(
        container,
        { ...baseIndicators, trendColor: color },
        [10, 20],
      );

      const title = container.querySelector(
        ".workout-charts-trend-header-h3",
      ) as HTMLElement;

      expect(title.classList.contains(expectedClass)).toBe(true);
    });
  });

  it("renders not available text when no data exists", () => {
    const container = createObsidianContainer();

    TrendHeader.render(container, baseIndicators, []);

    const indicatorCreate = TrendIndicator.create as jest.Mock;
    expect(indicatorCreate).not.toHaveBeenCalled();

    const variation = container.querySelector(
      ".workout-charts-trend-variation",
    ) as HTMLElement;
    expect(variation).toBeTruthy();
    expect(variation.textContent).toBe(t("table.notAvailable"));
  });

  it("appends single value variation text", () => {
    const container = createObsidianContainer();

    TrendHeader.render(container, baseIndicators, [12.34]);

    const indicatorCreate = TrendIndicator.create as jest.Mock;
    expect(indicatorCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        direction: "neutral",
        percentage: 0,
      }),
    );

    const expectedVariation =
      CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_SINGLE_VALUE_FORMATTED("12.3");

    const paragraph = container.querySelector(
      ".workout-charts-trend-header-p",
    ) as HTMLElement;
    expect(paragraph.textContent).toContain(expectedVariation);
  });

  it("applies variation color classes in fallback mode", () => {
    const calculateSpy = jest.spyOn(
      TrendHeader as unknown as {
        calculateVariation: (volumeData: number[]) => {
          firstValue?: number;
          lastValue?: number;
          percentChange: string;
        };
      },
      "calculateVariation",
    );

    calculateSpy.mockReturnValue({
      firstValue: 10,
      lastValue: 20,
      percentChange: t("table.notAvailable"),
    });

    const cases = [
      { color: "green", expectedClass: "trend-color-green" },
      { color: "red", expectedClass: "trend-color-red" },
      { color: "orange", expectedClass: "trend-color-orange" },
      { color: "blue", expectedClass: "trend-color-accent" },
    ];

    cases.forEach(({ color, expectedClass }) => {
      const container = createObsidianContainer();

      TrendHeader.render(
        container,
        { ...baseIndicators, trendColor: color },
        [10, 20],
      );

      const indicatorCreate = TrendIndicator.create as jest.Mock;
      expect(indicatorCreate).not.toHaveBeenCalled();

      const variation = container.querySelector(
        ".workout-charts-trend-variation",
      ) as HTMLElement;
      expect(variation).toBeTruthy();
      expect(variation.classList.contains(expectedClass)).toBe(true);
    });

    calculateSpy.mockRestore();
  });
});

/** @jest-environment jsdom */

import { ChartColors } from "../ChartColors";
import { CHART_DATA_TYPE } from "@app/features/charts";

describe("ChartColors", () => {
  const cssVars: Record<string, string> = {
    "--interactive-accent": "#112233",
    "--interactive-accent-hover": "#223344",
    "--text-success": "#00aa00",
    "--text-success-hover": "#008800",
    "--text-warning": "#ffaa00",
    "--text-warning-hover": "#cc8800",
    "--text-error": "#ff0000",
    "--text-error-hover": "#cc0000",
    "--text-on-accent": "#ffffff",
    "--background-modifier-border": "#101010",
    "--text-normal": "#111111",
    "--background-primary": "#fefefe",
    "--background-secondary": "#fafafa",
  };

  beforeEach(() => {
    jest.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: (name: string) => cssVars[name] ?? "",
    } as unknown as CSSStyleDeclaration);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds a palette from CSS variables", () => {
    const colors = ChartColors.getChartColors();

    expect(colors.primary.main).toBe("#112233");
    expect(colors.primary.light).toBe("rgba(17, 34, 51, 0.2)");
    expect(colors.grid).toBe("rgba(16, 16, 16, 0.25)");
    expect(colors.tooltip.background).toBe("rgba(250, 250, 250, 0.95)");
    expect(colors.text).toBe("#111111");
  });

  it("selects the correct color scheme for chart types", () => {
    const colors = ChartColors.getChartColors();

    expect(ChartColors.getColorSchemeForType(CHART_DATA_TYPE.VOLUME)).toEqual(
      colors.primary,
    );
    expect(ChartColors.getColorSchemeForType(CHART_DATA_TYPE.WEIGHT)).toEqual(
      colors.secondary,
    );
    expect(ChartColors.getColorSchemeForType(CHART_DATA_TYPE.REPS)).toEqual(
      colors.accent,
    );
  });
});

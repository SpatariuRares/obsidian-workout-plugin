/** @jest-environment jsdom */

import { ChartColors } from "@app/features/charts/config/ChartTheme";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { attachObsidianHelpers } from "@app/components/__tests__/obsidianDomMocks";

describe("ChartColors", () => {
  const cssVars: Record<string, string> = {
    "--interactive-accent": "#112233",
    "--text-muted": "#5c5c5c",
    "--background-modifier-border": "#101010",
    "--text-normal": "#111111",
    "--background-primary": "#fefefe",
    "--background-secondary": "#fafafa",
  };

  const mockTheme = (vars: Record<string, string>, resolvedColor = "") =>
    jest.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: (name: string) => vars[name] ?? "",
      color: resolvedColor,
    } as unknown as CSSStyleDeclaration);

  beforeAll(() => {
    attachObsidianHelpers(document.body);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("draws the series in the accent, inset points, muted axes and trend line", () => {
    mockTheme(cssVars);
    const colors = ChartColors.getChartColors();

    expect(colors.primary.main).toBe("#112233");
    expect(colors.primary.light).toBe("rgba(17, 34, 51, 0.15)");
    expect(colors.primary.point).toBe("#fefefe");
    expect(colors.primary.pointBorder).toBe("#112233");
    expect(colors.trend.main).toBe("#5c5c5c");
    expect(colors.text).toBe("#5c5c5c");
    expect(colors.tooltip.background).toBe("#fafafa");
    expect(colors.tooltip.text).toBe("#111111");
  });

  it("thins Obsidian's border for the grid, and takes the design token when defined", () => {
    mockTheme(cssVars);
    expect(ChartColors.getChartColors().grid).toBe("rgba(16, 16, 16, 0.25)");

    jest.restoreAllMocks();
    mockTheme({ ...cssVars, "--workout-border-subtle": "#444444" });
    expect(ChartColors.getChartColors().grid).toBe("rgba(68, 68, 68, 0.4)");
  });

  it("uses the color the browser resolves, so hsl() and color-mix() themes work", () => {
    mockTheme(
      { ...cssVars, "--interactive-accent": "hsl(258, 88%, 66%)" },
      "rgb(152, 115, 247)",
    );
    // jsdom doesn't take var() in a style: the browser does
    jest.spyOn(document.body, "createSpan").mockReturnValue({
      style: { color: "" },
      remove: jest.fn(),
    } as unknown as HTMLSpanElement);

    expect(ChartColors.getChartColors().primary.main).toBe("rgb(152, 115, 247)");
  });

  it("falls back when the theme doesn't define a variable", () => {
    mockTheme({});

    expect(ChartColors.getChartColors().primary.light).toBe(
      "rgba(99, 102, 241, 0.15)",
    );
  });

  it("reads the theme from body, where Obsidian defines its variables", () => {
    document.body.style.setProperty("--text-normal", "#dadada");
    try {
      expect(ChartColors.getChartColors().tooltip.text).toBe("#dadada");
    } finally {
      document.body.style.removeProperty("--text-normal");
    }
  });

  it.each(Object.values(CHART_DATA_TYPE))(
    "draws a %s chart in the accent",
    (dataType) => {
      mockTheme(cssVars);
      expect(ChartColors.getColorSchemeForType(dataType)).toEqual(
        ChartColors.getChartColors().primary,
      );
    },
  );
});

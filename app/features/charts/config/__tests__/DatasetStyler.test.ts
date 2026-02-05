import { DatasetStyler } from "../DatasetStyler";
import { ChartLabels, ChartStyling } from "../ChartConstants";
import { ChartColorPalette, ColorScheme } from "../ChartColors";
import { ChartDataset } from "@app/features/charts/types";

describe("DatasetStyler", () => {
  const scheme: ColorScheme = {
    main: "#111111",
    light: "#222222",
    dark: "#333333",
    point: "#444444",
    pointBorder: "#555555",
  };

  const palette: ChartColorPalette = {
    primary: scheme,
    secondary: scheme,
    accent: scheme,
    trend: {
      main: "#666666",
      light: "#777777",
      dark: "#888888",
      point: "#999999",
      pointBorder: "#aaaaaa",
    },
    grid: "#121212",
    text: "#343434",
    background: "#ffffff",
    tooltip: {
      background: "#000000",
      border: "#222222",
      text: "#fefefe",
    },
  };

  it("styles the main dataset", () => {
    const dataset: ChartDataset = { label: "Main", data: [1, 2] };

    DatasetStyler.styleMainDataset(dataset, scheme);

    expect(dataset.borderColor).toBe(scheme.main);
    expect(dataset.pointBackgroundColor).toBe(scheme.point);
    expect(dataset.pointBorderColor).toBe(scheme.pointBorder);
    expect(dataset.pointRadius).toBe(ChartStyling.POINT_RADIUS);
    expect(dataset.pointHoverRadius).toBe(ChartStyling.POINT_HOVER_RADIUS);
    expect(dataset.borderWidth).toBe(ChartStyling.BORDER_WIDTH);
    expect(dataset.tension).toBe(ChartStyling.TENSION);
    expect(dataset.fill).toBe(true);
  });

  it("styles the trend dataset", () => {
    const dataset: ChartDataset = {
      label: ChartLabels.TREND_LINE,
      data: [1, 2],
    };

    DatasetStyler.styleTrendDataset(dataset, palette);

    expect(dataset.borderColor).toBe(palette.trend.main);
    expect(dataset.backgroundColor).toBe(palette.trend.light);
    expect(dataset.borderDash).toBe(ChartStyling.TREND_LINE_DASH);
    expect(dataset.borderWidth).toBe(ChartStyling.BORDER_WIDTH);
    expect(dataset.pointRadius).toBe(ChartStyling.TREND_POINT_RADIUS);
    expect(dataset.pointHoverRadius).toBe(ChartStyling.TREND_POINT_RADIUS);
  });

  it("finds the trend dataset by label", () => {
    const datasets: ChartDataset[] = [
      { label: "Main", data: [1] },
      { label: ChartLabels.TREND_LINE, data: [2] },
    ];

    expect(DatasetStyler.findTrendDataset(datasets)).toBe(datasets[1]);
  });

  it("styles datasets through the combined helper", () => {
    const datasets: ChartDataset[] = [
      { label: "Main", data: [1] },
      { label: ChartLabels.TREND_LINE, data: [2] },
    ];

    const mainSpy = jest.spyOn(DatasetStyler, "styleMainDataset");
    const trendSpy = jest.spyOn(DatasetStyler, "styleTrendDataset");

    DatasetStyler.styleDatasets(datasets, scheme, palette);

    expect(mainSpy).toHaveBeenCalledWith(datasets[0], scheme);
    expect(trendSpy).toHaveBeenCalledWith(datasets[1], palette);

    mainSpy.mockRestore();
    trendSpy.mockRestore();
  });
});

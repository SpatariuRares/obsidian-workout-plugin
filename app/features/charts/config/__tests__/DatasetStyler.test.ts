import { ChartConfigBuilder } from "@app/features/charts/config/ChartConfigBuilder";
import { ChartStyling, getChartLabels } from "@app/features/charts/config/ChartConstants";
import {
  ChartColorPalette,
  ColorScheme,
} from "@app/features/charts/config/ChartTheme";
import { ChartDataset } from "@app/features/charts/types";

describe("ChartConfigBuilder dataset styling", () => {
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

    ChartConfigBuilder.styleMainDataset(dataset, scheme);

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
      label: "",
      data: [1, 2],
    };

    ChartConfigBuilder.styleTrendDataset(dataset, palette);

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
      { label: getChartLabels().TREND_LINE, data: [2] },
    ];

    expect(ChartConfigBuilder.findTrendDataset(datasets)).toBe(datasets[1]);
  });

  it("styles datasets through the combined helper", () => {
    const datasets: ChartDataset[] = [
      { label: "Main", data: [1] },
      { label: getChartLabels().TREND_LINE, data: [2] },
    ];

    ChartConfigBuilder.styleDatasets(datasets, scheme, palette);

    // Main dataset should be styled
    expect(datasets[0].borderColor).toBe(scheme.main);
    expect(datasets[0].fill).toBe(true);

    // Trend dataset should be styled
    expect(datasets[1].borderColor).toBe(palette.trend.main);
    expect(datasets[1].borderDash).toBe(ChartStyling.TREND_LINE_DASH);
  });
});

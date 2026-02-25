import { ChartConfigBuilder } from "../ChartConfigBuilder";
import {
  ChartInteraction,
  getChartLabels,
  ChartStyling,
  getUnitForChartType,
  getYAxisLabel,
} from "../ChartConstants";
import { ChartColorPalette } from "@app/features/charts/config/ChartTheme";
import { ChartDataset } from "@app/features/charts/types";

describe("ChartConfigBuilder", () => {
  const colors: ChartColorPalette = {
    primary: {
      main: "#111111",
      light: "#222222",
      dark: "#333333",
      point: "#444444",
      pointBorder: "#555555",
    },
    secondary: {
      main: "#666666",
      light: "#777777",
      dark: "#888888",
      point: "#999999",
      pointBorder: "#aaaaaa",
    },
    accent: {
      main: "#bbbbbb",
      light: "#cccccc",
      dark: "#dddddd",
      point: "#eeeeee",
      pointBorder: "#ffffff",
    },
    trend: {
      main: "#123123",
      light: "#234234",
      dark: "#345345",
      point: "#456456",
      pointBorder: "#567567",
    },
    grid: "#101010",
    text: "#202020",
    background: "#ffffff",
    tooltip: {
      background: "#000000",
      border: "#999999",
      text: "#fefefe",
    },
  };

  it("creates plugins config with title, legend, and tooltip", () => {
    const plugins = ChartConfigBuilder.createPluginsConfig(
      "My Chart",
      colors,
      "volume",
    );

    expect(plugins.title.display).toBe(true);
    expect(plugins.title.text).toBe("My Chart");
    expect(plugins.title.color).toBe(colors.text);
    expect(plugins.title.font.size).toBe(ChartStyling.TITLE_FONT_SIZE);

    expect(plugins.legend.display).toBe(true);
    expect(plugins.legend.labels.color).toBe(colors.text);
    expect(plugins.legend.labels.boxWidth).toBe(ChartStyling.LEGEND_BOX_WIDTH);

    const tooltipLabel = plugins.tooltip.callbacks.label as (tooltipItem: {
      parsed: { y: number };
      dataset: { label?: string };
    }) => string;

    const labelText = tooltipLabel({
      parsed: { y: 12.345 },
      dataset: { label: "Volume" },
    });

    expect(labelText).toBe(
      `Volume: 12.3 ${getUnitForChartType("volume")}`,
    );
  });

  it("creates scales and interaction config using constants", () => {
    const scales = ChartConfigBuilder.createScalesConfig(
      colors,
      "weight",
    );

    expect(scales.x.title.text).toBe(getChartLabels().X_AXIS);
    expect(scales.y.title.text).toBe(getYAxisLabel("weight"));

    const interaction = ChartConfigBuilder.createInteractionConfig();
    expect(interaction.mode).toBe(ChartInteraction.INTERACTION_MODE);
    expect(interaction.axis).toBe(ChartInteraction.INTERACTION_AXIS);
  });

  it("creates a complete chart config", () => {
    const labels = ["2024-01-01", "2024-01-02"];
    const datasets: ChartDataset[] = [{ label: "Volume", data: [10, 20] }];

    const config = ChartConfigBuilder.createChartConfig(
      labels,
      datasets,
      "Volume Chart",
      colors,
      "volume",
    );

    expect(config.type).toBe("line");
    expect(config.data?.labels).toBe(labels);
    expect(config.data?.datasets).toBe(datasets);
    expect(config.options?.aspectRatio).toBe(ChartStyling.ASPECT_RATIO);
    expect(config.options?.interaction?.mode).toBe(
      ChartInteraction.INTERACTION_MODE,
    );
  });
});

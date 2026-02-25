/**
 * Builder for Chart.js configurations and dataset styling.
 * Provides modular methods for creating chart options with proper typing.
 */

import { ChartConfiguration } from "chart.js/auto";
import { ChartDataset } from "@app/features/charts/types";
import {
  ChartColorPalette,
  ColorScheme,
} from "@app/features/charts/config/ChartTheme";
import {
  getChartLabels,
  ChartStyling,
  ChartInteraction,
  getYAxisLabel,
  getUnitForChartType,
} from "@app/features/charts/config/ChartConstants";
import { ChartTypeRegistry, TooltipItem } from 'chart.js';

/**
 * Builds Chart.js configuration objects with modular, reusable methods.
 * Also handles dataset styling (main data + trend lines).
 */
export class ChartConfigBuilder {
  /**
   * Creates the plugins configuration for the chart
   */
  static createPluginsConfig(
    title: string,
    colors: ChartColorPalette,
    chartType: string
  ) {
    return {
      title: {
        display: true,
        text: title,
        color: colors.text,
        font: {
          size: ChartStyling.TITLE_FONT_SIZE,
          weight: ChartStyling.TITLE_FONT_WEIGHT,
          family: ChartStyling.FONT_FAMILY,
        },
        padding: {
          top: ChartStyling.TITLE_PADDING_TOP,
          bottom: ChartStyling.TITLE_PADDING_BOTTOM,
        },
      },
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: colors.text,
          boxWidth: ChartStyling.LEGEND_BOX_WIDTH,
          padding: ChartStyling.LEGEND_PADDING,
          usePointStyle: true,
          font: {
            size: ChartStyling.LEGEND_FONT_SIZE,
            weight: ChartStyling.LEGEND_FONT_WEIGHT,
          },
        },
      },
      tooltip: this.createTooltipConfig(colors, chartType),
    };
  }

  private static createTooltipConfig(
    colors: ChartColorPalette,
    chartType: string
  ) {
    return {
      mode: ChartInteraction.TOOLTIP_MODE,
      intersect: false,
      backgroundColor: colors.tooltip.background,
      titleColor: colors.tooltip.text,
      bodyColor: colors.tooltip.text,
      borderColor: colors.tooltip.border,
      borderWidth: ChartStyling.TOOLTIP_BORDER_WIDTH,
      cornerRadius: ChartStyling.TOOLTIP_CORNER_RADIUS,
      padding: ChartStyling.TOOLTIP_PADDING,
      displayColors: true,
      callbacks: {
        label: function (tooltipItem: TooltipItem<keyof ChartTypeRegistry>) {
          const value = tooltipItem.parsed.y;
          const label = tooltipItem.dataset.label ?? "";
          const unit = getUnitForChartType(chartType);
          return `${label}: ${value?.toFixed ? value.toFixed(1) : value
            } ${unit}`;
        },
      },
    };
  }

  /**
   * Creates the scales configuration for the chart
   */
  static createScalesConfig(colors: ChartColorPalette, chartType: string) {
    return {
      x: this.createAxisConfig(colors, getChartLabels().X_AXIS, true),
      y: this.createAxisConfig(colors, getYAxisLabel(chartType), true),
    };
  }

  private static createAxisConfig(
    colors: ChartColorPalette,
    titleText: string,
    display: boolean
  ) {
    return {
      display,
      title: {
        display: true,
        text: titleText,
        color: colors.text,
        font: {
          size: ChartStyling.AXIS_TITLE_FONT_SIZE,
          weight: ChartStyling.AXIS_TITLE_FONT_WEIGHT,
        },
      },
      ticks: {
        color: colors.text,
        font: { size: ChartStyling.AXIS_TICK_FONT_SIZE },
      },
      grid: {
        color: colors.grid,
      },
      border: {
        color: colors.grid,
      },
    };
  }

  /**
   * Creates the interaction configuration for the chart
   */
  static createInteractionConfig() {
    return {
      mode: ChartInteraction.INTERACTION_MODE,
      axis: ChartInteraction.INTERACTION_AXIS,
      intersect: false,
    };
  }

  /**
   * Creates a complete Chart.js configuration object
   */
  static createChartConfig(
    labels: string[],
    datasets: ChartDataset[],
    title: string,
    colors: ChartColorPalette,
    chartType: string
  ): ChartConfiguration {
    return {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: ChartStyling.ASPECT_RATIO,
        plugins: this.createPluginsConfig(title, colors, chartType),
        scales: this.createScalesConfig(colors, chartType),
        interaction: this.createInteractionConfig(),
      },
    };
  }

  // --- Dataset Styling ---

  /**
   * Applies styling to the main data dataset
   */
  static styleMainDataset(
    dataset: ChartDataset,
    colorScheme: ColorScheme
  ): void {
    dataset.borderColor = colorScheme.main;
    dataset.pointBackgroundColor = colorScheme.point;
    dataset.pointBorderColor = colorScheme.pointBorder;
    dataset.pointRadius = ChartStyling.POINT_RADIUS;
    dataset.pointHoverRadius = ChartStyling.POINT_HOVER_RADIUS;
    dataset.borderWidth = ChartStyling.BORDER_WIDTH;
    dataset.tension = ChartStyling.TENSION;
    dataset.fill = true;
  }

  /**
   * Applies styling to the trend line dataset
   */
  static styleTrendDataset(
    dataset: ChartDataset,
    colors: ChartColorPalette
  ): void {
    dataset.borderColor = colors.trend.main;
    dataset.backgroundColor = colors.trend.light;
    dataset.borderDash = ChartStyling.TREND_LINE_DASH;
    dataset.borderWidth = ChartStyling.BORDER_WIDTH;
    dataset.pointRadius = ChartStyling.TREND_POINT_RADIUS;
    dataset.pointHoverRadius = ChartStyling.TREND_POINT_RADIUS;
  }

  /**
   * Finds the trend line dataset in an array of datasets
   */
  static findTrendDataset(datasets: ChartDataset[]): ChartDataset | undefined {
    return datasets.find((ds) => ds.label === getChartLabels().TREND_LINE);
  }

  /**
   * Applies appropriate styling to all datasets
   */
  static styleDatasets(
    datasets: ChartDataset[],
    colorScheme: ColorScheme,
    colors: ChartColorPalette
  ): void {
    if (datasets[0]) {
      this.styleMainDataset(datasets[0], colorScheme);
    }

    const trendDataset = this.findTrendDataset(datasets);
    if (trendDataset) {
      this.styleTrendDataset(trendDataset, colors);
    }
  }
}

// Backward-compatible alias
export const DatasetStyler = {
  styleMainDataset: ChartConfigBuilder.styleMainDataset.bind(ChartConfigBuilder),
  styleTrendDataset: ChartConfigBuilder.styleTrendDataset.bind(ChartConfigBuilder),
  findTrendDataset: ChartConfigBuilder.findTrendDataset.bind(ChartConfigBuilder),
  styleDatasets: ChartConfigBuilder.styleDatasets.bind(ChartConfigBuilder),
};

/**
 * Builder for Chart.js configurations.
 * Provides modular methods for creating chart options with proper typing.
 */

import { ChartConfiguration } from "chart.js/auto";
import { ChartDataset } from "@app/types";
import { ChartColorPalette } from "@app/features/charts/config/ChartColors";
import {
  ChartLabels,
  ChartStyling,
  ChartInteraction,
  getYAxisLabel,
  getUnitForChartType,
} from "@app/features/charts/config/ChartConstants";
import { ChartTypeRegistry, TooltipItem } from 'chart.js';
/**
 * Builds Chart.js configuration objects with modular, reusable methods
 */
export class ChartConfigBuilder {
  /**
   * Creates the plugins configuration for the chart
   * @param title - Chart title
   * @param colors - Color palette
   * @param chartType - Type of chart (for tooltip unit formatting)
   * @returns Plugins configuration object
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

  /**
   * Creates the tooltip configuration
   * @param colors - Color palette
   * @param chartType - Type of chart (for unit formatting)
   * @returns Tooltip configuration object
   */
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
   * @param colors - Color palette
   * @param chartType - Type of chart (for Y-axis label)
   * @returns Scales configuration object
   */
  static createScalesConfig(colors: ChartColorPalette, chartType: string) {
    return {
      x: this.createAxisConfig(colors, ChartLabels.X_AXIS, true),
      y: this.createAxisConfig(colors, getYAxisLabel(chartType), true),
    };
  }

  /**
   * Creates a single axis configuration
   * @param colors - Color palette
   * @param titleText - Axis title text
   * @param display - Whether to display the axis
   * @returns Axis configuration object
   */
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
   * @returns Interaction configuration object
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
   * @param labels - Array of labels for the x-axis
   * @param datasets - Array of datasets to display
   * @param title - Chart title
   * @param colors - Color palette
   * @param chartType - Type of chart
   * @returns Complete Chart.js configuration
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
}


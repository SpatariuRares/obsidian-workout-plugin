/**
 * Handles styling and customization of Chart.js datasets.
 * Applies colors, line styles, and point configurations.
 */

import { ChartDataset } from "@app/types";
import {
  ChartColorPalette,
  ColorScheme,
} from "@app/features/charts/config/ChartColors";
import {
  ChartLabels,
  ChartStyling,
} from "@app/features/charts/config/ChartConstants";

/**
 * Applies styling to chart datasets
 */
export class DatasetStyler {
  /**
   * Applies styling to the main data dataset
   * @param dataset - The main data dataset to style
   * @param colorScheme - Color scheme to apply
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
   * @param dataset - The trend line dataset to style
   * @param colors - Complete color palette
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
   * @param datasets - Array of datasets to search
   * @returns The trend line dataset or undefined if not found
   */
  static findTrendDataset(datasets: ChartDataset[]): ChartDataset | undefined {
    return datasets.find((ds) => ds.label === ChartLabels.TREND_LINE);
  }

  /**
   * Applies appropriate styling to all datasets
   * @param datasets - Array of datasets to style
   * @param colorScheme - Color scheme for the main dataset
   * @param colors - Complete color palette
   */
  static styleDatasets(
    datasets: ChartDataset[],
    colorScheme: ColorScheme,
    colors: ChartColorPalette
  ): void {
    // Style main dataset (first dataset)
    if (datasets[0]) {
      this.styleMainDataset(datasets[0], colorScheme);
    }

    // Style trend dataset if present
    const trendDataset = this.findTrendDataset(datasets);
    if (trendDataset) {
      this.styleTrendDataset(trendDataset, colors);
    }
  }
}


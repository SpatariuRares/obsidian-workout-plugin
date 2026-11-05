import { TrendIndicators } from "@app/types/CommonTypes";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { TrendIndicator } from "@app/components/molecules";
import { FormatUtils } from "@app/utils/FormatUtils";
import { t } from "@app/i18n";
import { trendOf } from "@app/services/history/TrainingHistory";
import { CONSTANTS } from "@app/constants";
import { Icon } from "@app/components/atoms";

/**
 * The trend row of a `workout-chart` card: direction, variation along the
 * trend line (`trendOf`) and the range it covers.
 */
export class TrendHeader {
  /**
   * Renders the trend as one row of the chart's card: icon, direction, the
   * change along the trend line and the range it covers (muted). The row's
   * tone follows whether the change is an improvement (`is-up`), not the
   * sign: for pace a falling line is better.
   * @param container - The HTML element to render the trend row in
   * @param trendIndicators - Trend indicators containing direction and icon
   * @param volumeData - Array of numerical data for calculating variation
   * @param dataType - Optional data type for inverted logic (e.g., pace: lower is better)
   */
  static render(
    container: HTMLElement,
    trendIndicators: TrendIndicators,
    volumeData: number[],
    dataType?: CHART_DATA_TYPE,
  ): void {
    const { firstValue, lastValue, percentChange, direction: lineDirection } =
      this.calculateVariation(volumeData);
    const direction = FormatUtils.improvement(lineDirection, dataType);

    const row = container.createDiv({
      cls: `workout-chart-trend is-${direction}`,
    });
    Icon.create(row, {
      name: trendIndicators.trendIcon,
      className: "workout-chart-trend-icon",
    });
    row.createEl("strong", {
      cls: "workout-chart-trend-direction",
      text: trendIndicators.trendDirection,
    });

    if (percentChange !== t("table.notAvailable") && percentChange !== "Infinity") {
      TrendIndicator.create(row, {
        percentage: Math.abs(parseFloat(percentChange)),
        direction,
        className: "workout-chart-trend-change",
      });
    } else {
      // No percentage: "N/A", or a rise from zero ("Significant increase")
      row.createSpan({
        cls: "workout-chart-trend-change",
        text:
          percentChange === "Infinity"
            ? t("charts.significantIncrease")
            : t("table.notAvailable"),
      });
    }

    const range = this.formatRange(firstValue, lastValue, volumeData, dataType);
    if (range) {
      row.createSpan({ cls: "workout-chart-trend-range", text: range });
    }
  }

  /** "from 491.3 kg to 646.5 kg", or the only value */
  private static formatRange(
    firstValue: number | undefined,
    lastValue: number | undefined,
    volumeData: number[],
    dataType?: CHART_DATA_TYPE,
  ): string {
    const format = (value: number) =>
      dataType ? FormatUtils.formatValue(value, dataType) : value.toFixed(1);
    if (firstValue !== undefined && lastValue !== undefined && volumeData.length >= 2) {
      return CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_FROM_TO_FORMATTED(
        format(firstValue),
        format(lastValue),
      ).trim();
    }
    if (firstValue !== undefined && volumeData.length === 1) {
      return CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_VALUE_LABEL_FORMATTED(
        format(firstValue),
        dataType,
      );
    }
    return "";
  }

  /**
   * Variation along the trend line, so it agrees with the trend label.
   * @param volumeData - Array of numerical data points
   * @returns Line start and end values, percentage change and direction
   */
  private static calculateVariation(volumeData: number[]) {
    let firstValue: number | undefined,
      lastValue: number | undefined,
      percentChange: string = t("table.notAvailable");
    const trend = trendOf(volumeData);

    if (trend) {
      firstValue = trend.start;
      lastValue = trend.end;
      percentChange =
        trend.percentChange !== undefined
          ? trend.percentChange.toFixed(1)
          : lastValue > 0
            ? "Infinity"
            : "0.0";
    } else if (volumeData.length === 1) {
      firstValue = volumeData[0];
      percentChange = "0.0";
    }

    return {
      firstValue,
      lastValue,
      percentChange,
      direction: trend?.direction ?? "stable",
    };
  }
}

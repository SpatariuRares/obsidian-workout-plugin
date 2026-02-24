import { CONSTANTS } from "@app/constants";
import { TrendIndicators } from "@app/types/CommonTypes";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { TrendIndicator } from "@app/components/molecules";
import { FormatUtils } from "@app/utils";
import { t } from "@app/i18n";

/**
 * Renders trend header information for workout charts.
 * Displays trend direction, variation percentage, and visual indicators
 * to help users understand their workout progress.
 */
export class TrendHeader {
  /**
   * Renders a trend header with progress information.
   * @param container - The HTML element to render the trend header in
   * @param trendIndicators - Trend indicators containing direction, color, and icon
   * @param volumeData - Array of numerical data for calculating variation
   * @param dataType - Optional data type for inverted logic (e.g., pace: lower is better)
   */
  static render(
    container: HTMLElement,
    trendIndicators: TrendIndicators,
    volumeData: number[],
    dataType?: CHART_DATA_TYPE
  ): void {
    const trendHeader = container.createEl("div", {
      cls: "workout-charts-trend-header",
    });

    const { firstValue, lastValue, percentChange } =
      this.calculateVariation(volumeData);
    const variationData = this.formatVariationData(
      firstValue,
      lastValue,
      percentChange,
      trendIndicators.trendColor,
      volumeData,
      dataType
    );

    const h3 = trendHeader.createEl("h3", {
      cls: "workout-charts-trend-header-h3",
    });

    // Apply color class based on trend color
    if (trendIndicators.trendColor.includes("green")) {
      h3.classList.add("trend-color-green");
    } else if (trendIndicators.trendColor.includes("red")) {
      h3.classList.add("trend-color-red");
    } else if (trendIndicators.trendColor.includes("orange")) {
      h3.classList.add("trend-color-orange");
    } else {
      h3.classList.add("trend-color-accent");
    }

    h3.textContent = `${trendIndicators.trendIcon} ${CONSTANTS.WORKOUT.LABELS.CHARTS.TREND_TITLE(dataType)}`;
    h3.createEl("strong", { text: trendIndicators.trendDirection });

    const p = trendHeader.createEl("p", {
      cls: "workout-charts-trend-header-p",
    });
    p.createEl("span", {
      text: t("charts.overallVariationPrefix"),
    });

    if (variationData.text !== undefined && percentChange !== t("table.notAvailable")) {
      // Determine trend direction based on percentage and data type
      const percentValue = parseFloat(percentChange);
      const isLowerBetter = dataType ? FormatUtils.isLowerBetter(dataType) : false;

      // For inverted types (pace), negative change = improvement (up arrow)
      // For normal types, positive change = improvement (up arrow)
      let direction: "up" | "down" | "neutral";
      if (percentValue === 0) {
        direction = "neutral";
      } else if (isLowerBetter) {
        // Pace: negative % = improving (faster), positive % = declining (slower)
        direction = percentValue < 0 ? "up" : "down";
      } else {
        // Default: positive % = improving, negative % = declining
        direction = percentValue > 0 ? "up" : "down";
      }

      // Use TrendIndicator molecule for variation display
      TrendIndicator.create(p, {
        percentage: Math.abs(percentValue),
        direction: direction,
        className: "workout-charts-trend-variation",
      });
    } else if (variationData.text !== undefined) {
      // Fallback for non-percentage values (e.g., t("table.notAvailable"), "Aumento signif.")
      const span = p.createEl("span", {
        cls: "workout-charts-trend-variation",
      });
      span.textContent = variationData.text;
      if (variationData.color) {
        // Apply color class based on variation color
        if (variationData.color.includes("green")) {
          span.classList.add("trend-color-green");
        } else if (variationData.color.includes("red")) {
          span.classList.add("trend-color-red");
        } else if (variationData.color.includes("orange")) {
          span.classList.add("trend-color-orange");
        } else {
          span.classList.add("trend-color-accent");
        }
      }
    }
    if (
      firstValue !== undefined &&
      lastValue !== undefined &&
      volumeData.length >= 2
    ) {
      const formattedFirst = dataType
        ? FormatUtils.formatValue(firstValue, dataType)
        : firstValue.toFixed(1);
      const formattedLast = dataType
        ? FormatUtils.formatValue(lastValue, dataType)
        : lastValue.toFixed(1);
      p.append(
        CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_FROM_TO_FORMATTED(
          formattedFirst,
          formattedLast
        )
      );
    } else if (firstValue !== undefined && volumeData.length === 1) {
      const formattedFirst = dataType
        ? FormatUtils.formatValue(firstValue, dataType)
        : firstValue.toFixed(1);
      p.append(
        CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_SINGLE_VALUE_FORMATTED(formattedFirst, dataType)
      );
    }
  }

  /**
   * Calculates the variation between first and last data points.
   * @param volumeData - Array of numerical data points
   * @returns Object containing first value, last value, and percentage change
   */
  private static calculateVariation(volumeData: number[]) {
    let firstValue: number | undefined,
      lastValue: number | undefined,
      percentChange: string = t("table.notAvailable");

    if (volumeData.length >= 2) {
      firstValue = volumeData[0];
      lastValue = volumeData[volumeData.length - 1];
      percentChange =
        firstValue !== 0
          ? (((lastValue - firstValue) / Math.abs(firstValue)) * 100).toFixed(1)
          : lastValue > 0
            ? "Infinity"
            : "0.0";
    } else if (volumeData.length === 1) {
      firstValue = volumeData[0];
      percentChange = "0.0";
    }

    return { firstValue, lastValue, percentChange };
  }

  /**
   * Formats the variation data for DOM rendering.
   * @param firstValue - The first value in the dataset
   * @param lastValue - The last value in the dataset
   * @param percentChange - The calculated percentage change as a string
   * @param trendColor - Color to use for the variation text
   * @param volumeData - Array of numerical data points for context
   * @param dataType - Optional data type for proper value formatting
   * @returns Object with text and color for the variation
   */
  private static formatVariationData(
    firstValue: number | undefined,
    lastValue: number | undefined,
    percentChange: string,
    trendColor: string,
    volumeData: number[],
    dataType?: CHART_DATA_TYPE
  ): { text: string; color: string } {
    if (
      firstValue !== undefined &&
      lastValue !== undefined &&
      volumeData.length >= 2
    ) {
      const changeSign = parseFloat(percentChange) > 0 ? CONSTANTS.WORKOUT.ICONS.COMMON.PLUS : CONSTANTS.WORKOUT.ICONS.COMMON.EMPTY;
      return {
        text:
          percentChange === "Infinity"
            ? t("charts.significantIncrease")
            : changeSign + percentChange + CONSTANTS.WORKOUT.ICONS.COMMON.PERCENTAGE,
        color: trendColor,
      };
    } else if (firstValue !== undefined && volumeData.length === 1) {
      const formattedValue = dataType
        ? FormatUtils.formatValue(firstValue, dataType)
        : firstValue.toFixed(1);
      return {
        text: CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_VALUE_LABEL_FORMATTED(formattedValue, dataType),
        color: "",
      };
    }
    return { text: t("table.notAvailable"), color: "" };
  }
}

import { CONSTANTS } from "@app/constants";
import { TrendIndicators } from "@app/types";
import { TrendIndicator } from "@app/components/molecules";

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
   */
  static render(
    container: HTMLElement,
    trendIndicators: TrendIndicators,
    volumeData: number[]
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
      volumeData
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

    h3.textContent = `${trendIndicators.trendIcon} ${CONSTANTS.WORKOUT.LABELS.CHARTS.TREND_TITLE_PREFIX}`;
    h3.createEl("strong", { text: trendIndicators.trendDirection });

    const p = trendHeader.createEl("p", {
      cls: "workout-charts-trend-header-p",
    });
    p.createEl("span", {
      text: CONSTANTS.WORKOUT.LABELS.CHARTS.OVERALL_VARIATION_PREFIX,
    });

    if (variationData.text !== undefined && percentChange !== CONSTANTS.WORKOUT.LABELS.TABLE.NOT_AVAILABLE) {
      // Determine trend direction based on percentage
      const percentValue = parseFloat(percentChange);
      const direction =
        percentValue > 0 ? CONSTANTS.WORKOUT.LABELS.CHARTS.UP :
          percentValue < 0 ? CONSTANTS.WORKOUT.LABELS.CHARTS.DOWN :
            CONSTANTS.WORKOUT.LABELS.CHARTS.NEUTRAL;

      // Use TrendIndicator molecule for variation display
      TrendIndicator.create(p, {
        percentage: Math.abs(percentValue),
        direction: direction,
        className: "workout-charts-trend-variation",
      });
    } else if (variationData.text !== undefined) {
      // Fallback for non-percentage values (e.g., CONSTANTS.WORKOUT.LABELS.TABLE.NOT_AVAILABLE, "Aumento signif.")
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
      p.append(
        CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_FROM_TO(
          firstValue.toFixed(1),
          lastValue.toFixed(1)
        )
      );
    } else if (firstValue !== undefined && volumeData.length === 1) {
      p.append(
        CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_SINGLE_VALUE(firstValue.toFixed(1))
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
      percentChange: string = CONSTANTS.WORKOUT.LABELS.TABLE.NOT_AVAILABLE;

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
   * @returns Object with text and color for the variation
   */
  private static formatVariationData(
    firstValue: number | undefined,
    lastValue: number | undefined,
    percentChange: string,
    trendColor: string,
    volumeData: number[]
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
            ? CONSTANTS.WORKOUT.LABELS.CHARTS.SIGNIFICANT_INCREASE
            : changeSign + percentChange + CONSTANTS.WORKOUT.ICONS.COMMON.PERCENTAGE,
        color: trendColor,
      };
    } else if (firstValue !== undefined && volumeData.length === 1) {
      return {
        text: CONSTANTS.WORKOUT.LABELS.CHARTS.VARIATION_VALUE_LABEL(firstValue.toFixed(1)),
        color: "",
      };
    }
    return { text: CONSTANTS.WORKOUT.LABELS.TABLE.NOT_AVAILABLE, color: "" };
  }
}


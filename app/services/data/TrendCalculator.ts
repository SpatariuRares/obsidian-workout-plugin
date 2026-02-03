import { CONSTANTS } from "@app/constants";
import { TrendIndicators, CHART_DATA_TYPE } from "@app/types";
import { FormatUtils } from "@app/utils";

/**
 * Calculates trend indicators for workout data.
 * Analyzes the slope of data points to determine if the trend is increasing,
 * decreasing, or stable, and provides appropriate visual indicators.
 */
export class TrendCalculator {
  /**
   * Calculates trend indicators based on the slope of the data.
   * @param slope - The calculated slope from linear regression
   * @param volumeData - Array of numerical data points used for trend calculation
   * @param dataType - Optional data type to determine trend interpretation (e.g., pace uses inverted logic)
   * @returns Object containing trend direction, color, and icon
   */
  static getTrendIndicators(
    slope: number,
    volumeData: number[],
    dataType?: CHART_DATA_TYPE
  ): TrendIndicators {
    if (volumeData.length < 2) {
      return {
        trendDirection: CONSTANTS.WORKOUT.MESSAGES.STATUS.INSUFFICIENT_DATA,
        trendColor: "var(--text-muted, #888)",
        trendIcon: "·",
      };
    }

    const averageVolume =
      volumeData.reduce((a, b) => a + b, 0) / volumeData.length;
    const slopeThreshold = Math.max(0.05 * averageVolume, 1);

    // For pace, lower values are better (faster), so invert the logic
    const isLowerBetter = dataType
      ? FormatUtils.isLowerBetter(dataType)
      : false;

    if (slope > slopeThreshold) {
      if (isLowerBetter) {
        // Positive slope for pace means getting slower = declining
        return {
          trendDirection: CONSTANTS.WORKOUT.TRENDS.STATUS.DECLINING,
          trendColor: "var(--color-red, #F44336)",
          trendIcon: "↘️",
        };
      }
      return {
        trendDirection: CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
        trendColor: "var(--color-green, #4CAF50)",
        trendIcon: "↗️",
      };
    } else if (slope < -slopeThreshold) {
      if (isLowerBetter) {
        // Negative slope for pace means getting faster = improving
        return {
          trendDirection: CONSTANTS.WORKOUT.TRENDS.STATUS.IMPROVING,
          trendColor: "var(--color-green, #4CAF50)",
          trendIcon: "↗️",
        };
      }
      return {
        trendDirection: CONSTANTS.WORKOUT.TRENDS.STATUS.DECREASING,
        trendColor: "var(--color-red, #F44336)",
        trendIcon: "↘️",
      };
    } else {
      return {
        trendDirection: CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE_LOWER,
        trendColor: "var(--color-accent, #FFC107)", // più visibile di orange
        trendIcon: "→",
      };
    }
  }
}

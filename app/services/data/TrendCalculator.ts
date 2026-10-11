import { TrendIndicators } from "@app/types/CommonTypes";
import { CHART_DATA_TYPE } from "@app/types/WorkoutConfigTypes";
import { FormatUtils } from "@app/utils";
import { t } from "@app/i18n";
import { trendOf } from "@app/services/history/TrainingHistory";

/**
 * Calculates trend indicators for workout data.
 * Turns the trend of a series (trendOf) into a label, color and icon.
 */
export class TrendCalculator {
  /**
   * Trend label, color and icon for a series, from its trend line.
   * @param volumeData - Array of numerical data points
   * @param dataType - Optional data type to determine trend interpretation (e.g., pace uses inverted logic)
   * @returns Object containing trend direction, color, and icon
   */
  static getTrendIndicators(
    volumeData: number[],
    dataType?: CHART_DATA_TYPE,
  ): TrendIndicators {
    const trend = trendOf(volumeData);
    if (!trend) {
      return {
        trendDirection: t("messages.insufficientData"),
        trendColor: "var(--text-muted, #888)",
        trendIcon: "·",
      };
    }

    // For pace, lower values are better (faster), so invert the logic
    const isLowerBetter = dataType
      ? FormatUtils.isLowerBetter(dataType)
      : false;

    if (trend.direction === "up") {
      if (isLowerBetter) {
        // Positive slope for pace means getting slower = declining
        return {
          trendDirection: t("trends.declining"),
          trendColor: "var(--color-red, #F44336)",
          trendIcon: "↘️",
        };
      }
      return {
        trendDirection: t("trends.increasing"),
        trendColor: "var(--color-green, #4CAF50)",
        trendIcon: "↗️",
      };
    } else if (trend.direction === "down") {
      if (isLowerBetter) {
        // Negative slope for pace means getting faster = improving
        return {
          trendDirection: t("trends.improving"),
          trendColor: "var(--color-green, #4CAF50)",
          trendIcon: "↗️",
        };
      }
      return {
        trendDirection: t("trends.decreasing"),
        trendColor: "var(--color-red, #F44336)",
        trendIcon: "↘️",
      };
    } else {
      return {
        trendDirection: t("trends.stableLower"),
        trendColor: "var(--color-accent, #FFC107)", // più visibile di orange
        trendIcon: "→",
      };
    }
  }
}

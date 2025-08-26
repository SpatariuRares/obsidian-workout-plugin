import { TrendIndicators } from "./types";

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
   * @returns Object containing trend direction, color, and icon
   */
  static getTrendIndicators(
    slope: number,
    volumeData: number[]
  ): TrendIndicators {
    if (volumeData.length < 2) {
      return {
        trendDirection: "insuff. data",
        trendColor: "var(--text-muted, #888)",
        trendIcon: "·",
      };
    }

    const averageVolume =
      volumeData.reduce((a, b) => a + b, 0) / volumeData.length;
    const slopeThreshold = Math.max(0.05 * averageVolume, 1);

    if (slope > slopeThreshold) {
      return {
        trendDirection: "in aumento",
        trendColor: "var(--color-green, #4CAF50)",
        trendIcon: "↗️",
      };
    } else if (slope < -slopeThreshold) {
      return {
        trendDirection: "in diminuzione",
        trendColor: "var(--color-red, #F44336)",
        trendIcon: "↘️",
      };
    } else {
      return {
        trendDirection: "stabile",
        trendColor: "var(--color-accent, #FFC107)", // più visibile di orange
        trendIcon: "→",
      };
    }
  }
}

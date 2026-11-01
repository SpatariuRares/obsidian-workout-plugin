/**
 * Utility class for formatting values based on data type
 * Handles duration, pace, and other workout-specific formatting
 */
import { CHART_DATA_TYPE } from "@app/types/WorkoutConfigTypes";
import { getUnitsMap } from "@app/constants/ui.constants";
import { LocalizationService } from "@app/i18n";

export class FormatUtils {
  /**
   * A number with the thousands and decimal separators of the plugin's
   * language ("63,814" in English, "63.814" in Italian), at most
   * `maxFractionDigits` decimals
   */
  static formatNumber(value: number, maxFractionDigits = 0): string {
    const options = { maximumFractionDigits: maxFractionDigits };
    try {
      return new Intl.NumberFormat(
        LocalizationService.getInstance().getCurrentLocale(),
        options,
      ).format(value);
    } catch {
      // A locale code Intl doesn't accept
      return new Intl.NumberFormat("en", options).format(value);
    }
  }

  /**
   * Format duration in seconds to human-readable string
   * @param seconds Duration in seconds
   * @returns Formatted string: '30s', '5m 30s', or '1h 30m'
   */
  static formatDuration(seconds: number): string {
    if (seconds < 0) seconds = 0;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    return `${secs}s`;
  }

  /**
   * Format pace in minutes per kilometer to MM:SS string
   * @param minPerKm Pace in minutes per kilometer (e.g., 5.5 = 5:30)
   * @returns Formatted string in 'M:SS' format (e.g., '5:30')
   */
  static formatPace(minPerKm: number): string {
    if (minPerKm < 0) minPerKm = 0;

    const minutes = Math.floor(minPerKm);
    const seconds = Math.round((minPerKm - minutes) * 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Determine if a lower value indicates improvement for this data type
   * @param dataType The type of data being evaluated
   * @returns true if lower values represent improvement (e.g., pace), false otherwise
   */
  static isLowerBetter(dataType: CHART_DATA_TYPE): boolean {
    return dataType === CHART_DATA_TYPE.PACE;
  }

  /**
   * Format a numeric value based on data type with appropriate formatting
   * @param value The numeric value to format
   * @param dataType The type of data being formatted
   * @returns Formatted string with appropriate formatting for the data type
   */
  static formatValue(
    value: number,
    dataType: CHART_DATA_TYPE,
  ): string {
    switch (dataType) {
      case CHART_DATA_TYPE.DURATION:
        return FormatUtils.formatDuration(value);
      case CHART_DATA_TYPE.PACE:
        return FormatUtils.formatPace(value);
      case CHART_DATA_TYPE.REPS:
        return Math.round(value).toString();
      case CHART_DATA_TYPE.VOLUME:
      case CHART_DATA_TYPE.WEIGHT:
      case CHART_DATA_TYPE.DISTANCE:
      case CHART_DATA_TYPE.HEART_RATE:
      default: {
        const unitsMap = getUnitsMap();
        const unit = unitsMap[dataType] || "";
        const formattedNumber = Number.isInteger(value)
          ? value.toString()
          : value.toFixed(2);
        return unit ? `${formattedNumber} ${unit}` : formattedNumber;
      }
    }
  }
}

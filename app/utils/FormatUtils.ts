/**
 * Utility class for formatting values based on data type
 * Handles duration, pace, and other workout-specific formatting
 */
import { CHART_DATA_TYPE } from "@app/types/ChartTypes";
import { UNITS_MAP } from "@app/constants/ui.constants";

export class FormatUtils {
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
   * Format a numeric value based on data type with appropriate formatting
   * @param value The numeric value to format
   * @param dataType The type of data being formatted
   * @returns Formatted string with appropriate formatting for the data type
   */
  static formatValue(value: number, dataType: CHART_DATA_TYPE): string {
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
        const unit = UNITS_MAP[dataType] || "";
        const formattedNumber = Number.isInteger(value)
          ? value.toString()
          : value.toFixed(2);
        return unit ? `${formattedNumber} ${unit}` : formattedNumber;
      }
    }
  }
}

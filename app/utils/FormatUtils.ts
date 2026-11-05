/**
 * Utility class for formatting values based on data type
 * Handles duration, pace, and other workout-specific formatting
 */
import { CHART_DATA_TYPE } from "@app/types/WorkoutConfigTypes";
import { getUnitsMap } from "@app/constants/ui.constants";
import { LocalizationService, t } from "@app/i18n";

export class FormatUtils {
  /**
   * A number with the thousands and decimal separators of the plugin's
   * language ("63,814" in English, "63.814" in Italian), at most
   * `maxFractionDigits` decimals
   */
  static formatNumber(value: number, maxFractionDigits = 0): string {
    return FormatUtils.localNumber(value, {
      maximumFractionDigits: maxFractionDigits,
    });
  }

  /**
   * A change in percent with its sign, in the plugin's language: "+12.3%",
   * "-5%"; zero (also once rounded) has no sign: "0.0%".
   * @param value - Already in percent (12.3 means 12.3%)
   */
  static formatSignedPercent(value: number, digits: number): string {
    const text = FormatUtils.localNumber(value, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      signDisplay: "exceptZero",
    });
    return `${text}%`;
  }

  /** A volume in the settings weight unit, grouped, no decimals: "63,814 kg" */
  static formatVolume(volume: number): string {
    return `${FormatUtils.formatNumber(volume)} ${getUnitsMap()[CHART_DATA_TYPE.VOLUME]}`;
  }

  private static localNumber(
    value: number,
    options: Intl.NumberFormatOptions,
  ): string {
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
   * A duration in the plugin's language, its two largest units: "30s",
   * "5m 30s", "1h 30m". `precision: "m"` rounds to whole minutes first
   * ("45m", "1h 15m"), for totals where seconds are noise.
   */
  static formatDuration(
    seconds: number,
    { precision = "s" }: { precision?: "s" | "m" } = {},
  ): string {
    const unit = precision === "m" ? 60 : 1;
    const total = Math.max(0, Math.round(seconds / unit)) * unit;

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const h = t("common.duration.hours", { count: hours });
    const m = t("common.duration.minutes", { count: minutes });

    if (hours > 0) return minutes > 0 ? `${h} ${m}` : h;
    if (precision === "m" || (minutes > 0 && secs === 0)) return m;
    const s = t("common.duration.seconds", { count: secs });
    return minutes > 0 ? `${m} ${s}` : s;
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
   * Whether a line's direction is an improvement: for a data type where
   * lower is better (pace) a falling line is "up". A stable line is neutral.
   * @param dataType - unset: higher is better
   */
  static improvement(
    lineDirection: "up" | "down" | "stable",
    dataType?: CHART_DATA_TYPE,
  ): "up" | "down" | "neutral" {
    if (lineDirection === "stable") return "neutral";
    if (!dataType || !FormatUtils.isLowerBetter(dataType)) return lineDirection;
    return lineDirection === "down" ? "up" : "down";
  }

  /**
   * A value of a chart data type with its unit, in the plugin's language
   * (decimal separator, no thousands grouping): durations as "1m 30s",
   * pace as "5:30", reps rounded, the rest as a number with its unit.
   * @param options.decimals - Exactly this many decimals, whole numbers too
   *   ("100.0 kg"); unset: whole numbers as they are, others with 2
   * @param options.pace - "decimal" writes a pace as a number with its unit
   *   (a change in pace: "0.50 min/km") instead of a clock time
   */
  static formatValue(
    value: number,
    dataType: CHART_DATA_TYPE,
    { decimals, pace = "clock" }: { decimals?: number; pace?: "clock" | "decimal" } = {},
  ): string {
    if (dataType === CHART_DATA_TYPE.DURATION) {
      return FormatUtils.formatDuration(value);
    }
    if (dataType === CHART_DATA_TYPE.PACE && pace === "clock") {
      return FormatUtils.formatPace(value);
    }
    if (dataType === CHART_DATA_TYPE.REPS) {
      return Math.round(value).toString();
    }
    const digits = decimals ?? (Number.isInteger(value) ? 0 : 2);
    const number = FormatUtils.localNumber(value, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: false,
    });
    const unit = getUnitsMap()[dataType] || "";
    return unit ? `${number} ${unit}` : number;
  }
}

import { formatWithUnit } from "@app/features/charts/config/ChartConstants";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { StatCard } from "@app/components/molecules";
import { FormatUtils } from "@app/utils/FormatUtils";
import { t } from "@app/i18n";

/**
 * The stats row of a `workout-chart` card: average, best and lowest day,
 * sessions and the recent trend, one StatCard each.
 */
export class StatsBox {
  /**
   * @param container - The HTML element to render the stats in
   * @param labels - Array of date labels corresponding to the data points
   * @param volumeData - Array of numerical data (volume, weight, or reps)
   * @param dataType - Type of data for formatting (volume, pace, duration, etc.)
   */
  static render(
    container: HTMLElement,
    labels: string[],
    volumeData: number[],
    dataType: CHART_DATA_TYPE = CHART_DATA_TYPE.VOLUME,
  ): void {
    const row = StatCard.row(container, "workout-charts-stats");
    const stats = this.calculateStats(volumeData, labels, dataType);

    StatCard.create(row, {
      label: t("charts.stats.average"),
      value: stats.avgFormatted,
    });
    StatCard.create(row, {
      label: t("charts.stats.max"),
      value: stats.maxFormatted,
      detail: stats.maxVolumeDate,
    });
    StatCard.create(row, {
      label: t("charts.stats.min"),
      value: stats.minFormatted,
      detail: stats.minVolumeDate,
    });
    StatCard.create(row, {
      label: t("charts.stats.sessions"),
      value: labels.length,
    });

    const recent = this.calculateRecentTrend(volumeData, dataType);
    if (recent) {
      StatCard.create(row, {
        label: t("charts.stats.recentTrend"),
        value: recent.text,
        detail: recent.detail,
        className: `is-${recent.direction}`,
      });
    }
  }

  /**
   * Calculates basic statistics from the workout data.
   * @param volumeData - Array of numerical data points
   * @param labels - Array of date labels corresponding to the data points
   * @param dataType - Type of data for formatting
   * @returns Object containing formatted average, maximum, minimum values and their dates
   */
  private static calculateStats(
    volumeData: number[],
    labels: string[],
    dataType: CHART_DATA_TYPE,
  ) {
    const avgValue =
      volumeData.reduce((s, v) => s + v, 0) / volumeData.length;
    const maxV = Math.max(...volumeData);
    const maxVolumeDate = labels[volumeData.indexOf(maxV)];
    const minV = Math.min(...volumeData);
    const minVolumeDate = labels[volumeData.indexOf(minV)];

    // Format values based on data type
    const avgFormatted = this.formatStatValue(avgValue, dataType);
    const maxFormatted = this.formatStatValue(maxV, dataType);
    const minFormatted = this.formatStatValue(minV, dataType);

    return {
      avgFormatted,
      maxFormatted,
      minFormatted,
      maxVolumeDate,
      minVolumeDate,
    };
  }

  /**
   * Formats a statistical value based on data type.
   * Uses specialized formatters for duration and pace, generic unit formatting for others.
   * @param value - The numeric value to format
   * @param dataType - Type of data being formatted
   * @returns Formatted string with appropriate unit
   */
  private static formatStatValue(
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
      default:
        return formatWithUnit(value.toFixed(1), dataType);
    }
  }

  /**
   * The change over the last 3 points (the last 2 when there are only 2).
   * Its direction is the improvement, not the sign: for pace a fall is up.
   * Within 5% of the first of the last 3 it is stable.
   * @returns undefined with fewer than 2 points
   */
  private static calculateRecentTrend(
    volumeData: number[],
    dataType: CHART_DATA_TYPE,
  ): { text: string; detail: string; direction: "up" | "down" | "neutral" } | undefined {
    if (volumeData.length < 2) return undefined;
    const lastThree = volumeData.length >= 3;
    const recent = volumeData.slice(lastThree ? -3 : -2);
    const first = recent[0];
    const change = recent[recent.length - 1] - first;
    const detail = lastThree ? t("charts.stats.last3") : t("charts.stats.vsPrevious");
    const threshold = lastThree ? 0.05 * first : 0;

    if (Math.abs(change) <= threshold) {
      return {
        text: lastThree ? t("trends.stable") : t("trends.invariant"),
        detail,
        direction: "neutral",
      };
    }
    const better = change > 0 !== FormatUtils.isLowerBetter(dataType);
    return {
      text: `${change > 0 ? "+" : "-"}${this.formatTrendValue(Math.abs(change), dataType)}`,
      detail,
      direction: better ? "up" : "down",
    };
  }

  /**
   * Formats a trend change value based on data type.
   * For duration/pace uses specialized formatters, for others adds the unit.
   * @param value - The absolute change value
   * @param dataType - Type of data being formatted
   * @returns Formatted string
   */
  private static formatTrendValue(
    value: number,
    dataType: CHART_DATA_TYPE,
  ): string {
    switch (dataType) {
      case CHART_DATA_TYPE.DURATION:
        return FormatUtils.formatDuration(value);
      case CHART_DATA_TYPE.PACE:
        return formatWithUnit(value.toFixed(2), dataType);
      case CHART_DATA_TYPE.REPS:
        return Math.round(value).toString();
      default:
        return formatWithUnit(value.toFixed(1), dataType);
    }
  }
}

import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { StatCard } from "@app/components/molecules";
import { FormatUtils } from "@app/utils/FormatUtils";
import { t } from "@app/i18n";
import { trendOf } from "@app/services/history/TrainingHistory";

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
    const format = (value: number) =>
      FormatUtils.formatValue(value, dataType, { decimals: 1 });
    const avgFormatted = format(avgValue);
    const maxFormatted = format(maxV);
    const minFormatted = format(minV);

    return {
      avgFormatted,
      maxFormatted,
      minFormatted,
      maxVolumeDate,
      minVolumeDate,
    };
  }

  /**
   * The trend of the last 3 points (the last 2 when there are only 2),
   * through `trendOf`: the figure is the change along its line, the tone
   * whether that is an improvement (for pace a fall is up).
   * @returns undefined with fewer than 2 points
   */
  private static calculateRecentTrend(
    volumeData: number[],
    dataType: CHART_DATA_TYPE,
  ): { text: string; detail: string; direction: "up" | "down" | "neutral" } | undefined {
    const lastThree = volumeData.length >= 3;
    const trend = trendOf(volumeData.slice(lastThree ? -3 : -2));
    if (!trend) return undefined;
    const detail = lastThree ? t("charts.stats.last3") : t("charts.stats.vsPrevious");
    if (trend.direction === "stable") {
      return { text: t("trends.stable"), detail, direction: "neutral" };
    }
    const change = trend.end - trend.start;
    return {
      text: `${change > 0 ? "+" : "-"}${FormatUtils.formatValue(Math.abs(change), dataType, {
        decimals: dataType === CHART_DATA_TYPE.PACE ? 2 : 1,
        pace: "decimal",
      })}`,
      detail,
      direction: FormatUtils.improvement(trend.direction, dataType),
    };
  }
}

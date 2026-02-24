import { CONSTANTS, getUnitsMap, getColumnLabels } from "@app/constants";
import { CHART_TYPE, CHART_DATA_TYPE } from "@app/features/charts/types";
import { ListItem } from "@app/components/molecules";
import { FormatUtils } from "@app/utils";
import { t } from "@app/i18n";

/**
 * Renders statistical information about workout data.
 * Calculates and displays average, maximum, minimum values, and recent trends
 * for workout volume, weight, or reps data.
 */
export class StatsBox {
  /**
   * Renders a statistics box with workout data analysis.
   * @param container - The HTML element to render the stats in
   * @param labels - Array of date labels corresponding to the data points
   * @param volumeData - Array of numerical data (volume, weight, or reps)
   * @param chartType - Type of data being analyzed (workout or exercise)
   * @param dataType - Type of data for formatting (volume, pace, duration, etc.)
   */
  static render(
    container: HTMLElement,
    labels: string[],
    volumeData: number[],
    chartType: CHART_TYPE,
    dataType: CHART_DATA_TYPE = CHART_DATA_TYPE.VOLUME,
  ): void {
    const statsDiv = container.createEl("div", { cls: "workout-charts-stats" });

    const stats = this.calculateStats(volumeData, labels, dataType);
    const recentTrendData = this.calculateRecentTrend(volumeData, dataType);

    // Get dynamic title from data type (e.g., "Volume (kg)" -> "Volume Statistics")
    const columnLabels = getColumnLabels();
    const dataTypeLabel = columnLabels[dataType].split(" (")[0];
    const contextLabel =
      chartType === CHART_TYPE.WORKOUT
        ? CONSTANTS.WORKOUT.UI.LABELS.TOTAL_WORKOUT
        : CONSTANTS.WORKOUT.LABELS.TABLE.EXERCISE;

    const strongEl = statsDiv.createEl("strong", {
      cls: "workout-charts-stats-title",
    });
    strongEl.textContent = `📈 ${dataTypeLabel} Statistics (${contextLabel}):`;

    const ul = ListItem.createList(statsDiv, {
      className: "workout-charts-stats-list",
    });

    ListItem.createStat(ul, {
      label: t("stats.avgVolume"),
      value: stats.avgFormatted,
    });

    ListItem.createStat(ul, {
      label: "Max: ",
      value: stats.maxFormatted,
      suffix: ` (${stats.maxVolumeDate || CONSTANTS.WORKOUT.COMMON.NOT_AVAILABLE})`,
    });

    ListItem.createStat(ul, {
      label: "Min: ",
      value: stats.minFormatted,
      suffix: ` (${stats.minVolumeDate || CONSTANTS.WORKOUT.COMMON.NOT_AVAILABLE})`,
    });

    ListItem.createStat(ul, {
      label: t("stats.sessions"),
      value: `${labels.length}`,
    });

    if (recentTrendData.text !== t("table.notAvailable")) {
      const li5 = ListItem.createEmpty(ul);
      li5.appendText(t("stats.recentTrend"));
      const span = li5.createEl("span", {
        cls: "workout-charts-trend-variation",
      });
      span.textContent = recentTrendData.text;
      if (recentTrendData.color) {
        // Apply color class based on trend color
        if (recentTrendData.color.includes("green")) {
          span.classList.add("trend-color-green");
        } else if (recentTrendData.color.includes("red")) {
          span.classList.add("trend-color-red");
        } else if (recentTrendData.color.includes("orange")) {
          span.classList.add("trend-color-orange");
        } else {
          span.classList.add("trend-color-accent");
        }
      }
      if (recentTrendData.suffix) {
        li5.appendText(recentTrendData.suffix);
      }
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
    const avgValue = volumeData.reduce((s, v) => s + v, 0) / volumeData.length;
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
      default: {
        const unitsMap = getUnitsMap();
        const unit = unitsMap[dataType];
        return unit ? `${value.toFixed(1)} ${unit}` : value.toFixed(1);
      }
    }
  }

  /**
   * Calculates the recent trend in the workout data.
   * Analyzes the last 3 data points to determine if the trend is increasing, decreasing, or stable.
   * @param volumeData - Array of numerical data points
   * @param dataType - Type of data for formatting and color logic
   * @returns Object with text, color, and optional suffix for the recent trend
   */
  private static calculateRecentTrend(
    volumeData: number[],
    dataType: CHART_DATA_TYPE,
  ): {
    text: string;
    color: string;
    suffix?: string;
  } {
    const isLowerBetter = FormatUtils.isLowerBetter(dataType);
    const unitsMap = getUnitsMap();
    const unit = unitsMap[dataType];

    if (volumeData.length >= 3) {
      const recent = volumeData.slice(-3);
      const changeRecent = recent[2] - recent[0];

      if (changeRecent > 0.05 * recent[0]) {
        // Value increased
        const color = isLowerBetter ? "var(--color-red)" : "var(--color-green)";
        return {
          text: `+${this.formatTrendValue(Math.abs(changeRecent), dataType, unit)}`,
          color,
          suffix: " (ultime 3)",
        };
      } else if (changeRecent < -0.05 * recent[0]) {
        // Value decreased
        const color = isLowerBetter ? "var(--color-green)" : "var(--color-red)";
        return {
          text: `-${this.formatTrendValue(Math.abs(changeRecent), dataType, unit)}`,
          color,
          suffix: " (ultime 3)",
        };
      } else {
        return {
          text: t("trends.stable"),
          color: "var(--color-orange)",
          suffix: " (ultime 3)",
        };
      }
    } else if (volumeData.length === 2) {
      const changeRecent = volumeData[1] - volumeData[0];

      if (changeRecent > 0) {
        // Value increased
        const color = isLowerBetter ? "var(--color-red)" : "var(--color-green)";
        return {
          text: `+${this.formatTrendValue(Math.abs(changeRecent), dataType, unit)}`,
          color,
          suffix: " (vs prec.)",
        };
      } else if (changeRecent < 0) {
        // Value decreased
        const color = isLowerBetter ? "var(--color-green)" : "var(--color-red)";
        return {
          text: `-${this.formatTrendValue(Math.abs(changeRecent), dataType, unit)}`,
          color,
          suffix: " (vs prec.)",
        };
      } else {
        return {
          text: t("trends.invariant"),
          color: "var(--color-orange)",
          suffix: " (vs prec.)",
        };
      }
    }
    return { text: t("table.notAvailable"), color: "" };
  }

  /**
   * Formats a trend change value based on data type.
   * For duration/pace uses specialized formatters, for others adds the unit.
   * @param value - The absolute change value
   * @param dataType - Type of data being formatted
   * @param unit - Unit string from UNITS_MAP
   * @returns Formatted string
   */
  private static formatTrendValue(
    value: number,
    dataType: CHART_DATA_TYPE,
    unit: string,
  ): string {
    switch (dataType) {
      case CHART_DATA_TYPE.DURATION:
        return FormatUtils.formatDuration(value);
      case CHART_DATA_TYPE.PACE:
        return `${value.toFixed(2)} ${unit}`;
      case CHART_DATA_TYPE.REPS:
        return Math.round(value).toString();
      default:
        return unit ? `${value.toFixed(1)} ${unit}` : value.toFixed(1);
    }
  }
}

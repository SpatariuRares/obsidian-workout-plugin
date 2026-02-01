import { CONSTANTS } from "@app/constants";
import { CHART_TYPE } from "@app/types";
import { ListItem } from "@app/components/molecules";

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
   */
  static render(
    container: HTMLElement,
    labels: string[],
    volumeData: number[],
    chartType: CHART_TYPE
  ): void {
    const statsDiv = container.createEl("div", { cls: "workout-charts-stats" });

    const stats = this.calculateStats(volumeData, labels);
    const recentTrendData = this.calculateRecentTrend(volumeData);

    const strongEl = statsDiv.createEl("strong", {
      cls: "workout-charts-stats-title",
    });
    strongEl.textContent = `📈 Volume Statistics (${chartType === CHART_TYPE.WORKOUT ? CONSTANTS.WORKOUT.UI.LABELS.TOTAL_WORKOUT : CONSTANTS.WORKOUT.LABELS.TABLE.EXERCISE
      }):`;

    const ul = ListItem.createList(statsDiv, {
      className: "workout-charts-stats-list",
    });

    ListItem.createStat(ul, {
      label: CONSTANTS.WORKOUT.STATS.LABELS.AVG_VOLUME,
      value: `${stats.avgVolume} kg`,
    });

    ListItem.createStat(ul, {
      label: "Max: ",
      value: `${stats.maxVolume} kg`,
      suffix: ` (${stats.maxVolumeDate || CONSTANTS.WORKOUT.COMMON.NOT_AVAILABLE})`,
    });

    ListItem.createStat(ul, {
      label: "Min: ",
      value: `${stats.minVolume} kg`,
      suffix: ` (${stats.minVolumeDate || CONSTANTS.WORKOUT.COMMON.NOT_AVAILABLE})`,
    });

    ListItem.createStat(ul, {
      label: CONSTANTS.WORKOUT.STATS.LABELS.SESSIONS,
      value: `${labels.length}`,
    });

    if (recentTrendData.text !== CONSTANTS.WORKOUT.LABELS.TABLE.NOT_AVAILABLE) {
      const li5 = ListItem.createEmpty(ul);
      li5.appendText(CONSTANTS.WORKOUT.STATS.LABELS.RECENT_TREND);
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
   * @returns Object containing average, maximum, minimum values and their dates
   */
  private static calculateStats(volumeData: number[], labels: string[]) {
    const avgVolume = (
      volumeData.reduce((s, v) => s + v, 0) / volumeData.length
    ).toFixed(1);
    const maxV = Math.max(...volumeData);
    const maxVolume = maxV.toFixed(1);
    const maxVolumeDate = labels[volumeData.indexOf(maxV)];
    const minV = Math.min(...volumeData);
    const minVolume = minV.toFixed(1);
    const minVolumeDate = labels[volumeData.indexOf(minV)];

    return { avgVolume, maxVolume, maxVolumeDate, minVolume, minVolumeDate };
  }

  /**
   * Calculates the recent trend in the workout data.
   * Analyzes the last 3 data points to determine if the trend is increasing, decreasing, or stable.
   * @param volumeData - Array of numerical data points
   * @returns Object with text, color, and optional suffix for the recent trend
   */
  private static calculateRecentTrend(volumeData: number[]): {
    text: string;
    color: string;
    suffix?: string;
  } {
    if (volumeData.length >= 3) {
      const recent = volumeData.slice(-3);
      const changeRecent = recent[2] - recent[0];
      const changeRecentAbs = Math.abs(changeRecent).toFixed(1);

      if (changeRecent > 0.05 * recent[0]) {
        return {
          text: `+${changeRecentAbs} kg`,
          color: "var(--color-green)",
          suffix: " (ultime 3)",
        };
      } else if (changeRecent < -0.05 * recent[0]) {
        return {
          text: `-${changeRecentAbs} kg`,
          color: "var(--color-red)",
          suffix: " (ultime 3)",
        };
      } else {
        return {
          text: CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE,
          color: "var(--color-orange)",
          suffix: " (ultime 3)",
        };
      }
    } else if (volumeData.length === 2) {
      const changeRecent = volumeData[1] - volumeData[0];
      const changeRecentAbs = Math.abs(changeRecent).toFixed(1);

      if (changeRecent > 0) {
        return {
          text: `+${changeRecentAbs} kg`,
          color: "var(--color-green)",
          suffix: " (vs prec.)",
        };
      } else if (changeRecent < 0) {
        return {
          text: `-${changeRecentAbs} kg`,
          color: "var(--color-red)",
          suffix: " (vs prec.)",
        };
      } else {
        return {
          text: CONSTANTS.WORKOUT.TRENDS.STATUS.INVARIANT,
          color: "var(--color-orange)",
          suffix: " (vs prec.)",
        };
      }
    }
    return { text: CONSTANTS.WORKOUT.LABELS.TABLE.NOT_AVAILABLE, color: "" };
  }
}


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
    chartType: string
  ): void {
    const statsDiv = container.createEl("div", { cls: "workout-charts-stats" });

    const stats = this.calculateStats(volumeData, labels);
    const recentTrendData = this.calculateRecentTrend(volumeData);

    const strongEl = statsDiv.createEl("strong", {
      cls: "workout-charts-stats-title",
    });
    strongEl.textContent = `📈 Volume Statistics (${
      chartType === "workout" ? "Total Workout" : "Exercise"
    }):`;

    const ul = statsDiv.createEl("ul", { cls: "workout-charts-stats-list" });

    const li1 = ul.createEl("li");
    li1.textContent = "Volume medio: ";
    li1.createEl("strong", { text: `${stats.avgVolume} kg` });

    const li2 = ul.createEl("li");
    li2.textContent = `Max: `;
    li2.createEl("strong", { text: `${stats.maxVolume} kg` });
    li2.append(` (${stats.maxVolumeDate || "N/D"})`);

    const li3 = ul.createEl("li");
    li3.textContent = `Min: `;
    li3.createEl("strong", { text: `${stats.minVolume} kg` });
    li3.append(` (${stats.minVolumeDate || "N/D"})`);

    const li4 = ul.createEl("li");
    li4.textContent = "Sessions: ";
    li4.createEl("strong", { text: `${labels.length}` });

    if (recentTrendData.text !== "N/A") {
      const li5 = ul.createEl("li");
      li5.textContent = "Recent trend: ";
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
        li5.append(recentTrendData.suffix);
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
          text: "Stabile",
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
          text: "Invariato",
          color: "var(--color-orange)",
          suffix: " (vs prec.)",
        };
      }
    }
    return { text: "N/A", color: "" };
  }
}


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
    const statsDiv = container.createEl("div", { cls: "embedded-chart-stats" });

    const stats = this.calculateStats(volumeData, labels);
    const recentTrendText = this.calculateRecentTrend(volumeData);

    statsDiv.innerHTML = `
      <strong style="font-size:1.13em;">📈 Statistiche Volume (${
        chartType === "workout" ? "Totale Allenamento" : "Esercizio"
      }):</strong>
      <ul style="margin-top:10px;margin-bottom:5px;list-style-type:square;padding-left:22px;">
        <li>Volume medio: <strong>${stats.avgVolume} kg</strong></li>
        <li>Max: <strong>${stats.maxVolume} kg</strong> (${
      stats.maxVolumeDate || "N/D"
    })</li>
        <li>Min: <strong>${stats.minVolume} kg</strong> (${
      stats.minVolumeDate || "N/D"
    })</li>
        <li>Sessioni: <strong>${labels.length}</strong></li>
        ${
          recentTrendText !== "N/A"
            ? `<li>Trend Recente: ${recentTrendText}</li>`
            : ""
        }
      </ul>
    `;
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
   * @returns Formatted string describing the recent trend with color coding
   */
  private static calculateRecentTrend(volumeData: number[]): string {
    if (volumeData.length >= 3) {
      const recent = volumeData.slice(-3);
      const changeRecent = recent[2] - recent[0];
      const changeRecentAbs = Math.abs(changeRecent).toFixed(1);

      if (changeRecent > 0.05 * recent[0]) {
        return `<span style="color:var(--color-green)">+${changeRecentAbs} kg</span> (ultime 3)`;
      } else if (changeRecent < -0.05 * recent[0]) {
        return `<span style="color:var(--color-red)">-${changeRecentAbs} kg</span> (ultime 3)`;
      } else {
        return "<span style='color:var(--color-orange)'>Stabile</span> (ultime 3)";
      }
    } else if (volumeData.length === 2) {
      const changeRecent = volumeData[1] - volumeData[0];
      const changeRecentAbs = Math.abs(changeRecent).toFixed(1);

      if (changeRecent > 0) {
        return `<span style="color:var(--color-green)">+${changeRecentAbs} kg</span> (vs prec.)`;
      } else if (changeRecent < 0) {
        return `<span style="color:var(--color-red)">-${changeRecentAbs} kg</span> (vs prec.)`;
      } else {
        return "<span style='color:var(--color-orange)'>Invariato</span> (vs prec.)";
      }
    }
    return "N/A";
  }
}

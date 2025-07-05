export class StatsBox {
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

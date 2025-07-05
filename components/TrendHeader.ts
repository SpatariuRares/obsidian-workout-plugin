import { TrendIndicators } from "./types";

export class TrendHeader {
  static render(
    container: HTMLElement,
    trendIndicators: TrendIndicators,
    volumeData: number[]
  ): void {
    const trendHeader = container.createEl("div", {
      cls: "embedded-chart-trend-header",
    });

    const { firstValue, lastValue, percentChange } =
      this.calculateVariation(volumeData);
    const variationText = this.formatVariationText(
      firstValue,
      lastValue,
      percentChange,
      trendIndicators.trendColor,
      volumeData
    );

    trendHeader.innerHTML = `
      <h3 style="color:${trendIndicators.trendColor};" class="embedded-chart-trend-header-h3">
        ${trendIndicators.trendIcon} Trend Volume: <strong>${trendIndicators.trendDirection}</strong>
      </h3>
      <p class="embedded-chart-trend-header-p">
        Variazione Complessiva: ${variationText}
      </p>
    `;
  }

  private static calculateVariation(volumeData: number[]) {
    let firstValue: number | undefined,
      lastValue: number | undefined,
      percentChange = "N/A";

    if (volumeData.length >= 2) {
      firstValue = volumeData[0];
      lastValue = volumeData[volumeData.length - 1];
      percentChange =
        firstValue !== 0
          ? (((lastValue - firstValue) / Math.abs(firstValue)) * 100).toFixed(1)
          : lastValue > 0
          ? "Infinity"
          : "0.0";
    } else if (volumeData.length === 1) {
      firstValue = volumeData[0];
      percentChange = "0.0";
    }

    return { firstValue, lastValue, percentChange };
  }

  private static formatVariationText(
    firstValue: number | undefined,
    lastValue: number | undefined,
    percentChange: string,
    trendColor: string,
    volumeData: number[]
  ): string {
    if (
      firstValue !== undefined &&
      lastValue !== undefined &&
      volumeData.length >= 2
    ) {
      const changeSign = parseFloat(percentChange) > 0 ? "+" : "";
      return `<span style="color:${trendColor};" class="embedded-chart-trend-variation">${
        percentChange === "Infinity"
          ? "Aumento signif."
          : changeSign + percentChange + "%"
      }</span> (da ${firstValue.toFixed(1)} kg a ${lastValue.toFixed(1)} kg)`;
    } else if (firstValue !== undefined && volumeData.length === 1) {
      return `(Volume: ${firstValue.toFixed(1)} kg)`;
    }
    return "N/A";
  }
}

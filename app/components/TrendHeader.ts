import { TrendIndicators } from "./types";

/**
 * Renders trend header information for workout charts.
 * Displays trend direction, variation percentage, and visual indicators
 * to help users understand their workout progress.
 */
export class TrendHeader {
  /**
   * Renders a trend header with progress information.
   * @param container - The HTML element to render the trend header in
   * @param trendIndicators - Trend indicators containing direction, color, and icon
   * @param volumeData - Array of numerical data for calculating variation
   */
  static render(
    container: HTMLElement,
    trendIndicators: TrendIndicators,
    volumeData: number[]
  ): void {
    const trendHeader = container.createEl("div", {
      cls: "workout-charts-trend-header",
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
      <h3 style="color:${trendIndicators.trendColor};" class="workout-charts-trend-header-h3">
        ${trendIndicators.trendIcon} Trend Volume: <strong>${trendIndicators.trendDirection}</strong>
      </h3>
      <p class="workout-charts-trend-header-p">
        Variazione Complessiva: ${variationText}
      </p>
    `;
  }

  /**
   * Calculates the variation between first and last data points.
   * @param volumeData - Array of numerical data points
   * @returns Object containing first value, last value, and percentage change
   */
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

  /**
   * Formats the variation text with appropriate styling and context.
   * @param firstValue - The first value in the dataset
   * @param lastValue - The last value in the dataset
   * @param percentChange - The calculated percentage change as a string
   * @param trendColor - Color to use for the variation text
   * @param volumeData - Array of numerical data points for context
   * @returns Formatted variation text with color coding and units
   */
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
      return `<span style="color:${trendColor};" class="workout-charts-trend-variation">${
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

/**
 * Utility class for statistical calculations
 * Handles trend analysis and mathematical operations on workout data
 */
export class StatisticsUtils {
  /**
   * Calculate trend line data using linear regression
   * Returns slope and intercept for the best-fit line
   */
  static calculateTrendLine(data: number[]): {
    slope: number;
    intercept: number;
  } {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: 0 };

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }
}

 
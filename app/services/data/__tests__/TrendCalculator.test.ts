import { CONSTANTS } from "@app/constants";
import { TrendCalculator } from "@app/services/data/TrendCalculator";
import { CHART_DATA_TYPE } from "@app/features/charts";

describe("TrendCalculator", () => {
  describe("getTrendIndicators", () => {
    it("should return insufficient data message when volumeData has less than 2 points", () => {
      const result = TrendCalculator.getTrendIndicators(0, [100]);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.MESSAGES.STATUS.INSUFFICIENT_DATA,
      );
      expect(result.trendColor).toBe("var(--text-muted, #888)");
      expect(result.trendIcon).toBe("·");
    });

    it("should return insufficient data message for empty array", () => {
      const result = TrendCalculator.getTrendIndicators(0, []);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.MESSAGES.STATUS.INSUFFICIENT_DATA,
      );
      expect(result.trendColor).toBe("var(--text-muted, #888)");
      expect(result.trendIcon).toBe("·");
    });

    it("should return increasing trend when slope is above threshold", () => {
      const volumeData = [100, 110, 120, 130];
      const averageVolume = 115;
      const slopeThreshold = Math.max(0.05 * averageVolume, 1); // 5.75
      const slope = 10; // Well above threshold

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
      );
      expect(result.trendColor).toBe("var(--color-green, #4CAF50)");
      expect(result.trendIcon).toBe("↗️");
    });

    it("should return decreasing trend when slope is below negative threshold", () => {
      const volumeData = [130, 120, 110, 100];
      const averageVolume = 115;
      const slopeThreshold = Math.max(0.05 * averageVolume, 1); // 5.75
      const slope = -10; // Well below -threshold

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.DECREASING,
      );
      expect(result.trendColor).toBe("var(--color-red, #F44336)");
      expect(result.trendIcon).toBe("↘️");
    });

    it("should return stable trend when slope is within threshold range", () => {
      const volumeData = [100, 101, 100, 101];
      const slope = 0.5; // Very small slope

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE_LOWER,
      );
      expect(result.trendColor).toBe("var(--color-accent, #FFC107)");
      expect(result.trendIcon).toBe("→");
    });

    it("should return stable trend when slope is exactly zero", () => {
      const volumeData = [100, 100, 100, 100];
      const slope = 0;

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE_LOWER,
      );
      expect(result.trendColor).toBe("var(--color-accent, #FFC107)");
      expect(result.trendIcon).toBe("→");
    });

    it("should use minimum threshold of 1 for small average volumes", () => {
      const volumeData = [2, 3, 2, 3]; // Average = 2.5
      // Threshold = Math.max(0.05 * 2.5, 1) = 1
      const slope = 1.5; // Above threshold of 1

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
      );
    });

    it("should handle large volume data correctly", () => {
      const volumeData = [1000, 1100, 1200, 1300];
      const averageVolume = 1150;
      const slopeThreshold = Math.max(0.05 * averageVolume, 1); // 57.5
      const slope = 100; // Well above threshold

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
      );
    });

    it("should handle negative volume values", () => {
      const volumeData = [-100, -90, -80, -70];
      const slope = 10; // Positive slope

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
      );
    });

    it("should calculate threshold based on average volume", () => {
      const volumeData = [100, 200]; // Average = 150
      // Threshold = Math.max(0.05 * 150, 1) = 7.5
      const slope = 8; // Above 7.5

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
      );
    });

    it("should return stable for slope just below positive threshold", () => {
      const volumeData = [100, 200]; // Average = 150
      // Threshold = Math.max(0.05 * 150, 1) = 7.5
      const slope = 7; // Below 7.5

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE_LOWER,
      );
    });

    it("should return stable for slope just above negative threshold", () => {
      const volumeData = [100, 200]; // Average = 150
      // Threshold = Math.max(0.05 * 150, 1) = 7.5
      const slope = -7; // Above -7.5

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE_LOWER,
      );
    });

    it("should handle mixed positive and negative values", () => {
      const volumeData = [-50, 0, 50, 100];
      const slope = 50; // Positive trend

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
      );
    });

    it("should handle very small slopes correctly", () => {
      const volumeData = [1000, 1000.1, 1000.2, 1000.3];
      const slope = 0.1; // Very small positive slope

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE_LOWER,
      );
    });

    it("should return decreasing for slope at exactly negative threshold", () => {
      const volumeData = [100, 200]; // Average = 150
      // Threshold = Math.max(0.05 * 150, 1) = 7.5
      const slope = -7.5; // Exactly at -threshold (edge case)

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      // The condition is slope < -threshold, so -7.5 < -7.5 is false
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE_LOWER,
      );
    });

    it("should return increasing for slope at exactly positive threshold", () => {
      const volumeData = [100, 200]; // Average = 150
      // Threshold = Math.max(0.05 * 150, 1) = 7.5
      const slope = 7.5; // Exactly at threshold (edge case)

      const result = TrendCalculator.getTrendIndicators(slope, volumeData);
      // The condition is slope > threshold, so 7.5 > 7.5 is false
      expect(result.trendDirection).toBe(
        CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE_LOWER,
      );
    });

    describe("dataType parameter for inverted logic", () => {
      it("should return Improving/green for pace with negative slope (getting faster)", () => {
        const paceData = [6.0, 5.5, 5.0, 4.5]; // Average = 5.25 min/km
        // Threshold = Math.max(0.05 * 5.25, 1) = 1
        const slope = -1.5; // Negative slope below -1 threshold (pace decreasing = faster)

        const result = TrendCalculator.getTrendIndicators(
          slope,
          paceData,
          CHART_DATA_TYPE.PACE,
        );
        expect(result.trendDirection).toBe(
          CONSTANTS.WORKOUT.TRENDS.STATUS.IMPROVING,
        );
        expect(result.trendColor).toBe("var(--color-green, #4CAF50)");
        expect(result.trendIcon).toBe("↗️");
      });

      it("should return Declining/red for pace with positive slope (getting slower)", () => {
        const paceData = [4.5, 5.0, 5.5, 6.0]; // Average = 5.25 min/km
        // Threshold = Math.max(0.05 * 5.25, 1) = 1
        const slope = 1.5; // Positive slope above 1 threshold (pace increasing = slower)

        const result = TrendCalculator.getTrendIndicators(
          slope,
          paceData,
          CHART_DATA_TYPE.PACE,
        );
        expect(result.trendDirection).toBe(
          CONSTANTS.WORKOUT.TRENDS.STATUS.DECLINING,
        );
        expect(result.trendColor).toBe("var(--color-red, #F44336)");
        expect(result.trendIcon).toBe("↘️");
      });

      it("should return Increasing/green for volume with positive slope (default behavior)", () => {
        const volumeData = [100, 110, 120, 130];
        const slope = 10;

        const result = TrendCalculator.getTrendIndicators(
          slope,
          volumeData,
          CHART_DATA_TYPE.VOLUME,
        );
        expect(result.trendDirection).toBe(
          CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
        );
        expect(result.trendColor).toBe("var(--color-green, #4CAF50)");
        expect(result.trendIcon).toBe("↗️");
      });

      it("should use default behavior when dataType is not provided", () => {
        const volumeData = [100, 110, 120, 130];
        const slope = 10;

        const result = TrendCalculator.getTrendIndicators(slope, volumeData);
        expect(result.trendDirection).toBe(
          CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
        );
        expect(result.trendColor).toBe("var(--color-green, #4CAF50)");
      });

      it("should return stable for pace when slope is within threshold", () => {
        const paceData = [5.0, 5.05, 4.95, 5.0]; // Average = 5.0 min/km
        // Threshold = Math.max(0.05 * 5.0, 1) = 1
        const slope = 0.01; // Very small slope, within threshold

        const result = TrendCalculator.getTrendIndicators(
          slope,
          paceData,
          CHART_DATA_TYPE.PACE,
        );
        expect(result.trendDirection).toBe(
          CONSTANTS.WORKOUT.TRENDS.STATUS.STABLE_LOWER,
        );
        expect(result.trendColor).toBe("var(--color-accent, #FFC107)");
      });

      it("should maintain default behavior for weight data type", () => {
        const weightData = [80, 82.5, 85, 87.5]; // Average = 83.75 kg
        // Threshold = Math.max(0.05 * 83.75, 1) = 4.1875
        const slope = 5; // Above threshold

        const result = TrendCalculator.getTrendIndicators(
          slope,
          weightData,
          CHART_DATA_TYPE.WEIGHT,
        );
        expect(result.trendDirection).toBe(
          CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
        );
        expect(result.trendColor).toBe("var(--color-green, #4CAF50)");
      });

      it("should maintain default behavior for heart rate data type", () => {
        const hrData = [150, 155, 160, 165]; // Average = 157.5 bpm
        // Threshold = Math.max(0.05 * 157.5, 1) = 7.875
        const slope = 10; // Above threshold

        const result = TrendCalculator.getTrendIndicators(
          slope,
          hrData,
          CHART_DATA_TYPE.HEART_RATE,
        );
        expect(result.trendDirection).toBe(
          CONSTANTS.WORKOUT.TRENDS.STATUS.INCREASING,
        );
        expect(result.trendColor).toBe("var(--color-green, #4CAF50)");
      });
    });
  });
});

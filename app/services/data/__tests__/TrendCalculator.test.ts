import { TrendCalculator } from "@app/services/data/TrendCalculator";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { t } from "@app/i18n";

// The direction itself comes from trendOf (TrainingHistory.test.ts); these
// tests cover how each direction is labelled, colored and iconed.
describe("TrendCalculator", () => {
  describe("getTrendIndicators", () => {
    it("should return insufficient data message when volumeData has less than 2 points", () => {
      const result = TrendCalculator.getTrendIndicators([100]);
      expect(result.trendDirection).toBe(t("messages.insufficientData"));
      expect(result.trendColor).toBe("var(--text-muted, #888)");
      expect(result.trendIcon).toBe("minus");
    });

    it("should return insufficient data message for empty array", () => {
      const result = TrendCalculator.getTrendIndicators([]);
      expect(result.trendDirection).toBe(t("messages.insufficientData"));
    });

    it("should return increasing/green for a rising series", () => {
      const result = TrendCalculator.getTrendIndicators([100, 110, 120, 130]);
      expect(result.trendDirection).toBe(t("trends.increasing"));
      expect(result.trendColor).toBe("var(--color-green, #4CAF50)");
      expect(result.trendIcon).toBe("trending-up");
    });

    it("should return decreasing/red for a falling series", () => {
      const result = TrendCalculator.getTrendIndicators([130, 120, 110, 100]);
      expect(result.trendDirection).toBe(t("trends.decreasing"));
      expect(result.trendColor).toBe("var(--color-red, #F44336)");
      expect(result.trendIcon).toBe("trending-down");
    });

    it("should return stable for a flat series", () => {
      const result = TrendCalculator.getTrendIndicators([100, 100, 100]);
      expect(result.trendDirection).toBe(t("trends.stableLower"));
      expect(result.trendColor).toBe("var(--color-accent, #FFC107)");
      expect(result.trendIcon).toBe("arrow-right");
    });

    it("should return increasing for steady progressive overload (+25% over 6 sessions)", () => {
      // ~4.4% per session: below 5% per step, but a clear upward trend overall
      const result = TrendCalculator.getTrendIndicators([
        400, 420, 440, 460, 480, 500,
      ]);
      expect(result.trendDirection).toBe(t("trends.increasing"));
    });

    it("should return stable when the change over the whole range is under 5%", () => {
      const result = TrendCalculator.getTrendIndicators([
        450, 452, 448, 455, 451, 456,
      ]);
      expect(result.trendDirection).toBe(t("trends.stableLower"));
    });

    describe("dataType parameter for inverted logic", () => {
      it("should return improving/green for pace getting faster (5:30 to 5:00 min/km)", () => {
        const result = TrendCalculator.getTrendIndicators(
          [5.5, 5.4, 5.3, 5.2, 5.1, 5.0],
          CHART_DATA_TYPE.PACE,
        );
        expect(result.trendDirection).toBe(t("trends.improving"));
        expect(result.trendColor).toBe("var(--color-green, #4CAF50)");
        expect(result.trendIcon).toBe("trending-up");
      });

      it("should return declining/red for pace getting slower", () => {
        const result = TrendCalculator.getTrendIndicators(
          [4.5, 5.0, 5.5, 6.0],
          CHART_DATA_TYPE.PACE,
        );
        expect(result.trendDirection).toBe(t("trends.declining"));
        expect(result.trendColor).toBe("var(--color-red, #F44336)");
        expect(result.trendIcon).toBe("trending-down");
      });

      it("should return stable for pace within 5% of the mean", () => {
        const result = TrendCalculator.getTrendIndicators(
          [5.0, 5.05, 5.0, 5.05],
          CHART_DATA_TYPE.PACE,
        );
        expect(result.trendDirection).toBe(t("trends.stableLower"));
      });

      it("should keep the default meaning for weight and heart rate", () => {
        for (const type of [CHART_DATA_TYPE.WEIGHT, CHART_DATA_TYPE.HEART_RATE]) {
          const result = TrendCalculator.getTrendIndicators([100, 120], type);
          expect(result.trendDirection).toBe(t("trends.increasing"));
        }
      });
    });
  });
});

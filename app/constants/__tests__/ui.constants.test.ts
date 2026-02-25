/**
 * @fileoverview Tests for UI constants
 *
 * Tests all dynamic functions in ui.constants.ts to ensure 100% coverage.
 */

import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { CHARTS_UI } from "../ui.constants";
import { t } from "@app/i18n";

describe("ui.constants", () => {
  describe("CHARTS_UI.LABELS", () => {
    describe("TREND_TITLE", () => {
      it("should return i18n key for trend title", () => {
        const result = CHARTS_UI.LABELS.TREND_TITLE();
        expect(result).toBe(
          t("charts.trendType", { typeName: t("charts.types.volume") }),
        );
      });

      it("should return i18n key for volume data type", () => {
        const result = CHARTS_UI.LABELS.TREND_TITLE(CHART_DATA_TYPE.VOLUME);
        expect(result).toBe(
          t("charts.trendType", { typeName: t("charts.types.volume") }),
        );
      });
    });

    describe("VARIATION_FROM_TO_FORMATTED", () => {
      it("should format start and end values", () => {
        const result = CHARTS_UI.LABELS.VARIATION_FROM_TO_FORMATTED("50", "75");
        expect(result).toBe(
          t("charts.variationFromTo", { startValue: "50", endValue: "75" }),
        );
      });
    });

    describe("VARIATION_SINGLE_VALUE_FORMATTED", () => {
      it("should use type name when no data type specified", () => {
        const result = CHARTS_UI.LABELS.VARIATION_SINGLE_VALUE_FORMATTED("100");
        const typeName = t("charts.types.volume");
        expect(result).toBe(` (${typeName}: 100)`);
      });

      it("should use correct type name for different data types", () => {
        const resultWeight = CHARTS_UI.LABELS.VARIATION_SINGLE_VALUE_FORMATTED(
          "50",
          CHART_DATA_TYPE.WEIGHT,
        );
        const weightTypeName = t("charts.types.weight");
        expect(resultWeight).toBe(` (${weightTypeName}: 50)`);

        const resultReps = CHARTS_UI.LABELS.VARIATION_SINGLE_VALUE_FORMATTED(
          "12",
          CHART_DATA_TYPE.REPS,
        );
        const repsTypeName = t("charts.types.reps");
        expect(resultReps).toBe(` (${repsTypeName}: 12)`);
      });
    });

    describe("VARIATION_VALUE_LABEL_FORMATTED", () => {
      it("should use type name when no data type specified", () => {
        const result = CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED("150");
        const typeName = t("charts.types.volume");
        expect(result).toBe(`${typeName}: 150`);
      });

      it("should use correct type name for different data types", () => {
        const resultDuration = CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED(
          "60",
          CHART_DATA_TYPE.DURATION,
        );
        const durationTypeName = t("charts.types.duration");
        expect(resultDuration).toBe(`${durationTypeName}: 60`);

        const resultDistance = CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED(
          "5",
          CHART_DATA_TYPE.DISTANCE,
        );
        const distanceTypeName = t("charts.types.distance");
        expect(resultDistance).toBe(`${distanceTypeName}: 5`);

        const resultPace = CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED(
          "6:30",
          CHART_DATA_TYPE.PACE,
        );
        const paceTypeName = t("charts.types.pace");
        expect(resultPace).toBe(`${paceTypeName}: 6:30`);

        const resultHR = CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED(
          "145",
          CHART_DATA_TYPE.HEART_RATE,
        );
        const hrTypeName = t("charts.types.heartRate");
        expect(resultHR).toBe(`${hrTypeName}: 145`);
      });
    });
  });
});

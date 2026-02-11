import {
  ChartLabels,
  getAvailableChartDataTypes,
  getDefaultChartDataType,
  getDefaultChartTitle,
  getUnitForChartType,
  getYAxisLabel,
  isValidChartDataType,
} from "../ChartConstants";

import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";

describe("ChartConstants", () => {
  it("creates a default chart title", () => {
    expect(getDefaultChartTitle("volume")).toBe("Trend Volume");
    expect(getDefaultChartTitle("reps")).toBe("Trend Reps");
  });

  it("returns correct units and axis labels", () => {
    const weightUnit = ParameterUtils.getWeightUnit();

    expect(getUnitForChartType("volume")).toBe(weightUnit);
    expect(getUnitForChartType("reps")).toBe("");

    expect(getYAxisLabel("weight")).toBe(
      `${ChartLabels.Y_AXIS.WEIGHT} (${weightUnit})`,
    );
    expect(getYAxisLabel("unknown")).toBe(
      `${ChartLabels.Y_AXIS.VOLUME} (${weightUnit})`,
    );
  });

  it("returns available chart data types for exercise type", () => {
    expect(getAvailableChartDataTypes("strength")).toEqual([
      "volume",
      "weight",
      "reps",
    ]);

    expect(getAvailableChartDataTypes("custom", ["speed", "power"])).toEqual([
      "speed",
      "power",
    ]);
  });

  it("returns default chart data type for exercise type", () => {
    expect(getDefaultChartDataType("strength")).toBe("volume");

    expect(getDefaultChartDataType("custom", ["cadence", "pace"])).toBe(
      "cadence",
    );

    expect(getDefaultChartDataType("unknown")).toBe("volume");
  });

  it("validates chart data types", () => {
    expect(isValidChartDataType("strength", "volume")).toBe(true);
    expect(isValidChartDataType("strength", "pace")).toBe(false);
    expect(isValidChartDataType("custom", "power", ["power", "speed"])).toBe(
      true,
    );
  });
});

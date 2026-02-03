import {
  ChartLabels,
  ChartType,
  DEFAULT_CHART_DATA_TYPE_BY_EXERCISE,
  EXERCISE_TYPE_CHART_DATA_TYPES,
  getAvailableChartDataTypes,
  getDefaultChartDataType,
  getDefaultChartTitle,
  getUnitForChartType,
  getYAxisLabel,
  isValidChartDataType,
} from "../ChartConstants";

describe("ChartConstants", () => {
  it("creates a default chart title", () => {
    expect(getDefaultChartTitle("volume")).toBe("Trend Volume");
    expect(getDefaultChartTitle("reps")).toBe("Trend Reps");
  });

  it("returns correct units and axis labels", () => {
    expect(getUnitForChartType(ChartType.VOLUME)).toBe(ChartLabels.UNITS.WEIGHT);
    expect(getUnitForChartType(ChartType.REPS)).toBe(ChartLabels.UNITS.REPS);

    expect(getYAxisLabel(ChartType.WEIGHT)).toBe(ChartLabels.Y_AXIS.WEIGHT);
    expect(getYAxisLabel("unknown")).toBe(ChartLabels.Y_AXIS.VOLUME);
  });

  it("returns available chart data types for exercise type", () => {
    expect(getAvailableChartDataTypes("strength")).toEqual(
      EXERCISE_TYPE_CHART_DATA_TYPES.strength
    );

    expect(getAvailableChartDataTypes("custom", ["speed", "power"]))
      .toEqual(["speed", "power"]);
  });

  it("returns default chart data type for exercise type", () => {
    expect(getDefaultChartDataType("strength")).toBe(
      DEFAULT_CHART_DATA_TYPE_BY_EXERCISE.strength
    );

    expect(getDefaultChartDataType("custom", ["cadence", "pace"]))
      .toBe("cadence");

    expect(getDefaultChartDataType("unknown")).toBe("volume");
  });

  it("validates chart data types", () => {
    expect(isValidChartDataType("strength", "volume")).toBe(true);
    expect(isValidChartDataType("strength", "pace")).toBe(false);
    expect(
      isValidChartDataType("custom", "power", ["power", "speed"])
    ).toBe(true);
  });
});

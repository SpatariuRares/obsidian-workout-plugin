import {
  ChartLabels,
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
    expect(getUnitForChartType("volume")).toBe(ChartLabels.UNITS.WEIGHT);
    expect(getUnitForChartType("reps")).toBe(ChartLabels.UNITS.REPS);

    expect(getYAxisLabel("weight")).toBe(ChartLabels.Y_AXIS.WEIGHT);
    expect(getYAxisLabel("unknown")).toBe(ChartLabels.Y_AXIS.VOLUME);
  });

  it("returns available chart data types for exercise type", () => {
    expect(getAvailableChartDataTypes("strength")).toEqual(
      ["volume", "weight", "reps"]
    );

    expect(getAvailableChartDataTypes("custom", ["speed", "power"]))
      .toEqual(["speed", "power"]);
  });

  it("returns default chart data type for exercise type", () => {
    expect(getDefaultChartDataType("strength")).toBe("volume");

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

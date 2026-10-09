import { TableRowProcessor } from "@app/features/tables/business/TableRowProcessor";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

const log = (overrides: Partial<WorkoutLogData>): WorkoutLogData => ({
  date: "2024-01-24T10:00:00.000Z",
  exercise: "Squat",
  reps: 5,
  weight: 100,
  volume: 500,
  ...overrides,
});

const weightCell = (entry: WorkoutLogData) =>
  TableRowProcessor.processRows([entry], ["weight"])[0].displayRow[0];

describe("TableRowProcessor weight cell", () => {
  beforeEach(() => ParameterUtils.setWeightUnit("kg"));

  it("should show the entered value with its unit when it differs from settings", () => {
    expect(
      weightCell(
        log({ weight: 99.79, enteredWeight: 220, enteredUnit: "lb" }),
      ),
    ).toBe("220 lb");
  });

  it("should show the plain value when the row is in the settings unit", () => {
    expect(
      weightCell(log({ enteredWeight: 100, enteredUnit: "kg" })),
    ).toBe("100");
  });

  it("should show the plain value for logs without an entered unit", () => {
    expect(weightCell(log({}))).toBe("100");
  });
});

describe("TableRowProcessor volume cell", () => {
  beforeEach(() => ParameterUtils.setWeightUnit("lb"));

  const volumeCell = (entry: WorkoutLogData) =>
    TableRowProcessor.processRows([entry], ["volume"])[0].displayRow[0];

  it("should round converted volume to whole numbers", () => {
    expect(
      volumeCell(
        log({ volume: 1388.94, enteredWeight: 105, enteredUnit: "kg" }),
      ),
    ).toBe("1389");
  });

  it("should keep decimals for rows in the settings unit", () => {
    expect(
      volumeCell(log({ volume: 437.5, enteredWeight: 87.5, enteredUnit: "lb" })),
    ).toBe("437.5");
  });
});

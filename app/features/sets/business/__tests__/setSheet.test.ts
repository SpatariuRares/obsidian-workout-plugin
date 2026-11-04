import {
  emptyDraft,
  rowProtocol,
  rowToFormData,
  setRows,
  type SheetInput,
} from "@app/features/sets/business/setSheet";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

const STRENGTH: ParameterDefinition[] = [
  { key: "reps", label: "Reps", type: "number", required: true, min: 0 },
  { key: "weight", label: "Weight", type: "number", required: true, min: 0, unit: "kg" },
];

function set(weight: number, reps: number, extra: Partial<WorkoutLogData> = {}): WorkoutLogData {
  return {
    date: "2026-10-31T10:00:00.000Z",
    exercise: "Bench Press",
    reps,
    weight,
    volume: reps * weight,
    ...extra,
  };
}

function input(overrides: Partial<SheetInput> = {}): SheetInput {
  return {
    parameters: STRENGTH,
    today: [],
    previous: [],
    extraRows: 0,
    ...overrides,
  };
}

describe("setRows", () => {
  it("shows today's sets as logged, then rows up to the planned sets", () => {
    const today = [set(80, 8), set(80, 7)];
    const rows = setRows(input({ today, sets: 4 }));

    expect(rows.map((r) => r.number)).toEqual([1, 2, 3, 4]);
    expect(rows.map((r) => r.logged)).toEqual([today[0], today[1], undefined, undefined]);
  });

  it("without a plan has as many rows as last time, at least one", () => {
    expect(setRows(input({ previous: [set(1, 1), set(1, 1), set(1, 1)] }))).toHaveLength(3);
    expect(setRows(input())).toHaveLength(1);
  });

  it("keeps extra logged sets and the rows the user added", () => {
    const today = [set(80, 8), set(80, 8), set(80, 8)];
    expect(setRows(input({ today, sets: 2 }))).toHaveLength(3);
    expect(setRows(input({ today, sets: 2, extraRows: 2 }))).toHaveLength(5);
  });

  it("hints the same set of last time, the last one past its end", () => {
    const previous = [set(60, 10), set(80, 8), set(77.5, 7)];
    const rows = setRows(input({ previous, sets: 4 }));

    expect(rows.map((r) => r.placeholders)).toEqual([
      { reps: "10", weight: "60" },
      { reps: "8", weight: "80" },
      { reps: "7", weight: "77.5" },
      { reps: "7", weight: "77.5" },
    ]);
  });

  it("hints the targets when the exercise was never done", () => {
    const [row] = setRows(input({ sets: 1, targetReps: 8, targetWeight: 80 }));
    expect(row.placeholders).toEqual({ reps: "8", weight: "80" });
  });

  it("hints custom fields by key", () => {
    const parameters: ParameterDefinition[] = [
      { key: "duration", label: "Duration", type: "number", unit: "sec", required: true },
    ];
    const previous = [set(0, 0, { customFields: { Duration: 45 } })];
    const [row] = setRows(input({ parameters, previous }));
    expect(row.placeholders).toEqual({ duration: "45" });
  });

  it("suggests the protocol of the same set last time only", () => {
    const previous = [set(60, 10, { protocol: "warmup" }), set(80, 8)];
    const rows = setRows(input({ previous, sets: 3 }));

    expect(rows.map((r) => r.suggestedProtocol)).toEqual(["warmup", undefined, undefined]);
    expect(rowProtocol(rows[0], emptyDraft())).toBe("warmup");
    expect(rowProtocol(rows[0], { ...emptyDraft(), protocol: "standard" })).toBe("standard");
    expect(rowProtocol(rows[1], emptyDraft())).toBe("standard");
  });
});

describe("rowToFormData", () => {
  const context = { exercise: "Bench Press", workout: "Push", parameters: STRENGTH };

  it("logs the placeholders of an untouched row", () => {
    const [row] = setRows(input({ previous: [set(80, 8, { protocol: "warmup" })] }));
    const result = rowToFormData(row, emptyDraft(), context);

    expect(result).toEqual({
      data: {
        exercise: "Bench Press",
        workout: "Push",
        reps: 8,
        weight: 80,
        customFields: undefined,
        notes: "",
        protocol: "warmup",
      },
    });
  });

  it("logs what was typed, with the protocol and notes picked", () => {
    const [row] = setRows(input({ previous: [set(80, 8)] }));
    const draft = {
      values: { weight: " 82.5 ", reps: "" },
      protocol: "drop_set",
      notes: " grip ",
    };
    const result = rowToFormData(row, draft, context);

    expect(result).toMatchObject({
      data: { weight: 82.5, reps: 8, protocol: "drop_set", notes: "grip" },
    });
  });

  it("names the field to fix", () => {
    const [row] = setRows(input());
    const empty = rowToFormData(row, emptyDraft(), context);
    expect(empty).toMatchObject({ error: { field: "reps" } });

    const wrong = rowToFormData(row, { values: { reps: "8", weight: "abc" }, notes: "" }, context);
    expect(wrong).toMatchObject({ error: { field: "weight" } });
  });
});

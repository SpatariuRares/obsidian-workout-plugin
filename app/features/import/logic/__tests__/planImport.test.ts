import { planImport } from "@app/features/import/logic/planImport";
import type {
  TimedLogEntryInput,
  WorkoutLogData,
} from "@app/types/WorkoutLogData";

function set(overrides: Partial<TimedLogEntryInput>): TimedLogEntryInput {
  return {
    date: "2024-01-17T17:02:00.000Z",
    timestamp: 1705510920000,
    exercise: "Bench Press (Barbell)",
    reps: 8,
    weight: 80,
    weightUnit: "kg",
    ...overrides,
  };
}

/** A row as the log reads it back, in a log kept in pounds */
function logged(entry: TimedLogEntryInput): WorkoutLogData {
  return {
    ...entry,
    weight: entry.weight * 2.2,
    volume: 0,
    enteredWeight: entry.weight,
    enteredUnit: entry.weightUnit,
  } as WorkoutLogData;
}

describe("planImport", () => {
  it("skips sets already in the log, counting repeats of the same set", () => {
    const first = set({});
    const second = set({ timestamp: first.timestamp + 60_000 });
    const third = set({ timestamp: first.timestamp + 120_000 });

    const plan = planImport(
      [first, second, third],
      [logged({ ...first, exercise: " bench press (barbell)", timestamp: 1 })],
      () => true,
    );

    expect(plan.duplicates).toBe(1);
    expect(plan.toAdd).toEqual([second, third]);
  });

  it("keeps a set that differs in weight, unit or day", () => {
    const original = set({});
    const plan = planImport(
      [
        set({ weight: 82.5 }),
        set({ weightUnit: "lb" }),
        set({ date: "2024-01-18T17:02:00.000Z" }),
      ],
      [logged(original)],
      () => true,
    );

    expect(plan.duplicates).toBe(0);
    expect(plan.toAdd).toHaveLength(3);
  });

  it("lists exercises without a page once, and the days the import covers", () => {
    const plan = planImport(
      [
        set({ exercise: "Squat (Barbell)", date: "2024-03-05T06:30:00.000Z" }),
        set({ exercise: "squat (barbell)", date: "2024-01-17T17:02:00.000Z" }),
        set({ exercise: "Bench Press (Barbell)", date: "2024-02-01T10:00:00.000Z" }),
      ],
      [],
      (name) => name === "Bench Press (Barbell)",
    );

    expect(plan.newExercises).toEqual(["Squat (Barbell)"]);
    expect(plan.firstDay).toBe("2024-01-17");
    expect(plan.lastDay).toBe("2024-03-05");
  });

  it("has no days when nothing is left to add", () => {
    const only = set({});
    const plan = planImport([only], [logged(only)], () => false);

    expect(plan.toAdd).toEqual([]);
    expect(plan.newExercises).toEqual([]);
    expect(plan.firstDay).toBeUndefined();
  });
});

import { describeSet } from "@app/features/modals/log/LogHistory";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { t } from "@app/i18n";

const set = (fields: Partial<WorkoutLogData>): WorkoutLogData => ({
  date: "2026-10-30T10:00:00.000Z",
  exercise: "Running",
  reps: 0,
  weight: 0,
  volume: 0,
  ...fields,
});

const cardio: ParameterDefinition[] = [
  { key: "duration", label: "Duration", type: "number", unit: "min", required: true },
  { key: "distance", label: "Distance", type: "number", unit: "km", required: false },
  { key: "heartRate", label: "Heart rate", type: "number", unit: "bpm", required: false },
];

describe("describeSet", () => {
  it("shows a weighted set as weight × reps", () => {
    expect(describeSet(set({ weight: 82.5, reps: 8 }), [], "kg")).toBe(
      t("logs.weightedSet", { weight: 82.5, unit: "kg", reps: 8 }),
    );
  });

  it("shows other fields with the units the form uses", () => {
    const run = set({ customFields: { duration: 56, distance: 5.5, heartRate: 147 } });

    expect(describeSet(run, cardio, "kg")).toBe("56 min · 5.5 km · 147 bpm");
  });

  it("names a field without a unit, and keeps fields the exercise no longer has", () => {
    const params: ParameterDefinition[] = [
      { key: "rpe", label: "RPE", type: "number", required: false },
    ];

    expect(describeSet(set({ customFields: { rpe: 8, band: "red" } }), params, "kg")).toBe(
      "RPE: 8 · band: red",
    );
  });

  it("falls back to the reps of a bodyweight set", () => {
    expect(describeSet(set({ reps: 12 }), [], "kg")).toBe("12");
  });
});

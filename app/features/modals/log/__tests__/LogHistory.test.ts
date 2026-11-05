/** @jest-environment jsdom */

import {
  describeLastTime,
  describeSet,
  describeTarget,
  LogHistory,
} from "@app/features/modals/log/LogHistory";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { localDay } from "@app/services/history/TrainingHistory";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { logRow } from "@app/types/__tests__/logRow";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { t } from "@app/i18n";

const set = (fields: Partial<WorkoutLogData>) =>
  logRow({
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

describe("describeLastTime", () => {
  it("lists every set of the previous training day after its date", () => {
    const sets = [
      set({ date: "2026-10-31T09:00:00.000Z", weight: 80, reps: 8 }),
      set({ date: "2026-10-31T09:05:00.000Z", weight: 80, reps: 7 }),
    ];

    expect(describeLastTime({ day: "2026-10-31", sets }, [], "kg")).toBe(
      t("sets.lastTime", {
        date: "31/10",
        sets: [
          t("logs.weightedSet", { weight: 80, unit: "kg", reps: 8 }),
          t("logs.weightedSet", { weight: 80, unit: "kg", reps: 7 }),
        ].join(" · "),
      }),
    );
  });
});

describe("LogHistory.render", () => {
  it("shows last time as the previous training day, not today's sets", async () => {
    const container = createObsidianContainer();
    const today = localDay(new Date());
    const rows = [
      set({ date: "2020-01-01T10:00:00", exercise: "Squat", weight: 90, reps: 8 }),
      set({ date: "2020-01-01T10:05:00", exercise: "Squat", weight: 95, reps: 6 }),
      set({ date: `${today}T10:00:00`, exercise: "Squat", weight: 120, reps: 3 }),
    ];
    const plugin = {
      settings: { weightUnit: "kg" },
      getWorkoutLogData: () => Promise.resolve(rows),
      getExerciseDefinitionService: () => ({
        getParametersForExercise: () => Promise.resolve([]),
      }),
    } as unknown as WorkoutPluginContext;

    await LogHistory.render(container, plugin, "Squat");

    expect(container.textContent).toContain(
      t("sets.lastTime", {
        date: "01/01",
        sets: [
          t("logs.weightedSet", { weight: 90, unit: "kg", reps: 8 }),
          t("logs.weightedSet", { weight: 95, unit: "kg", reps: 6 }),
        ].join(" · "),
      }),
    );
  });
});

describe("describeTarget", () => {
  it("shows weight and reps as one set", () => {
    expect(describeTarget(8, 100, "kg")).toBe(
      t("logs.weightedSet", { weight: 100, unit: "kg", reps: 8 }),
    );
  });

  it("shows reps alone", () => {
    expect(describeTarget(8, undefined, "kg")).toBe(t("session.targetReps", { reps: 8 }));
  });

  it("shows weight alone", () => {
    expect(describeTarget(undefined, 100, "lb")).toBe(
      t("session.targetWeight", { weight: 100, unit: "lb" }),
    );
  });

  it("is empty without a target", () => {
    expect(describeTarget(undefined, undefined, "kg")).toBeUndefined();
  });
});

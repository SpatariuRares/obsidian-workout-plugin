import {
  readSessionPlan,
  sessionProgress,
  type SessionStep,
} from "@app/features/session/business/sessionPlan";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

const step = (exercise: string, sets?: number): SessionStep => ({
  exercise,
  sets,
  rest: {},
});
const set = (exercise: string): WorkoutLogData => ({
  date: "2026-11-02T10:00:00.000Z",
  exercise,
  reps: 8,
  weight: 100,
  volume: 800,
});

const note = [
  "# Lower Body A",
  "",
  "```workout-session",
  "```",
  "",
  "## Squat",
  "",
  "```workout-log",
  "exercise: Squat",
  "sets: 4",
  "targetReps: 8",
  "targetWeight: 100",
  "```",
  "",
  "```workout-timer",
  "duration: 120",
  "```",
  "",
  "## Leg Press",
  "",
  "```workout-log",
  "exercise: Leg Press",
  "```",
  "",
  "## History",
  "",
  "```workout-log",
  "workout: Lower Body A",
  "```",
].join("\n");

describe("readSessionPlan", () => {
  it("makes one step per exercise table, in note order", () => {
    const steps = readSessionPlan(note);

    expect(steps.map((s) => s.exercise)).toEqual(["Squat", "Leg Press"]);
  });

  it("reads sets and targets from the exercise table", () => {
    const [squat, legPress] = readSessionPlan(note);

    expect(squat).toMatchObject({ sets: 4, targetReps: 8, targetWeight: 100 });
    expect(legPress.sets).toBeUndefined();
    expect(legPress.targetWeight).toBeUndefined();
  });

  it("takes the rest timer from the timer in the same section", () => {
    const [squat, legPress] = readSessionPlan(note);

    expect(squat.rest).toEqual({ duration: 120 });
    expect(legPress.rest).toEqual({});
  });

  it("skips tables with invalid parameters", () => {
    const steps = readSessionPlan(
      "```workout-log\nexercise: Squat\nsets: zero\n```",
    );

    expect(steps).toEqual([]);
  });

  it("makes a step of a workout-sets block too", () => {
    const steps = readSessionPlan(
      "## Bench\n\n```workout-sets\nexercise: Bench\nsets: 3\ntargetReps: 10\n```",
    );

    expect(steps).toEqual([
      { exercise: "Bench", sets: 3, targetReps: 10, targetWeight: undefined, rest: {} },
    ]);
  });

  it("joins a section's table and sets of one exercise into one step", () => {
    const steps = readSessionPlan(
      [
        "## Bench",
        "```workout-log",
        "exercise: Bench",
        "targetWeight: 80",
        "```",
        "```workout-sets",
        "exercise: bench",
        "sets: 4",
        "targetWeight: 90",
        "```",
        "## Again",
        "```workout-sets",
        "exercise: Bench",
        "```",
      ].join("\n"),
    );

    expect(steps).toMatchObject([
      { exercise: "Bench", sets: 4, targetWeight: 80 },
      { exercise: "Bench", sets: undefined },
    ]);
  });
});

describe("sessionProgress", () => {
  it("counts today's sets of each step, ignoring case and spacing", () => {
    const { done } = sessionProgress(
      [step("Squat", 4), step("Leg Press", 3)],
      [set("squat"), set("Leg  Press"), set("SQUAT")],
    );

    expect(done.map((sets) => sets.length)).toEqual([2, 1]);
  });

  it("is on the first step with fewer sets than planned", () => {
    const { current } = sessionProgress(
      [step("Squat", 2), step("Leg Press", 3)],
      [set("Squat"), set("Squat")],
    );

    expect(current).toBe(1);
  });

  it("stays on a step without planned sets until a later step has a set", () => {
    const steps = [step("Squat"), step("Leg Press")];

    expect(sessionProgress(steps, [set("Squat"), set("Squat")]).current).toBe(0);
    expect(sessionProgress(steps, [set("Squat"), set("Leg Press")]).current).toBe(1);
  });

  it("is finished (-1) when every step has its sets", () => {
    const { current } = sessionProgress(
      [step("Squat", 1), step("Leg Press", 1)],
      [set("Squat"), set("Leg Press")],
    );

    expect(current).toBe(-1);
  });

  it("fills a repeated exercise's first step before the next one", () => {
    const { done, current } = sessionProgress(
      [step("Squat", 2), step("Leg Press", 1), step("Squat", 2)],
      [set("Squat"), set("Squat"), set("Squat")],
    );

    expect(done.map((sets) => sets.length)).toEqual([2, 0, 1]);
    expect(current).toBe(1);
  });

  it("does not count warm-up sets as planned sets", () => {
    const { done, current } = sessionProgress(
      [step("Squat", 1), step("Leg Press", 1)],
      [{ ...set("Squat"), protocol: "warmup" }],
    );

    expect(done[0]).toHaveLength(0);
    expect(current).toBe(0);
  });

  it("starts on the first step when nothing is logged today", () => {
    expect(sessionProgress([step("Squat", 3)], []).current).toBe(0);
  });
});

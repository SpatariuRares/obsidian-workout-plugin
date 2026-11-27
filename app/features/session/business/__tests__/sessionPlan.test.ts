import {
  readSectionPlan,
  readSessionPlan,
  sessionProgress,
  stepOf,
  supersetProgress,
  type SessionStep,
} from "@app/features/session/business/sessionPlan";
import { logRow } from "@app/types/__tests__/logRow";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";

const step = (exercise: string, sets?: number): SessionStep => ({
  exercise,
  sets,
  rest: {},
});
const set = (exercise: string) =>
  logRow({ date: "2026-11-02T10:00:00.000Z", exercise, weight: 100 });

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

    expect(steps).toMatchObject([
      { exercise: "Bench", sets: 3, targetReps: 10, targetWeight: undefined, rest: {} },
    ]);
  });

  it("rests on a workout-sets block's own timer, before the section's", () => {
    const [bench, row] = readSessionPlan(
      [
        "## Bench",
        "```workout-sets",
        "exercise: Bench",
        "rest: 20",
        "timer.type: interval",
        "timer.rest: 10",
        "timer.rounds: 8",
        "```",
        "## Row",
        "```workout-timer",
        "duration: 90",
        "```",
        "```workout-sets",
        "exercise: Row",
        "```",
      ].join("\n"),
    );

    expect(bench.rest).toEqual({ type: "interval", duration: 20, rest: 10, rounds: 8 });
    expect(row.rest).toEqual({ duration: 90 });
  });

  it("gives no rest to a workout-sets block with rest: 0, even with a section timer", () => {
    const [bench, row] = readSessionPlan(
      [
        "## Bench",
        "```workout-timer",
        "duration: 90",
        "```",
        "```workout-sets",
        "exercise: Bench",
        "rest: 0",
        "```",
        "## Row",
        "```workout-log",
        "exercise: Row",
        "```",
        "```workout-timer",
        "duration: 60",
        "```",
        "```workout-sets",
        "exercise: Row",
        "rest: 0",
        "```",
      ].join("\n"),
    );

    expect(bench.rest).toBeUndefined();
    expect(bench.restBlock).toMatchObject({ type: "workout-sets" });
    expect(row.rest).toBeUndefined();
  });

  it("edits the rest in the step's workout-sets block, else in the section's timer", () => {
    const [squat, legPress] = readSessionPlan(note);
    expect(squat.restBlock).toMatchObject({
      type: "workout-timer",
      params: { duration: 120 },
      match: { body: "duration: 120", lines: { start: 14, end: 16 } },
    });
    expect(legPress.restBlock).toBeUndefined();

    const [bench] = readSessionPlan(
      "## Bench\n```workout-log\nexercise: Bench\n```\n```workout-timer\nduration: 60\n```\n```workout-sets\nexercise: Bench\n```",
    );
    expect(bench.restBlock).toMatchObject({ type: "workout-sets", params: { exercise: "Bench" } });
    expect(bench.rest).toEqual({ duration: 60 });
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

  it("carries warmups on workout-sets steps, including when joined with a table", () => {
    const steps = readSessionPlan(
      [
        "## Bench",
        "```workout-sets",
        "exercise: Bench",
        "sets: 4",
        "warmups: 2",
        "```",
        "## Squat",
        "```workout-log",
        "exercise: Squat",
        "```",
        "```workout-sets",
        "exercise: Squat",
        "sets: 3",
        "warmups: 1",
        "```",
      ].join("\n"),
    );

    expect(steps).toMatchObject([
      { exercise: "Bench", sets: 4, warmups: 2 },
      { exercise: "Squat", sets: 3, warmups: 1 },
    ]);
  });

  it("reads a multi-exercise workout-sets block as one composite superset step", () => {
    const steps = readSessionPlan(
      [
        "## Superset",
        "```workout-sets",
        "id: ss1",
        "exercises: [Bench Press, Barbell Row]",
        "sets: 3",
        "warmups: 1",
        "restBetween: 30",
        "rest: 90",
        "```",
      ].join("\n"),
    );

    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({
      exercise: "Bench Press + Barbell Row",
      exercises: ["Bench Press", "Barbell Row"],
      block: "ss1",
      sets: 3,
      warmups: 1,
      restBetween: 30,
      protocol: "superset",
      rest: { type: "countdown", duration: 90 },
      restBlock: { type: "workout-sets", params: { id: "ss1" } },
    });
  });

  it("handles superset round rest fallback (rest: 0 -> none, unset -> restBetween -> sectionRest) and stepOf matching", () => {
    const steps = readSessionPlan(
      [
        "## S1",
        "```workout-timer",
        "duration: 120",
        "```",
        "```workout-sets",
        "exercises: [A, B]",
        "restBetween: 25",
        "```",
        "## S2",
        "```workout-timer",
        "duration: 120",
        "```",
        "```workout-sets",
        "exercises: [C, D]",
        "restBetween: 25",
        "rest: 0",
        "protocol: drop_set",
        "```",
        "## S3",
        "```workout-timer",
        "duration: 75",
        "```",
        "```workout-sets",
        "exercises: [E, F]",
        "```",
      ].join("\n"),
    );

    expect(steps[0].rest).toEqual({ type: "countdown", duration: 25 });
    expect(steps[1].rest).toBeUndefined();
    expect(steps[1].protocol).toBe("drop_set");
    expect(steps[2].rest).toEqual({ duration: 75 });
    expect(stepOf(steps, "b")).toBe(steps[0]);
    expect(stepOf(steps, "F")).toBe(steps[2]);
  });
});

describe("readSectionPlan", () => {
  it("gives the steps of one section, which together make the note's plan", () => {
    const sections = readWorkoutNote(note).sections;

    expect(sections.map((section) => readSectionPlan(section).length)).toEqual([0, 1, 1, 0]);
    expect(sections.flatMap(readSectionPlan)).toEqual(readSessionPlan(note));
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

  it("gives a set logged from a step's block to that step", () => {
    const steps = [
      { ...step("Leg Extension", 3), block: "b1" },
      step("Hack squat", 3),
      { ...step("Leg Extension", 3), block: "b2" },
    ];
    const fromBlock = (block?: string) => ({ ...set("Leg Extension"), block });

    const { done, current } = sessionProgress(steps, [
      fromBlock("b2"),
      fromBlock("b2"),
      fromBlock(),
    ]);

    expect(done.map((sets) => sets.length)).toEqual([1, 0, 2]);
    expect(current).toBe(0);
  });

  it("tracks composite superset progress round by round by blockId or exercise name, skipping warm-ups", () => {
    const superset: SessionStep = {
      exercise: "Bench + Row",
      exercises: ["Bench", "Row"],
      block: "ss1",
      sets: 2,
      rest: {},
    };
    const steps = [superset, { ...step("Bench", 1), block: "b2" }];

    const r1Start = sessionProgress(steps, [{ ...set("Bench"), block: "ss1", protocol: "warmup" }]);
    expect(r1Start.current).toBe(0);
    expect(supersetProgress(superset, r1Start.done[0])).toMatchObject({
      counts: [0, 0],
      completedRounds: 0,
      round: 1,
      exerciseIndex: 0,
      exercise: "Bench",
    });

    const r1Mid = sessionProgress(steps, [{ ...set("Bench"), block: "ss1" }]);
    expect(r1Mid.current).toBe(0);
    expect(supersetProgress(superset, r1Mid.done[0])).toMatchObject({
      counts: [1, 0],
      completedRounds: 0,
      round: 1,
      exerciseIndex: 1,
      exercise: "Row",
    });

    const r2Start = sessionProgress(steps, [
      { ...set("Bench"), block: "ss1" },
      set("Row"), // block undefined matches superset's exercises
    ]);
    expect(r2Start.current).toBe(0);
    expect(supersetProgress(superset, r2Start.done[0])).toMatchObject({
      counts: [1, 1],
      completedRounds: 1,
      round: 2,
      exerciseIndex: 0,
      exercise: "Bench",
    });

    // Completing round 2 finishes the superset step and advances to b2;
    // a set tagged for b2 stays on b2 instead of leaking into ss1
    const afterSs = sessionProgress(steps, [
      { ...set("Bench"), block: "b2" },
      { ...set("Bench"), block: "ss1" },
      { ...set("Row"), block: "ss1" },
      { ...set("Bench"), block: "ss1" },
      { ...set("Row"), block: "ss1" },
    ]);
    expect(afterSs.done[0]).toHaveLength(4);
    expect(afterSs.done[1]).toHaveLength(1);
    expect(afterSs.current).toBe(-1);
  });

  it("stays on an unplanned superset step until a later step has a set", () => {
    const superset: SessionStep = {
      exercise: "Bench + Row",
      exercises: ["Bench", "Row"],
      rest: {},
    };
    const steps = [superset, step("Curl", 2)];

    expect(sessionProgress(steps, [set("Bench"), set("Row")]).current).toBe(0);
    expect(sessionProgress(steps, [set("Bench"), set("Curl")]).current).toBe(1);
  });
});

describe("a step's block", () => {
  it("is the id of the section's workout-sets block", () => {
    const steps = readSessionPlan(
      [
        "## Leg extension",
        "```workout-sets",
        "id: b1",
        "exercise: Leg Extension",
        "sets: 3",
        "```",
        "## Leg extension drop set",
        "```workout-log",
        "exercise: Leg Extension",
        "```",
        "```workout-sets",
        "id: b2",
        "exercise: Leg Extension",
        "```",
      ].join("\n"),
    );

    expect(steps.map((s) => s.block)).toEqual(["b1", "b2"]);
  });
});

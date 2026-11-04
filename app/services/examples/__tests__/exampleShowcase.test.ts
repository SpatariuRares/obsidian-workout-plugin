import {
  generateExerciseContent,
  generateFeatureShowcaseContent,
  generateHIITContent,
  generateWorkoutContent,
  generateYogaContent,
} from "@app/services/examples/exampleContentGenerator";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import { chartBlock } from "@app/features/charts/chartBlock";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { durationBlock } from "@app/features/duration/durationBlock";
import { sessionBlock } from "@app/features/session/sessionBlock";
import { setsBlock } from "@app/features/tables/setsBlock";
import { resolveTimer } from "@app/features/timer/business/resolveTimer";
import { gridProblems } from "@app/features/dashboard/layout/gridLayout";
import {
  gridColumns,
  gridPlacements,
  minColumnsOf,
} from "@app/features/dashboard/layout/dashboardGrid";
import { CHART_DATA_TYPE, TIMER_TYPE } from "@app/types/WorkoutConfigTypes";
import { protocolHelp } from "@app/services/protocols/ProtocolCatalog";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

const schemas = {
  "workout-chart": chartBlock,
  "workout-log": tableBlock,
  "workout-timer": timerBlock,
  "workout-dashboard": dashboardBlock,
  "workout-duration": durationBlock,
  "workout-session": sessionBlock,
  "workout-sets": setsBlock,
} as const;

const blocksOf = (content: string) =>
  readWorkoutNote(content).blocks.map((block) => {
    const { params, errors } =
      schemas[block.type as keyof typeof schemas].parse(block.body);
    return { type: block.type, params, errors };
  });

describe("example notes", () => {
  const notes = {
    showcase: generateFeatureShowcaseContent(),
    hiit: generateHIITContent(),
    workout: generateWorkoutContent(),
    yoga: generateYogaContent(),
    strength: generateExerciseContent("Bench Press", "strength", []),
  };

  it.each(Object.entries(notes))("%s: every block is valid", (_, content) => {
    for (const block of blocksOf(content)) expect(block.errors).toEqual([]);
  });

  it.each(Object.entries(notes))(
    "%s: every timer runs, presets included",
    (_, content) => {
      const timers = blocksOf(content).filter(
        (b) => b.type === "workout-timer",
      );
      for (const timer of timers) {
        const resolved = resolveTimer(timer.params, {
          timerPresets: {},
          defaultTimerPreset: null,
        });
        expect(resolved.error).toBeUndefined();
      }
    },
  );

  it("shows interval timers with work and rest, and the Tabata and EMOM presets", () => {
    const timers = blocksOf(notes.showcase)
      .filter((b) => b.type === "workout-timer")
      .map((b) => b.params as { type?: string; rest?: number; preset?: string });

    expect(
      timers.some((p) => p.type === TIMER_TYPE.INTERVAL && (p.rest ?? 0) > 0),
    ).toBe(true);
    expect(timers.map((p) => p.preset)).toEqual(
      expect.arrayContaining(["Tabata", "EMOM"]),
    );
  });

  it("charts the estimated 1RM in the showcase and on strength pages", () => {
    for (const content of [notes.showcase, notes.strength]) {
      const types = blocksOf(content)
        .filter((b) => b.type === "workout-chart")
        .map((b) => (b.params as { type?: string }).type);
      expect(types).toContain(CHART_DATA_TYPE.E1RM);
    }
  });

  it("has a chosen-widgets dashboard and a grid dashboard without layout problems", () => {
    const dashboards = blocksOf(notes.showcase)
      .filter((b) => b.type === "workout-dashboard")
      .map((b) => b.params as Parameters<typeof gridPlacements>[0]);

    expect(dashboards.some((p) => p.widgets?.includes("trainingCalendar"))).toBe(
      true,
    );
    const grid = dashboards.find((p) => p.layout === "grid");
    expect(grid).toBeDefined();
    const placements = gridPlacements(grid!);
    expect(placements.map((p) => p.id)).toContain("trainingCalendar");
    expect(
      gridProblems(placements, gridColumns(grid!, placements), minColumnsOf),
    ).toEqual([]);
  });

  it("lists the built-in protocols, warm-up included, with their explanation", () => {
    expect(notes.showcase).toContain(protocolHelp(WorkoutProtocol.WARMUP)!);
    expect(notes.showcase).toContain(protocolHelp(WorkoutProtocol.TWENTYONE)!);
  });

  it("covers the guided session and the import", () => {
    expect(notes.showcase).toContain("`workout-session`");
    expect(notes.showcase).toContain(t("examples.featureShowcase.importTitle"));
  });

  it("shows a workout-sets block with an exercise and planned sets", () => {
    const sets = blocksOf(notes.showcase).filter((b) => b.type === "workout-sets");
    expect(sets).toHaveLength(1);
    expect(sets[0].params).toMatchObject({ exercise: expect.any(String), sets: 4 });
  });

  it("keeps headings out of indented code in the workout note", () => {
    expect(notes.workout).not.toMatch(/^ {4}#/m);
  });
});

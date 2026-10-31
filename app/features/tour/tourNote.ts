import { normalizePath, TFile, type App } from "obsidian";
import { t } from "@app/i18n";
import { chartBlock } from "@app/features/charts/chartBlock";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import { CHART_DATA_TYPE, CHART_TYPE } from "@app/types/WorkoutConfigTypes";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import type { TourMode } from "@app/features/tour/tourSteps";

/** Longer than the 40 days of example history, so the example blocks show data. */
const LOOKBACK_DAYS = 90;
const TIMER_SECONDS = 90;
const TOUR_BLOCK_TYPES = new Set([
  "workout-log",
  "workout-chart",
  "workout-dashboard",
  "workout-timer",
]);

/**
 * Where the tour note lives: next to the examples, or at the vault root.
 * `copy` > 0 gives the free-name variant ("Guided tour 1.md").
 */
export function tourNotePath(mode: TourMode, copy = 0): string {
  const name = copy > 0 ? `${t("tour.noteName")} ${copy}` : t("tour.noteName");
  // eslint-disable-next-line i18next/no-literal-string -- file extension
  const file = `${name}.md`;
  return mode === "examples"
    ? normalizePath(`${examplePaths.base()}/${file}`)
    : normalizePath(file);
}

/**
 * One page with a table, a chart, a dashboard and a timer, in the order of the
 * tour. Examples: filtered to an exercise that has example data. Mine: no
 * filter (all the user's data, nearly empty at first).
 */
export function tourNoteContent(mode: TourMode): string {
  const exercise =
    mode === "examples"
      ? t("examples.exercises.squatMultiPower.name")
      : undefined;

  const table = tableBlock.serialize({ exercise, dateRange: LOOKBACK_DAYS });
  const chart = chartBlock.serialize({
    chartType: exercise ? CHART_TYPE.EXERCISE : CHART_TYPE.ALL,
    type: CHART_DATA_TYPE.VOLUME,
    exercise,
    dateRange: LOOKBACK_DAYS,
    showTrendLine: true,
  });
  const dashboard = dashboardBlock.serialize({ dateRange: LOOKBACK_DAYS });
  const timer = timerBlock.serialize({ duration: TIMER_SECONDS });

  return (
    [
      `# ${t("tour.noteName")}`,
      t("tour.noteIntro"),
      `## ${t("tour.noteTable")}`,
      table,
      `## ${t("tour.noteChart")}`,
      chart,
      `## ${t("tour.noteDashboard")}`,
      dashboard,
      `## ${t("tour.noteTimer")}`,
      timer,
    ].join("\n\n") + "\n"
  );
}

/** Ours = it still holds at least one of the blocks the tour points at. */
async function isTourNote(app: App, file: TFile): Promise<boolean> {
  const { blocks } = readWorkoutNote(await app.vault.read(file));
  return blocks.some((block) => TOUR_BLOCK_TYPES.has(block.type));
}

/**
 * The tour note: ours is reused, a missing one is created. A note of that name
 * that is not ours (no tour blocks) is never opened or touched: the tour gets
 * the next free name ("Guided tour 1", ...).
 */
export async function ensureTourNote(app: App, mode: TourMode): Promise<TFile> {
  for (let copy = 0; ; copy++) {
    const path = tourNotePath(mode, copy);
    const existing = app.vault.getAbstractFileByPath(path);
    if (!existing) return app.vault.create(path, tourNoteContent(mode));
    if (existing instanceof TFile && (await isTourNote(app, existing))) {
      return existing;
    }
  }
}

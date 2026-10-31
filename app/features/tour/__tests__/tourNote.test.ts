import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { t } from "@app/i18n";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import {
  ensureTourNote,
  tourNoteContent,
  tourNotePath,
} from "@app/features/tour/tourNote";

const kinds = (content: string) =>
  readWorkoutNote(content).blocks.map((b) => b.type);

describe("tour note", () => {
  it.each(["examples", "mine"] as const)(
    "%s: holds a table, chart, dashboard and timer block",
    (mode) => {
      expect(kinds(tourNoteContent(mode))).toEqual([
        "workout-log",
        "workout-chart",
        "workout-dashboard",
        "workout-timer",
      ]);
    },
  );

  it("examples: blocks point at an exercise with example data and look back past the example history", () => {
    const content = tourNoteContent("examples");
    expect(content).toContain(t("examples.exercises.squatMultiPower.name"));
    expect(content).toContain("dateRange: 90");
  });

  it("mine: blocks have no exercise filter", () => {
    expect(tourNoteContent("mine")).not.toContain("exercise:");
  });

  it("is created where the mode's data lives", () => {
    expect(tourNotePath("examples")).toBe(
      `${examplePaths.base()}/${t("tour.noteName")}.md`,
    );
    expect(tourNotePath("mine")).toBe(`${t("tour.noteName")}.md`);
  });

  it("creates the note only when missing and never overwrites it", async () => {
    const vault = new FakeVault();
    const first = await ensureTourNote(vault.app as never, "mine");
    expect(vault.content(tourNotePath("mine"))).toBe(tourNoteContent("mine"));
    await vault.app.vault.modify(first, "my edits");
    const again = await ensureTourNote(vault.app as never, "mine");
    expect(again.path).toBe(first.path);
    expect(vault.content(tourNotePath("mine"))).toBe("my edits");
  });
});

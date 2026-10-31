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
    const edited = `${tourNoteContent("mine")}my edits\n`;
    await vault.app.vault.modify(first, edited);
    const again = await ensureTourNote(vault.app as never, "mine");
    expect(again.path).toBe(first.path);
    expect(vault.content(tourNotePath("mine"))).toBe(edited);
  });

  it("never opens a foreign note of that name: takes the next free name", async () => {
    const vault = new FakeVault();
    await vault.app.vault.create(tourNotePath("mine"), "# My own note\n");
    const file = await ensureTourNote(vault.app as never, "mine");
    expect(file.path).toBe(tourNotePath("mine", 1));
    expect(vault.content(tourNotePath("mine"))).toBe("# My own note\n");
    expect(vault.content(tourNotePath("mine", 1))).toBe(
      tourNoteContent("mine"),
    );
  });

  it("skips every taken name and reuses a numbered note that is ours", async () => {
    const vault = new FakeVault();
    await vault.app.vault.create(tourNotePath("mine"), "foreign");
    await vault.app.vault.create(tourNotePath("mine", 1), "foreign too");
    const first = await ensureTourNote(vault.app as never, "mine");
    expect(first.path).toBe(tourNotePath("mine", 2));
    const again = await ensureTourNote(vault.app as never, "mine");
    expect(again.path).toBe(first.path);
  });

  it("still reuses our note after the user removed some blocks", async () => {
    const vault = new FakeVault();
    const first = await ensureTourNote(vault.app as never, "mine");
    const content = tourNoteContent("mine");
    await vault.app.vault.modify(
      first,
      content.slice(content.indexOf("```workout-timer")),
    );
    const again = await ensureTourNote(vault.app as never, "mine");
    expect(again.path).toBe(first.path);
  });
});

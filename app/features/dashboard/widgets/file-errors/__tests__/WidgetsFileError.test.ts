/** @jest-environment jsdom */
import type { App } from "obsidian";
import { WidgetsFileError } from "@app/features/dashboard/widgets/file-errors/WidgetsFileError";
import { MuscleTagService } from "@app/services/exercise/MuscleTagService";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";
import { ICONS } from "@app/constants/ui.constants";

/** data-icon of the icon in front of each error message, from the last errorsFor call */
let lastErrorIcons: (string | null)[] = [];

function note(tags: string[] | string): Record<string, unknown> {
  return { tags };
}

/** Exercise pages by name (or by path ending in .md under "exercises/") → frontmatter */
async function errorsFor(
  notes: Record<string, Record<string, unknown>>,
): Promise<Record<string, string[]>> {
  const vault = new FakeVault(
    Object.fromEntries(
      Object.entries(notes).map(([name, fm]) => [
        name.endsWith(".md")
          ? `exercises/${name}`
          : `exercises/${name}.md`,
        fm,
      ]),
    ),
  );
  const app = {
    ...vault.app,
    vault: { ...vault.app.vault, getAbstractFileByPath: () => null }, // no muscle-tags.csv: default tags
  } as unknown as App;
  const settings = {
    exerciseFolderPath: "exercises",
    csvLogFilePath: "workout_logs.csv",
  } as WorkoutChartsSettings;
  const library = new ExerciseLibrary(vault.app as never, settings);
  const muscleTags = new MuscleTagService(app, settings, library);
  const container = createObsidianContainer();

  await WidgetsFileError.render(container, {
    app,
    settings,
    saveSettings: async () => {},
    getMuscleTagService: () => muscleTags,
    getExerciseLibrary: () => library,
    triggerMuscleTagRefresh: () => {},
  });

  lastErrorIcons = [
    ...container.querySelectorAll(".workout-file-error-message"),
  ].map(
    (el) =>
      el.querySelector(".workout-icon")?.getAttribute("data-icon") ??
      null,
  );
  const result: Record<string, string[]> = {};
  container
    .querySelectorAll(".workout-file-error-item")
    .forEach((item) => {
      const name = item.querySelector(
        ".workout-file-error-name",
      )!.textContent!;
      result[name] = [
        ...item.querySelectorAll(".workout-file-error-message"),
      ].map((el) => el.textContent!);
    });
  return result;
}

describe("WidgetsFileError", () => {
  const noTags = t("dashboard.fileErrors.noTags");

  it("accepts muscle groups written with dashes or spaces, like the heat map does", async () => {
    expect(
      await errorsFor({
        "Incline press": note(["upper-chest", "compound"]),
        "Lateral raise": note(["Side Delts"]),
      }),
    ).toEqual({});
  });

  it("flags notes whose tags point to no muscle", async () => {
    expect(
      await errorsFor({
        "Leg curl": note(["compound"]),
        Squat: note(["quads"]),
      }),
    ).toEqual({ "Leg curl": [noTags] });
    expect(lastErrorIcons).toEqual([ICONS.STATUS.WARNING]);
  });

  it("flags notes with more than three muscle tags", async () => {
    const errors = await errorsFor({
      Burpee: note(["chest", "quads", "glutes", "shoulders"]),
    });

    expect(errors).toEqual({
      Burpee: [t("dashboard.fileErrors.tooManyTags", { count: 4 })],
    });
  });

  it("accepts tags written as a comma separated string", async () => {
    expect(await errorsFor({ Crunch: note("abs, core") })).toEqual(
      {},
    );
  });

  it("checks pages in subfolders of the exercise folder", async () => {
    expect(
      await errorsFor({ "QA/Leg curl.md": note(["compound"]) }),
    ).toEqual({
      "Leg curl": [noTags],
    });
  });

  it("flags pages that answer to the same exercise name", async () => {
    const errors = await errorsFor({
      Squat: note(["quads"]),
      "Front.md": { exercise_name: "Squat", tags: ["quads"] },
    });

    expect(errors).toEqual({
      Squat: [
        t("dashboard.fileErrors.sharedName", { pages: "Front" }),
      ],
      Front: [
        t("dashboard.fileErrors.sharedName", { pages: "Squat" }),
      ],
    });
  });
});

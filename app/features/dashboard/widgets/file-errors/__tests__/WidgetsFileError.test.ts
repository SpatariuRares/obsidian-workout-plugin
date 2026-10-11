/** @jest-environment jsdom */
import { App, TFile } from "obsidian";
import { WidgetsFileError } from "@app/features/dashboard/widgets/file-errors/WidgetsFileError";
import { MuscleTagService } from "@app/services/exercise/MuscleTagService";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

function note(tags: string[]): string {
  return ["---", "tags:", ...tags.map((tag) => `  - ${tag}`), "---", "# Notes"].join("\n");
}

async function errorsFor(notes: Record<string, string>): Promise<Record<string, string[]>> {
  const files = Object.keys(notes).map((name) =>
    Object.assign(new TFile(), {
      path: `exercises/${name}.md`,
      basename: name,
      extension: "md",
    }),
  );
  const app = {
    vault: {
      getMarkdownFiles: () => files,
      read: async (file: TFile) => notes[file.basename],
      getAbstractFileByPath: () => null, // no muscle-tags.csv: default tags
    },
  } as unknown as App;
  const settings = {
    exerciseFolderPath: "exercises",
    csvLogFilePath: "workout_logs.csv",
  } as WorkoutChartsSettings;
  const muscleTags = new MuscleTagService(app, settings);
  const container = createObsidianContainer();

  await WidgetsFileError.render(container, {
    app,
    settings,
    saveSettings: async () => {},
    getMuscleTagService: () => muscleTags,
    triggerMuscleTagRefresh: () => {},
  });

  const result: Record<string, string[]> = {};
  container.querySelectorAll(".workout-file-error-item").forEach((item) => {
    const name = item.querySelector(".workout-file-error-name")!.textContent!;
    result[name] = [...item.querySelectorAll(".workout-file-error-message")].map(
      (el) => el.textContent!,
    );
  });
  return result;
}

describe("WidgetsFileError", () => {
  const noTags = `${t("icons.status.warning")} ${t("dashboard.fileErrors.noTags")}`;

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
  });

  it("flags notes with more than three muscle tags", async () => {
    const errors = await errorsFor({
      Burpee: note(["chest", "quads", "glutes", "shoulders"]),
    });

    expect(errors).toEqual({
      Burpee: [
        `${t("icons.status.warning")} ${t("dashboard.fileErrors.tooManyTags", { count: 4 })}`,
      ],
    });
  });
});

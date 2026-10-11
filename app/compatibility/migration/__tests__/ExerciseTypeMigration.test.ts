import { Notice } from "obsidian";
import { ExerciseTypeMigration } from "@app/compatibility/migration/ExerciseTypeMigration";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { t } from "@app/i18n";

function migrate(notes: ConstructorParameters<typeof FakeVault>[0], folder = "Exercises") {
  const vault = new FakeVault(notes);
  const settings = { exerciseFolderPath: folder };
  const library = new ExerciseLibrary(vault.app as never, settings);
  const plugin = { app: vault.app, settings, getExerciseLibrary: () => library };
  return {
    vault,
    run: () => new ExerciseTypeMigration(plugin as never).migrateExerciseTypes(),
  };
}

describe("ExerciseTypeMigration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should mark pages without a type as strength, subfolders included", async () => {
    const { vault, run } = migrate({
      "Exercises/Squat.md": { tags: ["quads"] },
      "Exercises/QA/Crunch.md": {},
    });

    await run();

    expect(vault.frontmatter("Exercises/Squat.md")).toEqual({ tags: ["quads"], exercise_type: "strength" });
    expect(vault.frontmatter("Exercises/QA/Crunch.md")).toEqual({ exercise_type: "strength" });
    expect(Notice).toHaveBeenCalledWith(t("modal.notices.migrationComplete", { count: 2 }));
  });

  it("should leave pages that already say their type with `type:`", async () => {
    const { vault, run } = migrate({ "Exercises/Run.md": { type: "running" } });

    await run();

    expect(vault.frontmatter("Exercises/Run.md")).toEqual({ type: "running" });
    expect(Notice).toHaveBeenCalledWith(t("modal.notices.migrationNoUpdates"));
  });

  it("should leave pages that have an exercise_type and notes outside the folder", async () => {
    const { vault, run } = migrate({
      "Exercises/Plank.md": { exercise_type: "timed" },
      "Notes/Idea.md": {},
    });

    await run();

    expect(vault.frontmatter("Exercises/Plank.md")).toEqual({ exercise_type: "timed" });
    expect(vault.frontmatter("Notes/Idea.md")).toEqual({});
  });

  it("should tell the user when no exercise folder is set", async () => {
    const { run } = migrate({ "Squat.md": {} }, "");

    await run();

    expect(Notice).toHaveBeenCalledWith(t("messages.exerciseFolderNotSet"));
  });
});

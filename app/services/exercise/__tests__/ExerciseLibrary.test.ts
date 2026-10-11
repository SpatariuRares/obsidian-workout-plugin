import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";

const FOLDER = "Gym/Exercises";

function library(
  notes: ConstructorParameters<typeof FakeVault>[0],
  folder = FOLDER,
) {
  const vault = new FakeVault(notes);
  const settings = { exerciseFolderPath: folder };
  const lib = new ExerciseLibrary(vault.app as never, settings);
  lib.watch(() => {});
  return { vault, settings, lib };
}

const pathOf = (page: { file: { path: string } } | undefined) =>
  page?.file.path;

describe("ExerciseLibrary", () => {
  describe("which notes are exercise pages", () => {
    it("should include notes in the exercise folder and its subfolders", () => {
      const { lib } = library({
        "Gym/Exercises/Squat.md": {},
        "Gym/Exercises/QA/QA Crunch.md": {},
        "Gym/Workouts/Leg Day.md": {},
        "Gym/Exercises2/Other.md": {},
      });

      expect(lib.pages().map(pathOf)).toEqual([
        "Gym/Exercises/QA/QA Crunch.md",
        "Gym/Exercises/Squat.md",
      ]);
    });

    it("should have no pages when no exercise folder is set", () => {
      const { lib } = library({ "Squat.md": {} }, "");

      expect(lib.pages()).toEqual([]);
      expect(lib.find("Squat")).toBeUndefined();
    });

    it("should accept a folder setting with a trailing slash", () => {
      const { lib } = library({ "Gym/Exercises/Squat.md": {} }, "Gym/Exercises/");

      expect(pathOf(lib.find("Squat"))).toBe("Gym/Exercises/Squat.md");
    });
  });

  describe("find", () => {
    it("should find a page by its file name, ignoring case and spacing", () => {
      const { lib } = library({ "Gym/Exercises/Bench Press.md": {} });

      expect(pathOf(lib.find("  bench   press "))).toBe(
        "Gym/Exercises/Bench Press.md",
      );
    });

    it("should find a page by exercise_name or nome_esercizio", () => {
      const { lib } = library({
        "Gym/Exercises/Bench Press.md": { nome_esercizio: "Panca piana" },
        "Gym/Exercises/row.md": { exercise_name: "Barbell Row" },
      });

      expect(pathOf(lib.find("panca piana"))).toBe("Gym/Exercises/Bench Press.md");
      expect(pathOf(lib.find("Bench Press"))).toBe("Gym/Exercises/Bench Press.md");
      expect(pathOf(lib.find("Barbell Row"))).toBe("Gym/Exercises/row.md");
    });

    it("should never match a name partially", () => {
      const { lib } = library({ "Gym/Exercises/Squat Multi Power.md": {} });

      expect(lib.find("Squat")).toBeUndefined();
      expect(lib.find("Squat Multi Power Smith")).toBeUndefined();
    });

    it("should prefer the page whose file name matches over a frontmatter name", () => {
      const { lib } = library({
        "Gym/Exercises/A/Front.md": { exercise_name: "Squat" },
        "Gym/Exercises/Z/Squat.md": {},
      });

      expect(pathOf(lib.find("Squat"))).toBe("Gym/Exercises/Z/Squat.md");
    });

    it("should prefer the first path when two pages match the same way", () => {
      const { lib } = library({
        "Gym/Exercises/B/Squat.md": {},
        "Gym/Exercises/A/Squat.md": {},
      });

      expect(pathOf(lib.find("Squat"))).toBe("Gym/Exercises/A/Squat.md");
    });
  });

  describe("what a page says", () => {
    it("should read the type from exercise_type, then type", () => {
      const { lib } = library({
        "Gym/Exercises/Run.md": { exercise_type: "distance", type: "cardio" },
        "Gym/Exercises/Bike.md": { type: "cardio" },
        "Gym/Exercises/Squat.md": {},
      });

      expect(lib.find("Run")?.type).toBe("distance");
      expect(lib.find("Bike")?.type).toBe("cardio");
      expect(lib.find("Squat")?.type).toBeUndefined();
    });

    it("should read tags written as a list or as a comma separated string", () => {
      const { lib } = library({
        "Gym/Exercises/Crunch.md": { tags: "abs, core" },
        "Gym/Exercises/Run.md": { tags: ["#hamstrings", "calves"] },
      });

      expect(lib.find("Crunch")?.tags).toEqual(["abs", "core"]);
      expect(lib.find("Run")?.tags).toEqual(["hamstrings", "calves"]);
    });

    it.each([
      [["Chest", "#back", " "], ["Chest", "back"]],
      ["chest", ["chest"]],
      ["chest, back #core", ["chest", "back", "core"]],
      ["[chest, back]", ["chest", "back"]],
      [undefined, []],
      [42, []],
    ])("should read tags %p as %p", (tags, expected) => {
      const { lib } = library({ "Gym/Exercises/Squat.md": { tags } });

      expect(lib.find("Squat")?.tags).toEqual(expected);
    });

    it("should list every name a page answers to", () => {
      const { lib } = library({
        "Gym/Exercises/Bench Press.md": { exercise_name: "Bench press (barbell)" },
      });

      expect(lib.find("Bench Press")?.names).toEqual([
        "Bench Press",
        "Bench press (barbell)",
      ]);
    });

    it("should not repeat a frontmatter name equal to the file name", () => {
      const { lib } = library({
        "Gym/Exercises/Squat.md": { exercise_name: "squat" },
      });

      expect(lib.find("Squat")?.names).toEqual(["Squat"]);
    });
  });

  describe("declared parameters", () => {
    it("should read the parameters a page declares", () => {
      const { lib } = library({
        "Gym/Exercises/Treadmill.md": {
          parameters: [
            { key: "incline", label: "Incline", type: "number", unit: "%", min: 0, max: 15, default: 1 },
            { key: "notes2", type: "string", required: true },
          ],
        },
      });

      expect(lib.find("Treadmill")?.parameters).toEqual([
        { key: "incline", label: "Incline", type: "number", required: false, unit: "%", min: 0, max: 15, default: 1 },
        { key: "notes2", label: "notes2", type: "string", required: true },
      ]);
    });

    it("should skip parameters that are not objects, have no key or use a reserved key", () => {
      const { lib } = library({
        "Gym/Exercises/Treadmill.md": {
          parameters: ["incline", { label: "No key" }, { key: "  " }, { key: "weight" }, { key: "speed" }],
        },
      });

      expect(lib.find("Treadmill")?.parameters.map((p) => p.key)).toEqual(["speed"]);
    });

    it("should keep the shared duration field a custom exercise declares", () => {
      const { lib } = library({
        "Gym/Exercises/Jump Rope.md": {
          exercise_type: "custom",
          parameters: [{ key: "rounds" }, { key: "duration", unit: "sec" }],
        },
      });

      expect(lib.find("Jump Rope")?.parameters.map((p) => p.key)).toEqual(["rounds", "duration"]);
    });

    it("should have no parameters when none are declared", () => {
      const { lib } = library({ "Gym/Exercises/Squat.md": {} });

      expect(lib.find("Squat")?.parameters).toEqual([]);
    });
  });

  describe("pagesSharingAName", () => {
    it("should list the other pages that answer to one of the page's names", () => {
      const { lib } = library({
        "Gym/Exercises/Squat.md": {},
        "Gym/Exercises/Front.md": { exercise_name: "squat" },
        "Gym/Exercises/Bench.md": {},
      });

      expect(lib.pagesSharingAName(lib.find("Squat")!).map(pathOf)).toEqual([
        "Gym/Exercises/Front.md",
      ]);
      expect(lib.pagesSharingAName(lib.find("Bench")!)).toEqual([]);
    });
  });

  describe("staying up to date", () => {
    it("should see a page created after the first lookup", () => {
      const { vault, lib } = library({});
      expect(lib.find("Squat")).toBeUndefined();

      vault.write("Gym/Exercises/Squat.md", { tags: ["glutes"] });

      expect(lib.find("Squat")?.tags).toEqual(["glutes"]);
    });

    it("should see frontmatter changes", () => {
      const { vault, lib } = library({ "Gym/Exercises/Squat.md": { tags: ["glutes"] } });
      lib.find("Squat");

      vault.write("Gym/Exercises/Squat.md", { tags: ["quads"] });

      expect(lib.find("Squat")?.tags).toEqual(["quads"]);
    });

    it("should follow renames and deletions", () => {
      const { vault, lib } = library({
        "Gym/Exercises/Squat.md": {},
        "Gym/Exercises/Bench.md": {},
      });
      lib.pages();

      vault.rename("Gym/Exercises/Squat.md", "Gym/Exercises/Back Squat.md");
      vault.remove("Gym/Exercises/Bench.md");

      expect(lib.find("Squat")).toBeUndefined();
      expect(pathOf(lib.find("Back Squat"))).toBe("Gym/Exercises/Back Squat.md");
      expect(lib.find("Bench")).toBeUndefined();
    });

    it("should follow a change of the exercise folder setting", () => {
      const { settings, lib } = library({
        "Gym/Exercises/Squat.md": {},
        "Other/Bench.md": {},
      });
      lib.pages();

      settings.exerciseFolderPath = "Other";

      expect(lib.pages().map(pathOf)).toEqual(["Other/Bench.md"]);
    });
  });
});

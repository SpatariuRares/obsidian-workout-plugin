import { findNameMismatches } from "@app/features/modals/exercise/logic/findNameMismatches";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";

function mismatches(
  notes: ConstructorParameters<typeof FakeVault>[0],
  logNames: string[],
  folder = "Exercises",
) {
  const vault = new FakeVault(notes);
  const library = new ExerciseLibrary(vault.app as never, { exerciseFolderPath: folder });
  return findNameMismatches(library.pages(), logNames);
}

describe("findNameMismatches", () => {
  it("should skip pages whose name is in the log, ignoring case and spacing", () => {
    expect(mismatches({ "Exercises/Bench Press.md": {} }, ["bench  press"])).toEqual([]);
  });

  it("should accept any of a page's names", () => {
    expect(
      mismatches(
        { "Exercises/Bench Press.md": { exercise_name: "Bench press (barbell)" } },
        ["Bench Press"],
      ),
    ).toEqual([]);
  });

  it("should check pages in subfolders and suggest the closest log name", () => {
    const [m] = mismatches({ "Exercises/QA/Benchpress.md": {} }, ["Bench Press", "Squat"]);

    expect(m.fileName).toBe("Benchpress");
    expect(m.canonicalName).toBe("Benchpress");
    expect(m.closestMatch).toBe("Bench Press");
    expect(m.score).toBeGreaterThan(0);
  });

  it("should compare the frontmatter name when the page has one", () => {
    const [m] = mismatches(
      { "Exercises/bp.md": { nome_esercizio: "Panca" } },
      ["Panca piana"],
    );

    expect(m.canonicalName).toBe("Panca");
  });

  it("should list the worst matches first", () => {
    const result = mismatches(
      { "Exercises/Benchpress.md": {}, "Exercises/Zzz.md": {} },
      ["Bench Press"],
    );

    expect(result.map((m) => m.fileName)).toEqual(["Zzz", "Benchpress"]);
  });

  it("should check nothing outside the exercise folder or without one", () => {
    expect(mismatches({ "Notes/Benchpress.md": {} }, ["Bench Press"])).toEqual([]);
    expect(mismatches({ "Benchpress.md": {} }, ["Bench Press"], "")).toEqual([]);
  });
});

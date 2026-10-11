import { ExerciseDefinitionService } from "@app/services/exercise/ExerciseDefinitionService";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { getExerciseTypeById } from "@app/constants/exerciseTypes.constants";
import type { ExerciseDefinition } from "@app/types/ExerciseTypes";

const FOLDER = "Exercises";

function service(notes: ConstructorParameters<typeof FakeVault>[0] = {}) {
  const vault = new FakeVault(notes);
  const settings = { exerciseFolderPath: FOLDER };
  const library = new ExerciseLibrary(vault.app as never, settings);
  library.watch(() => {});
  const definitions = new ExerciseDefinitionService(
    vault.app as never,
    settings as never,
    library,
  );
  return { vault, definitions };
}

const strengthKeys = () =>
  getExerciseTypeById("strength")!.parameters.map((p) => p.key);
const cardioKeys = () =>
  getExerciseTypeById("cardio")!.parameters.map((p) => p.key);

describe("ExerciseDefinitionService", () => {
  describe("getExerciseDefinition", () => {
    it("should be undefined for an exercise without a page", async () => {
      const { definitions } = service();

      expect(await definitions.getExerciseDefinition("Unknown")).toBeUndefined();
    });

    it("should read type, muscle tags and parameters from the page", async () => {
      const { definitions } = service({
        "Exercises/Treadmill.md": {
          exercise_type: "Cardio",
          tags: "legs, #cardio",
          parameters: [{ key: "incline", label: "Incline", type: "number" }],
        },
      });

      expect(await definitions.getExerciseDefinition("treadmill")).toEqual({
        name: "Treadmill",
        typeId: "cardio",
        muscleGroups: ["legs", "cardio"],
        customParameters: [
          { key: "incline", label: "Incline", type: "number", required: false },
        ],
      });
    });

    it("should accept a type alias and default to strength", async () => {
      const { definitions } = service({
        "Exercises/Run.md": { type: "running" },
        "Exercises/Squat.md": {},
      });

      expect((await definitions.getExerciseDefinition("Run"))?.typeId).toBe("distance");
      expect((await definitions.getExerciseDefinition("Squat"))?.typeId).toBe("strength");
    });

    it("should find pages in subfolders", async () => {
      const { definitions } = service({
        "Exercises/QA/QA Easy Run.md": { exercise_type: "distance" },
      });

      expect((await definitions.getExerciseDefinition("QA Easy Run"))?.typeId).toBe("distance");
    });

    it("should find a page by its file name when exercise_name is set", async () => {
      const { definitions } = service({
        "Exercises/Bench Press.md": { exercise_name: "Bench press (barbell)", exercise_type: "strength" },
      });

      const definition = await definitions.getExerciseDefinition("Bench Press");
      expect(definition?.name).toBe("Bench press (barbell)");
    });

    it("should see a page created a moment ago", async () => {
      const { vault, definitions } = service();
      await definitions.getExerciseDefinition("Plank");

      vault.write("Exercises/Plank.md", { exercise_type: "timed" });

      expect((await definitions.getExerciseDefinition("Plank"))?.typeId).toBe("timed");
    });
  });

  describe("getAllExerciseDefinitions", () => {
    it("should list a definition for every page", async () => {
      const { definitions } = service({
        "Exercises/Squat.md": {},
        "Exercises/QA/Run.md": { exercise_type: "distance" },
        "Notes/Other.md": {},
      });

      const all = await definitions.getAllExerciseDefinitions();
      expect(all.map((d) => d.name).sort()).toEqual(["Run", "Squat"]);
    });
  });

  describe("getParametersForExercise", () => {
    it("should give strength parameters for an exercise without a page", async () => {
      const { definitions } = service();

      const params = await definitions.getParametersForExercise("Unknown");
      expect(params.map((p) => p.key)).toEqual(strengthKeys());
    });

    it("should add the page's parameters to its type's", async () => {
      const { definitions } = service({
        "Exercises/Treadmill.md": {
          exercise_type: "cardio",
          parameters: [{ key: "incline", type: "number" }],
        },
      });

      const params = await definitions.getParametersForExercise("Treadmill");
      expect(params.map((p) => p.key)).toEqual([...cardioKeys(), "incline"]);
    });

    it("should fall back to strength for an unknown type", async () => {
      const { definitions } = service({ "Exercises/Odd.md": { exercise_type: "juggling" } });

      const params = await definitions.getParametersForExercise("Odd");
      expect(params.map((p) => p.key)).toEqual(strengthKeys());
    });
  });

  describe("getExerciseType", () => {
    it("should give the page's type, or strength without a page", async () => {
      const { definitions } = service({ "Exercises/Run.md": { exercise_type: "distance" } });

      expect((await definitions.getExerciseType("Run")).id).toBe("distance");
      expect((await definitions.getExerciseType("Unknown")).id).toBe("strength");
    });
  });

  describe("saveExerciseDefinition", () => {
    const definition = (over: Partial<ExerciseDefinition> = {}): ExerciseDefinition => ({
      name: "Squat",
      typeId: "timed",
      ...over,
    });

    it("should write type, parameters and tags into the existing page", async () => {
      const { vault, definitions } = service({
        "Exercises/Squat.md": { exercise_type: "strength", parameters: [{ key: "old" }], notes: "keep me" },
      });

      await definitions.saveExerciseDefinition(
        definition({ muscleGroups: ["quads"], customParameters: [{ key: "tempo", label: "Tempo", type: "string", required: false }] }),
      );

      expect(vault.frontmatter("Exercises/Squat.md")).toEqual({
        exercise_type: "timed",
        parameters: [{ key: "tempo", label: "Tempo", type: "string", required: false }],
        tags: ["quads"],
        notes: "keep me",
      });
    });

    it("should remove the parameters when the definition has none", async () => {
      const { vault, definitions } = service({ "Exercises/Squat.md": { parameters: [{ key: "old" }] } });

      await definitions.saveExerciseDefinition(definition());

      expect(vault.frontmatter("Exercises/Squat.md")).toEqual({ exercise_type: "timed" });
    });

    it("should update a page in a subfolder instead of creating a duplicate", async () => {
      const { vault, definitions } = service({ "Exercises/Legs/Squat.md": {} });

      await definitions.saveExerciseDefinition(definition());

      expect(vault.paths()).toEqual(["Exercises/Legs/Squat.md"]);
      expect(vault.frontmatter("Exercises/Legs/Squat.md")).toEqual({ exercise_type: "timed" });
    });

    it("should update the page named by its frontmatter instead of creating a duplicate", async () => {
      const { vault, definitions } = service({
        "Exercises/Back squat.md": { exercise_name: "Squat" },
      });

      await definitions.saveExerciseDefinition(definition());

      expect(vault.paths()).toEqual(["Exercises/Back squat.md"]);
      expect(vault.frontmatter("Exercises/Back squat.md")?.exercise_type).toBe("timed");
    });

    it("should create a page in the exercise folder when there is none", async () => {
      const { vault, definitions } = service();

      await definitions.saveExerciseDefinition(
        definition({
          name: "Leg/Press: 45",
          typeId: "cardio",
          muscleGroups: ["legs"],
          customParameters: [
            { key: "incline", label: "Incline", type: "number", unit: "%", required: false, default: 1, min: 0, max: 15 },
          ],
        }),
      );

      expect(vault.paths()).toEqual(["Exercises/Leg_Press_ 45.md"]);
      const content = vault.content("Exercises/Leg_Press_ 45.md")!;
      expect(content).toContain("exercise_name: Leg/Press: 45");
      expect(content).toContain("exercise_type: cardio");
      expect(content).toContain("  - legs");
      expect(content).toContain("  - key: incline");
      expect(content).toContain('    unit: "%"');
      expect(content).toContain("    default: 1");
      expect(content).toContain("    min: 0");
      expect(content).toContain("    max: 15");
    });
  });
});

import * as YAML from "yaml";
import {
  exercisePageContent,
  exercisePageTemplate,
  fillExercisePageTemplate,
} from "@app/services/exercise/ExercisePageContent";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import { tableBlock } from "@app/features/tables/tableBlock";
import { chartBlock } from "@app/features/charts/chartBlock";
import { getExerciseTypeById } from "@app/constants/exerciseTypes.constants";

const FOLDER = "Exercises";
const NAME = "Squat: pause #2";

/** The page's frontmatter, read by a real YAML parser */
function frontmatterOf(content: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(content);
  if (!match) throw new Error("No frontmatter");
  return YAML.parse(match[1]) as Record<string, unknown>;
}

/** The note written at `path`, as Obsidian would read it, in a library */
function libraryWith(path: string, content: string) {
  const vault = new FakeVault();
  vault.write(path, frontmatterOf(content));
  const lib = new ExerciseLibrary(vault.app as never, {
    exerciseFolderPath: FOLDER,
  });
  lib.watch(() => {});
  return lib;
}

function blockParams(content: string, type: string) {
  const schema = type === "workout-log" ? tableBlock : chartBlock;
  return readWorkoutNote(content)
    .blocks.filter((block) => block.type === type)
    .map((block) => schema.parse(block.body).params);
}

describe("exercisePageContent", () => {
  it("should write a page the library finds, whatever the name holds", () => {
    const content = exercisePageContent({ name: NAME, typeId: "strength" });

    const page = libraryWith(`${FOLDER}/Squat_ pause #2.md`, content).find(NAME);

    expect(page?.file.path).toBe(`${FOLDER}/Squat_ pause #2.md`);
    expect(page?.type).toBe("strength");
  });

  it("should write tags and custom parameters as YAML", () => {
    const content = exercisePageContent({
      name: NAME,
      typeId: "custom",
      muscleGroups: ["legs", "glutes"],
      customParameters: [
        { key: "incline", label: "Incline: %", type: "number", unit: "%", required: false, min: 0, max: 15 },
      ],
    });

    expect(frontmatterOf(content)).toEqual({
      exercise_name: NAME,
      exercise_type: "custom",
      tags: ["legs", "glutes"],
      parameters: [
        { key: "incline", label: "Incline: %", type: "number", unit: "%", required: false, min: 0, max: 15 },
      ],
    });
  });

  it("should give the page a log and a chart of the exercise", () => {
    const content = exercisePageContent({ name: NAME, typeId: "strength" });

    expect(blockParams(content, "workout-log")).toEqual([
      expect.objectContaining({ exercise: NAME }),
    ]);
    expect(blockParams(content, "workout-chart")).toEqual([
      expect.objectContaining({ exercise: NAME }),
    ]);
    expect(content).toContain(`# ${NAME}`);
  });

  it("should put a given body under the frontmatter", () => {
    const content = exercisePageContent(
      { name: NAME, typeId: "strength" },
      "# My page\n",
    );

    expect(content).toMatch(/\n---\n\n# My page\n$/);
  });
});

describe("fillExercisePageTemplate", () => {
  it("should fill the blank template so the library finds the page", () => {
    const content = fillExercisePageTemplate(exercisePageTemplate(), {
      name: NAME,
      typeId: "strength",
      muscleGroups: ["legs"],
    });

    const page = libraryWith(`${FOLDER}/page.md`, content).find(NAME);

    expect(page?.tags).toEqual(["legs"]);
    expect(blockParams(content, "workout-log")).toEqual([
      expect.objectContaining({ exercise: NAME }),
    ]);
    expect(blockParams(content, "workout-chart")).toEqual([
      expect.objectContaining({ exercise: NAME }),
    ]);
  });

  it("should keep the template's own fields and text, and its other blocks", () => {
    const template = [
      "---",
      "exercise_name:",
      "equipment: barbell",
      "---",
      "",
      "Type:",
      "",
      "```workout-log",
      "exercise: name",
      "limit: 5",
      "```",
      "",
      "```workout-chart",
      "exercise: Bench Press",
      "```",
      "",
    ].join("\n");

    const content = fillExercisePageTemplate(
      template,
      { name: NAME, typeId: "strength" },
    );

    expect(frontmatterOf(content)).toEqual({
      exercise_name: NAME,
      equipment: "barbell",
      exercise_type: "strength",
    });
    expect(content).toContain(
      `\nType: ${getExerciseTypeById("strength")?.name}\n`,
    );
    expect(blockParams(content, "workout-log")).toEqual([
      expect.objectContaining({ exercise: NAME, limit: 5 }),
    ]);
    expect(blockParams(content, "workout-chart")).toEqual([
      expect.objectContaining({ exercise: "Bench Press" }),
    ]);
  });

  it("should keep a CRLF template's line endings on the blocks it names", () => {
    const template = [
      "# Notes",
      "",
      "```workout-log",
      "exercise: name",
      "limit: 5",
      "```",
      "",
    ].join("\r\n");

    const content = fillExercisePageTemplate(template, {
      name: NAME,
      typeId: "strength",
    });

    const block = content
      .slice(content.indexOf("```workout-log"))
      .split("\n")
      .slice(0, 4);
    expect(block.every((line) => line.endsWith("\r"))).toBe(true);
    expect(content).not.toContain("\r\r");
    expect(blockParams(content, "workout-log")).toEqual([
      expect.objectContaining({ exercise: NAME, limit: 5 }),
    ]);
  });

  it("should add the frontmatter to a template that has none", () => {
    const content = fillExercisePageTemplate("# Notes\n", {
      name: NAME,
      typeId: "strength",
    });

    expect(frontmatterOf(content)).toEqual({
      exercise_name: NAME,
      exercise_type: "strength",
    });
    expect(content.endsWith("# Notes\n")).toBe(true);
  });
});

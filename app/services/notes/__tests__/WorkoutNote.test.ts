import { readWorkoutNote } from "@app/services/notes/WorkoutNote";

const note = (...lines: string[]) => lines.join("\n");

describe("readWorkoutNote", () => {
  it("should find the plugin's code blocks with their body and line range", () => {
    const { blocks } = readWorkoutNote(
      note(
        "# Leg day",
        "```workout-log",
        "exercise: Squat",
        "limit: 5",
        "```",
        "text",
        "```workout-timer",
        "preset: rest",
        "```",
      ),
    );

    expect(blocks).toEqual([
      { type: "workout-log", body: "exercise: Squat\nlimit: 5", start: 1, end: 4 },
      { type: "workout-timer", body: "preset: rest", start: 6, end: 8 },
    ]);
  });

  it("should ignore other code blocks and blocks shown inside a longer fence", () => {
    const { blocks } = readWorkoutNote(
      note(
        "```js",
        "const x = 1;",
        "```",
        "````markdown",
        "```workout-log",
        "exercise: Example",
        "```",
        "````",
        "```workout-timer",
        "duration: 60",
        "```",
      ),
    );

    expect(blocks.map((b) => [b.type, b.body])).toEqual([["workout-timer", "duration: 60"]]);
  });

  it("should read blocks with Windows line endings and an indented fence", () => {
    const { blocks } = readWorkoutNote("  ```workout-log\r\nexercise: Squat\r\n  ```\r\n");

    expect(blocks).toEqual([{ type: "workout-log", body: "exercise: Squat", start: 0, end: 2 }]);
  });

  it("should skip a block that is never closed", () => {
    expect(readWorkoutNote("```workout-log\nexercise: Squat").blocks).toEqual([]);
  });

  it("should split the note into level-2 sections with their prose and blocks", () => {
    const { sections } = readWorkoutNote(
      note(
        "Intro",
        "## Squat",
        "### 4 serie x 8 reps",
        "```workout-log",
        "id: x55",
        "exercise: Squat",
        "```",
        "## Plank",
        "```workout-timer",
        "duration: 60",
        "```",
      ),
    );

    expect(sections.map((s) => s.heading)).toEqual([null, "Squat", "Plank"]);
    expect(sections[1].text).toBe("### 4 serie x 8 reps");
    expect(sections[1].blocks.map((b) => b.type)).toEqual(["workout-log"]);
    expect(sections[2].blocks.map((b) => b.body)).toEqual(["duration: 60"]);
  });
});

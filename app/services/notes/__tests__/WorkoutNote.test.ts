import { readWorkoutNote, replaceBlockLines } from "@app/services/notes/WorkoutNote";

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
      { type: "workout-log", body: "exercise: Squat\nlimit: 5", start: 1, end: 4, quote: "" },
      { type: "workout-timer", body: "preset: rest", start: 6, end: 8, quote: "" },
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

    expect(blocks).toEqual([{ type: "workout-log", body: "exercise: Squat", start: 0, end: 2, quote: "" }]);
  });

  it("should read blocks inside a callout, nested ones included, without their markers", () => {
    const { blocks } = readWorkoutNote(
      note(
        "> [!note] Today",
        "> ```workout-dashboard",
        "> title: Week",
        ">",
        "> ```",
        "> > ```workout-timer",
        "> > duration: 60",
        "> > ```",
      ),
    );

    expect(blocks).toEqual([
      { type: "workout-dashboard", body: "title: Week\n", start: 1, end: 4, quote: "> " },
      { type: "workout-timer", body: "duration: 60", start: 5, end: 7, quote: "> > " },
    ]);
  });

  it("should not close a block with a fence at another quote depth, nor outside its callout", () => {
    const { blocks } = readWorkoutNote(
      note(
        "```workout-log",
        "> ```",
        "exercise: Squat",
        "```",
        "> ```workout-timer",
        "duration: 60",
        "```",
      ),
    );

    expect(blocks.map((b) => [b.type, b.body])).toEqual([["workout-log", "> ```\nexercise: Squat"]]);
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

describe("replaceBlockLines", () => {
  it("should replace the lines between a block's fences", () => {
    const content = note("# Day", "```workout-log", "exercise: Squat", "limit: 5", "```", "after");
    const [block] = readWorkoutNote(content).blocks;

    expect(replaceBlockLines(content, block, ["exercise: Lunge"])).toBe(
      note("# Day", "```workout-log", "exercise: Lunge", "```", "after"),
    );
  });

  it("should put the callout's quote and the note's CRLF back on every line", () => {
    const content = "> [!note]\r\n> ```workout-timer\r\n> preset: rest\r\n> ```\r\n";
    const [block] = readWorkoutNote(content).blocks;

    expect(replaceBlockLines(content, block, ["id: abc", "preset: rest"])).toBe(
      "> [!note]\r\n> ```workout-timer\r\n> id: abc\r\n> preset: rest\r\n> ```\r\n",
    );
  });

  it("should insert before the body without touching it when count is 0", () => {
    const content = note("> ```workout-log", ">exercise: Squat", "> ```");
    const [block] = readWorkoutNote(content).blocks;

    expect(replaceBlockLines(content, block, ["id: abc"], { count: 0 })).toBe(
      note("> ```workout-log", "> id: abc", ">exercise: Squat", "> ```"),
    );
  });

  it("should empty the block when given no lines", () => {
    const content = note("```workout-log", "exercise: Squat", "```");
    const [block] = readWorkoutNote(content).blocks;

    expect(replaceBlockLines(content, block, [])).toBe(note("```workout-log", "```"));
  });
});

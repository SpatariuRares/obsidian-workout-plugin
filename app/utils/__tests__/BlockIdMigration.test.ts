import { addMissingBlockIds } from "@app/utils/BlockIdMigration";

let next = 0;
jest.mock("@app/utils/IdUtils", () => ({
  generateCodeBlockId: () => `id${++next}`,
}));

const note = (...lines: string[]) => lines.join("\n");

describe("addMissingBlockIds", () => {
  beforeEach(() => {
    next = 0;
  });

  it("should give an id to log and timer blocks that have none", () => {
    const result = addMissingBlockIds(
      note(
        "```workout-log",
        "exercise: Squat",
        "```",
        "```workout-timer",
        "id: keep",
        "```",
        "```workout-chart",
        "exercise: Squat",
        "```",
        "```workout-timer",
        "duration: 90",
        "```",
      ),
    );

    expect(result.added).toBe(2);
    expect(result.content).toBe(
      note(
        "```workout-log",
        "id: id1",
        "exercise: Squat",
        "```",
        "```workout-timer",
        "id: keep",
        "```",
        "```workout-chart",
        "exercise: Squat",
        "```",
        "```workout-timer",
        "id: id2",
        "duration: 90",
        "```",
      ),
    );
  });

  it("should leave examples shown inside a longer fence alone", () => {
    const content = note("````markdown", "```workout-log", "exercise: Squat", "```", "````");

    expect(addMissingBlockIds(content)).toEqual({ content, modified: false, added: 0 });
  });

  it("should leave an unclosed block alone", () => {
    const content = note("```workout-log", "exercise: Squat");

    expect(addMissingBlockIds(content).modified).toBe(false);
  });
});

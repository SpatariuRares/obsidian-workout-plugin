import { App } from "obsidian";
import { CodeBlockEditorService } from "@app/services/editor/CodeBlockEditorService";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";

function note(...lines: string[]): string {
  return lines.join("\n");
}

function setup(content: string, hasActiveNote = true) {
  const state = { content };
  const app = {
    workspace: {
      getActiveViewOfType: () =>
        hasActiveNote ? { file: { path: "Leg day.md" } } : null,
    },
    vault: {
      process: jest.fn(async (_file: unknown, fn: (c: string) => string) => {
        state.content = fn(state.content);
      }),
    },
  } as unknown as App;
  return { app, state };
}

const NOTE = note(
  "# Leg day",
  "```workout-timer",
  "id: t1",
  "duration: 90",
  "```",
  "```workout-log",
  "id: a1",
  "exercise: Squat",
  "# heavy week",
  "sortBy: volume",
  "columns: [date, reps]",
  "showProtocol: false",
  "```",
  "```workout-log",
  "id: b2",
  "exercise: Bench",
  "```",
);

describe("CodeBlockEditorService.patchCodeBlock", () => {
  it("edits the block with that id and keeps every other line of the note", async () => {
    const { app, state } = setup(NOTE);

    const ok = await CodeBlockEditorService.patchCodeBlock(
      app,
      tableBlock,
      { id: "a1" },
      { limit: 20, exercise: "Front squat" },
    );

    expect(ok).toBe(true);
    expect(state.content).toBe(
      NOTE.replace("exercise: Squat", "exercise: Front squat").replace(
        "showProtocol: false\n```",
        "showProtocol: false\nlimit: 20\n```",
      ),
    );
  });

  it("finds a block without an id by its exercise", async () => {
    const { app, state } = setup(
      note("```workout-log", "exercise: Bench Press", "targetWeight: 100", "```"),
    );

    await CodeBlockEditorService.patchCodeBlock(
      app,
      tableBlock,
      { exercise: "Bench Press" },
      { targetWeight: 105 },
    );

    expect(state.content).toBe(
      note("```workout-log", "exercise: Bench Press", "targetWeight: 105", "```"),
    );
  });

  it("only looks at blocks of the schema's type", async () => {
    const { app, state } = setup(NOTE);

    await CodeBlockEditorService.patchCodeBlock(
      app,
      timerBlock,
      { id: "t1" },
      { autoStart: true },
    );

    expect(state.content).toContain("duration: 90\nautoStart: true\n```");
  });

  it("returns false and leaves the note alone when nothing matches", async () => {
    const { app, state } = setup(NOTE);

    expect(
      await CodeBlockEditorService.patchCodeBlock(
        app,
        tableBlock,
        { id: "zz" },
        { limit: 5 },
      ),
    ).toBe(false);
    expect(state.content).toBe(NOTE);
  });

  it("returns false without an active note or when the write fails", async () => {
    const noNote = setup(NOTE, false);
    expect(
      await CodeBlockEditorService.patchCodeBlock(
        noNote.app,
        tableBlock,
        { id: "a1" },
        { limit: 5 },
      ),
    ).toBe(false);

    const failing = setup(NOTE);
    (failing.app.vault.process as jest.Mock).mockRejectedValue(
      new Error("locked"),
    );
    expect(
      await CodeBlockEditorService.patchCodeBlock(
        failing.app,
        tableBlock,
        { id: "a1" },
        { limit: 5 },
      ),
    ).toBe(false);
  });

  it("edits the real block, not an example of it shown in a longer fence", async () => {
    const example = note("````markdown", "```workout-log", "exercise: Squat", "```", "````");
    const real = note("```workout-log", "exercise: Squat", "```");
    const { app, state } = setup(note(example, real));

    await CodeBlockEditorService.patchCodeBlock(app, tableBlock, { exercise: "Squat" }, { limit: 5 });

    expect(state.content).toBe(
      note(example, "```workout-log", "exercise: Squat", "limit: 5", "```"),
    );
  });

  it("keeps Windows line endings", async () => {
    const { app, state } = setup("```workout-log\r\nid: a1\r\n```\r\n");

    await CodeBlockEditorService.patchCodeBlock(app, tableBlock, { id: "a1" }, { limit: 5 });

    expect(state.content).toBe("```workout-log\r\nid: a1\r\nlimit: 5\r\n```\r\n");
  });

  it("returns false when a block is never closed", async () => {
    const { app } = setup(note("```workout-log", "id: a1"));

    expect(
      await CodeBlockEditorService.patchCodeBlock(
        app,
        tableBlock,
        { id: "a1" },
        { limit: 5 },
      ),
    ).toBe(false);
  });
});

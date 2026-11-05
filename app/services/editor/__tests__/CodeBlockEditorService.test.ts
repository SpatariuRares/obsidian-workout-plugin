import { App } from "obsidian";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { CodeBlockEditorService } from "@app/services/editor/CodeBlockEditorService";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";

function note(...lines: string[]): string {
  return lines.join("\n");
}

const PATH = "Leg day.md";

/** A vault holding one note, at PATH; `state.content` is its text */
function setup(content: string) {
  const vault = new FakeVault();
  void vault.app.vault.create(PATH, content);
  const app = vault.app as unknown as App;
  const state = {
    get content() {
      return vault.content(PATH);
    },
  };
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
        PATH,
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
        PATH,
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
        PATH,
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
        PATH,
        { id: "zz" },
        { limit: 5 },
      ),
    ).toBe(false);
    expect(state.content).toBe(NOTE);
  });

  it("returns false for a note that doesn't exist or when the write fails", async () => {
    const noNote = setup(NOTE);
    expect(
      await CodeBlockEditorService.patchCodeBlock(
        noNote.app,
        tableBlock,
        "Gone.md",
        { id: "a1" },
        { limit: 5 },
      ),
    ).toBe(false);

    const failing = setup(NOTE);
    jest
      .spyOn(failing.app.vault, "process")
      .mockRejectedValue(new Error("locked"));
    expect(
      await CodeBlockEditorService.patchCodeBlock(
        failing.app,
        tableBlock,
        PATH,
        { id: "a1" },
        { limit: 5 },
      ),
    ).toBe(false);
  });

  it("edits the real block, not an example of it shown in a longer fence", async () => {
    const example = note("````markdown", "```workout-log", "exercise: Squat", "```", "````");
    const real = note("```workout-log", "exercise: Squat", "```");
    const { app, state } = setup(note(example, real));

    await CodeBlockEditorService.patchCodeBlock(
        app,
        tableBlock,
        PATH, { exercise: "Squat" }, { limit: 5 });

    expect(state.content).toBe(
      note(example, "```workout-log", "exercise: Squat", "limit: 5", "```"),
    );
  });

  it("keeps Windows line endings", async () => {
    const { app, state } = setup("```workout-log\r\nid: a1\r\n```\r\n");

    await CodeBlockEditorService.patchCodeBlock(
        app,
        tableBlock,
        PATH, { id: "a1" }, { limit: 5 });

    expect(state.content).toBe("```workout-log\r\nid: a1\r\nlimit: 5\r\n```\r\n");
  });

  it("returns false when a block is never closed", async () => {
    const { app } = setup(note("```workout-log", "id: a1"));

    expect(
      await CodeBlockEditorService.patchCodeBlock(
        app,
        tableBlock,
        PATH,
        { id: "a1" },
        { limit: 5 },
      ),
    ).toBe(false);
  });

  it("edits a block inside a callout and keeps the callout's markers", async () => {
    const { app, state } = setup(
      note("> [!note] Today", "> ```workout-log", "> id: a1", "> ```", "after"),
    );

    const ok = await CodeBlockEditorService.patchCodeBlock(
      app,
      tableBlock,
      PATH,
      { id: "a1" },
      { limit: 5 },
    );

    expect(ok).toBe(true);
    expect(state.content).toBe(
      note("> [!note] Today", "> ```workout-log", "> id: a1", "> limit: 5", "> ```", "after"),
    );
  });

  it("finds a block without an id by its body, within the lines it was rendered in", async () => {
    const callout = note("> [!note]", "> ```workout-timer", "> duration: 60", "> ```");
    const { app, state } = setup(note("# Day", callout, "", "```workout-timer", "duration: 60", "```"));

    await CodeBlockEditorService.patchCodeBlock(
      app,
      timerBlock,
      PATH,
      { body: "duration: 60", lines: { start: 1, end: 4 } },
      { sound: false },
    );

    expect(state.content).toBe(
      note(
        "# Day",
        "> [!note]",
        "> ```workout-timer",
        "> duration: 60",
        "> sound: false",
        "> ```",
        "",
        "```workout-timer",
        "duration: 60",
        "```",
      ),
    );
  });

  it("finds a block without an id by its body alone when Obsidian gives no lines", async () => {
    const { app, state } = setup(
      note("> [!note]", "> ```workout-timer", "> duration: 60", "> ```", "```workout-timer", "duration: 90", "```"),
    );

    await CodeBlockEditorService.patchCodeBlock(app, timerBlock, PATH, { body: "duration: 60\n" }, { sound: false });

    expect(state.content).toBe(
      note("> [!note]", "> ```workout-timer", "> duration: 60", "> sound: false", "> ```", "```workout-timer", "duration: 90", "```"),
    );
  });

  it("refuses to guess when more than one block has that body", async () => {
    const content = note("> ```workout-timer", "> duration: 60", "> ```", "```workout-timer", "duration: 60", "```");
    const { app, state } = setup(content);

    expect(
      await CodeBlockEditorService.patchCodeBlock(
        app,
        timerBlock,
        PATH,
        { body: "duration: 60" },
        { sound: false },
      ),
    ).toBe(false);
    expect(state.content).toBe(content);
  });
});

import { App, MarkdownView, TFile, TFolder } from "obsidian";
import { PathUtils } from "@app/utils/PathUtils";

describe("PathUtils.toWikiLink", () => {
  it("builds a wiki link from a note path", () => {
    expect(PathUtils.toWikiLink("Workouts/Leg Day.md")).toBe(
      "[[Leg Day]]",
    );
  });

  it("handles notes at the vault root", () => {
    expect(PathUtils.toWikiLink("Leg Day.md")).toBe("[[Leg Day]]");
  });

  it("returns an empty string for an empty path", () => {
    expect(PathUtils.toWikiLink("")).toBe("");
  });
});

describe("PathUtils.noteName", () => {
  it("is the file name without folder and .md", () => {
    expect(PathUtils.noteName("Workouts/Leg Day.md")).toBe("Leg Day");
    expect(PathUtils.noteName("")).toBe("");
  });
});

describe("PathUtils.linkTarget", () => {
  it("is the note path without .md, as a wiki link names it", () => {
    expect(PathUtils.linkTarget("Workouts/Leg Day.md")).toBe("Workouts/Leg Day");
    expect(PathUtils.linkTarget("Leg Day")).toBe("Leg Day");
  });
});

function fakeApp(
  existing: Record<string, unknown> = {},
  activeFile?: { path: string } | null,
) {
  const createFolder = jest.fn(async (path: string) => {
    existing[path] = new TFolder();
  });
  const app = {
    vault: {
      getAbstractFileByPath: (path: string) => existing[path] ?? null,
      createFolder,
    },
    workspace: {
      getActiveViewOfType: (type: unknown) =>
        type === MarkdownView && activeFile !== undefined
          ? { file: activeFile }
          : null,
    },
  } as unknown as App;
  return { app, createFolder };
}

describe("PathUtils.ensureFolder", () => {
  it("creates a missing folder", async () => {
    const { app, createFolder } = fakeApp();
    await PathUtils.ensureFolder(app, "Workouts/Logs");
    expect(createFolder).toHaveBeenCalledWith("Workouts/Logs");
  });

  it("leaves an existing folder alone", async () => {
    const { app, createFolder } = fakeApp({ Workouts: new TFolder() });
    await PathUtils.ensureFolder(app, "Workouts");
    expect(createFolder).not.toHaveBeenCalled();
  });

  it("throws when a file holds the path", async () => {
    const { app } = fakeApp({ Workouts: new TFile() });
    await expect(PathUtils.ensureFolder(app, "Workouts")).rejects.toThrow(
      "Workouts",
    );
  });
});

describe("PathUtils.ensureParentFolder", () => {
  it("creates the folder a file goes in", async () => {
    const { app, createFolder } = fakeApp();
    await PathUtils.ensureParentFolder(app, "Workouts/log.csv");
    expect(createFolder).toHaveBeenCalledWith("Workouts");
  });

  it("does nothing for a file at the vault root", async () => {
    const { app, createFolder } = fakeApp();
    await PathUtils.ensureParentFolder(app, "log.csv");
    expect(createFolder).not.toHaveBeenCalled();
  });
});

describe("PathUtils.activeNoteLink", () => {
  it("links the note open in the active editor", () => {
    const { app } = fakeApp({}, { path: "Workouts/Leg Day.md" });
    expect(PathUtils.activeNoteLink(app)).toBe("[[Leg Day]]");
  });

  it("is empty without an active note", () => {
    expect(PathUtils.activeNoteLink(fakeApp().app)).toBe("");
    expect(PathUtils.activeNoteLink(fakeApp({}, null).app)).toBe("");
  });
});

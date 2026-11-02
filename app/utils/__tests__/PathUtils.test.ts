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

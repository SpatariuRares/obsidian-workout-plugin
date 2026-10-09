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

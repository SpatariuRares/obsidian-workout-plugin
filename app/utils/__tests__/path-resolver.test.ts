import { resolveWorkoutPath } from "@app/utils/path-resolver";

/**
 * Stand-in for Obsidian's link resolution: a linkpath (no extension) matches
 * the note whose path is that linkpath, or ends with "/" + linkpath.
 */
function linkResolver(paths: string[]) {
  return {
    getFirstLinkpathDest: (linkpath: string, _source: string) => {
      const match = paths.find(
        (p) => p === `${linkpath}.md` || p.endsWith(`/${linkpath}.md`),
      );
      return match ? { path: match } : null;
    },
  };
}

const vault = linkResolver([
  "QA/QA Session.md",
  "Workouts/Sub/Leg Day.md",
  "Workouts/Push Day.md",
]);

describe("resolveWorkoutPath", () => {
  it("should find a path written from the vault root", () => {
    expect(
      resolveWorkoutPath("QA/QA Session.md", "QA/06 Durata.md", vault),
    ).toBe("QA/QA Session.md");
  });

  it("should find a note by its name, like a link", () => {
    expect(resolveWorkoutPath("QA Session", "Notes/Plan.md", vault)).toBe(
      "QA/QA Session.md",
    );
  });

  it("should find a path relative to the note's folder", () => {
    expect(
      resolveWorkoutPath("Sub/Leg Day", "Workouts/Week 1.md", vault),
    ).toBe("Workouts/Sub/Leg Day.md");
  });

  it("should accept a leading slash", () => {
    expect(
      resolveWorkoutPath("/Workouts/Push Day.md", "QA/06 Durata.md", vault),
    ).toBe("Workouts/Push Day.md");
  });

  it("should fall back to the note's folder when nothing matches", () => {
    expect(resolveWorkoutPath("Missing", "QA/06 Durata.md", vault)).toBe(
      "QA/Missing.md",
    );
  });
});

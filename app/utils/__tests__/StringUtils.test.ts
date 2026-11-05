import { StringUtils } from "@app/utils/StringUtils";

describe("StringUtils", () => {
  describe("getMatchScore", () => {
    it("should return 100 for exact match", () => {
      expect(StringUtils.getMatchScore("Squat", "Squat")).toBe(100);
      expect(StringUtils.getMatchScore("squat", "SQUAT")).toBe(100);
    });

    it("should return 90 for starts with match", () => {
      expect(
        StringUtils.getMatchScore("Squat", "Squat Barbell"),
      ).toBe(90);
      expect(StringUtils.getMatchScore("Bench Press", "Bench")).toBe(
        90,
      );
    });

    it("should return 80 for ends with match", () => {
      expect(
        StringUtils.getMatchScore("Barbell Squat", "Squat"),
      ).toBe(80);
      expect(StringUtils.getMatchScore("Press", "Bench Press")).toBe(
        80,
      );
    });

    it("should return 70 when all words from one string are in the other", () => {
      expect(
        StringUtils.getMatchScore("Hip Thrust", "Hip Thrust Barbell"),
      ).toBe(90); // startsWith match
      expect(
        StringUtils.getMatchScore("Barbell Hip Thrust", "Hip Thrust"),
      ).toBe(80); // endsWith match
    });

    it("should return 60 for partial word matches", () => {
      expect(
        StringUtils.getMatchScore("Squat Jump", "Squat Barbell"),
      ).toBe(60);
    });

    it("should return 50 for substring match", () => {
      expect(StringUtils.getMatchScore("Lat", "Lateral Raise")).toBe(
        90,
      ); // startsWith match
      expect(StringUtils.getMatchScore("Lateral Raise", "Lat")).toBe(
        90,
      ); // startsWith match
    });

    it("should return 0 for no match", () => {
      expect(StringUtils.getMatchScore("Squat", "Bench Press")).toBe(
        0,
      );
    });

    it("should handle empty strings", () => {
      expect(StringUtils.getMatchScore("", "")).toBe(100);
      expect(StringUtils.getMatchScore("", "Squat")).toBe(90); // empty string startsWith match
    });

    it("should trim whitespace", () => {
      expect(StringUtils.getMatchScore("  Squat  ", "Squat")).toBe(
        100,
      );
    });
  });

  describe("levenshteinDistance", () => {
    it("should return 0 for identical strings", () => {
      expect(StringUtils.levenshteinDistance("chest", "chest")).toBe(
        0,
      );
    });

    it("should return 0 for identical strings with different case", () => {
      expect(StringUtils.levenshteinDistance("Chest", "CHEST")).toBe(
        0,
      );
      expect(
        StringUtils.levenshteinDistance("BICEPS", "biceps"),
      ).toBe(0);
    });

    it("should calculate correct distance for kitten vs sitting (3)", () => {
      // kitten -> sitten (substitution) -> sittin (substitution) -> sitting (insertion)
      expect(
        StringUtils.levenshteinDistance("kitten", "sitting"),
      ).toBe(3);
    });

    it("should return length of non-empty string when other is empty", () => {
      expect(StringUtils.levenshteinDistance("", "test")).toBe(4);
      expect(StringUtils.levenshteinDistance("hello", "")).toBe(5);
    });

    it("should return 0 for two empty strings", () => {
      expect(StringUtils.levenshteinDistance("", "")).toBe(0);
    });

    it("should calculate distance 1 for single character difference", () => {
      expect(StringUtils.levenshteinDistance("cat", "bat")).toBe(1);
      expect(StringUtils.levenshteinDistance("cat", "cut")).toBe(1);
      expect(StringUtils.levenshteinDistance("cat", "cart")).toBe(1);
      expect(StringUtils.levenshteinDistance("cat", "at")).toBe(1);
    });

    it("should calculate correct distance for longer strings", () => {
      // "flaw" -> "lawn" requires 2 edits
      expect(StringUtils.levenshteinDistance("flaw", "lawn")).toBe(2);
    });

    it("should handle muscle tag examples", () => {
      // "petto" (Italian for chest) vs "chest" - 4 edits
      // Optimal: insert c, p->h, e stays, t->s, t stays, delete o
      expect(StringUtils.levenshteinDistance("petto", "chest")).toBe(
        4,
      );

      // Similar tags
      expect(StringUtils.levenshteinDistance("bicep", "biceps")).toBe(
        1,
      );
      expect(StringUtils.levenshteinDistance("quad", "quads")).toBe(
        1,
      );
      expect(StringUtils.levenshteinDistance("glute", "glutes")).toBe(
        1,
      );
    });

    it("should be case insensitive for mixed case inputs", () => {
      const dist1 = StringUtils.levenshteinDistance("Chest", "chest");
      const dist2 = StringUtils.levenshteinDistance("CHEST", "chest");
      const dist3 = StringUtils.levenshteinDistance("ChEsT", "cHeSt");

      expect(dist1).toBe(0);
      expect(dist2).toBe(0);
      expect(dist3).toBe(0);
    });

    it("should handle unicode characters", () => {
      expect(StringUtils.levenshteinDistance("cafe", "cafe")).toBe(0);
      expect(StringUtils.levenshteinDistance("naiv", "naive")).toBe(
        1,
      );
    });

    it("should calculate distance correctly for completely different strings", () => {
      expect(StringUtils.levenshteinDistance("abc", "xyz")).toBe(3);
    });
  });

  describe("findSimilar", () => {
    const muscleGroups = ["chest", "back", "biceps", "quads", "rear_delts"];

    it("gives each match with its distance, closest first, then alphabetically", () => {
      expect(
        StringUtils.findSimilar("rat", ["mat", "rat", "cat", "rabbit"], { max: 1 }),
      ).toEqual([
        { value: "rat", distance: 0 },
        { value: "cat", distance: 1 },
        { value: "mat", distance: 1 },
      ]);
    });

    it("ignores case", () => {
      expect(
        StringUtils.findSimilar("CHEST", ["chest", "Chest", "chests"], { max: 0 }),
      ).toEqual([
        { value: "chest", distance: 0 },
        { value: "Chest", distance: 0 },
      ]);
    });

    it("leaves out values closer than min (min: 1 skips the needle itself)", () => {
      expect(
        StringUtils.findSimilar("quad", ["quad", "quads", "squad"], { max: 1, min: 1 }),
      ).toEqual([
        { value: "quads", distance: 1 },
        { value: "squad", distance: 1 },
      ]);
    });

    it("finds typos and nothing beyond max", () => {
      expect(StringUtils.findSimilar("bicep", muscleGroups, { max: 1 })).toEqual([
        { value: "biceps", distance: 1 },
      ]);
      expect(StringUtils.findSimilar("xyz", muscleGroups, { max: 1 })).toEqual([]);
      expect(StringUtils.findSimilar("chest", [], { max: 2 })).toEqual([]);
    });
  });

  describe("humanize", () => {
    it("turns snake_case into Title Case", () => {
      expect(StringUtils.humanize("rear_delts")).toBe("Rear Delts");
      expect(StringUtils.humanize("lower_back_upper")).toBe("Lower Back Upper");
      expect(StringUtils.humanize("chest")).toBe("Chest");
      expect(StringUtils.humanize("")).toBe("");
    });
  });
});

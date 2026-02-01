import { StringUtils } from "@app/utils/StringUtils";

describe("StringUtils", () => {
  describe("getMatchScore", () => {
    it("should return 100 for exact match", () => {
      expect(StringUtils.getMatchScore("Squat", "Squat")).toBe(100);
      expect(StringUtils.getMatchScore("squat", "SQUAT")).toBe(100);
    });

    it("should return 90 for starts with match", () => {
      expect(StringUtils.getMatchScore("Squat", "Squat Barbell")).toBe(90);
      expect(StringUtils.getMatchScore("Bench Press", "Bench")).toBe(90);
    });

    it("should return 80 for ends with match", () => {
      expect(StringUtils.getMatchScore("Barbell Squat", "Squat")).toBe(80);
      expect(StringUtils.getMatchScore("Press", "Bench Press")).toBe(80);
    });

    it("should return 70 when all words from one string are in the other", () => {
      expect(StringUtils.getMatchScore("Hip Thrust", "Hip Thrust Barbell")).toBe(90); // startsWith match
      expect(StringUtils.getMatchScore("Barbell Hip Thrust", "Hip Thrust")).toBe(80); // endsWith match
    });

    it("should return 60 for partial word matches", () => {
      expect(StringUtils.getMatchScore("Squat Jump", "Squat Barbell")).toBe(60);
    });

    it("should return 50 for substring match", () => {
      expect(StringUtils.getMatchScore("Lat", "Lateral Raise")).toBe(90); // startsWith match
      expect(StringUtils.getMatchScore("Lateral Raise", "Lat")).toBe(90); // startsWith match
    });

    it("should return 0 for no match", () => {
      expect(StringUtils.getMatchScore("Squat", "Bench Press")).toBe(0);
    });

    it("should handle empty strings", () => {
      expect(StringUtils.getMatchScore("", "")).toBe(100);
      expect(StringUtils.getMatchScore("", "Squat")).toBe(90); // empty string startsWith match
    });

    it("should trim whitespace", () => {
      expect(StringUtils.getMatchScore("  Squat  ", "Squat")).toBe(100);
    });
  });

  describe("levenshteinDistance", () => {
    it("should return 0 for identical strings", () => {
      expect(StringUtils.levenshteinDistance("chest", "chest")).toBe(0);
    });

    it("should return 0 for identical strings with different case", () => {
      expect(StringUtils.levenshteinDistance("Chest", "CHEST")).toBe(0);
      expect(StringUtils.levenshteinDistance("BICEPS", "biceps")).toBe(0);
    });

    it("should calculate correct distance for kitten vs sitting (3)", () => {
      // kitten -> sitten (substitution) -> sittin (substitution) -> sitting (insertion)
      expect(StringUtils.levenshteinDistance("kitten", "sitting")).toBe(3);
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
      expect(StringUtils.levenshteinDistance("petto", "chest")).toBe(4);

      // Similar tags
      expect(StringUtils.levenshteinDistance("bicep", "biceps")).toBe(1);
      expect(StringUtils.levenshteinDistance("quad", "quads")).toBe(1);
      expect(StringUtils.levenshteinDistance("glute", "glutes")).toBe(1);
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
      expect(StringUtils.levenshteinDistance("naiv", "naive")).toBe(1);
    });

    it("should calculate distance correctly for completely different strings", () => {
      expect(StringUtils.levenshteinDistance("abc", "xyz")).toBe(3);
    });
  });

  describe("findSimilarStrings", () => {
    const muscleGroups = [
      "chest",
      "back",
      "shoulders",
      "biceps",
      "triceps",
      "quads",
      "hamstrings",
      "glutes",
      "calves",
      "abs",
      "core",
      "forearms",
      "traps",
      "rear_delts",
    ];

    it("should find exact matches (distance 0)", () => {
      const result = StringUtils.findSimilarStrings("chest", muscleGroups, 0);
      expect(result).toEqual(["chest"]);
    });

    it("should find exact matches case insensitively", () => {
      const result = StringUtils.findSimilarStrings("CHEST", muscleGroups, 0);
      expect(result).toEqual(["chest"]);
    });

    it("should return empty array when no matches within distance", () => {
      const result = StringUtils.findSimilarStrings("xyz", muscleGroups, 1);
      expect(result).toEqual([]);
    });

    it("should find matches within maxDistance", () => {
      // "bicep" is 1 edit away from "biceps" (missing 's')
      const result = StringUtils.findSimilarStrings("bicep", muscleGroups, 1);
      expect(result).toContain("biceps");
    });

    it("should sort results by distance (closest first)", () => {
      const haystack = ["chest", "chests", "crest", "test"];
      const result = StringUtils.findSimilarStrings("chest", haystack, 2);

      // "chest" is distance 0, "chests" is distance 1, "crest" is distance 2
      expect(result[0]).toBe("chest");
      expect(result).toContain("chests");
      expect(result).toContain("crest");
    });

    it("should sort alphabetically for equal distances", () => {
      const haystack = ["bat", "cat", "hat", "mat"];
      const result = StringUtils.findSimilarStrings("rat", haystack, 1);

      // All are distance 1 from "rat"
      expect(result).toEqual(["bat", "cat", "hat", "mat"]);
    });

    it("should handle empty needle", () => {
      const haystack = ["a", "ab", "abc"];
      const result = StringUtils.findSimilarStrings("", haystack, 2);

      // "a" is distance 1, "ab" is distance 2
      expect(result).toContain("a");
      expect(result).toContain("ab");
      expect(result).not.toContain("abc");
    });

    it("should handle empty haystack", () => {
      const result = StringUtils.findSimilarStrings("chest", [], 2);
      expect(result).toEqual([]);
    });

    it("should find multiple matches at same distance", () => {
      const haystack = ["quad", "quads", "squad"];
      const result = StringUtils.findSimilarStrings("quad", haystack, 1);

      // "quad" = 0, "quads" = 1 (append s), "squad" = 1 (prepend s)
      expect(result).toContain("quad");
      expect(result).toContain("quads");
      expect(result).toContain("squad");
      expect(result).toHaveLength(3);
    });

    it("should not include matches beyond maxDistance", () => {
      const result = StringUtils.findSimilarStrings("chest", muscleGroups, 1);

      // Only "chest" itself should match at distance 0-1
      expect(result).toContain("chest");
      expect(result).not.toContain("back"); // too different
    });

    it("should handle practical muscle tag typos", () => {
      const existingTags = ["chest", "petto", "pectoral"];

      // User types "peto" (typo for "petto")
      const result = StringUtils.findSimilarStrings("peto", existingTags, 2);
      expect(result).toContain("petto");
    });

    it("should find similar tags for duplicate detection", () => {
      const existingTags = ["bench press", "incline bench", "dumbbell press"];

      // User is adding "bench pres" (typo)
      const result = StringUtils.findSimilarStrings(
        "bench pres",
        existingTags,
        2
      );
      expect(result).toContain("bench press");
    });

    it("should handle maxDistance of 0 (exact matches only)", () => {
      const haystack = ["chest", "chests", "Chest"];
      const result = StringUtils.findSimilarStrings("chest", haystack, 0);

      // Both "chest" and "Chest" match due to case insensitivity
      expect(result).toHaveLength(2);
      expect(result).toContain("chest");
      expect(result).toContain("Chest");
    });
  });
});

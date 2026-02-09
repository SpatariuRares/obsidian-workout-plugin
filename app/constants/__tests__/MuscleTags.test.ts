import { CONSTANTS } from "@app/constants";

describe("MuscleTags", () => {
  describe("CONSTANTS.WORKOUT.MUSCLES.TAGS constant", () => {
    it("should contain all expected muscle tags", () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("chest");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("back");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("legs");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("biceps");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("triceps");
    });

    it("should contain Italian muscle names", () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("petto");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("schiena");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("gambe");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("glutei");
    });

    it("should contain exercise type tags", () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("push");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("pull");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("squat");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAGS).toContain("deadlift");
    });

    it("should have all unique values", () => {
      const uniqueTags = new Set(CONSTANTS.WORKOUT.MUSCLES.TAGS);
      expect(uniqueTags.size).toBe(CONSTANTS.WORKOUT.MUSCLES.TAGS.length);
    });
  });

  describe("CONSTANTS.WORKOUT.MUSCLES.TAG_MAP constant", () => {
    it("should map Italian names to English muscle groups", () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["petto"]).toBe("chest");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["schiena"]).toBe("back");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["gambe"]).toBe("quads");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["glutei"]).toBe("glutes");
    });

    it("should map exercise types to muscle groups", () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["push"]).toBe("chest");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["pull"]).toBe("back");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["squat"]).toBe("quads");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["deadlift"]).toBe("back");
    });

    it("should map specific muscle variations", () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["pettoralesuperior"]).toBe(
        "chest",
      );
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["deltoideanteriore"]).toBe(
        "shoulders",
      );
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["ischiocrurali"]).toBe(
        "hamstrings",
      );
    });

    it("should have consistent mapping for same muscle", () => {
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["chest"]).toBe("chest");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["petto"]).toBe("chest");
      expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP["pettorale"]).toBe("chest");
    });
  });

  describe("Tag completeness", () => {
    it("should have mappings for all main muscle groups", () => {
      const mainGroups = [
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
      ];

      mainGroups.forEach((group) => {
        expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP[group]).toBeDefined();
      });
    });

    it("should have Italian translations for main groups", () => {
      const italianNames = [
        "petto",
        "schiena",
        "spalle",
        "bicipiti",
        "tricipiti",
        "gambe",
        "glutei",
        "polpacci",
        "addominali",
      ];

      italianNames.forEach((name) => {
        expect(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP[name]).toBeDefined();
      });
    });
  });
});

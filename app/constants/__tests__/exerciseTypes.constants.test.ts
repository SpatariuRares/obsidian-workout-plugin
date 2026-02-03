/**
 * @fileoverview Tests for exercise types constants
 *
 * Tests the getExerciseTypeById function and exercise type definitions.
 */

import {
  EXERCISE_TYPE_IDS,
  BUILT_IN_EXERCISE_TYPES,
  getExerciseTypeById,
  DEFAULT_EXERCISE_TYPE_ID,
} from "../exerciseTypes.constants";

describe("exerciseTypes.constants", () => {
  describe("EXERCISE_TYPE_IDS", () => {
    it("should have all expected type IDs", () => {
      expect(EXERCISE_TYPE_IDS.STRENGTH).toBe("strength");
      expect(EXERCISE_TYPE_IDS.TIMED).toBe("timed");
      expect(EXERCISE_TYPE_IDS.DISTANCE).toBe("distance");
      expect(EXERCISE_TYPE_IDS.CARDIO).toBe("cardio");
      expect(EXERCISE_TYPE_IDS.CUSTOM).toBe("custom");
    });
  });

  describe("BUILT_IN_EXERCISE_TYPES", () => {
    it("should contain 5 exercise types", () => {
      expect(BUILT_IN_EXERCISE_TYPES).toHaveLength(5);
    });

    it("should have strength type with reps and weight parameters", () => {
      const strengthType = BUILT_IN_EXERCISE_TYPES.find(
        (t) => t.id === "strength"
      );
      expect(strengthType).toBeDefined();
      expect(strengthType?.name).toBe("Strength");
      expect(strengthType?.parameters).toHaveLength(2);
      expect(strengthType?.parameters[0].key).toBe("reps");
      expect(strengthType?.parameters[1].key).toBe("weight");
    });

    it("should have timed type with duration parameter", () => {
      const timedType = BUILT_IN_EXERCISE_TYPES.find((t) => t.id === "timed");
      expect(timedType).toBeDefined();
      expect(timedType?.name).toBe("Timed");
      expect(timedType?.parameters).toHaveLength(1);
      expect(timedType?.parameters[0].key).toBe("duration");
    });

    it("should have distance type with distance and optional duration parameters", () => {
      const distanceType = BUILT_IN_EXERCISE_TYPES.find(
        (t) => t.id === "distance"
      );
      expect(distanceType).toBeDefined();
      expect(distanceType?.name).toBe("Distance");
      expect(distanceType?.parameters).toHaveLength(2);
      expect(distanceType?.parameters[0].key).toBe("distance");
      expect(distanceType?.parameters[0].required).toBe(true);
      expect(distanceType?.parameters[1].key).toBe("duration");
      expect(distanceType?.parameters[1].required).toBe(false);
    });

    it("should have cardio type with duration, optional distance, and optional heart rate", () => {
      const cardioType = BUILT_IN_EXERCISE_TYPES.find(
        (t) => t.id === "cardio"
      );
      expect(cardioType).toBeDefined();
      expect(cardioType?.name).toBe("Cardio");
      expect(cardioType?.parameters).toHaveLength(3);
      expect(cardioType?.parameters[0].key).toBe("duration");
      expect(cardioType?.parameters[1].key).toBe("distance");
      expect(cardioType?.parameters[2].key).toBe("heartRate");
    });

    it("should have custom type with no parameters", () => {
      const customType = BUILT_IN_EXERCISE_TYPES.find(
        (t) => t.id === "custom"
      );
      expect(customType).toBeDefined();
      expect(customType?.name).toBe("Custom");
      expect(customType?.parameters).toHaveLength(0);
    });
  });

  describe("getExerciseTypeById", () => {
    it("should return strength type for strength id", () => {
      const result = getExerciseTypeById("strength");
      expect(result).toBeDefined();
      expect(result?.id).toBe("strength");
      expect(result?.name).toBe("Strength");
    });

    it("should return timed type for timed id", () => {
      const result = getExerciseTypeById("timed");
      expect(result).toBeDefined();
      expect(result?.id).toBe("timed");
      expect(result?.name).toBe("Timed");
    });

    it("should return distance type for distance id", () => {
      const result = getExerciseTypeById("distance");
      expect(result).toBeDefined();
      expect(result?.id).toBe("distance");
      expect(result?.name).toBe("Distance");
    });

    it("should return cardio type for cardio id", () => {
      const result = getExerciseTypeById("cardio");
      expect(result).toBeDefined();
      expect(result?.id).toBe("cardio");
      expect(result?.name).toBe("Cardio");
    });

    it("should return custom type for custom id", () => {
      const result = getExerciseTypeById("custom");
      expect(result).toBeDefined();
      expect(result?.id).toBe("custom");
      expect(result?.name).toBe("Custom");
    });

    it("should return undefined for unknown id", () => {
      const result = getExerciseTypeById("unknown");
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      const result = getExerciseTypeById("");
      expect(result).toBeUndefined();
    });

    it("should be case sensitive", () => {
      const result = getExerciseTypeById("STRENGTH");
      expect(result).toBeUndefined();
    });
  });

  describe("DEFAULT_EXERCISE_TYPE_ID", () => {
    it("should be strength", () => {
      expect(DEFAULT_EXERCISE_TYPE_ID).toBe("strength");
    });

    it("should match EXERCISE_TYPE_IDS.STRENGTH", () => {
      expect(DEFAULT_EXERCISE_TYPE_ID).toBe(EXERCISE_TYPE_IDS.STRENGTH);
    });
  });
});

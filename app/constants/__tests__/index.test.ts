/**
 * @fileoverview Tests for constants barrel file
 *
 * Tests the CONSTANTS object composed in index.ts.
 */

import { CONSTANTS } from "../index";

describe("constants/index", () => {
  describe("CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS", () => {
    describe("LIMIT_RANGE", () => {
      it("should format limit range message with min, max, and received values", () => {
        expect(
          CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS.LIMIT_RANGE(1, 1000, "abc")
        ).toBe('limit must be a number between 1 and 1000, received: "abc"');
      });

      it("should handle numeric string as received value", () => {
        expect(
          CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS.LIMIT_RANGE(1, 100, "-5")
        ).toBe('limit must be a number between 1 and 100, received: "-5"');
      });

      it("should handle empty string as received value", () => {
        expect(
          CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS.LIMIT_RANGE(10, 50, "")
        ).toBe('limit must be a number between 10 and 50, received: ""');
      });
    });
  });

  describe("CONSTANTS structure", () => {
    it("should have WORKOUT namespace", () => {
      expect(CONSTANTS.WORKOUT).toBeDefined();
    });

    it("should have UI namespace within WORKOUT", () => {
      expect(CONSTANTS.WORKOUT.UI).toBeDefined();
      expect(CONSTANTS.WORKOUT.UI.ACTIONS).toBeDefined();
      expect(CONSTANTS.WORKOUT.UI.LABELS).toBeDefined();
    });

    it("should have MESSAGES namespace", () => {
      expect(CONSTANTS.WORKOUT.MESSAGES).toBeDefined();
      expect(CONSTANTS.WORKOUT.MESSAGES.NO_DATA).toBe(
        "No workout data available"
      );
    });

    it("should have MUSCLES namespace", () => {
      expect(CONSTANTS.WORKOUT.MUSCLES).toBeDefined();
      expect(CONSTANTS.WORKOUT.MUSCLES.NAMES).toBeDefined();
      expect(CONSTANTS.WORKOUT.MUSCLES.POSITIONS).toBeDefined();
    });

    it("should have TABLE namespace with columns", () => {
      expect(CONSTANTS.WORKOUT.TABLE).toBeDefined();
      expect(CONSTANTS.WORKOUT.TABLE.COLUMNS).toBeDefined();
      expect(CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE).toBe("Date");
    });

    it("should have MODAL namespace", () => {
      expect(CONSTANTS.WORKOUT.MODAL).toBeDefined();
      expect(CONSTANTS.WORKOUT.MODAL.TITLES).toBeDefined();
    });
  });
});

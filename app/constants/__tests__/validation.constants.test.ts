/**
 * @fileoverview Tests for validation constants
 *
 * Tests the dynamic functions in validation.constants.ts.
 */

import { TABLE_VALIDATION } from "../validation.constants";

describe("validation.constants", () => {
  describe("TABLE_VALIDATION", () => {
    describe("LIMIT_RANGE", () => {
      it("should format limit range message with min, max, and received values", () => {
        expect(TABLE_VALIDATION.LIMIT_RANGE(1, 1000, "abc")).toBe(
          'limit must be a number between 1 and 1000, received: "abc"'
        );
      });

      it("should handle numeric string as received value", () => {
        expect(TABLE_VALIDATION.LIMIT_RANGE(1, 100, "-5")).toBe(
          'limit must be a number between 1 and 100, received: "-5"'
        );
      });

      it("should handle empty string as received value", () => {
        expect(TABLE_VALIDATION.LIMIT_RANGE(10, 50, "")).toBe(
          'limit must be a number between 10 and 50, received: ""'
        );
      });

      it("should work with various min/max combinations", () => {
        expect(TABLE_VALIDATION.LIMIT_RANGE(0, 999999, "invalid")).toBe(
          'limit must be a number between 0 and 999999, received: "invalid"'
        );
      });
    });
  });
});

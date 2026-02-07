import { TableConfig } from "@app/features/tables/business/TableConfig";
import { CONSTANTS } from "@app/constants";

describe("TableConfig", () => {
  describe("getDefaults", () => {
    it("returns default table parameters", () => {
      const defaults = TableConfig.getDefaults();

      expect(defaults.limit).toBe(CONSTANTS.WORKOUT.TABLE.LIMITS.DEFAULT);
      expect(defaults.showAddButton).toBe(true);
      expect(defaults.searchByName).toBe(false);
      expect(defaults.exactMatch).toBe(
        CONSTANTS.WORKOUT.TABLE.DEFAULTS.EXACT_MATCH,
      );
      expect(defaults.columns).toEqual(
        CONSTANTS.WORKOUT.TABLE.DEFAULT_VISIBLE_COLUMNS,
      );
    });

    it("returns a new columns array each time (no shared reference)", () => {
      const defaults1 = TableConfig.getDefaults();
      const defaults2 = TableConfig.getDefaults();

      expect(defaults1.columns).not.toBe(defaults2.columns);
      expect(defaults1.columns).toEqual(defaults2.columns);
    });
  });

  describe("validateParams", () => {
    it("returns empty array for valid params", () => {
      const errors = TableConfig.validateParams({
        limit: 10,
        columns: ["Date", "Reps"],
      });

      expect(errors).toEqual([]);
    });

    it("returns empty array for params with no optional fields", () => {
      const errors = TableConfig.validateParams({});
      expect(errors).toEqual([]);
    });

    it("validates limit range - too low", () => {
      const errors = TableConfig.validateParams({ limit: -1 });
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain("-1");
    });

    it("validates limit range - too high", () => {
      const errors = TableConfig.validateParams({
        limit: CONSTANTS.WORKOUT.TABLE.LIMITS.MAX + 1,
      });
      expect(errors.length).toBe(1);
    });

    it("validates limit range - NaN string", () => {
      const errors = TableConfig.validateParams({
        limit: "abc" as unknown as number,
      });
      expect(errors.length).toBe(1);
    });

    it("validates columns invalid type", () => {
      const errors = TableConfig.validateParams({
        columns: 123 as unknown as string[],
      });
      expect(errors.length).toBe(1);
      expect(errors[0]).toBe(
        CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS.COLUMNS_INVALID_TYPE,
      );
    });

    it("validates columns with non-string elements", () => {
      const errors = TableConfig.validateParams({
        columns: [123 as unknown as string, "Date"],
      });
      expect(errors.length).toBe(1);
      expect(errors[0]).toBe(
        CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS.COLUMNS_NOT_STRINGS,
      );
    });

    it("accepts string columns", () => {
      const errors = TableConfig.validateParams({
        columns: '["Date", "Reps"]',
      });
      expect(errors).toEqual([]);
    });

    it("reports multiple errors at once", () => {
      const errors = TableConfig.validateParams({
        limit: -1,
        columns: 123 as unknown as string[],
      });
      expect(errors.length).toBe(2);
    });
  });

  describe("hasValidationErrors", () => {
    it("returns false for empty array", () => {
      expect(TableConfig.hasValidationErrors([])).toBe(false);
    });

    it("returns true for non-empty array", () => {
      expect(TableConfig.hasValidationErrors(["error"])).toBe(true);
    });
  });

  describe("formatValidationErrors", () => {
    it("joins errors with comma separator", () => {
      const result = TableConfig.formatValidationErrors(["error1", "error2"]);
      expect(result).toBe("error1, error2");
    });

    it("returns empty string for empty array", () => {
      expect(TableConfig.formatValidationErrors([])).toBe("");
    });
  });

  describe("mergeWithDefaults", () => {
    it("uses defaults for missing params", () => {
      const merged = TableConfig.mergeWithDefaults({});
      const defaults = TableConfig.getDefaults();

      expect(merged.limit).toBe(defaults.limit);
      expect(merged.showAddButton).toBe(defaults.showAddButton);
    });

    it("overrides defaults with provided params", () => {
      const merged = TableConfig.mergeWithDefaults({
        limit: 5,
        showAddButton: false,
      });

      expect(merged.limit).toBe(5);
      expect(merged.showAddButton).toBe(false);
    });

    it("preserves extra params not in defaults", () => {
      const merged = TableConfig.mergeWithDefaults({
        exercise: "Bench Press",
        targetWeight: 100,
      });

      expect(merged.exercise).toBe("Bench Press");
      expect(merged.targetWeight).toBe(100);
    });
  });
});

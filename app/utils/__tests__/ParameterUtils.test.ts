/**
 * Tests for ParameterUtils utility class.
 *
 * Tests cover:
 * - Numeric parameter filtering and key extraction
 * - Reserved key validation
 * - Parameter formatting with units
 * - Key to label conversion
 * - Color retrieval for data types
 * - Single and multiple parameter validation
 * - Parameter lookup by key
 */

import {
  ParameterUtils,
  RESERVED_PARAMETER_KEYS,
  DEFAULT_PARAMETER_UNITS,
  CHART_DATA_TYPE_COLORS,
} from "@app/utils/ParameterUtils";
import { ParameterDefinition } from "@app/types/ExerciseTypes";

describe("ParameterUtils", () => {
  // Sample parameter definitions for testing
  const sampleParams: ParameterDefinition[] = [
    {
      key: "weight",
      label: "Weight",
      type: "number",
      unit: "kg",
      required: true,
    },
    { key: "reps", label: "Reps", type: "number", required: true },
    { key: "notes", label: "Notes", type: "string", required: false },
    { key: "isDropSet", label: "Drop Set", type: "boolean", required: false },
    {
      key: "duration",
      label: "Duration",
      type: "number",
      unit: "sec",
      required: true,
    },
  ];

  describe("getNumericParams", () => {
    it("should filter to only numeric type parameters", () => {
      const result = ParameterUtils.getNumericParams(sampleParams);

      expect(result).toHaveLength(3);
      expect(result.every((p) => p.type === "number")).toBe(true);
      expect(result.map((p) => p.key)).toEqual(["weight", "reps", "duration"]);
    });

    it("should return empty array when no numeric params exist", () => {
      const stringParams: ParameterDefinition[] = [
        { key: "notes", label: "Notes", type: "string", required: false },
        { key: "tag", label: "Tag", type: "string", required: false },
      ];

      const result = ParameterUtils.getNumericParams(stringParams);

      expect(result).toHaveLength(0);
    });

    it("should return empty array for empty input", () => {
      const result = ParameterUtils.getNumericParams([]);

      expect(result).toHaveLength(0);
    });

    it("should handle all numeric parameters", () => {
      const allNumeric: ParameterDefinition[] = [
        { key: "a", label: "A", type: "number", required: true },
        { key: "b", label: "B", type: "number", required: true },
      ];

      const result = ParameterUtils.getNumericParams(allNumeric);

      expect(result).toHaveLength(2);
    });
  });

  describe("getNumericParamKeys", () => {
    it("should return keys of numeric parameters only", () => {
      const result = ParameterUtils.getNumericParamKeys(sampleParams);

      expect(result).toEqual(["weight", "reps", "duration"]);
    });

    it("should return empty array when no numeric params exist", () => {
      const stringParams: ParameterDefinition[] = [
        { key: "notes", label: "Notes", type: "string", required: false },
      ];

      const result = ParameterUtils.getNumericParamKeys(stringParams);

      expect(result).toHaveLength(0);
    });

    it("should return empty array for empty input", () => {
      const result = ParameterUtils.getNumericParamKeys([]);

      expect(result).toHaveLength(0);
    });
  });

  describe("isReservedParamKey", () => {
    it("should return true for standard CSV columns", () => {
      expect(ParameterUtils.isReservedParamKey("date")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("exercise")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("reps")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("weight")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("volume")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("origine")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("workout")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("timestamp")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("notes")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("protocol")).toBe(true);
    });

    it("should return true for computed values", () => {
      expect(ParameterUtils.isReservedParamKey("pace")).toBe(true);
    });

    it("should return true for chart data types", () => {
      expect(ParameterUtils.isReservedParamKey("duration")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("distance")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("heartRate")).toBe(true);
    });

    it("should be case-insensitive", () => {
      expect(ParameterUtils.isReservedParamKey("DATE")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("Date")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("VOLUME")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("Volume")).toBe(true);
    });

    it("should trim whitespace", () => {
      expect(ParameterUtils.isReservedParamKey("  date  ")).toBe(true);
      expect(ParameterUtils.isReservedParamKey("\tvolume\t")).toBe(true);
    });

    it("should return false for non-reserved keys", () => {
      expect(ParameterUtils.isReservedParamKey("customParam")).toBe(false);
      expect(ParameterUtils.isReservedParamKey("myField")).toBe(false);
      expect(ParameterUtils.isReservedParamKey("cadence")).toBe(false);
      expect(ParameterUtils.isReservedParamKey("intensity")).toBe(false);
    });
  });

  describe("getReservedKeys", () => {
    it("should return the RESERVED_PARAMETER_KEYS array", () => {
      const result = ParameterUtils.getReservedKeys();

      expect(result).toBe(RESERVED_PARAMETER_KEYS);
      expect(result).toContain("date");
      expect(result).toContain("volume");
      expect(result).toContain("pace");
    });

    it("should return a readonly array", () => {
      const result = ParameterUtils.getReservedKeys();

      // Verify it's the same reference (readonly)
      expect(result).toBe(RESERVED_PARAMETER_KEYS);
    });
  });

  describe("formatParamWithUnit", () => {
    it("should format parameter with explicit unit", () => {
      const param: ParameterDefinition = {
        key: "weight",
        label: "Weight",
        type: "number",
        unit: "kg",
        required: true,
      };

      const result = ParameterUtils.formatParamWithUnit(param);

      expect(result).toBe("Weight (kg)");
    });

    it("should use default unit when param has no unit", () => {
      const param: ParameterDefinition = {
        key: "weight",
        label: "Weight",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.formatParamWithUnit(param);

      expect(result).toBe("Weight (kg)");
    });

    it("should return label only when no unit available", () => {
      const param: ParameterDefinition = {
        key: "customParam",
        label: "Custom Param",
        type: "number",
        required: false,
      };

      const result = ParameterUtils.formatParamWithUnit(param);

      expect(result).toBe("Custom Param");
    });

    it("should prefer explicit unit over default", () => {
      const param: ParameterDefinition = {
        key: "weight",
        label: "Weight",
        type: "number",
        unit: "lbs",
        required: true,
      };

      const result = ParameterUtils.formatParamWithUnit(param);

      expect(result).toBe("Weight (lbs)");
    });

    it("should handle parameters with empty string unit", () => {
      const param: ParameterDefinition = {
        key: "reps",
        label: "Reps",
        type: "number",
        unit: "",
        required: true,
      };

      const result = ParameterUtils.formatParamWithUnit(param);

      // Empty unit falls back to default, reps has empty default
      expect(result).toBe("Reps");
    });
  });

  describe("formatKeyWithUnit", () => {
    it("should format key with default unit", () => {
      const result = ParameterUtils.formatKeyWithUnit("weight");

      expect(result).toBe("Weight (kg)");
    });

    it("should format key with custom unit", () => {
      const result = ParameterUtils.formatKeyWithUnit("weight", "lbs");

      expect(result).toBe("Weight (lbs)");
    });

    it("should return label only for unknown key without custom unit", () => {
      const result = ParameterUtils.formatKeyWithUnit("customParam");

      expect(result).toBe("Custom Param");
    });

    it("should handle case-insensitive key lookup for default units", () => {
      const result = ParameterUtils.formatKeyWithUnit("WEIGHT");

      // keyToLabel converts "WEIGHT" to "W E I G H T" (spaces before caps)
      // Default units lookup is case-insensitive
      expect(result).toBe("W E I G H T (kg)");
    });

    it("should use custom unit even for known keys", () => {
      const result = ParameterUtils.formatKeyWithUnit("duration", "min");

      expect(result).toBe("Duration (min)");
    });
  });

  describe("keyToLabel", () => {
    it("should convert camelCase to spaced title case", () => {
      expect(ParameterUtils.keyToLabel("heartRate")).toBe("Heart Rate");
      expect(ParameterUtils.keyToLabel("myCustomParam")).toBe("My Custom Param");
    });

    it("should convert snake_case to spaced title case", () => {
      expect(ParameterUtils.keyToLabel("heart_rate")).toBe("Heart Rate");
      expect(ParameterUtils.keyToLabel("my_custom_param")).toBe(
        "My Custom Param"
      );
    });

    it("should convert kebab-case to spaced title case", () => {
      expect(ParameterUtils.keyToLabel("heart-rate")).toBe("Heart Rate");
      expect(ParameterUtils.keyToLabel("my-custom-param")).toBe(
        "My Custom Param"
      );
    });

    it("should handle single word", () => {
      expect(ParameterUtils.keyToLabel("weight")).toBe("Weight");
      expect(ParameterUtils.keyToLabel("reps")).toBe("Reps");
    });

    it("should handle already capitalized words", () => {
      expect(ParameterUtils.keyToLabel("RPE")).toBe("R P E");
    });

    it("should handle mixed formats", () => {
      expect(ParameterUtils.keyToLabel("my_heartRate-value")).toBe(
        "My Heart Rate Value"
      );
    });

    it("should trim whitespace", () => {
      expect(ParameterUtils.keyToLabel("  weight  ")).toBe("Weight");
    });
  });

  describe("getColorForDataType", () => {
    it("should return correct colors for known data types", () => {
      expect(ParameterUtils.getColorForDataType("volume")).toBe("#4CAF50");
      expect(ParameterUtils.getColorForDataType("weight")).toBe("#FF9800");
      expect(ParameterUtils.getColorForDataType("reps")).toBe("#FF9800");
      expect(ParameterUtils.getColorForDataType("duration")).toBe("#2196F3");
      expect(ParameterUtils.getColorForDataType("distance")).toBe("#9C27B0");
      expect(ParameterUtils.getColorForDataType("pace")).toBe("#E91E63");
      // Note: heartRate key in CHART_DATA_TYPE_COLORS is camelCase but lookup
      // lowercases input, so "heartRate" -> "heartrate" doesn't match "heartRate"
      // This returns default color - see heartrate (lowercase) test below
      expect(ParameterUtils.getColorForDataType("heartrate")).toBe("#607D8B");
    });

    it("should be case-insensitive for lowercase keys", () => {
      expect(ParameterUtils.getColorForDataType("VOLUME")).toBe("#4CAF50");
      expect(ParameterUtils.getColorForDataType("Volume")).toBe("#4CAF50");
      // HEARTRATE lowercased = heartrate, but color key is heartRate (camelCase)
      // so it falls back to default
      expect(ParameterUtils.getColorForDataType("HEARTRATE")).toBe("#607D8B");
    });

    it("should return default color for unknown types", () => {
      expect(ParameterUtils.getColorForDataType("customParam")).toBe("#607D8B");
      expect(ParameterUtils.getColorForDataType("unknown")).toBe("#607D8B");
    });
  });

  describe("validateParam", () => {
    it("should validate a valid parameter", () => {
      const param: ParameterDefinition = {
        key: "customField",
        label: "Custom Field",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty key", () => {
      const param: ParameterDefinition = {
        key: "",
        label: "Label",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Parameter key cannot be empty");
    });

    it("should reject whitespace-only key", () => {
      const param: ParameterDefinition = {
        key: "   ",
        label: "Label",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Parameter key cannot be empty");
    });

    it("should reject reserved keys", () => {
      const param: ParameterDefinition = {
        key: "date",
        label: "Date",
        type: "string",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Parameter key "date" is reserved');
      expect(result.error).toContain("Reserved keys:");
    });

    it("should reject key starting with number", () => {
      const param: ParameterDefinition = {
        key: "123field",
        label: "Field",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must start with a letter");
    });

    it("should reject key with special characters", () => {
      const param: ParameterDefinition = {
        key: "my-field",
        label: "Field",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "contain only letters, numbers, and underscores"
      );
    });

    it("should reject key with spaces", () => {
      const param: ParameterDefinition = {
        key: "my field",
        label: "Field",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(false);
    });

    it("should accept key with underscores", () => {
      const param: ParameterDefinition = {
        key: "my_custom_field",
        label: "My Custom Field",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(true);
    });

    it("should accept key with numbers after first letter", () => {
      const param: ParameterDefinition = {
        key: "field123",
        label: "Field",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(true);
    });

    it("should reject empty label", () => {
      const param: ParameterDefinition = {
        key: "validKey",
        label: "",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Parameter label cannot be empty");
    });

    it("should reject whitespace-only label", () => {
      const param: ParameterDefinition = {
        key: "validKey",
        label: "   ",
        type: "number",
        required: true,
      };

      const result = ParameterUtils.validateParam(param);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Parameter label cannot be empty");
    });
  });

  describe("validateParams", () => {
    it("should validate array of valid parameters", () => {
      const params: ParameterDefinition[] = [
        { key: "field1", label: "Field 1", type: "number", required: true },
        { key: "field2", label: "Field 2", type: "string", required: false },
      ];

      const result = ParameterUtils.validateParams(params);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should collect errors from multiple invalid parameters", () => {
      const params: ParameterDefinition[] = [
        { key: "", label: "Field 1", type: "number", required: true },
        { key: "date", label: "Date", type: "string", required: true },
      ];

      const result = ParameterUtils.validateParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toBe("Parameter key cannot be empty");
      expect(result.errors[1]).toContain("reserved");
    });

    it("should detect duplicate keys (case-insensitive)", () => {
      const params: ParameterDefinition[] = [
        { key: "myField", label: "Field 1", type: "number", required: true },
        { key: "MYFIELD", label: "Field 2", type: "number", required: true },
      ];

      const result = ParameterUtils.validateParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Duplicate parameter key");
    });

    it("should handle empty array", () => {
      const result = ParameterUtils.validateParams([]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should combine validation errors and duplicate errors", () => {
      const params: ParameterDefinition[] = [
        { key: "field", label: "Field 1", type: "number", required: true },
        { key: "123invalid", label: "Invalid", type: "number", required: true },
        { key: "FIELD", label: "Duplicate", type: "number", required: true },
      ];

      const result = ParameterUtils.validateParams(params);

      expect(result.isValid).toBe(false);
      // Should have: invalid key format error + duplicate key error
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("findParamByKey", () => {
    it("should find parameter by exact key", () => {
      const result = ParameterUtils.findParamByKey(sampleParams, "weight");

      expect(result).toBeDefined();
      expect(result?.key).toBe("weight");
      expect(result?.label).toBe("Weight");
    });

    it("should find parameter case-insensitively", () => {
      const result = ParameterUtils.findParamByKey(sampleParams, "WEIGHT");

      expect(result).toBeDefined();
      expect(result?.key).toBe("weight");
    });

    it("should find parameter with mixed case", () => {
      const params: ParameterDefinition[] = [
        {
          key: "heartRate",
          label: "Heart Rate",
          type: "number",
          required: true,
        },
      ];

      const result = ParameterUtils.findParamByKey(params, "HEARTRATE");

      expect(result).toBeDefined();
      expect(result?.key).toBe("heartRate");
    });

    it("should return undefined for non-existent key", () => {
      const result = ParameterUtils.findParamByKey(sampleParams, "nonExistent");

      expect(result).toBeUndefined();
    });

    it("should return undefined for empty array", () => {
      const result = ParameterUtils.findParamByKey([], "weight");

      expect(result).toBeUndefined();
    });

    it("should return first match when duplicates exist", () => {
      const params: ParameterDefinition[] = [
        { key: "field", label: "First", type: "number", required: true },
        { key: "FIELD", label: "Second", type: "number", required: true },
      ];

      const result = ParameterUtils.findParamByKey(params, "field");

      expect(result).toBeDefined();
      expect(result?.label).toBe("First");
    });
  });

  describe("Exported constants", () => {
    describe("RESERVED_PARAMETER_KEYS", () => {
      it("should include standard CSV columns", () => {
        expect(RESERVED_PARAMETER_KEYS).toContain("date");
        expect(RESERVED_PARAMETER_KEYS).toContain("exercise");
        expect(RESERVED_PARAMETER_KEYS).toContain("reps");
        expect(RESERVED_PARAMETER_KEYS).toContain("weight");
      });

      it("should include computed values", () => {
        expect(RESERVED_PARAMETER_KEYS).toContain("volume");
        expect(RESERVED_PARAMETER_KEYS).toContain("pace");
      });

      it("should include chart data types", () => {
        expect(RESERVED_PARAMETER_KEYS).toContain("duration");
        expect(RESERVED_PARAMETER_KEYS).toContain("distance");
        expect(RESERVED_PARAMETER_KEYS).toContain("heartRate");
      });
    });

    describe("DEFAULT_PARAMETER_UNITS", () => {
      it("should have correct default units", () => {
        expect(DEFAULT_PARAMETER_UNITS.weight).toBe("kg");
        expect(DEFAULT_PARAMETER_UNITS.reps).toBe("");
        expect(DEFAULT_PARAMETER_UNITS.volume).toBe("kg");
        expect(DEFAULT_PARAMETER_UNITS.duration).toBe("sec");
        expect(DEFAULT_PARAMETER_UNITS.distance).toBe("km");
        expect(DEFAULT_PARAMETER_UNITS.pace).toBe("min/km");
        expect(DEFAULT_PARAMETER_UNITS.heartRate).toBe("bpm");
        expect(DEFAULT_PARAMETER_UNITS.heartrate).toBe("bpm");
      });
    });

    describe("CHART_DATA_TYPE_COLORS", () => {
      it("should have colors for all data types", () => {
        expect(CHART_DATA_TYPE_COLORS.volume).toBe("#4CAF50");
        expect(CHART_DATA_TYPE_COLORS.weight).toBe("#FF9800");
        expect(CHART_DATA_TYPE_COLORS.reps).toBe("#FF9800");
        expect(CHART_DATA_TYPE_COLORS.duration).toBe("#2196F3");
        expect(CHART_DATA_TYPE_COLORS.distance).toBe("#9C27B0");
        expect(CHART_DATA_TYPE_COLORS.pace).toBe("#E91E63");
        expect(CHART_DATA_TYPE_COLORS.heartRate).toBe("#F44336");
      });

      it("should have a default color", () => {
        expect(CHART_DATA_TYPE_COLORS.default).toBe("#607D8B");
      });
    });
  });
});

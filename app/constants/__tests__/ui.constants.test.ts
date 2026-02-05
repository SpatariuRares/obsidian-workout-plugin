/**
 * @fileoverview Tests for UI constants
 *
 * Tests all dynamic functions in ui.constants.ts to ensure 100% coverage.
 */

import { CHART_DATA_TYPE } from "@app/features/charts/types";
import {
  MODAL_UI,
  CHARTS_UI,
  DASHBOARD_UI,
  MESSAGES_UI,
  GENERAL_UI,
} from "../ui.constants";

describe("ui.constants", () => {
  describe("MODAL_UI.NOTICES", () => {
    describe("MUSCLE_TAG_COUNT", () => {
      it("should return singular form for count of 1", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_COUNT(1)).toBe("1 tag found");
      });

      it("should return plural form for count of 0", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_COUNT(0)).toBe("0 tags found");
      });

      it("should return plural form for count greater than 1", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_COUNT(5)).toBe("5 tags found");
      });
    });

    describe("MUSCLE_TAG_DELETE_CONFIRM", () => {
      it("should include tag name in confirmation message", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_DELETE_CONFIRM("chest")).toBe(
          'Are you sure you want to delete the tag "chest"?'
        );
      });
    });

    describe("MUSCLE_TAG_SAVE_ERROR", () => {
      it("should include error message", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_SAVE_ERROR("Network error")).toBe(
          "Error saving muscle tag: Network error"
        );
      });
    });

    describe("MUSCLE_TAG_EXISTS", () => {
      it("should include tag name in message", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_EXISTS("biceps")).toBe(
          'Tag "biceps" already exists'
        );
      });
    });

    describe("MUSCLE_TAG_SIMILAR_FOUND", () => {
      it("should return singular form for count of 1", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_SIMILAR_FOUND(1)).toBe(
          "1 similar tag found"
        );
      });

      it("should return plural form for count greater than 1", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_SIMILAR_FOUND(3)).toBe(
          "3 similar tags found"
        );
      });
    });

    describe("MUSCLE_TAG_EXPORT_ERROR", () => {
      it("should include error message", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_EXPORT_ERROR("File error")).toBe(
          "Error exporting muscle tags: File error"
        );
      });
    });

    describe("MUSCLE_TAG_IMPORTED", () => {
      it("should return singular form for count of 1", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_IMPORTED(1)).toBe(
          "1 muscle tag imported successfully!"
        );
      });

      it("should return plural form for count greater than 1", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_IMPORTED(10)).toBe(
          "10 muscle tags imported successfully!"
        );
      });
    });

    describe("MUSCLE_TAG_IMPORT_ERROR", () => {
      it("should include error message", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_IMPORT_ERROR("Parse error")).toBe(
          "Error importing muscle tags: Parse error"
        );
      });
    });

    describe("MUSCLE_TAG_IMPORT_INVALID_GROUP", () => {
      it("should include tag and group in message", () => {
        expect(
          MODAL_UI.NOTICES.MUSCLE_TAG_IMPORT_INVALID_GROUP("petto", "invalid")
        ).toBe(
          'Invalid muscle group "invalid" for tag "petto". Must be a canonical muscle group.'
        );
      });
    });

    describe("MUSCLE_TAG_IMPORT_PREVIEW", () => {
      it("should return singular form for count of 1", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_IMPORT_PREVIEW(1)).toBe(
          "1 tag to import"
        );
      });

      it("should return plural form for count greater than 1", () => {
        expect(MODAL_UI.NOTICES.MUSCLE_TAG_IMPORT_PREVIEW(5)).toBe(
          "5 tags to import"
        );
      });
    });

    describe("MIGRATION_COMPLETE", () => {
      it("should include count in message", () => {
        expect(MODAL_UI.NOTICES.MIGRATION_COMPLETE(15)).toBe(
          "✅ Migration complete. Updated 15 exercise files."
        );
      });
    });
  });

  describe("MODAL_UI.EXERCISE_STATUS", () => {
    describe("FOUND", () => {
      it("should include count in message", () => {
        expect(MODAL_UI.EXERCISE_STATUS.FOUND(5)).toBe("📋 5 exercises found");
      });

      it("should work with 0 exercises", () => {
        expect(MODAL_UI.EXERCISE_STATUS.FOUND(0)).toBe("📋 0 exercises found");
      });
    });
  });

  describe("CHARTS_UI.LABELS", () => {
    describe("TREND_TITLE", () => {
      it("should return Volume trend title when no data type specified", () => {
        expect(CHARTS_UI.LABELS.TREND_TITLE()).toBe("Trend Volume: ");
      });

      it("should return Volume trend title for volume data type", () => {
        expect(CHARTS_UI.LABELS.TREND_TITLE(CHART_DATA_TYPE.VOLUME)).toBe(
          "Trend Volume: "
        );
      });

      it("should return Weight trend title for weight data type", () => {
        expect(CHARTS_UI.LABELS.TREND_TITLE(CHART_DATA_TYPE.WEIGHT)).toBe(
          "Trend Weight: "
        );
      });

      it("should return Reps trend title for reps data type", () => {
        expect(CHARTS_UI.LABELS.TREND_TITLE(CHART_DATA_TYPE.REPS)).toBe(
          "Trend Reps: "
        );
      });

      it("should return Duration trend title for duration data type", () => {
        expect(CHARTS_UI.LABELS.TREND_TITLE(CHART_DATA_TYPE.DURATION)).toBe(
          "Trend Duration: "
        );
      });

      it("should return Distance trend title for distance data type", () => {
        expect(CHARTS_UI.LABELS.TREND_TITLE(CHART_DATA_TYPE.DISTANCE)).toBe(
          "Trend Distance: "
        );
      });
    });

    describe("VARIATION_FROM_TO", () => {
      it("should format start and end values", () => {
        expect(CHARTS_UI.LABELS.VARIATION_FROM_TO("100", "150")).toBe(
          " (da 100 a 150)"
        );
      });
    });

    describe("VARIATION_FROM_TO_FORMATTED", () => {
      it("should format start and end values", () => {
        expect(CHARTS_UI.LABELS.VARIATION_FROM_TO_FORMATTED("50", "75")).toBe(
          " (da 50 a 75)"
        );
      });
    });

    describe("VARIATION_SINGLE_VALUE", () => {
      it("should format single volume value", () => {
        expect(CHARTS_UI.LABELS.VARIATION_SINGLE_VALUE("200")).toBe(
          " (Volume: 200)"
        );
      });
    });

    describe("VARIATION_SINGLE_VALUE_FORMATTED", () => {
      it("should use Volume when no data type specified", () => {
        expect(CHARTS_UI.LABELS.VARIATION_SINGLE_VALUE_FORMATTED("100")).toBe(
          " (Volume: 100)"
        );
      });

      it("should use Volume when data type is volume", () => {
        expect(
          CHARTS_UI.LABELS.VARIATION_SINGLE_VALUE_FORMATTED(
            "100",
            CHART_DATA_TYPE.VOLUME
          )
        ).toBe(" (Volume: 100)");
      });

      it("should use Weight when data type is weight", () => {
        expect(
          CHARTS_UI.LABELS.VARIATION_SINGLE_VALUE_FORMATTED(
            "50",
            CHART_DATA_TYPE.WEIGHT
          )
        ).toBe(" (Weight: 50)");
      });

      it("should use Reps when data type is reps", () => {
        expect(
          CHARTS_UI.LABELS.VARIATION_SINGLE_VALUE_FORMATTED(
            "12",
            CHART_DATA_TYPE.REPS
          )
        ).toBe(" (Reps: 12)");
      });
    });

    describe("VARIATION_VALUE_LABEL", () => {
      it("should format volume label with value", () => {
        expect(CHARTS_UI.LABELS.VARIATION_VALUE_LABEL("300")).toBe(
          "Volume: 300"
        );
      });
    });

    describe("VARIATION_VALUE_LABEL_FORMATTED", () => {
      it("should use Volume when no data type specified", () => {
        expect(CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED("150")).toBe(
          "Volume: 150"
        );
      });

      it("should use correct type name for different data types", () => {
        expect(
          CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED(
            "60",
            CHART_DATA_TYPE.DURATION
          )
        ).toBe("Duration: 60");

        expect(
          CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED(
            "5",
            CHART_DATA_TYPE.DISTANCE
          )
        ).toBe("Distance: 5");

        expect(
          CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED(
            "6:30",
            CHART_DATA_TYPE.PACE
          )
        ).toBe("Pace: 6:30");

        expect(
          CHARTS_UI.LABELS.VARIATION_VALUE_LABEL_FORMATTED(
            "145",
            CHART_DATA_TYPE.HEART_RATE
          )
        ).toBe("Heart Rate: 145");
      });
    });
  });

  describe("DASHBOARD_UI.MUSCLE_TAGS", () => {
    describe("TOTAL_COUNT", () => {
      it("should format count in message", () => {
        expect(DASHBOARD_UI.MUSCLE_TAGS.TOTAL_COUNT(25)).toBe(
          "Total: 25 tags available"
        );
      });
    });

    describe("TOOLTIP", () => {
      it("should include tag name in tooltip", () => {
        expect(DASHBOARD_UI.MUSCLE_TAGS.TOOLTIP("chest")).toBe(
          "Click to copy: chest"
        );
      });
    });
  });

  describe("DASHBOARD_UI.FILE_ERRORS", () => {
    describe("TOO_MANY_TAGS", () => {
      it("should include count in message", () => {
        expect(DASHBOARD_UI.FILE_ERRORS.TOO_MANY_TAGS(10)).toBe(
          "Too many muscle tags (10)"
        );
      });
    });

    describe("READ_ERROR", () => {
      it("should include error message", () => {
        expect(DASHBOARD_UI.FILE_ERRORS.READ_ERROR("File not found")).toBe(
          "Error reading file: File not found"
        );
      });
    });
  });

  describe("MESSAGES_UI.ERRORS", () => {
    describe("MUSCLE_TAGS_CSV_FAILED", () => {
      it("should include error message", () => {
        expect(MESSAGES_UI.ERRORS.MUSCLE_TAGS_CSV_FAILED("Write error")).toBe(
          "Error creating muscle tags CSV: Write error"
        );
      });
    });

    describe("TAG_REFERENCE_FAILED", () => {
      it("should include error message", () => {
        expect(MESSAGES_UI.ERRORS.TAG_REFERENCE_FAILED("Permission denied")).toBe(
          "Error generating tag reference note: Permission denied"
        );
      });
    });
  });

  describe("GENERAL_UI.LOGS", () => {
    describe("NO_DATA_TITLE", () => {
      it("should use default when no exercise name provided", () => {
        expect(GENERAL_UI.LOGS.NO_DATA_TITLE()).toBe(
          "No workout logs found for exercise"
        );
      });

      it("should use default for empty string", () => {
        expect(GENERAL_UI.LOGS.NO_DATA_TITLE("")).toBe(
          "No workout logs found for exercise"
        );
      });

      it("should use default for whitespace-only string", () => {
        expect(GENERAL_UI.LOGS.NO_DATA_TITLE("   ")).toBe(
          "No workout logs found for exercise"
        );
      });

      it("should include exercise name when provided", () => {
        expect(GENERAL_UI.LOGS.NO_DATA_TITLE("Squat")).toBe(
          "No workout logs found for Squat"
        );
      });
    });

    describe("CREATE_FIRST_LOG_BUTTON_TEXT", () => {
      it("should use default when no exercise name provided", () => {
        expect(GENERAL_UI.LOGS.CREATE_FIRST_LOG_BUTTON_TEXT()).toBe(
          "Create first workout log for exercise"
        );
      });

      it("should use default for empty string", () => {
        expect(GENERAL_UI.LOGS.CREATE_FIRST_LOG_BUTTON_TEXT("")).toBe(
          "Create first workout log for exercise"
        );
      });

      it("should include exercise name when provided", () => {
        expect(GENERAL_UI.LOGS.CREATE_FIRST_LOG_BUTTON_TEXT("Deadlift")).toBe(
          "Create first workout log for Deadlift"
        );
      });
    });

    describe("CREATE_FIRST_LOG_BUTTON_ARIA", () => {
      it("should use default when no exercise name provided", () => {
        expect(GENERAL_UI.LOGS.CREATE_FIRST_LOG_BUTTON_ARIA()).toBe(
          "Create first workout log for exercise"
        );
      });

      it("should include exercise name when provided", () => {
        expect(
          GENERAL_UI.LOGS.CREATE_FIRST_LOG_BUTTON_ARIA("Bench Press")
        ).toBe("Create first workout log for Bench Press");
      });
    });

    describe("ADD_LOG_BUTTON_TEXT", () => {
      it("should use Workout when no exercise name provided", () => {
        expect(GENERAL_UI.LOGS.ADD_LOG_BUTTON_TEXT()).toBe(
          "Add log for Workout"
        );
      });

      it("should use Workout for empty string", () => {
        expect(GENERAL_UI.LOGS.ADD_LOG_BUTTON_TEXT("")).toBe(
          "Add log for Workout"
        );
      });

      it("should include exercise name when provided", () => {
        expect(GENERAL_UI.LOGS.ADD_LOG_BUTTON_TEXT("Pull-up")).toBe(
          "Add log for Pull-up"
        );
      });
    });

    describe("ADD_LOG_BUTTON_ARIA", () => {
      it("should use Workout when no exercise name provided", () => {
        expect(GENERAL_UI.LOGS.ADD_LOG_BUTTON_ARIA()).toBe(
          "Add workout log for Workout"
        );
      });

      it("should include exercise name when provided", () => {
        expect(GENERAL_UI.LOGS.ADD_LOG_BUTTON_ARIA("Row")).toBe(
          "Add workout log for Row"
        );
      });
    });

    describe("CREATE_LOG_BUTTON_TEXT", () => {
      it("should include exercise name", () => {
        expect(GENERAL_UI.LOGS.CREATE_LOG_BUTTON_TEXT("Curl")).toBe(
          "Create log for: Curl"
        );
      });
    });

    describe("CREATE_LOG_BUTTON_ARIA", () => {
      it("should include exercise name", () => {
        expect(GENERAL_UI.LOGS.CREATE_LOG_BUTTON_ARIA("Tricep Extension")).toBe(
          "Create workout log for Tricep Extension"
        );
      });
    });
  });
});

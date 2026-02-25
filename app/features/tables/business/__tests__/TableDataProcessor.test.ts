import { TableDataProcessor } from "@app/features/tables/business/TableDataProcessor";
import { CONSTANTS } from "@app/constants";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams } from "@app/features/tables/types";
import { t } from "@app/i18n";

const createLog = (
  overrides: Partial<WorkoutLogData> = {},
): WorkoutLogData => ({
  date: "2024-01-15T10:00:00",
  exercise: "Bench Press",
  reps: 8,
  weight: 80,
  volume: 640,
  ...overrides,
});

describe("TableDataProcessor", () => {
  describe("processTableData", () => {
    it("returns processed table data with default columns", async () => {
      const logData = [createLog()];
      const params: EmbeddedTableParams = { exercise: "Bench Press" };

      const result = await TableDataProcessor.processTableData(logData, params);

      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value);
      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.REPS.value);
      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.WEIGHT.value);
      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value);
      expect(result.headers).toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS.value,
      );
      expect(result.rows.length).toBe(1);
      expect(result.totalRows).toBe(1);
    });

    it("includes Exercise column when no exercise filter", async () => {
      const logData = [createLog()];
      const params: EmbeddedTableParams = {};

      const result = await TableDataProcessor.processTableData(logData, params);

      expect(result.headers).toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.EXERCISE.value,
      );
    });

    it("excludes Exercise column when exercise filter is set", async () => {
      const logData = [createLog()];
      const params: EmbeddedTableParams = { exercise: "Bench Press" };

      const result = await TableDataProcessor.processTableData(logData, params);

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.EXERCISE.value,
      );
    });

    it("sorts data by date descending", async () => {
      const logData = [
        createLog({ date: "2024-01-10T10:00:00" }),
        createLog({ date: "2024-01-15T10:00:00" }),
        createLog({ date: "2024-01-12T10:00:00" }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      // First row should be newest date
      expect(result.rows[0].originalDate).toBe("2024-01-15T10:00:00");
      expect(result.rows[2].originalDate).toBe("2024-01-10T10:00:00");
    });

    it("limits data to the specified limit", async () => {
      const logData = Array.from({ length: 10 }, (_, i) =>
        createLog({ date: `2024-01-${String(i + 1).padStart(2, "0")}T10:00:00` }),
      );

      const result = await TableDataProcessor.processTableData(logData, {
        limit: 5,
      });

      expect(result.rows.length).toBe(5);
      expect(result.totalRows).toBe(5);
    });

    it("uses default limit of 50 when not specified", async () => {
      const logData = Array.from({ length: 60 }, (_, i) =>
        createLog({ date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T${String(i).padStart(2, "0")}:00:00` }),
      );

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.totalRows).toBe(50);
    });

    it("shows Notes column when data has notes", async () => {
      const logData = [createLog({ notes: "Felt strong" })];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.NOTES.value);
    });

    it("hides Notes column when no data has notes", async () => {
      const logData = [createLog({ notes: undefined })];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.NOTES.value,
      );
    });

    it("shows Protocol column when non-standard protocols present", async () => {
      const logData = [createLog({ protocol: WorkoutProtocol.DROP_SET })];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      );
    });

    it("hides Protocol column when only standard protocols", async () => {
      const logData = [createLog({ protocol: WorkoutProtocol.STANDARD })];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      );
    });

    it("hides Protocol column when showProtocol is false", async () => {
      const logData = [createLog({ protocol: WorkoutProtocol.DROP_SET })];

      const result = await TableDataProcessor.processTableData(logData, {
        showProtocol: false,
      });

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      );
    });

    it("uses explicit columns parameter", async () => {
      const logData = [createLog()];
      const customColumns = ["Date", "Weight"];

      const result = await TableDataProcessor.processTableData(logData, {
        columns: customColumns,
      });

      // Should contain the custom columns plus Actions
      expect(result.headers).toContain("Date");
      expect(result.headers).toContain("Weight");
      expect(result.headers).toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS.value,
      );
    });

    it("parses string columns parameter as JSON", async () => {
      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(logData, {
        columns: '["Date", "Reps"]',
      });

      expect(result.headers).toContain("Date");
      expect(result.headers).toContain("Reps");
    });

    it("falls back to defaults for invalid JSON string columns", async () => {
      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(logData, {
        columns: "not valid json",
      });

      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value);
    });

    it("shows Duration column when custom field data exists", async () => {
      const logData = [
        createLog({ customFields: { duration: 120 } }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION.value,
      );
    });

    it("shows Distance column when custom field data exists", async () => {
      const logData = [
        createLog({ customFields: { distance: 5.2 } }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DISTANCE.value,
      );
    });

    it("shows Heart Rate column when custom field data exists", async () => {
      const logData = [
        createLog({ customFields: { heartRate: 145 } }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.HEART_RATE.value,
      );
    });

    it("hides custom field columns when values are zero", async () => {
      const logData = [
        createLog({ customFields: { duration: 0, distance: 0 } }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION.value,
      );
      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DISTANCE.value,
      );
    });

    it("strips .md extension from exercise names in rows", async () => {
      const logData = [createLog({ exercise: "Bench Press.md" })];

      const result = await TableDataProcessor.processTableData(logData, {});

      const exerciseIdx = result.headers.indexOf(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.EXERCISE.value,
      );
      if (exerciseIdx >= 0) {
        expect(result.rows[0].displayRow[exerciseIdx]).toBe("Bench Press");
      }
    });

    it("shows N/A for missing values", async () => {
      const logData = [
        createLog({ reps: undefined as unknown as number, weight: undefined as unknown as number }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {
        exercise: "Bench",
      });

      const repsIdx = result.headers.indexOf(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.REPS.value,
      );
      if (repsIdx >= 0) {
        expect(result.rows[0].displayRow[repsIdx]).toBe(
          t("table.notAvailable"),
        );
      }
    });

    it("maps abbreviated headers to data keys", async () => {
      const logData = [createLog({ weight: 100, reps: 8 })];

      const result = await TableDataProcessor.processTableData(logData, {
        columns: ["Wgt (kg)", "Rep"],
      });

      // Wgt (kg) should map to weight, Rep should map to reps
      const wgtIdx = result.headers.indexOf("Wgt (kg)");
      const repIdx = result.headers.indexOf("Rep");
      expect(result.rows[0].displayRow[wgtIdx]).toBe("100");
      expect(result.rows[0].displayRow[repIdx]).toBe("8");
    });

    it("uses exercise definition for columns when plugin provided", async () => {
      const mockPlugin = {
        getExerciseDefinitionService: jest.fn().mockReturnValue({
          getParametersForExercise: jest.fn().mockResolvedValue([
            { key: "reps", label: "Reps", unit: "" },
            { key: "weight", label: "Weight", unit: "kg" },
          ]),
        }),
      } as any;

      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(
        logData,
        { exercise: "Bench Press" },
        mockPlugin,
      );

      expect(result.headers).toContain("Date");
      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value);
    });

    it("falls back to defaults when exercise definition service returns null", async () => {
      const mockPlugin = {
        getExerciseDefinitionService: jest.fn().mockReturnValue(null),
      } as any;

      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(
        logData,
        { exercise: "Unknown Exercise" },
        mockPlugin,
      );

      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value);
    });

    it("falls back when getParametersForExercise returns empty", async () => {
      const mockPlugin = {
        getExerciseDefinitionService: jest.fn().mockReturnValue({
          getParametersForExercise: jest.fn().mockResolvedValue([]),
        }),
      } as any;

      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(
        logData,
        { exercise: "Unknown Exercise" },
        mockPlugin,
      );

      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value);
    });

    it("falls back when exercise definition throws", async () => {
      const mockPlugin = {
        getExerciseDefinitionService: jest.fn().mockReturnValue({
          getParametersForExercise: jest
            .fn()
            .mockRejectedValue(new Error("fail")),
        }),
      } as any;

      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(
        logData,
        { exercise: "Bench Press" },
        mockPlugin,
      );

      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value);
    });

    it("does not add Volume when exercise definition lacks reps or weight", async () => {
      const mockPlugin = {
        getExerciseDefinitionService: jest.fn().mockReturnValue({
          getParametersForExercise: jest.fn().mockResolvedValue([
            { key: "duration", label: "Duration", unit: "sec" },
            { key: "distance", label: "Distance", unit: "km" },
          ]),
        }),
      } as any;

      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(
        logData,
        { exercise: "Running" },
        mockPlugin,
      );

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value,
      );
      expect(result.headers).toContain("Dur (sec)");
      expect(result.headers).toContain("Dist (km)");
    });

    it("handles custom fields with string values in hasCustomField", async () => {
      const logData = [
        createLog({ customFields: { duration: "120" } }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION.value,
      );
    });

    it("ignores custom fields with empty string values", async () => {
      const logData = [
        createLog({ customFields: { duration: "" } }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION.value,
      );
    });

    it("ignores custom fields with null/undefined values", async () => {
      const logData = [
        createLog({ customFields: { duration: null as unknown as number } }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION.value,
      );
    });

    it("handles custom fields with zero string values", async () => {
      const logData = [
        createLog({ customFields: { duration: "0" } }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION.value,
      );
    });

    it("formats custom field values as N/A for zero numbers", async () => {
      const logData = [
        createLog({
          customFields: { duration: 0 },
        }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {
        columns: ["Duration"],
      });

      const durIdx = result.headers.indexOf("Duration");
      if (durIdx >= 0) {
        expect(result.rows[0].displayRow[durIdx]).toBe(
          t("table.notAvailable"),
        );
      }
    });

    it("shows N/A for exercise when empty", async () => {
      const logData = [createLog({ exercise: "" })];

      const result = await TableDataProcessor.processTableData(logData, {});

      const exerciseIdx = result.headers.indexOf(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.EXERCISE.value,
      );
      if (exerciseIdx >= 0) {
        expect(result.rows[0].displayRow[exerciseIdx]).toBe(
          t("table.notAvailable"),
        );
      }
    });

    it("includes protocol value in row data", async () => {
      const logData = [createLog({ protocol: WorkoutProtocol.DROP_SET })];

      const result = await TableDataProcessor.processTableData(logData, {});

      const protocolIdx = result.headers.indexOf(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      );
      if (protocolIdx >= 0) {
        expect(result.rows[0].displayRow[protocolIdx]).toBe(
          WorkoutProtocol.DROP_SET,
        );
      }
    });

    it("defaults protocol to standard when not specified", async () => {
      const logData = [createLog({ protocol: undefined })];

      // Force showing protocol column with a non-standard entry
      const dataWithProtocol = [
        ...logData,
        createLog({ protocol: WorkoutProtocol.MYO_REPS }),
      ];

      const result = await TableDataProcessor.processTableData(
        dataWithProtocol,
        {},
      );

      const protocolIdx = result.headers.indexOf(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      );
      if (protocolIdx >= 0) {
        expect(result.rows[0].displayRow[protocolIdx]).toBe(
          WorkoutProtocol.STANDARD,
        );
      }
    });

    it("handles non-array non-string columns type gracefully", async () => {
      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(logData, {
        columns: { invalid: true } as unknown as string[],
      });

      // Should fall back to defaults
      expect(result.headers).toContain(CONSTANTS.WORKOUT.TABLE.COLUMNS.DATE.value);
    });

    it("adds additional custom fields to base data map", async () => {
      const logData = [
        createLog({
          customFields: { myCustomField: "hello" },
        }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {
        columns: ["mycustomfield"],
      });

      const idx = result.headers.indexOf("mycustomfield");
      if (idx >= 0) {
        expect(result.rows[0].displayRow[idx]).toBe("hello");
      }
    });

    it("returns filter method and title in filterResult", async () => {
      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.filterResult.filterMethodUsed).toBe("table processing");
      expect(result.filterResult.titlePrefix).toBe(
        t("general.workoutLog"),
      );
    });

    it("handles notes with only whitespace as empty", async () => {
      const logData = [createLog({ notes: "   " })];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.NOTES.value,
      );
    });

    it("handles protocol with only whitespace as non-protocol", async () => {
      const logData = [
        createLog({ protocol: "   " as unknown as WorkoutProtocol }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {});

      expect(result.headers).not.toContain(
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      );
    });

    it("formats parameter header with unit", async () => {
      const mockPlugin = {
        getExerciseDefinitionService: jest.fn().mockReturnValue({
          getParametersForExercise: jest.fn().mockResolvedValue([
            { key: "weight", label: "Weight", unit: "kg" },
          ]),
        }),
      } as any;

      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(
        logData,
        { exercise: "Bench Press" },
        mockPlugin,
      );

      expect(result.headers).toContain("Wgt (kg)");
    });

    it("formats parameter header without unit", async () => {
      const mockPlugin = {
        getExerciseDefinitionService: jest.fn().mockReturnValue({
          getParametersForExercise: jest.fn().mockResolvedValue([
            { key: "reps", label: "Repetitions", unit: "" },
          ]),
        }),
      } as any;

      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(
        logData,
        { exercise: "Bench Press" },
        mockPlugin,
      );

      expect(result.headers).toContain("Rep");
    });

    it("uses non-abbreviated label when no abbreviation exists", async () => {
      const mockPlugin = {
        getExerciseDefinitionService: jest.fn().mockReturnValue({
          getParametersForExercise: jest.fn().mockResolvedValue([
            { key: "customParam", label: "CustomParam", unit: "units" },
          ]),
        }),
      } as any;

      const logData = [createLog()];

      const result = await TableDataProcessor.processTableData(
        logData,
        { exercise: "Bench Press" },
        mockPlugin,
      );

      expect(result.headers).toContain("CustomParam (units)");
    });

    it("formats boolean custom field value", async () => {
      const logData = [
        createLog({
          customFields: { flag: true },
        }),
      ];

      const result = await TableDataProcessor.processTableData(logData, {
        columns: ["flag"],
      });

      const idx = result.headers.indexOf("flag");
      if (idx >= 0) {
        expect(result.rows[0].displayRow[idx]).toBe("true");
      }
    });
  });
});

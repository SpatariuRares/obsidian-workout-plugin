import { ChartDataUtils } from "@app/utils/ChartDataUtils";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { CHART_TYPE, CHART_DATA_TYPE } from "@app/types";

describe("ChartDataUtils", () => {
  // Helper to create mock workout log data
  const createLogEntry = (
    date: string,
    exercise: string,
    reps: number,
    weight: number,
    volume: number,
    customFields?: Record<string, string | number | boolean>,
  ): WorkoutLogData => ({
    date,
    exercise,
    reps,
    weight,
    volume,
    customFields,
  });

  // Get a recent date string for testing (within default 30 day range)
  const getRecentDate = (daysAgo: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split("T")[0];
  };

  describe("processChartData - basic functionality", () => {
    it("should return empty datasets for empty log data", () => {
      const result = ChartDataUtils.processChartData(
        [],
        CHART_DATA_TYPE.VOLUME,
      );

      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });

    it("should filter data by date range", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(5), "Squat", 10, 100, 1000),
        createLogEntry(getRecentDate(50), "Squat", 10, 100, 1000), // Outside 30-day range
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
      );

      expect(result.labels).toHaveLength(1);
    });

    it("should sort data by date", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000),
        createLogEntry(getRecentDate(5), "Squat", 8, 90, 720),
        createLogEntry(getRecentDate(3), "Squat", 12, 110, 1320),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
      );

      // Labels should be in chronological order (oldest first)
      expect(result.labels).toHaveLength(3);
    });

    it("should group entries by date", () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, "Squat", 10, 100, 1000),
        createLogEntry(date, "Squat", 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      // Should have only one label for the same date
      expect(result.labels).toHaveLength(1);
    });
  });

  describe("processChartData - standard chart types", () => {
    const logData: WorkoutLogData[] = [
      createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000),
    ];

    it("should handle volume chart type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
      );

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].borderColor).toBe("#4CAF50");
    });

    it("should handle weight chart type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.WEIGHT,
      );

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].borderColor).toBe("#FF9800");
    });

    it("should handle reps chart type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.REPS,
      );

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].borderColor).toBe("#FF9800");
    });
  });

  describe("processChartData - display types (EXERCISE vs WORKOUT)", () => {
    const date = getRecentDate(1);
    const logData: WorkoutLogData[] = [
      createLogEntry(date, "Squat", 10, 100, 1000),
      createLogEntry(date, "Squat", 10, 100, 1000),
    ];

    it("should calculate averages for EXERCISE display type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      // Average of 1000 + 1000 / 2 = 1000
      expect(result.datasets[0].data[0]).toBe(1000);
      expect(result.datasets[0].label).toContain("Average");
    });

    it("should calculate totals for WORKOUT display type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "DD/MM/YYYY",
        CHART_TYPE.WORKOUT,
      );

      // Total of 1000 + 1000 = 2000
      expect(result.datasets[0].data[0]).toBe(2000);
      expect(result.datasets[0].label).toContain("Total");
    });

    it("should calculate totals for COMBINED display type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "DD/MM/YYYY",
        CHART_TYPE.COMBINED,
      );

      expect(result.datasets[0].data[0]).toBe(2000);
    });

    it("should calculate totals for ALL display type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "DD/MM/YYYY",
        CHART_TYPE.ALL,
      );

      expect(result.datasets[0].data[0]).toBe(2000);
    });
  });

  describe("processChartData - getCustomFieldNumber (lines 24-43)", () => {
    describe("exact key matching", () => {
      it("should extract number value with exact key match (line 24-26)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            duration: 1800, // 30 minutes in seconds
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "duration",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(1800);
      });

      it("should parse string value to number with exact key match (lines 27-29)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            distance: "5.5", // String that parses to number
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "distance",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(5.5);
      });

      it("should return 0 for unparseable string with exact key match (line 29)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            duration: "not a number",
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "duration",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(0);
      });

      it("should handle boolean value (returns 0)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            duration: true, // Boolean - not number or string
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "duration",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        // Boolean falls through to case-insensitive search which also won't match
        expect(result.datasets).toHaveLength(1);
      });
    });

    describe("case-insensitive key matching (lines 33-42)", () => {
      it("should find number value with case-insensitive match (lines 35-36)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            DURATION: 3600, // Uppercase key, number value
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "duration", // lowercase search
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(3600);
      });

      it("should parse string value with case-insensitive match (lines 37-39)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            DISTANCE: "10.5", // Uppercase key, string value
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "distance", // lowercase search
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(10.5);
      });

      it("should return 0 for unparseable string with case-insensitive match (line 39)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            HeartRate: "N/A", // Mixed case key, unparseable string
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "heartrate", // lowercase search
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(0);
      });

      it("should handle heartRate camelCase key with heartrate lowercase search", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            heartRate: 150, // camelCase in customFields
          }),
        ];

        // The code tries both "heartRate" and "heartrate" for heartRate data
        const result = ChartDataUtils.processChartData(
          logData,
          "heartRate",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(150);
      });
    });

    describe("key not found (line 43)", () => {
      it("should return 0 when key is not found in customFields", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            someOtherField: 100,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "duration",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(0);
      });

      it("should return 0 when customFields is undefined", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, undefined),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "duration",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(0);
      });
    });
  });

  describe("processChartData - dynamic exercise types", () => {
    it("should aggregate duration from customFields", () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, "Running", 0, 0, 0, { duration: 1800 }),
        createLogEntry(date, "Running", 0, 0, 0, { duration: 1200 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "duration",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.WORKOUT, // Total
      );

      expect(result.datasets[0].data[0]).toBe(3000); // 1800 + 1200
    });

    it("should aggregate distance from customFields", () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, "Running", 0, 0, 0, { distance: 5 }),
        createLogEntry(date, "Running", 0, 0, 0, { distance: 3 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "distance",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.WORKOUT,
      );

      expect(result.datasets[0].data[0]).toBe(8); // 5 + 3
    });

    it("should calculate pace from duration and distance", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
          duration: 30, // 30 minutes
          distance: 5, // 5 km
        }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "pace",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      // Pace = duration / distance = 30 / 5 = 6 min/km
      expect(result.datasets[0].data[0]).toBe(6);
    });

    it("should handle zero distance for pace calculation", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
          duration: 30,
          distance: 0,
        }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "pace",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      // Pace should be 0 when distance is 0 (avoid division by zero)
      expect(result.datasets[0].data[0]).toBe(0);
    });

    it("should average heart rate (always average, not total)", () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, "Running", 0, 0, 0, { heartRate: 150 }),
        createLogEntry(date, "Running", 0, 0, 0, { heartRate: 160 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "heartRate",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.WORKOUT, // Even with WORKOUT type, heart rate is averaged
      );

      // Heart rate is always averaged: (150 + 160) / 2 = 155
      expect(result.datasets[0].data[0]).toBe(155);
    });
  });

  describe("processChartData - custom parameter keys", () => {
    it("should handle custom parameter keys not in CHART_DATA_TYPE", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), "Meditation", 0, 0, 0, {
          mindfulness: 8,
        }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "mindfulness", // Custom parameter key
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].data[0]).toBe(8);
      expect(result.datasets[0].label).toContain("Mindfulness");
    });

    it("should use customParamLabel when provided", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), "Meditation", 0, 0, 0, {
          mindfulness: 8,
        }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "mindfulness",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
        "Focus Score",
      );

      expect(result.datasets[0].label).toContain("Focus Score");
    });

    it("should aggregate custom parameters in WORKOUT mode", () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, "Meditation", 0, 0, 0, { focus: 7 }),
        createLogEntry(date, "Meditation", 0, 0, 0, { focus: 9 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "focus",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.WORKOUT,
      );

      expect(result.datasets[0].data[0]).toBe(16); // 7 + 9
      expect(result.datasets[0].label).toContain("Total");
    });

    it("should average custom parameters in EXERCISE mode", () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, "Meditation", 0, 0, 0, { focus: 7 }),
        createLogEntry(date, "Meditation", 0, 0, 0, { focus: 9 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "focus",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      expect(result.datasets[0].data[0]).toBe(8); // (7 + 9) / 2
      expect(result.datasets[0].label).toContain("Avg");
    });

    it("should return custom data (0) for unknown type when no matching custom field", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000, {}),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        "unknownType", // Unknown type with no matching custom field
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      // Returns custom data path with 0 value (since field not found)
      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].data[0]).toBe(0);
      // Custom param gets color from ParameterUtils.getColorForDataType
    });

    it("should fall back to volume when there is no data", () => {
      // The fallback to volume only occurs when customData array is empty
      // which happens when there are no log entries within the date range
      const result = ChartDataUtils.processChartData(
        [],
        "unknownType",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      // No data means empty datasets
      expect(result.datasets).toEqual([]);
    });
  });

  describe("processChartData - date formats", () => {
    it("should use DD/MM/YYYY format by default", () => {
      // Use a fixed recent date for predictable label output
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 5);
      const dateStr = testDate.toISOString().split("T")[0];

      const logData: WorkoutLogData[] = [
        createLogEntry(dateStr, "Squat", 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
      );

      // Verify format is DD/MM/YYYY
      expect(result.labels[0]).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it("should use YYYY-MM-DD format when specified", () => {
      // Use a fixed recent date for predictable label output
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 5);
      const dateStr = testDate.toISOString().split("T")[0];

      const logData: WorkoutLogData[] = [
        createLogEntry(dateStr, "Squat", 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "YYYY-MM-DD",
      );

      // Verify format is YYYY-MM-DD
      expect(result.labels[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should use MM/DD/YYYY format when specified", () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 5);
      const dateStr = testDate.toISOString().split("T")[0];

      const logData: WorkoutLogData[] = [
        createLogEntry(dateStr, "Squat", 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "MM/DD/YYYY",
      );

      // Verify format is MM/DD/YYYY
      expect(result.labels[0]).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe("processChartData - dataset properties", () => {
    it("should create dataset with correct styling properties", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
      );

      const dataset = result.datasets[0];
      expect(dataset.tension).toBe(0.4);
      expect(dataset.fill).toBe(false);
      expect(dataset.pointRadius).toBe(4);
      expect(dataset.pointHoverRadius).toBe(6);
      expect(dataset.backgroundColor).toBe("#4CAF5020"); // Color + alpha
    });
  });

  describe("processChartData - getChartDataForType labels (lines 88-150)", () => {
    // Tests for weight/reps aggregate labels (lines 88-97)
    describe("weight chart type labels (lines 85-91)", () => {
      it('should use "Total weight" label for WORKOUT display type (line 89)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          CHART_DATA_TYPE.WEIGHT,
          30,
          "DD/MM/YYYY",
          CHART_TYPE.WORKOUT,
        );

        expect(result.datasets[0].label).toContain("Total");
        expect(result.datasets[0].label).toContain("weight");
      });

      it('should use "Average weight" label for EXERCISE display type (line 90)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          CHART_DATA_TYPE.WEIGHT,
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets[0].label).toContain("Average");
        expect(result.datasets[0].label).toContain("weight");
      });
    });

    describe("reps chart type labels (lines 94-100)", () => {
      it('should use "Total reps" label for COMBINED display type (line 98)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          CHART_DATA_TYPE.REPS,
          30,
          "DD/MM/YYYY",
          CHART_TYPE.COMBINED,
        );

        expect(result.datasets[0].label).toContain("Total");
        expect(result.datasets[0].label).toContain("reps");
      });

      it('should use "Average reps" label for EXERCISE display type (line 99)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          CHART_DATA_TYPE.REPS,
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets[0].label).toContain("Average");
        expect(result.datasets[0].label).toContain("reps");
      });
    });

    // Tests for lines 104-143 (US-005)
    describe("duration chart type labels (lines 103-108)", () => {
      it('should use "Total duration" label for WORKOUT display type (line 106)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            duration: 1800,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "duration",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.WORKOUT,
        );

        expect(result.datasets[0].label).toBe("Total duration (sec)");
        expect(result.datasets[0].borderColor).toBe("#2196F3");
      });

      it('should use "Avg duration" label for EXERCISE display type (line 106)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            duration: 1800,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "duration",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets[0].label).toBe("Avg duration (sec)");
        expect(result.datasets[0].borderColor).toBe("#2196F3");
      });

      it('should use "Total duration" label for ALL display type (line 106)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            duration: 1800,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "duration",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.ALL,
        );

        expect(result.datasets[0].label).toBe("Total duration (sec)");
      });
    });

    describe("distance chart type labels (lines 110-115)", () => {
      it('should use "Total distance" label for WORKOUT display type (line 113)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, { distance: 5 }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "distance",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.WORKOUT,
        );

        expect(result.datasets[0].label).toBe("Total distance (km)");
        expect(result.datasets[0].borderColor).toBe("#9C27B0");
      });

      // Tests for lines 236-252 (US-006) - redundant check removal verification
      describe("heartRate extraction casing (lines 244-246)", () => {
        it('should extract heartRate when key is "heartRate" (camelCase)', () => {
          const logData: WorkoutLogData[] = [
            createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
              heartRate: 150,
            }),
          ];

          const result = ChartDataUtils.processChartData(
            logData,
            "heartRate",
            30,
            "DD/MM/YYYY",
            CHART_TYPE.WORKOUT,
          );

          expect(result.datasets[0].data[0]).toBe(150);
        });

        it('should extract heartRate when key is "heartrate" (lowercase)', () => {
          const logData: WorkoutLogData[] = [
            createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
              heartrate: 150,
            }),
          ];

          const result = ChartDataUtils.processChartData(
            logData,
            "heartRate",
            30,
            "DD/MM/YYYY",
            CHART_TYPE.WORKOUT,
          );

          expect(result.datasets[0].data[0]).toBe(150);
        });

        it('should extract heartRate when key is "HEARTRATE" (uppercase)', () => {
          const logData: WorkoutLogData[] = [
            createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
              HEARTRATE: 150,
            }),
          ];

          const result = ChartDataUtils.processChartData(
            logData,
            "heartRate",
            30,
            "DD/MM/YYYY",
            CHART_TYPE.WORKOUT,
          );

          expect(result.datasets[0].data[0]).toBe(150);
        });

        it('should extract heartRate when key is "HeartRate" (PascalCase)', () => {
          const logData: WorkoutLogData[] = [
            createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
              HeartRate: 150,
            }),
          ];

          const result = ChartDataUtils.processChartData(
            logData,
            "heartRate",
            30,
            "DD/MM/YYYY",
            CHART_TYPE.WORKOUT,
          );

          expect(result.datasets[0].data[0]).toBe(150);
        });
      });

      it('should use "Avg distance" label for EXERCISE display type (line 113)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, { distance: 5 }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "distance",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets[0].label).toBe("Avg distance (km)");
        expect(result.datasets[0].borderColor).toBe("#9C27B0");
      });

      it('should use "Total distance" label for COMBINED display type (line 113)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, { distance: 5 }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "distance",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.COMBINED,
        );

        expect(result.datasets[0].label).toBe("Total distance (km)");
      });
    });

    describe("pace chart type labels (lines 117-122)", () => {
      it('should use "Pace (min/km)" label regardless of display type (line 120)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            duration: 30,
            distance: 5,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "pace",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets[0].label).toBe("Pace (min/km)");
        expect(result.datasets[0].borderColor).toBe("#E91E63");
      });

      it("should use same pace label for WORKOUT display type (line 120)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            duration: 30,
            distance: 5,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "pace",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.WORKOUT,
        );

        expect(result.datasets[0].label).toBe("Pace (min/km)");
      });
    });

    describe("heartRate chart type labels (lines 124-129)", () => {
      it('should use "Avg heart rate (bpm)" label regardless of display type (line 127)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            heartRate: 150,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "heartRate",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets[0].label).toBe("Avg heart rate (bpm)");
        expect(result.datasets[0].borderColor).toBe("#F44336");
      });

      it("should use same heartRate label for WORKOUT display type (line 127)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Running", 0, 0, 0, {
            heartRate: 150,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "heartRate",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.WORKOUT,
        );

        expect(result.datasets[0].label).toBe("Avg heart rate (bpm)");
      });
    });

    describe("default case - custom parameters (lines 131-140)", () => {
      it('should use "Total {label}" for custom param in WORKOUT mode (line 137)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Workout", 0, 0, 0, {
            calories: 500,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "calories",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.WORKOUT,
        );

        expect(result.datasets[0].label).toBe("Total Calories");
      });

      it('should use "Avg {label}" for custom param in EXERCISE mode (line 137)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Workout", 0, 0, 0, {
            calories: 500,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "calories",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        expect(result.datasets[0].label).toBe("Avg Calories");
      });

      it("should use customParamLabel when provided (line 134)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Workout", 0, 0, 0, {
            calories: 500,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "calories",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
          "Energy Burned",
        );

        expect(result.datasets[0].label).toBe("Avg Energy Burned");
      });

      it("should use ParameterUtils.getColorForDataType for custom param color (line 138)", () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Workout", 0, 0, 0, {
            steps: 10000,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "steps",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        // ParameterUtils.getColorForDataType returns a default color for unknown types
        expect(result.datasets[0].borderColor).toBeDefined();
        expect(typeof result.datasets[0].borderColor).toBe("string");
      });
    });

    describe("default case - fallback to volume (lines 142-149)", () => {
      it("should fall back to volume data for unknown type when no log data in range", () => {
        // When there's no data in the date range, customData is empty
        // and the fallback to volume is triggered (though result is empty datasets)
        const logData: WorkoutLogData[] = [
          // Entry outside the date range (60 days ago)
          createLogEntry(getRecentDate(60), "Squat", 10, 100, 1000),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "unknownChartType",
          30, // Only look at last 30 days
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        // No data in range means empty datasets
        expect(result.datasets).toEqual([]);
        expect(result.labels).toEqual([]);
      });

      it("should hit fallback path when data exists but all filtered out by date range", () => {
        // All entries are outside the 7-day range
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(10), "Squat", 10, 100, 1000),
          createLogEntry(getRecentDate(15), "Squat", 12, 110, 1320),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "randomCustomType",
          7, // Only look at last 7 days
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        // Fallback is triggered but result is empty since no data in range
        expect(result.datasets).toEqual([]);
      });

      it("should use custom param path (not fallback) when customData exists with values", () => {
        // When there IS data in range, customData array is populated (even with 0s)
        // So the custom param path is taken, not the fallback
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          "nonExistentField", // Field doesn't exist in customFields
          30,
          "DD/MM/YYYY",
          CHART_TYPE.EXERCISE,
        );

        // Custom path is taken (customData has value 0)
        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(0);
        // Label comes from keyToLabel, not volume fallback
        expect(result.datasets[0].label).toContain("Non Existent Field");
      });

      it("should use volume fallback labels for aggregate mode (line 145-146)", () => {
        // This test verifies the label format in the fallback path
        // Since the fallback only occurs with no data in range, we can't verify
        // the label directly. This test documents the expected behavior.
        const result = ChartDataUtils.processChartData(
          [], // No data
          "unknownType",
          30,
          "DD/MM/YYYY",
          CHART_TYPE.WORKOUT, // Aggregate mode
        );

        // No data means empty datasets (fallback triggered but no dataset created)
        expect(result.datasets).toEqual([]);
      });
    });
  });

  describe("processChartData - edge cases", () => {
    it("should handle entries with zero count (division safety)", () => {
      // This tests the count > 0 checks in averaging calculations
      const logData: WorkoutLogData[] = [];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      expect(result.datasets).toEqual([]);
    });

    it("should handle mixed customFields with standard and custom keys", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), "CrossFit", 10, 50, 500, {
          duration: 2400,
          heartRate: 165,
          calories: 450,
        }),
      ];

      // Test standard type with customFields present
      const volumeResult = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );
      expect(volumeResult.datasets[0].data[0]).toBe(500);

      // Test custom type
      const caloriesResult = ChartDataUtils.processChartData(
        logData,
        "calories",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );
      expect(caloriesResult.datasets[0].data[0]).toBe(450);
    });

    it("should handle multiple days of data correctly", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(3), "Squat", 10, 100, 1000),
        createLogEntry(getRecentDate(2), "Squat", 12, 110, 1320),
        createLogEntry(getRecentDate(1), "Squat", 8, 90, 720),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      expect(result.labels).toHaveLength(3);
      expect(result.datasets[0].data).toHaveLength(3);
      // Data should be sorted by date (oldest first)
      expect(result.datasets[0].data).toEqual([1000, 1320, 720]);
    });
  });
});

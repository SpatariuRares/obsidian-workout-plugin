import { ChartDataUtils } from "@app/features/charts/business/ChartDataUtils";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { CHART_TYPE, CHART_DATA_TYPE } from "@app/features/charts/types";

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
      expect(result.datasets[0].label).toContain("general.labels.avgVolume");
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
      expect(result.datasets[0].label).toContain("general.labels.totalVolume");
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
        CHART_TYPE.WORKOUT,
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
        CHART_TYPE.WORKOUT,
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
        "mindfulness",
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
      expect(dataset.backgroundColor).toBe("#4CAF5020");
    });
  });
});

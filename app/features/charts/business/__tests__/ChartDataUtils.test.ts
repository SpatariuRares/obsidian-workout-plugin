import { ChartDataUtils } from "@app/features/charts/business/ChartDataUtils";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  CHART_TYPE,
  CHART_DATA_TYPE,
} from "@app/features/charts/types";

// Mock i18n to return key with parameters for testing
jest.mock("@app/i18n", () => ({
  t: (key: string, params?: any) => {
    if (params && params.label) return `${key}:${params.label}`;
    if (params && params.unit) return `${key}(${params.unit})`;
    return key;
  },
}));

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

    it("charts every row it is given: DataFilter already applied dateRange", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry("2024-01-01", "Squat", 10, 100, 1000),
        createLogEntry("2024-03-01", "Squat", 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
      );

      expect(result.labels).toEqual(["01/01/2024", "01/03/2024"]);
    });

    it("draws the days in the order of the rows (the view sorts them)", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry("2024-02-01", "Squat", 8, 90, 720),
        createLogEntry("2024-02-03", "Squat", 12, 110, 1320),
        createLogEntry("2024-02-05", "Squat", 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
      );

      expect(result.labels).toEqual(["01/02/2024", "03/02/2024", "05/02/2024"]);
      expect(result.datasets[0].data).toEqual([720, 1320, 1000]);
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
      expect(result.datasets[0].label).toContain("avgVolume");
    });

    it("should handle weight chart type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.WEIGHT,
      );

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].label).toContain("avgWeight");
    });

    it("should handle reps chart type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.REPS,
      );

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].label).toBe("general.avgReps");
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
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      // Average of 1000 + 1000 / 2 = 1000
      expect(result.datasets[0].data[0]).toBe(1000);
      expect(result.datasets[0].label).toContain(
        "general.labels.avgVolume",
      );
    });

    it("should calculate totals for WORKOUT display type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        "DD/MM/YYYY",
        CHART_TYPE.WORKOUT,
      );

      // Total of 1000 + 1000 = 2000
      expect(result.datasets[0].data[0]).toBe(2000);
      expect(result.datasets[0].label).toContain(
        "general.labels.totalVolume",
      );
    });

    it("should show the heaviest set of the day for weight in WORKOUT display type", () => {
      const date = getRecentDate(1);
      const result = ChartDataUtils.processChartData(
        [
          createLogEntry(date, "Squat", 5, 100, 500),
          createLogEntry(date, "Curl", 10, 20, 200),
        ],
        CHART_DATA_TYPE.WEIGHT,
        "DD/MM/YYYY",
        CHART_TYPE.WORKOUT,
      );

      expect(result.datasets[0].data[0]).toBe(100);
    });

    it("should calculate totals for COMBINED display type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        "DD/MM/YYYY",
        CHART_TYPE.COMBINED,
      );

      expect(result.datasets[0].data[0]).toBe(2000);
    });

    it("should calculate totals for ALL display type", () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
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
        "DD/MM/YYYY",
        CHART_TYPE.WORKOUT,
      );

      // Heart rate is always averaged: (150 + 160) / 2 = 155
      expect(result.datasets[0].data[0]).toBe(155);
    });

    it("should chart a heart rate logged under an HR column", () => {
      const date = getRecentDate(1);
      const result = ChartDataUtils.processChartData(
        [createLogEntry(date, "Running", 0, 0, 0, { HR: 150 })],
        "heartRate",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
      );

      expect(result.datasets[0].data[0]).toBe(150);
    });

    it("should chart a duration logged under a Duration (s) column", () => {
      const date = getRecentDate(1);
      const result = ChartDataUtils.processChartData(
        [createLogEntry(date, "Plank", 0, 0, 0, { "Duration (s)": 60 })],
        "duration",
        30,
        "DD/MM/YYYY",
        CHART_TYPE.WORKOUT,
      );

      expect(result.datasets[0].data[0]).toBe(60);
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
        "DD/MM/YYYY",
        CHART_TYPE.EXERCISE,
        "Focus Score",
      );

      expect(result.datasets[0].label).toContain("Focus Score");
    });
  });

  describe("processChartData - dataset properties", () => {
    it("should leave styling to ChartConfigBuilder", () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), "Squat", 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
      );

      expect(Object.keys(result.datasets[0]).sort()).toEqual([
        "data",
        "label",
      ]);
    });
  });
});

describe("ChartDataUtils.limitToLatest", () => {
  const labels = ["d1", "d2", "d3", "d4"];
  const datasets = [
    { label: "Volume", data: [1, 2, 3, 4] },
    { label: "Weight", data: [10, 20, 30, 40] },
  ];

  it("keeps only the latest N points in labels and every dataset", () => {
    const result = ChartDataUtils.limitToLatest(labels, datasets, 2);

    expect(result.labels).toEqual(["d3", "d4"]);
    expect(result.datasets.map((d) => d.data)).toEqual([
      [3, 4],
      [30, 40],
    ]);
  });

  it("returns data unchanged without a limit or when under the limit", () => {
    expect(ChartDataUtils.limitToLatest(labels, datasets).labels).toEqual(
      labels,
    );
    expect(
      ChartDataUtils.limitToLatest(labels, datasets, 10).labels,
    ).toEqual(labels);
  });

  it("does not mutate the input datasets", () => {
    ChartDataUtils.limitToLatest(labels, datasets, 1);

    expect(datasets[0].data).toEqual([1, 2, 3, 4]);
  });
});

describe("ChartDataUtils - points by training day", () => {
  const set = (date: string, volume: number): WorkoutLogData => ({
    date,
    exercise: "Squat",
    reps: 5,
    weight: volume / 5,
    volume,
  });

  // Jest runs in Europe/Rome; read local fields as in New York (UTC-5).
  const inNewYork = (run: () => void) => {
    const shifted = (d: Date) => new Date(d.getTime() - 5 * 60 * 60 * 1000);
    const spies = [
      jest
        .spyOn(Date.prototype, "getDate")
        .mockImplementation(function (this: Date) {
          return shifted(this).getUTCDate();
        }),
      jest
        .spyOn(Date.prototype, "getMonth")
        .mockImplementation(function (this: Date) {
          return shifted(this).getUTCMonth();
        }),
      jest
        .spyOn(Date.prototype, "getFullYear")
        .mockImplementation(function (this: Date) {
          return shifted(this).getUTCFullYear();
        }),
    ];
    try {
      run();
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  };

  it.each([
    CHART_DATA_TYPE.VOLUME,
    CHART_DATA_TYPE.WEIGHT,
    CHART_DATA_TYPE.REPS,
  ])("keeps a date-only set on its day west of UTC (%s)", (type) => {
    inNewYork(() => {
      const result = ChartDataUtils.processChartData(
        [set("2024-01-15", 500), set("2024-01-16", 600)],
        type,
      );

      expect(result.labels).toEqual(["15/01/2024", "16/01/2024"]);
    });
  });

  it("puts a set logged just after local midnight on that day", () => {
    const result = ChartDataUtils.processChartData(
      [set("2024-01-15", 500), set("2024-01-15T23:30:00.000Z", 600)],
      CHART_DATA_TYPE.VOLUME,
      "YYYY-MM-DD",
      CHART_TYPE.WORKOUT,
    );

    // 23:30 UTC is 00:30 on the 16th in Rome
    expect(result.labels).toEqual(["2024-01-15", "2024-01-16"]);
    expect(result.datasets[0].data).toEqual([500, 600]);
  });

  it("makes one point of a day whatever form its dates take", () => {
    const result = ChartDataUtils.processChartData(
      [set("2024-01-16", 500), set("2024-01-15T23:30:00.000Z", 600)],
      CHART_DATA_TYPE.VOLUME,
      "YYYY-MM-DD",
      CHART_TYPE.WORKOUT,
    );

    expect(result.labels).toEqual(["2024-01-16"]);
    expect(result.datasets[0].data).toEqual([1100]);
  });
});


import {
  getMatchScore,
  findExerciseMatches,
  determineExerciseFilterStrategy,
  filterLogDataByExercise,
  processChartData,
  validateUserParams,
  formatDate,
  calculateTrendLine,
  ExerciseMatch,
} from "../utils";
import { TFile } from "obsidian";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { ChartDataType, ChartType } from "@app/types/ChartTypes";

// Mock TFile
class MockTFile {
  path: string;
  basename: string;

  constructor(path: string) {
    this.path = path;
    this.basename = path.split("/").pop()?.replace(".md", "") || "";
  }
}

// Mock WorkoutLogData
const createMockLog = (
  exercise: string,
  date: string,
  volume: number,
  weight: number,
  reps: number,
  filePath: string
): WorkoutLogData => {
  const file = new MockTFile(filePath) as TFile;
  return {
    date,
    exercise,
    reps,
    weight,
    volume,
    origine: "test",
    workout: "Test Workout",
    timestamp: new Date(date).getTime(),
    file,
  };
};

describe("utils.ts", () => {
  describe("getMatchScore", () => {
    it("should return 100 for exact match", () => {
      expect(getMatchScore("Squat", "Squat")).toBe(100);
      expect(getMatchScore("squat", "SQUAT")).toBe(100);
    });

    it("should return 90 for starts with match", () => {
      expect(getMatchScore("Squat", "Squat Barbell")).toBe(90);
      expect(getMatchScore("Bench Press", "Bench")).toBe(90);
    });

    it("should return 80 for ends with match", () => {
      expect(getMatchScore("Barbell Squat", "Squat")).toBe(80);
      expect(getMatchScore("Press", "Bench Press")).toBe(80);
    });

    it("should return 70 when all words from one string are in the other", () => {
      expect(getMatchScore("Hip Thrust", "Hip Thrust Barbell")).toBe(90); // startsWith match
      expect(getMatchScore("Barbell Hip Thrust", "Hip Thrust")).toBe(80); // endsWith match
    });

    it("should return 60 for partial word matches", () => {
      expect(getMatchScore("Squat Jump", "Squat Barbell")).toBe(60);
    });

    it("should return 50 for substring match", () => {
      expect(getMatchScore("Lat", "Lateral Raise")).toBe(90); // startsWith match
      expect(getMatchScore("Lateral Raise", "Lat")).toBe(90); // startsWith match
    });

    it("should return 0 for no match", () => {
      expect(getMatchScore("Squat", "Bench Press")).toBe(0);
    });

    it("should handle empty strings", () => {
      expect(getMatchScore("", "")).toBe(100);
      expect(getMatchScore("", "Squat")).toBe(90); // empty string startsWith match
    });

    it("should trim whitespace", () => {
      expect(getMatchScore("  Squat  ", "Squat")).toBe(100);
    });
  });

  describe("findExerciseMatches", () => {
    const mockData: WorkoutLogData[] = [
      createMockLog("Squat", "2024-01-15T10:00:00", 1000, 100, 10, "Squat.md"),
      createMockLog(
        "Barbell Squat",
        "2024-01-16T10:00:00",
        1200,
        120,
        10,
        "Squat Barbell.md"
      ),
      createMockLog(
        "Bench Press",
        "2024-01-17T10:00:00",
        800,
        80,
        10,
        "Bench Press.md"
      ),
    ];

    it("should find filename matches", () => {
      const result = findExerciseMatches(mockData, "Squat");
      expect(result.fileNameMatches.length).toBeGreaterThan(0);
      expect(result.fileNameMatches[0].strategy).toBe("filename");
    });

    it("should find exercise field matches", () => {
      const result = findExerciseMatches(mockData, "Squat");
      expect(result.allExercisePathsAndScores.size).toBeGreaterThan(0);
      expect(result.allExercisePathsAndScores.has("Squat")).toBe(true);
    });

    it("should calculate scores for matches", () => {
      const result = findExerciseMatches(mockData, "Squat");
      const squatScore = result.allExercisePathsAndScores.get("Squat");
      expect(squatScore).toBe(100); // Exact match
    });

    it("should handle no matches", () => {
      const result = findExerciseMatches(mockData, "Deadlift");
      expect(result.fileNameMatches.length).toBe(0);
      expect(result.allExercisePathsAndScores.size).toBe(0);
    });

    it("should find partial matches", () => {
      const result = findExerciseMatches(mockData, "Press");
      expect(result.allExercisePathsAndScores.has("Bench Press")).toBe(true);
    });
  });

  describe("determineExerciseFilterStrategy", () => {
    const mockMatches: ExerciseMatch[] = [
      {
        file: new MockTFile("Squat.md") as TFile,
        score: 100,
        exerciseName: "Squat",
        strategy: "filename",
      },
    ];

    const mockScores = new Map<string, number>([
      ["Squat", 100],
      ["Barbell Squat", 90],
    ]);

    it("should return exercise_field_exact for exact match on exercise field", () => {
      const result = determineExerciseFilterStrategy(
        mockMatches,
        mockScores,
        true,
        "Squat"
      );
      expect(result.bestStrategy).toBe("exercise_field_exact");
      expect(result.bestPathKey).toBe("Squat");
    });

    it("should return filename_exact for exact match on filename", () => {
      const scoresNoExact = new Map<string, number>([["Barbell Squat", 90]]);
      const result = determineExerciseFilterStrategy(
        mockMatches,
        scoresNoExact,
        true,
        "Squat"
      );
      expect(result.bestStrategy).toBe("filename_exact");
      expect(result.bestFileMatchesList.length).toBeGreaterThan(0);
    });

    it("should return none when no exact match found in exact mode", () => {
      const result = determineExerciseFilterStrategy(
        [],
        new Map(),
        true,
        "Nonexistent"
      );
      expect(result.bestStrategy).toBe("none");
    });

    it("should use filename strategy when score is above threshold", () => {
      const highScoreMatches: ExerciseMatch[] = [
        {
          file: new MockTFile("Squat.md") as TFile,
          score: 90,
          exerciseName: "Squat",
          strategy: "filename",
        },
      ];
      const result = determineExerciseFilterStrategy(
        highScoreMatches,
        new Map(),
        false,
        "Squat"
      );
      expect(result.bestStrategy).toBe("filename");
    });

    it("should use exercise_field strategy when score is higher than filename", () => {
      const lowScoreMatches: ExerciseMatch[] = [
        {
          file: new MockTFile("Squat.md") as TFile,
          score: 70,
          exerciseName: "Squat",
          strategy: "filename",
        },
      ];
      const highScores = new Map<string, number>([["Barbell Squat", 90]]);
      const result = determineExerciseFilterStrategy(
        lowScoreMatches,
        highScores,
        false,
        "Barbell Squat"
      );
      expect(result.bestStrategy).toBe("exercise_field");
      expect(result.bestPathKey).toBe("Barbell Squat");
    });

    it("should return none when scores are below threshold", () => {
      const lowScoreMatches: ExerciseMatch[] = [
        {
          file: new MockTFile("Squat.md") as TFile,
          score: 50,
          exerciseName: "Squat",
          strategy: "filename",
        },
      ];
      const result = determineExerciseFilterStrategy(
        lowScoreMatches,
        new Map(),
        false,
        "Squat"
      );
      expect(result.bestStrategy).toBe("none");
    });
  });

  describe("filterLogDataByExercise", () => {
    const mockData: WorkoutLogData[] = [
      createMockLog("Squat", "2024-01-15T10:00:00", 1000, 100, 10, "Squat.md"),
      createMockLog(
        "Barbell Squat",
        "2024-01-16T10:00:00",
        1200,
        120,
        10,
        "Squat Barbell.md"
      ),
      createMockLog(
        "Bench Press",
        "2024-01-17T10:00:00",
        800,
        80,
        10,
        "Bench Press.md"
      ),
    ];

    it("should filter by exercise_field_exact strategy", () => {
      const result = filterLogDataByExercise(
        mockData,
        "exercise_field_exact",
        "Squat",
        []
      );
      expect(result.length).toBe(1);
      expect(result[0].exercise).toBe("Squat");
    });

    it("should filter by filename_exact strategy", () => {
      const matches: ExerciseMatch[] = [
        {
          file: new MockTFile("Squat.md") as TFile,
          score: 100,
          exerciseName: "Squat",
          strategy: "filename",
        },
      ];
      const result = filterLogDataByExercise(
        mockData,
        "filename_exact",
        "",
        matches
      );
      expect(result.length).toBe(1);
      expect(result[0].file?.basename).toBe("Squat");
    });

    it("should filter by filename strategy", () => {
      const matches: ExerciseMatch[] = [
        {
          file: new MockTFile("Squat.md") as TFile,
          score: 90,
          exerciseName: "Squat",
          strategy: "filename",
        },
      ];
      const result = filterLogDataByExercise(mockData, "filename", "", matches);
      expect(result.length).toBe(1);
    });

    it("should filter by exercise_field strategy", () => {
      const result = filterLogDataByExercise(
        mockData,
        "exercise_field",
        "Squat",
        []
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return empty array for unknown strategy", () => {
      const result = filterLogDataByExercise(mockData, "unknown", "Squat", []);
      expect(result).toEqual([]);
    });
  });

  describe("processChartData", () => {
    // Use dates within the last 30 days
    const today = new Date();
    const date1 = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const date2 = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago

    const mockData: WorkoutLogData[] = [
      createMockLog("Squat", date1.toISOString(), 1000, 100, 10, "Squat.md"),
      createMockLog("Squat", date1.toISOString(), 1200, 120, 10, "Squat.md"),
      createMockLog("Squat", date2.toISOString(), 1500, 150, 10, "Squat.md"),
    ];

    it("should process volume chart data for exercise", () => {
      const result = processChartData(
        mockData,
        "volume",
        30,
        "DD/MM/YYYY",
        ChartType.EXERCISE
      );
      expect(result.labels.length).toBeGreaterThan(0);
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].label).toContain("Volume Medio");
    });

    it("should process volume chart data for workout", () => {
      const result = processChartData(
        mockData,
        "volume",
        30,
        "DD/MM/YYYY",
        ChartType.WORKOUT
      );
      expect(result.datasets[0].label).toContain("Volume Totale");
    });

    it("should process weight chart data", () => {
      const result = processChartData(mockData, "weight", 30);
      expect(result.datasets[0].label).toContain("Peso");
    });

    it("should process reps chart data", () => {
      const result = processChartData(mockData, "reps", 30);
      expect(result.datasets[0].label).toContain("Reps");
    });

    it("should filter data by date range", () => {
      const oldDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
      const oldData: WorkoutLogData[] = [
        createMockLog(
          "Squat",
          oldDate.toISOString(),
          1000,
          100,
          10,
          "Squat.md"
        ),
      ];
      const result = processChartData(oldData, "volume", 30);
      expect(result.labels.length).toBe(0);
    });

    it("should group data by date", () => {
      const result = processChartData(mockData, "volume", 30);
      // Two dates in mock data: date1 and date2
      expect(result.labels.length).toBe(2);
    });

    it("should calculate average for exercise display type", () => {
      const result = processChartData(
        mockData,
        "volume",
        30,
        "DD/MM/YYYY",
        ChartType.EXERCISE
      );
      // Data is sorted by date, so date2 (6 days ago) comes first, then date1 (5 days ago)
      // date2 has 1 log with volume 1500, average = 1500
      // date1 has 2 logs with volumes 1000 and 1200, average = 1100
      expect(result.datasets[0].data[0]).toBe(1500);
      expect(result.datasets[0].data[1]).toBe(1100);
    });

    it("should calculate total for workout display type", () => {
      const result = processChartData(
        mockData,
        "volume",
        30,
        "DD/MM/YYYY",
        ChartType.WORKOUT
      );
      // Data is sorted by date, so date2 (6 days ago) comes first, then date1 (5 days ago)
      // date2 has 1 log with volume 1500, total = 1500
      // date1 has 2 logs with volumes 1000 and 1200, total = 2200
      expect(result.datasets[0].data[0]).toBe(1500);
      expect(result.datasets[0].data[1]).toBe(2200);
    });

    it("should handle different date formats", () => {
      const result = processChartData(mockData, "volume", 30, "YYYY-MM-DD");
      expect(result.labels[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("validateUserParams", () => {
    it("should validate dateRange parameter", () => {
      const errors = validateUserParams({ dateRange: 400 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("dateRange");
    });

    it("should accept valid dateRange", () => {
      const errors = validateUserParams({ dateRange: 30 });
      expect(errors.length).toBe(0);
    });

    it("should validate limit parameter", () => {
      const errors = validateUserParams({ limit: 2000 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("limit");
    });

    it("should accept valid limit", () => {
      const errors = validateUserParams({ limit: 100 });
      expect(errors.length).toBe(0);
    });

    it("should validate chartType parameter", () => {
      const errors = validateUserParams({ chartType: "invalid" as ChartType });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("chartType");
    });

    it("should accept valid chartType", () => {
      const errors = validateUserParams({ chartType: ChartType.EXERCISE });
      expect(errors.length).toBe(0);
    });

    it("should validate type parameter for charts", () => {
      const errors = validateUserParams({ type: "invalid" as ChartDataType });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("type");
    });

    it("should accept valid type", () => {
      const errors = validateUserParams({ type: ChartDataType.VOLUME });
      expect(errors.length).toBe(0);
    });

    it("should validate duration parameter for timers", () => {
      const errors = validateUserParams({ duration: 5000 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("duration");
    });

    it("should accept valid duration", () => {
      const errors = validateUserParams({ duration: 120 });
      expect(errors.length).toBe(0);
    });

    it("should return multiple errors for multiple invalid params", () => {
      const errors = validateUserParams({
        dateRange: 400,
        limit: 2000,
        type: "invalid" as ChartDataType,
      });
      expect(errors.length).toBe(3);
    });

    it("should handle NaN values", () => {
      const errors = validateUserParams({
        dateRange: "abc" as unknown as number,
      });
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("formatDate", () => {
    const testDate = new Date("2024-01-15T10:30:00");

    it("should format as DD/MM/YYYY by default", () => {
      expect(formatDate(testDate)).toBe("15/01/2024");
    });

    it("should format as YYYY-MM-DD", () => {
      expect(formatDate(testDate, "YYYY-MM-DD")).toBe("2024-01-15");
    });

    it("should format as MM/DD/YYYY", () => {
      expect(formatDate(testDate, "MM/DD/YYYY")).toBe("01/15/2024");
    });

    it("should format as DD/MM/YYYY when specified", () => {
      expect(formatDate(testDate, "DD/MM/YYYY")).toBe("15/01/2024");
    });

    it("should handle string dates", () => {
      expect(formatDate("2024-01-15T10:30:00", "YYYY-MM-DD")).toBe(
        "2024-01-15"
      );
    });

    it("should pad single digits with zero", () => {
      const date = new Date("2024-01-05T10:30:00");
      expect(formatDate(date, "DD/MM/YYYY")).toBe("05/01/2024");
    });

    it("should handle invalid format by using default", () => {
      expect(formatDate(testDate, "INVALID" as "DD/MM/YYYY")).toBe(
        "15/01/2024"
      );
    });
  });

  describe("calculateTrendLine", () => {
    it("should calculate trend line for increasing data", () => {
      const data = [1, 2, 3, 4, 5];
      const result = calculateTrendLine(data);
      expect(result.slope).toBeCloseTo(1, 1);
      expect(result.intercept).toBeCloseTo(1, 1);
    });

    it("should calculate trend line for decreasing data", () => {
      const data = [5, 4, 3, 2, 1];
      const result = calculateTrendLine(data);
      expect(result.slope).toBeCloseTo(-1, 1);
    });

    it("should return zero slope for flat data", () => {
      const data = [5, 5, 5, 5, 5];
      const result = calculateTrendLine(data);
      expect(result.slope).toBeCloseTo(0, 1);
      expect(result.intercept).toBeCloseTo(5, 1);
    });

    it("should return zero for data with less than 2 points", () => {
      const result = calculateTrendLine([1]);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
    });

    it("should return zero for empty array", () => {
      const result = calculateTrendLine([]);
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
    });

    it("should calculate trend for real workout data", () => {
      const data = [1000, 1100, 1050, 1200, 1250];
      const result = calculateTrendLine(data);
      expect(result.slope).toBeGreaterThan(0); // Positive trend
    });

    it("should handle negative values", () => {
      const data = [-5, -3, -1, 1, 3];
      const result = calculateTrendLine(data);
      expect(result.slope).toBeCloseTo(2, 1);
    });
  });
});

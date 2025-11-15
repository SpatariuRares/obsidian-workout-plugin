import { DataFilter } from "@app/services/data/DataFilter";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedChartParams } from "@app/types";
import {
  findExerciseMatches,
  determineExerciseFilterStrategy,
  filterLogDataByExercise,
} from "@app/utils/utils";
import { TFile } from "obsidian";

// Mock utility functions to isolate DataFilter logic for more complex tests
jest.mock("@app/utils/utils", () => ({
  ...jest.requireActual("@app/utils/utils"),
  findExerciseMatches: jest.fn(),
  determineExerciseFilterStrategy: jest.fn(),
  filterLogDataByExercise: jest.fn(),
}));

const mockLogData: WorkoutLogData[] = [
  {
    date: "2024-01-01",
    exercise: "Squat",
    reps: 5,
    weight: 100,
    volume: 1500,
    origine: "[[Strength Training]]",
  },
  {
    date: "2024-01-15",
    exercise: "Bench Press",
    reps: 5,
    weight: 80,
    volume: 1200,
    origine: "[[Strength Training]]",
  },
  {
    date: "2024-02-01",
    exercise: "Deadlift",
    reps: 5,
    weight: 120,
    volume: 600,
    workout: "Full Body Workout",
  },
  {
    date: "2024-02-10",
    exercise: "Squat",
    reps: 6,
    weight: 105,
    volume: 1890,
    workout: "Leg Day",
  },
  {
    date: "2024-02-12",
    exercise: "   SQUAT   ",
    reps: 6,
    weight: 105,
    volume: 1890,
    workout: "Leg Day",
  },
];

describe("DataFilter", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("filterData", () => {
    it("should return all data when no filters are provided", () => {
      const params: Partial<EmbeddedChartParams> = {};
      const result = DataFilter.filterData(
        mockLogData,
        params as EmbeddedChartParams,
        false
      );
      expect(result.filteredData).toHaveLength(mockLogData.length);
      expect(result.filterMethodUsed).toBe("none");
    });

    it("should return empty array if logData is null or empty", () => {
      const params: Partial<EmbeddedChartParams> = {};
      expect(
        DataFilter.filterData([], params as EmbeddedChartParams, false)
          .filteredData
      ).toHaveLength(0);
      expect(
        DataFilter.filterData(
          null as unknown as WorkoutLogData[],
          params as EmbeddedChartParams,
          false
        ).filteredData
      ).toHaveLength(0);
    });

    describe("Workout Filtering", () => {
      it('should filter by workout name using the "workout" field', () => {
        const params: Partial<EmbeddedChartParams> = { workout: "Leg Day" };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );
        expect(result.filteredData).toHaveLength(2);
        expect(result.filteredData[0].workout).toBe("Leg Day");
        expect(result.filteredData[1].workout).toBe("Leg Day");
        expect(result.titlePrefix).toBe("Leg Day");
        expect(result.filterMethodUsed).toBe('campo Origine:: "Leg Day"');
      });

      it('should filter by workout name using the "origine" field and handle wiki links', () => {
        const params: Partial<EmbeddedChartParams> = {
          workout: "Strength Training",
        };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );
        expect(result.filteredData).toHaveLength(2);
        expect(result.filteredData[0].origine).toBe("[[Strength Training]]");
        expect(result.filterMethodUsed).toContain("Strength Training");
      });

      it("should be case-insensitive and trim whitespace for workout filtering", () => {
        const params: Partial<EmbeddedChartParams> = {
          workout: "  full body workout  ",
        };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );
        expect(result.filteredData).toHaveLength(1);
        expect(result.filteredData[0].exercise).toBe("Deadlift");
      });
    });

    describe("Exercise Filtering (Exact Match)", () => {
      it("should filter by exercise name with exactMatch: true", () => {
        const params: Partial<EmbeddedChartParams> = {
          exercise: "Bench Press",
          exactMatch: true,
        };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );
        expect(result.filteredData).toHaveLength(1);
        expect(result.filteredData[0].exercise).toBe("Bench Press");
        expect(result.titlePrefix).toBe("Bench Press");
        expect(result.filterMethodUsed).toBe(
          'exact match on exercise field: "Bench Press"'
        );
      });

      it("should be case-insensitive and trim whitespace for exact exercise filtering", () => {
        const params: Partial<EmbeddedChartParams> = {
          exercise: "   squat   ",
          exactMatch: true,
        };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );
        // It will match 'Squat' and '   SQUAT   '
        expect(result.filteredData).toHaveLength(3);
        expect(result.filterMethodUsed).toContain("exact match");
      });

      it("should return no results if exact exercise not found", () => {
        const params: Partial<EmbeddedChartParams> = {
          exercise: "Non-existent",
          exactMatch: true,
        };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );
        expect(result.filteredData).toHaveLength(0);
      });
    });

    describe("Combined Filtering (AND logic)", () => {
      it("should filter by both workout and exercise (exact)", () => {
        const params: Partial<EmbeddedChartParams> = {
          workout: "Leg Day",
          exercise: "Squat",
          exactMatch: true,
        };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );
        expect(result.filteredData).toHaveLength(2);
        expect(result.filteredData[0].exercise).toBe("Squat");
        expect(result.filteredData[1].exercise).toBe("   SQUAT   ");
        expect(result.filterMethodUsed).toBe(
          'campo Origine:: "Leg Day" + exact match on exercise field: "Squat"'
        );
      });

      it("should return empty if workout matches but exercise does not", () => {
        const params: Partial<EmbeddedChartParams> = {
          workout: "Leg Day",
          exercise: "Bench Press",
          exactMatch: true,
        };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );
        expect(result.filteredData).toHaveLength(0);
      });

      it("should return empty if workout does not exist", () => {
        const params: Partial<EmbeddedChartParams> = {
          workout: "Non-existent Day",
          exercise: "Squat",
          exactMatch: true,
        };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );
        expect(result.filteredData).toHaveLength(0);
        expect(result.filterMethodUsed).toBe("No data found for workout");
      });
    });

    describe("Fuzzy Exercise Filtering (Mocked)", () => {
      const mockFindExerciseMatches =
        findExerciseMatches as jest.MockedFunction<typeof findExerciseMatches>;
      const mockDetermineExerciseFilterStrategy =
        determineExerciseFilterStrategy as jest.MockedFunction<
          typeof determineExerciseFilterStrategy
        >;
      const mockFilterLogDataByExercise =
        filterLogDataByExercise as jest.MockedFunction<
          typeof filterLogDataByExercise
        >;

      it("should call fuzzy matching utilities when exactMatch is false", () => {
        const params: Partial<EmbeddedChartParams> = { exercise: "sqwat" };

        // Setup mocks
        const mockMatchesResult = {
          fileNameMatches: [],
          allExercisePathsAndScores: new Map([["Squat", 90]]),
          bestStrategy: "",
          bestPathKey: "",
        };
        const mockStrategy = {
          bestStrategy: "field",
          bestPathKey: "Squat",
          bestFileMatchesList: [],
        };
        const filteredByUtil = [mockLogData[0]];

        mockFindExerciseMatches.mockReturnValue(mockMatchesResult);
        mockDetermineExerciseFilterStrategy.mockReturnValue(mockStrategy);
        mockFilterLogDataByExercise.mockReturnValue(filteredByUtil);

        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          true
        );

        expect(mockFindExerciseMatches).toHaveBeenCalledWith(
          mockLogData,
          "sqwat"
        );
        expect(mockDetermineExerciseFilterStrategy).toHaveBeenCalled();
        expect(mockFilterLogDataByExercise).toHaveBeenCalledWith(
          mockLogData,
          "field",
          "Squat",
          []
        );
        expect(result.filteredData).toEqual(filteredByUtil);
        expect(result.filterMethodUsed).toBe(
          'Exercise field:: "Squat" (score: 90)'
        );
      });

      it("should use filename strategy when determined", () => {
        const params: Partial<EmbeddedChartParams> = { exercise: "bench" };
        const mockMatchesResult = {
          fileNameMatches: [],
          allExercisePathsAndScores: new Map(),
          bestStrategy: "",
          bestPathKey: "",
        };
        const mockFileMatch = {
          file: {} as TFile,
          score: 85,
          exerciseName: "log2.md",
          strategy: "filename",
        };
        const mockStrategy = {
          bestStrategy: "filename",
          bestPathKey: "",
          bestFileMatchesList: [mockFileMatch],
        };

        mockFindExerciseMatches.mockReturnValue(mockMatchesResult);
        mockDetermineExerciseFilterStrategy.mockReturnValue(mockStrategy);
        mockFilterLogDataByExercise.mockReturnValue([mockLogData[1]]);

        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );

        expect(mockFilterLogDataByExercise).toHaveBeenCalledWith(
          mockLogData,
          "filename",
          "",
          [mockFileMatch]
        );
        expect(result.filteredData).toHaveLength(1);
        expect(result.filterMethodUsed).toBe("file name (score: 85)");
      });

      it("should handle no match found", () => {
        const params: Partial<EmbeddedChartParams> = {
          exercise: "nonexistent",
        };
        const mockMatchesResult = {
          fileNameMatches: [],
          allExercisePathsAndScores: new Map(),
          bestStrategy: "",
          bestPathKey: "",
        };
        const mockStrategy = {
          bestStrategy: "none",
          bestPathKey: "",
          bestFileMatchesList: [],
        };

        mockFindExerciseMatches.mockReturnValue(mockMatchesResult);
        mockDetermineExerciseFilterStrategy.mockReturnValue(mockStrategy);
        mockFilterLogDataByExercise.mockReturnValue([]);

        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
          false
        );

        expect(result.filteredData).toHaveLength(0);
        expect(result.filterMethodUsed).toBe("No match found");
      });
    });
  });
});

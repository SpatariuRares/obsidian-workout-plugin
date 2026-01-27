import { CONSTANTS } from "@app/constants/Constants";
import { DataFilter } from "@app/services/data/DataFilter";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { EmbeddedChartParams, EmbeddedTableParams } from "@app/types";
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

// Mock data with protocol field for protocol filtering tests
const mockLogDataWithProtocol: WorkoutLogData[] = [
  {
    date: "2024-01-01",
    exercise: "Squat",
    reps: 5,
    weight: 100,
    volume: 1500,
    origine: "[[Strength Training]]",
    protocol: WorkoutProtocol.STANDARD,
  },
  {
    date: "2024-01-15",
    exercise: "Bench Press",
    reps: 5,
    weight: 80,
    volume: 1200,
    origine: "[[Strength Training]]",
    protocol: WorkoutProtocol.DROP_SET,
  },
  {
    date: "2024-02-01",
    exercise: "Deadlift",
    reps: 5,
    weight: 120,
    volume: 600,
    workout: "Full Body Workout",
    protocol: WorkoutProtocol.MYO_REPS,
  },
  {
    date: "2024-02-10",
    exercise: "Squat",
    reps: 6,
    weight: 105,
    volume: 1890,
    workout: "Leg Day",
    protocol: WorkoutProtocol.REST_PAUSE,
  },
  {
    date: "2024-02-12",
    exercise: "Squat",
    reps: 8,
    weight: 90,
    volume: 720,
    workout: "Leg Day",
    protocol: WorkoutProtocol.DROP_SET,
  },
  {
    date: "2024-02-15",
    exercise: "Overhead Press",
    reps: 10,
    weight: 50,
    volume: 500,
    workout: "Upper Body",
    // No protocol set - should default to STANDARD
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
      );
      expect(result.filteredData).toHaveLength(mockLogData.length);
      expect(result.filterMethodUsed).toBe("none");
    });

    it("should return empty array if logData is null or empty", () => {
      const params: Partial<EmbeddedChartParams> = {};
      expect(
        DataFilter.filterData([], params as EmbeddedChartParams)
          .filteredData
      ).toHaveLength(0);
      expect(
        DataFilter.filterData(
          null as unknown as WorkoutLogData[],
          params as EmbeddedChartParams,
        ).filteredData
      ).toHaveLength(0);
    });

    describe("Workout Filtering", () => {
      it('should filter by workout name using the CONSTANTS.WORKOUT.LABELS.COMMON.TYPES.WORKOUT field', () => {
        const params: Partial<EmbeddedChartParams> = { workout: "Leg Day" };
        const result = DataFilter.filterData(
          mockLogData,
          params as EmbeddedChartParams,
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
          params as EmbeddedChartParams
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
        );

        expect(result.filteredData).toHaveLength(0);
        expect(result.filterMethodUsed).toBe("No match found");
      });
    });

    describe("Protocol Filtering", () => {
      it("should filter by single protocol string", () => {
        const params: EmbeddedTableParams = {
          protocol: "drop_set",
        };
        const result = DataFilter.filterData(
          mockLogDataWithProtocol,
          params,
        );
        expect(result.filteredData).toHaveLength(2);
        expect(result.filteredData[0].protocol).toBe(WorkoutProtocol.DROP_SET);
        expect(result.filteredData[1].protocol).toBe(WorkoutProtocol.DROP_SET);
        expect(result.filterMethodUsed).toBe("protocol: [drop_set]");
      });

      it("should filter by array of protocols (OR logic)", () => {
        const params: EmbeddedTableParams = {
          protocol: ["drop_set", "myo_reps"],
        };
        const result = DataFilter.filterData(
          mockLogDataWithProtocol,
          params,
        );
        expect(result.filteredData).toHaveLength(3);
        const protocols = result.filteredData.map((d) => d.protocol);
        expect(protocols).toContain(WorkoutProtocol.DROP_SET);
        expect(protocols).toContain(WorkoutProtocol.MYO_REPS);
        expect(result.filterMethodUsed).toBe("protocol: [drop_set, myo_reps]");
      });

      it("should be case-insensitive for protocol filtering", () => {
        const params: EmbeddedTableParams = {
          protocol: "DROP_SET",
        };
        const result = DataFilter.filterData(
          mockLogDataWithProtocol,
          params,
        );
        expect(result.filteredData).toHaveLength(2);
        expect(result.filterMethodUsed).toBe("protocol: [drop_set]");
      });

      it("should filter entries without protocol as STANDARD", () => {
        const params: EmbeddedTableParams = {
          protocol: "standard",
        };
        const result = DataFilter.filterData(
          mockLogDataWithProtocol,
          params,
        );
        // Should include the entry with explicit STANDARD and the entry without protocol
        expect(result.filteredData).toHaveLength(2);
      });

      it("should combine protocol filter with exercise filter (AND logic)", () => {
        const params: EmbeddedTableParams = {
          exercise: "Squat",
          exactMatch: true,
          protocol: "drop_set",
        };
        const result = DataFilter.filterData(
          mockLogDataWithProtocol,
          params,
        );
        expect(result.filteredData).toHaveLength(1);
        expect(result.filteredData[0].exercise).toBe("Squat");
        expect(result.filteredData[0].protocol).toBe(WorkoutProtocol.DROP_SET);
        expect(result.filterMethodUsed).toContain("exact match");
        expect(result.filterMethodUsed).toContain("protocol");
      });

      it("should combine protocol filter with workout filter (AND logic)", () => {
        const params: EmbeddedTableParams = {
          workout: "Leg Day",
          protocol: ["drop_set", "rest_pause"],
        };
        const result = DataFilter.filterData(
          mockLogDataWithProtocol,
          params,
        );
        expect(result.filteredData).toHaveLength(2);
        expect(result.filteredData.every((d) => d.workout === "Leg Day")).toBe(true);
        expect(result.filterMethodUsed).toContain("Leg Day");
        expect(result.filterMethodUsed).toContain("protocol");
      });

      it("should return empty array when protocol filter matches nothing", () => {
        const params: EmbeddedTableParams = {
          protocol: "superset",
        };
        const result = DataFilter.filterData(
          mockLogDataWithProtocol,
          params,
        );
        expect(result.filteredData).toHaveLength(0);
      });

      it("should ignore empty protocol filter", () => {
        const params: EmbeddedTableParams = {
          protocol: "",
        };
        const result = DataFilter.filterData(
          mockLogDataWithProtocol,
          params,
        );
        expect(result.filteredData).toHaveLength(mockLogDataWithProtocol.length);
        expect(result.filterMethodUsed).toBe("none");
      });

      it("should ignore empty protocol array filter", () => {
        const params: EmbeddedTableParams = {
          protocol: [],
        };
        const result = DataFilter.filterData(
          mockLogDataWithProtocol,
          params,
        );
        expect(result.filteredData).toHaveLength(mockLogDataWithProtocol.length);
        expect(result.filterMethodUsed).toBe("none");
      });
    });
  });
});

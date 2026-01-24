import { DataService } from "../DataService";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { CHART_DATA_TYPE } from "@app/types";

// Mock Obsidian module
jest.mock("obsidian", () => ({
  Notice: jest.fn(),
  TFile: class MockTFile {},
}), { virtual: true });

// Import after mocking
import { Notice, TFile } from "obsidian";

// Define mock types
interface MockApp {
  vault: MockVault;
}

interface MockVault {
  getAbstractFileByPath: jest.Mock;
  create: jest.Mock;
  process: jest.Mock;
  read: jest.Mock;
}

describe("DataService", () => {
  let dataService: DataService;
  let mockApp: MockApp;
  let mockSettings: WorkoutChartsSettings;
  let mockVault: MockVault;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock vault
    mockVault = {
      getAbstractFileByPath: jest.fn(),
      create: jest.fn(),
      process: jest.fn(),
      read: jest.fn(),
    };

    // Create mock app
    mockApp = {
      vault: mockVault,
    };

    // Create mock settings
    mockSettings = {
      csvLogFilePath: "test/workout_logs.csv",
      exerciseFolderPath: "test/exercises",
      defaultExercise: "",
      chartType: CHART_DATA_TYPE.VOLUME,
      dateRange: 30,
      showTrendLine: false,
      chartHeight: 400,
      defaultExactMatch: true,
      timerPresets: {},
      defaultTimerPreset: null,
      exerciseBlockTemplate: "",
      weightIncrement: 2.5,
      achievedTargets: {},
    };

    // Create DataService instance
    dataService = new DataService(mockApp as any, mockSettings);
  });

  describe("addWorkoutLogEntry - Recursion Protection", () => {
    it("should successfully add entry when CSV file exists", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.process.mockImplementation(() => Promise.resolve(""));

      const entry = {
        date: "2024-01-01T10:00:00.000Z",
        exercise: "Bench Press",
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: "Test Workout",
        workout: "Test Workout",
        notes: "",
      };

      await dataService.addWorkoutLogEntry(entry);

      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith(
        "test/workout_logs.csv"
      );
      expect(mockVault.process).toHaveBeenCalledTimes(1);
    });

    it("should create CSV file and retry when file does not exist", async () => {
      const mockFile = new TFile();

      // First call returns null (file doesn't exist), second call returns file
      mockVault.getAbstractFileByPath
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(mockFile);

      mockVault.create.mockResolvedValue(mockFile);
      mockVault.process.mockImplementation(() => Promise.resolve(""));

      const entry = {
        date: "2024-01-01T10:00:00.000Z",
        exercise: "Bench Press",
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: "Test Workout",
        workout: "Test Workout",
        notes: "",
      };

      await dataService.addWorkoutLogEntry(entry);

      // Verify createCSVLogFile was called (vault.create)
      expect(mockVault.create).toHaveBeenCalledTimes(1);
      expect(mockVault.create).toHaveBeenCalledWith(
        "test/workout_logs.csv",
        expect.stringContaining("date,exercise,reps,weight,volume")
      );

      // Verify retry happened (process called after create)
      expect(mockVault.process).toHaveBeenCalledTimes(1);
    });

    it("should throw error and show Notice after MAX_RETRIES exceeded", async () => {
      // Mock getAbstractFileByPath to always return null (file creation keeps failing)
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      // Mock create to succeed but still return null on next getAbstractFileByPath
      mockVault.create.mockResolvedValue(new TFile());

      const entry = {
        date: "2024-01-01T10:00:00.000Z",
        exercise: "Bench Press",
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: "Test Workout",
        workout: "Test Workout",
        notes: "",
      };

      await expect(dataService.addWorkoutLogEntry(entry)).rejects.toThrow(
        "Failed to create CSV file at path: test/workout_logs.csv"
      );

      // Verify Notice was shown to user
      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create CSV file at path")
      );

      // Verify create was called once (MAX_RETRIES = 1 means 1 creation attempt)
      expect(mockVault.create).toHaveBeenCalledTimes(1);

      // Verify getAbstractFileByPath was called twice (initial + 1 retry)
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledTimes(2);
    });

    it("should not call process when recursion limit is reached", async () => {
      // Mock to always return null (file creation keeps failing)
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const entry = {
        date: "2024-01-01T10:00:00.000Z",
        exercise: "Bench Press",
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: "Test Workout",
        workout: "Test Workout",
        notes: "",
      };

      await expect(dataService.addWorkoutLogEntry(entry)).rejects.toThrow();

      // Verify process was never called since file creation kept failing
      expect(mockVault.process).not.toHaveBeenCalled();
    });

    it("should include CSV path in error message", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const entry = {
        date: "2024-01-01T10:00:00.000Z",
        exercise: "Bench Press",
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: "Test Workout",
        workout: "Test Workout",
        notes: "",
      };

      await expect(dataService.addWorkoutLogEntry(entry)).rejects.toThrow(
        /test\/workout_logs\.csv/
      );
    });
  });

  describe("Cache Size Limits", () => {
    it("should clear cache when size exceeds MAX_CACHE_SIZE", async () => {
      // Create a large CSV content with 6000 entries (exceeds MAX_CACHE_SIZE of 5000)
      const largeCSVContent = [
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes",
        ...Array.from({ length: 6000 }, (_, i) =>
          `2024-01-01T10:00:00.000Z,Exercise ${i},10,100,1000,Workout,Workout,${Date.now() + i},`
        )
      ].join("\n");

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(largeCSVContent);

      // First call - should populate cache with 6000 entries
      const firstResult = await dataService.getWorkoutLogData();
      expect(firstResult.length).toBe(6000);

      // Clear the read mock to verify cache behavior
      mockVault.read.mockClear();

      // Second call - cache should be invalid due to size exceeding MAX_CACHE_SIZE
      // So it should read from CSV again
      mockVault.read.mockResolvedValue(largeCSVContent);
      const secondResult = await dataService.getWorkoutLogData();

      // Verify that read was called again (cache was cleared and rebuilt)
      expect(mockVault.read).toHaveBeenCalledTimes(1);
      expect(secondResult.length).toBe(6000);
    });

    it("should use cache when size is within MAX_CACHE_SIZE", async () => {
      // Create a CSV content with 1000 entries (well within MAX_CACHE_SIZE of 5000)
      const smallCSVContent = [
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes",
        ...Array.from({ length: 1000 }, (_, i) =>
          `2024-01-01T10:00:00.000Z,Exercise ${i},10,100,1000,Workout,Workout,${Date.now() + i},`
        )
      ].join("\n");

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(smallCSVContent);

      // First call - should populate cache with 1000 entries
      const firstResult = await dataService.getWorkoutLogData();
      expect(firstResult.length).toBe(1000);

      // Clear the read mock to verify cache behavior
      mockVault.read.mockClear();

      // Second call immediately after (within CACHE_DURATION)
      // Should use cache and NOT read from CSV
      const secondResult = await dataService.getWorkoutLogData();

      // Verify that read was NOT called (cache was used)
      expect(mockVault.read).not.toHaveBeenCalled();
      expect(secondResult.length).toBe(1000);
    });

    it("should clear cache when manually calling clearLogDataCache", async () => {
      const smallCSVContent = [
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes",
        "2024-01-01T10:00:00.000Z,Bench Press,10,100,1000,Workout,Workout,1704096000000,",
      ].join("\n");

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(smallCSVContent);

      // First call - populate cache
      await dataService.getWorkoutLogData();

      // Clear cache manually
      dataService.clearLogDataCache();

      // Clear read mock
      mockVault.read.mockClear();
      mockVault.read.mockResolvedValue(smallCSVContent);

      // Second call - should read from CSV again since cache was cleared
      await dataService.getWorkoutLogData();

      expect(mockVault.read).toHaveBeenCalledTimes(1);
    });
  });
});

import { WorkoutLogRepository } from "../WorkoutLogRepository";
import { App, TFile, Notice } from "obsidian";
import { CSVCacheService } from "../CSVCacheService";
import { CSVColumnService } from "../CSVColumnService";
import {
  WorkoutChartsSettings,
  CSVWorkoutLogEntry,
  WorkoutProtocol,
} from "../../../types/WorkoutLogData";
import { CONSTANTS } from "../../../constants";
import * as WorkoutLogDataUtils from "../../../types/WorkoutLogData";

// Mock Obsidian types
const mockVault = {
  getAbstractFileByPath: jest.fn(),
  create: jest.fn(),
  process: jest.fn(),
};

const mockApp = {
  vault: mockVault,
} as unknown as App;

// Mock Services
const mockColumnService = {
  ensureColumnExists: jest.fn(),
  getCustomColumns: jest.fn(),
} as unknown as CSVColumnService;

const mockCacheService = {
  clearCache: jest.fn(),
} as unknown as CSVCacheService;

const defaultSettings: WorkoutChartsSettings = {
  csvLogFilePath: "workout-log.csv",
  // Add other required settings as needed (mocked minimally)
} as WorkoutChartsSettings;

// Mock parseCSVLogFile and entriesToCSVContent
jest.mock("../../../types/WorkoutLogData", () => {
  const originalModule = jest.requireActual("../../../types/WorkoutLogData");
  return {
    ...originalModule,
    parseCSVLogFile: jest.fn(),
    entriesToCSVContent: jest.fn(),
  };
});

describe("WorkoutLogRepository", () => {
  let repository: WorkoutLogRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new WorkoutLogRepository(
      mockApp,
      defaultSettings,
      mockColumnService,
      mockCacheService,
    );
  });

  describe("createCSVLogFile", () => {
    it("should create a new CSV file with header and sample entry", async () => {
      await repository.createCSVLogFile();

      expect(mockVault.create).toHaveBeenCalledWith(
        defaultSettings.csvLogFilePath,
        expect.stringContaining("date,exercise,reps"),
      );
      expect(mockCacheService.clearCache).toHaveBeenCalled();
    });
  });

  describe("addWorkoutLogEntry", () => {
    const newEntry: Omit<CSVWorkoutLogEntry, "timestamp"> = {
      date: "2024-01-01",
      exercise: "Squat",
      reps: 5,
      weight: 100,
      volume: 500,
      origine: "Log",
      workout: "Leg Day",
      notes: "Heavy",
      protocol: WorkoutProtocol.REST_PAUSE,
    };

    it("should add an entry to an existing CSV file", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      (mockColumnService.getCustomColumns as jest.Mock).mockResolvedValue([]);
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue([]);
      (WorkoutLogDataUtils.entriesToCSVContent as jest.Mock).mockReturnValue(
        "updated content",
      );

      await repository.addWorkoutLogEntry(newEntry);

      expect(mockVault.process).toHaveBeenCalledWith(
        mockFile,
        expect.any(Function),
      );
      expect(mockCacheService.clearCache).toHaveBeenCalled();
    });

    it("should handle custom fields properly", async () => {
      const entryWithCustomFields = {
        ...newEntry,
        customFields: { RPE: 8 },
      };

      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      (mockColumnService.getCustomColumns as jest.Mock).mockResolvedValue([
        "RPE",
      ]);
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue([]);
      (WorkoutLogDataUtils.entriesToCSVContent as jest.Mock).mockReturnValue(
        "updated content",
      );

      await repository.addWorkoutLogEntry(entryWithCustomFields);

      expect(mockColumnService.ensureColumnExists).toHaveBeenCalledWith(
        "RPE",
        expect.any(Function),
      );
      expect(mockVault.process).toHaveBeenCalled();
      expect(mockCacheService.clearCache).toHaveBeenCalled();
    });

    it("should recursive retry if file not found and successfully create it", async () => {
      // First call returns null (file missing), second call returns file
      (mockVault.getAbstractFileByPath as jest.Mock)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(new TFile());

      (mockColumnService.getCustomColumns as jest.Mock).mockResolvedValue([]);
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue([]);

      await repository.addWorkoutLogEntry(newEntry);

      expect(mockVault.create).toHaveBeenCalled(); // createCSVLogFile called
      expect(mockVault.process).toHaveBeenCalled(); // Then process called
    });

    it("should throw error if max retries exceeded", async () => {
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);

      // Mock Notice to avoid actual obsidian dependency issues if any
      jest.mock("obsidian", () => ({
        Notice: jest.fn(),
        TFile: class {},
        App: class {},
      }));

      await expect(
        repository.addWorkoutLogEntry(newEntry, 2),
      ).rejects.toThrow();
    });
  });

  describe("updateWorkoutLogEntry", () => {
    const originalLog: CSVWorkoutLogEntry = {
      timestamp: 123456789,
      date: "2024-01-01",
      exercise: "Squat",
      reps: 5,
      weight: 100,
      volume: 500,
      origine: "Log",
      workout: "Leg Day",
      notes: "Heavy",
      protocol: WorkoutProtocol.STANDARD,
    };

    const updatedEntry = { ...originalLog, weight: 105 };

    it("should update an existing entry matched by timestamp", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      (mockColumnService.getCustomColumns as jest.Mock).mockResolvedValue([]);

      const existingEntries = [originalLog];
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue(
        existingEntries,
      );
      (WorkoutLogDataUtils.entriesToCSVContent as jest.Mock).mockReturnValue(
        "updated content",
      );

      await repository.updateWorkoutLogEntry(originalLog, updatedEntry);

      // verify process callback logic implicitly via coverage or by mocking implementation of process to run callback
      // But here we rely on process being called
      expect(mockVault.process).toHaveBeenCalled();
      expect(mockCacheService.clearCache).toHaveBeenCalled();
    });

    it("should throw error if file does not exist", async () => {
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
      await expect(
        repository.updateWorkoutLogEntry(originalLog, updatedEntry),
      ).rejects.toThrow(CONSTANTS.WORKOUT.MESSAGES.ERRORS.CSV_NOT_FOUND);
    });

    it("should fallback to matching by properties if timestamp not found", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      (mockColumnService.getCustomColumns as jest.Mock).mockResolvedValue([]);

      // Entry in file has different timestamp but same data
      const fileEntry = { ...originalLog, timestamp: 999999 };
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue([
        fileEntry,
      ]);
      (WorkoutLogDataUtils.entriesToCSVContent as jest.Mock).mockReturnValue(
        "updated content",
      );

      await repository.updateWorkoutLogEntry(originalLog, updatedEntry);

      expect(mockVault.process).toHaveBeenCalled();
    });

    it("should throw error if entry not found", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      (mockColumnService.getCustomColumns as jest.Mock).mockResolvedValue([]);
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue([]); // Empty

      // We need to implement a fake process to actually execute the callback and trigger the error inside it
      // OR we mock process to just return (which wont trigger error).
      // However, the error is thrown INSIDE the callback passed to process.
      // So we need to mock implementation of process to execute the callback.
      (mockVault.process as jest.Mock).mockImplementation(
        async (file, callback) => {
          return callback("");
        },
      );

      await expect(
        repository.updateWorkoutLogEntry(originalLog, updatedEntry),
      ).rejects.toThrow("Original log entry not found in CSV file");
    });

    it("should ensure custom columns exist for updated entry", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      const entryWithCustom = { ...updatedEntry, customFields: { RPE: 9 } };

      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue([
        originalLog,
      ]);
      (WorkoutLogDataUtils.entriesToCSVContent as jest.Mock).mockReturnValue(
        "updated content",
      );

      await repository.updateWorkoutLogEntry(originalLog, entryWithCustom);

      expect(mockColumnService.ensureColumnExists).toHaveBeenCalledWith(
        "RPE",
        expect.any(Function),
      );
    });
  });

  describe("deleteWorkoutLogEntry", () => {
    const logToDelete: CSVWorkoutLogEntry = {
      timestamp: 123456789,
      date: "2024-01-01",
      exercise: "Squat",
      reps: 5,
      weight: 100,
      volume: 500,
      origine: "Log",
      workout: "Leg Day",
      notes: "Heavy",
      protocol: WorkoutProtocol.STANDARD,
    };

    it("should delete an entry matched by timestamp", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      const existingEntries = [logToDelete];
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue(
        existingEntries,
      );
      (WorkoutLogDataUtils.entriesToCSVContent as jest.Mock).mockReturnValue(
        "remaining content",
      );

      (mockVault.process as jest.Mock).mockImplementation(
        async (file, callback) => {
          const result = callback("");
          return result;
        },
      );

      await repository.deleteWorkoutLogEntry(logToDelete);

      expect(mockVault.process).toHaveBeenCalled();
      expect(mockCacheService.clearCache).toHaveBeenCalled();
    });

    it("should throw error if file not found", async () => {
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
      await expect(
        repository.deleteWorkoutLogEntry(logToDelete),
      ).rejects.toThrow(CONSTANTS.WORKOUT.MESSAGES.ERRORS.CSV_NOT_FOUND);
    });

    it("should fallback to matching by properties if timestamp not found", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      // Entry in file has different timestamp but same data
      const fileEntry = { ...logToDelete, timestamp: 999999 };
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue([
        fileEntry,
      ]);
      (WorkoutLogDataUtils.entriesToCSVContent as jest.Mock).mockReturnValue(
        "content",
      );

      (mockVault.process as jest.Mock).mockImplementation(
        async (file, callback) => {
          return callback("");
        },
      );

      await repository.deleteWorkoutLogEntry(logToDelete);

      expect(mockVault.process).toHaveBeenCalled();
    });

    it("should throw error if entry not found", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue([]);

      (mockVault.process as jest.Mock).mockImplementation(
        async (file, callback) => {
          return callback("");
        },
      );

      await expect(
        repository.deleteWorkoutLogEntry(logToDelete),
      ).rejects.toThrow("Log entry not found in CSV file");
    });
  });

  describe("renameExercise", () => {
    it("should rename exercises and return valid count", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);

      const entries = [
        { exercise: "Squat" },
        { exercise: "squat" }, // Case insensitive match
        { exercise: "Bench" },
      ];
      (WorkoutLogDataUtils.parseCSVLogFile as jest.Mock).mockReturnValue(
        entries,
      );
      (WorkoutLogDataUtils.entriesToCSVContent as jest.Mock).mockReturnValue(
        "content",
      );

      (mockVault.process as jest.Mock).mockImplementation(
        async (file, callback) => {
          return callback("");
        },
      );

      const count = await repository.renameExercise("Squat", "Back Squat");

      expect(count).toBe(2);
      expect(entries[0].exercise).toBe("Back Squat");
      expect(entries[1].exercise).toBe("Back Squat");
      expect(entries[2].exercise).toBe("Bench");

      expect(mockCacheService.clearCache).toHaveBeenCalled();
    });

    it("should throw error if file not found", async () => {
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
      await expect(repository.renameExercise("Old", "New")).rejects.toThrow(
        CONSTANTS.WORKOUT.MESSAGES.ERRORS.CSV_NOT_FOUND,
      );
    });

    it("should handle process errors", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);

      (mockVault.process as jest.Mock).mockImplementation(() => {
        throw new Error("Process failed");
      });

      await expect(repository.renameExercise("Old", "New")).rejects.toThrow(
        "Failed to rename exercise: Process failed",
      );
    });
  });
});

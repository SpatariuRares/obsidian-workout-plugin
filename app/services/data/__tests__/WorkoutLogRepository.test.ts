import { WorkoutLogRepository } from "../WorkoutLogRepository";
import { App, TFile, TFolder, Notice } from "obsidian";
import { CSVCacheService } from "../CSVCacheService";
import { CSVColumnService } from "../CSVColumnService";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import {
  WorkoutChartsSettings,
  CSVWorkoutLogEntry,
  WorkoutLogData,
  WorkoutProtocol,
} from "../../../types/WorkoutLogData";
import { CONSTANTS } from "../../../constants";
import * as WorkoutLogDataUtils from "../../../types/WorkoutLogData";
import { t } from "@app/i18n";

// Mock Obsidian types
const mockVault = {
  getAbstractFileByPath: jest.fn(),
  create: jest.fn(),
  createFolder: jest.fn(),
  process: jest.fn(),
  read: jest.fn(),
};

const mockFileManager = {
  trashFile: jest.fn(),
};

const mockApp = {
  vault: mockVault,
  fileManager: mockFileManager,
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
  weightUnit: "kg",
  // Add other required settings as needed (mocked minimally)
} as WorkoutChartsSettings;

// Mock parseCSVLogFile and entriesToCSVContent
jest.mock("../../../types/WorkoutLogData", () => {
  const originalModule = jest.requireActual(
    "../../../types/WorkoutLogData",
  );
  return {
    ...originalModule,
    parseCSVLogFile: jest.fn(),
    entriesToCSVContent: jest.fn(),
  };
});

describe("WorkoutLogRepository", () => {
  let repository: WorkoutLogRepository;
  let mockEventBus: jest.Mocked<Pick<WorkoutEventBus, "emit">>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus = { emit: jest.fn() };
    repository = new WorkoutLogRepository(
      mockApp,
      defaultSettings,
      mockColumnService,
      mockCacheService,
      mockEventBus as unknown as WorkoutEventBus,
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

    it("should create parent folder if it does not exist", async () => {
      const settingsWithFolder = {
        ...defaultSettings,
        csvLogFilePath: "folder/workout-log.csv",
      };
      repository = new WorkoutLogRepository(
        mockApp,
        settingsWithFolder,
        mockColumnService,
        mockCacheService,
        mockEventBus as unknown as WorkoutEventBus,
      );

      // Mock getAbstractFileByPath to return null (folder doesn't exist)
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        null,
      );

      await repository.createCSVLogFile();

      expect(mockVault.createFolder).toHaveBeenCalledWith("folder");
      expect(mockVault.create).toHaveBeenCalledWith(
        "folder/workout-log.csv",
        expect.any(String),
      );
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
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue([]);
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([]);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("updated content");

      await repository.addWorkoutLogEntry(newEntry);

      expect(mockVault.process).toHaveBeenCalledWith(
        mockFile,
        expect.any(Function),
      );
    });

    it("should handle custom fields properly", async () => {
      const entryWithCustomFields = {
        ...newEntry,
        customFields: { RPE: 8 },
      };

      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue(["RPE"]);
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([]);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("updated content");

      await repository.addWorkoutLogEntry(entryWithCustomFields);

      expect(
        mockColumnService.ensureColumnExists,
      ).toHaveBeenCalledWith("RPE", expect.any(Function));
      expect(mockVault.process).toHaveBeenCalled();
    });

    it("should recursive retry if file not found and successfully create it", async () => {
      // First call returns null (file missing), second call returns file
      (mockVault.getAbstractFileByPath as jest.Mock)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(new TFile());

      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue([]);
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([]);

      await repository.addWorkoutLogEntry(newEntry);

      expect(mockVault.create).toHaveBeenCalled(); // createCSVLogFile called
      expect(mockVault.process).toHaveBeenCalled(); // Then process called
    });

    it("should throw error if max retries exceeded", async () => {
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        null,
      );

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
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue([]);

      const existingEntries = [originalLog];
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue(existingEntries);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("updated content");

      await repository.updateWorkoutLogEntry(
        originalLog,
        updatedEntry,
      );

      expect(mockVault.process).toHaveBeenCalled();
    });

    it("should throw error if file does not exist", async () => {
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        null,
      );
      await expect(
        repository.updateWorkoutLogEntry(originalLog, updatedEntry),
      ).rejects.toThrow(t("messages.csvNotFound"));
    });

    it("should fallback to matching by properties if timestamp not found", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue([]);

      // Entry in file has different timestamp but same data
      const fileEntry = { ...originalLog, timestamp: 999999 };
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([fileEntry]);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("updated content");

      await repository.updateWorkoutLogEntry(
        originalLog,
        updatedEntry,
      );

      expect(mockVault.process).toHaveBeenCalled();
    });

    it("should throw error if entry not found", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue([]);
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([]); // Empty

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
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      const entryWithCustom = {
        ...updatedEntry,
        customFields: { RPE: 9 },
      };

      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([originalLog]);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("updated content");

      await repository.updateWorkoutLogEntry(
        originalLog,
        entryWithCustom,
      );

      expect(
        mockColumnService.ensureColumnExists,
      ).toHaveBeenCalledWith("RPE", expect.any(Function));
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
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      const existingEntries = [logToDelete];
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue(existingEntries);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("remaining content");

      (mockVault.process as jest.Mock).mockImplementation(
        async (file, callback) => {
          const result = callback("");
          return result;
        },
      );

      await repository.deleteWorkoutLogEntry(logToDelete);

      expect(mockVault.process).toHaveBeenCalled();
    });

    it("should throw error if file not found", async () => {
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        null,
      );
      await expect(
        repository.deleteWorkoutLogEntry(logToDelete),
      ).rejects.toThrow(t("messages.csvNotFound"));
    });

    it("should fallback to matching by properties if timestamp not found", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      // Entry in file has different timestamp but same data
      const fileEntry = { ...logToDelete, timestamp: 999999 };
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([fileEntry]);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("content");

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
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([]);

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
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );

      const entries = [
        { exercise: "Squat" },
        { exercise: "squat" }, // Case insensitive match
        { exercise: "Bench" },
      ];
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue(entries);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("content");

      (mockVault.process as jest.Mock).mockImplementation(
        async (file, callback) => {
          return callback("");
        },
      );

      const count = await repository.renameExercise(
        "Squat",
        "Back Squat",
      );

      expect(count).toBe(2);
      expect(entries[0].exercise).toBe("Back Squat");
      expect(entries[1].exercise).toBe("Back Squat");
      expect(entries[2].exercise).toBe("Bench");
    });

    it("should throw error if file not found", async () => {
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        null,
      );
      await expect(
        repository.renameExercise("Old", "New"),
      ).rejects.toThrow(t("messages.csvNotFound"));
    });

    it("should handle process errors", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );

      (mockVault.process as jest.Mock).mockImplementation(() => {
        throw new Error("Process failed");
      });

      await expect(
        repository.renameExercise("Old", "New"),
      ).rejects.toThrow("Failed to rename exercise: Process failed");
    });
  });

  describe("weight unit", () => {
    const makeFile = (name: string, parent?: TFolder): TFile => {
      const file = new TFile();
      file.name = name;
      file.basename = name.replace(/\.csv$/, "");
      file.extension = "csv";
      file.path = parent ? `${parent.path}/${name}` : name;
      (file as TFile & { parent: TFolder | null }).parent =
        parent ?? null;
      return file;
    };

    let folder: TFolder;
    let csvFile: TFile;
    let entries: CSVWorkoutLogEntry[];

    const row = (
      timestamp: number,
      weight: number,
      weightUnit?: "kg" | "lb",
    ): CSVWorkoutLogEntry => ({
      date: "2024-01-01",
      exercise: "Squat",
      reps: 5,
      weight,
      volume: weight * 5,
      timestamp,
      weightUnit,
    });

    beforeEach(() => {
      folder = new TFolder();
      folder.path = "data";
      csvFile = makeFile("workout_logs.csv", folder);
      folder.children = [csvFile];

      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        csvFile,
      );
      (mockVault.read as jest.Mock).mockResolvedValue("raw csv");
      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue([]);
      entries = [row(1, 100), row(2, 220, "lb"), row(3, 60, "kg")];
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue(entries);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("content");
      (mockVault.process as jest.Mock).mockImplementation(
        async (_file, callback) => callback(""),
      );
    });

    it("should stamp the settings unit on new entries without one", async () => {
      const { timestamp: _t, ...entry } = row(0, 80);
      await repository.addWorkoutLogEntry(entry);

      expect(entries[3]).toMatchObject({ weight: 80, weightUnit: "kg" });
    });

    it("should keep the unit chosen for a new entry", async () => {
      const { timestamp: _t, ...entry } = row(0, 225, "lb");
      await repository.addWorkoutLogEntry(entry);

      expect(entries[3]).toMatchObject({ weight: 225, weightUnit: "lb" });
    });

    it("should stamp the settings unit on updates without one", async () => {
      const original = { ...row(3, 60, "kg") } as WorkoutLogData;
      const { timestamp: _t, weightUnit: _u, ...updated } = row(3, 62.5);

      await repository.updateWorkoutLogEntry(original, updated);

      expect(entries[2]).toMatchObject({ weight: 62.5, weightUnit: "kg" });
    });

    it("should match the fallback on the entered weight", async () => {
      // Timestamp unknown; the log shows 99.79 kg but the row says 220 lb
      const original = {
        ...row(99, 99.79),
        enteredWeight: 220,
        enteredUnit: "lb",
      } as WorkoutLogData;

      await repository.deleteWorkoutLogEntry(original);

      expect(entries.map((e) => e.timestamp)).not.toContain(2);
    });

    describe("stampMissingWeightUnits", () => {
      it("should stamp only rows without a unit", async () => {
        const count = await repository.stampMissingWeightUnits("lb");

        expect(count).toBe(1);
        expect(entries.map((e) => e.weightUnit)).toEqual([
          "lb",
          "lb",
          "kg",
        ]);
        expect(entries.map((e) => e.weight)).toEqual([100, 220, 60]);
        expect(mockEventBus.emit).toHaveBeenCalledWith({
          type: "log:bulk-changed",
          payload: { count: 1, operation: "migrate-unit" },
        });
      });

      it("should not write or back up when every row has a unit", async () => {
        entries.splice(0, 1);

        const count = await repository.stampMissingWeightUnits("kg");

        expect(count).toBe(0);
        expect(mockVault.create).not.toHaveBeenCalled();
        expect(mockVault.process).not.toHaveBeenCalled();
        expect(mockEventBus.emit).not.toHaveBeenCalled();
      });

      it("should write a backup next to the CSV before stamping", async () => {
        await repository.stampMissingWeightUnits("kg");

        expect(mockVault.create).toHaveBeenCalledWith(
          expect.stringMatching(
            /^data\/workout_logs\.backup-[\d-]+T[\d-]+Z\.csv$/,
          ),
          "raw csv",
        );
        const createOrder = (mockVault.create as jest.Mock).mock
          .invocationCallOrder[0];
        const processOrder = (mockVault.process as jest.Mock).mock
          .invocationCallOrder[0];
        expect(createOrder).toBeLessThan(processOrder);
      });

      it("should keep only the 3 most recent backups", async () => {
        const old = [
          "workout_logs.backup-2026-01-01T00-00-00-000Z.csv",
          "workout_logs.backup-2026-02-01T00-00-00-000Z.csv",
          "workout_logs.backup-2026-03-01T00-00-00-000Z.csv",
        ].map((name) => makeFile(name, folder));
        const unrelated = makeFile("other.backup-2020.csv", folder);
        folder.children = [csvFile, unrelated, ...old];

        await repository.stampMissingWeightUnits("kg");

        // New backup + 2 newest old ones = 3
        expect(mockFileManager.trashFile).toHaveBeenCalledTimes(1);
        expect(mockFileManager.trashFile).toHaveBeenCalledWith(old[0]);
      });

      it("should not stamp if the backup fails", async () => {
        (mockVault.create as jest.Mock).mockRejectedValueOnce(
          new Error("disk full"),
        );

        await expect(
          repository.stampMissingWeightUnits("kg"),
        ).rejects.toThrow("disk full");
        expect(mockVault.process).not.toHaveBeenCalled();
      });

      it("should do nothing when there is no CSV file yet", async () => {
        (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
          null,
        );
        await expect(
          repository.stampMissingWeightUnits("kg"),
        ).resolves.toBe(0);
        expect(mockVault.create).not.toHaveBeenCalled();
      });
    });
  });

  describe("eventBus integration", () => {
    beforeEach(() => {
      // Reset process mock implementation that may have been set by previous describe blocks
      (mockVault.process as jest.Mock).mockReset();
    });

    const baseEntry: Omit<CSVWorkoutLogEntry, "timestamp"> = {
      date: "2024-01-01",
      exercise: "Squat",
      reps: 5,
      weight: 100,
      volume: 500,
      origine: "Log",
      workout: "Leg Day",
      protocol: WorkoutProtocol.STANDARD,
    };

    it("should emit log:added after addWorkoutLogEntry", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue([]);
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([]);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("content");

      await repository.addWorkoutLogEntry(baseEntry);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "log:added",
          payload: expect.objectContaining({
            context: { exercise: "Squat", workout: "Leg Day" },
          }),
        }),
      );
    });

    it("should emit log:updated after updateWorkoutLogEntry", async () => {
      const originalLog = {
        ...baseEntry,
        timestamp: 123456789,
      } as WorkoutLogData;
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue([]);
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([{ ...baseEntry, timestamp: 123456789 }]);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("content");
      (mockVault.process as jest.Mock).mockImplementation(
        async (_file, callback) => callback(""),
      );

      await repository.updateWorkoutLogEntry(originalLog, {
        ...baseEntry,
        reps: 8,
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "log:updated",
          payload: expect.objectContaining({
            previous: originalLog,
          }),
        }),
      );
    });

    it("should emit log:deleted after deleteWorkoutLogEntry", async () => {
      const logToDelete = {
        ...baseEntry,
        timestamp: 123456789,
      } as WorkoutLogData;
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([{ ...baseEntry, timestamp: 123456789 }]);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("content");
      (mockVault.process as jest.Mock).mockImplementation(
        async (_file, callback) => callback(""),
      );

      await repository.deleteWorkoutLogEntry(logToDelete);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "log:deleted",
          payload: expect.objectContaining({
            context: { exercise: "Squat", workout: "Leg Day" },
          }),
        }),
      );
    });

    it("should emit log:bulk-changed after renameExercise", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        WorkoutLogDataUtils.parseCSVLogFile as jest.Mock
      ).mockReturnValue([{ exercise: "Squat" }]);
      (
        WorkoutLogDataUtils.entriesToCSVContent as jest.Mock
      ).mockReturnValue("content");
      (mockVault.process as jest.Mock).mockImplementation(
        async (_file, callback) => callback(""),
      );

      await repository.renameExercise("Squat", "Back Squat");

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "log:bulk-changed",
          payload: expect.objectContaining({ operation: "rename" }),
        }),
      );
    });

    it("should NOT emit if vault.process throws", async () => {
      const mockFile = new TFile();
      (mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        mockFile,
      );
      (
        mockColumnService.getCustomColumns as jest.Mock
      ).mockResolvedValue([]);
      (mockVault.process as jest.Mock).mockRejectedValue(
        new Error("IO error"),
      );

      await expect(
        repository.addWorkoutLogEntry(baseEntry),
      ).rejects.toThrow("IO error");
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });
});

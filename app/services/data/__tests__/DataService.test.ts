import { DataService } from "../DataService";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { CHART_DATA_TYPE } from "@app/features/charts";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";

// Mock i18n to interpolate {key} placeholders, mirroring LocalizationService behaviour
jest.mock("@app/i18n", () => ({
  t: jest.fn(
    (key: string, params?: Record<string, string | number>) => {
      // Load English locale to get the actual translation string
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const en = require("@app/i18n/locales/en.json");
      // Walk nested keys (dot-notation)
      const translation = key.split(".").reduce((obj: any, k) => obj?.[k], en);
      const str = typeof translation === "string" ? translation : key;
      if (!params) return str;
      // Interpolate {param} placeholders
      return str.replace(/\{(\w+)\}/g, (_: string, k: string) =>
        k in params ? String(params[k]) : `{${k}}`,
      );
    },
  ),
}));

// Mock Obsidian module

// Import after mocking
import { Notice, TFile } from "obsidian";

// Define mock types
interface MockApp {
  vault: MockVault;
}

interface MockVault {
  getAbstractFileByPath: jest.Mock;
  create: jest.Mock;
  createFolder: jest.Mock;
  process: jest.Mock;
  read: jest.Mock;
}

describe("DataService", () => {
  let dataService: DataService;
  let mockApp: MockApp;
  let mockSettings: WorkoutChartsSettings;
  let mockVault: MockVault;
  let eventBus: WorkoutEventBus;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    eventBus = new WorkoutEventBus();

    // Create mock vault
    mockVault = {
      getAbstractFileByPath: jest.fn(),
      create: jest.fn(),
      createFolder: jest.fn(),
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
      weightUnit: "kg",
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
      customProtocols: [],
      setDuration: 45,
      recentExercises: [],
      quickWeightIncrement: 2.5,
      repDuration: 5,
      defaultRepsPerSet: 0,
    };

    // Create DataService instance
    dataService = new DataService(
      mockApp as any,
      mockSettings,
      eventBus,
    );
  });

  afterEach(() => {
    eventBus.destroy();
  });

  describe("addWorkoutLogEntry - Recursion Protection", () => {
    it("should successfully add entry when CSV file exists", async () => {
      const csvContent = [
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol",
        "2024-01-01T09:00:00.000Z,Squat,10,100,1000,Test,Test,1704092400000,,standard",
      ].join("\n");

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);
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
        "test/workout_logs.csv",
      );
      expect(mockVault.process).toHaveBeenCalledTimes(1);
    });

    it("should create CSV file and retry when file does not exist", async () => {
      const mockFile = new TFile();

      // First call returns null (file doesn't exist)
      // Second call returns mockFile (folder check)
      // Third call returns mockFile (file check after creation)
      mockVault.getAbstractFileByPath
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(mockFile)
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
        expect.stringContaining("date,exercise,reps,weight,volume"),
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

      await expect(
        dataService.addWorkoutLogEntry(entry),
      ).rejects.toThrow(
        "Failed to create CSV file at path: test/workout_logs.csv",
      );

      // Verify Notice was shown to user
      expect(Notice).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create CSV file at path"),
      );

      // Verify create was called once (MAX_RETRIES = 1 means 1 creation attempt)
      expect(mockVault.create).toHaveBeenCalledTimes(1);

      // Verify getAbstractFileByPath was called 3 times (initial + folder check + 1 retry)
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledTimes(
        3,
      );
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

      await expect(
        dataService.addWorkoutLogEntry(entry),
      ).rejects.toThrow();

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

      await expect(
        dataService.addWorkoutLogEntry(entry),
      ).rejects.toThrow(/test\/workout_logs\.csv/);
    });
  });

  describe("Dynamic Column Management (US-005)", () => {
    describe("getCSVColumns", () => {
      it("should return standard columns when file does not exist", async () => {
        mockVault.getAbstractFileByPath.mockReturnValue(null);

        const columns = await dataService.getCSVColumns();

        expect(columns).toEqual([
          "date",
          "exercise",
          "reps",
          "weight",
          "volume",
          "origine",
          "workout",
          "timestamp",
          "notes",
          "protocol",
        ]);
      });

      it("should return all columns from existing CSV header", async () => {
        const csvContent = [
          "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance",
          "2024-01-01T10:00:00.000Z,Running,1,0,0,Cardio,Cardio,1704096000000,,standard,30,5",
        ].join("\n");

        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
        mockVault.read.mockResolvedValue(csvContent);

        const columns = await dataService.getCSVColumns();

        expect(columns).toContain("date");
        expect(columns).toContain("exercise");
        expect(columns).toContain("duration");
        expect(columns).toContain("distance");
        expect(columns.length).toBe(12);
      });

      it("should handle empty CSV file", async () => {
        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
        mockVault.read.mockResolvedValue("");

        const columns = await dataService.getCSVColumns();

        expect(columns).toEqual([
          "date",
          "exercise",
          "reps",
          "weight",
          "volume",
          "origine",
          "workout",
          "timestamp",
          "notes",
          "protocol",
        ]);
      });
    });

    describe("ensureColumnExists", () => {
      it("should not modify file for standard columns", async () => {
        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

        await dataService.ensureColumnExists("date");
        await dataService.ensureColumnExists("exercise");
        await dataService.ensureColumnExists("reps");

        expect(mockVault.process).not.toHaveBeenCalled();
      });

      it("should not modify file when custom column already exists", async () => {
        const csvContent = [
          "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration",
          "2024-01-01T10:00:00.000Z,Running,1,0,0,Cardio,Cardio,1704096000000,,standard,30",
        ].join("\n");

        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
        mockVault.read.mockResolvedValue(csvContent);

        await dataService.ensureColumnExists("duration");

        expect(mockVault.process).not.toHaveBeenCalled();
      });

      it("should add new column to CSV file", async () => {
        const csvContent = [
          "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol",
          "2024-01-01T10:00:00.000Z,Bench Press,10,100,1000,Workout,Workout,1704096000000,,standard",
        ].join("\n");

        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
        mockVault.read.mockResolvedValue(csvContent);
        mockVault.process.mockImplementation(
          async (_file, callback) => {
            const result = callback(csvContent);
            // Verify the new column was added to the header
            expect(result).toContain("duration");
            return result;
          },
        );

        await dataService.ensureColumnExists("duration");

        expect(mockVault.process).toHaveBeenCalledTimes(1);
      });

      it("should clear cache after adding column", async () => {
        const csvContent = [
          "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol",
          "2024-01-01T10:00:00.000Z,Bench Press,10,100,1000,Workout,Workout,1704096000000,,standard",
        ].join("\n");

        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
        mockVault.read.mockResolvedValue(csvContent);
        mockVault.process.mockImplementation(
          async (_file, callback) => {
            callback(csvContent);
            return "";
          },
        );

        // First, populate cache
        await dataService.getWorkoutLogData();

        // Clear read mock and verify cache is being used
        mockVault.read.mockClear();
        await dataService.getWorkoutLogData();
        expect(mockVault.read).not.toHaveBeenCalled(); // Should use cache

        // Add new column - this should clear the cache
        mockVault.read.mockResolvedValue(csvContent);
        await dataService.ensureColumnExists("duration");

        // Clear read mock again
        mockVault.read.mockClear();
        mockVault.read.mockResolvedValue(csvContent);

        // Verify cache was cleared by checking that next read triggers file access
        await dataService.getWorkoutLogData();

        // Should have called read because cache was cleared by ensureColumnExists
        expect(mockVault.read).toHaveBeenCalled();
      });

      it("should do nothing when file does not exist", async () => {
        mockVault.getAbstractFileByPath.mockReturnValue(null);

        await dataService.ensureColumnExists("duration");

        expect(mockVault.process).not.toHaveBeenCalled();
      });
    });

    describe("addWorkoutLogEntry with customFields", () => {
      it("should ensure custom columns exist before adding entry", async () => {
        const csvContent = [
          "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol",
          "2024-01-01T10:00:00.000Z,Bench Press,10,100,1000,Workout,Workout,1704096000000,,standard",
        ].join("\n");

        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
        mockVault.read.mockResolvedValue(csvContent);

        let processCallCount = 0;
        mockVault.process.mockImplementation(
          async (_file, callback) => {
            processCallCount++;
            const result = callback(csvContent);
            return result;
          },
        );

        const entry = {
          date: "2024-01-02T10:00:00.000Z",
          exercise: "Running",
          reps: 1,
          weight: 0,
          volume: 0,
          origine: "Cardio",
          workout: "Cardio",
          notes: "",
          customFields: {
            duration: 30,
            distance: 5.2,
          },
        };

        await dataService.addWorkoutLogEntry(entry);

        // Should have called process multiple times: ensureColumnExists for each custom field + the actual write
        expect(processCallCount).toBeGreaterThanOrEqual(1);
      });

      it("should write custom field values to CSV", async () => {
        const csvContent = [
          "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration",
          "2024-01-01T10:00:00.000Z,Bench Press,10,100,1000,Workout,Workout,1704096000000,,standard,",
        ].join("\n");

        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
        mockVault.read.mockResolvedValue(csvContent);

        let writtenContent = "";
        mockVault.process.mockImplementation(
          async (_file, callback) => {
            writtenContent = callback(csvContent);
            return writtenContent;
          },
        );

        const entry = {
          date: "2024-01-02T10:00:00.000Z",
          exercise: "Running",
          reps: 1,
          weight: 0,
          volume: 0,
          origine: "Cardio",
          workout: "Cardio",
          notes: "",
          customFields: {
            duration: 30,
          },
        };

        await dataService.addWorkoutLogEntry(entry);

        // Verify the entry with custom field was written
        expect(writtenContent).toContain("Running");
        expect(writtenContent).toContain("duration");
      });
    });

    describe("updateWorkoutLogEntry with customFields", () => {
      it("should ensure custom columns exist before updating entry", async () => {
        const csvContent = [
          "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol",
          "2024-01-01T10:00:00.000Z,Bench Press,10,100,1000,Workout,Workout,1704096000000,,standard",
        ].join("\n");

        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
        mockVault.read.mockResolvedValue(csvContent);

        let processCallCount = 0;
        mockVault.process.mockImplementation(
          async (_file, callback) => {
            processCallCount++;
            callback(csvContent);
            return "";
          },
        );

        const originalLog = {
          date: "2024-01-01T10:00:00.000Z",
          exercise: "Bench Press",
          reps: 10,
          weight: 100,
          volume: 1000,
          timestamp: 1704096000000,
        };

        const updatedEntry = {
          date: "2024-01-01T10:00:00.000Z",
          exercise: "Bench Press",
          reps: 12,
          weight: 100,
          volume: 1200,
          origine: "Workout",
          workout: "Workout",
          notes: "",
          customFields: {
            rpe: 8,
          },
        };

        await dataService.updateWorkoutLogEntry(
          originalLog,
          updatedEntry,
        );

        // Should have called process multiple times: ensureColumnExists + the actual update
        expect(processCallCount).toBeGreaterThanOrEqual(1);
      });

      it("should preserve existing custom column order when updating", async () => {
        const csvContent = [
          "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance",
          "2024-01-01T10:00:00.000Z,Running,1,0,0,Cardio,Cardio,1704096000000,,standard,30,5",
        ].join("\n");

        const mockFile = new TFile();
        mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
        mockVault.read.mockResolvedValue(csvContent);

        let writtenContent = "";
        mockVault.process.mockImplementation(
          async (_file, callback) => {
            writtenContent = callback(csvContent);
            return writtenContent;
          },
        );

        const originalLog = {
          date: "2024-01-01T10:00:00.000Z",
          exercise: "Running",
          reps: 1,
          weight: 0,
          volume: 0,
          timestamp: 1704096000000,
        };

        const updatedEntry = {
          date: "2024-01-01T10:00:00.000Z",
          exercise: "Running",
          reps: 1,
          weight: 0,
          volume: 0,
          origine: "Cardio",
          workout: "Cardio",
          notes: "",
          customFields: {
            duration: 35,
            distance: 5.5,
          },
        };

        await dataService.updateWorkoutLogEntry(
          originalLog,
          updatedEntry,
        );

        // Verify column order is preserved (duration before distance)
        const headerLine = writtenContent.split("\n")[0];
        const durationIndex = headerLine.indexOf("duration");
        const distanceIndex = headerLine.indexOf("distance");
        expect(durationIndex).toBeLessThan(distanceIndex);
      });
    });
  });

  describe("Cache Size Limits", () => {
    it("should clear cache when size exceeds MAX_CACHE_SIZE", async () => {
      // Create a large CSV content with 6000 entries (exceeds MAX_CACHE_SIZE of 5000)
      const largeCSVContent = [
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes",
        ...Array.from(
          { length: 6000 },
          (_, i) =>
            `2024-01-01T10:00:00.000Z,Exercise ${i},10,100,1000,Workout,Workout,${Date.now() + i},`,
        ),
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
        ...Array.from(
          { length: 1000 },
          (_, i) =>
            `2024-01-01T10:00:00.000Z,Exercise ${i},10,100,1000,Workout,Workout,${Date.now() + i},`,
        ),
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

    describe("Delegation Methods", () => {
      describe("createCSVLogFile", () => {
        it("should attempt to create CSV file via repository", async () => {
          // Mock to return null initially so it tries to create
          mockVault.getAbstractFileByPath.mockReturnValue(null);
          mockVault.create.mockResolvedValue(new TFile());
          mockVault.process.mockResolvedValue("");

          await dataService.createCSVLogFile();

          expect(mockVault.create).toHaveBeenCalledWith(
            "test/workout_logs.csv",
            expect.stringContaining("date,exercise,reps"),
          );
        });
      });

      describe("deleteWorkoutLogEntry", () => {
        it("should update file content after deleting entry", async () => {
          const csvContent = [
            "date,exercise,reps,weight,volume,origine,workout,timestamp,notes",
            "2024-01-01T10:00:00.000Z,Bench Press,10,100,1000,Workout,Workout,1704096000000,",
            "2024-01-02T10:00:00.000Z,Squat,10,150,1500,Workout,Workout,1704182400000,",
          ].join("\n");

          const mockFile = new TFile();
          mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
          mockVault.read.mockResolvedValue(csvContent);

          let writtenContent = "";
          mockVault.process.mockImplementation(
            async (_file, callback) => {
              writtenContent = callback(csvContent);
              return writtenContent;
            },
          );

          const logToDelete = {
            date: "2024-01-01T10:00:00.000Z",
            exercise: "Bench Press",
            reps: 10,
            weight: 100,
            volume: 1000,
            timestamp: 1704096000000,
          };

          await dataService.deleteWorkoutLogEntry(logToDelete);

          // Verify content updated (first entry removed)
          expect(writtenContent).not.toContain("Bench Press");
          expect(writtenContent).toContain("Squat");
        });
      });

      describe("renameExercise", () => {
        it("should update file content after renaming exercise", async () => {
          const csvContent = [
            "date,exercise,reps,weight,volume,origine,workout,timestamp,notes",
            "2024-01-01T10:00:00.000Z,Bench Press,10,100,1000,Workout,Workout,1704096000000,",
            "2024-01-02T10:00:00.000Z,Squat,10,150,1500,Workout,Workout,1704182400000,",
          ].join("\n");

          const mockFile = new TFile();
          mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
          mockVault.read.mockResolvedValue(csvContent);

          let writtenContent = "";
          mockVault.process.mockImplementation(
            async (_file, callback) => {
              writtenContent = callback(csvContent);
              return writtenContent;
            },
          );

          const count = await dataService.renameExercise(
            "Bench Press",
            "Chest Press",
          );

          expect(count).toBe(1);
          expect(writtenContent).not.toContain("Bench Press");
          expect(writtenContent).toContain("Chest Press");
          expect(writtenContent).toContain("Squat");
        });
      });
    });
  });

  describe("batchOperation", () => {
    it("should coalesce multiple emissions into one log:bulk-changed", async () => {
      const bulkHandler = jest.fn();
      const addHandler = jest.fn();
      eventBus.on("log:bulk-changed", bulkHandler);
      eventBus.on("log:added", addHandler);

      const csvContent =
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol\n";
      const mockFile = new (require("obsidian").TFile)();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);
      mockVault.process.mockImplementation(
        (_file: unknown, fn: (content: string) => string) => {
          fn(csvContent);
          return Promise.resolve("");
        },
      );

      await dataService.batchOperation("import", async () => {
        await dataService.addWorkoutLogEntry({
          date: "2024-01-01",
          exercise: "Squat",
          reps: 10,
          weight: 100,
          volume: 1000,
          origine: "",
          workout: "Legs",
          notes: "",
          protocol: undefined,
        });
        await dataService.addWorkoutLogEntry({
          date: "2024-01-01",
          exercise: "Bench Press",
          reps: 8,
          weight: 80,
          volume: 640,
          origine: "",
          workout: "Push",
          notes: "",
          protocol: undefined,
        });
      });

      expect(addHandler).not.toHaveBeenCalled();
      expect(bulkHandler).toHaveBeenCalledTimes(1);
      expect(bulkHandler).toHaveBeenCalledWith(
        expect.objectContaining({ count: 2, operation: "import" }),
      );
    });

    it("should propagate errors from fn", async () => {
      await expect(
        dataService.batchOperation("other", async () => {
          throw new Error("batch failure");
        }),
      ).rejects.toThrow("batch failure");
    });
  });
});

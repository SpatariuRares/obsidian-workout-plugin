import { MuscleTagService } from "../MuscleTagService";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { MUSCLE_TAG_MAP } from "@app/constants/muscles.constants";
import { CHART_DATA_TYPE } from "@app/features/charts";

// Mock Obsidian module


// Import after mocking
import { TFile, TAbstractFile } from "obsidian";

// Define mock types
interface MockEventCallback {
  (file: TAbstractFile): void;
}

interface MockVault {
  getAbstractFileByPath: jest.Mock;
  read: jest.Mock;
  modify: jest.Mock;
  create: jest.Mock;
  createFolder: jest.Mock;
  on: jest.Mock;
  offref: jest.Mock;
}

interface MockApp {
  vault: MockVault;
}

describe("MuscleTagService", () => {
  let service: MuscleTagService;
  let mockApp: MockApp;
  let mockSettings: WorkoutChartsSettings;
  let mockVault: MockVault;
  let fileModifyCallback: MockEventCallback | null;

  beforeEach(() => {
    jest.clearAllMocks();
    fileModifyCallback = null;

    mockVault = {
      getAbstractFileByPath: jest.fn(),
      read: jest.fn(),
      modify: jest.fn(),
      create: jest.fn(),
      createFolder: jest.fn(),
      on: jest.fn((event: string, callback: MockEventCallback) => {
        if (event === "modify") {
          fileModifyCallback = callback;
        }
        return {}; // Return mock EventRef
      }),
      offref: jest.fn(),
    };

    mockApp = {
      vault: mockVault,
    };

    mockSettings = {
      csvLogFilePath: "workout-data/workout_logs.csv",
      exerciseFolderPath: "exercises",
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
      customProtocols: [],
      setDuration: 45,
      showQuickLogRibbon: true,
      recentExercises: [],
      quickWeightIncrement: 2.5,
      repDuration: 5,
      defaultRepsPerSet: 0, 
    };

    service = new MuscleTagService(mockApp as any, mockSettings);
  });

  afterEach(() => {
    service.destroy();
  });

  describe("constructor", () => {

    it("should compute CSV path based on settings", () => {
      expect(service.getCsvPath()).toBe("workout-data/muscle-tags.csv");
    });

    it("should handle root-level csvLogFilePath", () => {
      const rootSettings = { ...mockSettings, csvLogFilePath: "logs.csv" };
      const rootService = new MuscleTagService(mockApp as any, rootSettings);
      expect(rootService.getCsvPath()).toBe("muscle-tags.csv");
      rootService.destroy();
    });
  });

  describe("loadTags", () => {
    it("should parse valid CSV correctly", async () => {
      const csvContent = `tag,muscleGroup
petto,chest
schiena,back
spalle,shoulders
bicipiti,biceps`;

      const mockFile = new TFile();
      (mockFile as any).path = "workout-data/muscle-tags.csv";
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      expect(tags.size).toBe(4);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
      expect(tags.get("spalle")).toBe("shoulders");
      expect(tags.get("bicipiti")).toBe("biceps");
    });

    it("should return default tags when CSV does not exist", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const tags = await service.loadTags();

      // Should return MUSCLE_TAG_MAP defaults
      expect(tags.size).toBeGreaterThan(0);
      expect(tags.get("chest")).toBe("chest");
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("back")).toBe("back");
    });

    it("should return default tags when CSV is empty", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("");

      const tags = await service.loadTags();

      expect(tags.size).toBe(Object.keys(MUSCLE_TAG_MAP).length);
    });

    it("should handle malformed CSV rows gracefully", async () => {
      const csvContent = `tag,muscleGroup
petto,chest
invalidrow
,emptyTag
emptyGroup,
good,biceps`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      // Should only have the valid rows (petto,chest and good,biceps)
      // Rows with empty tag, empty group, or not enough columns are skipped
      expect(tags.size).toBe(2);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("good")).toBe("biceps");
    });

    it("should accept rows with extra columns (ignoring extras)", async () => {
      const csvContent = `tag,muscleGroup
petto,chest,extraColumn,anotherExtra`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      // Should parse the first two columns and ignore the rest
      expect(tags.size).toBe(1);
      expect(tags.get("petto")).toBe("chest");
    });

    it("should skip header line when present", async () => {
      const csvContent = `tag,muscleGroup
petto,chest`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      expect(tags.size).toBe(1);
      expect(tags.has("tag")).toBe(false); // Should not include header as a tag
      expect(tags.get("petto")).toBe("chest");
    });

    it("should handle CSV without header line", async () => {
      const csvContent = `petto,chest
schiena,back`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      expect(tags.size).toBe(2);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
    });

    it("should convert tags and groups to lowercase", async () => {
      const csvContent = `tag,muscleGroup
PETTO,CHEST
Schiena,Back`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
    });

    it("should handle quoted CSV values", async () => {
      const csvContent = `tag,muscleGroup
"petto, alto",chest
"back ""upper""",back`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      expect(tags.get("petto, alto")).toBe("chest");
      expect(tags.get('back "upper"')).toBe("back");
    });

    it("should handle read errors gracefully", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockRejectedValue(new Error("Read error"));

      const tags = await service.loadTags();

      // Should return defaults on error
      expect(tags.size).toBe(Object.keys(MUSCLE_TAG_MAP).length);
    });

    it("should deduplicate concurrent load requests", async () => {
      const csvContent = `tag,muscleGroup
petto,chest`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Call loadTags multiple times concurrently
      const [result1, result2, result3] = await Promise.all([
        service.loadTags(),
        service.loadTags(),
        service.loadTags(),
      ]);

      // All should get the same result
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);

      // Read should only be called once
      expect(mockVault.read).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveTags", () => {
    it("should write correct CSV format", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const tags = new Map([
        ["petto", "chest"],
        ["schiena", "back"],
        ["spalle", "shoulders"],
      ]);

      await service.saveTags(tags);

      expect(mockVault.create).toHaveBeenCalledWith(
        "workout-data/muscle-tags.csv",
        expect.stringContaining("tag,muscleGroup"),
      );

      const writtenContent = mockVault.create.mock.calls[0][1];
      expect(writtenContent).toContain("petto,chest");
      expect(writtenContent).toContain("schiena,back");
      expect(writtenContent).toContain("spalle,shoulders");
    });

    it("should modify existing file when it exists", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.modify.mockResolvedValue(undefined);

      const tags = new Map([["petto", "chest"]]);

      await service.saveTags(tags);

      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("petto,chest"),
      );
      expect(mockVault.create).not.toHaveBeenCalled();
    });

    it("should create parent folder if it does not exist", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const tags = new Map([["petto", "chest"]]);

      await service.saveTags(tags);

      // Should check for folder and potentially create it
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith(
        "workout-data",
      );
    });

    it("should escape CSV values containing special characters", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const tags = new Map([
        ["petto, alto", "chest"],
        ['back "upper"', "back"],
        ["tag\nwith\nnewlines", "shoulders"],
      ]);

      await service.saveTags(tags);

      const writtenContent = mockVault.create.mock.calls[0][1];
      // Values with special chars should be quoted
      expect(writtenContent).toContain('"petto, alto"');
      expect(writtenContent).toContain('"back ""upper"""');
      expect(writtenContent).toMatch(/"tag\nwith\nnewlines"/);
    });

    it("should update cache after saving", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const tags = new Map([["petto", "chest"]]);

      await service.saveTags(tags);

      // getTagMap should now return the saved tags
      const cachedTags = service.getTagMap();
      expect(cachedTags.get("petto")).toBe("chest");
    });

    it("should throw error on save failure", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockRejectedValue(new Error("Write failed"));

      const tags = new Map([["petto", "chest"]]);

      await expect(service.saveTags(tags)).rejects.toThrow("Write failed");
    });
  });

  describe("getTagMap", () => {
    it("should return cached data on subsequent calls", async () => {
      const csvContent = `tag,muscleGroup
petto,chest`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // First call triggers async load
      service.getTagMap();

      // Wait for async load to complete
      await service.loadTags();

      // Clear mock to verify cache is used
      mockVault.read.mockClear();

      // Second call should use cache
      const tags2 = service.getTagMap();

      expect(mockVault.read).not.toHaveBeenCalled();
      expect(tags2.get("petto")).toBe("chest");
    });

    it("should return defaults synchronously on first call", () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const tags = service.getTagMap();

      // Should return defaults immediately without waiting for async load
      expect(tags.size).toBeGreaterThan(0);
      expect(tags.get("chest")).toBe("chest");
    });

    it("should trigger background load on first call", () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      service.getTagMap();

      // getAbstractFileByPath is called during background load
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalled();
    });
  });

  describe("getTagMapAsObject", () => {
    it("should return tag map as plain object", async () => {
      const csvContent = `tag,muscleGroup
petto,chest
schiena,back`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      await service.loadTags();

      const obj = service.getTagMapAsObject();

      expect(obj).toEqual({ petto: "chest", schiena: "back" });
      expect(typeof obj).toBe("object");
      expect(obj instanceof Map).toBe(false);
    });
  });

  describe("cache invalidation", () => {
    it("should clear cache when file is modified", async () => {
      const csvContent = `tag,muscleGroup
petto,chest`;

      const mockFile = new TFile();
      (mockFile as any).path = "workout-data/muscle-tags.csv";
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Load and cache
      await service.loadTags();

      // Verify cache is populated
      mockVault.read.mockClear();
      service.getTagMap();
      expect(mockVault.read).not.toHaveBeenCalled();

      // Simulate file modification
      if (fileModifyCallback) {
        fileModifyCallback(mockFile);
      }

      // Setup for next read
      mockVault.read.mockResolvedValue(`tag,muscleGroup
petto,back`);

      // Now loading should read from file again
      const newTags = await service.loadTags();
      expect(mockVault.read).toHaveBeenCalled();
      expect(newTags.get("petto")).toBe("back");
    });

    it("should not clear cache when different file is modified", async () => {
      const csvContent = `tag,muscleGroup
petto,chest`;

      const mockFile = new TFile();
      (mockFile as any).path = "workout-data/muscle-tags.csv";
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Load and cache
      await service.loadTags();

      // Simulate modification of different file
      const differentFile = new TFile();
      (differentFile as any).path = "some/other/file.csv";
      if (fileModifyCallback) {
        fileModifyCallback(differentFile);
      }

      // Cache should still be valid
      mockVault.read.mockClear();
      service.getTagMap();
      expect(mockVault.read).not.toHaveBeenCalled();
    });

    it("should allow manual cache clearing", async () => {
      const csvContent = `tag,muscleGroup
petto,chest`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Load and cache
      await service.loadTags();
      mockVault.read.mockClear();

      // Manually clear cache
      service.clearCache();

      // Next load should read from file
      await service.loadTags();
      expect(mockVault.read).toHaveBeenCalled();
    });
  });

  describe("csvExists", () => {
    it("should return true when CSV file exists", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

      const exists = await service.csvExists();

      expect(exists).toBe(true);
    });

    it("should return false when CSV file does not exist", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const exists = await service.csvExists();

      expect(exists).toBe(false);
    });

    it("should return false when path points to folder not file", async () => {
      // Return something that's not a TFile
      mockVault.getAbstractFileByPath.mockReturnValue({});

      const exists = await service.csvExists();

      expect(exists).toBe(false);
    });
  });

  describe("createDefaultCsv", () => {
    it("should create CSV with default tags when file does not exist", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const created = await service.createDefaultCsv();

      expect(created).toBe(true);
      expect(mockVault.create).toHaveBeenCalled();

      const writtenContent = mockVault.create.mock.calls[0][1];
      expect(writtenContent).toContain("tag,muscleGroup");
      expect(writtenContent).toContain("chest,chest");
      expect(writtenContent).toContain("petto,chest");
    });

    it("should return false when CSV already exists", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

      const created = await service.createDefaultCsv();

      expect(created).toBe(false);
      expect(mockVault.create).not.toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("should clear cache on destroy", async () => {
      const service2 = new MuscleTagService(mockApp as any, mockSettings);

      const csvContent = `tag,muscleGroup\npetto,chest`;
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Load to populate cache
      await service2.loadTags();
      mockVault.read.mockClear();

      // Verify cache is populated
      const cached = service2.getTagMap();
      expect(cached.get("petto")).toBe("chest");

      // Destroy should clear the cache
      service2.destroy();
    });

    it("should clear cache on destroy", async () => {
      const csvContent = `tag,muscleGroup
petto,chest`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Load and cache
      await service.loadTags();

      // Destroy
      service.destroy();

      // Re-create service for testing
      const newService = new MuscleTagService(mockApp as any, mockSettings);

      // Should load fresh (not use old cache)
      mockVault.read.mockClear();
      await newService.loadTags();
      expect(mockVault.read).toHaveBeenCalled();

      newService.destroy();
    });
  });

  describe("getCsvPath", () => {
    it("should return the computed CSV path", () => {
      expect(service.getCsvPath()).toBe("workout-data/muscle-tags.csv");
    });
  });
});

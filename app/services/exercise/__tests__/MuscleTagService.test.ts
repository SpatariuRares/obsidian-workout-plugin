import { MuscleTagService } from "../MuscleTagService";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { MUSCLE_TAG_ENTRIES } from "@app/constants/muscles.constants";
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
  let originalLocalStorage: Storage;

  beforeEach(() => {
    jest.clearAllMocks();
    fileModifyCallback = null;

    // Mock window and localStorage
    if (!global.window) {
      (global as any).window = {};
    }
    originalLocalStorage = (global.window as any).localStorage;

    const mockLocalStorage = {
      getItem: jest.fn((key: string) => {
        if (key === "language") return "en";
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    };

    Object.defineProperty(global.window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

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
      weightUnit: "kg",
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
    // Restore original localStorage
    if (originalLocalStorage !== undefined) {
      Object.defineProperty(global.window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    }
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
    it("should parse valid CSV correctly with English tags", async () => {
      const csvContent = `tag,muscleGroup,language
petto,chest,en
schiena,back,en
spalle,shoulders,en
bicipiti,biceps,en`;

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

    it("should filter tags by user language", async () => {
      const csvContent = `tag,muscleGroup,language
petto,chest,it
chest,chest,en
schiena,back,it
back,back,en`;

      const mockFile = new TFile();
      (mockFile as any).path = "workout-data/muscle-tags.csv";
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      // Should only include English tags (user language is 'en')
      expect(tags.size).toBe(2);
      expect(tags.get("chest")).toBe("chest");
      expect(tags.get("back")).toBe("back");
      expect(tags.has("petto")).toBe(false);
      expect(tags.has("schiena")).toBe(false);
    });

    it("should include both user language and English tags", async () => {
      // Change user language to Italian
      (window.localStorage.getItem as jest.Mock).mockReturnValue("it");

      const csvContent = `tag,muscleGroup,language
petto,chest,it
chest,chest,en
schiena,back,it
back,back,en
spalle,shoulders,it`;

      const mockFile = new TFile();
      (mockFile as any).path = "workout-data/muscle-tags.csv";
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      // Should include both Italian and English tags
      expect(tags.size).toBe(5);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("chest")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
      expect(tags.get("back")).toBe("back");
      expect(tags.get("spalle")).toBe("shoulders");

      // Reset to English
      (window.localStorage.getItem as jest.Mock).mockReturnValue("en");
    });

    it("should return default tags when CSV does not exist", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const tags = await service.loadTags();

      // Should return filtered defaults (only English tags since mock language is 'en')
      expect(tags.size).toBeGreaterThan(0);
      expect(tags.get("chest")).toBe("chest");
      expect(tags.get("back")).toBe("back");
      expect(tags.get("biceps")).toBe("biceps");
      // Italian tags should not be included
      expect(tags.has("petto")).toBe(false);
      expect(tags.has("schiena")).toBe(false);
    });

    it("should return default tags when CSV is empty", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("");

      const tags = await service.loadTags();

      // Should return filtered defaults (only English since mock language is 'en')
      const expectedEnglishTags = MUSCLE_TAG_ENTRIES.filter(
        (e) => e.language === "en",
      );
      expect(tags.size).toBe(expectedEnglishTags.length);
    });

    it("should automatically migrate old CSV format to new format", async () => {
      const oldCsvContent = `tag,muscleGroup
petto,chest
schiena,back
spalle,shoulders`;

      const mockFile = new TFile();
      (mockFile as any).path = "workout-data/muscle-tags.csv";
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValueOnce(oldCsvContent);

      // After migration, return the new format
      const newCsvContent = `tag,muscleGroup,language
petto,chest,en
schiena,back,en
spalle,shoulders,en`;
      mockVault.modify.mockResolvedValue(undefined);
      mockVault.read.mockResolvedValueOnce(newCsvContent);

      const tags = await service.loadTags();

      // Should have called modify to migrate the CSV
      expect(mockVault.modify).toHaveBeenCalled();

      // Should return migrated tags (all with language 'en')
      expect(tags.size).toBe(3);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
      expect(tags.get("spalle")).toBe("shoulders");
    });

    it("should migrate old CSV without header", async () => {
      const oldCsvContent = `petto,chest
schiena,back`;

      const mockFile = new TFile();
      (mockFile as any).path = "workout-data/muscle-tags.csv";
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValueOnce(oldCsvContent);

      const newCsvContent = `tag,muscleGroup,language
petto,chest,en
schiena,back,en`;
      mockVault.modify.mockResolvedValue(undefined);
      mockVault.read.mockResolvedValueOnce(newCsvContent);

      await service.loadTags();

      expect(mockVault.modify).toHaveBeenCalled();
      const migratedContent = mockVault.modify.mock.calls[0][1];
      expect(migratedContent).toContain("tag,muscleGroup,language");
      expect(migratedContent).toContain("petto,chest,en");
      expect(migratedContent).toContain("schiena,back,en");
    });

    it("should handle malformed CSV rows gracefully", async () => {
      const csvContent = `tag,muscleGroup,language
petto,chest,en
invalidrow
,emptyTag,en
emptyGroup,,en
good,biceps,en`;

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
      const csvContent = `tag,muscleGroup,language
petto,chest,en,extraColumn,anotherExtra`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      // Should parse the first three columns and ignore the rest
      expect(tags.size).toBe(1);
      expect(tags.get("petto")).toBe("chest");
    });

    it("should skip header line when present", async () => {
      const csvContent = `tag,muscleGroup,language
petto,chest,en`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      expect(tags.size).toBe(1);
      expect(tags.has("tag")).toBe(false); // Should not include header as a tag
      expect(tags.get("petto")).toBe("chest");
    });

    it("should handle CSV without header line", async () => {
      const csvContent = `petto,chest,en
schiena,back,en`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      expect(tags.size).toBe(2);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
    });

    it("should convert tags and groups to lowercase", async () => {
      const csvContent = `tag,muscleGroup,language
PETTO,CHEST,EN
Schiena,Back,EN`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      const tags = await service.loadTags();

      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
    });

    it("should handle quoted CSV values", async () => {
      const csvContent = `tag,muscleGroup,language
"petto, alto",chest,en
"back ""upper""",back,en`;

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

      // Should return filtered defaults on error (only English since mock language is 'en')
      const expectedEnglishTags = MUSCLE_TAG_ENTRIES.filter(
        (e) => e.language === "en",
      );
      expect(tags.size).toBe(expectedEnglishTags.length);
    });

    it("should deduplicate concurrent load requests", async () => {
      const csvContent = `tag,muscleGroup,language
petto,chest,en`;

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
    it("should write correct CSV format with language column", async () => {
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
        expect.stringContaining("tag,muscleGroup,language"),
      );

      const writtenContent = mockVault.create.mock.calls[0][1];
      expect(writtenContent).toContain("petto,chest,en");
      expect(writtenContent).toContain("schiena,back,en");
      expect(writtenContent).toContain("spalle,shoulders,en");
    });

    it("should allow custom language code", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const tags = new Map([["petto", "chest"]]);

      await service.saveTags(tags, "it");

      const writtenContent = mockVault.create.mock.calls[0][1];
      expect(writtenContent).toContain("petto,chest,it");
    });

    it("should modify existing file when it exists", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.modify.mockResolvedValue(undefined);

      const tags = new Map([["petto", "chest"]]);

      await service.saveTags(tags);

      expect(mockVault.modify).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining("petto,chest,en"),
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
      expect(writtenContent).toContain('"petto, alto",chest');
      expect(writtenContent).toContain('"back ""upper""",back');
      expect(writtenContent).toMatch(/"tag\nwith\nnewlines",shoulders/);
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
      const csvContent = `tag,muscleGroup,language
petto,chest,en`;

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
      const csvContent = `tag,muscleGroup,language
chest,chest,en
back,back,en`;

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Clear cache first to ensure clean state
      service.clearCache();

      await service.loadTags();

      const obj = service.getTagMapAsObject();

      // Should contain exactly the loaded tags
      expect(Object.keys(obj)).toHaveLength(2);
      expect(obj.chest).toBe("chest");
      expect(obj.back).toBe("back");
      expect(typeof obj).toBe("object");
      expect(obj instanceof Map).toBe(false);
    });
  });

  describe("cache invalidation", () => {
    it("should clear cache when file is modified", async () => {
      const csvContent = `tag,muscleGroup,language
chest,chest,en`;

      const mockFile = new TFile();
      (mockFile as any).path = "workout-data/muscle-tags.csv";
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Load and cache
      await service.loadTags();

      // Clear read mock and verify cache is used
      mockVault.read.mockClear();
      mockVault.getAbstractFileByPath.mockClear();

      // getTagMap should return cached data without reading file
      const cachedMap = service.getTagMap();
      expect(cachedMap.get("chest")).toBe("chest");
      expect(mockVault.getAbstractFileByPath).not.toHaveBeenCalled();

      // Simulate file modification
      if (fileModifyCallback) {
        fileModifyCallback(mockFile);
      }

      // Setup for next read
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(`tag,muscleGroup,language
chest,back,en`);

      // Now loading should read from file again
      const newTags = await service.loadTags();
      expect(mockVault.read).toHaveBeenCalled();
      expect(newTags.get("chest")).toBe("back");
    });

    it("should not clear cache when different file is modified", async () => {
      const csvContent = `tag,muscleGroup,language
chest,chest,en`;

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
      mockVault.getAbstractFileByPath.mockClear();

      const cachedMap = service.getTagMap();
      expect(cachedMap.get("chest")).toBe("chest");
      expect(mockVault.getAbstractFileByPath).not.toHaveBeenCalled();
    });

    it("should allow manual cache clearing", async () => {
      const csvContent = `tag,muscleGroup,language
petto,chest,en`;

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
    it("should create CSV with ALL default tags and their languages", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const created = await service.createDefaultCsv();

      expect(created).toBe(true);
      expect(mockVault.create).toHaveBeenCalled();

      const writtenContent = mockVault.create.mock.calls[0][1];
      expect(writtenContent).toContain("tag,muscleGroup,language");
      // Should contain English tags
      expect(writtenContent).toContain("chest,chest,en");
      expect(writtenContent).toContain("back,back,en");
      // Should contain Italian tags with correct language
      expect(writtenContent).toContain("petto,chest,it");
      expect(writtenContent).toContain("schiena,back,it");
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

      const csvContent = `tag,muscleGroup,language\nchest,chest,en`;
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Load to populate cache
      await service2.loadTags();
      mockVault.read.mockClear();

      // Verify cache is populated
      const cached = service2.getTagMap();
      expect(cached.get("chest")).toBe("chest");

      // Destroy should clear the cache
      service2.destroy();
    });

    it("should clear cache on destroy", async () => {
      const csvContent = `tag,muscleGroup,language
petto,chest,en`;

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

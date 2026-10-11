import { MuscleTagService } from "../MuscleTagService";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { MUSCLE_TAG_ENTRIES } from "@app/constants/muscles.constants";
import { CHART_DATA_TYPE } from "@app/features/charts/types";

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
      expect(service.getCsvPath()).toBe(
        "workout-data/muscle-tags.csv",
      );
    });

    it("should handle root-level csvLogFilePath", () => {
      const rootSettings = {
        ...mockSettings,
        csvLogFilePath: "logs.csv",
      };
      const rootService = new MuscleTagService(
        mockApp as any,
        rootSettings,
      );
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
      (window.localStorage.getItem as jest.Mock).mockReturnValue(
        "it",
      );

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
      (window.localStorage.getItem as jest.Mock).mockReturnValue(
        "en",
      );
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
      expect(writtenContent).toMatch(
        /"tag\nwith\nnewlines",shoulders/,
      );
    });

    it("should update cache after saving", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockResolvedValue(new TFile());

      const tags = new Map([["petto", "chest"]]);

      await service.saveTags(tags);

      // tagMap should now return the saved tags
      const cachedTags = await service.tagMap();
      expect(cachedTags.get("petto")).toBe("chest");
    });

    it("should throw error on save failure", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);
      mockVault.create.mockRejectedValue(new Error("Write failed"));

      const tags = new Map([["petto", "chest"]]);

      await expect(service.saveTags(tags)).rejects.toThrow(
        "Write failed",
      );
    });
  });

  describe("tagMap", () => {
    it("returns the user's tags on the very first call, not the defaults", async () => {
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("tag,muscleGroup,language\npetto,chest,en");

      const tags = await service.tagMap();

      expect(tags).toEqual(new Map([["petto", "chest"]]));
    });

    it("reads the file once and then serves the cache", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(new TFile());
      mockVault.read.mockResolvedValue("tag,muscleGroup,language\npetto,chest,en");

      await service.tagMap();
      await service.tagMap();

      expect(mockVault.read).toHaveBeenCalledTimes(1);
    });

    it("uses the defaults when there is no tag file", async () => {
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      expect((await service.tagMap()).get("chest")).toBe("chest");
    });
  });

  describe("musclesForTags", () => {
    beforeEach(() => {
      mockVault.getAbstractFileByPath.mockReturnValue(new TFile());
      // A user tag file from before specific muscles existed
      mockVault.read.mockResolvedValue("tag,muscleGroup,language\npetto,chest,en");
    });

    it("maps tags through the user's tag map, ignoring case", async () => {
      expect(await service.musclesForTags(["Petto"])).toEqual(["chest"]);
    });

    it("recognizes a muscle group named directly, even if the tag file predates it", async () => {
      expect(
        (await service.musclesForTags(["upper_chest", "Side Delts", "rear-delts"])).sort(),
      ).toEqual(["rear_delts", "side_delts", "upper_chest"]);
    });

    it("ignores tags that aren't muscles and lists each muscle once", async () => {
      expect(
        await service.musclesForTags(["compound", "petto", "chest", "#petto"]),
      ).toEqual(["chest"]);
    });
  });

  describe("musclesForExercise", () => {
    function withNotes(notes: Record<string, unknown>) {
      const files = Object.keys(notes).map((path) =>
        Object.assign(new TFile(), {
          path,
          basename: path.split("/").pop()!.replace(/\.md$/, ""),
          extension: "md",
        }),
      );
      Object.assign(mockVault, { getMarkdownFiles: () => files });
      (mockApp as unknown as Record<string, unknown>).metadataCache = {
        getFileCache: (file: TFile) => ({ frontmatter: { tags: notes[file.path] } }),
      };
      mockVault.getAbstractFileByPath.mockReturnValue(null); // default tags
    }

    it("reads the muscles from the tags of the exercise's note", async () => {
      withNotes({ "exercises/Bench press.md": ["chest", "triceps", "compound"] });

      expect((await service.musclesForExercise("Bench press")).sort()).toEqual([
        "chest",
        "triceps",
      ]);
    });

    it("prefers the note with the exact name over one that only contains it", async () => {
      withNotes({
        "exercises/Front squat.md": ["quads"],
        "exercises/Squat.md": ["glutes"],
      });

      expect(await service.musclesForExercise("Squat")).toEqual(["glutes"]);
    });

    it("never guesses muscles from the exercise name", async () => {
      // "curl" is a default tag for biceps
      withNotes({ "exercises/Leg curl.md": [] });

      expect(await service.musclesForExercise("Leg curl")).toEqual([]);
      expect(await service.musclesForExercise("Barbell curl")).toEqual([]);
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

      // tagMap should return cached data without reading file
      const cachedMap = await service.tagMap();
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

      const cachedMap = await service.tagMap();
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
      const service2 = new MuscleTagService(
        mockApp as any,
        mockSettings,
      );

      const csvContent = `tag,muscleGroup,language\nchest,chest,en`;
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue(csvContent);

      // Load to populate cache
      await service2.loadTags();
      mockVault.read.mockClear();

      // Verify cache is populated
      const cached = await service2.tagMap();
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
      const newService = new MuscleTagService(
        mockApp as any,
        mockSettings,
      );

      // Should load fresh (not use old cache)
      mockVault.read.mockClear();
      await newService.loadTags();
      expect(mockVault.read).toHaveBeenCalled();

      newService.destroy();
    });
  });

  describe("getCsvPath", () => {
    it("should return the computed CSV path", () => {
      expect(service.getCsvPath()).toBe(
        "workout-data/muscle-tags.csv",
      );
    });
  });
});

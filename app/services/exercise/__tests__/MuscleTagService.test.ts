import { MuscleTagService } from "../MuscleTagService";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { MUSCLE_TAG_ENTRIES } from "@app/constants/muscles.constants";
import { App, getLanguage } from "obsidian";

/** Where the service keeps the tags: next to the workout log */
const CSV = "workout-data/muscle-tags.csv";

describe("MuscleTagService", () => {
  let service: MuscleTagService;
  let vault: FakeVault;
  let mockSettings: WorkoutChartsSettings;

  /** A service on `vault`, its exercise pages read from the same vault */
  const createService = (settings = mockSettings) =>
    new MuscleTagService(
      vault.app as unknown as App,
      settings,
      new ExerciseLibrary(vault.app as never, settings),
    );

  /** Puts the tag file in the vault with this text */
  const withCsv = (content: string) => vault.app.vault.create(CSV, content);

  const readSpy = () => jest.spyOn(vault.app.vault, "read");

  beforeEach(() => {
    jest.clearAllMocks();

    (getLanguage as jest.Mock).mockReturnValue("en");

    vault = new FakeVault();

    mockSettings = {
      csvLogFilePath: "workout-data/workout_logs.csv",
      exerciseFolderPath: "exercises",
      weightUnit: "kg",
      defaultExactMatch: true,
      timerPresets: {},
      defaultTimerPreset: null,
      weightIncrement: 2.5,
      achievedTargets: {},
      customProtocols: [],
      setDuration: 45,
      recentExercises: [],
      quickWeightIncrement: 2.5,
      repDuration: 5,
      defaultRepsPerSet: 0,
    } as unknown as WorkoutChartsSettings;

    service = createService();
  });

  afterEach(() => {
    service.destroy();
  });

  describe("constructor", () => {
    it("should compute CSV path based on settings", () => {
      expect(service.getCsvPath()).toBe(CSV);
    });

    it("should handle root-level csvLogFilePath", () => {
      const rootService = createService({
        ...mockSettings,
        csvLogFilePath: "logs.csv",
      });
      expect(rootService.getCsvPath()).toBe("muscle-tags.csv");
      rootService.destroy();
    });
  });

  describe("loadTags", () => {
    it("should parse valid CSV correctly with English tags", async () => {
      await withCsv(`tag,muscleGroup,language
petto,chest,en
schiena,back,en
spalle,shoulders,en
bicipiti,biceps,en`);

      const tags = await service.loadTags();

      expect(tags.size).toBe(4);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
      expect(tags.get("spalle")).toBe("shoulders");
      expect(tags.get("bicipiti")).toBe("biceps");
    });

    it("should filter tags by user language", async () => {
      await withCsv(`tag,muscleGroup,language
petto,chest,it
chest,chest,en
schiena,back,it
back,back,en`);

      const tags = await service.loadTags();

      // Should only include English tags (user language is 'en')
      expect(tags.size).toBe(2);
      expect(tags.get("chest")).toBe("chest");
      expect(tags.get("back")).toBe("back");
      expect(tags.has("petto")).toBe(false);
      expect(tags.has("schiena")).toBe(false);
    });

    it("should include both user language and English tags", async () => {
      (getLanguage as jest.Mock).mockReturnValue("it");
      await withCsv(`tag,muscleGroup,language
petto,chest,it
chest,chest,en
schiena,back,it
back,back,en
spalle,shoulders,it`);

      const tags = await service.loadTags();

      // Should include both Italian and English tags
      expect(tags.size).toBe(5);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("chest")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
      expect(tags.get("back")).toBe("back");
      expect(tags.get("spalle")).toBe("shoulders");
    });

    it("should return default tags when CSV does not exist", async () => {
      const tags = await service.loadTags();

      // Only English defaults, since the language is 'en'
      expect(tags.size).toBeGreaterThan(0);
      expect(tags.get("chest")).toBe("chest");
      expect(tags.get("back")).toBe("back");
      expect(tags.get("biceps")).toBe("biceps");
      expect(tags.has("petto")).toBe(false);
      expect(tags.has("schiena")).toBe(false);
    });

    it("should return default tags when CSV is empty", async () => {
      await withCsv("");

      const tags = await service.loadTags();

      const expectedEnglishTags = MUSCLE_TAG_ENTRIES.filter(
        (e) => e.language === "en",
      );
      expect(tags.size).toBe(expectedEnglishTags.length);
    });

    it("should automatically migrate old CSV format to new format", async () => {
      await withCsv(`tag,muscleGroup
petto,chest
schiena,back
spalle,shoulders`);

      const tags = await service.loadTags();

      // The file now has the language column (all 'en')
      expect(vault.content(CSV)).toBe(`tag,muscleGroup,language
petto,chest,en
schiena,back,en
spalle,shoulders,en`);
      expect(tags.size).toBe(3);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
      expect(tags.get("spalle")).toBe("shoulders");
    });

    it("should migrate old CSV without header", async () => {
      await withCsv(`petto,chest
schiena,back`);

      await service.loadTags();

      const migratedContent = vault.content(CSV);
      expect(migratedContent).toContain("tag,muscleGroup,language");
      expect(migratedContent).toContain("petto,chest,en");
      expect(migratedContent).toContain("schiena,back,en");
    });

    it("should handle malformed CSV rows gracefully", async () => {
      await withCsv(`tag,muscleGroup,language
petto,chest,en
invalidrow
,emptyTag,en
emptyGroup,,en
good,biceps,en`);

      const tags = await service.loadTags();

      // Rows with empty tag, empty group, or not enough columns are skipped
      expect(tags.size).toBe(2);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("good")).toBe("biceps");
    });

    it("should accept rows with extra columns (ignoring extras)", async () => {
      await withCsv(`tag,muscleGroup,language
petto,chest,en,extraColumn,anotherExtra`);

      const tags = await service.loadTags();

      expect(tags.size).toBe(1);
      expect(tags.get("petto")).toBe("chest");
    });

    it("should skip header line when present", async () => {
      await withCsv(`tag,muscleGroup,language
petto,chest,en`);

      const tags = await service.loadTags();

      expect(tags.size).toBe(1);
      expect(tags.has("tag")).toBe(false);
      expect(tags.get("petto")).toBe("chest");
    });

    it("should handle CSV without header line", async () => {
      await withCsv(`petto,chest,en
schiena,back,en`);

      const tags = await service.loadTags();

      expect(tags.size).toBe(2);
      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
    });

    it("should convert tags and groups to lowercase", async () => {
      await withCsv(`tag,muscleGroup,language
PETTO,CHEST,EN
Schiena,Back,EN`);

      const tags = await service.loadTags();

      expect(tags.get("petto")).toBe("chest");
      expect(tags.get("schiena")).toBe("back");
    });

    it("should handle quoted CSV values", async () => {
      await withCsv(`tag,muscleGroup,language
"petto, alto",chest,en
"back ""upper""",back,en`);

      const tags = await service.loadTags();

      expect(tags.get("petto, alto")).toBe("chest");
      expect(tags.get('back "upper"')).toBe("back");
    });

    it("should handle read errors gracefully", async () => {
      await withCsv("tag,muscleGroup,language\npetto,chest,en");
      readSpy().mockRejectedValue(new Error("Read error"));

      const tags = await service.loadTags();

      const expectedEnglishTags = MUSCLE_TAG_ENTRIES.filter(
        (e) => e.language === "en",
      );
      expect(tags.size).toBe(expectedEnglishTags.length);
    });

    it("should deduplicate concurrent load requests", async () => {
      await withCsv(`tag,muscleGroup,language
petto,chest,en`);
      const read = readSpy();

      const [result1, result2, result3] = await Promise.all([
        service.loadTags(),
        service.loadTags(),
        service.loadTags(),
      ]);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(read).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveTags", () => {
    it("should write correct CSV format with language column", async () => {
      await service.saveTags(
        new Map([
          ["petto", "chest"],
          ["schiena", "back"],
          ["spalle", "shoulders"],
        ]),
      );

      const writtenContent = vault.content(CSV);
      expect(writtenContent).toContain("tag,muscleGroup,language");
      expect(writtenContent).toContain("petto,chest,en");
      expect(writtenContent).toContain("schiena,back,en");
      expect(writtenContent).toContain("spalle,shoulders,en");
    });

    it("should allow custom language code", async () => {
      await service.saveTags(new Map([["petto", "chest"]]), "it");

      expect(vault.content(CSV)).toContain("petto,chest,it");
    });

    it("should modify existing file when it exists", async () => {
      await withCsv("tag,muscleGroup,language\nold,back,en");
      const file = vault.file(CSV);
      const create = jest.spyOn(vault.app.vault, "create");

      await service.saveTags(new Map([["petto", "chest"]]));

      expect(vault.file(CSV)).toBe(file);
      expect(vault.content(CSV)).toBe("tag,muscleGroup,language\npetto,chest,en");
      expect(create).not.toHaveBeenCalled();
    });

    it("should create parent folder if it does not exist", async () => {
      await service.saveTags(new Map([["petto", "chest"]]));

      expect(vault.app.vault.getFolderByPath("workout-data")).not.toBeNull();
      expect(vault.paths()).toEqual([CSV]);
    });

    it("should escape CSV values containing special characters", async () => {
      await service.saveTags(
        new Map([
          ["petto, alto", "chest"],
          ['back "upper"', "back"],
          ["tag\nwith\nnewlines", "shoulders"],
        ]),
      );

      const writtenContent = vault.content(CSV);
      expect(writtenContent).toContain('"petto, alto",chest');
      expect(writtenContent).toContain('"back ""upper""",back');
      expect(writtenContent).toMatch(/"tag\nwith\nnewlines",shoulders/);
    });

    it("should update cache after saving", async () => {
      await service.saveTags(new Map([["petto", "chest"]]));
      const read = readSpy();

      const cachedTags = await service.tagMap();
      expect(cachedTags.get("petto")).toBe("chest");
      expect(read).not.toHaveBeenCalled();
    });

    it("should throw error on save failure", async () => {
      jest
        .spyOn(vault.app.vault, "create")
        .mockRejectedValue(new Error("Write failed"));

      await expect(
        service.saveTags(new Map([["petto", "chest"]])),
      ).rejects.toThrow("Write failed");
    });
  });

  describe("tagMap", () => {
    it("returns the user's tags on the very first call, not the defaults", async () => {
      await withCsv("tag,muscleGroup,language\npetto,chest,en");

      const tags = await service.tagMap();

      expect(tags).toEqual(new Map([["petto", "chest"]]));
    });

    it("reads the file once and then serves the cache", async () => {
      await withCsv("tag,muscleGroup,language\npetto,chest,en");
      const read = readSpy();

      await service.tagMap();
      await service.tagMap();

      expect(read).toHaveBeenCalledTimes(1);
    });

    it("uses the defaults when there is no tag file", async () => {
      expect((await service.tagMap()).get("chest")).toBe("chest");
    });
  });

  describe("musclesForTags", () => {
    beforeEach(async () => {
      // A user tag file from before specific muscles existed
      await withCsv("tag,muscleGroup,language\npetto,chest,en");
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
    /** Exercise pages in the "exercises" folder: path → frontmatter (default tags) */
    function withNotes(notes: Record<string, Record<string, unknown>>) {
      for (const [path, frontmatter] of Object.entries(notes)) {
        vault.write(path, frontmatter);
      }
    }

    it("reads the muscles from the tags of the exercise's note", async () => {
      withNotes({ "exercises/Bench press.md": { tags: ["chest", "triceps", "compound"] } });

      expect((await service.musclesForExercise("Bench press")).sort()).toEqual([
        "chest",
        "triceps",
      ]);
    });

    it("prefers the note with the exact name over one that only contains it", async () => {
      withNotes({
        "exercises/Front squat.md": { tags: ["quads"] },
        "exercises/Squat.md": { tags: ["glutes"] },
      });

      expect(await service.musclesForExercise("Squat")).toEqual(["glutes"]);
    });

    it("doesn't take muscles from a page whose name only contains the exercise", async () => {
      withNotes({ "exercises/Squat Multi Power.md": { tags: ["quads"] } });

      expect(await service.musclesForExercise("Squat")).toEqual([]);
    });

    it("reads the muscles of the page named by its frontmatter", async () => {
      withNotes({
        "exercises/Bench Press.md": { nome_esercizio: "Panca piana", tags: ["chest"] },
      });

      expect(await service.musclesForExercise("Panca piana")).toEqual(["chest"]);
    });

    it("never guesses muscles from the exercise name", async () => {
      // "curl" is a default tag for biceps
      withNotes({ "exercises/Leg curl.md": { tags: [] } });

      expect(await service.musclesForExercise("Leg curl")).toEqual([]);
      expect(await service.musclesForExercise("Barbell curl")).toEqual([]);
    });
  });

  describe("cache invalidation", () => {
    it("should read the file again when it is loaded after a change", async () => {
      await withCsv(`tag,muscleGroup,language
chest,chest,en`);
      await service.loadTags();
      const read = readSpy();

      // tagMap returns the cached data without reading the file
      expect((await service.tagMap()).get("chest")).toBe("chest");
      expect(read).not.toHaveBeenCalled();

      await vault.app.vault.modify(
        vault.file(CSV),
        `tag,muscleGroup,language
chest,back,en`,
      );

      const newTags = await service.loadTags();
      expect(read).toHaveBeenCalled();
      expect(newTags.get("chest")).toBe("back");
    });

    it("should not clear cache when different file is modified", async () => {
      await withCsv(`tag,muscleGroup,language
chest,chest,en`);
      await service.loadTags();

      await vault.app.vault.create("some/other/file.csv", "x");
      await vault.app.vault.modify(vault.file("some/other/file.csv"), "y");
      const read = readSpy();

      expect((await service.tagMap()).get("chest")).toBe("chest");
      expect(read).not.toHaveBeenCalled();
    });

    it("should allow manual cache clearing", async () => {
      await withCsv(`tag,muscleGroup,language
petto,chest,en`);
      await service.loadTags();
      const read = readSpy();

      service.clearCache();
      await service.tagMap();

      expect(read).toHaveBeenCalled();
    });
  });

  describe("csvExists", () => {
    it("should return true when CSV file exists", async () => {
      await withCsv("");

      expect(await service.csvExists()).toBe(true);
    });

    it("should return false when CSV file does not exist", async () => {
      expect(await service.csvExists()).toBe(false);
    });

    it("should return false when path points to folder not file", async () => {
      await vault.app.vault.create(`${CSV}/inside.md`, "");

      expect(await service.csvExists()).toBe(false);
    });
  });

  describe("createDefaultCsv", () => {
    it("should create CSV with ALL default tags and their languages", async () => {
      const created = await service.createDefaultCsv();

      expect(created).toBe(true);
      const writtenContent = vault.content(CSV);
      expect(writtenContent).toContain("tag,muscleGroup,language");
      // English tags
      expect(writtenContent).toContain("chest,chest,en");
      expect(writtenContent).toContain("back,back,en");
      // Italian tags with their language
      expect(writtenContent).toContain("petto,chest,it");
      expect(writtenContent).toContain("schiena,back,it");
    });

    it("should return false when CSV already exists", async () => {
      await withCsv("tag,muscleGroup,language\npetto,chest,en");

      const created = await service.createDefaultCsv();

      expect(created).toBe(false);
      expect(vault.content(CSV)).toBe("tag,muscleGroup,language\npetto,chest,en");
    });
  });

  describe("destroy", () => {
    it("should clear cache on destroy", async () => {
      await withCsv(`tag,muscleGroup,language
petto,chest,en`);
      await service.loadTags();
      const read = readSpy();

      service.destroy();
      await service.tagMap();

      expect(read).toHaveBeenCalled();
    });

    it("should not share its cache with a new service", async () => {
      await withCsv(`tag,muscleGroup,language
petto,chest,en`);
      await service.loadTags();
      service.destroy();

      const newService = createService();
      const read = readSpy();
      await newService.loadTags();
      expect(read).toHaveBeenCalled();

      newService.destroy();
    });
  });

  describe("getCsvPath", () => {
    it("should return the computed CSV path", () => {
      expect(service.getCsvPath()).toBe(CSV);
    });
  });
});

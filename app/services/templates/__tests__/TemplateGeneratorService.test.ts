import { App, Notice, TFile, TFolder } from "obsidian";
import { TemplateGeneratorService } from "@app/services/templates/TemplateGeneratorService";
import { t } from "@app/i18n";

const FOLDER = "Workout Templates";
const EXERCISE_PATH = `${FOLDER}/exercise-page.md`;
const TAGS_PATH = `${FOLDER}/Muscle Tags Reference.md`;

describe("TemplateGeneratorService", () => {
  let app: App;
  let tagMap: Map<string, string>;
  let service: TemplateGeneratorService;
  let existing: Record<string, unknown>;

  const createdContent = (path: string): string | undefined =>
    (app.vault.create as jest.Mock).mock.calls.find((c) => c[0] === path)?.[1];

  beforeEach(() => {
    (Notice as unknown as jest.Mock).mockClear();
    app = new App();
    existing = {};
    (app.vault.getAbstractFileByPath as jest.Mock).mockImplementation(
      (p: string) => existing[p] ?? null,
    );
    tagMap = new Map([
      ["petto", "chest"],
      ["abs", "core"],
      ["gambe", "quads"],
    ]);
    service = new TemplateGeneratorService(app, {
      getMuscleTagService: () => ({ getTagMap: () => tagMap }),
    } as any);
  });

  describe("generateDefaultTemplates", () => {
    it("should create the folder and both template files when nothing exists", async () => {
      await service.generateDefaultTemplates();

      expect(app.vault.createFolder).toHaveBeenCalledWith(FOLDER);
      const paths = (app.vault.create as jest.Mock).mock.calls.map((c) => c[0]);
      expect(paths).toEqual([EXERCISE_PATH, TAGS_PATH]);
      expect(Notice).toHaveBeenCalledTimes(1);
    });

    it("should write a blank exercise template with log and chart blocks", async () => {
      await service.generateDefaultTemplates();

      const content = createdContent(EXERCISE_PATH)!;
      expect(content.startsWith("---\nexercise_name:")).toBe(true);
      expect(content).toContain("exercise_type:");
      expect(content).toContain("```workout-log\nexercise: name\n```");
      expect(content).toContain("```workout-chart\nexercise: name\n```");
    });

    it("should not create the folder when it already exists", async () => {
      existing[FOLDER] = new TFolder();

      await service.generateDefaultTemplates();

      expect(app.vault.createFolder).not.toHaveBeenCalled();
      expect(app.vault.create).toHaveBeenCalledTimes(2);
    });

    it("should leave existing files untouched when overwrite is false", async () => {
      existing[FOLDER] = new TFolder();
      existing[EXERCISE_PATH] = new TFile();
      existing[TAGS_PATH] = new TFile();

      await service.generateDefaultTemplates();

      expect(app.vault.create).not.toHaveBeenCalled();
      expect(app.vault.modify).not.toHaveBeenCalled();
    });

    it("should modify existing files when overwrite is true", async () => {
      existing[FOLDER] = new TFolder();
      const a = new TFile();
      const b = new TFile();
      existing[EXERCISE_PATH] = a;
      existing[TAGS_PATH] = b;

      await service.generateDefaultTemplates(true);

      expect(app.vault.modify).toHaveBeenCalledWith(a, expect.any(String));
      expect(app.vault.modify).toHaveBeenCalledWith(b, expect.any(String));
      expect(app.vault.create).not.toHaveBeenCalled();
    });

    it("should create only missing files when one exists and overwrite is false", async () => {
      existing[FOLDER] = new TFolder();
      existing[EXERCISE_PATH] = new TFile();

      await service.generateDefaultTemplates();

      expect(app.vault.create).toHaveBeenCalledTimes(1);
      expect(app.vault.create).toHaveBeenCalledWith(
        TAGS_PATH,
        expect.any(String),
      );
    });

    it("should show an error notice when the template path is a file, not a folder", async () => {
      existing[FOLDER] = new TFile();

      await service.generateDefaultTemplates();

      expect(app.vault.create).not.toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledTimes(1);
      const msg = (Notice as unknown as jest.Mock).mock.calls[0][0] as string;
      expect(msg).toBe(
        t("messages.errors.templateGenError", {
          error: `Path '${FOLDER}' exists but is not a folder.`,
        }),
      );
    });

    it("should show an error notice instead of throwing when creating a file fails", async () => {
      (app.vault.create as jest.Mock).mockRejectedValue(new Error("nope"));

      await expect(service.generateDefaultTemplates()).resolves.toBeUndefined();

      expect(Notice).toHaveBeenCalledWith(
        t("messages.errors.templateGenError", { error: "nope" }),
      );
    });

    it("should show an error notice when folder creation fails", async () => {
      (app.vault.createFolder as jest.Mock).mockRejectedValue(
        new Error("denied"),
      );

      await service.generateDefaultTemplates();

      expect(Notice).toHaveBeenCalledWith(
        t("messages.errors.templateGenError", { error: "denied" }),
      );
    });
  });

  describe("generateTagReference", () => {
    it("should list tags sorted alphabetically in frontmatter", async () => {
      await service.generateTagReference(FOLDER);

      const content = createdContent(TAGS_PATH)!;
      expect(content).toContain(
        "tags:\n  - abs\n  - gambe\n  - petto\n---",
      );
      expect(content).toContain("title: Muscle Tags Reference");
      expect(content).toContain("# Muscle Tags Reference");
    });

    it("should write an empty tag list when there are no tags", async () => {
      tagMap = new Map();

      await service.generateTagReference(FOLDER);

      expect(createdContent(TAGS_PATH)).toContain("tags:\n---");
    });

    it("should skip an existing reference file unless overwrite is set", async () => {
      const file = new TFile();
      existing[TAGS_PATH] = file;

      await service.generateTagReference(FOLDER);
      expect(app.vault.modify).not.toHaveBeenCalled();

      await service.generateTagReference(FOLDER, true);
      expect(app.vault.modify).toHaveBeenCalledWith(file, expect.any(String));
    });

    it("should use the provided folder in the file path", async () => {
      await service.generateTagReference("Custom//Dir");

      expect(app.vault.create).toHaveBeenCalledWith(
        "Custom/Dir/Muscle Tags Reference.md",
        expect.any(String),
      );
    });
  });

  describe("getExercisePageTemplate", () => {
    it("should return the user's customized template when the file exists", async () => {
      const file = new TFile();
      existing[EXERCISE_PATH] = file;
      (app.vault.read as jest.Mock).mockResolvedValue("custom template");

      await expect(service.getExercisePageTemplate()).resolves.toBe(
        "custom template",
      );
      expect(app.vault.read).toHaveBeenCalledWith(file);
    });

    it("should return the default template when the file is missing", async () => {
      const content = await service.getExercisePageTemplate();

      expect(app.vault.read).not.toHaveBeenCalled();
      expect(content).toContain("exercise_name:");
      expect(content).toContain("workout-log");
    });

    it("should return the default template when the path is a folder", async () => {
      existing[EXERCISE_PATH] = new TFolder();

      const content = await service.getExercisePageTemplate();

      expect(app.vault.read).not.toHaveBeenCalled();
      expect(content).toContain("exercise_name:");
    });

    it("should match what generateDefaultTemplates writes", async () => {
      await service.generateDefaultTemplates();

      await expect(service.getExercisePageTemplate()).resolves.toBe(
        createdContent(EXERCISE_PATH),
      );
    });
  });
});

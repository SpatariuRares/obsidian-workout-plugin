import { App, TFile, TFolder } from "obsidian";
import { ExampleGeneratorService } from "@app/services/examples/ExampleGeneratorService";
import { t } from "@app/i18n";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import type { ExamplePluginPort } from "@app/services/examples/ExampleGeneratorService";

const examplesPluginFor = (app: App): ExamplePluginPort => ({
  app,
  settings: { ...DEFAULT_SETTINGS },
  saveSettings: jest.fn().mockResolvedValue(undefined),
  triggerMuscleTagRefresh: jest.fn(),
  eventBus: { emit: jest.fn() },
} as unknown as ExamplePluginPort);

describe("ExampleGeneratorService.exampleFolderExists", () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  it("looks up the localized base folder name", () => {
    const service = new ExampleGeneratorService(examplesPluginFor(app));

    service.exampleFolderExists();

    expect(app.vault.getAbstractFileByPath).toHaveBeenCalledWith(
      t("examples.folderNames.base"),
    );
  });

  it("returns true when the folder exists", () => {
    (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
      new TFolder(),
    );

    expect(new ExampleGeneratorService(examplesPluginFor(app)).exampleFolderExists()).toBe(
      true,
    );
  });

  it("returns false when the folder is missing", () => {
    (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);

    expect(new ExampleGeneratorService(examplesPluginFor(app)).exampleFolderExists()).toBe(
      false,
    );
  });
});

describe("ExampleGeneratorService.generateExampleFolder", () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  /** Folders exist; every note path resolves to `note`. */
  const vaultWith = (note: TFile | TFolder | null): void => {
    (app.vault.getAbstractFileByPath as jest.Mock).mockImplementation(
      (path: string) => (path.endsWith(".md") ? note : new TFolder()),
    );
  };

  it("overwrites existing notes when asked", async () => {
    const existing = new TFile();
    vaultWith(existing);

    await new ExampleGeneratorService(examplesPluginFor(app)).generateExampleFolder(true);

    expect(app.vault.modify).toHaveBeenCalledWith(existing, expect.any(String));
    expect(app.vault.create).not.toHaveBeenCalledWith(
      expect.stringMatching(/\.md$/),
      expect.any(String),
    );
  });

  it("keeps existing notes when not overwriting", async () => {
    vaultWith(new TFile());

    await new ExampleGeneratorService(examplesPluginFor(app)).generateExampleFolder(false);

    expect(app.vault.modify).not.toHaveBeenCalled();
  });

  it("never writes over a folder that sits where a note should go", async () => {
    vaultWith(new TFolder());

    await new ExampleGeneratorService(examplesPluginFor(app)).generateExampleFolder(true);

    expect(app.vault.modify).not.toHaveBeenCalled();
  });
});

describe("ExampleGeneratorService.createExamples", () => {
  let app: App;
  let plugin: ExamplePluginPort;
  let existing: Set<string>;
  let base: string;
  let exampleLog: string;
  let exampleExercises: string;

  beforeEach(() => {
    base = t("examples.folderNames.base");
    exampleLog = `${base}/${t("examples.folderNames.log")}/workout_logs.csv`;
    exampleExercises = `${base}/${t("examples.folderNames.exercises")}`;
    app = new App();
    plugin = examplesPluginFor(app);
    existing = new Set();
    (app.vault.getAbstractFileByPath as jest.Mock).mockImplementation(
      (path: string) => {
        if (!existing.has(path)) return null;
        return /\.(csv|md)$/.test(path) ? new TFile() : new TFolder();
      },
    );
  });

  const service = () => new ExampleGeneratorService(plugin);

  it("points the settings at the example data when there is no log yet", async () => {
    const result = await service().createExamples(async () => true);

    expect(result).toBe("pointed-at-examples");
    expect(plugin.settings.csvLogFilePath).toBe(exampleLog);
    expect(plugin.settings.exerciseFolderPath).toBe(exampleExercises);
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(plugin.eventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "settings:changed" }),
    );
    expect(plugin.triggerMuscleTagRefresh).toHaveBeenCalled();
  });

  it("leaves the settings alone when a real log exists", async () => {
    existing.add(DEFAULT_SETTINGS.csvLogFilePath);

    const result = await service().createExamples(async () => true);

    expect(result).toBe("separate-file");
    expect(plugin.settings.csvLogFilePath).toBe(
      DEFAULT_SETTINGS.csvLogFilePath,
    );
    expect(plugin.settings.exerciseFolderPath).toBe(
      DEFAULT_SETTINGS.exerciseFolderPath,
    );
    expect(plugin.saveSettings).not.toHaveBeenCalled();
    expect(app.vault.modify).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
    );
  });

  it("never writes to the real log", async () => {
    existing.add(DEFAULT_SETTINGS.csvLogFilePath);

    await service().createExamples(async () => true);

    const written = [
      ...(app.vault.create as jest.Mock).mock.calls.map((c) => c[0]),
    ];
    expect(written).not.toContain(DEFAULT_SETTINGS.csvLogFilePath);
    expect(written).toContain(exampleLog);
  });

  it("asks before overwriting an existing example folder and stops on no", async () => {
    existing.add(base);
    const confirm = jest.fn().mockResolvedValue(false);

    const result = await service().createExamples(confirm);

    expect(confirm).toHaveBeenCalled();
    expect(result).toBe("cancelled");
    expect(app.vault.create).not.toHaveBeenCalled();
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });

  it("does not ask when there is no example folder", async () => {
    const confirm = jest.fn();

    await service().createExamples(confirm);

    expect(confirm).not.toHaveBeenCalled();
  });

  it("leaves the settings alone when writing the examples fails", async () => {
    (app.vault.createFolder as jest.Mock).mockRejectedValue(new Error("no"));

    const result = await service().createExamples(async () => true);

    expect(result).toBe("failed");
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });
});

describe("ExampleGeneratorService with the example log as the active log", () => {
  const base = t("examples.folderNames.base");
  const exampleLog = `${base}/${t("examples.folderNames.log")}/workout_logs.csv`;
  const guide = `${base}/${t("examples.fileNames.gettingStarted")}.md`;
  const userCsv = "date,exercise,reps,weight\n2026-01-01,Squat,5,100\n";

  function setup() {
    const vault = new FakeVault();
    vault.app.vault.create(exampleLog, userCsv);
    vault.app.vault.create(guide, "edited guide");
    const plugin = {
      app: vault.app,
      settings: { ...DEFAULT_SETTINGS, csvLogFilePath: exampleLog },
      saveSettings: jest.fn().mockResolvedValue(undefined),
      triggerMuscleTagRefresh: jest.fn(),
      eventBus: { emit: jest.fn() },
    } as unknown as ExamplePluginPort;
    return { vault, plugin };
  }

  it("keeps the user's sets when the examples are created again with overwrite", async () => {
    const { vault, plugin } = setup();

    const result = await new ExampleGeneratorService(plugin).createExamples(
      async () => true,
    );

    expect(result).toBe("separate-file");
    expect(vault.content(exampleLog)).toBe(userCsv);
  });

  it("still overwrites the other example files", async () => {
    const { vault, plugin } = setup();

    await new ExampleGeneratorService(plugin).createExamples(async () => true);

    expect(vault.content(guide)).not.toBe("edited guide");
  });
});

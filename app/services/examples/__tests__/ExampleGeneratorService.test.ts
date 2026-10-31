import { ExampleGeneratorService } from "@app/services/examples/ExampleGeneratorService";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import type { ExamplePluginPort } from "@app/services/examples/ExampleGeneratorService";

function setup(settings: Partial<typeof DEFAULT_SETTINGS> = {}) {
  const vault = new FakeVault();
  const plugin = {
    app: vault.app,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    saveSettings: jest.fn().mockResolvedValue(undefined),
    triggerMuscleTagRefresh: jest.fn(),
    eventBus: { emit: jest.fn() },
  } as unknown as ExamplePluginPort;
  return { vault, plugin, service: new ExampleGeneratorService(plugin) };
}

describe("ExampleGeneratorService.createExamples", () => {
  it("creates the examples and points the settings at them when there is no log yet", async () => {
    const { vault, plugin, service } = setup();

    const result = await service.createExamples();

    expect(result).toBe("pointed-at-examples");
    expect(vault.paths()).toContain(examplePaths.log());
    expect(vault.paths()).toContain(examplePaths.gettingStartedGuide());
    expect(plugin.settings.csvLogFilePath).toBe(examplePaths.log());
    expect(plugin.settings.exerciseFolderPath).toBe(examplePaths.exercises());
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(plugin.eventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "settings:changed" }),
    );
    expect(plugin.triggerMuscleTagRefresh).toHaveBeenCalled();
  });

  it("leaves the settings and the real log alone when a log exists", async () => {
    const { vault, plugin, service } = setup();
    await vault.app.vault.create(DEFAULT_SETTINGS.csvLogFilePath, "real sets");

    const result = await service.createExamples();

    expect(result).toBe("separate-file");
    expect(plugin.settings.csvLogFilePath).toBe(
      DEFAULT_SETTINGS.csvLogFilePath,
    );
    expect(plugin.settings.exerciseFolderPath).toBe(
      DEFAULT_SETTINGS.exerciseFolderPath,
    );
    expect(plugin.saveSettings).not.toHaveBeenCalled();
    expect(vault.content(DEFAULT_SETTINGS.csvLogFilePath)).toBe("real sets");
    expect(vault.paths()).toContain(examplePaths.log());
  });

  describe("when run again", () => {
    it("leaves every existing example file byte for byte unchanged, including a log the user has been writing to", async () => {
      const { vault, plugin, service } = setup();
      await service.createExamples();
      // The settings now read the example log, and the user logs a set
      expect(plugin.settings.csvLogFilePath).toBe(examplePaths.log());
      const userCsv = `${vault.content(examplePaths.log())}2026-10-30,Squat,5,100\n`;
      await vault.app.vault.modify(vault.file(examplePaths.log()), userCsv);
      await vault.app.vault.modify(
        vault.file(examplePaths.gettingStartedGuide()),
        "my own notes",
      );
      const before = new Map(
        vault.paths().map((path) => [path, vault.content(path)]),
      );

      const result = await service.createExamples();

      expect(result).toBe("separate-file");
      expect(vault.content(examplePaths.log())).toBe(userCsv);
      expect(vault.content(examplePaths.gettingStartedGuide())).toBe(
        "my own notes",
      );
      for (const [path, content] of before) {
        expect(vault.content(path)).toBe(content);
      }
    });

    it("creates the example files that are missing", async () => {
      const { vault, service } = setup();
      await service.createExamples();
      const missing = examplePaths.gettingStartedGuide();
      const original = vault.content(missing);
      vault.remove(missing);

      await service.createExamples();

      expect(vault.content(missing)).toBe(original);
    });
  });

  it("fails without touching the settings when a folder sits where a note should go", async () => {
    const { vault, plugin, service } = setup();
    vault.write(`${examplePaths.gettingStartedGuide()}/inside.md`);

    const result = await service.createExamples();

    expect(result).toBe("failed");
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });

  it("fails without touching the settings when the folders cannot be created", async () => {
    const { vault, plugin, service } = setup();
    vault.app.vault.createFolder = jest.fn().mockRejectedValue(new Error("no"));

    const result = await service.createExamples();

    expect(result).toBe("failed");
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });
});

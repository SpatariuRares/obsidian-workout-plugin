import { App, TFile, TFolder } from "obsidian";
import { VaultLogStorage } from "@app/services/data/LogStorage";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";

function makeFile(name: string, parent?: TFolder): TFile {
  const file = new TFile();
  file.name = name;
  file.basename = name.replace(/\.csv$/, "");
  file.extension = "csv";
  file.path = parent ? `${parent.path}/${name}` : name;
  (file as TFile & { parent: TFolder | null }).parent = parent ?? null;
  return file;
}

function setup(path = "data/workout_logs.csv") {
  const vault = {
    getAbstractFileByPath: jest.fn(),
    create: jest.fn(),
    createFolder: jest.fn(),
    read: jest.fn().mockResolvedValue("raw csv"),
    process: jest.fn(),
  };
  const fileManager = { trashFile: jest.fn() };
  const app = { vault, fileManager } as unknown as App;
  const settings = { csvLogFilePath: path } as WorkoutChartsSettings;
  return { vault, fileManager, settings, storage: new VaultLogStorage(app, settings) };
}

describe("VaultLogStorage", () => {
  it("finds the file at the current settings path", () => {
    const { vault, settings, storage } = setup();
    const file = makeFile("workout_logs.csv");
    vault.getAbstractFileByPath.mockReturnValue(file);

    expect(storage.file()).toBe(file);

    settings.csvLogFilePath = "elsewhere.csv";
    vault.getAbstractFileByPath.mockReturnValue(null);
    expect(storage.file()).toBeNull();
    expect(vault.getAbstractFileByPath).toHaveBeenLastCalledWith(
      "elsewhere.csv",
    );
  });

  it("is missing when the path is a folder", () => {
    const { vault, storage } = setup();
    vault.getAbstractFileByPath.mockReturnValue(new TFolder());

    expect(storage.file()).toBeNull();
  });

  it("creates the parent folder before the file", async () => {
    const { vault, storage } = setup("logs/workout_logs.csv");
    vault.getAbstractFileByPath.mockReturnValue(null);

    await storage.create("content");

    expect(vault.createFolder).toHaveBeenCalledWith("logs");
    expect(vault.create).toHaveBeenCalledWith(
      "logs/workout_logs.csv",
      "content",
    );
  });

  describe("backup", () => {
    it("copies the file next to itself with a timestamped name", async () => {
      const { vault, storage } = setup();
      const folder = new TFolder();
      folder.path = "data";
      const csvFile = makeFile("workout_logs.csv", folder);
      folder.children = [csvFile];

      await storage.backup(csvFile);

      expect(vault.create).toHaveBeenCalledWith(
        expect.stringMatching(
          /^data\/workout_logs\.backup-[\d-]+T[\d-]+Z\.csv$/,
        ),
        "raw csv",
      );
    });

    it("keeps only the 3 most recent backups", async () => {
      const { fileManager, storage } = setup();
      const folder = new TFolder();
      folder.path = "data";
      const csvFile = makeFile("workout_logs.csv", folder);
      const old = [
        "workout_logs.backup-2026-01-01T00-00-00-000Z.csv",
        "workout_logs.backup-2026-02-01T00-00-00-000Z.csv",
        "workout_logs.backup-2026-03-01T00-00-00-000Z.csv",
      ].map((name) => makeFile(name, folder));
      const unrelated = makeFile("other.backup-2020.csv", folder);
      folder.children = [csvFile, unrelated, ...old];

      await storage.backup(csvFile);

      // New backup + 2 newest old ones = 3
      expect(fileManager.trashFile).toHaveBeenCalledTimes(1);
      expect(fileManager.trashFile).toHaveBeenCalledWith(old[0]);
    });
  });
});

import { App } from "obsidian";
import { VaultLogStorage } from "@app/services/data/LogStorage";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";

async function setup(
  path = "data/workout_logs.csv",
  files: Record<string, string> = {},
) {
  const vault = new FakeVault();
  for (const [file, content] of Object.entries(files)) {
    await vault.app.vault.create(file, content);
  }
  const settings = { csvLogFilePath: path } as WorkoutChartsSettings;
  return {
    vault,
    settings,
    storage: new VaultLogStorage(vault.app as unknown as App, settings),
  };
}

describe("VaultLogStorage", () => {
  it("finds the file at the current settings path", async () => {
    const { vault, settings, storage } = await setup("workout_logs.csv", {
      "workout_logs.csv": "raw csv",
    });

    expect(storage.file()).toBe(vault.file("workout_logs.csv"));

    settings.csvLogFilePath = "elsewhere.csv";
    expect(storage.file()).toBeNull();
  });

  it("is missing when the path is a folder", async () => {
    const { storage } = await setup("data", {
      "data/workout_logs.csv": "raw csv",
    });

    expect(storage.file()).toBeNull();
  });

  it("creates the parent folder before the file", async () => {
    const { vault, storage } = await setup("logs/workout_logs.csv");
    const order: string[] = [];
    const { create, createFolder } = vault.app.vault;
    vault.app.vault.createFolder = async (path) => {
      order.push(`folder ${path}`);
      await createFolder(path);
    };
    vault.app.vault.create = async (path, content) => {
      order.push(`file ${path}`);
      return create(path, content);
    };

    await storage.create("content");

    expect(order).toEqual(["folder logs", "file logs/workout_logs.csv"]);
    expect(vault.content("logs/workout_logs.csv")).toBe("content");
  });

  it("reads and rewrites the file in place", async () => {
    const { vault, storage } = await setup("data/workout_logs.csv", {
      "data/workout_logs.csv": "raw csv",
    });
    const file = storage.file()!;

    expect(await storage.read(file)).toBe("raw csv");
    await storage.process(file, (content) => `${content}\nrow`);
    expect(vault.content("data/workout_logs.csv")).toBe("raw csv\nrow");
  });

  describe("backup", () => {
    it("copies the file next to itself with a timestamped name", async () => {
      const { vault, storage } = await setup("data/workout_logs.csv", {
        "data/workout_logs.csv": "raw csv",
      });

      await storage.backup(storage.file()!);

      const backups = vault
        .paths()
        .filter((path) => path !== "data/workout_logs.csv");
      expect(backups).toEqual([
        expect.stringMatching(
          /^data\/workout_logs\.backup-[\d-]+T[\d-]+Z\.csv$/,
        ),
      ]);
      expect(vault.content(backups[0])).toBe("raw csv");
    });

    it("keeps only the 3 most recent backups", async () => {
      const old = [
        "data/workout_logs.backup-2026-01-01T00-00-00-000Z.csv",
        "data/workout_logs.backup-2026-02-01T00-00-00-000Z.csv",
        "data/workout_logs.backup-2026-03-01T00-00-00-000Z.csv",
      ];
      const unrelated = "data/other.backup-2020.csv";
      const { vault, storage } = await setup("data/workout_logs.csv", {
        "data/workout_logs.csv": "raw csv",
        [unrelated]: "",
        ...Object.fromEntries(old.map((path) => [path, "old"])),
      });

      await storage.backup(storage.file()!);

      // New backup + 2 newest old ones = 3
      const paths = vault.paths();
      expect(paths).not.toContain(old[0]);
      expect(paths).toEqual(expect.arrayContaining([old[1], old[2], unrelated]));
      expect(
        paths.filter((path) => path.startsWith("data/workout_logs.backup-")),
      ).toHaveLength(3);
    });
  });
});

import { App, TFile } from "obsidian";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { PathUtils } from "@app/utils/PathUtils";

/**
 * Where the workout log CSV lives. WorkoutLogFile owns what the text means;
 * a storage only reads and writes it. Production uses the vault, tests use
 * an in-memory string.
 */
export interface LogStorage {
  /** The log file, or null when it does not exist yet */
  file(): TFile | null;
  read(file: TFile): Promise<string>;
  /** Atomic read-modify-write */
  process(file: TFile, fn: (content: string) => string): Promise<void>;
  /** Create the file (and its folder) with the given content */
  create(content: string): Promise<void>;
  /** Copy the file next to itself before a migration */
  backup(file: TFile): Promise<void>;
}

const MAX_BACKUPS = 3;

/** The log CSV in the vault, at `settings.csvLogFilePath` (read live) */
export class VaultLogStorage implements LogStorage {
  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
  ) {}

  file(): TFile | null {
    const file = this.app.vault.getAbstractFileByPath(
      this.settings.csvLogFilePath,
    );
    return file instanceof TFile ? file : null;
  }

  read(file: TFile): Promise<string> {
    return this.app.vault.read(file);
  }

  async process(
    file: TFile,
    fn: (content: string) => string,
  ): Promise<void> {
    await this.app.vault.process(file, fn);
  }

  async create(content: string): Promise<void> {
    await PathUtils.ensureFolderExists(
      this.app,
      this.settings.csvLogFilePath,
    );
    await this.app.vault.create(this.settings.csvLogFilePath, content);
  }

  /**
   * Copy the CSV to `<name>.backup-<ISO timestamp>.csv` in the same folder,
   * then trash older backups beyond MAX_BACKUPS.
   */
  async backup(file: TFile): Promise<void> {
    const prefix = `${file.basename}.backup-`;
    const existingBackups = (file.parent?.children ?? [])
      .filter(
        (child): child is TFile =>
          child instanceof TFile && child.name.startsWith(prefix),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    const folderPath = file.parent?.path;
    const dir = folderPath && folderPath !== "/" ? `${folderPath}/` : "";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const content = await this.app.vault.read(file);
    await this.app.vault.create(
      `${dir}${prefix}${stamp}.${file.extension}`,
      content,
    );

    const toTrash = existingBackups.slice(
      0,
      Math.max(0, existingBackups.length - (MAX_BACKUPS - 1)),
    );
    for (const old of toTrash) {
      await this.app.fileManager.trashFile(old);
    }
  }
}

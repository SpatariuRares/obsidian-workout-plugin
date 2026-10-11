import { TFile } from "obsidian";
import type { LogStorage } from "@app/services/data/LogStorage";

/**
 * Log storage backed by a string, for testing WorkoutLogFile through its
 * interface. `content` null means the file does not exist.
 */
export class InMemoryLogStorage implements LogStorage {
  public backups: string[] = [];
  private readonly logFile: TFile;

  constructor(
    public content: string | null = null,
    path = "workout_logs.csv",
  ) {
    this.logFile = Object.assign(new TFile(), {
      path,
      name: path.split("/").pop() ?? path,
      basename: (path.split("/").pop() ?? path).replace(/\.csv$/, ""),
      extension: "csv",
    });
  }

  file(): TFile | null {
    return this.content === null ? null : this.logFile;
  }

  async read(): Promise<string> {
    return this.content ?? "";
  }

  async process(
    _file: TFile,
    fn: (content: string) => string,
  ): Promise<void> {
    this.content = fn(this.content ?? "");
  }

  async create(content: string): Promise<void> {
    this.content = content;
  }

  async backup(): Promise<void> {
    this.backups.push(this.content ?? "");
  }
}

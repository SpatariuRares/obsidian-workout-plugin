/**
 * @fileoverview Service for managing custom muscle tag mappings.
 *
 * This service handles reading and writing the muscle tags CSV file,
 * providing caching and fallback to default MUSCLE_TAG_MAP.
 *
 * CSV structure: tag,muscleGroup (e.g., petto,chest)
 *
 * @module MuscleTagService
 */

import { App, TFile, TAbstractFile, normalizePath, EventRef } from "obsidian";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { MUSCLE_TAG_MAP } from "@app/constants/muscles.constants";

/**
 * Service for managing custom muscle tag mappings via CSV file.
 * Provides caching, file watching, and fallback to default tags.
 */
export class MuscleTagService {
  private tagCache: Map<string, string> | null = null;
  private csvPath: string;
  private loadingPromise: Promise<Map<string, string>> | null = null;
  private fileModifyRef: EventRef | null = null;

  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
  ) {
    this.csvPath = this.computeCsvPath();
    this.registerFileWatcher();
  }

  /**
   * Computes the CSV path based on the settings csvLogFilePath.
   * The muscle-tags.csv is stored in the same folder as the workout log CSV.
   */
  private computeCsvPath(): string {
    const logFilePath = this.settings.csvLogFilePath;
    const lastSlash = logFilePath.lastIndexOf("/");
    const folder = lastSlash > 0 ? logFilePath.substring(0, lastSlash) : "";
    return normalizePath(
      folder ? `${folder}/muscle-tags.csv` : "muscle-tags.csv",
    );
  }

  /**
   * Registers a file watcher to invalidate cache when the CSV file changes.
   */
  private registerFileWatcher(): void {
    this.fileModifyRef = this.app.vault.on("modify", (file: TAbstractFile) => {
      if (file instanceof TFile && file.path === this.csvPath) {
        this.clearCache();
      }
    });
  }

  /**
   * Loads tags from the CSV file.
   * Returns a Map of tag -> muscleGroup.
   * If the CSV doesn't exist or is empty, returns default MUSCLE_TAG_MAP.
   */
  async loadTags(): Promise<Map<string, string>> {
    // If already loading, wait for that promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadTagsInternal();

    try {
      const tags = await this.loadingPromise;
      return tags;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Internal method to load tags from CSV file.
   */
  private async loadTagsInternal(): Promise<Map<string, string>> {
    const tags = new Map<string, string>();

    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(this.csvPath);

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        // CSV doesn't exist, return defaults
        return this.getDefaultTags();
      }

      const content = await this.app.vault.read(abstractFile);
      const lines = content.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        return this.getDefaultTags();
      }

      // Skip header line if present
      const startIndex = lines[0].toLowerCase().startsWith("tag,") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parsed = this.parseCSVLine(line);
        if (parsed.length >= 2) {
          const tag = parsed[0].trim().toLowerCase();
          const muscleGroup = parsed[1].trim().toLowerCase();

          if (tag && muscleGroup) {
            tags.set(tag, muscleGroup);
          }
        }
      }

      // If no valid tags were parsed, return defaults
      if (tags.size === 0) {
        return this.getDefaultTags();
      }

      // Update cache
      this.tagCache = tags;
      return tags;
    } catch {
      return this.getDefaultTags();
    }
  }

  /**
   * Parses a single CSV line, handling quoted values.
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  }

  /**
   * Returns the default tag map as a Map.
   */
  private getDefaultTags(): Map<string, string> {
    return new Map(Object.entries(MUSCLE_TAG_MAP));
  }

  /**
   * Saves tags to the CSV file.
   * @param tags Map of tag -> muscleGroup
   */
  async saveTags(tags: Map<string, string>): Promise<void> {
    const lines = ["tag,muscleGroup"];

    for (const [tag, muscleGroup] of tags) {
      const escapedTag = this.escapeCSVValue(tag);
      const escapedGroup = this.escapeCSVValue(muscleGroup);
      lines.push(`${escapedTag},${escapedGroup}`);
    }

    const content = lines.join("\n");

    const abstractFile = this.app.vault.getAbstractFileByPath(this.csvPath);

    if (abstractFile && abstractFile instanceof TFile) {
      // File exists, modify it
      await this.app.vault.modify(abstractFile, content);
    } else {
      // File doesn't exist, create it
      // Ensure parent folder exists
      const lastSlash = this.csvPath.lastIndexOf("/");
      if (lastSlash > 0) {
        const folder = this.csvPath.substring(0, lastSlash);
        const folderExists = this.app.vault.getAbstractFileByPath(folder);
        if (!folderExists) {
          await this.app.vault.createFolder(folder);
        }
      }
      await this.app.vault.create(this.csvPath, content);
    }

    // Update cache
    this.tagCache = new Map(tags);
  }

  /**
   * Escapes a CSV value for safe writing.
   */
  private escapeCSVValue(value: string): string {
    // If value contains comma, quote, or newline, wrap in quotes
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Gets the current tag map.
   * Returns cached tags if available, otherwise loads from file or returns defaults.
   */
  getTagMap(): Map<string, string> {
    if (this.tagCache) {
      return this.tagCache;
    }

    // Return defaults synchronously, actual loading happens in background
    const defaults = this.getDefaultTags();
    this.tagCache = defaults;

    // Trigger async load to update cache
    void this.loadTags().then((tags) => {
      this.tagCache = tags;
    });

    return defaults;
  }

  /**
   * Gets the tag map as a plain object (for backward compatibility).
   */
  getTagMapAsObject(): Record<string, string> {
    const map = this.getTagMap();
    const obj: Record<string, string> = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  /**
   * Clears the tag cache.
   */
  clearCache(): void {
    this.tagCache = null;
    this.loadingPromise = null;
  }

  /**
   * Gets the path to the muscle tags CSV file.
   */
  getCsvPath(): string {
    return this.csvPath;
  }

  /**
   * Checks if the CSV file exists.
   */
  async csvExists(): Promise<boolean> {
    const abstractFile = this.app.vault.getAbstractFileByPath(this.csvPath);
    return abstractFile instanceof TFile;
  }

  /**
   * Creates the CSV file with default tags.
   * @returns true if created, false if already exists
   */
  async createDefaultCsv(): Promise<boolean> {
    if (await this.csvExists()) {
      return false;
    }

    await this.saveTags(this.getDefaultTags());
    return true;
  }

  /**
   * Cleanup method to unregister file watcher.
   * Should be called when the plugin is unloaded.
   */
  destroy(): void {
    if (this.fileModifyRef) {
      this.app.vault.offref(this.fileModifyRef);
      this.fileModifyRef = null;
    }
    this.clearCache();
  }
}

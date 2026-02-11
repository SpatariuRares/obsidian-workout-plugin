/**
 * @fileoverview Service for managing custom muscle tag mappings.
 *
 * This service handles reading and writing the muscle tags CSV file,
 * providing caching and fallback to default MUSCLE_TAG_MAP.
 *
 * CSV structure: tag,muscleGroup,language (e.g., petto,chest,it)
 * Language filtering: Returns tags matching user's Obsidian language + English (en) as fallback
 *
 * @module MuscleTagService
 */

import { App, TFile, normalizePath } from "obsidian";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import {
  MUSCLE_TAG_ENTRIES,
  type MuscleTagEntry,
} from "@app/constants/muscles.constants";
import { StringUtils, PathUtils, LanguageUtils } from "@app/utils";

/**
 * Service for managing custom muscle tag mappings via CSV file.
 * Provides caching and fallback to default tags.
 * Filters tags by user's Obsidian language + English as fallback.
 */
export class MuscleTagService {
  private tagCache: Map<string, string> | null = null;
  private loadingPromise: Promise<Map<string, string>> | null = null;

  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
  ) {}

  /**
   * Gets the user's language from Obsidian settings.
   * Delegates to LanguageUtils.
   */
  private getUserLanguage(): string {
    return LanguageUtils.getUserLanguage();
  }

  /**
   * Computes the CSV path based on the settings csvLogFilePath.
   * The muscle-tags.csv is stored in the same folder as the workout log CSV.
   * Now dynamic to always reflect current settings.
   */
  private computeCsvPath(): string {
    return normalizePath(
      PathUtils.getSiblingPath(this.settings.csvLogFilePath, "muscle-tags.csv"),
    );
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
   * Filters tags by user's language + English as fallback.
   * Automatically migrates old CSV format (without language column) to new format.
   */
  private async loadTagsInternal(): Promise<Map<string, string>> {
    const tags = new Map<string, string>();
    const csvPath = this.computeCsvPath();
    const userLanguage = this.getUserLanguage();

    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(csvPath);

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        // CSV doesn't exist, return defaults
        return this.getDefaultTags();
      }

      const content = await this.app.vault.read(abstractFile);
      const lines = content.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        return this.getDefaultTags();
      }

      // Check if CSV needs migration (old format without language column)
      const hasLanguageColumn = lines[0]
        .toLowerCase()
        .includes("language");

      if (!hasLanguageColumn && lines.length > 0) {
        // Migrate old CSV to new format
        await this.migrateCsvToNewFormat(abstractFile, content);
        // Reload after migration
        const newContent = await this.app.vault.read(abstractFile);
        const tags = this.parseTagsFromContent(newContent, userLanguage);
        this.tagCache = tags;
        return tags;
      }

      const tags = this.parseTagsFromContent(content, userLanguage);
      this.tagCache = tags;
      return tags;
    } catch {
      return this.getDefaultTags();
    }
  }

  /**
   * Parses tags from CSV content and filters by language.
   */
  private parseTagsFromContent(
    content: string,
    userLanguage: string,
  ): Map<string, string> {
    const tags = new Map<string, string>();
    const lines = content.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      return tags;
    }

    // Skip header line if present
    const startIndex = lines[0].toLowerCase().startsWith("tag,") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parsed = this.parseCSVLine(line);
        if (parsed.length >= 2) {
          const tag = StringUtils.normalize(parsed[0]);
          const muscleGroup = StringUtils.normalize(parsed[1]);
          const language =
            parsed.length >= 3 ? StringUtils.normalize(parsed[2]) : "en";

          if (
            tag &&
            muscleGroup &&
            (language === userLanguage || language === "en")
          ) {
            tags.set(tag, muscleGroup);
          }
        }
      }

    // If no valid tags were parsed, return defaults
    if (tags.size === 0) {
      return this.getDefaultTags();
    }

    return tags;
  }

  /**
   * Migrates old CSV format (tag,muscleGroup) to new format (tag,muscleGroup,language).
   * All existing tags are assigned language "en" by default.
   */
  private async migrateCsvToNewFormat(
    file: TFile,
    oldContent: string,
  ): Promise<void> {
    const lines = oldContent.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return;

    const newLines: string[] = [];
    const hasHeader = lines[0].toLowerCase().startsWith("tag,");

    // Add new header with language column
    newLines.push("tag,muscleGroup,language");

    // Start from index 1 if header exists, 0 otherwise
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parsed = this.parseCSVLine(line);
      if (parsed.length >= 2) {
        const tag = parsed[0];
        const muscleGroup = parsed[1];

        // Add language column with default "en"
        const escapedTag = this.escapeCSVValue(tag);
        const escapedGroup = this.escapeCSVValue(muscleGroup);
        const escapedLang = this.escapeCSVValue("en");

        newLines.push(`${escapedTag},${escapedGroup},${escapedLang}`);
      }
    }

    // Write migrated content
    const newContent = newLines.join("\n");
    await this.app.vault.modify(file, newContent);
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
   * Returns the default tag map as a Map, filtered by user's language + English.
   */
  private getDefaultTags(): Map<string, string> {
    const userLanguage = this.getUserLanguage();
    const tags = new Map<string, string>();

    // Filter default entries by user's language or English
    for (const entry of MUSCLE_TAG_ENTRIES) {
      if (entry.language === userLanguage || entry.language === "en") {
        tags.set(entry.tag, entry.muscleGroup);
      }
    }

    return tags;
  }

  /**
   * Saves tags to the CSV file.
   * @param tags Map of tag -> muscleGroup
   * @param language Optional language code. If not provided, uses user's current language.
   */
  async saveTags(tags: Map<string, string>, language?: string): Promise<void> {
    const lines = ["tag,muscleGroup,language"];
    const csvPath = this.computeCsvPath();
    const lang = language || this.getUserLanguage();

    for (const [tag, muscleGroup] of tags) {
      const escapedTag = this.escapeCSVValue(tag);
      const escapedGroup = this.escapeCSVValue(muscleGroup);
      const escapedLang = this.escapeCSVValue(lang);
      lines.push(`${escapedTag},${escapedGroup},${escapedLang}`);
    }

    const content = lines.join("\n");

    const abstractFile = this.app.vault.getAbstractFileByPath(csvPath);

    if (abstractFile && abstractFile instanceof TFile) {
      // File exists, modify it
      await this.app.vault.modify(abstractFile, content);
    } else {
      // File doesn't exist, create it
      await PathUtils.ensureFolderExists(this.app, csvPath);
      await this.app.vault.create(csvPath, content);
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
    return this.computeCsvPath();
  }

  /**
   * Checks if the CSV file exists.
   */
  async csvExists(): Promise<boolean> {
    const abstractFile = this.app.vault.getAbstractFileByPath(
      this.computeCsvPath(),
    );
    return abstractFile instanceof TFile;
  }

  /**
   * Creates the CSV file with default tags.
   * Saves ALL default tags with their language information (en, it, etc.)
   * @returns true if created, false if already exists
   */
  async createDefaultCsv(): Promise<boolean> {
    if (await this.csvExists()) {
      return false;
    }

    // Build CSV content with all default tags and their languages
    const csvPath = this.computeCsvPath();
    const lines = ["tag,muscleGroup,language"];

    // Sort entries by tag name for consistent ordering
    const sortedEntries = [...MUSCLE_TAG_ENTRIES].sort((a, b) =>
      a.tag.localeCompare(b.tag),
    );

    for (const entry of sortedEntries) {
      const escapedTag = this.escapeCSVValue(entry.tag);
      const escapedGroup = this.escapeCSVValue(entry.muscleGroup);
      const escapedLang = this.escapeCSVValue(entry.language);
      lines.push(`${escapedTag},${escapedGroup},${escapedLang}`);
    }

    const content = lines.join("\n");

    // Create file (with parent folder if needed)
    await PathUtils.ensureFolderExists(this.app, csvPath);

    await this.app.vault.create(csvPath, content);

    // Load tags to populate cache
    await this.loadTags();

    return true;
  }

  /**
   * Builds CSV content from muscle tags map for export.
   * Sorted alphabetically by tag name.
   * @param tags Map of tag names to muscle groups
   * @param language Optional language code. If not provided, uses user's current language.
   * @returns CSV content string with header and sorted rows
   */
  exportToCsv(tags: Map<string, string>, language?: string): string {
    const csvLines: string[] = ["tag,muscleGroup,language"];
    const lang = language || this.getUserLanguage();

    const sortedTags = Array.from(tags.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    for (const [tag, muscleGroup] of sortedTags) {
      csvLines.push(
        `${this.escapeCSVValue(tag)},${this.escapeCSVValue(muscleGroup)},${this.escapeCSVValue(lang)}`,
      );
    }

    return csvLines.join("\n");
  }

  /**
   * Cleanup method to clear cache.
   * Should be called when the plugin is unloaded.
   */
  destroy(): void {
    this.clearCache();
  }
}

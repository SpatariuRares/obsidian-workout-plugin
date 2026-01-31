import {
  parseCSVLogFile,
  entriesToCSVContent,
  WorkoutChartsSettings,
  STANDARD_CSV_COLUMNS,
} from "@app/types/WorkoutLogData";
import { App, TFile } from "obsidian";

/**
 * Service responsible for CSV column management operations.
 * Handles reading column headers, ensuring columns exist, and parsing CSV lines.
 */
export class CSVColumnService {
  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
  ) {}

  /**
   * Get all column names from the current CSV file header
   * @returns Array of column names (standard + custom columns)
   */
  public async getCSVColumns(): Promise<string[]> {
    const abstractFile = this.app.vault.getAbstractFileByPath(
      this.settings.csvLogFilePath,
    );

    if (!abstractFile || !(abstractFile instanceof TFile)) {
      return [...STANDARD_CSV_COLUMNS];
    }

    const csvFile = abstractFile;
    const content = await this.app.vault.read(csvFile);
    const lines = content.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      return [...STANDARD_CSV_COLUMNS];
    }

    const header = this.parseCSVLine(lines[0]).map((h) => h.trim());
    return header.filter((col) => col);
  }

  /**
   * Ensure a column exists in the CSV file header.
   * If the column doesn't exist, adds it to the header and all existing rows.
   * @param columnName The column name to ensure exists
   * @param onCacheInvalidate Optional callback to clear cache after column changes
   */
  public async ensureColumnExists(
    columnName: string,
    onCacheInvalidate?: () => void,
  ): Promise<void> {
    if (STANDARD_CSV_COLUMNS.includes(columnName as any)) {
      return;
    }

    const abstractFile = this.app.vault.getAbstractFileByPath(
      this.settings.csvLogFilePath,
    );

    if (!abstractFile || !(abstractFile instanceof TFile)) {
      return;
    }

    const csvFile = abstractFile;
    const existingColumns = await this.getCSVColumns();

    if (existingColumns.includes(columnName)) {
      return;
    }

    await this.app.vault.process(csvFile, (content) => {
      const entries = parseCSVLogFile(content);

      const currentCustomColumns = existingColumns.filter(
        (col) => !STANDARD_CSV_COLUMNS.includes(col as any),
      );

      const newCustomColumns = [...currentCustomColumns, columnName];

      return entriesToCSVContent(entries, newCustomColumns);
    });

    onCacheInvalidate?.();
  }

  /**
   * Get custom columns (non-standard columns) from the CSV file
   * @returns Array of custom column names
   */
  public async getCustomColumns(): Promise<string[]> {
    const allColumns = await this.getCSVColumns();
    return allColumns.filter(
      (col) => !STANDARD_CSV_COLUMNS.includes(col as any),
    );
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  public parseCSVLine(line: string): string[] {
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
}

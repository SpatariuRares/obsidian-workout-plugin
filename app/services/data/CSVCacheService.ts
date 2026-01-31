import {
  WorkoutLogData,
  parseCSVLogFile,
  convertFromCSVEntry,
  WorkoutChartsSettings,
} from "@app/types/WorkoutLogData";
import { App, TFile, Notice } from "obsidian";

/**
 * Service responsible for CSV data caching and loading.
 * Manages cache lifecycle, prevents race conditions, and handles CSV file reading.
 */
export class CSVCacheService {
  private logDataCache: WorkoutLogData[] | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  // Lock to prevent parallel CSV loading (race condition fix)
  private loadingPromise: Promise<WorkoutLogData[]> | null = null;

  /**
   * Maximum cache size to prevent excessive memory consumption.
   * For users with large workout histories (10,000+ entries), we limit the cache
   * to 5,000 entries. This balances performance (avoiding repeated CSV parsing)
   * with memory consumption (preventing browser slowdowns/crashes).
   */
  private readonly MAX_CACHE_SIZE = 5000;

  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
  ) {}

  /**
   * Get raw (unfiltered) data from cache or CSV.
   * Uses a loading lock to prevent parallel CSV reads.
   */
  public async getRawData(): Promise<WorkoutLogData[]> {
    const now = Date.now();

    const cacheValid =
      this.logDataCache &&
      now - this.lastCacheTime < this.CACHE_DURATION &&
      this.logDataCache.length <= this.MAX_CACHE_SIZE;

    if (cacheValid) {
      return this.logDataCache!;
    }

    // Cache miss or exceeded size limit - clear if needed
    if (this.logDataCache && this.logDataCache.length > this.MAX_CACHE_SIZE) {
      this.logDataCache = null;
      this.lastCacheTime = 0;
    }

    // If already loading, wait for that promise (race condition prevention)
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading with lock
    this.loadingPromise = this.loadCSVData();

    try {
      const data = await this.loadingPromise;
      return data;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Load all data from CSV file (no filtering).
   * Includes retry logic for vault initialization timing.
   */
  private async loadCSVData(retryCount = 0): Promise<WorkoutLogData[]> {
    const logData: WorkoutLogData[] = [];
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 100; // ms

    try {
      const abstractFile = this.app.vault.getAbstractFileByPath(
        this.settings.csvLogFilePath,
      );

      if (!abstractFile || !(abstractFile instanceof TFile)) {
        if (retryCount < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return this.loadCSVData(retryCount + 1);
        }
        return logData;
      }

      const csvFile = abstractFile;
      const content = await this.app.vault.read(csvFile);
      const csvEntries = parseCSVLogFile(content);

      csvEntries.forEach((entry) => {
        const logEntry = convertFromCSVEntry(entry, csvFile);
        logData.push(logEntry);
      });

      // Update cache with RAW (unfiltered) data
      this.logDataCache = logData;
      this.lastCacheTime = Date.now();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      new Notice(`Error loading CSV workout data: ${errorMessage}`);
    }

    return logData;
  }

  /**
   * Clear the log data cache.
   * Should be called after any data modification operations.
   */
  public clearCache(): void {
    this.logDataCache = null;
    this.lastCacheTime = 0;
    this.loadingPromise = null;
  }

  /**
   * Check if cache is currently valid
   */
  public isCacheValid(): boolean {
    const now = Date.now();
    return (
      this.logDataCache !== null &&
      now - this.lastCacheTime < this.CACHE_DURATION &&
      this.logDataCache.length <= this.MAX_CACHE_SIZE
    );
  }
}

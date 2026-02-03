import { CSVCacheService } from "../CSVCacheService";
import { App, TFile, Notice } from "obsidian";
import { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import * as WorkoutLogDataModule from "@app/types/WorkoutLogData";

// Mock dependencies
jest.mock("obsidian");
jest.mock("@app/types/WorkoutLogData", () => ({
  ...jest.requireActual("@app/types/WorkoutLogData"),
  parseCSVLogFile: jest.fn(),
  convertFromCSVEntry: jest.fn(),
}));

describe("CSVCacheService", () => {
  let service: CSVCacheService;
  let mockApp: App;
  let mockSettings: WorkoutChartsSettings;
  let mockVault: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVault = {
      getAbstractFileByPath: jest.fn(),
      read: jest.fn(),
    };

    mockApp = {
      vault: mockVault,
    } as unknown as App;

    mockSettings = {
      csvLogFilePath: "folder/workout_log.csv",
    } as WorkoutChartsSettings;

    service = new CSVCacheService(mockApp, mockSettings);
  });

  describe("getRawData", () => {
    it("should load data from CSV and cache it on first call", async () => {
      // Setup
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("header\nentry1");

      const mockParsedEntries = [{ some: "entry" }];
      const mockLogData = { date: "2023-01-01", workout: "Test" };

      (WorkoutLogDataModule.parseCSVLogFile as jest.Mock).mockReturnValue(
        mockParsedEntries,
      );
      (WorkoutLogDataModule.convertFromCSVEntry as jest.Mock).mockReturnValue(
        mockLogData,
      );

      // Execute
      const result = await service.getRawData();

      // Verify load happened
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledWith(
        "folder/workout_log.csv",
      );
      expect(mockVault.read).toHaveBeenCalledWith(mockFile);
      expect(WorkoutLogDataModule.parseCSVLogFile).toHaveBeenCalledWith(
        "header\nentry1",
      );
      expect(WorkoutLogDataModule.convertFromCSVEntry).toHaveBeenCalledWith(
        mockParsedEntries[0],
        mockFile,
      );

      // Verify result
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockLogData);
    });

    it("should return cached data if cache is valid", async () => {
      // Setup - populate cache first
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("content");
      (WorkoutLogDataModule.parseCSVLogFile as jest.Mock).mockReturnValue([{}]);
      (WorkoutLogDataModule.convertFromCSVEntry as jest.Mock).mockReturnValue(
        {},
      );

      await service.getRawData(); // First call caches data

      // Clear mocks to verify they aren't called again
      jest.clearAllMocks();

      // Execute second time
      const result = await service.getRawData();

      // Verify no new load happened
      expect(mockVault.read).not.toHaveBeenCalled();

      // Verify result is still returned
      expect(result).toHaveLength(1);
    });

    it("should reload data if cache expired", async () => {
      // Setup
      jest.useFakeTimers();

      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("content");
      (WorkoutLogDataModule.parseCSVLogFile as jest.Mock).mockReturnValue([{}]);

      // First load
      await service.getRawData();

      // Advance time beyond cache duration (5000ms)
      jest.advanceTimersByTime(5001);
      jest.clearAllMocks();

      // Second load
      await service.getRawData();

      // Verify reload happened
      expect(mockVault.read).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it("should reload data if cache size limit exceeded", async () => {
      // Setup
      // Create a mock dataset larger than MAX_CACHE_SIZE (5000)
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("content");

      // Create > 5000 entries
      const largeEntries = Array(5001).fill({});
      (WorkoutLogDataModule.parseCSVLogFile as jest.Mock).mockReturnValue(
        largeEntries,
      );
      (WorkoutLogDataModule.convertFromCSVEntry as jest.Mock).mockReturnValue(
        {},
      );

      // First load
      await service.getRawData();

      jest.clearAllMocks();

      // Second load - should trigger reload because cache wasn't stored (too big) or was invalidated
      await service.getRawData();

      // Verify reload happened
      expect(mockVault.read).toHaveBeenCalled();
    });

    it("should handle simultaneous requests (race condition)", async () => {
      // Setup
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);

      // Slow read
      mockVault.read.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Delay
        return "content";
      });

      (WorkoutLogDataModule.parseCSVLogFile as jest.Mock).mockReturnValue([{}]);

      // Execute two calls in parallel
      const promise1 = service.getRawData();
      const promise2 = service.getRawData();

      await Promise.all([promise1, promise2]);

      // Verify read only called once despite two calls
      expect(mockVault.read).toHaveBeenCalledTimes(1);
    });

    it("should handle error during loading", async () => {
      // Setup
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockRejectedValue(new Error("Read error"));

      // Execute
      const result = await service.getRawData();

      // Verify empty array returned and Notice shown
      expect(result).toEqual([]);
      // Note: Notice is mocked as a class, we might want to check if it was instantiated
    });

    it("should retry loading if file not found immediately (race condition on startup)", async () => {
      // Setup
      jest.useFakeTimers();

      const mockFile = new TFile();

      // Mock returns null first, then null, then file
      mockVault.getAbstractFileByPath
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(mockFile);

      mockVault.read.mockResolvedValue("content");
      (WorkoutLogDataModule.parseCSVLogFile as jest.Mock).mockReturnValue([{}]);

      // Start the loading process
      const loadPromise = service.getRawData();

      // Fast forward time for retries
      // First retry wait
      await jest.advanceTimersByTimeAsync(100);
      // Second retry wait
      await jest.advanceTimersByTimeAsync(100);

      const result = await loadPromise;

      // Verify it tried multiple times
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledTimes(3);
      expect(mockVault.read).toHaveBeenCalledWith(mockFile);
      expect(result).toHaveLength(1);

      jest.useRealTimers();
    });

    it("should give up after max retries if file is missing", async () => {
      // Setup
      jest.useFakeTimers();
      mockVault.getAbstractFileByPath.mockReturnValue(null);

      const loadPromise = service.getRawData();

      // Attempt 3 retries
      await jest.advanceTimersByTimeAsync(400);

      const result = await loadPromise;

      // Verify gave up
      expect(result).toEqual([]);
      expect(mockVault.getAbstractFileByPath).toHaveBeenCalledTimes(4); // Initial + 3 retries

      jest.useRealTimers();
    });
  });

  describe("clearCache", () => {
    it("should invalidate the cache", async () => {
      // Setup - populate cache
      const mockFile = new TFile();
      mockVault.getAbstractFileByPath.mockReturnValue(mockFile);
      mockVault.read.mockResolvedValue("content");
      (WorkoutLogDataModule.parseCSVLogFile as jest.Mock).mockReturnValue([{}]);

      await service.getRawData();

      // Verify cache is populated (implied by subsequent calls not reading)
      expect(service.isCacheValid()).toBe(true);

      // Execute
      service.clearCache();

      // Verify
      expect(service.isCacheValid()).toBe(false);
    });
  });

  describe("isCacheValid", () => {
    it("should return false when cache is null", () => {
      expect(service.isCacheValid()).toBe(false);
    });
  });
});

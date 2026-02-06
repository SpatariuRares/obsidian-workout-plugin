import { TableDataLoader } from "@app/features/tables/business/TableDataLoader";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams, TableCallbacks } from "@app/features/tables/types";

const createMockPlugin = (data: WorkoutLogData[] = []) => ({
  getWorkoutLogData: jest.fn().mockResolvedValue(data),
  clearLogDataCache: jest.fn(),
});

const createLog = (
  overrides: Partial<WorkoutLogData> = {},
): WorkoutLogData => ({
  date: "2024-01-15",
  exercise: "Bench Press",
  reps: 8,
  weight: 80,
  volume: 640,
  ...overrides,
});

describe("TableDataLoader", () => {
  describe("getOptimizedCSVData", () => {
    it("loads data with exercise filter", async () => {
      const mockPlugin = createMockPlugin([createLog()]);
      const params: EmbeddedTableParams = {
        exercise: "Bench Press",
        exactMatch: true,
      };

      await TableDataLoader.getOptimizedCSVData(params, mockPlugin as any);

      expect(mockPlugin.getWorkoutLogData).toHaveBeenCalledWith({
        exercise: "Bench Press",
        exactMatch: true,
      });
    });

    it("loads data with workout filter", async () => {
      const mockPlugin = createMockPlugin([createLog()]);
      const params: EmbeddedTableParams = { workout: "Push Day" };

      await TableDataLoader.getOptimizedCSVData(params, mockPlugin as any);

      expect(mockPlugin.getWorkoutLogData).toHaveBeenCalledWith({
        workout: "Push Day",
      });
    });

    it("loads data with both exercise and workout filters", async () => {
      const mockPlugin = createMockPlugin([createLog()]);
      const params: EmbeddedTableParams = {
        exercise: "Bench Press",
        workout: "Push Day",
        exactMatch: false,
      };

      await TableDataLoader.getOptimizedCSVData(params, mockPlugin as any);

      expect(mockPlugin.getWorkoutLogData).toHaveBeenCalledWith({
        exercise: "Bench Press",
        exactMatch: false,
        workout: "Push Day",
      });
    });

    it("loads all data when no filters", async () => {
      const mockPlugin = createMockPlugin([createLog()]);
      const params: EmbeddedTableParams = {};

      await TableDataLoader.getOptimizedCSVData(params, mockPlugin as any);

      expect(mockPlugin.getWorkoutLogData).toHaveBeenCalledWith({});
    });

    it("returns the data from plugin", async () => {
      const logs = [createLog(), createLog({ exercise: "Squat" })];
      const mockPlugin = createMockPlugin(logs);

      const result = await TableDataLoader.getOptimizedCSVData(
        {},
        mockPlugin as any,
      );

      expect(result).toEqual(logs);
    });
  });

  describe("loadFreshData", () => {
    it("clears cache and loads data", async () => {
      const logs = [createLog()];
      const mockPlugin = createMockPlugin(logs);

      const result = await TableDataLoader.loadFreshData(mockPlugin as any);

      expect(mockPlugin.clearLogDataCache).toHaveBeenCalled();
      expect(mockPlugin.getWorkoutLogData).toHaveBeenCalled();
      expect(result).toEqual(logs);
    });

    it("calls onError callback on failure", async () => {
      const mockPlugin = {
        clearLogDataCache: jest.fn(),
        getWorkoutLogData: jest.fn().mockRejectedValue(new Error("fail")),
      };
      const callbacks: TableCallbacks = {
        onError: jest.fn(),
      };

      await expect(
        TableDataLoader.loadFreshData(mockPlugin as any, callbacks),
      ).rejects.toThrow("fail");

      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.any(Error),
        "loading fresh workout data",
      );
    });

    it("wraps non-Error objects into Error", async () => {
      const mockPlugin = {
        clearLogDataCache: jest.fn(),
        getWorkoutLogData: jest.fn().mockRejectedValue("string error"),
      };
      const callbacks: TableCallbacks = {
        onError: jest.fn(),
      };

      await expect(
        TableDataLoader.loadFreshData(mockPlugin as any, callbacks),
      ).rejects.toThrow("string error");

      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "string error" }),
        "loading fresh workout data",
      );
    });

    it("works without callbacks", async () => {
      const mockPlugin = {
        clearLogDataCache: jest.fn(),
        getWorkoutLogData: jest.fn().mockRejectedValue(new Error("fail")),
      };

      await expect(
        TableDataLoader.loadFreshData(mockPlugin as any),
      ).rejects.toThrow("fail");
    });
  });

  describe("hasDataChanged", () => {
    it("returns true when currentData is undefined", () => {
      expect(TableDataLoader.hasDataChanged(undefined, [createLog()])).toBe(
        true,
      );
    });

    it("returns true when lengths differ", () => {
      expect(
        TableDataLoader.hasDataChanged([createLog()], [createLog(), createLog()]),
      ).toBe(true);
    });

    it("returns false when lengths are equal", () => {
      expect(
        TableDataLoader.hasDataChanged([createLog()], [createLog()]),
      ).toBe(false);
    });

    it("returns false for both empty", () => {
      expect(TableDataLoader.hasDataChanged([], [])).toBe(false);
    });
  });
});

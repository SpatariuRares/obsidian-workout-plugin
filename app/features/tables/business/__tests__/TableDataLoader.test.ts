import { TableDataLoader } from "@app/features/tables/business/TableDataLoader";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams } from "@app/features/tables/types";

const createMockPlugin = (data: WorkoutLogData[] = []) => ({
  getWorkoutLogData: jest.fn().mockResolvedValue(data),
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

});

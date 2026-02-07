/** @jest-environment jsdom */

import { TableRefresh } from "@app/features/tables/business/TableRefresh";
import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { TableCallbacks } from "@app/features/tables/types";

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

const createMockPlugin = (data: WorkoutLogData[] = [createLog()]) =>
  ({
    clearLogDataCache: jest.fn(),
    getWorkoutLogData: jest.fn().mockResolvedValue(data),
  }) as any;

describe("TableRefresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears cache and loads fresh data", async () => {
    const freshData = [createLog(), createLog({ exercise: "Squat" })];
    const mockPlugin = createMockPlugin(freshData);
    const container = document.createElement("div");
    const params = { exercise: "Bench Press" };
    const renderCallback = jest.fn().mockResolvedValue(undefined);

    await TableRefresh.refreshTable(
      mockPlugin,
      container,
      params,
      renderCallback,
    );

    expect(mockPlugin.clearLogDataCache).toHaveBeenCalled();
    expect(mockPlugin.getWorkoutLogData).toHaveBeenCalled();
    expect(renderCallback).toHaveBeenCalledWith(container, freshData, params);
  });

  it("calls onSuccess callback after successful refresh", async () => {
    const mockPlugin = createMockPlugin();
    const container = document.createElement("div");
    const params = { exercise: "Bench Press" };
    const renderCallback = jest.fn().mockResolvedValue(undefined);
    const callbacks: TableCallbacks = {
      onSuccess: jest.fn(),
    };

    await TableRefresh.refreshTable(
      mockPlugin,
      container,
      params,
      renderCallback,
      callbacks,
    );

    expect(callbacks.onSuccess).toHaveBeenCalledWith(
      CONSTANTS.WORKOUT.TABLE.MESSAGES.REFRESH_SUCCESS,
    );
  });

  it("calls onError callback on failure", async () => {
    const mockPlugin = {
      clearLogDataCache: jest.fn(),
      getWorkoutLogData: jest.fn().mockRejectedValue(new Error("load fail")),
    } as any;
    const container = document.createElement("div");
    const params = { exercise: "Bench Press" };
    const renderCallback = jest.fn();
    const callbacks: TableCallbacks = {
      onError: jest.fn(),
    };

    await TableRefresh.refreshTable(
      mockPlugin,
      container,
      params,
      renderCallback,
      callbacks,
    );

    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.any(Error),
      "refreshing table",
    );
    expect(renderCallback).not.toHaveBeenCalled();
  });

  it("wraps non-Error objects into Error on failure", async () => {
    const mockPlugin = {
      clearLogDataCache: jest.fn(),
      getWorkoutLogData: jest.fn().mockRejectedValue("string error"),
    } as any;
    const container = document.createElement("div");
    const params = { exercise: "Bench Press" };
    const renderCallback = jest.fn();
    const callbacks: TableCallbacks = {
      onError: jest.fn(),
    };

    await TableRefresh.refreshTable(
      mockPlugin,
      container,
      params,
      renderCallback,
      callbacks,
    );

    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "string error" }),
      "refreshing table",
    );
  });

  it("works without callbacks", async () => {
    const mockPlugin = createMockPlugin();
    const container = document.createElement("div");
    const renderCallback = jest.fn().mockResolvedValue(undefined);

    await TableRefresh.refreshTable(
      mockPlugin,
      container,
      {},
      renderCallback,
    );

    expect(renderCallback).toHaveBeenCalled();
  });

  it("does not call renderCallback when data loading fails", async () => {
    const mockPlugin = {
      clearLogDataCache: jest.fn(),
      getWorkoutLogData: jest.fn().mockRejectedValue(new Error("fail")),
    } as any;
    const renderCallback = jest.fn();

    await TableRefresh.refreshTable(
      mockPlugin,
      document.createElement("div"),
      {},
      renderCallback,
    );

    expect(renderCallback).not.toHaveBeenCalled();
  });
});

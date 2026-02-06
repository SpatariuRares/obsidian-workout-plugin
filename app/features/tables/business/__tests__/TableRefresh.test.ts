/** @jest-environment jsdom */

import { TableRefresh } from "@app/features/tables/business/TableRefresh";
import { TableDataLoader } from "@app/features/tables/business/TableDataLoader";
import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { TableState, TableCallbacks } from "@app/features/tables/types";

jest.mock("@app/features/tables/business/TableDataLoader");

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

const createMockPlugin = () => ({} as any);

describe("TableRefresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing when container is missing", async () => {
    const state: TableState = { currentParams: { exercise: "Bench Press" } };
    const renderCallback = jest.fn();

    await TableRefresh.refreshTable(state, createMockPlugin(), renderCallback);

    expect(renderCallback).not.toHaveBeenCalled();
  });

  it("does nothing when params are missing", async () => {
    const state: TableState = {
      currentContainer: document.createElement("div"),
    };
    const renderCallback = jest.fn();

    await TableRefresh.refreshTable(state, createMockPlugin(), renderCallback);

    expect(renderCallback).not.toHaveBeenCalled();
  });

  it("refreshes and re-renders when data has changed", async () => {
    const freshData = [createLog(), createLog({ exercise: "Squat" })];
    (TableDataLoader.loadFreshData as jest.Mock).mockResolvedValue(freshData);
    (TableDataLoader.hasDataChanged as jest.Mock).mockReturnValue(true);

    const container = document.createElement("div");
    const params = { exercise: "Bench Press" };
    const state: TableState = {
      currentContainer: container,
      currentParams: params,
      currentLogData: [createLog()],
    };
    const renderCallback = jest.fn().mockResolvedValue(undefined);
    const callbacks: TableCallbacks = {
      onSuccess: jest.fn(),
    };

    await TableRefresh.refreshTable(
      state,
      createMockPlugin(),
      renderCallback,
      callbacks,
    );

    expect(renderCallback).toHaveBeenCalledWith(container, freshData, params);
    expect(state.currentLogData).toEqual(freshData);
    expect(callbacks.onSuccess).toHaveBeenCalledWith(
      CONSTANTS.WORKOUT.TABLE.MESSAGES.REFRESH_SUCCESS,
    );
  });

  it("does not re-render when data has not changed", async () => {
    const freshData = [createLog()];
    (TableDataLoader.loadFreshData as jest.Mock).mockResolvedValue(freshData);
    (TableDataLoader.hasDataChanged as jest.Mock).mockReturnValue(false);

    const state: TableState = {
      currentContainer: document.createElement("div"),
      currentParams: { exercise: "Bench Press" },
      currentLogData: [createLog()],
    };
    const renderCallback = jest.fn();

    await TableRefresh.refreshTable(state, createMockPlugin(), renderCallback);

    expect(renderCallback).not.toHaveBeenCalled();
  });

  it("calls onError and falls back to current data on error", async () => {
    (TableDataLoader.loadFreshData as jest.Mock).mockRejectedValue(
      new Error("load fail"),
    );

    const container = document.createElement("div");
    const params = { exercise: "Bench Press" };
    const currentData = [createLog()];
    const state: TableState = {
      currentContainer: container,
      currentParams: params,
      currentLogData: currentData,
    };
    const renderCallback = jest.fn().mockResolvedValue(undefined);
    const callbacks: TableCallbacks = {
      onError: jest.fn(),
    };

    await TableRefresh.refreshTable(
      state,
      createMockPlugin(),
      renderCallback,
      callbacks,
    );

    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.any(Error),
      "refreshing table",
    );
    // Should render with current data as fallback
    expect(renderCallback).toHaveBeenCalledWith(
      container,
      currentData,
      params,
    );
  });

  it("wraps non-Error objects into Error on failure", async () => {
    (TableDataLoader.loadFreshData as jest.Mock).mockRejectedValue(
      "string error",
    );

    const state: TableState = {
      currentContainer: document.createElement("div"),
      currentParams: { exercise: "Bench Press" },
      currentLogData: [createLog()],
    };
    const renderCallback = jest.fn().mockResolvedValue(undefined);
    const callbacks: TableCallbacks = {
      onError: jest.fn(),
    };

    await TableRefresh.refreshTable(
      state,
      createMockPlugin(),
      renderCallback,
      callbacks,
    );

    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "string error" }),
      "refreshing table",
    );
  });

  it("does not call fallback render if currentLogData is missing on error", async () => {
    (TableDataLoader.loadFreshData as jest.Mock).mockRejectedValue(
      new Error("fail"),
    );

    const state: TableState = {
      currentContainer: document.createElement("div"),
      currentParams: { exercise: "Bench Press" },
      // No currentLogData
    };
    const renderCallback = jest.fn();

    await TableRefresh.refreshTable(
      state,
      createMockPlugin(),
      renderCallback,
      { onError: jest.fn() },
    );

    expect(renderCallback).not.toHaveBeenCalled();
  });
});

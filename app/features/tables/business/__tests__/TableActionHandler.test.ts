import { TableActionHandler } from "@app/features/tables/business/TableActionHandler";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

// Mock EditLogModal
jest.mock("@app/features/modals/log/EditLogModal", () => ({
  EditLogModal: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
  })),
}));

// Mock ConfirmModal
jest.mock("@app/features/modals/common/ConfirmModal", () => ({
  ConfirmModal: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
  })),
}));

// Mock obsidian Notice
jest.mock("obsidian", () => ({
  Notice: jest.fn(),
}));

const createLog = (): WorkoutLogData => ({
  date: "2024-01-15",
  exercise: "Bench Press",
  reps: 8,
  weight: 80,
  volume: 640,
});

const createMockPlugin = () => ({
  app: {},
  triggerWorkoutLogRefresh: jest.fn(),
  deleteWorkoutLogEntry: jest.fn().mockResolvedValue(undefined),
});

describe("TableActionHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleEdit", () => {
    it("opens EditLogModal", () => {
      const log = createLog();
      const plugin = createMockPlugin();
      const { EditLogModal } = require("@app/features/modals/log/EditLogModal");

      TableActionHandler.handleEdit(log, plugin as any);

      expect(EditLogModal).toHaveBeenCalledWith(
        plugin.app,
        plugin,
        log,
        expect.any(Function),
      );
      expect(EditLogModal.mock.results[0].value.open).toHaveBeenCalled();
    });

    it("calls onComplete and triggers refresh after edit", () => {
      const log = createLog();
      const plugin = createMockPlugin();
      const onComplete = jest.fn();
      const { EditLogModal } = require("@app/features/modals/log/EditLogModal");

      TableActionHandler.handleEdit(log, plugin as any, onComplete);

      // Get the callback passed to EditLogModal
      const editCallback = EditLogModal.mock.calls[0][3];
      editCallback();

      expect(plugin.triggerWorkoutLogRefresh).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe("handleDelete", () => {
    it("opens ConfirmModal", () => {
      const log = createLog();
      const plugin = createMockPlugin();
      const {
        ConfirmModal,
      } = require("@app/features/modals/common/ConfirmModal");

      TableActionHandler.handleDelete(log, plugin as any);

      expect(ConfirmModal).toHaveBeenCalledWith(
        plugin.app,
        expect.any(String),
        expect.any(Function),
      );
      expect(ConfirmModal.mock.results[0].value.open).toHaveBeenCalled();
    });

    it("deletes entry and triggers refresh on confirm", async () => {
      const log = createLog();
      const plugin = createMockPlugin();
      const onComplete = jest.fn();
      const {
        ConfirmModal,
      } = require("@app/features/modals/common/ConfirmModal");

      TableActionHandler.handleDelete(log, plugin as any, onComplete);

      // Get the confirm callback
      const confirmCallback = ConfirmModal.mock.calls[0][2];
      confirmCallback();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(plugin.deleteWorkoutLogEntry).toHaveBeenCalledWith(log);
      expect(plugin.triggerWorkoutLogRefresh).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it("shows error notice when delete fails", async () => {
      const log = createLog();
      const plugin = createMockPlugin();
      plugin.deleteWorkoutLogEntry.mockRejectedValue(new Error("File not found"));
      const {
        ConfirmModal,
      } = require("@app/features/modals/common/ConfirmModal");
      const { Notice } = require("obsidian");

      TableActionHandler.handleDelete(log, plugin as any);

      const confirmCallback = ConfirmModal.mock.calls[0][2];
      confirmCallback();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(Notice).toHaveBeenCalledWith(expect.stringContaining("File not found"));
    });
  });
});

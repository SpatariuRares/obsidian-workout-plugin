/** @jest-environment jsdom */

import { TableActions } from "@app/features/tables/components/TableActions";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

// Mock ActionButtons
jest.mock("@app/features/tables/ui", () => ({
  ActionButtons: {
    createActionButtonsContainer: jest.fn((parent: HTMLElement) => {
      const container = document.createElement("div");
      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      container.appendChild(editBtn);
      container.appendChild(deleteBtn);
      parent.appendChild(container);
      return { container, editBtn, deleteBtn };
    }),
  },
}));

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

describe("TableActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleEdit", () => {
    it("opens EditLogModal", () => {
      const log = createLog();
      const plugin = createMockPlugin();
      const { EditLogModal } = require("@app/features/modals/log/EditLogModal");

      TableActions.handleEdit(log, plugin as any);

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

      TableActions.handleEdit(log, plugin as any, onComplete);

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
      const { ConfirmModal } = require("@app/features/modals/common/ConfirmModal");

      TableActions.handleDelete(log, plugin as any);

      expect(ConfirmModal).toHaveBeenCalledWith(
        plugin.app,
        expect.any(String),
        expect.any(Function),
      );
      expect(ConfirmModal.mock.results[0].value.open).toHaveBeenCalled();
    });
  });

  describe("renderActionButtons", () => {
    it("does nothing when originalLog is undefined", () => {
      const td = document.createElement("td");
      const plugin = createMockPlugin();

      TableActions.renderActionButtons(td, undefined, plugin as any);

      expect(td.children.length).toBe(0);
    });

    it("does nothing when plugin is undefined", () => {
      const td = document.createElement("td");
      const log = createLog();

      TableActions.renderActionButtons(td, log, undefined);

      expect(td.children.length).toBe(0);
    });

    it("creates edit and delete buttons", () => {
      const td = document.createElement("td");
      const log = createLog();
      const plugin = createMockPlugin();

      TableActions.renderActionButtons(td, log, plugin as any);

      expect(td.querySelector(".edit-btn")).not.toBeNull();
      expect(td.querySelector(".delete-btn")).not.toBeNull();
    });

    it("attaches click handlers to buttons", () => {
      const td = document.createElement("td");
      const log = createLog();
      const plugin = createMockPlugin();
      const onRefresh = jest.fn();

      TableActions.renderActionButtons(
        td,
        log,
        plugin as any,
        onRefresh,
      );

      const editBtn = td.querySelector(".edit-btn") as HTMLElement;
      const deleteBtn = td.querySelector(".delete-btn") as HTMLElement;

      // Simulate click on edit button
      const editEvent = new MouseEvent("click", { bubbles: true });
      editBtn.dispatchEvent(editEvent);

      const { EditLogModal } = require("@app/features/modals/log/EditLogModal");
      expect(EditLogModal).toHaveBeenCalled();

      // Simulate click on delete button
      const deleteEvent = new MouseEvent("click", { bubbles: true });
      deleteBtn.dispatchEvent(deleteEvent);

      const { ConfirmModal } = require("@app/features/modals/common/ConfirmModal");
      expect(ConfirmModal).toHaveBeenCalled();
    });

    it("uses AbortSignal for event listeners when provided", () => {
      const td = document.createElement("td");
      const log = createLog();
      const plugin = createMockPlugin();
      const controller = new AbortController();

      TableActions.renderActionButtons(
        td,
        log,
        plugin as any,
        undefined,
        controller.signal,
      );

      const editBtn = td.querySelector(".edit-btn") as HTMLElement;

      // Abort should prevent further event handling
      controller.abort();

      // After abort, clicks should not trigger handlers
      const { EditLogModal } = require("@app/features/modals/log/EditLogModal");
      EditLogModal.mockClear();

      const event = new MouseEvent("click", { bubbles: true });
      editBtn.dispatchEvent(event);

      expect(EditLogModal).not.toHaveBeenCalled();
    });

    it("prevents default and stops propagation on click", () => {
      const td = document.createElement("td");
      const log = createLog();
      const plugin = createMockPlugin();

      TableActions.renderActionButtons(td, log, plugin as any);

      const editBtn = td.querySelector(".edit-btn") as HTMLElement;

      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");
      const stopPropagationSpy = jest.spyOn(event, "stopPropagation");

      editBtn.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });
});

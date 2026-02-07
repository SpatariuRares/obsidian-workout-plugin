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
const mockEditModalOpen = jest.fn();
jest.mock("@app/features/modals/log/EditLogModal", () => ({
  EditLogModal: jest.fn().mockImplementation(() => ({
    open: mockEditModalOpen,
  })),
}));

// Mock ConfirmModal
const mockConfirmModalOpen = jest.fn();
jest.mock("@app/features/modals/common/ConfirmModal", () => ({
  ConfirmModal: jest.fn().mockImplementation(() => ({
    open: mockConfirmModalOpen,
  })),
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

    it("opens EditLogModal on edit click", () => {
      const td = document.createElement("td");
      const log = createLog();
      const plugin = createMockPlugin();
      const onRefresh = jest.fn();

      TableActions.renderActionButtons(td, log, plugin as any, onRefresh);

      const editBtn = td.querySelector(".edit-btn") as HTMLElement;
      editBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      const { EditLogModal } = require("@app/features/modals/log/EditLogModal");
      expect(EditLogModal).toHaveBeenCalledWith(
        plugin.app,
        plugin,
        log,
        expect.any(Function),
      );
      expect(mockEditModalOpen).toHaveBeenCalled();
    });

    it("opens ConfirmModal on delete click", () => {
      const td = document.createElement("td");
      const log = createLog();
      const plugin = createMockPlugin();
      const onRefresh = jest.fn();

      TableActions.renderActionButtons(td, log, plugin as any, onRefresh);

      const deleteBtn = td.querySelector(".delete-btn") as HTMLElement;
      deleteBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      const {
        ConfirmModal,
      } = require("@app/features/modals/common/ConfirmModal");
      expect(ConfirmModal).toHaveBeenCalledWith(
        plugin.app,
        expect.any(String),
        expect.any(Function),
      );
      expect(mockConfirmModalOpen).toHaveBeenCalled();
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

      mockEditModalOpen.mockClear();
      editBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(mockEditModalOpen).not.toHaveBeenCalled();
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

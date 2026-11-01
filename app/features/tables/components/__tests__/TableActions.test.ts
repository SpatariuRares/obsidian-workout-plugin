/** @jest-environment jsdom */

import { Platform } from "obsidian";
import { TableActions } from "@app/features/tables/components/TableActions";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { attachObsidianHelpers } from "@app/components/__tests__/obsidianDomMocks";

// Mock EditLogModal
const mockEditModalOpen = jest.fn();
jest.mock("@app/features/modals/log/EditLogModal", () => ({
  EditLogModal: jest.fn().mockImplementation(() => ({
    open: mockEditModalOpen,
  })),
}));

const createLog = (): WorkoutLogData => ({
  date: "2024-01-15T10:00:00.000Z",
  exercise: "Bench Press",
  reps: 8,
  weight: 80,
  volume: 640,
});

const createMockPlugin = () => ({ app: {} });

const newCell = () => attachObsidianHelpers(document.createElement("td"));

/** A row the way TableRenderer builds it: the actions cell inside a tr */
const createRow = () => {
  const tr = document.createElement("tr");
  const valueTd = tr.appendChild(document.createElement("td"));
  const td = tr.appendChild(newCell());
  return { tr, valueTd, td };
};

const editButton = (td: HTMLElement) =>
  td.querySelector<HTMLButtonElement>(".workout-table-action-btn-edit")!;

describe("TableActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderActionButtons", () => {
    it("does nothing when originalLog is undefined", () => {
      const td = newCell();

      TableActions.renderActionButtons(td, undefined, createMockPlugin() as any);

      expect(td.children.length).toBe(0);
    });

    it("does nothing when plugin is undefined", () => {
      const td = newCell();

      TableActions.renderActionButtons(td, createLog(), undefined);

      expect(td.children.length).toBe(0);
    });

    it("gives the row only an edit button, which opens the edit form", () => {
      const td = newCell();
      const log = createLog();
      const plugin = createMockPlugin();

      TableActions.renderActionButtons(td, log, plugin as any);

      expect(td.querySelectorAll("button")).toHaveLength(1);
      editButton(td).click();

      const { EditLogModal } = require("@app/features/modals/log/EditLogModal");
      expect(EditLogModal).toHaveBeenCalledWith(plugin.app, plugin, log);
      expect(mockEditModalOpen).toHaveBeenCalled();
    });

    it("uses AbortSignal for event listeners when provided", () => {
      const td = newCell();
      const controller = new AbortController();

      TableActions.renderActionButtons(
        td,
        createLog(),
        createMockPlugin() as any,
        controller.signal,
      );
      controller.abort();
      editButton(td).click();

      expect(mockEditModalOpen).not.toHaveBeenCalled();
    });

    it("prevents default and stops propagation on click", () => {
      const td = newCell();
      TableActions.renderActionButtons(td, createLog(), createMockPlugin() as any);

      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");
      const stopPropagationSpy = jest.spyOn(event, "stopPropagation");
      editButton(td).dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    describe("on phones", () => {
      beforeEach(() => {
        (Platform as { isMobile: boolean }).isMobile = true;
      });
      afterEach(() => {
        (Platform as { isMobile: boolean }).isMobile = false;
      });

      it("opens the edit form when the card is tapped, once when the pencil is", () => {
        const { tr, valueTd, td } = createRow();
        TableActions.renderActionButtons(td, createLog(), createMockPlugin() as any);

        expect(tr.classList.contains("workout-table-row-tappable")).toBe(true);
        valueTd.click();
        expect(mockEditModalOpen).toHaveBeenCalledTimes(1);

        editButton(td).click();
        expect(mockEditModalOpen).toHaveBeenCalledTimes(2);
      });
    });

    it("leaves rows alone on desktop", () => {
      const { tr, valueTd, td } = createRow();
      TableActions.renderActionButtons(td, createLog(), createMockPlugin() as any);

      valueTd.click();

      expect(tr.classList.contains("workout-table-row-tappable")).toBe(false);
      expect(mockEditModalOpen).not.toHaveBeenCalled();
    });
  });
});

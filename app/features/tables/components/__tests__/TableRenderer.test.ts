/** @jest-environment jsdom */

import { TableRenderer } from "@app/features/tables/components/TableRenderer";
import { CONSTANTS } from "@app/constants";
import { WorkoutLogData, WorkoutProtocol } from "@app/types/WorkoutLogData";
import { TableRow } from "@app/features/tables/types";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

// Mock TableActions
jest.mock("@app/features/tables/components/TableActions", () => ({
  TableActions: {
    renderActionButtons: jest.fn(),
  },
}));

jest.mock("@app/features/tables/ui", () => ({
  TableErrorMessage: {
    render: jest.fn((container: HTMLElement, message: string) => {
      const div = document.createElement("div");
      div.className = "workout-feedback-error";
      div.textContent = message;
      container.appendChild(div);
    }),
  },
  TableHeader: {
    render: jest.fn((table: HTMLElement, headers: string[]) => {
      const thead = table.appendChild(document.createElement("thead"));
      const headerRow = thead.appendChild(document.createElement("tr"));
      headers.forEach((header: string) => {
        const th = headerRow.appendChild(document.createElement("th"));
        th.textContent = header;
      });
      return thead;
    }),
  },
}));

// Mock SpacerStat and ProtocolBadge
jest.mock("@app/components/atoms", () => ({
  SpacerStat: {
    create: jest.fn(
      (parent: HTMLElement, props: { icon?: string; value: string }) => {
        const span = document.createElement("span");
        span.className = "spacer-stat";
        span.textContent = `${props.icon || ""} ${props.value}`;
        parent.appendChild(span);
        return span;
      },
    ),
  },
  ProtocolBadge: {
    create: jest.fn((parent: HTMLElement, props: { text: string }) => {
      const span = document.createElement("span");
      span.className = "workout-protocol-badge";
      span.textContent = props.text;
      parent.appendChild(span);
      return span;
    }),
  },
}));

// Mock DateUtils
jest.mock("@app/utils/DateUtils", () => ({
  DateUtils: {
    toShortDate: jest.fn((date: string) => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
  },
}));

const createRow = (overrides: Partial<TableRow> = {}): TableRow => ({
  displayRow: ["10:00", "8", "80", "640", ""],
  originalDate: "2024-01-15T10:00:00",
  dateKey: "2024-01-15",
  originalLog: {
    date: "2024-01-15T10:00:00",
    exercise: "Bench Press",
    reps: 8,
    weight: 80,
    volume: 640,
  },
  ...overrides,
});

describe("TableRenderer", () => {
  describe("createTableContainer", () => {
    it("creates a container with the correct class", () => {
      const parent = createObsidianContainer();

      const container = TableRenderer.createTableContainer(parent);

      expect(container.classList.contains("workout-table-container")).toBe(
        true,
      );
    });
  });

  describe("renderTable", () => {
    it("renders a table with headers and rows", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Reps", "Weight", "Volume", "Actions"];
      const rows = [createRow()];

      const result = TableRenderer.renderTable(container, headers, rows, {});

      expect(result).toBe(true);

      const table = container.querySelector("table");
      expect(table).not.toBeNull();
      expect(table!.className).toBe("workout-log-table");

      const ths = container.querySelectorAll("th");
      expect(ths.length).toBe(5);
      expect(ths[0].textContent).toBe("Date");
    });

    it("returns true on success", () => {
      const container = document.createElement("div");

      const result = TableRenderer.renderTable(
        container,
        ["Date"],
        [createRow({ displayRow: ["10:00"] })],
        {},
      );

      expect(result).toBe(true);
    });

    it("creates spacer rows for date groups", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Reps", "Weight", "Volume", "Actions"];
      const rows = [
        createRow({ dateKey: "2024-01-15" }),
        createRow({ dateKey: "2024-01-15" }),
        createRow({
          dateKey: "2024-01-14",
          originalDate: "2024-01-14T10:00:00",
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const spacerRows = container.querySelectorAll(".workout-table-spacer");
      expect(spacerRows.length).toBe(2); // Two date groups
    });

    it("renders strength summary in spacer rows", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Reps", "Weight", "Volume", "Actions"];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          originalLog: {
            date: "2024-01-15T10:00:00",
            exercise: "Bench Press",
            reps: 8,
            weight: 80,
            volume: 640,
          },
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const { SpacerStat } = require("@app/components/atoms");
      expect(SpacerStat.create).toHaveBeenCalled();
    });

    it("renders cardio summary in spacer rows", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Duration", "Distance", "Actions"];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", "120", "5.2", ""],
          originalLog: {
            date: "2024-01-15T10:00:00",
            exercise: "Running",
            reps: 0,
            weight: 0,
            volume: 0,
            customFields: {
              duration: 120,
              distance: 5.2,
              heartRate: 150,
            },
          },
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const { SpacerStat } = require("@app/components/atoms");
      expect(SpacerStat.create).toHaveBeenCalled();
    });

    it("handles empty rows", () => {
      const container = document.createElement("div");

      const result = TableRenderer.renderTable(container, ["Date"], [], {});

      expect(result).toBe(true);
    });

    it("applies group-even/group-odd classes to rows", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Reps"];
      const rows = [
        createRow({ dateKey: "2024-01-15", displayRow: ["10:00", "8"] }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const dataRows = container.querySelectorAll(".workout-same-day-log");
      expect(dataRows.length).toBe(1);
      expect(
        dataRows[0].classList.contains("group-even") ||
          dataRows[0].classList.contains("group-odd"),
      ).toBe(true);
    });

    it("applies date cell class to first column", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Reps"];
      const rows = [
        createRow({ dateKey: "2024-01-15", displayRow: ["10:00", "8"] }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const dateCell = container.querySelector(".workout-table-date-cell");
      expect(dateCell).not.toBeNull();
      expect(dateCell!.textContent).toBe("10:00");
    });

    it("applies volume cell class to volume column", () => {
      const container = document.createElement("div");
      const volCol = CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value;
      const headers = ["Date", volCol];
      const rows = [
        createRow({ dateKey: "2024-01-15", displayRow: ["10:00", "640"] }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const volumeCell = container.querySelector(".workout-table-volume-cell");
      expect(volumeCell).not.toBeNull();
    });

    it("renders protocol badge for protocol column", () => {
      const container = document.createElement("div");
      const headers = ["Date", CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", WorkoutProtocol.DROP_SET],
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const protocolCell = container.querySelector(
        ".workout-table-protocol-cell",
      );
      expect(protocolCell).not.toBeNull();
    });

    it("renders action buttons in actions column", () => {
      const container = document.createElement("div");
      const headers = ["Date", CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS.value];
      const log: WorkoutLogData = {
        date: "2024-01-15",
        exercise: "Bench",
        reps: 8,
        weight: 80,
        volume: 640,
      };
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", ""],
          originalLog: log,
        }),
      ];

      const mockPlugin = {} as any;

      TableRenderer.renderTable(
        container,
        headers,
        rows,
        {},
        [log],
        mockPlugin,
      );

      const {
        TableActions,
      } = require("@app/features/tables/components/TableActions");
      expect(TableActions.renderActionButtons).toHaveBeenCalled();
    });
  });

  describe("renderFallbackMessage", () => {
    it("renders error message using TableErrorMessage", () => {
      const container = createObsidianContainer();

      TableRenderer.renderFallbackMessage(container, "Something went wrong");

      const { TableErrorMessage } = require("@app/features/tables/ui");
      expect(TableErrorMessage.render).toHaveBeenCalledWith(
        container,
        "Something went wrong",
      );
    });
  });

  describe("renderProtocolBadge", () => {
    it("renders badge for built-in protocols", () => {
      const container = document.createElement("div");
      const headers = ["Date", CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", WorkoutProtocol.DROP_SET],
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const { ProtocolBadge } = require("@app/components/atoms");
      expect(ProtocolBadge.create).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          text: "Drop",
        }),
      );
    });

    it("does not render badge for standard protocol", () => {
      const container = document.createElement("div");
      const headers = ["Date", CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", WorkoutProtocol.STANDARD],
        }),
      ];

      const { ProtocolBadge } = require("@app/components/atoms");
      ProtocolBadge.create.mockClear();

      TableRenderer.renderTable(container, headers, rows, {});

      expect(ProtocolBadge.create).not.toHaveBeenCalled();
    });

    it("renders badge for custom protocols from plugin settings", () => {
      const container = document.createElement("div");
      const headers = ["Date", CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", "custom_proto"],
        }),
      ];

      const mockPlugin = {
        settings: {
          customProtocols: [
            {
              id: "custom_proto",
              name: "Custom Protocol",
              abbreviation: "CP",
              color: "#FF0000",
            },
          ],
        },
      } as any;

      const { ProtocolBadge } = require("@app/components/atoms");
      ProtocolBadge.create.mockClear();

      TableRenderer.renderTable(
        container,
        headers,
        rows,
        {},
        undefined,
        mockPlugin,
      );

      expect(ProtocolBadge.create).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          text: "CP",
          color: "#FF0000",
        }),
      );
    });
  });

  describe("spacer row with duration formatting", () => {
    it("formats duration >= 60 as minutes and seconds", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Duration"];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", "120"],
          originalLog: {
            date: "2024-01-15T10:00:00",
            exercise: "Plank",
            reps: 0,
            weight: 0,
            volume: 0,
            customFields: { duration: 90 },
          },
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const { SpacerStat } = require("@app/components/atoms");
      const calls = SpacerStat.create.mock.calls;
      const durationCall = calls.find(
        (call: any[]) => call[1].value && call[1].value.includes("m"),
      );
      expect(durationCall).toBeTruthy();
    });

    it("formats duration < 60 as seconds only", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Duration"];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", "30"],
          originalLog: {
            date: "2024-01-15T10:00:00",
            exercise: "Plank",
            reps: 0,
            weight: 0,
            volume: 0,
            customFields: { duration: 30 },
          },
        }),
      ];

      const { SpacerStat } = require("@app/components/atoms");
      SpacerStat.create.mockClear();

      TableRenderer.renderTable(container, headers, rows, {});

      const calls = SpacerStat.create.mock.calls;
      const durationCall = calls.find(
        (call: any[]) => call[1].value && call[1].value.includes("s"),
      );
      expect(durationCall).toBeTruthy();
    });
  });

  describe("spacer row with generic count fallback", () => {
    it("shows set count when no metrics available", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Reps"];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", "0"],
          originalLog: {
            date: "2024-01-15T10:00:00",
            exercise: "Custom",
            reps: 0,
            weight: 0,
            volume: 0,
          },
        }),
      ];

      const { SpacerStat } = require("@app/components/atoms");
      SpacerStat.create.mockClear();

      TableRenderer.renderTable(container, headers, rows, {});

      const calls = SpacerStat.create.mock.calls;
      const setsCall = calls.find(
        (call: any[]) => call[1].value && call[1].value.includes("sets"),
      );
      expect(setsCall).toBeTruthy();
    });
  });
});

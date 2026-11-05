/** @jest-environment jsdom */

import { CONSTANTS } from "@app/constants";
import { TableHeader } from "@app/features/tables/ui/TableHeader";
import { TableRenderer } from "@app/features/tables/components/TableRenderer";

import {
  WorkoutLogData,
  WorkoutProtocol,
} from "@app/types/WorkoutLogData";
import { logRow } from "@app/types/__tests__/logRow";
import { TableRow } from "@app/features/tables/types";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

// Mock TableActions
jest.mock("@app/features/tables/components/TableActions", () => ({
  TableActions: {
    renderActionButtons: jest.fn(),
  },
}));

jest.mock("@app/features/tables/ui/TableErrorMessage", () => ({
  TableErrorMessage: {
    render: jest.fn((container: HTMLElement, message: string) => {
      const div = document.createElement("div");
      div.className = "workout-feedback-error";
      div.textContent = message;
      container.appendChild(div);
    }),
  },
}));
jest.mock("@app/features/tables/ui/TableHeader", () => ({
  TableHeader: {
    render: jest.fn((table: HTMLElement, headers: string[]) => {
      const thead = table.appendChild(
        document.createElement("thead"),
      );
      const headerRow = thead.appendChild(
        document.createElement("tr"),
      );
      headers.forEach((header: string) => {
        const th = headerRow.appendChild(
          document.createElement("th"),
        );
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
      (
        parent: HTMLElement,
        props: { icon?: string; value: string },
      ) => {
        const span = document.createElement("span");
        span.className = "spacer-stat";
        span.textContent = `${props.icon || ""} ${props.value}`;
        parent.appendChild(span);
        return span;
      },
    ),
  },
  ProtocolBadge: {
    create: jest.fn(
      (parent: HTMLElement, props: { text: string }) => {
        const span = document.createElement("span");
        span.className = "workout-protocol-badge";
        span.textContent = props.text;
        parent.appendChild(span);
        return span;
      },
    ),
    // As the real one: a badge only for a protocol with an abbreviation
    forProtocol(
      parent: HTMLElement,
      protocol: { abbreviation: string; name: string; badgeColor?: string },
    ) {
      if (!protocol.abbreviation) return null;
      return this.create(parent, {
        text: protocol.abbreviation,
        tooltip: protocol.name,
        color: protocol.badgeColor,
      });
    },
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
  originalLog: logRow({ date: "2024-01-15T10:00:00" }),
  ...overrides,
});

describe("TableRenderer", () => {
  // Patch HTMLElement.prototype with Obsidian DOM helpers so plain
  // document.createElement("div") containers support createEl/createDiv
  beforeEach(() => {
    (HTMLElement.prototype as any).createEl = function (
      tag: string,
      options?: {
        cls?: string | string[];
        text?: string;
        attr?: Record<string, string>;
      },
    ): HTMLElement {
      const el = document.createElement(tag);
      if (options?.cls) {
        const classes = Array.isArray(options.cls)
          ? options.cls
          : options.cls.split(/\s+/);
        classes.filter(Boolean).forEach((c) => el.classList.add(c));
      }
      if (options?.text !== undefined) el.textContent = options.text;
      if (options?.attr) {
        Object.entries(options.attr).forEach(([k, v]) =>
          el.setAttribute(k, v),
        );
      }
      this.appendChild(el);
      return el;
    };
    (HTMLElement.prototype as any).createDiv = function (
      options?: { cls?: string | string[]; text?: string },
    ): HTMLElement {
      return (this as any).createEl("div", options);
    };
    (HTMLElement.prototype as any).createSpan = function (
      options?: { cls?: string | string[]; text?: string },
    ): HTMLElement {
      return (this as any).createEl("span", options);
    };
  });

  afterEach(() => {
    delete (HTMLElement.prototype as any).createEl;
    delete (HTMLElement.prototype as any).createDiv;
    delete (HTMLElement.prototype as any).createSpan;
  });

  describe("createTableContainer", () => {
    it("creates a container with the correct class", () => {
      const parent = createObsidianContainer();

      const container = TableRenderer.createTableContainer(parent);

      expect(
        container.classList.contains("workout-table-container"),
      ).toBe(true);
    });
  });

  describe("renderTable", () => {
    it("renders a table with headers and rows", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Reps", "Weight", "Volume", "Actions"];
      const rows = [createRow()];

      const result = TableRenderer.renderTable(
        container,
        headers,
        rows,
        {},
      );

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

      const spacerRows = container.querySelectorAll(
        ".workout-table-spacer",
      );
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

      const result = TableRenderer.renderTable(
        container,
        ["Date"],
        [],
        {},
      );

      expect(result).toBe(true);
    });

    it("gives a day's line and sets one shade, the next day the other", () => {
      const container = document.createElement("div");
      const rows = [
        createRow({ dateKey: "2024-01-15", displayRow: ["10:00", "8"] }),
        createRow({ dateKey: "2024-01-15", displayRow: ["10:05", "8"] }),
        createRow({ dateKey: "2024-01-12", displayRow: ["09:00", "6"] }),
      ];

      TableRenderer.renderTable(container, ["Date", "Reps"], rows, {});

      const shades = Array.from(container.querySelectorAll("tbody tr")).map((tr) =>
        tr.classList.contains("workout-table-day-odd") ? "odd" : "even",
      );
      // line, set, set | line, set
      expect(shades).toEqual(["odd", "odd", "odd", "even", "even"]);
    });

    it("applies date cell class to first column", () => {
      const container = document.createElement("div");
      const headers = ["Date", "Reps"];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", "8"],
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const dateCell = container.querySelector(
        ".workout-table-date-cell",
      );
      expect(dateCell).not.toBeNull();
      expect(dateCell!.textContent).toBe("10:00");
    });

    it("gives a column's header and cells the same class, and counts the value columns", () => {
      const container = document.createElement("div");
      const COLUMNS = CONSTANTS.WORKOUT.TABLE.COLUMNS;
      const headers = [
        "Date",
        COLUMNS.REPS.value,
        COLUMNS.WEIGHT.value,
        COLUMNS.VOLUME.value,
        COLUMNS.NOTES.value,
        COLUMNS.ACTIONS.value,
      ];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", "8", "80", "640", "", ""],
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const classes = [
        "workout-table-date-cell",
        "workout-table-value-cell",
        "workout-table-value-cell",
        "workout-table-volume-cell",
        "workout-table-notes-cell",
        "workout-table-actions-cell",
      ];
      const td = Array.from(container.querySelectorAll("tr.workout-same-day-log td"));
      expect(TableHeader.render).toHaveBeenLastCalledWith(expect.any(HTMLElement), headers, classes);
      expect(td.map((cell) => cell.className)).toEqual(classes);
      // Reps, weight and volume: the phone grid's number tracks
      const table = container.querySelector<HTMLElement>(".workout-log-table")!;
      expect(table.style.getPropertyValue("--workout-log-fields")).toBe("3");
    });

    it("marks the notes column so phones put it under the numbers", () => {
      const container = document.createElement("div");
      const notesCol = CONSTANTS.WORKOUT.TABLE.COLUMNS.NOTES.value;
      const headers = ["Date", notesCol];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", "Felt strong"],
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const notesCell = container.querySelector(
        ".workout-table-notes-cell",
      );
      expect(notesCell?.textContent).toBe("Felt strong");
    });

    it("marks the exercise cell so phones put it above the numbers", () => {
      const container = document.createElement("div");
      const exerciseCol = CONSTANTS.WORKOUT.TABLE.COLUMNS.EXERCISE.value;
      TableRenderer.renderTable(
        container,
        ["Date", exerciseCol],
        [
          createRow({
            dateKey: "2024-01-15",
            displayRow: ["10:00", "Lying Leg Curl (Sdraiato)"],
          }),
        ],
        {},
      );

      const cell = container.querySelector(".workout-table-exercise-cell");
      expect(cell?.textContent).toBe("Lying Leg Curl (Sdraiato)");
    });

    it("marks N/A values so they are muted", () => {
      const container = document.createElement("div");
      const repsCol = CONSTANTS.WORKOUT.TABLE.COLUMNS.REPS.value;
      const durationCol = CONSTANTS.WORKOUT.TABLE.COLUMNS.DURATION.value;
      TableRenderer.renderTable(
        container,
        ["Date", repsCol, durationCol],
        [
          createRow({
            dateKey: "2024-01-15",
            displayRow: ["10:00", "8", t("table.notAvailable")],
          }),
        ],
        {},
      );

      const cells = container.querySelectorAll("tr.workout-same-day-log td");
      expect(cells[1].classList.contains("workout-table-na-cell")).toBe(false);
      expect(cells[2].classList.contains("workout-table-na-cell")).toBe(true);
    });

    it("applies volume cell class to volume column", () => {
      const container = document.createElement("div");
      const volCol = CONSTANTS.WORKOUT.TABLE.COLUMNS.VOLUME.value;
      const headers = ["Date", volCol];
      const rows = [
        createRow({
          dateKey: "2024-01-15",
          displayRow: ["10:00", "640"],
        }),
      ];

      TableRenderer.renderTable(container, headers, rows, {});

      const volumeCell = container.querySelector(
        ".workout-table-volume-cell",
      );
      expect(volumeCell).not.toBeNull();
    });

    it("renders protocol badge for protocol column", () => {
      const container = document.createElement("div");
      const headers = [
        "Date",
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      ];
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
      const headers = [
        "Date",
        CONSTANTS.WORKOUT.TABLE.COLUMNS.ACTIONS.value,
      ];
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

      TableRenderer.renderFallbackMessage(
        container,
        "Something went wrong",
      );

      const {
        TableErrorMessage,
      } = require("@app/features/tables/ui/TableErrorMessage");
      expect(TableErrorMessage.render).toHaveBeenCalledWith(
        container,
        "Something went wrong",
      );
    });
  });

  describe("renderProtocolBadge", () => {
    it("renders badge for built-in protocols", () => {
      const container = document.createElement("div");
      const headers = [
        "Date",
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      ];
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
      const headers = [
        "Date",
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      ];
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
      const headers = [
        "Date",
        CONSTANTS.WORKOUT.TABLE.COLUMNS.PROTOCOL.value,
      ];
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
        (call: any[]) =>
          call[1].value === t("table.setCount", { count: 1 }),
      );
      expect(setsCall).toBeTruthy();
    });
  });
});

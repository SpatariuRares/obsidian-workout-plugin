/** @jest-environment jsdom */

import { WorkoutLogData } from "@app/types/WorkoutLogData";

// Mock obsidian
jest.mock("obsidian", () => ({
  MarkdownView: class {},
  MarkdownRenderChild: class {
    containerEl: HTMLElement;
    constructor(containerEl: HTMLElement) {
      this.containerEl = containerEl;
    }
    load() {}
    unload() {}
  },
}));

// Mock BaseView
jest.mock("@app/features/common/views/BaseView", () => ({
  BaseView: class {
    plugin: any;
    constructor(plugin: any) {
      this.plugin = plugin;
    }
    logDebug() {}
    handleError(container: HTMLElement, error: Error) {
      container.textContent = error.message;
    }
    handleEmptyData(_container: HTMLElement, logData: any[]) {
      return logData.length === 0;
    }
    filterData(data: any[], _params: any) {
      return {
        filteredData: data,
        filterMethodUsed: "test",
        titlePrefix: "Workout Log",
      };
    }
    showLoadingIndicator(container: HTMLElement) {
      const div = document.createElement("div");
      div.className = "loading";
      container.appendChild(div);
      return div;
    }
    handleNoFilteredData() {}
    validateAndHandleErrors(_container: HTMLElement, errors: string[]) {
      return errors.length === 0;
    }
  },
}));

// Mock tables barrel
jest.mock("@app/features/tables", () => ({
  TableConfig: {
    validateParams: jest.fn().mockReturnValue([]),
  },
  TableRefresh: {
    refreshTable: jest.fn().mockResolvedValue(undefined),
  },
  TableRenderer: {
    createTableContainer: jest.fn((parent: HTMLElement) => {
      const div = document.createElement("div");
      div.className = "workout-table-container";
      parent.appendChild(div);
      return div;
    }),
    renderTable: jest.fn().mockReturnValue(true),
    renderFallbackMessage: jest.fn(),
  },
  TableDataProcessor: {
    processTableData: jest.fn().mockImplementation(async (_data, params) => ({
      headers: ["Date", "Reps", "Weight", "Volume", "Actions"],
      rows: [
        {
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
        },
      ],
      totalRows: 1,
      filterResult: {
        filteredData: [
          {
            date: "2024-01-15T10:00:00",
            exercise: "Bench Press",
            reps: 8,
            weight: 80,
            volume: 640,
          },
        ],
        filterMethodUsed: "test",
        titlePrefix: "Workout Log",
      },
      params: params || {},
    })),
  },
  TableDataLoader: {
    getOptimizedCSVData: jest.fn().mockResolvedValue([
      {
        date: "2024-01-15T10:00:00",
        exercise: "Bench Press",
        reps: 8,
        weight: 80,
        volume: 640,
      },
    ]),
  },
  GoToExerciseButton: {
    render: jest.fn(),
  },
  TargetHeader: {
    render: jest.fn(),
  },
  AchievementBadge: {
    render: jest.fn(),
  },
}));

// Mock LogCallouts
jest.mock("@app/components/organism/LogCallouts", () => ({
  LogCallouts: {
    renderAddLogButton: jest.fn(),
  },
}));

// Mock Button
jest.mock("@app/components", () => ({
  Button: {
    createContainer: jest.fn((parent: HTMLElement) => {
      const div = document.createElement("div");
      div.className = "button-container";
      parent.appendChild(div);
      return div;
    }),
  },
}));

// Mock VIEW_TYPES
jest.mock("@app/types/ViewTypes", () => ({
  VIEW_TYPES: { TABLE: "table" },
}));

// Mock CodeBlockEditorService
jest.mock("@app/services/editor/CodeBlockEditorService", () => ({
  CodeBlockEditorService: {
    updateTargetWeight: jest.fn().mockResolvedValue(true),
  },
}));

import { EmbeddedTableView } from "@app/features/tables/views/EmbeddedTableView";
import {
  TableConfig,
  TableRenderer,
  TableDataProcessor,
  TableDataLoader,
  TableRefresh,
  TargetHeader,
  AchievementBadge,
  GoToExerciseButton,
} from "@app/features/tables";
import { LogCallouts } from "@app/components/organism/LogCallouts";

const createLog = (
  overrides: Partial<WorkoutLogData> = {},
): WorkoutLogData => ({
  date: "2024-01-15T10:00:00",
  exercise: "Bench Press",
  reps: 8,
  weight: 80,
  volume: 640,
  ...overrides,
});

const createMockPlugin = () => ({
  app: {
    workspace: {
      getActiveViewOfType: jest.fn().mockReturnValue(null),
    },
  },
  settings: {
    achievedTargets: {},
    weightIncrement: 2.5,
  },
  getWorkoutLogData: jest.fn().mockResolvedValue([createLog()]),
  clearLogDataCache: jest.fn(),
  saveSettings: jest.fn().mockResolvedValue(undefined),
});

describe("EmbeddedTableView", () => {
  let view: EmbeddedTableView;
  let plugin: any;

  beforeEach(() => {
    jest.clearAllMocks();
    plugin = createMockPlugin();
    view = new EmbeddedTableView(plugin);

    // Mock Obsidian-specific DOM methods
    HTMLElement.prototype.empty = function () {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
    };
    HTMLElement.prototype.addClass = function (className: string) {
      this.classList.add(className);
      return this;
    };
    HTMLElement.prototype.removeClass = function (className: string) {
      this.classList.remove(className);
      return this;
    };
  });

  describe("createTable", () => {
    it("renders a table with data", async () => {
      const container = document.createElement("div");
      const logData = [createLog()];

      await view.createTable(container, logData, {});

      expect(TableDataLoader.getOptimizedCSVData).toHaveBeenCalled();
      expect(TableDataProcessor.processTableData).toHaveBeenCalled();
      expect(TableRenderer.renderTable).toHaveBeenCalled();
    });

    it("validates params before rendering", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], { limit: 10 });

      expect(TableConfig.validateParams).toHaveBeenCalledWith({ limit: 10 });
    });

    it("stops rendering when validation fails", async () => {
      (TableConfig.validateParams as jest.Mock).mockReturnValueOnce([
        "Invalid limit",
      ]);
      const container = document.createElement("div");

      // Need to override validateAndHandleErrors to return false
      const origValidate = (view as any).validateAndHandleErrors;
      (view as any).validateAndHandleErrors = jest.fn().mockReturnValue(false);

      await view.createTable(container, [createLog()], { limit: -1 });

      expect(TableRenderer.renderTable).not.toHaveBeenCalled();

      (view as any).validateAndHandleErrors = origValidate;
    });

    it("handles empty data", async () => {
      const origHandleEmpty = (view as any).handleEmptyData;
      (view as any).handleEmptyData = jest.fn().mockReturnValue(true);

      const container = document.createElement("div");

      await view.createTable(container, [], {});

      expect(TableRenderer.renderTable).not.toHaveBeenCalled();

      (view as any).handleEmptyData = origHandleEmpty;
    });

    it("handles empty filtered data", async () => {
      const origFilter = (view as any).filterData;
      (view as any).filterData = jest.fn().mockReturnValue({
        filteredData: [],
        filterMethodUsed: "test",
        titlePrefix: "Workout Log",
      });

      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {});

      expect(TableRenderer.renderTable).not.toHaveBeenCalled();

      (view as any).filterData = origFilter;
    });

    it("renders action buttons when showAddButton is not false", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        showAddButton: true,
      });

      expect(LogCallouts.renderAddLogButton).toHaveBeenCalled();
    });

    it("does not render action buttons when showAddButton is false", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        showAddButton: false,
      });

      expect(LogCallouts.renderAddLogButton).not.toHaveBeenCalled();
    });

    it("renders target header", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        targetWeight: 100,
        targetReps: 10,
      });

      expect(TargetHeader.render).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          targetWeight: 100,
          targetReps: 10,
        }),
      );
    });

    it("renders achievement badge when exercise and targets set", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
      });

      expect(AchievementBadge.render).toHaveBeenCalled();
    });

    it("does not render achievement badge when no exercise", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        targetWeight: 80,
        targetReps: 10,
      });

      expect(AchievementBadge.render).not.toHaveBeenCalled();
    });

    it("does not render achievement badge when targetWeight is missing", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        exercise: "Bench Press",
        targetReps: 10,
      });

      expect(AchievementBadge.render).not.toHaveBeenCalled();
    });

    it("renders goto exercise button when exercise is set", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        exercise: "Bench Press",
      });

      expect(GoToExerciseButton.render).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          exerciseName: "Bench Press",
        }),
        expect.any(AbortSignal),
      );
    });

    it("does not render goto exercise button when no exercise", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {});

      expect(GoToExerciseButton.render).not.toHaveBeenCalled();
    });

    it("renders fallback message when table rendering fails", async () => {
      (TableRenderer.renderTable as jest.Mock).mockReturnValueOnce(false);
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {});

      expect(TableRenderer.renderFallbackMessage).toHaveBeenCalled();
    });

    it("handles errors during rendering", async () => {
      (TableDataLoader.getOptimizedCSVData as jest.Mock).mockRejectedValueOnce(
        new Error("Load failed"),
      );
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {});

      // Should have called handleError
      expect(container.textContent).toContain("Load failed");
    });

    it("handles non-Error exceptions", async () => {
      (TableDataLoader.getOptimizedCSVData as jest.Mock).mockRejectedValueOnce(
        "string error",
      );
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {});

      expect(container.textContent).toContain("string error");
    });

    it("uses exercise name from params for add log button", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        exercise: "Squat",
      });

      expect(LogCallouts.renderAddLogButton).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        "Squat",
        expect.any(String),
        plugin,
        expect.any(Function),
        expect.any(AbortSignal),
        expect.anything(),
      );
    });

    it("passes latest entry to add log button", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {});

      const addLogCall = (LogCallouts.renderAddLogButton as jest.Mock).mock
        .calls[0];
      // The 7th argument is latestEntry
      expect(addLogCall[6]).toBeDefined();
    });
  });

  describe("refreshTable", () => {
    it("delegates to TableRefresh.refreshTable", async () => {
      const container = document.createElement("div");
      const params = { exercise: "Bench" };

      await view.refreshTable(container, params);

      expect(TableRefresh.refreshTable).toHaveBeenCalledWith(
        plugin,
        container,
        params,
        expect.any(Function),
        expect.any(Object),
      );
    });
  });

  describe("cleanup", () => {
    it("unloads all render children", async () => {
      const container = document.createElement("div");

      // Create table to add render children
      await view.createTable(container, [createLog()], {});

      // Should not throw
      view.cleanup();
    });

    it("handles errors during cleanup silently", () => {
      // Should not throw even with no children
      view.cleanup();
    });
  });

  describe("achievement badge callbacks", () => {
    it("wires onDismiss callback to save settings", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
      });

      // Get the callbacks passed to AchievementBadge.render
      const renderCall = (AchievementBadge.render as jest.Mock).mock.calls[0];
      const callbacks = renderCall[2]; // Third argument is callbacks

      // Call onDismiss
      await callbacks.onDismiss();

      expect(plugin.settings.achievedTargets["Bench Press"]).toBe(80);
      expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it("wires onUpdateTarget callback", async () => {
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
      });

      const renderCall = (AchievementBadge.render as jest.Mock).mock.calls[0];
      const callbacks = renderCall[2];

      // Call onUpdateTarget
      await callbacks.onUpdateTarget(82.5);

      const {
        CodeBlockEditorService,
      } = require("@app/services/editor/CodeBlockEditorService");
      expect(CodeBlockEditorService.updateTargetWeight).toHaveBeenCalledWith(
        plugin.app,
        "Bench Press",
        82.5,
      );
    });

    it("passes isDismissedForWeight correctly", async () => {
      plugin.settings.achievedTargets["Bench Press"] = 80;
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
      });

      const renderCall = (AchievementBadge.render as jest.Mock).mock.calls[0];
      const props = renderCall[1]; // Second argument is props
      expect(props.isDismissedForWeight).toBe(true);
    });

    it("passes weightIncrement from settings", async () => {
      plugin.settings.weightIncrement = 5;
      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
      });

      const renderCall = (AchievementBadge.render as jest.Mock).mock.calls[0];
      const props = renderCall[1];
      expect(props.weightIncrement).toBe(5);
    });
  });

  describe("active view integration", () => {
    it("uses current file basename for page link", async () => {
      plugin.app.workspace.getActiveViewOfType.mockReturnValue({
        file: { basename: "My Workout" },
      });

      const container = document.createElement("div");

      await view.createTable(container, [createLog()], {});

      expect(LogCallouts.renderAddLogButton).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.any(String),
        "[[My Workout]]",
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });
  });
});

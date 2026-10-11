/**
 * @jest-environment jsdom
 */
import { CONSTANTS } from "@app/constants";
import { t } from "@app/i18n";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
// Mock Obsidian module first
jest.mock(
  "obsidian",
  () => ({
    Notice: jest.fn(),
    TFile: class MockTFile {},
    MarkdownPostProcessorContext: class MockMarkdownPostProcessorContext {
      addChild = jest.fn();
      sourcePath = "test/path.md";
    },
    MarkdownRenderChild: class MockMarkdownRenderChild {
      constructor(public containerEl: HTMLElement) {}
      onload() {}
      onunload() {}
    },
    Modal: class MockModal {
      constructor(public app: any) {}
      open() {}
      close() {}
    },
    Setting: jest.fn().mockImplementation(() => ({
      setName: jest.fn().mockReturnThis(),
      setDesc: jest.fn().mockReturnThis(),
      addText: jest.fn().mockReturnThis(),
      addToggle: jest.fn().mockReturnThis(),
      addButton: jest.fn().mockReturnThis(),
    })),
    App: class MockApp {},
    Plugin: class MockPlugin {},
  }),
  { virtual: true },
);

// Mock dependent components
jest.mock("@app/components/atoms/Feedback", () => ({
  Feedback: {
    renderError: jest.fn(),
  },
}));

jest.mock("@app/features/modals/log/LogCallouts", () => ({
  LogCallouts: {
    renderCsvNoDataMessage: jest.fn(),
  },
}));

jest.mock("@app/utils/BlockIdMigration", () => ({
  runAddMissingBlockIds: jest.fn(),
}));

jest.mock("@app/orchestration/ErrorCollector", () => ({
  ErrorCollector: {
    logError: jest.fn(),
    getInstance: jest.fn().mockReturnValue({ isEnabled: true }),
  },
}));

jest.mock("@app/i18n", () => ({
  t: jest.fn((key) => key),
}));

import { CodeBlockProcessorService } from "../CodeBlockProcessorService";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { Feedback } from "@app/components/atoms/Feedback";
import { LogCallouts } from "@app/features/modals/log/LogCallouts";
import { MarkdownPostProcessorContext } from "obsidian";
import { runAddMissingBlockIds } from "@app/utils/BlockIdMigration";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";

describe("CodeBlockProcessorService", () => {
  let service: CodeBlockProcessorService;
  let mockPlugin: any;
  let mockDataService: any;
  let mockChartView: any;
  let mockTableView: any;
  let mockDashboardView: any;
  let activeTimers: Map<string, EmbeddedTimerView>;
  let mockMuscleTagService: any;
  let eventBus: WorkoutEventBus;

  beforeEach(() => {
    // Create mocks
    mockPlugin = {
      app: {
        vault: {
          getMarkdownFiles: jest.fn().mockReturnValue([]),
        },
      },
      settings: {
        timerPresets: {},
        defaultTimerPreset: "",
      },
      registerMarkdownCodeBlockProcessor: jest.fn(),
    };
    mockDataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([]),
    };
    mockChartView = {
      createChart: jest.fn().mockResolvedValue(undefined),
      loadChartData: jest.fn().mockResolvedValue([]),
      refreshChart: jest.fn().mockResolvedValue(undefined),
    };
    mockTableView = {
      createTable: jest.fn().mockResolvedValue(undefined),
      refreshTable: jest.fn().mockResolvedValue(undefined),
    };
    mockDashboardView = {
      createDashboard: jest.fn().mockResolvedValue(undefined),
      loadDashboardData: jest.fn().mockResolvedValue([]),
      refreshDashboard: jest.fn().mockResolvedValue(undefined),
    };
    activeTimers = new Map();
    mockMuscleTagService = {
      getTagMap: jest.fn().mockReturnValue(new Map()),
    };
    eventBus = new WorkoutEventBus();

    service = new CodeBlockProcessorService(
      mockPlugin,
      mockDataService,
      mockChartView,
      mockTableView,
      mockDashboardView,
      activeTimers,
      eventBus,
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    eventBus.destroy();
  });

  describe("registerProcessors", () => {
    it("should register all code block processors", () => {
      service.registerProcessors();

      expect(
        mockPlugin.registerMarkdownCodeBlockProcessor,
      ).toHaveBeenCalledTimes(5);
      expect(
        mockPlugin.registerMarkdownCodeBlockProcessor,
      ).toHaveBeenCalledWith(
        CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.CHART,
        expect.any(Function),
      );
      expect(
        mockPlugin.registerMarkdownCodeBlockProcessor,
      ).toHaveBeenCalledWith(
        CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TABLE,
        expect.any(Function),
      );
      expect(
        mockPlugin.registerMarkdownCodeBlockProcessor,
      ).toHaveBeenCalledWith(
        CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TIMER,
        expect.any(Function),
      );
      expect(
        mockPlugin.registerMarkdownCodeBlockProcessor,
      ).toHaveBeenCalledWith(
        CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DASHBOARD,
        expect.any(Function),
      );
      expect(
        mockPlugin.registerMarkdownCodeBlockProcessor,
      ).toHaveBeenCalledWith(
        CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DURATION,
        expect.any(Function),
      );
    });

    it("should invoke chart callback when registered processor is called", async () => {
      service.registerProcessors();

      // Find the chart callback
      const chartCall =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          (call: [string, Function]) =>
            call[0] === CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.CHART,
        );
      const chartCallback = chartCall[1];

      mockChartView.loadChartData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = { addChild: jest.fn(), sourcePath: "test.md" };

      await chartCallback("type: volume", el, ctx);

      expect(mockChartView.createChart).toHaveBeenCalled();
    });

    it("should invoke table callback when registered processor is called", async () => {
      service.registerProcessors();

      const tableCall =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          (call: [string, Function]) =>
            call[0] === CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TABLE,
        );
      const tableCallback = tableCall[1];

      mockDataService.getWorkoutLogData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = { addChild: jest.fn(), sourcePath: "test.md" };

      await tableCallback("limit: 10", el, ctx);

      expect(mockTableView.createTable).toHaveBeenCalled();
    });

    it("should invoke timer callback when registered processor is called", async () => {
      service.registerProcessors();

      const timerCall =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          (call: [string, Function]) =>
            call[0] === CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TIMER,
        );
      const timerCallback = timerCall[1];

      const el = document.createElement("div");
      const ctx = { addChild: jest.fn(), sourcePath: "test.md" };

      await timerCallback("duration: 60", el, ctx);

      expect(ctx.addChild).toHaveBeenCalled();
    });

    it("should invoke dashboard callback when registered processor is called", async () => {
      service.registerProcessors();

      const dashboardCall =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          (call: [string, Function]) =>
            call[0] === CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DASHBOARD,
        );
      const dashboardCallback = dashboardCall[1];

      mockDashboardView.loadDashboardData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = { addChild: jest.fn(), sourcePath: "test.md" };

      await dashboardCallback("", el, ctx);

      expect(mockDashboardView.createDashboard).toHaveBeenCalled();
    });

    it("should invoke duration callback when registered processor is called", async () => {
      service.registerProcessors();

      const durationCall =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          (call: [string, Function]) =>
            call[0] === CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DURATION,
        );
      const durationCallback = durationCall[1];

      const el = document.createElement("div");
      const ctx = { addChild: jest.fn(), sourcePath: "test.md" };

      (service as any).embeddedDurationView = {
        createDurationEstimator: jest
          .fn()
          .mockResolvedValue(undefined),
      };

      await durationCallback("", el, ctx);

      expect(
        (service as any).embeddedDurationView.createDurationEstimator,
      ).toHaveBeenCalled();
    });
  });

  describe("handleWorkoutChart", () => {
    it("should render error if data loading fails", async () => {
      mockChartView.loadChartData.mockRejectedValue(
        new Error("Data Error"),
      );
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining("Data Error"),
      );
    });

    it("should handle non-Error exceptions", async () => {
      mockChartView.loadChartData.mockRejectedValue("string error");
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining("string error"),
      );
    });

    it("should render no data message if loadChartData returns empty", async () => {
      mockChartView.loadChartData.mockResolvedValue([]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("source", el, ctx);

      expect(LogCallouts.renderCsvNoDataMessage).toHaveBeenCalledWith(
        el,
        mockPlugin,
        undefined,
        "[[path]]",
      );
    });

    it("should create chart when data exists", async () => {
      mockChartView.loadChartData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart(
        "type: volume",
        el,
        ctx,
      );

      expect(mockChartView.createChart).toHaveBeenCalled();
    });

    it("should pass params to loadChartData", async () => {
      mockChartView.loadChartData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart(
        "exercise: Bench Press",
        el,
        ctx,
      );

      expect(mockChartView.loadChartData).toHaveBeenCalledWith(
        expect.objectContaining({
          exercise: "Bench Press",
        }),
      );
    });
  });

  describe("handleWorkoutLog", () => {
    it("should render error if creation fails", async () => {
      mockDataService.getWorkoutLogData.mockRejectedValue(
        new Error("Table Error"),
      );
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining("Table Error"),
        expect.any(Object),
      );
    });

    it("shows invalid parameters instead of the table", async () => {
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog("sortOrder: up", el, ctx);

      expect(mockTableView.createTable).not.toHaveBeenCalled();
      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining(t("codeBlocks.validation.title")),
      );
    });

    it("gives the table its parameters with the defaults filled in", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog(
        "exercise: Squat\nlimit: 10",
        el,
        ctx,
      );

      expect(mockTableView.createTable.mock.calls[0][2]).toEqual({
        ...tableBlock.defaults,
        exercise: "Squat",
        limit: 10,
      });
    });

    it("should create table with data", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog("limit: 10", el, ctx);

      expect(mockTableView.createTable).toHaveBeenCalled();
    });

    it("should call getWorkoutLogData without params when no exercise/workout filter", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      // No exercise or workout param - just limit
      await (service as any).handleWorkoutLog("limit: 10", el, ctx);

      // Should be called without filter params
      expect(
        mockDataService.getWorkoutLogData,
      ).toHaveBeenCalledWith();
      expect(mockTableView.createTable).toHaveBeenCalled();
    });

    it("should load raw data and pass exercise params to table view", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog(
        "exercise: Squat",
        el,
        ctx,
      );

      expect(
        mockDataService.getWorkoutLogData,
      ).toHaveBeenCalledWith();
      expect(mockTableView.createTable).toHaveBeenCalledWith(
        el,
        [{ date: "2023-01-01" }],
        expect.objectContaining({
          exercise: "Squat",
        }),
        expect.any(String),
      );
    });

    it("should load raw data and pass workout params to table view", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog(
        "workout: Push Day",
        el,
        ctx,
      );

      expect(
        mockDataService.getWorkoutLogData,
      ).toHaveBeenCalledWith();
      expect(mockTableView.createTable).toHaveBeenCalledWith(
        el,
        [{ date: "2023-01-01" }],
        expect.objectContaining({
          workout: "Push Day",
        }),
        expect.any(String),
      );
    });

    it("should handle non-Error exceptions", async () => {
      mockDataService.getWorkoutLogData.mockRejectedValue(
        "string error",
      );
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining("string error"),
        expect.any(Object),
      );
    });

    it("should handle null return from getWorkoutLogData with filter", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue(null);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog(
        "exercise: Squat",
        el,
        ctx,
      );

      expect(mockTableView.createTable).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        [],
        expect.any(Object),
        "[[path]]",
      );
    });

    it("should handle null return from getWorkoutLogData without filter", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue(null);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      // No exercise or workout filter - just limit
      await (service as any).handleWorkoutLog("limit: 10", el, ctx);

      expect(mockTableView.createTable).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        [],
        expect.any(Object),
        "[[path]]",
      );
    });
  });

  describe("handleWorkoutDashboard", () => {
    it("should pass params to loadDashboardData", async () => {
      mockDashboardView.loadDashboardData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard(
        "dateRange: 30",
        el,
        ctx,
      );

      expect(
        mockDashboardView.loadDashboardData,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ dateRange: 30 }),
      );
      expect(mockDashboardView.createDashboard).toHaveBeenCalled();
    });

    it("should show no data message if loadDashboardData returns empty", async () => {
      mockDashboardView.loadDashboardData.mockResolvedValue([]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard(
        "dateRange: 30",
        el,
        ctx,
      );

      expect(LogCallouts.renderCsvNoDataMessage).toHaveBeenCalled();
      expect(
        mockDashboardView.createDashboard,
      ).not.toHaveBeenCalled();
    });

    it("should catch errors", async () => {
      mockDashboardView.loadDashboardData.mockRejectedValue(
        new Error("Dashboard Fail"),
      );
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalled();
    });

    it("should handle non-Error exceptions", async () => {
      mockDashboardView.loadDashboardData.mockRejectedValue(
        "string error",
      );
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining("string error"),
        expect.any(Object),
      );
    });

    it("should use EventAwareRenderChild with muscleTagsAware for dashboard", async () => {
      mockDashboardView.loadDashboardData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard("", el, ctx);

      expect(ctx.addChild).toHaveBeenCalled();
    });
  });

  describe("handleWorkoutTimer", () => {
    it("should create timer without running migration when id is missing", async () => {
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer(
        "duration: 60",
        el,
        ctx,
      );

      expect(runAddMissingBlockIds).not.toHaveBeenCalled();
      expect(ctx.addChild).toHaveBeenCalled();
    });

    it("should NOT trigger migration if id is present", async () => {
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer(
        "id: timer123\nduration: 60",
        el,
        ctx,
      );

      expect(runAddMissingBlockIds).not.toHaveBeenCalled();
    });

    it("should create timer and register child", async () => {
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer(
        "duration: 60",
        el,
        ctx,
      );

      expect(ctx.addChild).toHaveBeenCalled();
      expect(activeTimers.size).toBe(1);
    });

    it("should catch errors", async () => {
      const parse = jest.spyOn(timerBlock, "parse").mockImplementation(() => {
        throw new Error("Timer Fail");
      });

      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalled();

      parse.mockRestore();
    });

    it("should remove timer from activeTimers when child is unloaded", async () => {
      const el = document.createElement("div");
      let registeredChild: any = null;
      const ctx = {
        addChild: jest.fn((child) => {
          registeredChild = child;
        }),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer(
        "duration: 60",
        el,
        ctx,
      );

      expect(activeTimers.size).toBe(1);
      const timerId = Array.from(activeTimers.keys())[0];

      // Call onunload on the registered child
      registeredChild.onunload();

      expect(activeTimers.has(timerId)).toBe(false);
      expect(activeTimers.size).toBe(0);
    });

    it("should call destroy on timerView when unloaded", async () => {
      const el = document.createElement("div");
      let registeredChild: any = null;
      const ctx = {
        addChild: jest.fn((child) => {
          registeredChild = child;
        }),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer(
        "duration: 60",
        el,
        ctx,
      );

      // Get the timer view from activeTimers
      const timerId = Array.from(activeTimers.keys())[0];
      const timerView = activeTimers.get(timerId);
      const destroySpy = jest.spyOn(timerView as any, "destroy");

      registeredChild.onunload();

      expect(destroySpy).toHaveBeenCalled();
    });

    it("should handle non-Error exceptions", async () => {
      const parse = jest.spyOn(timerBlock, "parse").mockImplementation(() => {
        throw "string error";
      });

      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining("string error"),
        expect.any(Object),
      );

      parse.mockRestore();
    });

    it("should handle unload when timer already removed from activeTimers", async () => {
      const el = document.createElement("div");
      let registeredChild: any = null;
      const ctx = {
        addChild: jest.fn((child) => {
          registeredChild = child;
        }),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer(
        "duration: 60",
        el,
        ctx,
      );

      // Manually clear activeTimers before unload
      activeTimers.clear();

      // Should not throw when timer is not in activeTimers
      expect(() => registeredChild.onunload()).not.toThrow();
    });
  });

  describe("handleWorkoutDuration", () => {
    it("should create duration estimator", async () => {
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      // Mock internal view
      (service as any).embeddedDurationView = {
        createDurationEstimator: jest
          .fn()
          .mockResolvedValue(undefined),
      };

      await (service as any).handleWorkoutDuration("source", el, ctx);

      expect(
        (service as any).embeddedDurationView.createDurationEstimator,
      ).toHaveBeenCalled();
    });

    it("should catch errors", async () => {
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;
      (service as any).embeddedDurationView = {
        createDurationEstimator: jest
          .fn()
          .mockRejectedValue(new Error("Duration Fail")),
      };

      await (service as any).handleWorkoutDuration("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalled();
    });

    it("should handle non-Error exceptions", async () => {
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;
      (service as any).embeddedDurationView = {
        createDurationEstimator: jest
          .fn()
          .mockRejectedValue("string error"),
      };

      await (service as any).handleWorkoutDuration("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining("string error"),
        expect.any(Object),
      );
    });
  });
});

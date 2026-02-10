/**
 * @jest-environment jsdom
 */
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

jest.mock("@app/components/molecules/LogCallouts", () => ({
  LogCallouts: {
    renderCsvNoDataMessage: jest.fn(),
  },
}));

import { CodeBlockProcessorService } from "../CodeBlockProcessorService";
import { EmbeddedTimerView } from "@app/features/timer";
import { Feedback } from "@app/components/atoms/Feedback";
import { LogCallouts } from "@app/components/molecules/LogCallouts";
import { MarkdownPostProcessorContext } from "obsidian";
import { CONSTANTS } from "@app/constants";

describe("CodeBlockProcessorService", () => {
  let service: CodeBlockProcessorService;
  let mockPlugin: any;
  let mockDataService: any;
  let mockChartView: any;
  let mockTableView: any;
  let mockDashboardView: any;
  let activeTimers: Map<string, EmbeddedTimerView>;
  let mockMuscleTagService: any;

  beforeEach(() => {
    // Create mocks
    mockPlugin = {
      registerMarkdownCodeBlockProcessor: jest.fn(),
    };
    mockDataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([]),
    };
    mockChartView = {
      createChart: jest.fn().mockResolvedValue(undefined),
    };
    mockTableView = {
      createTable: jest.fn().mockResolvedValue(undefined),
    };
    mockDashboardView = {
      createDashboard: jest.fn().mockResolvedValue(undefined),
    };
    activeTimers = new Map();
    mockMuscleTagService = {
      getTagMap: jest.fn().mockReturnValue(new Map()),
    };

    service = new CodeBlockProcessorService(
      mockPlugin,
      mockDataService,
      mockChartView,
      mockTableView,
      mockDashboardView,
      activeTimers,
    );

    jest.clearAllMocks();
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

      mockDataService.getWorkoutLogData.mockResolvedValue([
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

    it("should invoke timer callback when registered processor is called", () => {
      service.registerProcessors();

      const timerCall =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          (call: [string, Function]) =>
            call[0] === CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TIMER,
        );
      const timerCallback = timerCall[1];

      const el = document.createElement("div");
      const ctx = { addChild: jest.fn(), sourcePath: "test.md" };

      timerCallback("duration: 60", el, ctx);

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

      mockDataService.getWorkoutLogData.mockResolvedValue([
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
        createDurationEstimator: jest.fn().mockResolvedValue(undefined),
      };

      await durationCallback("", el, ctx);

      expect(
        (service as any).embeddedDurationView.createDurationEstimator,
      ).toHaveBeenCalled();
    });
  });

  describe("handleWorkoutChart", () => {
    it("should render error if data loading fails", async () => {
      mockDataService.getWorkoutLogData.mockRejectedValue(
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
      mockDataService.getWorkoutLogData.mockRejectedValue("string error");
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

    it("should handle null return from getWorkoutLogData with filter", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue(null);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("exercise: Squat", el, ctx);

      expect(LogCallouts.renderCsvNoDataMessage).toHaveBeenCalled();
    });

    it("should handle null return from getWorkoutLogData without filter", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue(null);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("type: volume", el, ctx);

      expect(LogCallouts.renderCsvNoDataMessage).toHaveBeenCalled();
    });

    it("should render no data message if logs are empty", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([]);
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
        undefined,
        "[[path]]",
      );
    });

    it("should create chart when data exists", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("type: volume", el, ctx);

      expect(mockChartView.createChart).toHaveBeenCalled();
    });

    it("should pass filter params to data service", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([
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

      expect(mockDataService.getWorkoutLogData).toHaveBeenCalledWith(
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
      expect(mockDataService.getWorkoutLogData).toHaveBeenCalledWith();
      expect(mockTableView.createTable).toHaveBeenCalled();
    });

    it("should pass exercise filter to getWorkoutLogData", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog("exercise: Squat", el, ctx);

      expect(mockDataService.getWorkoutLogData).toHaveBeenCalledWith(
        expect.objectContaining({
          exercise: "Squat",
        }),
      );
    });

    it("should pass workout filter to getWorkoutLogData", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([
        { date: "2023-01-01" },
      ]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog("workout: Push Day", el, ctx);

      expect(mockDataService.getWorkoutLogData).toHaveBeenCalledWith(
        expect.objectContaining({
          workout: "Push Day",
        }),
      );
    });

    it("should handle non-Error exceptions", async () => {
      mockDataService.getWorkoutLogData.mockRejectedValue("string error");
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

      await (service as any).handleWorkoutLog("exercise: Squat", el, ctx);

      expect(mockTableView.createTable).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        [],
        expect.any(Object),
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
      );
    });
  });

  describe("handleWorkoutDashboard", () => {
    it("should filter data by date range if provided", async () => {
      const today = new Date();
      const oldDate = new Date();
      oldDate.setDate(today.getDate() - 100);

      const data = [
        { date: today.toISOString().split("T")[0] },
        { date: oldDate.toISOString().split("T")[0] },
      ];
      mockDataService.getWorkoutLogData.mockResolvedValue(data);

      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      // dateRange: 30 should exclude the old date
      await (service as any).handleWorkoutDashboard("dateRange: 30", el, ctx);

      expect(mockDashboardView.createDashboard).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.arrayContaining([data[0]]), // Should contain today
        expect.any(Object),
      );

      // Verify we passed filtered data (length 1)
      const callArgs = mockDashboardView.createDashboard.mock.calls[0];
      expect(callArgs[1].length).toBe(1);
    });

    it("should show no data message if filtered data is empty", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue([]);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard("dateRange: 30", el, ctx);

      expect(LogCallouts.renderCsvNoDataMessage).toHaveBeenCalled();
      expect(mockDashboardView.createDashboard).not.toHaveBeenCalled();
    });

    it("should catch errors", async () => {
      mockDataService.getWorkoutLogData.mockRejectedValue(
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
      mockDataService.getWorkoutLogData.mockRejectedValue("string error");
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

    it("should handle null return from getWorkoutLogData with dateRange", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue(null);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard("dateRange: 30", el, ctx);

      expect(LogCallouts.renderCsvNoDataMessage).toHaveBeenCalled();
    });

    it("should handle null return from getWorkoutLogData without dateRange", async () => {
      mockDataService.getWorkoutLogData.mockResolvedValue(null);
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard("", el, ctx);

      expect(LogCallouts.renderCsvNoDataMessage).toHaveBeenCalled();
    });
  });

  describe("handleWorkoutTimer", () => {
    it("should create timer and register child", () => {
      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      (service as any).handleWorkoutTimer("duration: 60", el, ctx);

      expect(ctx.addChild).toHaveBeenCalled();
      expect(activeTimers.size).toBe(1);
    });

    it("should catch errors", () => {
      // Mock parser to throw
      const originalParse = (service as any).parseCodeBlockParams;
      (service as any).parseCodeBlockParams = () => {
        throw new Error("Timer Fail");
      };

      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      (service as any).handleWorkoutTimer("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalled();

      // Restore
      (service as any).parseCodeBlockParams = originalParse;
    });

    it("should remove timer from activeTimers when child is unloaded", () => {
      const el = document.createElement("div");
      let registeredChild: any = null;
      const ctx = {
        addChild: jest.fn((child) => {
          registeredChild = child;
        }),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      (service as any).handleWorkoutTimer("duration: 60", el, ctx);

      expect(activeTimers.size).toBe(1);
      const timerId = Array.from(activeTimers.keys())[0];

      // Call onunload on the registered child
      registeredChild.onunload();

      expect(activeTimers.has(timerId)).toBe(false);
      expect(activeTimers.size).toBe(0);
    });

    it("should call destroy on timerView when unloaded", () => {
      const el = document.createElement("div");
      let registeredChild: any = null;
      const ctx = {
        addChild: jest.fn((child) => {
          registeredChild = child;
        }),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      (service as any).handleWorkoutTimer("duration: 60", el, ctx);

      // Get the timer view from activeTimers
      const timerId = Array.from(activeTimers.keys())[0];
      const timerView = activeTimers.get(timerId);
      const destroySpy = jest.spyOn(timerView as any, "destroy");

      registeredChild.onunload();

      expect(destroySpy).toHaveBeenCalled();
    });

    it("should handle non-Error exceptions", () => {
      const originalParse = (service as any).parseCodeBlockParams;
      (service as any).parseCodeBlockParams = () => {
        throw "string error";
      };

      const el = document.createElement("div");
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      (service as any).handleWorkoutTimer("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining("string error"),
        expect.any(Object),
      );

      (service as any).parseCodeBlockParams = originalParse;
    });

    it("should handle unload when timer already removed from activeTimers", () => {
      const el = document.createElement("div");
      let registeredChild: any = null;
      const ctx = {
        addChild: jest.fn((child) => {
          registeredChild = child;
        }),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      (service as any).handleWorkoutTimer("duration: 60", el, ctx);

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
        createDurationEstimator: jest.fn().mockResolvedValue(undefined),
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
        createDurationEstimator: jest.fn().mockRejectedValue("string error"),
      };

      await (service as any).handleWorkoutDuration("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        el,
        expect.stringContaining("string error"),
        expect.any(Object),
      );
    });
  });

  describe("parseCodeBlockParams", () => {
    it("should parse valid number parameters correctly", () => {
      const source = "duration: 60\nreps: 10";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.duration).toBe(60);
      expect(result.reps).toBe(10);
    });

    it("should parse zero as a valid number", () => {
      const source = "duration: 0\nweight: 0";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.duration).toBe(0);
      expect(result.weight).toBe(0);
    });

    it("should parse boolean parameters correctly", () => {
      const source = "exactMatch: true\nautoStart: false";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exactMatch).toBe(true);
      expect(result.autoStart).toBe(false);
    });

    it("should treat empty string as string, not convert to 0", () => {
      const source = "exercise: \nworkout: ";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("");
      expect(result.workout).toBe("");
      expect(typeof result.exercise).toBe("string");
      expect(typeof result.workout).toBe("string");
    });

    it("should treat whitespace-only values as strings", () => {
      const source = "exercise:   \nworkout:  \t ";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("");
      expect(result.workout).toBe("");
    });

    it("should parse string parameters correctly", () => {
      const source = "exercise: Bench Press\nworkout: Push Day";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Bench Press");
      expect(result.workout).toBe("Push Day");
      expect(typeof result.exercise).toBe("string");
      expect(typeof result.workout).toBe("string");
    });

    it("should handle negative numbers correctly", () => {
      const source = "offset: -5\nvalue: -10.5";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.offset).toBe(-5);
      expect(result.value).toBe(-10.5);
    });

    it("should handle decimal numbers correctly", () => {
      const source = "weight: 72.5\nduration: 90.25";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.weight).toBe(72.5);
      expect(result.duration).toBe(90.25);
    });

    it("should ignore lines starting with #", () => {
      const source = "# This is a comment\nexercise: Squat\n# Another comment";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Squat");
      expect(Object.keys(result).length).toBe(1);
    });

    it("should ignore empty lines", () => {
      const source = "\n\nexercise: Deadlift\n\n\nreps: 5\n\n";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Deadlift");
      expect(result.reps).toBe(5);
      expect(Object.keys(result).length).toBe(2);
    });

    it("should handle lines without colons gracefully", () => {
      const source = "exercise: Squat\ninvalid line without colon\nreps: 5";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Squat");
      expect(result.reps).toBe(5);
      expect(Object.keys(result).length).toBe(2);
    });

    it("should handle mixed parameter types", () => {
      const source = `exercise: Bench Press
duration: 60
autoStart: true
weight: 100.5
exactMatch: false
workout: `;
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Bench Press");
      expect(result.duration).toBe(60);
      expect(result.autoStart).toBe(true);
      expect(result.weight).toBe(100.5);
      expect(result.exactMatch).toBe(false);
      expect(result.workout).toBe("");
      expect(typeof result.workout).toBe("string");
    });

    it("should handle values with multiple words after colon", () => {
      const source =
        "exercise: Barbell Bench Press Heavy\nworkout: Monday Push Day";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Barbell Bench Press Heavy");
      expect(result.workout).toBe("Monday Push Day");
    });

    it("should handle scientific notation numbers", () => {
      const source = "value: 1e3\nsmall: 1e-2";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.value).toBe(1000);
      expect(result.small).toBe(0.01);
    });

    it("should parse array syntax with single value", () => {
      const source = "protocol: [drop_set]";
      const result = (service as any).parseCodeBlockParams(source);

      expect(Array.isArray(result.protocol)).toBe(true);
      expect(result.protocol).toEqual(["drop_set"]);
    });

    it("should parse array syntax with multiple values", () => {
      const source = "protocol: [drop_set, myo_reps, rest_pause]";
      const result = (service as any).parseCodeBlockParams(source);

      expect(Array.isArray(result.protocol)).toBe(true);
      expect(result.protocol).toEqual(["drop_set", "myo_reps", "rest_pause"]);
    });

    it("should trim whitespace from array values", () => {
      const source = "protocol: [  drop_set  ,   myo_reps   ]";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.protocol).toEqual(["drop_set", "myo_reps"]);
    });

    it("should filter out empty array values", () => {
      const source = "protocol: [drop_set, , myo_reps, ]";
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.protocol).toEqual(["drop_set", "myo_reps"]);
    });

    it("should handle empty array", () => {
      const source = "protocol: []";
      const result = (service as any).parseCodeBlockParams(source);

      expect(Array.isArray(result.protocol)).toBe(true);
      expect(result.protocol).toEqual([]);
    });

    it("should parse string value when not using array syntax", () => {
      const source = "protocol: drop_set";
      const result = (service as any).parseCodeBlockParams(source);

      expect(typeof result.protocol).toBe("string");
      expect(result.protocol).toBe("drop_set");
    });

    it("should handle mixed array and non-array parameters", () => {
      const source = `exercise: Squat
protocol: [drop_set, myo_reps]
exactMatch: true
limit: 10`;
      const result = (service as any).parseCodeBlockParams(source);

      expect(result.exercise).toBe("Squat");
      expect(Array.isArray(result.protocol)).toBe(true);
      expect(result.protocol).toEqual(["drop_set", "myo_reps"]);
      expect(result.exactMatch).toBe(true);
      expect(result.limit).toBe(10);
    });
  });
});

/**
 * @jest-environment jsdom
 */
import { CONSTANTS } from "@app/constants";
import { t } from "@app/i18n";
import { tableBlock } from "@app/features/tables/tableBlock";
// Mock Obsidian module first
jest.mock(
  "obsidian",
  () => ({
    Notice: jest.fn(),
    setIcon: jest.fn(),
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

jest.mock("@app/i18n", () => ({
  t: jest.fn((key, params) =>
    params ? `${key} ${JSON.stringify(params)}` : key,
  ),
}));

import { CodeBlockProcessorService } from "../CodeBlockProcessorService";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { Feedback } from "@app/components/atoms/Feedback";
import { MarkdownPostProcessorContext } from "obsidian";
import { runAddMissingBlockIds } from "@app/utils/BlockIdMigration";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { EventAwareRenderChild } from "@app/services/core/EventAwareRenderChild";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

/** The element a view draws into: the block's second child, after the menu row */
const blockBody = (el: HTMLElement) => el.children[1];

describe("CodeBlockProcessorService", () => {
  let service: CodeBlockProcessorService;
  let mockPlugin: any;
  let mockChartView: any;
  let mockTableView: any;
  let mockDashboardView: any;
  let mockSessionView: any;
  let mockSetsView: any;
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
    mockChartView = {
      render: jest.fn().mockResolvedValue(undefined),
    };
    mockTableView = {
      refreshTable: jest.fn().mockResolvedValue(undefined),
    };
    mockDashboardView = {
      render: jest.fn().mockResolvedValue(undefined),
    };
    mockSessionView = {
      createSession: jest.fn().mockReturnValue({}),
    };
    mockSetsView = {
      createSets: jest.fn().mockReturnValue({
        render: jest.fn().mockResolvedValue(undefined),
      }),
    };
    activeTimers = new Map();
    mockMuscleTagService = {
      getTagMap: jest.fn().mockReturnValue(new Map()),
    };
    eventBus = new WorkoutEventBus();

    service = new CodeBlockProcessorService(
      mockPlugin,
      mockChartView,
      mockTableView,
      mockDashboardView,
      activeTimers,
      eventBus,
      mockSessionView,
      mockSetsView,
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
      ).toHaveBeenCalledTimes(7);
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
      const el = createObsidianContainer();
      const ctx = { addChild: jest.fn(), sourcePath: "test.md" };

      await chartCallback("type: volume", el, ctx);

      expect(mockChartView.render).toHaveBeenCalled();
    });

    it("should invoke table callback when registered processor is called", async () => {
      service.registerProcessors();

      const tableCall =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          (call: [string, Function]) =>
            call[0] === CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TABLE,
        );
      const tableCallback = tableCall[1];
      const el = createObsidianContainer();
      const ctx = { addChild: jest.fn(), sourcePath: "test.md" };

      await tableCallback("limit: 10", el, ctx);

      expect(mockTableView.refreshTable).toHaveBeenCalled();
    });

    it("should invoke timer callback when registered processor is called", async () => {
      service.registerProcessors();

      const timerCall =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          (call: [string, Function]) =>
            call[0] === CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TIMER,
        );
      const timerCallback = timerCall[1];

      const el = createObsidianContainer();
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
      const el = createObsidianContainer();
      const ctx = { addChild: jest.fn(), sourcePath: "test.md" };

      await dashboardCallback("", el, ctx);

      expect(mockDashboardView.render).toHaveBeenCalled();
    });

    it("should invoke duration callback when registered processor is called", async () => {
      service.registerProcessors();

      const durationCall =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          (call: [string, Function]) =>
            call[0] === CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DURATION,
        );
      const durationCallback = durationCall[1];

      const el = createObsidianContainer();
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
      mockChartView.render.mockRejectedValue(
        new Error("Data Error"),
      );
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        blockBody(el),
        `codeBlocks.loadError.chart ${JSON.stringify({ error: "Data Error" })}`,
        expect.any(Object),
      );
    });

    it("should handle non-Error exceptions", async () => {
      mockChartView.render.mockRejectedValue("string error");
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        blockBody(el),
        expect.stringContaining("string error"),
        expect.any(Object),
      );
    });

    it("draws the chart with its parameters and note", async () => {
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("exercise: Bench Press", el, ctx);

      expect(mockChartView.render).toHaveBeenCalledWith(
        blockBody(el),
        expect.objectContaining({ exercise: "Bench Press" }),
        "test/path.md",
      );
    });

    it("redraws on log changes, also when the log was empty", async () => {
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutChart("type: volume", el, ctx);

      expect(ctx.addChild).toHaveBeenCalledWith(expect.any(EventAwareRenderChild));
    });

    describe("edit menu", () => {
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;
      const hasMenu = (el: HTMLElement) =>
        el.querySelector(".workout-block-actions .workout-icon-dropdown") !==
        null;

      it("is drawn above a chart with data", async () => {
        const el = createObsidianContainer();
        await (service as any).handleWorkoutChart("type: volume", el, ctx);
        expect(hasMenu(el)).toBe(true);
      });

      it("is drawn when the log has no data", async () => {
        const el = createObsidianContainer();
        await (service as any).handleWorkoutChart("type: volume", el, ctx);
        expect(hasMenu(el)).toBe(true);
      });

      it("is drawn when loading fails", async () => {
        mockChartView.render.mockRejectedValue(new Error("boom"));
        const el = createObsidianContainer();
        await (service as any).handleWorkoutChart("type: volume", el, ctx);
        expect(hasMenu(el)).toBe(true);
      });

      it("is drawn when the parameters are invalid", async () => {
        const el = createObsidianContainer();
        await (service as any).handleWorkoutChart("dateRange: soon", el, ctx);
        expect(mockChartView.render).not.toHaveBeenCalled();
        expect(hasMenu(el)).toBe(true);
      });
    });
  });

  describe("edit menu when the view draws none", () => {
    const ctx = {
      addChild: jest.fn(),
      sourcePath: "test/path.md",
    } as unknown as MarkdownPostProcessorContext;
    const menus = (el: HTMLElement) =>
      el.querySelectorAll(".workout-block-actions .workout-icon-dropdown")
        .length;

    it("is drawn above a table that fails", async () => {
      mockTableView.refreshTable.mockRejectedValue(new Error("x"));
      const el = createObsidianContainer();
      await (service as any).handleWorkoutLog("exercise: Squat", el, ctx);
      expect(menus(el)).toBe(1);
    });

    it("is drawn above a dashboard with no data", async () => {
      const el = createObsidianContainer();
      await (service as any).handleWorkoutDashboard("", el, ctx);
      expect(menus(el)).toBe(1);
    });

    it("is drawn above a timer with invalid parameters", async () => {
      const el = createObsidianContainer();
      await (service as any).handleWorkoutTimer("rounds: many", el, ctx);
      expect(menus(el)).toBe(1);
    });

    it("is left out when the view drew its own menu", async () => {
      mockTableView.refreshTable.mockImplementation(
        async (body: HTMLElement) => {
          body.createDiv({ cls: "workout-icon-dropdown workout-block-menu" });
        },
      );
      const el = createObsidianContainer();
      await (service as any).handleWorkoutLog("exercise: Squat", el, ctx);
      expect(menus(el)).toBe(0);
    });

    it("is drawn when the view's own menu cannot edit the block", async () => {
      mockTableView.refreshTable.mockImplementation(
        async (body: HTMLElement) => {
          body.createDiv({ cls: "workout-icon-dropdown" });
        },
      );
      const el = createObsidianContainer();
      await (service as any).handleWorkoutLog("exercise: Squat", el, ctx);
      expect(menus(el)).toBe(1);
    });
  });

  describe("handleWorkoutLog", () => {
    it("should render error if loading fails", async () => {
      mockTableView.refreshTable.mockRejectedValue(new Error("Table Error"));
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog("source", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        blockBody(el),
        expect.stringContaining("Table Error"),
        expect.any(Object),
      );
    });

    it("shows invalid parameters instead of the table", async () => {
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog("sortOrder: up", el, ctx);

      expect(mockTableView.refreshTable).not.toHaveBeenCalled();
      expect(Feedback.renderError).toHaveBeenCalledWith(
        blockBody(el),
        expect.stringContaining(t("codeBlocks.validation.title")),
      );
    });

    it("draws the table with its parameters, defaults filled in, and its note", async () => {
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutLog("exercise: Squat\nlimit: 10", el, ctx);

      expect(mockTableView.refreshTable).toHaveBeenCalledWith(
        blockBody(el),
        { ...tableBlock.defaults, exercise: "Squat", limit: 10 },
        "test/path.md",
        expect.objectContaining({ edits: true }),
      );
      expect(ctx.addChild).toHaveBeenCalledWith(expect.any(EventAwareRenderChild));
    });
  });

  describe("handleWorkoutDashboard", () => {
    it("draws the dashboard with its parameters, its place and its edit action", async () => {
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard("dateRange: 30", el, ctx);

      expect(mockDashboardView.render).toHaveBeenCalledWith(
        blockBody(el),
        expect.objectContaining({ dateRange: 30 }),
        expect.objectContaining({
          sourcePath: "test/path.md",
          editAction: expect.objectContaining({ edits: true }),
        }),
      );
    });

    it("should catch errors", async () => {
      mockDashboardView.render.mockRejectedValue(
        new Error("Dashboard Fail"),
      );
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalled();
    });

    it("should handle non-Error exceptions", async () => {
      mockDashboardView.render.mockRejectedValue(
        "string error",
      );
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutDashboard("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        blockBody(el),
        expect.stringContaining("string error"),
        expect.any(Object),
      );
    });

    it("should use EventAwareRenderChild with muscleTagsAware for dashboard", async () => {
      const el = createObsidianContainer();
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
      const el = createObsidianContainer();
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
      const el = createObsidianContainer();
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
      const el = createObsidianContainer();
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
      const create = jest
        .spyOn(service as any, "createEmbeddedTimer")
        .mockImplementation(() => {
          throw new Error("Timer Fail");
        });

      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalled();

      create.mockRestore();
    });

    it("should remove timer from activeTimers when child is unloaded", async () => {
      const el = createObsidianContainer();
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
      const el = createObsidianContainer();
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
      const create = jest
        .spyOn(service as any, "createEmbeddedTimer")
        .mockImplementation(() => {
          throw "string error";
        });

      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "test/path.md",
      } as unknown as MarkdownPostProcessorContext;

      await (service as any).handleWorkoutTimer("", el, ctx);

      expect(Feedback.renderError).toHaveBeenCalledWith(
        blockBody(el),
        expect.stringContaining("string error"),
        expect.any(Object),
      );

      create.mockRestore();
    });

    it("should handle unload when timer already removed from activeTimers", async () => {
      const el = createObsidianContainer();
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

  describe("workout-session", () => {
    it("adds the session of the block's note as a child of the note", () => {
      const el = createObsidianContainer();
      const ctx = {
        addChild: jest.fn(),
        sourcePath: "Workouts/Leg Day.md",
      } as unknown as MarkdownPostProcessorContext;
      service.registerProcessors();
      const [, handler] =
        mockPlugin.registerMarkdownCodeBlockProcessor.mock.calls.find(
          ([type]: [string]) => type === "workout-session",
        );

      handler("", el, ctx);

      expect(mockSessionView.createSession).toHaveBeenCalledWith(
        el,
        "Workouts/Leg Day.md",
      );
      expect(ctx.addChild).toHaveBeenCalledWith(
        mockSessionView.createSession.mock.results[0].value,
      );
    });
  });

  describe("handleWorkoutDuration", () => {
    it("should create duration estimator", async () => {
      const el = createObsidianContainer();
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
  });
});

/** @jest-environment jsdom */

import { EmbeddedDashboardView } from "@app/features/dashboard/views/EmbeddedDashboardView";
import { SummaryWidget } from "@app/features/dashboard/widgets/summary/SummaryWidget";
import { QuickStatsCards } from "@app/features/dashboard/widgets/quick-stats/QuickStatsCards";
import { VolumeAnalytics } from "@app/features/dashboard/widgets/volume-analytics/VolumeAnalytics";
import { RecentWorkouts } from "@app/features/dashboard/widgets/recent-workouts/RecentWorkouts";
import { QuickActions } from "@app/features/dashboard/widgets/quick-actions/QuickActions";
import { MuscleHeatMap } from "@app/features/dashboard/widgets/muscle-heat-map/MuscleHeatMap";
import { ProtocolDistribution } from "@app/features/dashboard/widgets/protocol-distribution/ProtocolDistribution";
import { DashboardActionSelect } from "@app/features/dashboard/ui/DashboardActionSelect";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { t } from "@app/i18n";
import { Platform } from "obsidian";
import type WorkoutChartsPlugin from "main";

function mockWidget(name: string) {
  return { [name]: { render: jest.fn() } };
}
jest.mock(
  "@app/features/dashboard/widgets/summary/SummaryWidget",
  () => mockWidget("SummaryWidget"),
);
jest.mock(
  "@app/features/dashboard/widgets/quick-stats/QuickStatsCards",
  () => mockWidget("QuickStatsCards"),
);
jest.mock(
  "@app/features/dashboard/widgets/volume-analytics/VolumeAnalytics",
  () => mockWidget("VolumeAnalytics"),
);
jest.mock(
  "@app/features/dashboard/widgets/recent-workouts/RecentWorkouts",
  () => mockWidget("RecentWorkouts"),
);
jest.mock(
  "@app/features/dashboard/widgets/quick-actions/QuickActions",
  () => mockWidget("QuickActions"),
);
jest.mock(
  "@app/features/dashboard/widgets/muscle-tags/MuscleTagsWidget",
  () => mockWidget("MuscleTagsWidget"),
);
jest.mock(
  "@app/features/dashboard/widgets/file-errors/WidgetsFileError",
  () => mockWidget("WidgetsFileError"),
);
jest.mock(
  "@app/features/dashboard/widgets/protocol-distribution/ProtocolDistribution",
  () => mockWidget("ProtocolDistribution"),
);
jest.mock(
  "@app/features/dashboard/widgets/protocol-effectiveness/ProtocolEffectiveness",
  () => mockWidget("ProtocolEffectiveness"),
);
jest.mock(
  "@app/features/dashboard/widgets/duration-comparison/DurationComparison",
  () => mockWidget("DurationComparison"),
);
jest.mock(
  "@app/features/dashboard/widgets/muscle-heat-map/MuscleHeatMap",
  () => mockWidget("MuscleHeatMap"),
);

class FakeResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
}

const logs = [
  {
    date: new Date().toISOString(),
    exercise: "Squat",
    reps: 5,
    weight: 100,
    volume: 500,
  },
];

// Everything ever logged; the dashboard is given only its period (`logs`)
const history = [
  {
    ...logs[0],
    date: "2025-01-01T10:00:00.000Z",
    weight: 90,
    volume: 450,
  },
  ...logs,
];

const render = async (params: EmbeddedDashboardParams) => {
  const view = new EmbeddedDashboardView({
    settings: { weeklyGoal: 3 },
    getWorkoutLogData: async () => history,
  } as unknown as WorkoutChartsPlugin);
  await view.createDashboard(createObsidianContainer(), logs, params);
};

describe("EmbeddedDashboardView widget params", () => {
  beforeAll(() => {
    (
      window as unknown as { ResizeObserver: unknown }
    ).ResizeObserver = FakeResizeObserver;
  });

  beforeEach(() => jest.clearAllMocks());

  it("renders every widget by default", async () => {
    await render({});

    for (const w of [
      SummaryWidget,
      QuickStatsCards,
      VolumeAnalytics,
      RecentWorkouts,
      QuickActions,
    ]) {
      expect(w.render).toHaveBeenCalled();
    }
  });

  it("draws only the listed widgets, in the listed order", async () => {
    await render({ widgets: ["volume", "heatMap", "summary"] });

    const order = [VolumeAnalytics, MuscleHeatMap, SummaryWidget].map(
      (w) => (w.render as jest.Mock).mock.invocationCallOrder[0],
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const w of [QuickStatsCards, RecentWorkouts, QuickActions]) {
      expect(w.render).not.toHaveBeenCalled();
    }
  });

  it("gives the summary all history and the weekly goal for its streak", async () => {
    await render({});

    expect(SummaryWidget.render).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      logs,
      expect.any(Object),
      history,
      3,
    );
  });

  it("gives the volume chart a stable per-dashboard chart id", async () => {
    await render({});

    expect(VolumeAnalytics.render).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.any(Array),
      expect.any(Object),
      { chartId: expect.stringMatching(/^volume-analytics-/) },
    );
  });
});

describe("EmbeddedDashboardView bento layout", () => {
  beforeAll(() => {
    (
      window as unknown as { ResizeObserver: unknown }
    ).ResizeObserver = FakeResizeObserver;
  });

  it("gives each widget its row span as a CSS variable, so phones can drop it without !important", async () => {
    const widgets: HTMLElement[] = [];
    (VolumeAnalytics.render as jest.Mock).mockImplementation(
      (container: HTMLElement) => {
        widgets.push(
          container.createDiv({ cls: "workout-dashboard-widget" }),
        );
      },
    );

    await render({});

    expect(widgets).toHaveLength(1);
    expect(
      widgets[0].style.getPropertyValue("--workout-widget-row-end"),
    ).toMatch(/^span \d+$/);
    // An inline grid-row-end would beat the phone layout's `grid-row: auto`
    expect(widgets[0].style.gridRowEnd).toBe("");
  });
});

describe("EmbeddedDashboardView grid layout", () => {
  beforeAll(() => {
    (
      window as unknown as { ResizeObserver: unknown }
    ).ResizeObserver = FakeResizeObserver;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Each mocked widget draws its card, as the real ones do
    for (const w of [
      SummaryWidget,
      RecentWorkouts,
      VolumeAnalytics,
    ]) {
      (w.render as jest.Mock).mockImplementation(
        (grid: HTMLElement) =>
          grid.createDiv({ cls: "workout-dashboard-widget" }),
      );
    }
  });

  afterEach(() => jest.restoreAllMocks());

  /** Renders with the dashboard `width` px wide (jsdom lays nothing out) */
  const renderGrid = async (
    params: EmbeddedDashboardParams,
    width: number,
  ) => {
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ width, height: 0 } as DOMRect);
    const container = createObsidianContainer();
    await new EmbeddedDashboardView({
      settings: {},
      getWorkoutLogData: async () => history,
    } as unknown as WorkoutChartsPlugin).createDashboard(
      container,
      logs,
      params,
    );
    const cell = (cls: string) =>
      [
        ...container.querySelectorAll<HTMLElement>(
          ".workout-dashboard-widget",
        ),
      ]
        .filter((el) => el.dataset.widget === cls)
        .map((el) => [
          el.style.getPropertyValue("--workout-cell-column"),
          el.style.getPropertyValue("--workout-cell-row"),
        ])[0];
    return { container, cell };
  };

  const GRID: EmbeddedDashboardParams = {
    layout: "grid",
    columns: 2,
    "grid.volume": { column: 1, row: 2, width: 2, height: 1 },
    "grid.recentWorkouts": { column: 2, row: 1, width: 1, height: 1 },
    "grid.summary": { column: 1, row: 1, width: 1, height: 1 },
  };

  it("draws only the placed widgets, in reading order, each in its cells", async () => {
    const { container, cell } = await renderGrid(GRID, 900);

    const order = [
      SummaryWidget,
      RecentWorkouts,
      VolumeAnalytics,
    ].map((w) => (w.render as jest.Mock).mock.invocationCallOrder[0]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(QuickStatsCards.render).not.toHaveBeenCalled();
    expect(
      container
        .querySelector<HTMLElement>(".workout-dashboard-grid")!
        .style.getPropertyValue("--workout-grid-columns"),
    ).toBe("2");
    expect(cell("summary")).toEqual(["1 / span 1", "1 / span 1"]);
    expect(cell("recentWorkouts")).toEqual([
      "2 / span 1",
      "1 / span 1",
    ]);
    expect(cell("volume")).toEqual(["1 / span 2", "2 / span 1"]);
  });

  it("stacks the widgets in reading order when only one column fits", async () => {
    const { cell } = await renderGrid(GRID, 300);

    expect(cell("summary")).toEqual(["1 / span 1", "1 / span 1"]);
    expect(cell("recentWorkouts")).toEqual([
      "1 / span 1",
      "2 / span 1",
    ]);
    expect(cell("volume")).toEqual(["1 / span 1", "3 / span 1"]);
  });

  it("stacks the widgets on a phone however wide it is", async () => {
    Platform.isPhone = true;
    try {
      const { cell } = await renderGrid(GRID, 900);
      expect(cell("recentWorkouts")).toEqual(["1 / span 1", "2 / span 1"]);
    } finally {
      Platform.isPhone = false;
    }
  });

  it("says how to place widgets when the grid has none", async () => {
    const { container } = await renderGrid({ layout: "grid" }, 900);

    expect(container.textContent).toContain(t("dashboard.grid.empty"));
  });

  it("shows what is wrong with the grid instead of the widgets", async () => {
    const { container } = await renderGrid(
      {
        ...GRID,
        "grid.summary": { column: 1, row: 1, width: 2, height: 1 },
      },
      900,
    );

    expect(SummaryWidget.render).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      t("dashboard.grid.overlap", {
        widget: t("dashboard.recentWorkouts.title"),
        other: t("dashboard.summary.title"),
      }),
    );
  });
});

describe("EmbeddedDashboardView resize watching", () => {
  it("keeps following the first dashboard's width after a second one renders", async () => {
    const observers: FakeResizeObserver[] = [];
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
      class extends FakeResizeObserver {
        constructor() {
          super();
          observers.push(this);
        }
      };
    const view = new EmbeddedDashboardView({
      settings: {},
      getWorkoutLogData: async () => history,
    } as unknown as WorkoutChartsPlugin);

    await view.createDashboard(createObsidianContainer(), logs, {});
    await view.createDashboard(createObsidianContainer(), logs, {});

    expect(observers).toHaveLength(2);
    expect(observers[0].disconnect).not.toHaveBeenCalled();
  });
});

describe("EmbeddedDashboardView view state", () => {
  beforeAll(() => {
    (
      window as unknown as { ResizeObserver: unknown }
    ).ResizeObserver = FakeResizeObserver;
  });

  afterEach(() => jest.restoreAllMocks());

  it("keeps the block's place for the edit menu after a protocol is picked, apart from the block parameters", async () => {
    const menu = jest.spyOn(DashboardActionSelect, "render");
    const view = new EmbeddedDashboardView({
      settings: {},
      getWorkoutLogData: async () => history,
    } as unknown as WorkoutChartsPlugin);
    const params: EmbeddedDashboardParams = { title: "Stats" };

    await view.createDashboard(
      createObsidianContainer(),
      logs,
      params,
      {
        sourcePath: "Stats.md",
        matchWithoutId: () => ({ body: "title: Stats" }),
      },
    );
    // The options the protocol widget was last drawn with
    const widgetOptions = () =>
      (ProtocolDistribution.render as jest.Mock).mock.calls.at(-1).at(-1) as {
        onFilterChange: (protocol: string | null) => void;
        activeFilter?: string | null;
      };
    widgetOptions().onFilterChange("dropset");
    await new Promise((resolve) => setTimeout(resolve, 0));

    const [, , menuParams, where] = menu.mock.calls.at(-1)!;
    expect(where.sourcePath).toBe("Stats.md");
    expect(where.matchWithoutId?.()).toEqual({ body: "title: Stats" });
    expect(menuParams).toEqual({ title: "Stats" });
    expect(widgetOptions().activeFilter).toBe("dropset");
  });
});

describe("EmbeddedDashboardView render", () => {
  beforeEach(() => jest.clearAllMocks());
  const view = (rows: typeof history) =>
    new EmbeddedDashboardView({
      settings: { weeklyGoal: 3, csvLogFilePath: "log.csv" },
      app: { vault: { getAbstractFileByPath: () => null } },
      getWorkoutLogData: async () => rows,
    } as unknown as WorkoutChartsPlugin);

  it("explains an empty log instead of drawing widgets, without the loading spinner", async () => {
    const container = createObsidianContainer();
    await view([]).render(container, {});

    expect(SummaryWidget.render).not.toHaveBeenCalled();
    expect(container.querySelector(".loading-spinner")).toBeNull();
    expect(container.textContent).not.toBe("");
  });

  it("says no set matches when its filters leave nothing (it used to show 'no data')", async () => {
    const container = createObsidianContainer();
    await view(history).render(container, { exercise: "Bench Press" });

    expect(SummaryWidget.render).not.toHaveBeenCalled();
    expect(container.querySelector(".workout-log-no-match")).not.toBeNull();
  });
});

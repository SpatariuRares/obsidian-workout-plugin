/** @jest-environment jsdom */

import { EmbeddedChartView } from "@app/features/charts/views/EmbeddedChartView";
import { ChartRenderer } from "@app/features/charts/components/ChartRenderer";
import { ChartTypeResolver } from "@app/features/charts/business/ChartTypeResolver";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { attachObsidianHelpers, createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { BlockMenuAction } from "@app/features/common/ui/BlockMenu";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { getDefaultChartTitle } from "@app/features/charts/config/ChartConstants";

jest.mock("@app/features/common/views/BaseView", () => ({
  BaseView: class {
    plugin: unknown;
    constructor(plugin: unknown) {
      this.plugin = plugin;
    }
    filteredOrExplain(_container: HTMLElement, logData: unknown[]) {
      return logData.length ? logData : null;
    }
    showLoadingIndicator(container: HTMLElement) {
      return container.createDiv();
    }
    handleError(container: HTMLElement, error: unknown) {
      container.textContent = String(error);
    }
  },
}));

jest.mock("@app/features/charts/components/ChartRenderer", () => ({
  ChartRenderer: {
    createChartContainer: jest.fn((parent: HTMLElement) =>
      parent.createDiv({ cls: "workout-charts-container" }),
    ),
    renderChart: jest.fn().mockReturnValue(true),
    addTrendLineToDatasets: jest.fn(),
    destroyAllCharts: jest.fn(),
  },
}));

jest.mock("@app/features/charts/business/ChartTypeResolver", () => ({
  ChartTypeResolver: {
    resolve: jest.fn(),
    validate: jest.fn().mockResolvedValue({ isValid: true }),
  },
}));

const set = (date: string, reps: number, weight: number): WorkoutLogData =>
  ({
    date,
    exercise: "Squat",
    reps,
    weight,
    volume: reps * weight,
  }) as WorkoutLogData;

describe("EmbeddedChartView", () => {
  const editAction: BlockMenuAction = {
    label: "Edit chart",
    icon: "pencil",
    edits: true,
    run: jest.fn(),
  };

  const draw = async (
    params: Record<string, unknown>,
    logData = [set("2026-10-01", 5, 100), set("2026-10-03", 5, 110)],
  ) => {
    attachObsidianHelpers(document.body);
    (ChartTypeResolver.resolve as jest.Mock).mockResolvedValue(CHART_DATA_TYPE.VOLUME);
    const plugin = {
      getWorkoutLogData: jest.fn().mockResolvedValue(logData),
    } as unknown as WorkoutPluginContext;
    const container = createObsidianContainer();
    await new EmbeddedChartView(plugin).render(container, params, "note.md", editAction);
    return container;
  };

  beforeEach(() => jest.clearAllMocks());

  it("draws one card: title, menu, trend, chart and stats", async () => {
    const container = await draw({ exercise: "Squat" });

    const card = container.querySelector(".workout-block-card.workout-chart");
    expect(card).not.toBeNull();
    expect(card?.querySelector(".workout-block-title")?.textContent).toBe("Squat");
    expect(card?.querySelector(".workout-block-header .workout-block-menu")).not.toBeNull();
    expect(card?.querySelector(".workout-chart-trend")).not.toBeNull();
    expect(card?.querySelector(".workout-charts-container")).not.toBeNull();
    expect(card?.querySelector(".workout-charts-stats")).not.toBeNull();
  });

  it("lets the card name the chart, so the canvas draws no title", async () => {
    await draw({ exercise: "Squat" });

    expect(ChartRenderer.renderChart).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      { showTitle: false },
    );
  });

  it("titles a chart without exercise or title with the chart's default", async () => {
    const container = await draw({});

    expect(container.querySelector(".workout-block-title")?.textContent).toBe(
      getDefaultChartTitle(CHART_DATA_TYPE.VOLUME),
    );
    expect(container.querySelector(".workout-block-meta")).toBeNull();
  });

  it("leaves trend and stats out when the block hides them", async () => {
    const container = await draw({ exercise: "Squat", showTrend: false, showStats: false });

    expect(container.querySelector(".workout-chart-trend")).toBeNull();
    expect(container.querySelector(".workout-charts-stats")).toBeNull();
  });

  it("draws no card when there is nothing to chart", async () => {
    const container = await draw({ exercise: "Squat" }, []);

    expect(container.querySelector(".workout-block-card")).toBeNull();
  });
});

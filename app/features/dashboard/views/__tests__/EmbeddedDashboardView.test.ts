/** @jest-environment jsdom */

import { EmbeddedDashboardView } from "@app/features/dashboard/views/EmbeddedDashboardView";
import { SummaryWidget } from "@app/features/dashboard/widgets/summary/SummaryWidget";
import { QuickStatsCards } from "@app/features/dashboard/widgets/quick-stats/QuickStatsCards";
import { VolumeAnalytics } from "@app/features/dashboard/widgets/volume-analytics/VolumeAnalytics";
import { RecentWorkouts } from "@app/features/dashboard/widgets/recent-workouts/RecentWorkouts";
import { QuickActions } from "@app/features/dashboard/widgets/quick-actions/QuickActions";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
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

const render = async (params: EmbeddedDashboardParams) => {
  const view = new EmbeddedDashboardView({
    settings: {},
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

  it("renders every optional widget by default", async () => {
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

  it.each([
    ["showSummary", SummaryWidget],
    ["showQuickStats", QuickStatsCards],
    ["showVolumeAnalytics", VolumeAnalytics],
    ["showRecentWorkouts", RecentWorkouts],
    ["showQuickActions", QuickActions],
  ] as const)(
    "hides the widget when %s is false",
    async (flag, w) => {
      await render({ [flag]: false });

      expect(w.render).not.toHaveBeenCalled();
    },
  );

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

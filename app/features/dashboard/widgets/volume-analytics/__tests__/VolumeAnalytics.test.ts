/** @jest-environment jsdom */

import { VolumeAnalytics } from "@app/features/dashboard/widgets/volume-analytics/VolumeAnalytics";
import { ChartRenderer } from "@app/features/charts/components/ChartRenderer";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

jest.mock("@app/features/charts/components/ChartRenderer", () => ({
  ChartRenderer: { renderChart: jest.fn() },
}));

describe("VolumeAnalytics", () => {
  beforeEach(() => jest.clearAllMocks());

  const lastCall = () =>
    (ChartRenderer.renderChart as jest.Mock).mock.calls[0];

  it("plots the last 30 days by default", () => {
    VolumeAnalytics.render(createObsidianContainer(), [], {});

    expect(lastCall()[1]).toHaveLength(30);
    expect(lastCall()[3].title).toBe(
      t("dashboard.volumeAnalytics.chartTitleDays", { days: 30 }),
    );
  });

  it("respects volumeTrendDays", () => {
    VolumeAnalytics.render(createObsidianContainer(), [], {
      volumeTrendDays: 14,
    });

    expect(lastCall()[1]).toHaveLength(14);
  });

  it("uses the given chart id for the chart container", () => {
    VolumeAnalytics.render(
      createObsidianContainer(),
      [],
      {},
      {
        chartId: "volume-analytics-abc",
      },
    );

    expect(lastCall()[0].id).toBe("volume-analytics-abc");
  });
});

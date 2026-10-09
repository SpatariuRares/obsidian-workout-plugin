/** @jest-environment jsdom */

import { ProtocolDistribution } from "@app/features/dashboard/widgets/protocol-distribution/ProtocolDistribution";
import { ChartRenderer } from "@app/features/charts/components/ChartRenderer";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import {
  WorkoutLogData,
  WorkoutProtocol,
} from "@app/types/WorkoutLogData";

jest.mock("@app/features/charts/components/ChartRenderer", () => ({
  ChartRenderer: { renderConfiguredChart: jest.fn() },
}));

const today = new Date().toISOString();
const logs: WorkoutLogData[] = [
  {
    date: today,
    exercise: "Squat",
    reps: 5,
    weight: 100,
    volume: 500,
  },
  {
    date: today,
    exercise: "Squat",
    reps: 8,
    weight: 80,
    volume: 640,
    protocol: WorkoutProtocol.DROP_SET,
  },
];

const clickFirstLegendItem = (container: HTMLElement) =>
  (
    container.querySelector(
      ".workout-protocol-legend-item",
    ) as HTMLElement
  ).click();

describe("ProtocolDistribution", () => {
  beforeEach(() => {
    (ChartRenderer.renderConfiguredChart as jest.Mock).mockClear();
  });

  it("renders the pie chart through ChartRenderer with the dashboard's chart id", () => {
    ProtocolDistribution.render(
      createObsidianContainer(),
      logs,
      {},
      undefined,
      { chartId: "protocol-distribution-a" },
    );

    expect(ChartRenderer.renderConfiguredChart).toHaveBeenCalledWith(
      "protocol-distribution-a",
      expect.any(HTMLCanvasElement),
      expect.objectContaining({ type: "pie" }),
    );
  });

  it("keeps filter callbacks of two dashboards independent", () => {
    const onFilterA = jest.fn();
    const onFilterB = jest.fn();
    const containerA = createObsidianContainer();
    const containerB = createObsidianContainer();

    ProtocolDistribution.render(containerA, logs, {}, undefined, {
      chartId: "protocol-distribution-a",
      onFilterChange: onFilterA,
    });
    ProtocolDistribution.render(containerB, logs, {}, undefined, {
      chartId: "protocol-distribution-b",
      onFilterChange: onFilterB,
    });

    clickFirstLegendItem(containerA);

    expect(onFilterA).toHaveBeenCalledTimes(1);
    expect(onFilterB).not.toHaveBeenCalled();
  });

  it("clears the filter when the active protocol is clicked again", () => {
    const onFilter = jest.fn();
    const container = createObsidianContainer();

    ProtocolDistribution.render(
      container,
      logs,
      { activeProtocolFilter: WorkoutProtocol.STANDARD },
      undefined,
      {
        chartId: "protocol-distribution-a",
        onFilterChange: onFilter,
      },
    );
    const items = [
      ...container.querySelectorAll(".workout-protocol-legend-item"),
    ] as HTMLElement[];
    const standardItem = items.find((el) =>
      el.textContent?.includes("Standard"),
    );
    standardItem?.click();

    expect(onFilter).toHaveBeenCalledWith(null);
  });
});

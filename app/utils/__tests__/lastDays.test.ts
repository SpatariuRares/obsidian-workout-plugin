/** @jest-environment jsdom */
// Time zone: Europe/Rome, pinned in jest.config.js

import { DateUtils } from "@app/utils/DateUtils";
import { DataFilter } from "@app/services/data/DataFilter";
import { calculatePeriodStats } from "@app/features/dashboard/widgets/quick-stats/business/calculatePeriodStats";
import { MuscleDataCalculator } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleDataCalculator";
import { ProtocolDistribution } from "@app/features/dashboard/widgets/protocol-distribution/ProtocolDistribution";
import { PERIOD_DAYS } from "@app/features/dashboard/types";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";
import { logRow } from "@app/types/__tests__/logRow";

jest.mock("@app/features/charts/components/ChartRenderer", () => ({
  ChartRenderer: { renderConfiguredChart: jest.fn() },
}));

const set = (date: string, workout = "Leg day") =>
  logRow({ date, exercise: "Squat", reps: 10, weight: 100, workout });

// Now: 15 Feb 2024, noon. "The last 7 days" starts on 8 Feb, the whole day.
const NOW = "2024-02-15T12:00:00";
const boundaryMorning = set("2024-02-08T08:00:00");
const boundaryDateOnly = set("2024-02-08");
const dayBefore = set("2024-02-07T23:30:00");

describe("the last N days", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(NOW));
  });
  afterEach(() => jest.useRealTimers());

  describe("DateUtils.lastDays", () => {
    it("keeps the whole boundary day and drops the day before", () => {
      expect(
        DateUtils.lastDays([boundaryMorning, boundaryDateOnly, dayBefore], 7),
      ).toEqual([boundaryMorning, boundaryDateOnly]);
    });

    it("keeps only today with 0 days", () => {
      const today = set("2024-02-15T06:00:00");
      expect(DateUtils.lastDays([today, set("2024-02-14T22:00:00")], 0)).toEqual([
        today,
      ]);
    });

    it("drops rows whose date cannot be read", () => {
      expect(DateUtils.lastDays([set("not a date"), set("")], 7)).toEqual([]);
    });
  });

  it("the table (dateRange) keeps a set logged on the boundary morning", () => {
    const { filteredData } = DataFilter.filterData(
      [boundaryMorning, dayBefore],
      { dateRange: 7 },
    );
    expect(filteredData).toEqual([boundaryMorning]);
  });

  it("quick stats count a set logged on the boundary morning in the week", () => {
    expect(
      calculatePeriodStats([boundaryMorning, dayBefore], PERIOD_DAYS.week),
    ).toEqual({ workouts: 1, volume: 1000, avgVolume: 1000 });
  });

  it("the heat map counts a set logged on the boundary morning in the week", () => {
    expect(
      MuscleDataCalculator.filterDataByTimeFrame(
        [boundaryMorning, dayBefore],
        "week",
      ),
    ).toEqual([boundaryMorning]);
  });

  it("the protocol distribution counts a set logged on the boundary morning", () => {
    const container = createObsidianContainer();
    ProtocolDistribution.render(container, [boundaryMorning], undefined, {
      chartId: "protocol-distribution-boundary",
      days: 7,
    });
    expect(container.textContent).not.toContain(
      t("dashboard.protocolDistribution.noData", { days: 7 }),
    );
  });

  it("a period is 7, 30 or 365 days", () => {
    expect(PERIOD_DAYS).toEqual({ week: 7, month: 30, year: 365 });
  });
});

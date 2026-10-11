import { chartBlock } from "@app/features/charts/chartBlock";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { durationBlock } from "@app/features/duration/durationBlock";
import type { CodeBlockSchema } from "@app/services/codeblocks/CodeBlockSchema";

function errorKeys<P>(schema: CodeBlockSchema<P>, source: string): number {
  return schema.parse(source).errors.length;
}

describe("block schemas", () => {
  it("names each schema after its code block", () => {
    expect(
      [chartBlock, tableBlock, timerBlock, dashboardBlock, durationBlock].map(
        (block) => block.type,
      ),
    ).toEqual([
      "workout-chart",
      "workout-log",
      "workout-timer",
      "workout-dashboard",
      "workout-duration",
    ]);
  });

  describe("blocks written before the schemas", () => {
    it("accepts true/false and yes/no in any case", () => {
      expect(
        tableBlock.parse("showProtocol: True\nexactMatch: FALSE").params,
      ).toEqual({ showProtocol: true, exactMatch: false });
      expect(
        chartBlock.parse("showTrendLine: yes\nshowStats: No").params,
      ).toEqual({ showTrendLine: true, showStats: false });
    });

    it("accepts a choice in any case and stores its canonical spelling", () => {
      expect(timerBlock.parse("type: Countdown").params.type).toBe("countdown");
      expect(tableBlock.parse("sortOrder: DESC").params.sortOrder).toBe("desc");
      expect(chartBlock.parse("type: heartrate").params.type).toBe("heartRate");
    });

    it("keeps dateRange 0 in a dashboard meaning all history", () => {
      expect(dashboardBlock.parse("dateRange: 0")).toEqual({
        params: { dateRange: 0 },
        errors: [],
      });
    });
  });

  describe("workout-chart", () => {
    it.each([
      ["dateRange: 400"],
      ["dateRange: 0"],
      ["limit: 2000"],
      ["chartType: weekly"],
      ["type: calories"],
    ])("rejects %s", (line) => {
      expect(errorKeys(chartBlock, line)).toBe(1);
    });

    it("accepts every chart and data type it documents", () => {
      expect(
        errorKeys(
          chartBlock,
          "chartType: all\ntype: heartRate\nheight: 50vh\ndateRange: 365",
        ),
      ).toBe(0);
      expect(chartBlock.parse("height: 300").params.height).toBe(300);
    });

    it("leaves the data type to the exercise when unset", () => {
      expect(chartBlock.defaults).toEqual({
        chartType: "exercise",
        dateRange: 30,
        showTrendLine: false,
        showTrend: true,
        showStats: true,
      });
    });
  });

  describe("workout-log", () => {
    it("allows dateRange 0 (no limit) but not a sort field it can't sort by", () => {
      expect(errorKeys(tableBlock, "dateRange: 0")).toBe(0);
      expect(errorKeys(tableBlock, "sortBy: notes")).toBe(1);
    });
  });

  describe("workout-timer", () => {
    it.each([["duration: 0"], ["rounds: 0"], ["type: tabata"]])(
      "rejects %s",
      (line) => {
        expect(errorKeys(timerBlock, line)).toBe(1);
      },
    );
  });

  describe("workout-dashboard", () => {
    it("shows every widget unless the block turns it off", () => {
      expect(dashboardBlock.defaults).toMatchObject({
        showSummary: true,
        showQuickStats: true,
        showVolumeAnalytics: true,
        showRecentWorkouts: true,
        showQuickActions: true,
        recentWorkoutsLimit: 5,
        volumeTrendDays: 30,
      });
    });
  });
});

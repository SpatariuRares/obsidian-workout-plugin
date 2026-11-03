import { chartBlock } from "@app/features/charts/chartBlock";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { durationBlock } from "@app/features/duration/durationBlock";
import { DASHBOARD_WIDGET_IDS } from "@app/features/dashboard/types";
import { t } from "@app/i18n";
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
        invalidKeys: [],
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
    it("defaults the widget settings and leaves the widget list unset", () => {
      expect(dashboardBlock.defaults).toEqual({
        recentWorkoutsLimit: 5,
        volumeTrendDays: 30,
        volumeTopLimit: 5,
        calendarWeeks: 53,
        protocolDays: 30,
        protocolMinEntries: 5,
        durationRecentCount: 5,
        durationRestSeconds: 90,
        volumeShowBreakdown: true,
        calendarShowStats: true,
        heatMapShowImbalance: true,
        durationShowTrend: true,
        fileErrorsMaxTags: 3,
        fileErrorsCheckSharedNames: true,
        muscleTagsGroupByMuscle: false,
      });
    });

    it("reads the widgets to show in any case, in the order written", () => {
      expect(
        dashboardBlock.parse("widgets: [Volume, heatmap, summary]"),
      ).toEqual({
        params: { widgets: ["volume", "heatMap", "summary"] },
        errors: [],
        invalidKeys: [],
      });
    });

    it("reads a grid layout: its columns and one cell rectangle per widget", () => {
      expect(
        dashboardBlock.parse(
          ["layout: grid", "columns: 3", "grid.heatMap: 1 2 2 3"].join("\n"),
        ),
      ).toEqual({
        params: {
          layout: "grid",
          columns: 3,
          "grid.heatMap": { column: 1, row: 2, width: 2, height: 3 },
        },
        errors: [],
        invalidKeys: [],
      });
    });

    it("rejects a cell that isn't four positive whole numbers", () => {
      for (const value of ["1 2 3", "1 2 x 1", "0 1 1 1", "1 1 1.5 1"]) {
        expect(dashboardBlock.parse(`grid.summary: ${value}`).errors).toEqual([
          t("codeBlocks.validation.notACell", { key: "grid.summary", value }),
        ]);
      }
    });

    it("writes a cell as column, row, width and height", () => {
      expect(
        dashboardBlock.serialize({
          layout: "grid",
          "grid.summary": { column: 1, row: 1, width: 3, height: 1 },
        }),
      ).toBe(
        ["```workout-dashboard", "layout: grid", "grid.summary: 1 1 3 1", "```"].join(
          "\n",
        ),
      );
    });

    it("rejects a widget it doesn't know, naming the ones it does", () => {
      const { params, errors } = dashboardBlock.parse(
        "widgets: [summary, calendar]",
      );
      expect(params).toEqual({});
      expect(errors).toEqual([
        t("codeBlocks.validation.notOneOf", {
          key: "widgets",
          value: "calendar",
          allowed: DASHBOARD_WIDGET_IDS.join(", "),
        }),
      ]);
    });
  });
});

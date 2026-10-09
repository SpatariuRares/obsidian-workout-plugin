import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import {
  CHART_DATA_TYPE,
  CHART_TYPE,
  type EmbeddedChartParams,
} from "@app/features/charts/types";
import {
  TIMER_TYPE,
  type EmbeddedTimerParams,
} from "@app/features/timer/types";
import {
  TABLE_TYPE,
  type TableCodeOptions,
} from "@app/features/tables/types";

const lines = (s: string) => s.split("\n");

describe("CodeGenerator", () => {
  describe("generateChartCode", () => {
    const base: EmbeddedChartParams = {
      chartType: CHART_TYPE.EXERCISE,
      type: CHART_DATA_TYPE.VOLUME,
      exercise: "Squat",
      workout: "Leg Day",
      dateRange: 30,
      limit: 50,
      showTrendLine: true,
      showTrend: false,
      showStats: true,
    };

    it("should wrap output in a workout-chart fence", () => {
      const out = lines(CodeGenerator.generateChartCode(base));
      expect(out[0]).toBe("```workout-chart");
      expect(out[out.length - 1]).toBe("```");
    });

    it("should emit the full exercise chart block in order", () => {
      expect(CodeGenerator.generateChartCode(base)).toBe(
        [
          "```workout-chart",
          "chartType: exercise",
          `type: ${CHART_DATA_TYPE.VOLUME}`,
          "exercise: Squat",
          "dateRange: 30",
          "limit: 50",
          "showTrendLine: true",
          "showTrend: false",
          "showStats: true",
          "```",
        ].join("\n"),
      );
    });

    it("should only include the workout for a workout chart", () => {
      const out = CodeGenerator.generateChartCode({
        ...base,
        chartType: CHART_TYPE.WORKOUT,
      });
      expect(out).toContain("workout: Leg Day");
      expect(out).not.toContain("exercise:");
    });

    it("should include both exercise and workout for a combined chart", () => {
      const out = CodeGenerator.generateChartCode({
        ...base,
        chartType: CHART_TYPE.COMBINED,
      });
      expect(out).toContain("exercise: Squat");
      expect(out).toContain("workout: Leg Day");
    });

    it("should omit missing targets for a combined chart", () => {
      const out = CodeGenerator.generateChartCode({
        ...base,
        chartType: CHART_TYPE.COMBINED,
        exercise: undefined,
        workout: undefined,
      });
      expect(out).not.toContain("exercise:");
      expect(out).not.toContain("workout:");
    });

    it("should omit the target when an exercise chart has no exercise", () => {
      const out = CodeGenerator.generateChartCode({
        ...base,
        exercise: "",
      });
      expect(out).not.toContain("exercise:");
    });

    it("should omit the target when a workout chart has no workout", () => {
      const out = CodeGenerator.generateChartCode({
        ...base,
        chartType: CHART_TYPE.WORKOUT,
        workout: "",
      });
      expect(out).not.toContain("workout:");
    });

    it("should not emit a target for an all chart", () => {
      const out = CodeGenerator.generateChartCode({
        ...base,
        chartType: CHART_TYPE.ALL,
      });
      expect(out).toContain("chartType: all");
      expect(out).not.toContain("exercise:");
      expect(out).not.toContain("workout:");
    });

    it("should add exactMatch and title only when set", () => {
      const without = CodeGenerator.generateChartCode(base);
      expect(without).not.toContain("exactMatch");
      expect(without).not.toContain("title:");

      const withBoth = CodeGenerator.generateChartCode({
        ...base,
        exactMatch: true,
        title: "My chart",
      });
      const out = lines(withBoth);
      expect(out).toContain("exactMatch: true");
      expect(out).toContain("title: My chart");
      expect(out[out.length - 1]).toBe("```");
    });
  });

  describe("generateTableCode", () => {
    const base: TableCodeOptions = {
      id: "abc123",
      tableType: TABLE_TYPE.EXERCISE,
      exercise: "Bench Press",
      workout: "Push",
      limit: 20,
      showAddButton: true,
      exactMatch: false,
    };

    it("should emit a minimal exercise table block", () => {
      expect(CodeGenerator.generateTableCode(base)).toBe(
        [
          "```workout-log",
          "id: abc123",
          "exercise: Bench Press",
          "limit: 20",
          "```",
        ].join("\n"),
      );
    });

    it("should emit only the workout for a workout table", () => {
      const out = CodeGenerator.generateTableCode({
        ...base,
        tableType: TABLE_TYPE.WORKOUT,
      });
      expect(out).toContain("workout: Push");
      expect(out).not.toContain("exercise:");
    });

    it("should emit both for a combined table", () => {
      const out = CodeGenerator.generateTableCode({
        ...base,
        tableType: TABLE_TYPE.COMBINED,
      });
      expect(out).toContain("exercise: Bench Press");
      expect(out).toContain("workout: Push");
    });

    it("should emit no target for an all table", () => {
      const out = CodeGenerator.generateTableCode({
        ...base,
        tableType: TABLE_TYPE.ALL,
      });
      expect(out).not.toContain("exercise:");
      expect(out).not.toContain("workout:");
      expect(out).toContain("id: abc123");
    });

    it("should omit empty targets for exercise and workout tables", () => {
      expect(
        CodeGenerator.generateTableCode({ ...base, exercise: "" }),
      ).not.toContain("exercise:");
      expect(
        CodeGenerator.generateTableCode({
          ...base,
          tableType: TABLE_TYPE.WORKOUT,
          workout: "",
        }),
      ).not.toContain("workout:");
    });

    it("should include dateRange only when set", () => {
      expect(CodeGenerator.generateTableCode(base)).not.toContain(
        "dateRange",
      );
      expect(
        CodeGenerator.generateTableCode({ ...base, dateRange: 14 }),
      ).toContain("dateRange: 14");
    });

    it("should write showAddButton false only when disabled", () => {
      expect(CodeGenerator.generateTableCode(base)).not.toContain(
        "showAddButton",
      );
      expect(
        CodeGenerator.generateTableCode({
          ...base,
          showAddButton: false,
        }),
      ).toContain("showAddButton: false");
    });

    it("should write exactMatch true only when enabled", () => {
      expect(
        CodeGenerator.generateTableCode({ ...base, exactMatch: true }),
      ).toContain("exactMatch: true");
    });

    it("should include progressive overload targets when set", () => {
      const out = CodeGenerator.generateTableCode({
        ...base,
        targetWeight: 100,
        targetReps: 8,
      });
      expect(out).toContain("targetWeight: 100");
      expect(out).toContain("targetReps: 8");
    });

    it("should skip zero or undefined overload targets", () => {
      const out = CodeGenerator.generateTableCode({
        ...base,
        targetWeight: 0,
        targetReps: undefined,
      });
      expect(out).not.toContain("targetWeight");
      expect(out).not.toContain("targetReps");
    });
  });

  describe("generateTimerCode", () => {
    it("should emit a countdown timer block", () => {
      expect(
        CodeGenerator.generateTimerCode({
          type: TIMER_TYPE.COUNTDOWN,
          duration: 90,
          showControls: true,
          sound: false,
        }),
      ).toBe(
        [
          "```workout-timer",
          "duration: 90",
          "type: countdown",
          "showControls: true",
          "sound: false",
          "```",
        ].join("\n"),
      );
    });

    it("should include id and exercise when provided", () => {
      const out = lines(
        CodeGenerator.generateTimerCode({
          id: "t1",
          type: TIMER_TYPE.STOPWATCH,
          exercise: "Plank",
          showControls: false,
          sound: true,
        }),
      );
      expect(out[1]).toBe("id: t1");
      expect(out).toContain("exercise: Plank");
      expect(out).toContain("type: stopwatch");
    });

    it("should emit rounds only for interval timers", () => {
      const interval = CodeGenerator.generateTimerCode({
        type: TIMER_TYPE.INTERVAL,
        duration: 30,
        rounds: 8,
        showControls: true,
        sound: true,
      });
      expect(interval).toContain("rounds: 8");

      const countdown = CodeGenerator.generateTimerCode({
        type: TIMER_TYPE.COUNTDOWN,
        duration: 30,
        rounds: 8,
        showControls: true,
        sound: true,
      });
      expect(countdown).not.toContain("rounds");
    });

    it("should skip duration when it is zero or missing", () => {
      const out = CodeGenerator.generateTimerCode({
        type: TIMER_TYPE.STOPWATCH,
        duration: 0,
        showControls: true,
        sound: true,
      });
      expect(out).not.toContain("duration");
    });

    it("should emit only the preset when no type is given", () => {
      expect(
        CodeGenerator.generateTimerCode({
          id: "t2",
          preset: "rest",
        }),
      ).toBe(
        ["```workout-timer", "id: t2", "preset: rest", "```"].join(
          "\n",
        ),
      );
    });

    it("should emit the preset before overrides when a type is also given", () => {
      const out = lines(
        CodeGenerator.generateTimerCode({
          preset: "rest",
          type: TIMER_TYPE.COUNTDOWN,
          duration: 45,
          showControls: true,
          sound: true,
        }),
      );
      expect(out.indexOf("preset: rest")).toBeGreaterThan(-1);
      expect(out.indexOf("preset: rest")).toBeLessThan(
        out.indexOf("duration: 45"),
      );
    });

    it("should throw when neither type nor preset is provided", () => {
      expect(() =>
        CodeGenerator.generateTimerCode({} as EmbeddedTimerParams),
      ).toThrow("Timer type is required");
    });
  });

  describe("generateDashboardCode", () => {
    it("should emit an empty workout-dashboard block", () => {
      expect(CodeGenerator.generateDashboardCode()).toBe(
        "```workout-dashboard\n```",
      );
    });
  });

  describe("generateDurationCode", () => {
    it("should emit an empty workout-duration block", () => {
      expect(CodeGenerator.generateDurationCode()).toBe(
        "```workout-duration\n```",
      );
    });
  });
});

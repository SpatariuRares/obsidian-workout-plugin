import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";
import { CHART_DATA_TYPE, CHART_TYPE } from "@app/types/WorkoutConfigTypes";

/** The `workout-chart` code block: its parameters, types and defaults */
export const chartBlock = defineCodeBlock("workout-chart", {
  /** exercise = daily average; workout/combined/all = daily total (all ignores filters) */
  chartType: {
    kind: "enum",
    values: [
      CHART_TYPE.EXERCISE,
      CHART_TYPE.WORKOUT,
      CHART_TYPE.COMBINED,
      CHART_TYPE.ALL,
    ],
    default: CHART_TYPE.EXERCISE,
  },
  /** Unset: chosen from the exercise type (volume for strength) */
  type: { kind: "enum", values: Object.values(CHART_DATA_TYPE) },
  exercise: { kind: "string" },
  workout: { kind: "string" },
  dateRange: { kind: "number", min: 1, max: 365, default: 30 },
  /** Latest points to show; unset shows all */
  limit: { kind: "number", min: 1, max: 1000 },
  showTrendLine: { kind: "boolean", default: false },
  showTrend: { kind: "boolean", default: true },
  showStats: { kind: "boolean", default: true },
  exactMatch: { kind: "boolean" },
  title: { kind: "string" },
  /** Pixels or a CSS length such as 50vh; unset keeps a 4:3 ratio */
  height: { kind: "size" },
});

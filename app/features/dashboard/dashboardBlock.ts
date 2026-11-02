import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";
import { DASHBOARD_WIDGET_IDS } from "@app/features/dashboard/types";

/** The `workout-dashboard` code block: its parameters, types and defaults */
export const dashboardBlock = defineCodeBlock("workout-dashboard", {
  /** Written by the insert modal so the block can be edited in place */
  id: { kind: "string" },
  title: { kind: "string" },
  /** Days to include in analytics; 0 = all history */
  dateRange: { kind: "number", min: 0 },
  /** Which widgets to show, in this order; unset: all of them */
  widgets: { kind: "list", values: DASHBOARD_WIDGET_IDS },
  recentWorkoutsLimit: { kind: "number", min: 1, default: 5 },
  volumeTrendDays: { kind: "number", min: 1, default: 30 },
});

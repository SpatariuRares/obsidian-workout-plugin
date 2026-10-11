import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";

/** The `workout-dashboard` code block: its parameters, types and defaults */
export const dashboardBlock = defineCodeBlock("workout-dashboard", {
  title: { kind: "string" },
  /** Days to include in analytics */
  dateRange: { kind: "number", min: 1 },
  showSummary: { kind: "boolean", default: true },
  showQuickStats: { kind: "boolean", default: true },
  showVolumeAnalytics: { kind: "boolean", default: true },
  showRecentWorkouts: { kind: "boolean", default: true },
  showQuickActions: { kind: "boolean", default: true },
  recentWorkoutsLimit: { kind: "number", min: 1, default: 5 },
  volumeTrendDays: { kind: "number", min: 1, default: 30 },
});

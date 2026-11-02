import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";
import {
  DASHBOARD_WIDGET_IDS,
  DashboardWidgetId,
} from "@app/features/dashboard/types";

/** `grid.<widget>: column row width height`, one line per widget (layout: grid) */
const gridFields = Object.fromEntries(
  // eslint-disable-next-line i18next/no-literal-string -- block parameter names
  DASHBOARD_WIDGET_IDS.map((id) => [`grid.${id}`, { kind: "cell" }]),
) as { [Id in DashboardWidgetId as `grid.${Id}`]: { kind: "cell" } };

/** The `workout-dashboard` code block: its parameters, types and defaults */
export const dashboardBlock = defineCodeBlock("workout-dashboard", {
  /** Written by the insert modal so the block can be edited in place */
  id: { kind: "string" },
  title: { kind: "string" },
  /** Days to include in analytics; 0 = all history */
  dateRange: { kind: "number", min: 0 },
  /** Which widgets to show, in this order; unset: all of them */
  widgets: { kind: "list", values: DASHBOARD_WIDGET_IDS },
  /** list: widgets in `widgets` order; grid: each widget in its cells */
  layout: { kind: "enum", values: ["list", "grid"] },
  /** grid: the columns the grid was made for (it follows the note's width) */
  columns: { kind: "number", min: 1 },
  ...gridFields,
  recentWorkoutsLimit: { kind: "number", min: 1, default: 5 },
  volumeTrendDays: { kind: "number", min: 1, default: 30 },
});

import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import type { DashboardWidgetId } from "@app/features/dashboard/types";
import { autoPack } from "@app/features/dashboard/layout/gridLayout";
import { gridParams } from "@app/features/dashboard/layout/dashboardGrid";
import { generateCodeBlockId } from "@app/utils/IdUtils";

/** Every widget, or only `widgets` in that order */
export function generateDashboardBlock(opts?: {
  title?: string;
  widgets?: DashboardWidgetId[];
  dateRange?: number;
}): string {
  return dashboardBlock.serialize({ id: generateCodeBlockId(), ...opts });
}

/** A grid dashboard: each widget packed, in order, in the first cells that fit */
export function generateGridDashboardBlock(
  columns: number,
  widgets: { id: DashboardWidgetId; width: number; height: number }[],
  opts?: { title?: string },
): string {
  return dashboardBlock.serialize({
    id: generateCodeBlockId(),
    title: opts?.title,
    layout: "grid",
    columns,
    ...gridParams(autoPack(widgets, columns)),
  });
}

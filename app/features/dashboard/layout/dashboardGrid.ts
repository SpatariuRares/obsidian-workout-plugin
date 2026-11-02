import {
  DASHBOARD_WIDGET_IDS,
  DashboardWidgetId,
  EmbeddedDashboardParams,
} from "@app/features/dashboard/types";
import { DASHBOARD_WIDGETS } from "@app/features/dashboard/widgets/dashboardWidgets";
import {
  columnsFor,
  GridCell,
  gridProblems,
  GridProblem,
  Placement,
  readingOrder,
} from "@app/features/dashboard/layout/gridLayout";
import { t } from "@app/i18n";

/*
 * A dashboard block's grid layout: its `grid.<widget>` lines as placements
 * and back, and its problems as messages. The rules are in gridLayout.ts.
 */

/**
 * The columns that fit in `width`, with the cell width and gap the
 * dashboard's CSS sets on `styled` (or its defaults)
 */
export function columnsForWidth(
  width: number,
  styled: Element,
): number {
  const style = getComputedStyle(styled);
  const cellMinWidth =
    parseFloat(
      style.getPropertyValue("--workout-widget-min-width"),
    ) || 280;
  const gap =
    parseFloat(style.getPropertyValue("--workout-grid-gap")) || 16;
  return columnsFor(width, cellMinWidth, gap);
}

export const gridKey = (id: DashboardWidgetId) =>
  // eslint-disable-next-line i18next/no-literal-string -- a block parameter name
  `grid.${id}` as const;

export function minColumnsOf(id: string): number {
  return DASHBOARD_WIDGETS[id as DashboardWidgetId]?.minColumns ?? 1;
}

/** The placed widgets, in reading order */
export function gridPlacements(
  params: EmbeddedDashboardParams,
): Placement[] {
  return readingOrder(
    DASHBOARD_WIDGET_IDS.flatMap((id) => {
      const cell = params[gridKey(id)];
      return cell ? [{ id, ...cell }] : [];
    }),
  );
}

/** The columns the grid was made for: its `columns`, or what its widgets span */
export function gridColumns(
  params: EmbeddedDashboardParams,
  placements: Placement[],
): number {
  return (
    params.columns ??
    Math.max(1, ...placements.map((p) => p.column + p.width - 1))
  );
}

/** One `grid.<widget>` value per widget: its cell, or undefined when unplaced */
export function gridParams(
  placements: Placement[],
): Partial<EmbeddedDashboardParams> {
  const params: Partial<EmbeddedDashboardParams> = {};
  for (const id of DASHBOARD_WIDGET_IDS) {
    const placement = placements.find((p) => p.id === id);
    params[gridKey(id)] = placement && {
      column: placement.column,
      row: placement.row,
      width: placement.width,
      height: placement.height,
    };
  }
  return params;
}

/** A widget's name for the user */
export const widgetLabel = (id: string) =>
  DASHBOARD_WIDGETS[id as DashboardWidgetId]?.label() ?? id;

/** The CSS variables that put an element in its cells (view and editor) */
export function cellProps(cell: GridCell): Record<string, string> {
  return {
    "--workout-cell-column": `${cell.column} / span ${cell.width}`,
    "--workout-cell-row": `${cell.row} / span ${cell.height}`,
  };
}

function describe(problem: GridProblem, columns: number): string {
  switch (problem.kind) {
    case "outside":
      return t("dashboard.grid.outside", {
        widget: widgetLabel(problem.id),
        columns: String(columns),
      });
    case "narrow":
      return t("dashboard.grid.narrow", {
        widget: widgetLabel(problem.id),
        min: String(problem.min),
      });
    case "overlap":
      return t("dashboard.grid.overlap", {
        widget: widgetLabel(problem.id),
        other: widgetLabel(problem.other),
      });
  }
}

/** What is wrong with the grid, as messages for the user */
export function gridProblemMessages(
  placements: Placement[],
  columns: number,
): string[] {
  return gridProblems(placements, columns, minColumnsOf).map(
    (problem) => describe(problem, columns),
  );
}

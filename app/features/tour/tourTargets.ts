/**
 * Every `data-tour` value the guided tour can point at. Components set the
 * attribute from here and tour content (`TourStep.target`) reads it from here,
 * so the two cannot drift apart.
 */
export const TOUR_TARGETS = {
  /** "Add log" button of a `workout-log` block. */
  tableAddButton: "table-add-button",
  /** Edit / delete buttons of a table row (one per row; the first visible one is used). */
  tableRowActions: "table-row-actions",
  /** The chart area of a `workout-chart` block. */
  chart: "chart",
  /** A `workout-dashboard` block as a whole. */
  dashboard: "dashboard",
  /** The muscle heat map widget of a dashboard. */
  dashboardMuscleHeatMap: "dashboard-muscle-heat-map",
  /** Start / stop button of a `workout-timer` block. */
  timerStart: "timer-start",
  /** The quick-log ribbon icon. */
  ribbonIcon: "ribbon-icon",
} as const;

export type TourTarget = (typeof TOUR_TARGETS)[keyof typeof TOUR_TARGETS];

/** Marks `el` as the tour target `target`. */
export function markTourTarget(el: HTMLElement, target: TourTarget): void {
  el.setAttribute("data-tour", target);
}
